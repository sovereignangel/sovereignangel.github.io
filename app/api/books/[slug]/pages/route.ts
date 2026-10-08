import { NextRequest, NextResponse } from 'next/server'
import { verifyBooksOwner } from '@/lib/books/auth'
import { getBookMeta, getPages } from '@/lib/books/library'

export const dynamic = 'force-dynamic'

/** GET /api/books/[slug]/pages?from=1&to=5 — extracted text for a page range. */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const auth = await verifyBooksOwner(req)
  if (auth instanceof NextResponse) return auth

  const meta = await getBookMeta(params.slug)
  if (!meta) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const from = Number(searchParams.get('from')) || 1
  const to = Number(searchParams.get('to')) || from

  return NextResponse.json({ slug: meta.slug, title: meta.title, pages: await getPages(meta.slug, from, to) })
}
