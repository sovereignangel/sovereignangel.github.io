import { NextRequest, NextResponse } from 'next/server'
import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    // Validate URL
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only HTTP(S) URLs supported' }, { status: 400 })
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReadApp/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: 502 })
    }

    const html = await response.text()

    // Parse with linkedom + Readability
    const { document } = parseHTML(html)
    const reader = new Readability(document as unknown as Document)
    const article = reader.parse()

    if (!article) {
      return NextResponse.json({ error: 'Could not extract article content' }, { status: 422 })
    }

    return NextResponse.json({
      title: article.title || parsed.hostname,
      author: article.byline || parsed.hostname,
      content: article.content,
      textContent: article.textContent,
      excerpt: article.excerpt,
      siteName: article.siteName || parsed.hostname,
      length: article.length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Extraction failed' },
      { status: 500 }
    )
  }
}
