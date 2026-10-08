// Server-only: holds the service key. Import from route handlers and scripts, never from a client component.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The deployed copy of the shelf: a private Supabase Storage bucket.
 *
 * The PDFs are copyrighted and the repo is public, so they never go through
 * git. scripts/books/upload.mjs pushes them here instead, and on Vercel the
 * library reads from the bucket. The bucket is private — the only way to a PDF
 * is a short-lived signed URL handed out by /api/books/[slug]/url, which checks
 * that the caller is the shelf's owner.
 *
 * Layout:
 *   manifest.json        BookManifest, written by the upload script
 *   pdf/<slug>.pdf       the source file
 *   text/<slug>.json     BookRecord (extracted page text, for search and Ask)
 *
 * Uses its own BOOKS_SUPABASE_* env so it can never be confused with another
 * project's Supabase keys.
 */

export const BOOKS_BUCKET = process.env.BOOKS_SUPABASE_BUCKET || 'website-books'

let client: SupabaseClient | null | undefined

export function booksStorage(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = process.env.BOOKS_SUPABASE_URL
  const key = process.env.BOOKS_SUPABASE_SERVICE_KEY
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
  return client
}

export async function downloadJson<T>(objectPath: string): Promise<T | null> {
  const sb = booksStorage()
  if (!sb) return null
  const { data, error } = await sb.storage.from(BOOKS_BUCKET).download(objectPath)
  if (error || !data) return null
  return JSON.parse(await data.text()) as T
}

/** Long enough for one download on a slow connection; the device keeps its own copy after that. */
export const SIGNED_URL_TTL = 15 * 60

export async function signedPdfUrl(slug: string): Promise<string | null> {
  const sb = booksStorage()
  if (!sb) return null
  const { data, error } = await sb.storage.from(BOOKS_BUCKET).createSignedUrl(`pdf/${slug}.pdf`, SIGNED_URL_TTL)
  if (error || !data) return null
  return data.signedUrl
}
