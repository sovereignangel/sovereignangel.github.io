/**
 * Reprocess relationship conversations to re-extract metrics.
 * POST /api/lordas/reprocess?pin=XXXX&date=2026-03-31
 * If no date, reprocesses all conversations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractRelationalMetrics, computePillarScores } from '@/lib/relational-extraction'

export const runtime = 'nodejs'
export const maxDuration = 120

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

  const date = request.nextUrl.searchParams.get('date')

  try {
    const db = await getAdminDb()
    const convsRef = db.collection('users').doc(uid).collection('relationship_conversations')

    let query: FirebaseFirestore.Query = convsRef
    if (date) {
      query = convsRef.where('date', '==', date)
    }

    const snap = await query.get()
    if (snap.empty) {
      return NextResponse.json({ error: 'No conversations found', date }, { status: 404 })
    }

    const results: { id: string; date: string; status: string }[] = []

    for (const doc of snap.docs) {
      const data = doc.data()
      const transcript = data.transcriptText || ''

      if (transcript.length < 100) {
        results.push({ id: doc.id, date: data.date, status: 'skipped_short' })
        continue
      }

      try {
        const extraction = await extractRelationalMetrics(transcript)
        const scores = computePillarScores(extraction)

        await doc.ref.update({ extraction, scores })
        results.push({ id: doc.id, date: data.date, status: 'reprocessed' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        results.push({ id: doc.id, date: data.date, status: `error: ${msg}` })
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[lordas/reprocess] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
