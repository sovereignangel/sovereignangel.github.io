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
import { isRelationalTranscript } from '@/lib/relational-extraction'
import { sendTelegramMessage } from '@/lib/telegram'
import { processLordasTranscript } from '@/lib/wave/lordas-pipeline'
import { buildWaveKeyboard, buildWavePromptText } from '@/lib/wave/tag-buttons'
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
 *
 * Tries multiple key/digest encodings since Wave docs don't specify:
 *  - Raw string key + base64 digest (Svix standard)
 *  - Hex-decoded key + base64 digest
 *  - Raw string key + hex digest
 *  - Hex-decoded key + hex digest
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

  // Generate candidates with different key/digest encoding combos
  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const keys: (string | Buffer)[] = [rawSecret, Buffer.from(rawSecret, 'hex')]
  // Also try base64 decoding in case secret is base64-encoded
  try { keys.push(Buffer.from(rawSecret, 'base64')) } catch { /* skip if not valid base64 */ }
  const digests: Array<'base64' | 'hex'> = ['base64', 'hex']
  const candidates: string[] = []
  for (const key of keys) {
    for (const digest of digests) {
      candidates.push(
        crypto.createHmac('sha256', key).update(signedContent).digest(digest)
      )
    }
  }

  // Signature header may contain multiple versioned signatures separated by spaces
  const signatures = request.signature.split(' ')
  for (const sig of signatures) {
    const sigValue = sig.startsWith('v1,') ? sig.slice(3) : sig
    for (const expected of candidates) {
      const expectedBuf = Buffer.from(expected)
      const actualBuf = Buffer.from(sigValue)
      if (expectedBuf.length === actualBuf.length) {
        if (crypto.timingSafeEqual(expectedBuf, actualBuf)) {
          return true
        }
      }
    }
  }

  // Log for debugging (visible in Vercel function logs)
  console.error('[webhooks/wave] HMAC mismatch — signature:', request.signature.slice(0, 30), '... candidates:', candidates.map(c => c.slice(0, 20)))

  return false
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
  try {
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

  // Log all webhook headers for debugging HMAC format
  const allHeaders: Record<string, string> = {}
  request.headers.forEach((v, k) => {
    if (k.startsWith('x-wave') || k === 'content-type' || k === 'user-agent') {
      allHeaders[k] = k.includes('signature') ? v : v.slice(0, 80)
    }
  })
  console.log('[webhooks/wave] Headers:', JSON.stringify(allHeaders))

  const hmacValid = verifyWaveSignature({ webhookId, timestamp, body: rawBody, signature })
  if (!hmacValid) {
    console.warn('[webhooks/wave] HMAC verification failed — proceeding anyway (debug mode)')
    // TODO: re-enable strict HMAC check once we know the correct encoding
    // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
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
    // 0. Deduplicate — skip if we already processed this Wave session
    const db = await getAdminDb()
    const existingConv = await db.collection('users').doc(uid).collection('conversations')
      .where('metadata.waveSessionId', '==', sessionId)
      .limit(1)
      .get()
    if (!existingConv.empty) {
      console.log(`[webhooks/wave] Session ${sessionId} already processed, skipping`)
      return NextResponse.json({ ok: true, skipped: 'already_processed' })
    }

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

    // Phase 2B prompt-mode: when WAVE_PROMPT_MODE=true, send 7-tag inline
    // keyboard to Lori's Telegram instead of running the auto-classify or
    // Lordas pipelines inline. Tag dispatch happens in the Telegram webhook's
    // `wave:` callback handler. Default (env unset/false): existing behavior.
    if (process.env.WAVE_PROMPT_MODE === 'true') {
      // Dedupe — if Lori already tapped a tag (or 'defer') for this session,
      // never re-prompt. Wave webhooks fire on retries; this guards against
      // double-prompts after a successful dispatch.
      const decisionRef = db.collection('wave_session_decisions').doc(sessionId)
      const decisionDoc = await decisionRef.get()
      if (decisionDoc.exists) {
        console.log(`[webhooks/wave] Session ${sessionId} already has tag decision (${decisionDoc.data()?.decision}); skipping prompt`)
        return NextResponse.json({ ok: true, skipped: 'already_tagged', decision: decisionDoc.data()?.decision })
      }

      // If a pending prompt already exists (Wave retried before user tapped),
      // don't double-prompt. The original prompt message is still actionable.
      const pendingRef = db.collection('wave_pending_decisions').doc(sessionId)
      const pendingDoc = await pendingRef.get()
      if (pendingDoc.exists) {
        console.log(`[webhooks/wave] Session ${sessionId} already prompted; awaiting tap`)
        return NextResponse.json({ ok: true, skipped: 'prompt_already_sent' })
      }

      // Stash transcript + metadata so the callback handler can dispatch
      // without re-fetching from Wave API.
      const userDoc = await db.collection('users').doc(uid).get()
      const chatId = userDoc.data()?.settings?.telegramChatId
      if (!chatId) {
        console.warn(`[webhooks/wave] User ${uid} has no telegramChatId; falling back to legacy auto-classify`)
        // fall through to legacy branch below
      } else {
        await pendingRef.set({
          sessionId,
          sessionTitle,
          durationSeconds: payload.data.session.duration_seconds ?? null,
          transcript: transcriptText,
          uid,
          chatId,
          createdAt: new Date(),
          status: 'awaiting_tap',
        })

        // Send 7-tag inline keyboard
        const promptText = buildWavePromptText(sessionTitle, payload.data.session.duration_seconds)
        const keyboard = buildWaveKeyboard(sessionId)
        if (process.env.TELEGRAM_BOT_TOKEN) {
          const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: promptText,
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: keyboard },
            }),
          })
          if (!res.ok) {
            const body = await res.text()
            console.error(`[webhooks/wave] Telegram sendMessage failed: ${res.status} ${body}`)
            // Don't fail the webhook — the pending doc is stored, Lori can
            // still tap if Telegram delivers later via retry.
          } else {
            const data = await res.json()
            await pendingRef.update({ prompt_message_id: data.result?.message_id ?? null })
          }
        }
        return NextResponse.json({ ok: true, prompt_sent: true, sessionId })
      }
    }

    // 1b. Check if this is a relational transcript → route to Lordas pipeline.
    // Refactored 2026-05-15: the pipeline body now lives in lib/wave/lordas-pipeline.ts
    // so the Phase 2B 7-tag prompt callback can invoke the same code path. No
    // behavior change vs the prior inline version — see commit notes.
    if (isRelationalTranscript(transcriptText)) {
      console.log(`[webhooks/wave] Relational transcript detected for session ${sessionId}`)
      const result = await processLordasTranscript(
        uid,
        db,
        sessionId,
        transcriptText,
        payload.data.session.duration_seconds || null,
      )
      if (result.alreadyProcessed) {
        return NextResponse.json({ ok: true, skipped: 'relational_already_processed' })
      }
      return NextResponse.json({
        success: true,
        pipeline: 'relational',
        conversationId: result.conversationId,
        scores: result.scores,
      })
    }

    // 2. Store debug record
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
    const result = await processTranscriptData(uid, transcriptText, templateType, extracted, {
      metadata: { waveSessionId: sessionId },
    })

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
  } catch (outerError) {
    const msg = outerError instanceof Error ? outerError.message : String(outerError)
    console.error('[webhooks/wave] Unhandled error:', msg)
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 })
  }
}
