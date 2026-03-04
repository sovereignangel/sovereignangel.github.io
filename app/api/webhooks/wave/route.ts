/**
 * Wave.ai webhook endpoint.
 *
 * Receives session.completed events from Wave API, fetches the full
 * transcript, auto-classifies the template type, processes it through
 * the extraction pipeline, and sends a Telegram notification.
 *
 * Auth: HMAC-SHA256 signature verification using the webhook secret.
 *
 * Setup:
 * 1. Create API token at app.wave.co/settings/integrations/api
 *    - Scopes: webhooks:manage, transcripts:read, sessions:read
 * 2. Register webhook:
 *    curl -X POST https://api.wave.co/v1/webhooks \
 *      -H "Authorization: Bearer $WAVE_API_TOKEN" \
 *      -H "Content-Type: application/json" \
 *      -d '{"url":"https://loricorpuz.com/api/webhooks/wave","events":["session.completed"]}'
 * 3. Save the returned "secret" as WAVE_WEBHOOK_SECRET in .env.local
 * 4. Save the API token as WAVE_API_TOKEN in .env.local
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractFromTranscript, classifyTranscriptType } from '@/lib/ai-extraction'
import { processTranscriptData, formatTranscriptSummary } from '@/lib/transcript-processing'
import { sendTelegramMessage } from '@/lib/telegram'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 120

interface WaveWebhookPayload {
  id: string
  event: 'session.completed' | 'session.updated' | 'session.deleted'
  created_at: string
  data: {
    session: {
      id: string
      title: string
      timestamp: string | null
      duration_seconds: number
      type: string
      platform: string | null
      language: string | null
      summary: string | null
      notes: string | null
      tags: string[]
      favorite: boolean
    }
  }
}

interface WaveTranscriptResponse {
  id: string
  transcript: string
  segments: Array<{
    speaker: string
    start: number
    end: number
    text: string
  }>
}

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

/**
 * Verify HMAC-SHA256 signature from Wave webhook.
 * Signature = HMAC-SHA256(secret, webhookId.timestamp.body)
 */
function verifyWaveSignature(request: {
  webhookId: string
  timestamp: string
  body: string
  signature: string
}): boolean {
  const secret = process.env.WAVE_WEBHOOK_SECRET
  if (!secret) return false

  const signedContent = `${request.webhookId}.${request.timestamp}.${request.body}`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('base64')

  // The signature header may contain multiple signatures (versioned)
  // Check if any match
  const signatures = request.signature.split(' ')
  return signatures.some(sig => {
    const sigValue = sig.startsWith('v1,') ? sig.slice(3) : sig
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(sigValue),
    )
  })
}

/**
 * Fetch full transcript from Wave API.
 */
async function fetchWaveTranscript(sessionId: string): Promise<WaveTranscriptResponse> {
  const token = process.env.WAVE_API_TOKEN
  if (!token) throw new Error('WAVE_API_TOKEN not configured')

  const res = await fetch(`https://api.wave.co/v1/sessions/${sessionId}/transcript`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Wave API error ${res.status}: ${body}`)
  }

  return res.json()
}

export async function POST(request: NextRequest) {
  const uid = process.env.TRANSCRIPT_WEBHOOK_UID
  if (!uid) {
    return NextResponse.json({ error: 'TRANSCRIPT_WEBHOOK_UID not configured' }, { status: 500 })
  }

  // Read raw body for HMAC verification
  const rawBody = await request.text()

  // Verify HMAC signature
  const webhookId = request.headers.get('x-wave-webhook-id') || ''
  const timestamp = request.headers.get('x-wave-webhook-timestamp') || ''
  const signature = request.headers.get('x-wave-webhook-signature') || ''

  if (!verifyWaveSignature({ webhookId, timestamp, body: rawBody, signature })) {
    console.error('[webhooks/wave] HMAC verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: WaveWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only process session.completed events
  if (payload.event !== 'session.completed') {
    return NextResponse.json({ ok: true, skipped: payload.event })
  }

  const sessionId = payload.data.session.id
  const sessionTitle = payload.data.session.title

  try {
    // 1. Fetch full transcript from Wave API
    const transcript = await fetchWaveTranscript(sessionId)

    // Build full transcript text from segments (with speaker labels)
    let transcriptText = transcript.transcript
    if ((!transcriptText || transcriptText.length < 100) && transcript.segments?.length > 0) {
      transcriptText = transcript.segments
        .map(s => `${s.speaker}: ${s.text}`)
        .join('\n')
    }

    if (!transcriptText || transcriptText.trim().length < 100) {
      console.warn(`[webhooks/wave] Session ${sessionId} transcript too short, skipping`)
      return NextResponse.json({ ok: true, skipped: 'transcript_too_short' })
    }

    // 2. Store debug record
    const db = await getAdminDb()
    const debugRef = db.collection('users').doc(uid).collection('transcript_drafts').doc()
    await debugRef.set({
      text: transcriptText.slice(0, 500),
      source: 'wave_api',
      metadata: {
        wave_session_id: sessionId,
        wave_session_title: sessionTitle,
        wave_event_id: payload.id,
        duration_seconds: payload.data.session.duration_seconds,
        platform: payload.data.session.platform,
        tags: payload.data.session.tags,
      },
      receivedAt: new Date(),
      status: 'processing',
    })

    // 3. Auto-classify template type
    const templateType = await classifyTranscriptType(transcriptText)

    // 4. Extract structured data
    const extracted = await extractFromTranscript(transcriptText, templateType)

    // 5. Process and save all data
    const result = await processTranscriptData(uid, transcriptText, templateType, extracted)

    // 6. Update debug record
    await debugRef.update({
      status: 'completed',
      templateType,
      title: result.title,
      counts: result.counts,
      processedAt: new Date(),
    })

    // 7. Send Telegram notification
    const userDoc = await db.collection('users').doc(uid).get()
    const chatId = userDoc.data()?.settings?.telegramChatId
    if (chatId) {
      const duration = payload.data.session.duration_seconds
      const durationStr = duration
        ? ` (${Math.round(duration / 60)} min)`
        : ''

      const summary = formatTranscriptSummary(result, {
        source: `Wave${durationStr}`,
        autoClassified: true,
      })
      await sendTelegramMessage(chatId, summary)
    }

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      title: result.title,
      templateType,
      counts: result.counts,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[webhooks/wave] Error processing session ${sessionId}:`, msg)

    // Attempt error notification via Telegram
    try {
      const db = await getAdminDb()
      const userDoc = await db.collection('users').doc(uid).get()
      const chatId = userDoc.data()?.settings?.telegramChatId
      if (chatId) {
        await sendTelegramMessage(chatId,
          `Wave transcript auto-processing failed for "${sessionTitle}":\n${msg.slice(0, 300)}`)
      }
    } catch { /* swallow notification errors */ }

    return NextResponse.json({ error: 'Processing failed', detail: msg }, { status: 500 })
  }
}
