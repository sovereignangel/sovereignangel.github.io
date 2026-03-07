/**
 * One-off admin endpoint to enrich recently saved contacts/conversations.
 * DELETE THIS FILE after use.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.TRANSCRIPT_WEBHOOK_UID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const collection = request.nextUrl.searchParams.get('collection') || 'conversations'
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
  const uid = process.env.TRANSCRIPT_WEBHOOK_UID!
  const db = await getAdminDb()

  const snap = await db.collection('users').doc(uid).collection(collection)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  const docs = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString(), updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() }))
  return NextResponse.json({ count: docs.length, docs })
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.TRANSCRIPT_WEBHOOK_UID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { updates } = await request.json() as {
    updates: Array<{
      collection: string
      query: { field: string; value: string }
      data: Record<string, unknown>
    }>
  }

  const uid = process.env.TRANSCRIPT_WEBHOOK_UID!
  const db = await getAdminDb()
  const userRef = db.collection('users').doc(uid)
  const results: Array<{ collection: string; query: string; matched: number; updated: number }> = []

  for (const update of updates) {
    const snap = await userRef.collection(update.collection)
      .where(update.query.field, '==', update.query.value)
      .limit(5)
      .get()

    let updated = 0
    for (const doc of snap.docs) {
      await doc.ref.update({ ...update.data, updatedAt: new Date() })
      updated++
    }
    results.push({
      collection: update.collection,
      query: `${update.query.field}=${update.query.value}`,
      matched: snap.size,
      updated,
    })
  }

  return NextResponse.json({ results })
}
