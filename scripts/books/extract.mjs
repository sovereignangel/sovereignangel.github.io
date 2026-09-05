#!/usr/bin/env node
/**
 * Extract per-page text from every PDF in app/books/ into data/books/.
 *
 * Requires poppler's pdftotext (brew install poppler).
 * Output is gitignored: these are copyrighted books, the text is the work.
 *
 *   node scripts/books/extract.mjs [--force]
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname)
const PDF_DIR = path.join(ROOT, 'app', 'books')
const OUT_DIR = path.join(ROOT, 'data', 'books')
const FORCE = process.argv.includes('--force')

/** Stable slugs + clean metadata for the known shelf. Anything else is derived. */
const OVERRIDES = [
  {
    match: /grinold|active portfolio/i,
    slug: 'grinold-kahn-active-portfolio',
    title: 'Advances in Active Portfolio Management',
    author: 'Richard C. Grinold & Ronald N. Kahn',
    year: '2019',
  },
  {
    match: /brian arthur|complexity and the economy/i,
    slug: 'arthur-complexity-economy',
    title: 'Complexity and the Economy',
    author: 'W. Brian Arthur',
    year: '2014',
  },
  {
    match: /mauss|the gift/i,
    slug: 'mauss-the-gift',
    title: 'The Gift',
    author: 'Marcel Mauss',
    year: '1925',
  },
]

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

function pdfInfo(file) {
  try {
    const out = execFileSync('pdfinfo', [file], { encoding: 'utf8' })
    const get = (k) => (out.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')) || [])[1]?.trim()
    return { title: get('Title'), author: get('Author'), pages: Number(get('Pages')) || 0 }
  } catch {
    return { title: undefined, author: undefined, pages: 0 }
  }
}

/** Join hyphenated line breaks, collapse runs of whitespace, keep paragraph feel. */
function clean(text) {
  return text
    .replace(/­/g, '')
    .replace(/([A-Za-z])-\n([a-z])/g, '$1$2')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function main() {
  if (!existsSync(PDF_DIR)) {
    console.error(`No ${path.relative(ROOT, PDF_DIR)} directory — nothing to extract.`)
    process.exit(0)
  }
  mkdirSync(OUT_DIR, { recursive: true })

  const pdfs = readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith('.pdf')).sort()
  if (!pdfs.length) {
    console.error('No PDFs found in app/books/.')
    process.exit(0)
  }

  const books = []
  for (const filename of pdfs) {
    const abs = path.join(PDF_DIR, filename)
    const info = pdfInfo(abs)
    const ov = OVERRIDES.find((o) => o.match.test(filename) || (info.title && o.match.test(info.title)))
    const slug = ov?.slug || slugify(info.title || filename.replace(/\.pdf$/i, ''))
    const outFile = path.join(OUT_DIR, `${slug}.json`)

    const stat = statSync(abs)
    if (!FORCE && existsSync(outFile)) {
      const prev = JSON.parse(readFileSync(outFile, 'utf8'))
      if (prev.sourceSize === stat.size) {
        console.log(`· ${slug} — up to date (${prev.totalPages} pages)`)
        books.push(meta(prev))
        continue
      }
    }

    process.stdout.write(`· ${slug} — extracting ${info.pages} pages... `)
    const raw = execFileSync('pdftotext', ['-enc', 'UTF-8', abs, '-'], {
      encoding: 'utf8',
      maxBuffer: 512 * 1024 * 1024,
    })

    const pages = raw.split('\f').map((t, i) => ({ n: i + 1, text: clean(t) }))
    // pdftotext emits a trailing form feed; drop the empty tail page it creates.
    if (pages.length && !pages[pages.length - 1].text) pages.pop()

    const record = {
      slug,
      title: ov?.title || info.title || filename.replace(/\.pdf$/i, ''),
      author: ov?.author || info.author || 'Unknown',
      year: ov?.year,
      filename,
      sourceSize: stat.size,
      totalPages: pages.length,
      charCount: pages.reduce((a, p) => a + p.text.length, 0),
      extractedAt: new Date().toISOString(),
      pages,
    }
    writeFileSync(outFile, JSON.stringify(record))
    console.log(`${pages.length} pages, ${(record.charCount / 1000).toFixed(0)}k chars`)
    books.push(meta(record))
  }

  const manifest = { generatedAt: new Date().toISOString(), books }
  writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`\nWrote ${path.relative(ROOT, OUT_DIR)}/manifest.json — ${books.length} books.`)
}

function meta(r) {
  const { pages, ...rest } = r
  return rest
}

main()
