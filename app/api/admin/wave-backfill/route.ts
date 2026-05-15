/**
 * Admin endpoint: backfill Wave 7-tag prompts on historical sessions.
 *
 * The Phase 2B Wave webhook only prompts on NEW session.completed events. Lori
 * has 50+ historical Wave sessions that landed via the auto-classify path
 * (pre-Phase 2B). This endpoint walks the most recent N untagged sessions and
 * re-prompts her with the 7-tag inline keyboard so she can categorize them
 * retroactively.
 *
 * Spec note (Phase 2 handoff §"When done"):
 *   > Build a one-time backfill script (or admin endpoint) that re-prompts her
 *   > for tags on the most recent N untagged sessions. Don't auto-tag historical
 *   > data.
 *
 * Behavior is identical to the live Wave webhook's prompt branch — uses the
 * same buildWaveKeyboard / buildWavePromptText / wave_pending_decisions flow.
 * No auto-classification ever happens here; every backfill requires a human tap.
 *
 * Auth: x-inbox-secret header must match INBOX_SHARED_SECRET.
 *
 * Usage:
 *   curl -X POST 'https://www.loricorpuz.com/api/admin/wave-backfill?n=5' \
 *     -H "x-inbox-secret: $INBOX_SHARED_SECRET"
 *
 *   # Dry-run (list which sessions would prompt without actually prompting):
 *   curl -X POST 'https://www.loricorpuz.com/api/admin/wave-backfill?n=5&dry=1' ...
 *
 * Defaults: n=5 (don't spam her phone), max=25.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { buildWaveKeyboard, buildWavePromptText } from '@/lib/wave/tag-buttons'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DEFAULT_N = 5
const MAX_N = 25

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf-8')
  const b = Buffer.from(expected, 'utf-8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

interface WaveSession {
  id: string
  title: string
  duration_seconds?: number
  timestamp?: string | null
}

async function fetchWaveSessions(token: string, limit: number): Promise<WaveSession[]> {
  const res = await fetch(`https://api.wave.co/v1/sessions?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Wave sessions list failed: HTTP ${res.status} ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.sessions || []
}

async function fetchWaveTranscript(token: string, sessionId: string): Promise<string | null> {
  const res = await fetch(`https://api.wave.co/v1/sessions/${sessionId}/transcript`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  let text = data.transcript || ''
  if ((!text || text.length < 100) && data.segments?.length > 0) {
    text = data.segments.map((s: { speaker: string; text: string }) => `${s.speaker}: ${s.text}`).join('\n')
  }
  return text.length >= 100 ? text : null
}

export async function POST(req: NextRequest) {
  const expected = process.env.INBOX_SHARED_SECRET
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'inbox auth not configured' }, { status: 500 })
  }
  const provided = req.headers.get('x-inbox-secret') ?? ''
  if (!provided || !secretMatches(provided, expected)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const waveToken = process.env.WAVE_API_TOKEN
  if (!waveToken) {
    return NextResponse.json({ ok: false, error: 'WAVE_API_TOKEN not configured' }, { status: 500 })
  }
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 })
  }
  const uid = process.env.TRANSCRIPT_WEBHOOK_UID
  if (!uid) {
    return NextResponse.json({ ok: false, error: 'TRANSCRIPT_WEBHOOK_UID not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const dry = url.searchParams.get('dry') === '1'
  const nParam = parseInt(url.searchParams.get('n') || '', 10)
  const n = Math.max(1, Math.min(MAX_N, Number.isFinite(nParam) ? nParam : DEFAULT_N))

  const db = await getAdminDb()

  // Get chat ID for the user
  const userDoc = await db.collection('users').doc(uid).get()
  const chatId = userDoc.data()?.settings?.telegramChatId
  if (!chatId) {
    return NextResponse.json({ ok: false, error: 'user has no telegramChatId in settings' }, { status: 500 })
  }

  let sessions: WaveSession[]
  try {
    // Pull more than n to compensate for sessions that are already-tagged or
    // have transcripts too short to bother with — we want N actual prompts.
    sessions = await fetchWaveSessions(waveToken, Math.min(n * 3, 50))
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 502 })
  }

  const results: Array<{ sessionId: string; title: string; outcome: string; detail?: string }> = []
  let prompted = 0
  let already_tagged = 0
  let already_pending = 0
  let no_transcript = 0
  let errored = 0

  for (const session of sessions) {
    if (prompted >= n) break

    const sessionId = session.id
    const title = session.title || `Untitled ${sessionId.slice(0, 8)}`

    // Skip if already decided
    const decisionRef = db.collection('wave_session_decisions').doc(sessionId)
    const decisionDoc = await decisionRef.get()
    if (decisionDoc.exists) {
      already_tagged++
      results.push({ sessionId, title, outcome: 'skip_already_tagged', detail: decisionDoc.data()?.decision })
      continue
    }

    // Skip if already prompted and awaiting tap
    const pendingRef = db.collection('wave_pending_decisions').doc(sessionId)
    const pendingDoc = await pendingRef.get()
    if (pendingDoc.exists) {
      already_pending++
      results.push({ sessionId, title, outcome: 'skip_already_pending' })
      continue
    }

    if (dry) {
      results.push({ sessionId, title, outcome: 'would_prompt' })
      prompted++
      continue
    }

    // Fetch transcript
    let transcript: string | null
    try {
      transcript = await fetchWaveTranscript(waveToken, sessionId)
    } catch (err) {
      errored++
      results.push({
        sessionId,
        title,
        outcome: 'transcript_fetch_failed',
        detail: err instanceof Error ? err.message.slice(0, 200) : String(err),
      })
      continue
    }
    if (!transcript) {
      no_transcript++
      results.push({ sessionId, title, outcome: 'skip_transcript_too_short' })
      continue
    }

    // Stash pending + send prompt
    try {
      await pendingRef.set({
        sessionId,
        sessionTitle: title,
        durationSeconds: session.duration_seconds ?? null,
        transcript,
        uid,
        chatId,
        createdAt: new Date(),
        status: 'awaiting_tap',
        source: 'backfill',
      })

      const promptText = buildWavePromptText(title, session.duration_seconds)
      const keyboard = buildWaveKeyboard(sessionId)
      const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `[Backfill] ${promptText}`,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard },
        }),
      })
      if (!sendRes.ok) {
        const body = await sendRes.text()
        throw new Error(`Telegram sendMessage HTTP ${sendRes.status}: ${body.slice(0, 200)}`)
      }
      const data = await sendRes.json()
      await pendingRef.update({ prompt_message_id: data.result?.message_id ?? null })

      prompted++
      results.push({ sessionId, title, outcome: 'prompted' })
    } catch (err) {
      errored++
      results.push({
        sessionId,
        title,
        outcome: 'prompt_send_failed',
        detail: err instanceof Error ? err.message.slice(0, 200) : String(err),
      })
    }
  }

  return NextResponse.json({
    ok: true,
    dry_run: dry,
    n_requested: n,
    sessions_inspected: sessions.length,
    counts: {
      prompted,
      already_tagged,
      already_pending,
      no_transcript,
      errored,
    },
    results,
  })
}
