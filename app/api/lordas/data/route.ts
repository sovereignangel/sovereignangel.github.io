/**
 * API route for Lordas dashboard data.
 * Returns relationship conversations, themes, values, and snapshots.
 * Auth: simple PIN check (not Firebase auth — shared dashboard).
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const LORDAS_PIN = process.env.LORDAS_PIN || '1234'

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

export async function GET(request: NextRequest) {
  const pin = request.nextUrl.searchParams.get('pin')
  if (pin !== LORDAS_PIN) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const uid = process.env.TRANSCRIPT_WEBHOOK_UID
  if (!uid) {
    return NextResponse.json({ error: 'UID not configured' }, { status: 500 })
  }

  try {
    const db = await getAdminDb()
    const userRef = db.collection('users').doc(uid)

    // Fetch all data in parallel
    const [convsSnap, themesSnap, valuesSnap, snapshotsSnap] = await Promise.all([
      userRef.collection('relationship_conversations').orderBy('date', 'desc').limit(50).get(),
      userRef.collection('relationship_themes').get(),
      userRef.collection('relationship_values').get(),
      userRef.collection('relationship_snapshots').orderBy('date', 'desc').limit(30).get(),
    ])

    const conversations = convsSnap.docs.map(d => d.data())

    const themes = themesSnap.docs.map(d => d.data())
    const values = valuesSnap.docs.map(d => d.data())
    const snapshots = snapshotsSnap.docs.map(d => d.data())

    return NextResponse.json({
      conversations,
      themes,
      values,
      snapshots,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[lordas/data] Error:', msg)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
