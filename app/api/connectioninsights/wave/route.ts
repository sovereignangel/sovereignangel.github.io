/**
 * GET  /api/connectioninsights/wave            → recent Wave sessions, flagged if imported
 * POST /api/connectioninsights/wave { sessionId } → import one session by hand
 *
 * The manual path works even when Wave's webhook never fires.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  ROOT, getDb, requireUser, loadProfile, namesOf, listWaveSessions, fetchWaveTranscript,
} from '@/lib/connectioninsights/server'
import { processTranscript } from '@/lib/connectioninsights/pipeline'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (user instanceof NextResponse) return user
  const db = await getDb()
  const profile = await loadProfile(db, user.uid)
  if (!profile?.waveToken) return NextResponse.json({ error: 'Wave not connected' }, { status: 400 })

  try {
    const [sessions, convs] = await Promise.all([
      listWaveSessions(profile.waveToken, 20),
      db.collection(ROOT).doc(user.uid).collection('conversations').select('sourceId').get(),
    ])
    const imported = new Set(convs.docs.map(d => d.get('sourceId')))
    return NextResponse.json({
      sessions: sessions.map(s => ({ ...s, imported: imported.has(`wave-${s.id}`) })),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Wave error' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (user instanceof NextResponse) return user
  const { sessionId } = await request.json().catch(() => ({})) as { sessionId?: string }
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const db = await getDb()
  const profile = await loadProfile(db, user.uid)
  if (!profile?.waveToken) return NextResponse.json({ error: 'Wave not connected' }, { status: 400 })

  try {
    const transcript = await fetchWaveTranscript(profile.waveToken, sessionId)
    if (transcript.length < 100) return NextResponse.json({ error: 'Transcript too short or not ready yet' }, { status: 400 })
    const result = await processTranscript(user.uid, db, transcript, namesOf(profile), { sourceId: `wave-${sessionId}` })
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[connectioninsights/wave]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
