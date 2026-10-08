'use client'

/**
 * Books kept on the device, in IndexedDB.
 *
 * Deployed, PDFs come from signed Supabase links, and Supabase does not expose
 * Accept-Ranges to cross-origin readers — so pdf.js cannot stream pages and
 * would pull the whole file on every open. Instead the file is fetched once per
 * device and kept here: reopening is instant, and a book opened once reads
 * offline (flights). `version` changes when the uploaded file does, which
 * invalidates the copy.
 *
 * Everything degrades to "not cached": private mode, quota, or an evicted
 * store just means the next open downloads again.
 */

const DB_NAME = 'books-pdf-cache'
const STORE = 'pdfs'

interface Entry {
  slug: string
  version: string
  blob: Blob
  savedAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'slug' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }).finally(() => db.close())
}

export async function getCachedPdf(slug: string, version: string): Promise<Blob | null> {
  try {
    const entry = await withStore<Entry | undefined>('readonly', s => s.get(slug))
    return entry && entry.version === version ? entry.blob : null
  } catch {
    return null
  }
}

/** Slugs → version for everything on this device, for the shelf's "offline" mark. */
export async function listCachedPdfs(): Promise<Map<string, string>> {
  try {
    const all = await withStore<Entry[]>('readonly', s => s.getAll())
    return new Map(all.map(e => [e.slug, e.version]))
  } catch {
    return new Map()
  }
}

async function putCachedPdf(slug: string, version: string, blob: Blob): Promise<void> {
  try {
    await withStore('readwrite', s => s.put({ slug, version, blob, savedAt: Date.now() } satisfies Entry))
  } catch {
    // Quota or private mode — reading still works, it just downloads next time.
  }
}

/** Download with progress (0–1), keep a copy, return the blob. */
export async function downloadPdf(
  slug: string,
  version: string,
  url: string,
  onProgress?: (fraction: number) => void
): Promise<Blob> {
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`)
  const total = Number(res.headers.get('content-length')) || 0
  const reader = res.body.getReader()
  const chunks: BlobPart[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (total && onProgress) onProgress(received / total)
  }
  const blob = new Blob(chunks, { type: 'application/pdf' })
  await putCachedPdf(slug, version, blob)
  return blob
}
