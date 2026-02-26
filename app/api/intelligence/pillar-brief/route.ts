/**
 * Pillar Brief Generation API
 *
 * POST — Generate an AI intelligence brief for a specific thesis pillar.
 * Aggregates signals, journal entries, ventures, and decisions, then
 * synthesizes via LLM into a structured brief.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { callLLM } from '@/lib/llm'
import type { ThesisPillarExtended } from '@/lib/types/pillar-brief'

export const runtime = 'nodejs'
export const maxDuration = 120

const VALID_PILLARS: ThesisPillarExtended[] = ['ai', 'markets', 'mind', 'emergence']

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysAgoDate(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return localDateString(d)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeGet<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch (e) { console.error('[pillar-brief] fetch error:', e); return fallback }
}

// ─── Data Fetchers ──────────────────────────────────────────────────────────

async function fetchSignalsByPillar(uid: string, pillar: string, limit = 10) {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('external_signals')
    .where('thesisPillars', 'array-contains', pillar)
    .where('status', '==', 'inbox')
    .orderBy('relevanceScore', 'desc')
    .limit(limit)
    .get()

  return snap.docs.map(d => {
    const data = d.data()
    return {
      title: (data.title as string) || '',
      source: (data.source as string) || '',
      summary: (data.aiSummary as string) || (data.keyTakeaway as string) || '',
      relevance: (data.relevanceScore as number) || 0,
      pillars: (data.thesisPillars as string[]) || [],
    }
  })
}

async function fetchRecentJournals(uid: string, days: number = 7) {
  const db = await getAdminDb()
  const entries: Array<{ date: string; entry: string }> = []
  for (let i = 0; i < days; i++) {
    const date = daysAgoDate(i)
    const snap = await db.collection('users').doc(uid).collection('daily_logs').doc(date).get()
    if (snap.exists) {
      const data = snap.data()
      const entry = (data?.journalEntry as string) || ''
      if (entry.trim()) entries.push({ date, entry: entry.slice(0, 1000) })
    }
  }
  return entries
}

async function fetchActiveVentures(uid: string) {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('ventures')
    .where('stage', 'in', ['idea', 'specced', 'validated', 'prd_draft', 'building', 'deployed'])
    .limit(10)
    .get()

  return snap.docs.map(d => {
    const data = d.data()
    return {
      name: data.spec?.name || 'Untitled',
      oneLiner: data.spec?.oneLiner || '',
      stage: (data.stage as string) || '',
      pillars: (data.spec?.thesisPillars as string[]) || [],
      score: (data.score as number) ?? null,
    }
  })
}

async function fetchRecentDecisions(uid: string) {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('decisions')
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get()

  return snap.docs.map(d => {
    const data = d.data()
    return {
      title: (data.title as string) || '',
      domain: (data.domain as string) || '',
      hypothesis: (data.hypothesis as string) || '',
      confidence: (data.confidenceLevel as number) || 0,
    }
  })
}

async function fetchRecentBeliefs(uid: string) {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('beliefs')
    .orderBy('createdAt', 'desc')
    .limit(8)
    .get()

  return snap.docs.map(d => {
    const data = d.data()
    return {
      statement: (data.statement as string) || '',
      confidence: (data.confidence as number) || 0,
      domain: (data.domain as string) || '',
    }
  })
}

async function fetchPsyCapTrend(uid: string) {
  const db = await getAdminDb()
  const scores: Array<{ date: string; hope: number; efficacy: number; resilience: number; optimism: number }> = []
  for (let i = 0; i < 7; i++) {
    const date = daysAgoDate(i)
    const snap = await db.collection('users').doc(uid).collection('daily_logs').doc(date).get()
    if (snap.exists) {
      const data = snap.data()
      if (data?.hope || data?.efficacy || data?.resilience || data?.optimism) {
        scores.push({
          date,
          hope: (data.hope as number) || 0,
          efficacy: (data.efficacy as number) || 0,
          resilience: (data.resilience as number) || 0,
          optimism: (data.optimism as number) || 0,
        })
      }
    }
  }
  return scores
}

async function fetchNervousSystemPattern(uid: string) {
  const db = await getAdminDb()
  const states: Array<{ date: string; state: string }> = []
  for (let i = 0; i < 7; i++) {
    const date = daysAgoDate(i)
    const snap = await db.collection('users').doc(uid).collection('daily_logs').doc(date).get()
    if (snap.exists) {
      const ns = snap.data()?.nervousSystemState as string
      if (ns) states.push({ date, state: ns })
    }
  }
  return states
}

// ─── Prompt Builders ────────────────────────────────────────────────────────

function buildAIPrompt(signals: ReturnType<typeof fetchSignalsByPillar> extends Promise<infer T> ? T : never, journals: Array<{ date: string; entry: string }>, ventures: ReturnType<typeof fetchActiveVentures> extends Promise<infer T> ? T : never, decisions: ReturnType<typeof fetchRecentDecisions> extends Promise<infer T> ? T : never) {
  const aiVentures = ventures.filter(v => v.pillars.includes('ai'))
  return `You are a research analyst specializing in Computational Cognitive Science × Reinforcement Learning. Generate a daily intelligence brief.

RESEARCH DIRECTION: How does intelligence structure itself to expand agency over time?
KEY DOMAINS: Empowerment theory, intrinsic motivation, hierarchical RL, meta-RL, active inference, world models, multi-objective RL

RECENT SIGNALS (${signals.length}):
${signals.map(s => `- [${s.source}] ${s.title} (relevance: ${s.relevance.toFixed(2)})\n  ${s.summary}`).join('\n') || 'None'}

JOURNAL EXCERPTS (last 7 days):
${journals.map(j => `[${j.date}]: ${j.entry}`).join('\n\n') || 'No journal entries'}

ACTIVE AI VENTURES (${aiVentures.length}):
${aiVentures.map(v => `- ${v.name}: ${v.oneLiner} (stage: ${v.stage})`).join('\n') || 'None'}

ACTIVE DECISIONS:
${decisions.filter(d => d.domain === 'thesis').map(d => `- ${d.title} (confidence: ${d.confidence}%): ${d.hypothesis}`).join('\n') || 'None'}

${BRIEF_FORMAT_INSTRUCTIONS}`
}

function buildMarketsPrompt(signals: ReturnType<typeof fetchSignalsByPillar> extends Promise<infer T> ? T : never, journals: Array<{ date: string; entry: string }>, ventures: ReturnType<typeof fetchActiveVentures> extends Promise<infer T> ? T : never, decisions: ReturnType<typeof fetchRecentDecisions> extends Promise<infer T> ? T : never) {
  return `You are a portfolio intelligence analyst. Generate a daily markets intelligence brief focused on capital allocation, 10-K patterns, and venture economics.

MARKET SIGNALS (${signals.length}):
${signals.map(s => `- [${s.source}] ${s.title} (relevance: ${s.relevance.toFixed(2)})\n  ${s.summary}`).join('\n') || 'None'}

JOURNAL EXCERPTS (revenue/market mentions):
${journals.map(j => `[${j.date}]: ${j.entry}`).join('\n\n') || 'No journal entries'}

VENTURE PIPELINE (${ventures.length}):
${ventures.map(v => `- ${v.name}: ${v.oneLiner} (stage: ${v.stage}, score: ${v.score ?? 'n/a'})`).join('\n') || 'None'}

ACTIVE DECISIONS:
${decisions.filter(d => ['portfolio', 'revenue'].includes(d.domain)).map(d => `- ${d.title} (confidence: ${d.confidence}%): ${d.hypothesis}`).join('\n') || 'None'}

${BRIEF_FORMAT_INSTRUCTIONS}`
}

function buildMindPrompt(journals: Array<{ date: string; entry: string }>, decisions: ReturnType<typeof fetchRecentDecisions> extends Promise<infer T> ? T : never, beliefs: ReturnType<typeof fetchRecentBeliefs> extends Promise<infer T> ? T : never, psycap: ReturnType<typeof fetchPsyCapTrend> extends Promise<infer T> ? T : never, nsPattern: ReturnType<typeof fetchNervousSystemPattern> extends Promise<infer T> ? T : never) {
  return `You are a cognitive coach and decision quality analyst. Generate a daily mind intelligence brief focused on journal patterns, decision calibration, belief evolution, and nervous system regulation.

JOURNAL ENTRIES (last 14 days):
${journals.map(j => `[${j.date}]: ${j.entry}`).join('\n\n') || 'No journal entries'}

ACTIVE DECISIONS (${decisions.length}):
${decisions.map(d => `- ${d.title} (${d.domain}, confidence: ${d.confidence}%): ${d.hypothesis}`).join('\n') || 'None'}

RECENT BELIEFS (${beliefs.length}):
${beliefs.map(b => `- "${b.statement}" (confidence: ${b.confidence}%, domain: ${b.domain})`).join('\n') || 'None'}

PSYCAP TREND (Hope/Efficacy/Resilience/Optimism):
${psycap.map(p => `[${p.date}]: H=${p.hope} E=${p.efficacy} R=${p.resilience} O=${p.optimism}`).join('\n') || 'No data'}

NERVOUS SYSTEM (last 7 days):
${nsPattern.map(n => `[${n.date}]: ${n.state}`).join(', ') || 'No data'}

Focus on: What recurring themes appear in the journal? Are beliefs shifting? Are decisions being made from regulated or spiked states? What patterns should the user be aware of?

${BRIEF_FORMAT_INSTRUCTIONS}`
}

function buildEmergencePrompt(signals: ReturnType<typeof fetchSignalsByPillar> extends Promise<infer T> ? T : never, journals: Array<{ date: string; entry: string }>, ventures: ReturnType<typeof fetchActiveVentures> extends Promise<infer T> ? T : never) {
  return `You are a complexity scientist and systems thinker, in the tradition of the Santa Fe Institute. Generate a daily emergence intelligence brief focused on physics, chaos theory, complex adaptive systems, and how emergence patterns connect to the user's work.

EMERGENCE SIGNALS (${signals.length}):
${signals.map(s => `- [${s.source}] ${s.title} (relevance: ${s.relevance.toFixed(2)})\n  ${s.summary}`).join('\n') || 'None'}

JOURNAL EXCERPTS (complexity/emergence mentions):
${journals.map(j => `[${j.date}]: ${j.entry}`).join('\n\n') || 'No journal entries'}

ACTIVE VENTURES (${ventures.length}):
${ventures.map(v => `- ${v.name}: ${v.oneLiner} (stage: ${v.stage})`).join('\n') || 'None'}

Focus on: Phase transitions, scaling laws, power laws, self-organization, far-from-equilibrium dynamics, network effects, and how these map to the user's ventures and thesis.

${BRIEF_FORMAT_INSTRUCTIONS}`
}

const BRIEF_FORMAT_INSTRUCTIONS = `Generate a structured intelligence brief. Return ONLY valid JSON (no markdown, no code blocks):
{
  "synthesis": "2-3 paragraph narrative synthesis. Direct, Bridgewater-style. What matters today and why.",
  "keyFindings": [
    { "finding": "The specific finding", "source": "arxiv|edgar|journal|signal|venture", "relevance": "Why this matters to the user" }
  ],
  "connections": [
    { "from": "A signal or pattern", "to": "A venture, project, or decision", "insight": "The connection insight" }
  ],
  "actionItems": [
    { "action": "Specific action to take", "priority": "high|medium", "reason": "Why now" }
  ],
  "openQuestion": "A Dalio-style 'what if I'm wrong?' question that stress-tests current assumptions"
}

Rules:
- 2-5 key findings, 1-3 connections, 1-3 action items
- Be specific, not generic. Reference actual signals and entries.
- The open question should be genuinely challenging, not rhetorical
- If data is sparse, say so honestly rather than fabricating insights`

// ─── Handler ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth
  const { uid } = auth

  try {
    const { pillar } = await request.json() as { pillar: ThesisPillarExtended }

    if (!VALID_PILLARS.includes(pillar)) {
      return NextResponse.json({ error: `Invalid pillar. Must be one of: ${VALID_PILLARS.join(', ')}` }, { status: 400 })
    }

    const today = localDateString(new Date())

    // Fetch data in parallel based on pillar
    let prompt: string
    let dataSourceCount = 0

    if (pillar === 'ai') {
      const [signals, journals, ventures, decisions] = await Promise.all([
        safeGet(() => fetchSignalsByPillar(uid, 'ai'), []),
        safeGet(() => fetchRecentJournals(uid, 7), []),
        safeGet(() => fetchActiveVentures(uid), []),
        safeGet(() => fetchRecentDecisions(uid), []),
      ])
      dataSourceCount = signals.length + journals.length + ventures.length + decisions.length
      prompt = buildAIPrompt(signals, journals, ventures, decisions)
    } else if (pillar === 'markets') {
      const [signals, journals, ventures, decisions] = await Promise.all([
        safeGet(() => fetchSignalsByPillar(uid, 'markets'), []),
        safeGet(() => fetchRecentJournals(uid, 7), []),
        safeGet(() => fetchActiveVentures(uid), []),
        safeGet(() => fetchRecentDecisions(uid), []),
      ])
      dataSourceCount = signals.length + journals.length + ventures.length + decisions.length
      prompt = buildMarketsPrompt(signals, journals, ventures, decisions)
    } else if (pillar === 'mind') {
      const [journals, decisions, beliefs, psycap, nsPattern] = await Promise.all([
        safeGet(() => fetchRecentJournals(uid, 14), []),
        safeGet(() => fetchRecentDecisions(uid), []),
        safeGet(() => fetchRecentBeliefs(uid), []),
        safeGet(() => fetchPsyCapTrend(uid), []),
        safeGet(() => fetchNervousSystemPattern(uid), []),
      ])
      dataSourceCount = journals.length + decisions.length + beliefs.length + psycap.length + nsPattern.length
      prompt = buildMindPrompt(journals, decisions, beliefs, psycap, nsPattern)
    } else {
      // emergence
      const [signals, journals, ventures] = await Promise.all([
        safeGet(() => fetchSignalsByPillar(uid, 'emergence'), []),
        safeGet(() => fetchRecentJournals(uid, 7), []),
        safeGet(() => fetchActiveVentures(uid), []),
      ])
      dataSourceCount = signals.length + journals.length + ventures.length
      prompt = buildEmergencePrompt(signals, journals, ventures)
    }

    // Generate via LLM
    const text = await callLLM(prompt, { temperature: 0.4, maxTokens: 4000 })
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const brief = {
      synthesis: String(parsed.synthesis || ''),
      keyFindings: (parsed.keyFindings || []).slice(0, 5),
      connections: (parsed.connections || []).slice(0, 3),
      actionItems: (parsed.actionItems || []).slice(0, 3),
      openQuestion: String(parsed.openQuestion || ''),
      reviewed: false,
      dataSourceCount,
    }

    // Save to Firestore
    const db = await getAdminDb()
    const docId = `${today}_${pillar}`
    await db.collection('users').doc(uid).collection('pillar_briefs').doc(docId).set({
      ...brief,
      date: today,
      pillar,
      generatedAt: new Date(),
    })

    return NextResponse.json({ success: true, brief: { ...brief, date: today, pillar, id: docId } })
  } catch (error) {
    console.error('[pillar-brief] Generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
