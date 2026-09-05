// Server-only: reads the filesystem. Import from route handlers, never from a client component.
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { BookManifest, BookMeta, BookRecord, BookSearchHit, BookSearchResponse } from './types'

/**
 * Server-side access to the extracted book corpus.
 *
 * data/books/ is gitignored — the PDFs are copyrighted and the extracted text
 * is the same work. So this layer is local-first: on a deployment without the
 * corpus every call degrades to "no books" rather than throwing.
 *
 * Regenerate with: node scripts/books/extract.mjs
 */

const DATA_DIR = path.join(process.cwd(), 'data', 'books')
const PDF_DIR = path.join(process.cwd(), 'app', 'books')

const bookCache = new Map<string, BookRecord>()
let manifestCache: BookManifest | null = null

export function getManifest(): BookManifest {
  if (manifestCache) return manifestCache
  const file = path.join(DATA_DIR, 'manifest.json')
  if (!existsSync(file)) return { generatedAt: '', books: [] }
  manifestCache = JSON.parse(readFileSync(file, 'utf8')) as BookManifest
  return manifestCache
}

export function getBookMeta(slug: string): BookMeta | null {
  return getManifest().books.find(b => b.slug === slug) || null
}

export function getBook(slug: string): BookRecord | null {
  const cached = bookCache.get(slug)
  if (cached) return cached
  // Guard against path traversal via the [slug] route segment.
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  const file = path.join(DATA_DIR, `${slug}.json`)
  if (!existsSync(file)) return null
  const record = JSON.parse(readFileSync(file, 'utf8')) as BookRecord
  bookCache.set(slug, record)
  return record
}

/** Absolute path to the source PDF, or null if it is not on this machine. */
export function getBookPdfPath(slug: string): string | null {
  const meta = getBookMeta(slug)
  if (!meta) return null
  const file = path.join(PDF_DIR, meta.filename)
  // Confine to the books directory regardless of what the manifest claims.
  if (path.dirname(path.resolve(file)) !== path.resolve(PDF_DIR)) return null
  return existsSync(file) ? file : null
}

export function getPages(slug: string, from: number, to: number): { n: number; text: string }[] {
  const book = getBook(slug)
  if (!book) return []
  const lo = Math.max(1, from)
  const hi = Math.min(book.totalPages, to)
  return book.pages.filter(p => p.n >= lo && p.n <= hi)
}

// ─── Search ──────────────────────────────────────────────────────────────────

const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'is', 'it', 'for', 'on', 'as', 'that', 'with'])

/** Split a query into bare terms plus "quoted phrases". */
export function parseQuery(q: string): { terms: string[]; phrases: string[] } {
  const phrases: string[] = []
  const rest = q.replace(/"([^"]+)"/g, (_, p) => {
    phrases.push(p.toLowerCase().trim())
    return ' '
  })
  const terms = rest
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter(t => t.length > 1 && !STOP.has(t))
  return { terms, phrases }
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Excerpt ~320 chars centred on the first match, snapped to word boundaries. */
function makeSnippet(text: string, at: number, len: number): string {
  const WIDTH = 320
  let start = Math.max(0, at - Math.floor((WIDTH - len) / 2))
  let end = Math.min(text.length, start + WIDTH)
  if (start > 0) {
    const sp = text.indexOf(' ', start)
    if (sp > -1 && sp < at) start = sp + 1
  }
  if (end < text.length) {
    const sp = text.lastIndexOf(' ', end)
    if (sp > at + len) end = sp
  }
  const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim()
  return `${start > 0 ? '…' : ''}${snippet}${end < text.length ? '…' : ''}`
}

export function search(
  query: string,
  opts: { slug?: string; limit?: number } = {}
): BookSearchResponse {
  const { slug, limit = 60 } = opts
  const { terms, phrases } = parseQuery(query)
  const needles = [...phrases, ...terms]

  if (!needles.length) {
    return { query, terms: needles, totalHits: 0, hits: [], byBook: [] }
  }

  const books = getManifest()
    .books.filter(b => !slug || b.slug === slug)
    .map(b => getBook(b.slug))
    .filter((b): b is BookRecord => !!b)

  // Bare terms allow up to three trailing characters so plurals and inflections
  // match ("gift" finds "gifts", "convention" finds "conventions") without a bare
  // prefix swallowing unrelated words ("el" must not match "element").
  const matchers = needles.map(n => ({
    needle: n,
    re: new RegExp(phrases.includes(n) ? escapeRe(n) : `\\b${escapeRe(n)}[a-z]{0,3}\\b`, 'gi'),
    isPhrase: phrases.includes(n),
  }))

  const scored: (BookSearchHit & { matched: number })[] = []

  for (const book of books) {
    for (const page of book.pages) {
      if (!page.text) continue

      let score = 0
      let matched = 0
      let firstAt = -1
      let firstLen = 0

      for (const m of matchers) {
        m.re.lastIndex = 0
        let count = 0
        let hit: RegExpExecArray | null
        while ((hit = m.re.exec(page.text)) !== null) {
          count++
          if (firstAt === -1 || hit.index < firstAt) {
            firstAt = hit.index
            firstLen = hit[0].length
          }
          if (count > 40) break
        }
        if (count > 0) {
          matched++
          // Diminishing returns on repetition; phrases weigh far more than terms.
          score += (m.isPhrase ? 6 : 1) * (1 + Math.log(count))
        }
      }

      if (!matched) continue
      // Pages matching every needle rank above partial matches.
      score *= matched === needles.length ? 2 : matched / needles.length

      scored.push({
        slug: book.slug,
        title: book.title,
        author: book.author,
        page: page.n,
        score: Math.round(score * 100) / 100,
        snippet: makeSnippet(page.text, firstAt, firstLen),
        matched,
      })
    }
  }

  // Precision gate. A two-word search means both words, the way a book index
  // behaves — but a natural-language question (as /api/books/ask sends) would
  // never match every needle, so the bar is the best coverage actually achieved,
  // with a little slack once the query gets long.
  const best = scored.reduce((m, h) => Math.max(m, h.matched), 0)
  const slack = needles.length > 3 ? Math.floor(needles.length * 0.25) : 0
  const floor = Math.max(1, best - slack)
  const kept = scored.filter(h => h.matched >= floor)

  kept.sort((a, b) => b.score - a.score || a.page - b.page)

  const counts = new Map<string, { slug: string; title: string; hits: number }>()
  for (const h of kept) {
    const row = counts.get(h.slug) || { slug: h.slug, title: h.title, hits: 0 }
    row.hits++
    counts.set(h.slug, row)
  }

  return {
    query,
    terms: needles,
    totalHits: kept.length,
    hits: kept.slice(0, limit).map(({ matched, ...hit }) => hit),
    byBook: [...counts.values()].sort((a, b) => b.hits - a.hits),
  }
}
