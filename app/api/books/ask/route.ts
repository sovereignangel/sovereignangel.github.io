import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { verifyAuth } from '@/lib/api-auth'
import { getBookMeta, getPages, search } from '@/lib/books/library'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_PASSAGES = 8
const MAX_CHARS_PER_PASSAGE = 2400

/**
 * POST /api/books/ask — answer a question against the whole book, not just the
 * page on screen. Retrieves the best-matching pages, plus the page the reader is
 * actually on, and asks for an answer with page citations.
 *
 * Body: { question, slug?, page? }
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { question, slug, page } = await req.json()
    if (!question?.trim()) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 })
    }

    const meta = slug ? getBookMeta(slug) : null
    if (slug && !meta) {
      return NextResponse.json({ error: 'Book not found on this host' }, { status: 404 })
    }

    // Retrieve: best-scoring pages for the question, one passage per page.
    const results = search(question, { slug, limit: MAX_PASSAGES * 3 })
    const chosen: { slug: string; title: string; page: number }[] = []
    for (const hit of results.hits) {
      if (chosen.length >= MAX_PASSAGES) break
      // Skip near-duplicates: adjacent pages of the same book add little.
      if (chosen.some(c => c.slug === hit.slug && Math.abs(c.page - hit.page) < 2)) continue
      chosen.push({ slug: hit.slug, title: hit.title, page: hit.page })
    }

    // Always include where the reader currently is, so "this" and "here" resolve.
    if (meta && page) {
      const n = Number(page)
      if (n > 0 && !chosen.some(c => c.slug === meta.slug && c.page === n)) {
        chosen.unshift({ slug: meta.slug, title: meta.title, page: n })
      }
    }

    if (!chosen.length) {
      return NextResponse.json({
        answer: 'Nothing in the local corpus matches that question. Try different wording, or search the shelf directly.',
        citations: [],
      })
    }

    const passages = chosen
      .map(c => {
        const text = getPages(c.slug, c.page, c.page)[0]?.text || ''
        return `[${c.title} — p.${c.page}]\n${text.slice(0, MAX_CHARS_PER_PASSAGE)}`
      })
      .filter(p => p.split('\n').slice(1).join('').trim().length > 40)

    const scope = meta ? `"${meta.title}" by ${meta.author}` : 'the reader’s local book shelf'

    const prompt = `You are a research assistant working through ${scope}. Answer strictly from the passages below.

Passages (each is headed by its book and PDF page number):
---
${passages.join('\n\n---\n\n')}
---

Question: ${question}

Rules:
- Answer only from the passages. If they do not settle the question, say exactly what is missing.
- Cite pages inline as (p.123) — use the PDF page numbers shown in the headings.
- When passages disagree or the author qualifies a claim, say so rather than smoothing it over.
- Be direct and concrete. Under 350 words. No preamble.`

    const answer = await callLLM(prompt, { temperature: 0.2, maxTokens: 2000 })

    return NextResponse.json({
      answer,
      citations: chosen.map(c => ({ slug: c.slug, title: c.title, page: c.page })),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to answer' },
      { status: 500 }
    )
  }
}
