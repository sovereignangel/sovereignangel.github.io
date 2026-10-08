import { NextRequest, NextResponse } from 'next/server'
import { verifyBooksOwner } from '@/lib/books/auth'
import { getPdfUrl } from '@/lib/books/library'

export const dynamic = 'force-dynamic'

/**
 * GET /api/books/[slug]/url — where the reader should load this PDF from.
 *
 * pdf.js cannot send a bearer token, so the owner check happens here and the
 * answer is a URL pdf.js can fetch on its own: the local streaming route in dev,
 * a signed link into the private bucket when deployed, which the
 * client downloads once and keeps on the device (lib/books/pdf-cache.ts).
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const auth = await verifyBooksOwner(req)
  if (auth instanceof NextResponse) return auth

  const url = await getPdfUrl(params.slug)
  if (!url) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  return NextResponse.json({ url })
}
