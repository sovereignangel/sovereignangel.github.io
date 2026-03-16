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
  openTodos: Array<{
    text: string
    quadrant: string
    projectName: string | null
  }>
  jobPipeline: Array<{
    company: string
    role: string
    stage: string
    nextAction: string
    nextActionDate: string | null
    daysSinceUpdate: number
  }>
  dayOfWeek: 'weekday' | 'saturday' | 'sunday'
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
async function safeGet<T>(fn: () => Promise<T>, fallback: T, timeoutMs = 20000): Promise<T> {
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('safeGet timed out')), timeoutMs)),
    ])
  } catch (e) { console.error('[morning-brief] fetch error:', e); return fallback }
}

// ---------------------------------------------------------------------------
// Data aggregation
// ---------------------------------------------------------------------------

async function fetchEnergyState(uid: string) {
  const db = await getAdminDb()
  const todayKey = today()
  const yesterdayKey = yesterday()

  // Fresh Garmin sync so body battery reflects current watch reading (15s timeout)
  try {
    const { syncGarminMetrics } = await import('@/lib/etl/garmin')
    await Promise.race([
      syncGarminMetrics(todayKey),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Garmin sync timed out after 15s')), 15000)),
    ])
  } catch (e) {
    console.warn('[morning-brief] Garmin pre-sync failed, using cached data:', (e as Error).message)
  }

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
  const bodyBattery = (garmin?.bodyBatteryCurrent as number) ?? (garmin?.bodyBattery as number) ?? null
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

async function fetchOpenTodos(uid: string) {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('todos')
    .where('status', '==', 'open')
    .get()

  return snap.docs.sort((a, b) => ((a.data().sortOrder as number) || 0) - ((b.data().sortOrder as number) || 0)).map(d => {
    const data = d.data()
    return {
      text: (data.text as string) || '',
      quadrant: (data.quadrant as string) || 'do_first',
      projectName: (data.linkedProjectName as string) || null,
    }
  })
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

async function fetchJobPipeline(uid: string): Promise<MorningBrief['jobPipeline']> {
  const db = await getAdminDb()
  const activeStages = ['researching', 'applied', 'phone_screen', 'interview', 'take_home', 'final_round', 'offer']
  const snap = await db.collection('users').doc(uid).collection('job_pipeline')
    .where('stage', 'in', activeStages)
    .orderBy('updatedAt', 'desc')
    .get()

  const todayKey = today()
  return snap.docs.map(d => {
    const data = d.data()
    const updatedStr = data.updatedAt?.toDate?.()
      ? localDateString(data.updatedAt.toDate())
      : todayKey
    return {
      company: data.company as string,
      role: data.role as string,
      stage: data.stage as string,
      nextAction: (data.nextAction as string) || '',
      nextActionDate: (data.nextActionDate as string) || null,
      daysSinceUpdate: daysBetween(updatedStr, todayKey),
    }
  })
}

function getDayOfWeek(): MorningBrief['dayOfWeek'] {
  const day = new Date().getDay() // 0=Sun, 6=Sat
  if (day === 0) return 'sunday'
  if (day === 6) return 'saturday'
  return 'weekday'
}

async function fetchRecentBriefFeedback(uid: string): Promise<string[]> {
  const db = await getAdminDb()
  // Check last 14 days of daily_reports for feedback
  const dates: string[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    dates.push(localDateString(d))
  }
  const snaps = await Promise.all(
    dates.map(d => db.collection('users').doc(uid).collection('daily_reports').doc(d).get())
  )
  const feedback: string[] = []
  for (const snap of snaps) {
    if (!snap.exists) continue
    const items = snap.data()?.briefFeedback
    if (Array.isArray(items)) {
      for (const item of items) {
        feedback.push(typeof item === 'string' ? item : item.text || '')
      }
    }
  }
  // Return most recent 5 feedbacks
  return feedback.filter(Boolean).slice(0, 5)
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
  projectNames: string[],
  userFeedback: string[],
  openTodos?: MorningBrief['openTodos'],
  jobPipeline?: MorningBrief['jobPipeline'],
  dayOfWeek?: MorningBrief['dayOfWeek']
): Promise<{
  topPlays: MorningBrief['topPlays']
  discernmentPrompt: string
  aiSynthesis: string
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const dayContext = dayOfWeek === 'saturday'
    ? `
DAY CONTEXT: SATURDAY — Recharge & Explore
This is a weekend day. The user's priorities are:
- Health & recovery: training, outdoor time, meal prep, sleep optimization
- Relationships: quality time, reaching out to friends/family, social plans
- Light exploration: reading, creative projects, learning for fun (NOT deep work)
- DO NOT suggest RL/quant study, deep focus blocks, or shipping work
- Keep intensity low — this is about recharging for the week ahead
- Elevate the "reconnect" suggestions — weekends are natural relationship time
`
    : dayOfWeek === 'sunday'
    ? `
DAY CONTEXT: SUNDAY — Set the Week
This is Sunday. The user's priorities are:
- Admin & life maintenance: bills, errands, calendar review, meal prep, groceries
- Relationships: plans for the week, catching up with people
- Week-ahead planning: what's the #1 priority for Monday? What needs prep?
- Health prep: training plan for the week, sleep target
- Job pipeline review: any follow-ups due? Applications going stale?
- DO NOT suggest RL/quant study or deep focus blocks — those are weekday activities (2hrs/day M-F)
- Light, empowering energy — set yourself up for an elite week
`
    : `
DAY CONTEXT: WEEKDAY
Standard operating mode. RL/quant study should be ~2 hours daily. Deep focus blocks are appropriate.
`

  const pipelineSection = jobPipeline && jobPipeline.length > 0
    ? `
Job Pipeline (${jobPipeline.length} active):
${jobPipeline.map(j => {
  const stale = j.daysSinceUpdate > 5 ? ' ⚠ STALE' : ''
  const next = j.nextAction ? ` → ${j.nextAction}` : ''
  const due = j.nextActionDate ? ` (due: ${j.nextActionDate})` : ''
  return `- ${j.company} — ${j.role} [${j.stage}]${next}${due}${stale}`
}).join('\n')}
`
    : ''

  const prompt = `You are a personal chief of staff for an entrepreneur/builder. Generate a daily morning briefing.
${dayContext}
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
${pipelineSection}
Open Todos (${openTodos?.length ?? 0}):
${openTodos && openTodos.length > 0
  ? openTodos.slice(0, 15).map(t => {
      const proj = t.projectName ? `[${t.projectName}] ` : ''
      const q = t.quadrant === 'do_first' ? 'DO FIRST' : t.quadrant === 'schedule' ? 'SCHEDULE' : t.quadrant.toUpperCase()
      return `- [${q}] ${proj}${t.text}`
    }).join('\n')
  : 'None'}

Recent Signal for Discernment: ${recentSignal || 'No recent signals available'}
${userFeedback.length > 0 ? `
USER FEEDBACK ON PREVIOUS BRIEFS (apply these preferences):
${userFeedback.map(f => `- "${f}"`).join('\n')}
` : ''}
Generate these three things:

1. TOP 3 PLAYS — The three highest-leverage actions for today, ranked by (opportunity value × readiness × energy mode). Each play should be specific and actionable (not vague). Consider the energy mode: if RECOVER, suggest lower-intensity actions. IMPORTANT: Factor in the user's open todos — especially "DO FIRST" items. These represent what they've committed to working on. Top plays should align with or incorporate their highest-priority todos.${dayOfWeek === 'saturday' ? ' SATURDAY RULE: Focus plays on health, relationships, and light exploration — no deep work or RL study.' : dayOfWeek === 'sunday' ? ' SUNDAY RULE: Focus plays on admin, relationships, week-ahead prep, and job pipeline follow-ups — no deep work or RL study.' : ' WEEKDAY RULE: Include ~2hrs RL/quant study in the plan.'} Format as JSON array.

2. DISCERNMENT PROMPT — ${dayOfWeek === 'saturday' || dayOfWeek === 'sunday'
    ? 'Create a reflective, philosophical prompt. On weekends, shift from tactical market analysis to bigger-picture thinking: life design, values alignment, long-term vision. Draw on the recent signal if available but frame it through a personal growth lens.'
    : 'Based on the recent signal, create a thought exercise: "If [signal] is true, what are the 2nd and 3rd order effects on (a) your current projects, (b) the broader market, (c) your positioning?" If no signal is available, create a strategic question based on the stale contacts or pending decisions.'}

3. AI SYNTHESIS — A 2-3 paragraph narrative briefing (max 150 words) that:
   - Highlights the most important pattern across signals and contacts${jobPipeline && jobPipeline.length > 0 ? '\n   - Flags any job pipeline items needing attention (stale applications, upcoming interviews, follow-ups due)' : ''}
   - Connects yesterday's reward score to today's priorities
   - Suggests one strategic theme for the day
   Tone: ${dayOfWeek === 'saturday' ? 'Warm, encouraging. Like a coach on rest day — celebrate the week, set up for recovery.' : dayOfWeek === 'sunday' ? 'Calm, empowering. Like a strategist helping you set up an elite week ahead.' : 'Direct, action-oriented. Like a Bridgewater daily observation.'}

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
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini timed out after 30s')), 30000)),
    ])
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
  const dayOfWeek = getDayOfWeek()

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
    userFeedback,
    openTodos,
    jobPipeline,
  ] = await Promise.all([
    safeGet<MorningBrief['energyState']>(() => fetchEnergyState(uid), { sleepHours: null, hrv: null, bodyBattery: null, stressLevel: null, nervousSystemState: null, mode: 'CONSERVE' as const, summary: 'Data unavailable' }),
    safeGet(() => fetchUnreadSignals(uid), []),
    safeGet(() => fetchStaleContacts(uid), []),
    safeGet(() => fetchPendingDecisions(uid), []),
    safeGet(() => fetchStalledProjects(uid), []),
    safeGet(() => fetchRewardTrend(uid), { yesterday: null, weekAvg: null, trend: 'flat' as const }),
    safeGet(() => fetchRecentSignalForDiscernment(uid), null),
    safeGet(() => fetchProjectNames(uid), []),
    safeGet(() => fetchRecentBriefFeedback(uid), []),
    safeGet(() => fetchOpenTodos(uid), []),
    safeGet(() => fetchJobPipeline(uid), []),
  ])

  // AI-generated components (top plays, discernment prompt, synthesis)
  const { topPlays, discernmentPrompt, aiSynthesis } = await generateTopPlaysAndSynthesis(
    energyState, signalDigest, staleContacts, pendingDecisions,
    stalledProjects, rewardTrend, recentSignal, projectNames, userFeedback,
    openTodos, jobPipeline, dayOfWeek
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
    openTodos,
    jobPipeline,
    dayOfWeek,
    discernmentPrompt,
    aiSynthesis,
  }
}
