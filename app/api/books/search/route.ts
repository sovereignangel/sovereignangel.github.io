import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { search } from '@/lib/books/library'

export const dynamic = 'force-dynamic'

/** GET /api/books/search?q=...&slug=...&limit=... — full-text across the shelf. */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''
  if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 })

  const slug = searchParams.get('slug') || undefined
  const limit = Math.min(Number(searchParams.get('limit')) || 60, 200)

  return NextResponse.json(search(q, { slug, limit }))
}
