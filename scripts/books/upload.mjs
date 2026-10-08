#!/usr/bin/env node
/**
 * Push the local shelf to the private Supabase bucket the deployed site reads.
 *
 *   node scripts/books/upload.mjs [--force]
 *
 * Runs the extract script first, then uploads, for every book in the manifest:
 *   pdf/<slug>.pdf     only when the size differs from what is there (or --force)
 *   text/<slug>.json   extracted page text, for search and Ask
 * and finally manifest.json, which is what makes a book appear on the site.
 *
 * Needs BOOKS_SUPABASE_URL and BOOKS_SUPABASE_SERVICE_KEY in .env.local. The
 * bucket is created private if it does not exist. Never make it public: these
 * are copyrighted books, and the site hands out short-lived signed links only
 * to the owner.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname)
const PDF_DIR = path.join(ROOT, 'app', 'books')
const DATA_DIR = path.join(ROOT, 'data', 'books')
const FORCE = process.argv.includes('--force')

if (existsSync(path.join(ROOT, '.env.local'))) process.loadEnvFile(path.join(ROOT, '.env.local'))

const url = process.env.BOOKS_SUPABASE_URL
const key = process.env.BOOKS_SUPABASE_SERVICE_KEY
const BUCKET = process.env.BOOKS_SUPABASE_BUCKET || 'website-books'
if (!url || !key) {
  console.error('Set BOOKS_SUPABASE_URL and BOOKS_SUPABASE_SERVICE_KEY in .env.local first.')
  process.exit(1)
}
const sb = createClient(url, key, { auth: { persistSession: false } })

// Supabase free plan's per-file cap. Bigger PDFs go up as a recompressed copy.
const MAX_BYTES = 50 * 1024 * 1024
const SHRUNK_DIR = path.join(DATA_DIR, 'shrunk')

/**
 * A copy under the cap, made with Ghostscript at /ebook quality (150dpi images).
 * Page count and order are unchanged, so highlights, bookmarks and the
 * extracted text still line up. The original in app/books/ is never touched.
 * Cached in data/books/shrunk/ (gitignored with the rest of data/books/).
 */
function shrink(book, pdf) {
  mkdirSync(SHRUNK_DIR, { recursive: true })
  const out = path.join(SHRUNK_DIR, `${book.slug}.pdf`)
  if (existsSync(out) && statSync(out).mtimeMs > statSync(pdf).mtimeMs) return out
  for (const quality of ['/ebook', '/screen']) {
    process.stdout.write(`· ${book.slug} — ${mb(statSync(pdf).size)} is over the cap, recompressing (${quality})... `)
    execFileSync('gs', ['-q', '-sDEVICE=pdfwrite', `-dPDFSETTINGS=${quality}`, '-dNOPAUSE', '-dBATCH', `-sOutputFile=${out}`, pdf])
    console.log(mb(statSync(out).size))
    if (statSync(out).size <= MAX_BYTES) return out
  }
  return out
}

function mb(n) {
  return `${(n / 1e6).toFixed(1)}MB`
}

async function main() {
  execFileSync('node', [path.join(ROOT, 'scripts', 'books', 'extract.mjs')], { stdio: 'inherit' })
  const manifest = JSON.parse(readFileSync(path.join(DATA_DIR, 'manifest.json'), 'utf8'))

  const { data: buckets, error: listErr } = await sb.storage.listBuckets()
  if (listErr) throw listErr
  const bucket = buckets.find(b => b.name === BUCKET)
  if (!bucket) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: false })
    if (error) throw error
    console.log(`\nCreated private bucket "${BUCKET}".`)
  } else if (bucket.public) {
    throw new Error(`Bucket "${BUCKET}" is public. Make it private in Supabase before uploading copyrighted books.`)
  }

  const { data: existing } = await sb.storage.from(BUCKET).list('pdf', { limit: 1000 })
  const remoteSize = new Map((existing || []).map(o => [o.name, o.metadata?.size]))

  const uploaded = []
  const failed = []
  for (const book of manifest.books) {
    let pdf = path.join(PDF_DIR, book.filename)
    if (!existsSync(pdf)) continue
    if (statSync(pdf).size > MAX_BYTES) {
      try {
        pdf = shrink(book, pdf)
      } catch {
        console.log(`  Ghostscript not available (brew install ghostscript) — trying the original.`)
      }
    }
    const size = statSync(pdf).size
    const name = `${book.slug}.pdf`

    if (FORCE || remoteSize.get(name) !== size) {
      process.stdout.write(`· ${book.slug} — uploading ${mb(size)}... `)
      const { error } = await sb.storage
        .from(BUCKET)
        .upload(`pdf/${name}`, readFileSync(pdf), { contentType: 'application/pdf', upsert: true })
      if (error) {
        console.log(`failed: ${error.message}`)
        if (/maximum allowed size|too large|413/i.test(error.message)) {
          console.log(`  Still over the Supabase free plan's 50MB cap after recompressing.`)
        }
        failed.push(book.slug)
        continue
      }
      console.log('done')
    } else {
      console.log(`· ${book.slug} — pdf up to date`)
    }

    const text = path.join(DATA_DIR, `${book.slug}.json`)
    const { error: textErr } = await sb.storage
      .from(BUCKET)
      .upload(`text/${book.slug}.json`, readFileSync(text), { contentType: 'application/json', upsert: true })
    if (textErr) {
      console.log(`  text upload failed: ${textErr.message}`)
      failed.push(book.slug)
      continue
    }
    // uploadedSize identifies the bucket copy (it differs from sourceSize when
    // shrunk); devices holding an offline copy re-download when it changes.
    uploaded.push({ ...book, uploadedSize: size })
  }

  // Only books whose PDF and text both landed go on the deployed shelf.
  const remoteManifest = { generatedAt: new Date().toISOString(), books: uploaded }
  const { error: mErr } = await sb.storage
    .from(BUCKET)
    .upload('manifest.json', JSON.stringify(remoteManifest, null, 2), { contentType: 'application/json', upsert: true })
  if (mErr) throw mErr

  console.log(`\nShelf live: ${uploaded.length} books.${failed.length ? ` Not uploaded: ${failed.join(', ')}.` : ''}`)
  console.log('The site picks up the new manifest within 5 minutes.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
