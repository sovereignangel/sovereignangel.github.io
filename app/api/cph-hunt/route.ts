import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const COLLECTION = 'cph_hunt'
const GAME_DOC = 'cph_2026'

// Team docs hold two maps:
//   checks — { [itemId]: ISO timestamp }  (a completed challenge)
//   counts — { [itemId]: number }         (challenges scored per unit, e.g. Danes in the selfie)
// The test environment writes to the same collection under `t_`-prefixed doc ids.
function teamRef(teamKey: string) {
  return adminDb
    .collection(COLLECTION).doc(GAME_DOC)
    .collection('teams').doc(teamKey)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const teamKey = searchParams.get('team')
  if (!teamKey) return NextResponse.json({ error: 'missing team' }, { status: 400 })

  try {
    const snap = await teamRef(teamKey).get()
    const data = snap.data() || {}
    return NextResponse.json({ checks: data.checks || {}, counts: data.counts || {} })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { teamKey, itemId, timestamp, count, reset } = await req.json()
    if (!teamKey) return NextResponse.json({ error: 'missing teamKey' }, { status: 400 })

    const ref = teamRef(teamKey)

    // Wipe a team's whole scorecard (used by the test console's reset buttons)
    if (reset) {
      await ref.set({ checks: {}, counts: {}, updatedAt: new Date().toISOString() })
      return NextResponse.json({ ok: true })
    }

    if (!itemId) return NextResponse.json({ error: 'missing itemId' }, { status: 400 })
    const { FieldValue } = await import('firebase-admin/firestore')

    if (count !== undefined) {
      await ref.set(
        {
          counts: { [itemId]: count === null ? FieldValue.delete() : count },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      return NextResponse.json({ ok: true })
    }

    await ref.set(
      {
        checks: { [itemId]: timestamp === null ? FieldValue.delete() : timestamp },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
