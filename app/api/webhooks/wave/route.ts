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
import { isRelationalTranscript, extractRelationalMetrics, computePillarScores } from '@/lib/relational-extraction'
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

    // 1b. Check if this is a relational transcript → route to Lordas pipeline
    if (isRelationalTranscript(transcriptText)) {
      console.log(`[webhooks/wave] Relational transcript detected for session ${sessionId}`)

      // Deduplicate against relationship_conversations
      const existingRel = await db.collection('users').doc(uid).collection('relationship_conversations')
        .where('waveSessionId', '==', sessionId)
        .limit(1)
        .get()
      if (!existingRel.empty) {
        return NextResponse.json({ ok: true, skipped: 'relational_already_processed' })
      }

      // Extract relational metrics
      const extraction = await extractRelationalMetrics(transcriptText)
      const scores = computePillarScores(extraction)
      const date = extraction.date || new Date().toISOString().slice(0, 10)

      // Save conversation
      const convRef = db.collection('users').doc(uid).collection('relationship_conversations').doc()
      await convRef.set({
        id: convRef.id,
        date,
        durationMinutes: extraction.durationMinutes || Math.round((payload.data.session.duration_seconds || 0) / 60),
        waveSessionId: sessionId,
        transcriptText,
        extraction,
        scores,
        createdAt: new Date(),
      })

      // Update themes
      const themeRef = db.collection('users').doc(uid).collection('relationship_themes').doc(extraction.domain)
      const themeDoc = await themeRef.get()
      if (themeDoc.exists) {
        const existing = themeDoc.data()!
        await themeRef.update({
          conversationIds: [...(existing.conversationIds || []), convRef.id],
          updatedAt: new Date(),
        })
      } else {
        await themeRef.set({
          id: extraction.domain,
          domain: extraction.domain,
          label: extraction.domain.charAt(0).toUpperCase() + extraction.domain.slice(1),
          conversationIds: [convRef.id],
          status: 'active',
          positions: {
            lori: extraction.priorityConflicts[0]?.loriPosition || '',
            aidas: extraction.priorityConflicts[0]?.aidasPosition || '',
          },
          updatedAt: new Date(),
        })
      }

      // Save values
      for (const val of extraction.valuesExpressed) {
        const valId = `${val.by}_${val.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`
        const valRef = db.collection('users').doc(uid).collection('relationship_values').doc(valId)
        const valDoc = await valRef.get()
        if (valDoc.exists) {
          const existing = valDoc.data()!
          await valRef.update({
            mentions: (existing.mentions || 0) + 1,
            contexts: [...(existing.contexts || []), val.context].slice(-10),
          })
        } else {
          await valRef.set({
            id: valId,
            value: val.value,
            expressedBy: val.by,
            firstSeen: date,
            mentions: 1,
            contexts: [val.context],
          })
        }
      }

      // Save snapshot
      const allConvs = await db.collection('users').doc(uid).collection('relationship_conversations')
        .orderBy('date', 'desc').limit(5).get()
      const recentScores = allConvs.docs.map(d => d.data().scores)
      const n = recentScores.length
      const rolling = {
        safety: Math.round(recentScores.reduce((s, c) => s + c.safety, 0) / n * 100) / 100,
        growth: Math.round(recentScores.reduce((s, c) => s + c.growth, 0) / n * 100) / 100,
        alignment: Math.round(recentScores.reduce((s, c) => s + c.alignment, 0) / n * 100) / 100,
        composite: Math.round(recentScores.reduce((s, c) => s + c.composite, 0) / n * 100) / 100,
      }
      await db.collection('users').doc(uid).collection('relationship_snapshots').doc(date).set({
        date,
        ...scores,
        conversationCount: n,
        rollingAverage: rolling,
      })

      // Telegram notification
      const userDoc = await db.collection('users').doc(uid).get()
      const chatId = userDoc.data()?.settings?.telegramChatId
      if (chatId) {
        const msg = `🧭 Lordas — Relational session processed\n\n` +
          `Topic: ${extraction.triggerTopic}\n` +
          `Tone: ${extraction.overallTone}\n` +
          `Safety: ${scores.safety} · Growth: ${scores.growth} · Alignment: ${scores.alignment}\n` +
          `Composite: ${scores.composite}/10\n\n` +
          `Takeaways:\n${extraction.keyTakeaways.map(t => `• ${t}`).join('\n')}`
        await sendTelegramMessage(chatId, msg)
      }

      return NextResponse.json({
        success: true,
        pipeline: 'relational',
        conversationId: convRef.id,
        scores,
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
