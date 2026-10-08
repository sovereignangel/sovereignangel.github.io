import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

/**
 * The shelf is one person's library of copyrighted books, so a valid Google
 * sign-in is not enough — the caller must be the owner. BOOKS_OWNER_UID wins,
 * falling back to TRANSCRIPT_WEBHOOK_UID (the owner's uid, already on Vercel).
 * With neither set the shelf is closed rather than open to every account.
 */
export async function verifyBooksOwner(req: NextRequest): Promise<{ uid: string } | NextResponse> {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth
  const owner = process.env.BOOKS_OWNER_UID || process.env.TRANSCRIPT_WEBHOOK_UID
  if (!owner || auth.uid !== owner) {
    return NextResponse.json({ error: 'This shelf is private' }, { status: 403 })
  }
  return auth
}
