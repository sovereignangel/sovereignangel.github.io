/**
 * POST /api/connectioninsights/wave/hook/{hookId}
 *
 * Per-user Wave webhook, registered on the user's own Wave account when they
 * save a token. The unguessable hookId maps to their uid. The payload is only
 * trusted for the session id: the transcript is always re-fetched from Wave
 * with that user's own token, so a forged call can at most import one of
 * their real sessions.
 *
 * Only sessions whose title contains the user's keyword (default
 * "connection") are ingested, so work calls stay out of the dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  HOOKS, getDb, loadProfile, namesOf, fetchWaveTranscript, verifyWaveSignature,
} from '@/lib/connectioninsights/server'
import { processTranscript } from '@/lib/connectioninsights/pipeline'

export const runtime = 'nodejs'
export const maxDuration = 120

interface WavePayload {
  event?: string
  data?: { session?: { id?: string; title?: string; duration_seconds?: number } }
}

export async function POST(request: NextRequest, { params }: { params: { hookId: string } }) {
  const db = await getDb()
  const hook = await db.collection(HOOKS).doc(params.hookId).get()
  if (!hook.exists) return NextResponse.json({ error: 'Unknown hook' }, { status: 404 })
  const uid = hook.get('uid') as string
  const profile = await loadProfile(db, uid)
  if (!profile?.waveToken || profile.waveHookId !== params.hookId) {
    return NextResponse.json({ error: 'Hook no longer active' }, { status: 410 })
  }

  const rawBody = await request.text()
  if (profile.waveWebhookSecret) {
    const ok = verifyWaveSignature(profile.waveWebhookSecret, {
      id: request.headers.get('x-wave-webhook-id') || '',
      timestamp: request.headers.get('x-wave-webhook-timestamp') || '',
      signature: request.headers.get('x-wave-webhook-signature') || '',
    }, rawBody)
    if (!ok) console.warn('[connectioninsights/hook] signature mismatch — proceeding on hookId (transcript is re-fetched)')
  }

  let payload: WavePayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (payload.event !== 'session.completed') return NextResponse.json({ ok: true, skipped: payload.event })

  const session = payload.data?.session
  if (!session?.id) return NextResponse.json({ error: 'No session id' }, { status: 400 })

  const keyword = (profile.waveKeyword ?? 'connection').toLowerCase()
  if (keyword && !(session.title || '').toLowerCase().includes(keyword)) {
    return NextResponse.json({ ok: true, skipped: 'title does not contain keyword' })
  }

  try {
    const transcript = await fetchWaveTranscript(profile.waveToken, session.id)
    if (transcript.length < 100) return NextResponse.json({ ok: true, skipped: 'transcript too short' })
    const result = await processTranscript(uid, db, transcript, namesOf(profile), {
      sourceId: `wave-${session.id}`,
      durationSeconds: session.duration_seconds ?? null,
    })
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[connectioninsights/hook]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
