/**
 * Ingest pipeline: transcript in, insights out.
 *
 * Given a raw conversation transcript, this runs the extraction engine,
 * computes pillar scores, and writes four things to Firestore under
 * connection_insights/{uid}/:
 *   - conversations   (the session + its extraction + scores)
 *   - themes          (recurring friction topics, keyed by life domain)
 *   - values          (values surfaced over time)
 *   - snapshots       (rolling pillar averages, keyed by date)
 *
 * Both the paste-a-transcript route and the optional Wave.ai webhook call this.
 * Idempotent when a sourceId is supplied — re-ingesting the same source returns
 * the existing conversation instead of creating a duplicate.
 */

import type { Firestore } from 'firebase-admin/firestore'
import { extractRelationalMetrics, computePillarScores, type PartnerNames } from '@/lib/connectioninsights/extraction'

export interface PipelineResult {
  ok: true
  conversationId: string
  scores: ReturnType<typeof computePillarScores>
  date: string
  alreadyProcessed?: boolean
}

export async function processTranscript(
  uid: string,
  db: Firestore,
  transcriptText: string,
  names: PartnerNames,
  opts: { sourceId?: string; durationSeconds?: number | null } = {},
): Promise<PipelineResult> {
  const sourceId = opts.sourceId || ''
  const userRef = db.collection('connection_insights').doc(uid)

  // Deduplicate against existing conversations when a source id is given.
  if (sourceId) {
    const existing = await userRef.collection('conversations')
      .where('sourceId', '==', sourceId)
      .limit(1)
      .get()
    if (!existing.empty) {
      const doc = existing.docs[0]
      const d = doc.data()
      return { ok: true, conversationId: doc.id, scores: d.scores, date: d.date, alreadyProcessed: true }
    }
  }

  // Extract + score.
  const extraction = await extractRelationalMetrics(transcriptText, names)
  const scores = computePillarScores(extraction)
  const date = extraction.date || new Date().toISOString().slice(0, 10)

  // Save the conversation.
  const convRef = userRef.collection('conversations').doc()
  await convRef.set({
    id: convRef.id,
    date,
    durationMinutes: extraction.durationMinutes || Math.round((opts.durationSeconds || 0) / 60),
    sourceId,
    transcriptText,
    extraction,
    scores,
    createdAt: new Date(),
  })

  // Update the theme for this life domain.
  const themeRef = userRef.collection('themes').doc(extraction.domain)
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
        a: extraction.priorityConflicts[0]?.positionA || '',
        b: extraction.priorityConflicts[0]?.positionB || '',
      },
      updatedAt: new Date(),
    })
  }

  // Accumulate values.
  for (const val of extraction.valuesExpressed) {
    const valId = `${val.by}_${val.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`
    const valRef = userRef.collection('values').doc(valId)
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

  // Save a rolling snapshot for this date.
  const recentSnap = await userRef.collection('conversations')
    .orderBy('date', 'desc').limit(5).get()
  const recentScores = recentSnap.docs.map(d => d.data().scores)
  const n = recentScores.length || 1
  const rolling = {
    safety: Math.round(recentScores.reduce((s, c) => s + c.safety, 0) / n * 100) / 100,
    growth: Math.round(recentScores.reduce((s, c) => s + c.growth, 0) / n * 100) / 100,
    alignment: Math.round(recentScores.reduce((s, c) => s + c.alignment, 0) / n * 100) / 100,
    composite: Math.round(recentScores.reduce((s, c) => s + c.composite, 0) / n * 100) / 100,
  }
  await userRef.collection('snapshots').doc(date).set({
    date,
    ...scores,
    conversationCount: n,
    rollingAverage: rolling,
  })

  return { ok: true, conversationId: convRef.id, scores, date }
}
