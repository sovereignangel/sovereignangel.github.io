import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { getManifest } from '@/lib/books/library'

export const dynamic = 'force-dynamic'

/** GET /api/books — the local shelf. Empty array when the corpus isn't on this host. */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  const manifest = getManifest()
  return NextResponse.json({
    generatedAt: manifest.generatedAt,
    books: manifest.books,
  })
}
