/**
 * Morning Brief Generator
 *
 * Aggregates data across all Firestore collections and uses Gemini
 * to produce a daily intelligence briefing delivered via Telegram.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MorningBrief {
  date: string
  energyState: {
    sleepHours: number | null
    hrv: number | null
    bodyBattery: number | null
    stressLevel: number | null
    nervousSystemState: string | null
    mode: 'GO' | 'CONSERVE' | 'RECOVER'
    summary: string
  }
  topPlays: Array<{
    action: string
    reason: string
    leverage: 'high' | 'medium'
  }>
  signalDigest: Array<{
    title: string
    summary: string
    relevance: number
  }>
  staleContacts: Array<{
    name: string
    tier: string
    daysSinceTouch: number
    nextAction: string
  }>
  pendingDecisions: Array<{
    title: string
    daysUntilReview: number
    domain: string
  }>
  stalledProjects: Array<{
    name: string
    daysSinceActivity: number
    nextMilestone: string
  }>
  rewardTrend: {
    yesterday: number | null
    weekAvg: number | null
    trend: 'up' | 'down' | 'flat'
  }
  discernmentPrompt: string
  aiSynthesis: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function today(): string { return localDateString(new Date()) }

function yesterday(): string {
  const d = new Date(); d.setDate(d.getDate() - 1); return localDateString(d)
}

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return localDateString(d)
}

function daysBetween(dateStr: string, now: string): number {
  const a = new Date(dateStr + 'T12:00:00')
  const b = new Date(now + 'T12:00:00')
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

// ---------------------------------------------------------------------------
// Safe data fetchers (never throw — return defaults)
// ---------------------------------------------------------------------------

async function getAdminDb() {
  const { adminDb } = await import('./firebase-admin')
  return adminDb
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeGet<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch (e) { console.error('[morning-brief] fetch error:', e); return fallback }
}

// ---------------------------------------------------------------------------
// Data aggregation
// ---------------------------------------------------------------------------

async function fetchEnergyState(uid: string) {
  const db = await getAdminDb()
  const todayKey = today()
  const yesterdayKey = yesterday()

  // Garmin metrics for today (or yesterday if not yet synced)
  let garmin: Record<string, unknown> | null = null
  const garminSnap = await db.collection('users').doc(uid).collection('garmin_metrics').doc(todayKey).get()
  if (garminSnap.exists) {
    garmin = garminSnap.data() as Record<string, unknown>
  } else {
    const ySnap = await db.collection('users').doc(uid).collection('garmin_metrics').doc(yesterdayKey).get()
    if (ySnap.exists) garmin = ySnap.data() as Record<string, unknown>
  }

  // Yesterday's daily log for nervous system state
  const logSnap = await db.collection('users').doc(uid).collection('daily_logs').doc(yesterdayKey).get()
  const log = logSnap.exists ? logSnap.data() as Record<string, unknown> : null

  const sleepHours = (garmin?.sleepDurationHours as number) ?? (garmin?.sleepHours as number) ?? null
  const hrv = (garmin?.hrvWeeklyAvg as number) ?? (garmin?.hrv as number) ?? null
  const bodyBattery = (garmin?.bodyBatteryHigh as number) ?? (garmin?.bodyBattery as number) ?? null
  const stressLevel = (garmin?.avgStressLevel as number) ?? null
  const nervousSystemState = (log?.nervousSystemState as string) ?? null

  // Derive mode
  let mode: 'GO' | 'CONSERVE' | 'RECOVER' = 'CONSERVE'
  if ((bodyBattery != null && bodyBattery > 70) && (sleepHours != null && sleepHours >= 7)) {
    mode = 'GO'
  } else if ((bodyBattery != null && bodyBattery < 40) || (sleepHours != null && sleepHours < 5)) {
    mode = 'RECOVER'
  }

  const parts: string[] = []
  if (sleepHours != null) parts.push(`Sleep ${sleepHours}h`)
  if (hrv != null) parts.push(`HRV ${hrv}`)
  if (bodyBattery != null) parts.push(`Battery ${bodyBattery}`)
  const summary = parts.length > 0 ? parts.join(' | ') + ` | Mode: ${mode}` : `Mode: ${mode}`

  return { sleepHours, hrv, bodyBattery, stressLevel, nervousSystemState, mode, summary }
}

async function fetchUnreadSignals(uid: string) {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('external_signals')
    .where('status', '==', 'inbox')
    .where('readStatus', '==', 'unread')
    .orderBy('relevanceScore', 'desc')
    .limit(5)
    .get()

  return snap.docs.map(d => {
    const data = d.data()
    return {
      title: (data.title as string) || '',
      summary: (data.aiSummary as string) || (data.keyTakeaway as string) || '',
      relevance: (data.relevanceScore as number) || 0,
    }
  })
}

async function fetchStaleContacts(uid: string) {
  const db = await getAdminDb()
  const todayKey = today()
  const snap = await db.collection('users').doc(uid).collection('network_contacts')
    .where('isTop30', '==', true)
    .get()

  const contacts = snap.docs
    .map(d => {
      const data = d.data()
      const lastTouch = (data.lastTouchDate as string) || todayKey
      const daysSince = daysBetween(lastTouch, todayKey)
      return {
        name: (data.name as string) || '',
        tier: (data.tier as string) || '',
        daysSinceTouch: daysSince,
        nextAction: (data.nextAction as string) || '',
      }
    })
    .filter(c => c.daysSinceTouch > 14)
    .sort((a, b) => b.daysSinceTouch - a.daysSinceTouch)
    .slice(0, 5)

  return contacts
}

async function fetchPendingDecisions(uid: string) {
  const db = await getAdminDb()
  const todayKey = today()
  const snap = await db.collection('users').doc(uid).collection('decisions')
    .where('status', '==', 'active')
    .get()

  return snap.docs
    .map(d => {
      const data = d.data()
      const reviewDate = (data.reviewDate as string) || ''
      const daysUntil = reviewDate ? daysBetween(todayKey, reviewDate) : 999
      return {
        title: (data.title as string) || '',
        daysUntilReview: daysUntil,
        domain: (data.domain as string) || '',
      }
    })
    .filter(d => d.daysUntilReview <= 14)
    .sort((a, b) => a.daysUntilReview - b.daysUntilReview)
    .slice(0, 5)
}

async function fetchStalledProjects(uid: string) {
  const db = await getAdminDb()
  const todayKey = today()
  const snap = await db.collection('users').doc(uid).collection('projects').get()

  // Get last 7 days of logs to check for activity
  const logDates: string[] = []
  for (let i = 0; i < 7; i++) logDates.push(daysAgo(i))

  const logSnaps = await Promise.all(
    logDates.map(d =>
      db.collection('users').doc(uid).collection('daily_logs').doc(d).get()
    )
  )

  const activeSpineProjects = new Set<string>()
  const shippedProjects = new Set<string>()
  for (const ls of logSnaps) {
    if (!ls.exists) continue
    const data = ls.data()
    if (data?.spineProject) activeSpineProjects.add(data.spineProject)
    if (data?.whatShipped) shippedProjects.add(data.spineProject || '')
  }

  return snap.docs
    .map(d => {
      const data = d.data()
      const name = (data.name as string) || ''
      const status = (data.status as string) || ''
      if (status === 'archived' || status === 'completed' || status === 'paused') return null
      const hasActivity = activeSpineProjects.has(name) || shippedProjects.has(name)
      if (hasActivity) return null

      // Estimate days since activity from updatedAt
      const updatedAt = data.updatedAt
      let daysSince = 7
      if (updatedAt && typeof updatedAt.toDate === 'function') {
        daysSince = daysBetween(localDateString(updatedAt.toDate()), todayKey)
      }

      return {
        name,
        daysSinceActivity: Math.max(daysSince, 7),
        nextMilestone: (data.nextMilestone as string) || '',
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity)
    .slice(0, 3)
}

async function fetchRewardTrend(uid: string) {
  const db = await getAdminDb()

  const dates: string[] = []
  for (let i = 1; i <= 7; i++) dates.push(daysAgo(i))

  const snaps = await Promise.all(
    dates.map(d =>
      db.collection('users').doc(uid).collection('daily_logs').doc(d).get()
    )
  )

  const scores: number[] = []
  let yesterdayScore: number | null = null

  snaps.forEach((snap, i) => {
    if (!snap.exists) return
    const data = snap.data()
    const score = data?.rewardScore?.score
    if (typeof score === 'number') {
      scores.push(score)
      if (i === 0) yesterdayScore = score
    }
  })

  const weekAvg = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null

  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (scores.length >= 3) {
    const firstHalf = scores.slice(Math.floor(scores.length / 2))
    const secondHalf = scores.slice(0, Math.floor(scores.length / 2))
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    if (avgSecond - avgFirst > 0.3) trend = 'up'
    else if (avgFirst - avgSecond > 0.3) trend = 'down'
  }

  return { yesterday: yesterdayScore, weekAvg, trend }
}

async function fetchRecentSignalForDiscernment(uid: string): Promise<string | null> {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('external_signals')
    .where('status', '==', 'inbox')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get()

  if (snap.empty) return null

  // Pick a random one from the top 5
  const docs = snap.docs
  const idx = Math.floor(Math.random() * docs.length)
  const data = docs[idx].data()
  return (data.aiSummary as string) || (data.title as string) || null
}

async function fetchProjectNames(uid: string): Promise<string[]> {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('projects').get()
  return snap.docs.map(d => (d.data().name as string) || '').filter(Boolean)
}

// ---------------------------------------------------------------------------
// AI Generation
// ---------------------------------------------------------------------------

async function generateTopPlaysAndSynthesis(
  energyState: MorningBrief['energyState'],
  signals: MorningBrief['signalDigest'],
  staleContacts: MorningBrief['staleContacts'],
  pendingDecisions: MorningBrief['pendingDecisions'],
  stalledProjects: MorningBrief['stalledProjects'],
  rewardTrend: MorningBrief['rewardTrend'],
  recentSignal: string | null,
  projectNames: string[]
): Promise<{
  topPlays: MorningBrief['topPlays']
  discernmentPrompt: string
  aiSynthesis: string
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a personal chief of staff for an entrepreneur/builder. Generate a daily morning briefing.

CONTEXT:

Energy State: ${energyState.summary} (Mode: ${energyState.mode})
Active Projects: ${projectNames.join(', ') || 'None listed'}

Unread Signals (${signals.length}):
${signals.map(s => `- ${s.title} (relevance: ${s.relevance.toFixed(2)}): ${s.summary}`).join('\n') || 'None'}

Stale Contacts (${staleContacts.length}):
${staleContacts.map(c => `- ${c.name} (${c.tier}) — ${c.daysSinceTouch} days, next: "${c.nextAction}"`).join('\n') || 'None'}

Pending Decision Reviews (${pendingDecisions.length}):
${pendingDecisions.map(d => `- ${d.title} (${d.domain}) — review in ${d.daysUntilReview} days`).join('\n') || 'None'}

Stalled Projects (${stalledProjects.length}):
${stalledProjects.map(p => `- ${p.name} — ${p.daysSinceActivity} days idle, next: "${p.nextMilestone}"`).join('\n') || 'None'}

Reward Score: Yesterday ${rewardTrend.yesterday ?? 'N/A'} | Week avg ${rewardTrend.weekAvg ?? 'N/A'} | Trend: ${rewardTrend.trend}

Recent Signal for Discernment: ${recentSignal || 'No recent signals available'}

Generate these three things:

1. TOP 3 PLAYS — The three highest-leverage actions for today, ranked by (opportunity value × readiness × energy mode). Each play should be specific and actionable (not vague). Consider the energy mode: if RECOVER, suggest lower-intensity actions. Format as JSON array.

2. DISCERNMENT PROMPT — Based on the recent signal, create a thought exercise: "If [signal] is true, what are the 2nd and 3rd order effects on (a) your current projects, (b) the broader market, (c) your positioning?" If no signal is available, create a strategic question based on the stale contacts or pending decisions.

3. AI SYNTHESIS — A 2-3 paragraph narrative briefing (max 150 words) that:
   - Highlights the most important pattern across signals and contacts
   - Connects yesterday's reward score to today's priorities
   - Suggests one strategic theme for the day
   Tone: Direct, action-oriented. Like a Bridgewater daily observation.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "topPlays": [
    { "action": "...", "reason": "...", "leverage": "high" },
    { "action": "...", "reason": "...", "leverage": "high" },
    { "action": "...", "reason": "...", "leverage": "medium" }
  ],
  "discernmentPrompt": "...",
  "aiSynthesis": "..."
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(text)

    return {
      topPlays: (parsed.topPlays || []).slice(0, 3).map((p: Record<string, unknown>) => ({
        action: String(p.action || ''),
        reason: String(p.reason || ''),
        leverage: p.leverage === 'medium' ? 'medium' as const : 'high' as const,
      })),
      discernmentPrompt: String(parsed.discernmentPrompt || ''),
      aiSynthesis: String(parsed.aiSynthesis || ''),
    }
  } catch (error) {
    console.error('[morning-brief] AI generation failed:', error)
    return {
      topPlays: [{ action: 'Review your signals inbox', reason: 'AI generation failed — start with manual review', leverage: 'medium' }],
      discernmentPrompt: 'What is the highest-leverage action you could take today?',
      aiSynthesis: 'AI synthesis unavailable. Check your signals, contacts, and pending decisions manually.',
    }
  }
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateMorningBrief(uid: string): Promise<MorningBrief> {
  const todayKey = today()

  // Fetch all data in parallel (each safe — never throws)
  const [
    energyState,
    signalDigest,
    staleContacts,
    pendingDecisions,
    stalledProjects,
    rewardTrend,
    recentSignal,
    projectNames,
  ] = await Promise.all([
    safeGet<MorningBrief['energyState']>(() => fetchEnergyState(uid), { sleepHours: null, hrv: null, bodyBattery: null, stressLevel: null, nervousSystemState: null, mode: 'CONSERVE' as const, summary: 'Data unavailable' }),
    safeGet(() => fetchUnreadSignals(uid), []),
    safeGet(() => fetchStaleContacts(uid), []),
    safeGet(() => fetchPendingDecisions(uid), []),
    safeGet(() => fetchStalledProjects(uid), []),
    safeGet(() => fetchRewardTrend(uid), { yesterday: null, weekAvg: null, trend: 'flat' as const }),
    safeGet(() => fetchRecentSignalForDiscernment(uid), null),
    safeGet(() => fetchProjectNames(uid), []),
  ])

  // AI-generated components (top plays, discernment prompt, synthesis)
  const { topPlays, discernmentPrompt, aiSynthesis } = await generateTopPlaysAndSynthesis(
    energyState, signalDigest, staleContacts, pendingDecisions,
    stalledProjects, rewardTrend, recentSignal, projectNames
  )

  return {
    date: todayKey,
    energyState,
    topPlays,
    signalDigest,
    staleContacts,
    pendingDecisions,
    stalledProjects,
    rewardTrend,
    discernmentPrompt,
    aiSynthesis,
  }
}
