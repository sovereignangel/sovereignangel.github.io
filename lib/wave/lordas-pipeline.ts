/**
 * Lordas relational-transcript pipeline.
 *
 * Extracted from app/api/webhooks/wave/route.ts (2026-05-15) so it can be
 * called from both the wave webhook's auto-classify path AND from the
 * Phase 2B Telegram callback when Lori taps the [Lordas] tag.
 *
 * Behavior is byte-identical to the prior inline implementation. The only
 * change is function-extraction; no logic changes. If you find a divergence,
 * the inline version was authoritative — fix this file, not the other.
 */

import type { Firestore } from 'firebase-admin/firestore'
import { extractRelationalMetrics, computePillarScores } from '@/lib/relational-extraction'
import { sendTelegramMessage } from '@/lib/telegram'

export interface LordasPipelineResult {
  ok: true
  conversationId: string
  scores: ReturnType<typeof computePillarScores>
  alreadyProcessed?: boolean
}

/**
 * Run the full Lordas pipeline for a Wave session known to be relational.
 * Idempotent — if a conversation with this waveSessionId already exists,
 * returns {ok:true, alreadyProcessed:true} without re-processing.
 */
export async function processLordasTranscript(
  uid: string,
  db: Firestore,
  sessionId: string,
  transcriptText: string,
  sessionDurationSeconds: number | null,
): Promise<LordasPipelineResult> {
  // Deduplicate against relationship_conversations
  const existingRel = await db.collection('users').doc(uid).collection('relationship_conversations')
    .where('waveSessionId', '==', sessionId)
    .limit(1)
    .get()
  if (!existingRel.empty) {
    const doc = existingRel.docs[0]
    return { ok: true, conversationId: doc.id, scores: doc.data().scores, alreadyProcessed: true }
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
    durationMinutes: extraction.durationMinutes || Math.round((sessionDurationSeconds || 0) / 60),
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
    const msg = `Lordas — Relational session processed\n\n` +
      `Topic: ${extraction.triggerTopic}\n` +
      `Tone: ${extraction.overallTone}\n` +
      `Safety: ${scores.safety} · Growth: ${scores.growth} · Alignment: ${scores.alignment}\n` +
      `Composite: ${scores.composite}/10\n\n` +
      `Takeaways:\n${extraction.keyTakeaways.map(t => `• ${t}`).join('\n')}`
    await sendTelegramMessage(chatId, msg)
  }

  return { ok: true, conversationId: convRef.id, scores }
}
