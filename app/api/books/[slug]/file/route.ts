import { NextRequest } from 'next/server'
import { createReadStream, statSync } from 'node:fs'
import { Readable } from 'node:stream'
import { getBookPdfPath } from '@/lib/books/library'

export const dynamic = 'force-dynamic'

/**
 * GET /api/books/[slug]/file — stream the local PDF to pdf.js.
 *
 * Deliberately unauthenticated: pdf.js loads the URL directly and cannot attach
 * a bearer token. Safe because the PDFs are gitignored and never deployed — on
 * any host without app/books/ this route is a permanent 404. Keep it that way.
 *
 * Range requests are honoured so pdf.js can stream the 900-page volume instead
 * of pulling 50MB before the first page paints.
 */
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const file = getBookPdfPath(params.slug)
  if (!file) {
    return new Response('Not found — this book is not on this host', { status: 404 })
  }

  const size = statSync(file).size
  const range = _req.headers.get('range')

  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
  }

  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/)
    if (m) {
      const start = m[1] ? Number(m[1]) : 0
      const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1
      if (start >= size || start > end) {
        return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
      }
      const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream
      return new Response(stream, {
        status: 206,
        headers: {
          ...headers,
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Content-Length': String(end - start + 1),
        },
      })
    }
  }

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream
  return new Response(stream, { status: 200, headers: { ...headers, 'Content-Length': String(size) } })
}
