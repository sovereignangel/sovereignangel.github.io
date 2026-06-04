/**
 * API route for adding comments to summer plan adventures.
 * Auth: simple PIN check (not Firebase auth — shared dashboard).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

const LORDAS_PIN = process.env.LORDAS_PIN || '1234'

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

export async function POST(request: NextRequest) {
  const pin = request.nextUrl.searchParams.get('pin')
  if (pin !== LORDAS_PIN) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const uid = process.env.TRANSCRIPT_WEBHOOK_UID
  if (!uid) {
    return NextResponse.json({ error: 'UID not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { author, text } = body

    if (!author || !text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Missing author or text' }, { status: 400 })
    }

    const db = await getAdminDb()
    const userRef = db.collection('users').doc(uid)

    // Get or create adventure session
    const adventureSessionSnap = await userRef.collection('adventure_sessions').limit(1).get()
    const sessionDocRef = adventureSessionSnap.docs[0]?.ref || userRef.collection('adventure_sessions').doc()

    const now = Timestamp.now()

    // Fetch current session data
    const sessionData = adventureSessionSnap.docs[0]?.data() || { comments: [], createdAt: now }

    // Add new comment
    const comment = {
      id: db.collection('dummy').doc().id,
      author,
      text: text.trim(),
      createdAt: now,
    }

    const updatedComments = [...(sessionData.comments || []), comment]

    // Update or create session
    await sessionDocRef.set(
      {
        comments: updatedComments,
        lastCommentAt: now,
        createdAt: sessionData.createdAt,
      },
      { merge: false }
    )

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[lordas/adventures/comments] Error:', msg)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
