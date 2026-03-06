/**
 * Overnight Orchestrator
 *
 * Three phases running while you sleep:
 *
 *   HARVEST  (11pm-1am ET)  — Ingest signals from all four streams
 *   PROCESS  (1am-7am ET)   — Score, classify, queue papers, extract beliefs
 *   SYNTHESIS (7am-9am ET)  — Cross-link, generate briefing, build teach-back queue
 *
 * Each phase is triggered by a separate Vercel cron job.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  OvernightPhaseResult,
  ConvictionShift,
  CrossDomainLink,
  ThesisBriefing,
  StreamBriefing,
  TeachBackItem,
  SignalStream,
} from '@/lib/types/overnight'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// PHASE 1: HARVEST (11pm - 1am ET)
// ---------------------------------------------------------------------------

export async function runHarvestPhase(uid: string): Promise<OvernightPhaseResult> {
  console.log('[overnight] HARVEST phase starting...')

  const results: OvernightPhaseResult = {
    signalsIngested: 0,
    papersFound: 0,
    postsScraped: 0,
    journalEntriesParsed: 0,
  }

  const errors: string[] = []

  // 1. Sync investor/founder feeds (market stream)
  try {
    const { syncInvestorFeeds } = await import('@/lib/etl/investor-feeds')
    const count = await syncInvestorFeeds(uid)
    results.postsScraped = count
    results.signalsIngested! += count
  } catch (e) {
    errors.push(`Investor feeds: ${(e as Error).message}`)
  }

  // 2. Sync research papers across three domains
  try {
    const { syncResearchPapers } = await import('@/lib/etl/research-papers')
    const { saved, queued } = await syncResearchPapers(uid)
    results.papersFound = saved
    results.papersQueued = queued
    results.signalsIngested! += saved
  } catch (e) {
    errors.push(`Research papers: ${(e as Error).message}`)
  }

  // 3. Existing ETL syncs (Garmin, Calendar, GitHub, etc.)
  try {
    const { syncAllData } = await import('@/lib/etl/sync-all')
    await syncAllData()
  } catch (e) {
    errors.push(`Daily sync: ${(e as Error).message}`)
  }

  console.log(`[overnight] HARVEST complete: ${results.signalsIngested} signals, ${results.papersFound} papers, ${results.postsScraped} posts`)

  return results
}

// ---------------------------------------------------------------------------
// PHASE 2: PROCESS (1am - 7am ET)
// ---------------------------------------------------------------------------

export async function runProcessPhase(uid: string): Promise<OvernightPhaseResult> {
  console.log('[overnight] PROCESS phase starting...')

  const results: OvernightPhaseResult = {
    beliefsExtracted: 0,
    ventureUpdates: 0,
    convictionShifts: [],
  }

  // 1. Extract observations from journal (observation stream)
  try {
    const { extractJournalObservations } = await import('@/lib/etl/journal-observations')
    const obs = await extractJournalObservations(uid)
    results.beliefsExtracted = obs.beliefs.length

    // Convert beliefs to conviction shifts
    for (const belief of obs.beliefs) {
      results.convictionShifts!.push({
        belief: belief.belief,
        direction: 'new',
        evidence: belief.observation,
        stream: 'observation',
      })
    }
  } catch (e) {
    console.error('[overnight] Journal extraction error:', e)
  }

  // 2. Scan venture signals (venture stream)
  try {
    const { scanVentureSignals } = await import('@/lib/etl/venture-signals')
    const ventureSignals = await scanVentureSignals(uid)
    results.ventureUpdates = ventureSignals.length

    for (const vs of ventureSignals) {
      if (vs.sentiment !== 'neutral') {
        results.convictionShifts!.push({
          belief: `${vs.ventureName}: ${vs.implication}`,
          direction: vs.sentiment === 'bullish' ? 'stronger' : 'weaker',
          evidence: vs.summary,
          stream: 'venture',
        })
      }
    }
  } catch (e) {
    console.error('[overnight] Venture signal scan error:', e)
  }

  // 3. Check research papers against existing beliefs (research stream)
  try {
    const db = await getAdminDb()
    const signalSnap = await db.collection('users').doc(uid).collection('external_signals')
      .where('status', '==', 'inbox')
      .where('readStatus', '==', 'unread')
      .where('source', '==', 'arxiv')
      .orderBy('relevanceScore', 'desc')
      .limit(5)
      .get()

    const beliefSnap = await db.collection('users').doc(uid).collection('beliefs')
      .where('status', '==', 'active')
      .limit(20)
      .get()

    if (!signalSnap.empty && !beliefSnap.empty) {
      const papers = signalSnap.docs.map(d => d.data())
      const beliefs = beliefSnap.docs.map(d => d.data())

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const prompt = `Given these research papers and existing beliefs, identify if any paper strengthens or weakens any belief.

PAPERS:
${papers.map(p => `- ${p.title}: ${p.aiSummary || p.keyTakeaway}`).join('\n')}

BELIEFS:
${beliefs.map(b => `- ${b.statement} (confidence: ${b.confidence})`).join('\n')}

Return JSON only: { "shifts": [{ "belief": "...", "direction": "stronger|weaker", "evidence": "paper title + why" }] }`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(text)

      for (const shift of (parsed.shifts || [])) {
        results.convictionShifts!.push({
          belief: shift.belief,
          direction: shift.direction,
          evidence: shift.evidence,
          stream: 'research',
        })
      }
    }
  } catch (e) {
    console.error('[overnight] Research-belief matching error:', e)
  }

  console.log(`[overnight] PROCESS complete: ${results.beliefsExtracted} beliefs, ${results.ventureUpdates} venture signals, ${results.convictionShifts?.length} conviction shifts`)

  return results
}

// ---------------------------------------------------------------------------
// PHASE 3: SYNTHESIS (7am - 9am ET)
// ---------------------------------------------------------------------------

export async function runSynthesisPhase(uid: string): Promise<ThesisBriefing> {
  console.log('[overnight] SYNTHESIS phase starting...')

  const db = await getAdminDb()
  const todayKey = today()

  // Gather all overnight data
  const [signalSnap, paperSnap, beliefSnap, ventureSignalSnap] = await Promise.all([
    db.collection('users').doc(uid).collection('external_signals')
      .where('status', '==', 'inbox')
      .where('readStatus', '==', 'unread')
      .orderBy('relevanceScore', 'desc')
      .limit(15)
      .get(),
    db.collection('users').doc(uid).collection('paper_implementations')
      .where('status', '==', 'queued')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get(),
    db.collection('users').doc(uid).collection('beliefs')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get(),
    db.collection('users').doc(uid).collection('venture_signals')
      .where('date', '==', todayKey)
      .get(),
  ])

  // Classify signals by stream
  const researchSignals = signalSnap.docs
    .filter(d => d.data().source === 'arxiv')
    .map(d => ({ title: d.data().title, summary: d.data().aiSummary || d.data().keyTakeaway, relevance: d.data().relevanceScore }))

  const marketSignals = signalSnap.docs
    .filter(d => ['blog', 'twitter_list', 'edgar'].includes(d.data().source))
    .map(d => ({ title: d.data().title, summary: d.data().aiSummary || d.data().keyTakeaway, relevance: d.data().relevanceScore }))

  const beliefs = beliefSnap.docs.map(d => ({
    statement: d.data().statement,
    confidence: d.data().confidence,
    observation: d.data().observation,
  }))

  const ventureSignals = ventureSignalSnap.docs.map(d => d.data())

  // Build stream briefings
  const streams: ThesisBriefing['streams'] = {
    research: buildStreamBriefing('research', researchSignals),
    market: buildStreamBriefing('market', marketSignals),
    observation: buildStreamBriefing('observation', beliefs.map(b => ({
      title: b.statement,
      summary: b.observation || '',
      relevance: b.confidence || 0.5,
    }))),
    venture: buildStreamBriefing('venture', ventureSignals.map(v => ({
      title: (v.ventureName as string) || '',
      summary: (v.implication as string) || '',
      relevance: (v.sentiment as string) === 'bullish' ? 0.8 : 0.5,
    }))),
  }

  // Generate cross-domain synthesis with AI
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const synthesisPrompt = `You are a chief intelligence officer synthesizing overnight signals across four domains.

RESEARCH PAPERS (${researchSignals.length}):
${researchSignals.slice(0, 5).map(s => `- ${s.title}: ${s.summary}`).join('\n') || 'None'}

MARKET SIGNALS (${marketSignals.length}):
${marketSignals.slice(0, 5).map(s => `- ${s.title}: ${s.summary}`).join('\n') || 'None'}

JOURNAL OBSERVATIONS / BELIEFS (${beliefs.length}):
${beliefs.slice(0, 5).map(b => `- ${b.statement} (confidence: ${b.confidence})`).join('\n') || 'None'}

VENTURE SIGNALS (${ventureSignals.length}):
${ventureSignals.slice(0, 5).map(v => `- ${v.ventureName}: ${v.implication} (${v.sentiment})`).join('\n') || 'None'}

PAPERS QUEUED FOR REPRODUCTION (${paperSnap.size}):
${paperSnap.docs.slice(0, 3).map(d => `- ${d.data().title}`).join('\n') || 'None'}

Generate:
1. HEADLINE: One sentence capturing the most important overnight finding
2. CROSS-DOMAIN LINKS: Connections between signals from different streams (max 3)
3. EMERGING PATTERNS: 2-3 themes that span multiple streams
4. TEACH-BACK QUEUE: 2-3 items you've encountered but need to deeply understand before you can speak to them. For each, provide a concept, the mechanism to understand, and a test question.
5. DISCERNMENT PROMPT: A thought exercise connecting the most important signal to existing beliefs

Return ONLY valid JSON:
{
  "headline": "...",
  "crossLinks": [
    { "from": { "stream": "research", "item": "..." }, "to": { "stream": "market", "item": "..." }, "insight": "...", "strength": 0.8 }
  ],
  "emergingPatterns": ["...", "..."],
  "teachBackQueue": [
    { "title": "...", "stream": "research", "concept": "...", "mechanism": "...", "testQuestion": "...", "status": "pending" }
  ],
  "discernmentPrompt": "..."
}`

  let synthesisResult = {
    headline: 'Overnight processing complete',
    crossLinks: [] as CrossDomainLink[],
    emergingPatterns: [] as string[],
    teachBackQueue: [] as TeachBackItem[],
    discernmentPrompt: 'What is the highest-leverage action you could take today?',
  }

  try {
    const result = await model.generateContent(synthesisPrompt)
    const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(text)
    synthesisResult = {
      headline: parsed.headline || synthesisResult.headline,
      crossLinks: parsed.crossLinks || [],
      emergingPatterns: parsed.emergingPatterns || [],
      teachBackQueue: parsed.teachBackQueue || [],
      discernmentPrompt: parsed.discernmentPrompt || synthesisResult.discernmentPrompt,
    }
  } catch (e) {
    console.error('[overnight] Synthesis AI failed:', e)
  }

  // Fetch conviction shifts from process phase run
  const processRunSnap = await db.collection('users').doc(uid).collection('overnight_runs')
    .where('date', '==', todayKey)
    .where('phase', '==', 'process')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get()

  const convictionShifts: ConvictionShift[] = processRunSnap.empty
    ? []
    : (processRunSnap.docs[0].data().results?.convictionShifts || [])

  const totalSignals = researchSignals.length + marketSignals.length + beliefs.length + ventureSignals.length

  const briefing: ThesisBriefing = {
    date: todayKey,
    generatedAt: new Date().toISOString(),
    headline: synthesisResult.headline,
    signalsProcessed: totalSignals,
    actionRequired: synthesisResult.teachBackQueue.length + synthesisResult.crossLinks.length,
    streams,
    convictionShifts,
    crossLinks: synthesisResult.crossLinks,
    emergingPatterns: synthesisResult.emergingPatterns,
    teachBackQueue: synthesisResult.teachBackQueue,
    discernmentPrompt: synthesisResult.discernmentPrompt,
    createdAt: null as unknown as import('firebase/firestore').Timestamp,
  }

  // Save briefing
  const briefRef = db.collection('users').doc(uid).collection('thesis_briefings').doc(todayKey)
  await briefRef.set({
    ...briefing,
    createdAt: new Date(),
  })

  console.log(`[overnight] SYNTHESIS complete: ${totalSignals} signals → ${synthesisResult.crossLinks.length} cross-links, ${synthesisResult.teachBackQueue.length} teach-back items`)

  return briefing
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildStreamBriefing(
  stream: SignalStream,
  items: Array<{ title: string; summary: string; relevance: number }>
): StreamBriefing {
  return {
    stream,
    itemCount: items.length,
    topItems: items.slice(0, 3).map(item => ({
      title: item.title,
      summary: item.summary,
      relevance: item.relevance,
    })),
    status: items.length > 0 ? 'active' : 'quiet',
  }
}
