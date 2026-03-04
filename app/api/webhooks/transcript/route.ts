/**
 * Generic transcript webhook endpoint.
 * Accepts raw transcript text from any source (Fathom webhooks, manual curl, etc.),
 * auto-classifies the template type, extracts structured data,
 * saves to Firestore, and sends a Telegram notification.
 *
 * For Wave.ai, prefer /api/webhooks/wave which uses HMAC auth and fetches
 * transcripts directly from the Wave API with speaker attribution.
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractFromTranscript, classifyTranscriptType } from '@/lib/ai-extraction'
import { processTranscriptData, formatTranscriptSummary } from '@/lib/transcript-processing'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'
export const maxDuration = 120

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

export async function POST(request: NextRequest) {
  // Auth: Bearer token
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.TRANSCRIPT_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = process.env.TRANSCRIPT_WEBHOOK_UID
  if (!uid) {
    return NextResponse.json({ error: 'TRANSCRIPT_WEBHOOK_UID not configured' }, { status: 500 })
  }

  let debugRef: FirebaseFirestore.DocumentReference | null = null

  try {
    const body = await request.json()
    const {
      transcriptText,
      source,
      metadata,
    }: {
      transcriptText: string
      source: string
      metadata?: Record<string, unknown>
    } = body

    if (!transcriptText || transcriptText.trim().length < 100) {
      return NextResponse.json({ error: 'Transcript too short (min 100 chars)' }, { status: 400 })
    }

    // Store raw input for debugging
    const db = await getAdminDb()
    debugRef = db.collection('users').doc(uid).collection('transcript_drafts').doc()
    await debugRef.set({
      text: transcriptText.slice(0, 500), // store preview only (full text goes to conversation doc)
      source: source || 'unknown',
      metadata: metadata || null,
      receivedAt: new Date(),
      status: 'processing',
    })

    // 1. Auto-classify transcript type
    const templateType = await classifyTranscriptType(transcriptText)

    // 2. Extract structured data
    const extracted = await extractFromTranscript(transcriptText, templateType)

    // 3. Process and save all data
    const result = await processTranscriptData(uid, transcriptText, templateType, extracted)

    // 4. Update debug record
    await debugRef.update({
      status: 'completed',
      templateType,
      title: result.title,
      counts: result.counts,
      processedAt: new Date(),
    })

    // 5. Send Telegram notification
    const userDoc = await db.collection('users').doc(uid).get()
    const chatId = userDoc.data()?.settings?.telegramChatId
    if (chatId) {
      const summary = formatTranscriptSummary(result, {
        source: source || 'webhook',
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
    console.error('[webhooks/transcript] Error:', msg)

    // Update debug record with error
    if (debugRef) {
      try { await debugRef.update({ status: 'error', error: msg.slice(0, 500) }) } catch { /* ignore */ }
    }

    // Attempt error notification via Telegram
    try {
      const db = await getAdminDb()
      const userDoc = await db.collection('users').doc(uid).get()
      const chatId = userDoc.data()?.settings?.telegramChatId
      if (chatId) {
        await sendTelegramMessage(chatId, `Transcript auto-processing failed: ${msg.slice(0, 300)}`)
      }
    } catch { /* swallow notification errors */ }

    return NextResponse.json({ error: 'Processing failed', detail: msg }, { status: 500 })
  }
}
