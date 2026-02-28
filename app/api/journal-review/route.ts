import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

// GET /api/journal-review — list pending reviews
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const { adminDb } = await import('@/lib/firebase-admin')
  const snap = await adminDb.collection('users').doc(auth.uid).collection('journal_reviews')
    .where('status', '==', 'saved')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get()

  const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ reviews })
}
