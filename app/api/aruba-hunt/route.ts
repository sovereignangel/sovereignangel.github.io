import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const COLLECTION = 'aruba_hunt'
const GAME_DOC = 'aruba_2026'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const teamKey = searchParams.get('team')
  if (!teamKey) return NextResponse.json({ error: 'missing team' }, { status: 400 })

  try {
    const snap = await adminDb
      .collection(COLLECTION).doc(GAME_DOC)
      .collection('teams').doc(teamKey)
      .get()
    return NextResponse.json({ checks: snap.data()?.checks || {} })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { teamKey, itemId, timestamp } = await req.json()
    if (!teamKey || !itemId) return NextResponse.json({ error: 'missing params' }, { status: 400 })

    const ref = adminDb
      .collection(COLLECTION).doc(GAME_DOC)
      .collection('teams').doc(teamKey)

    if (timestamp === null) {
      // Uncheck — remove from map
      const { FieldValue } = await import('firebase-admin/firestore')
      await ref.set(
        { checks: { [itemId]: FieldValue.delete() }, updatedAt: new Date().toISOString() },
        { merge: true }
      )
    } else {
      // Check — store timestamp
      await ref.set(
        { checks: { [itemId]: timestamp }, updatedAt: new Date().toISOString() },
        { merge: true }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
