import { NextRequest, NextResponse } from 'next/server'
import { verifyBooksOwner } from '@/lib/books/auth'
import { getManifest, listShelf } from '@/lib/books/library'

export const dynamic = 'force-dynamic'

/**
 * GET /api/books — every PDF in app/books/. `extracted` marks the ones with page
 * text (search, Ask). Empty array when
 * neither the local corpus nor the books bucket is available.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyBooksOwner(req)
  if (auth instanceof NextResponse) return auth

  const manifest = await getManifest()
  return NextResponse.json({
    generatedAt: manifest.generatedAt,
    books: (await listShelf()).map(b => ({ ...b, extracted: !!b.extractedAt })),
  })
}
