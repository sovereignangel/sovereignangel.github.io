/**
 * Morning Brief Generator
 *
 * Generates a daily compass — one clear intention with specific outcomes,
 * not a clipboard of tasks. Informed by energy state, theme rhythm, signals,
 * and the Keynes philosophy: love, aesthetic experience, knowledge.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyIntention {
  study: string           // 2hr morning study block — what to study and why
  work: string            // 1-2 theme focus for the work block — with specific outcome
  evening: string         // Love & play / community / social learning suggestion
  themeContext: string    // 1-2 sentences: why this theme today, what's the leverage
}

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
  dailyIntention: DailyIntention
  signalDigest: Array<{
    title: string
    summary: string
    relevance: number
  }>
  reconnect: {
    name: string
    daysSinceTouch: number
    nextAction: string
  } | null
  pendingDecisions: Array<{
    title: string
    daysUntilReview: number
    domain: string
  }>
  rewardTrend: {
    yesterday: number | null
    weekAvg: number | null
    trend: 'up' | 'down' | 'flat'
  }
  dayOfWeek: 'weekday' | 'saturday' | 'sunday'
  keynesCheck: string     // one-liner: have you made space for love/beauty/play?
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

function getDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
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
    .limit(3)
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

async function fetchReconnect(uid: string): Promise<MorningBrief['reconnect']> {
  const db = await getAdminDb()
  const todayKey = today()
  const snap = await db.collection('users').doc(uid).collection('network_contacts')
    .where('isTop30', '==', true)
    .get()

  const stale = snap.docs
    .map(d => {
      const data = d.data()
      const lastTouch = (data.lastTouchDate as string) || todayKey
      const daysSince = daysBetween(lastTouch, todayKey)
      return {
        name: (data.name as string) || '',
        daysSinceTouch: daysSince,
        nextAction: (data.nextAction as string) || '',
      }
    })
    .filter(c => c.daysSinceTouch > 14)
    .sort((a, b) => b.daysSinceTouch - a.daysSinceTouch)

  return stale.length > 0 ? stale[0] : null
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

async function fetchRecentBriefFeedback(uid: string): Promise<string[]> {
  const db = await getAdminDb()
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
  return feedback.filter(Boolean).slice(0, 5)
}

async function fetchRecentJournalEntries(uid: string): Promise<string[]> {
  const db = await getAdminDb()
  const entries: string[] = []
  for (let i = 1; i <= 3; i++) {
    const dateKey = daysAgo(i)
    const snap = await db.collection('users').doc(uid).collection('daily_logs').doc(dateKey).get()
    if (snap.exists) {
      const data = snap.data()
      if (data?.journalEntry && typeof data.journalEntry === 'string' && data.journalEntry.trim()) {
        entries.push(`${dateKey}: ${data.journalEntry.trim()}`)
      }
    }
  }
  return entries
}

function getDayOfWeek(): MorningBrief['dayOfWeek'] {
  const day = new Date().getDay() // 0=Sun, 6=Sat
  if (day === 0) return 'sunday'
  if (day === 6) return 'saturday'
  return 'weekday'
}

// ---------------------------------------------------------------------------
// AI Generation
// ---------------------------------------------------------------------------

async function generateDailyIntention(
  energyState: MorningBrief['energyState'],
  signals: MorningBrief['signalDigest'],
  reconnect: MorningBrief['reconnect'],
  pendingDecisions: MorningBrief['pendingDecisions'],
  rewardTrend: MorningBrief['rewardTrend'],
  userFeedback: string[],
  journalEntries: string[],
  dayOfWeek: MorningBrief['dayOfWeek'],
): Promise<{
  dailyIntention: DailyIntention
  keynesCheck: string
  aiSynthesis: string
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const dayName = getDayName()

  const dayContext = dayOfWeek === 'saturday'
    ? `
DAY: SATURDAY — Recharge & Love
No work blocks. This is Keynes time: love, aesthetic experience, play.
- Training (Zone 2 run), long-form reading, relationship time, community
- The "study" field should be optional light reading or skip entirely
- The "work" field should be a creative/personal project or skip entirely
- The "evening" field should be social, romantic, or restorative
`
    : dayOfWeek === 'sunday'
    ? `
DAY: SUNDAY — Set the Week
Light admin and preparation. No deep work.
- The "study" field should be synthesis/review or week-ahead reading
- The "work" field should be planning, admin, or light prep
- The "evening" field should be restful — early night, Aidas time, meal prep
`
    : `
DAY: ${dayName} (WEEKDAY)
Daily architecture:
- ~7:00am: Wake, journal + meditate (15-20min) — clarity ritual before anything else
- ~7:30-9:45am: Training block (~2hr 15min). Run from Homebrew to gym (~35min, Audible book), weights (45min), subway home (~40min, Audible continued). Current Audible: "Making Sense of Chaos" by Doyne Farmer.
- ~10:00am-12:00pm: 2hrs INTENSE STUDY — post-exercise peak cognition. From intellectual roadmap OR skills needed for Armstrong/Alamo Bernal.
- ~12:00-5:00pm: 1-2 THEME FOCUS maximum. Deep, concentrated work on one or two themes.
- ~5:00-7:00pm+: Love & play, community, social learning. NON-NEGOTIABLE. Not spillover work.
- Before bed: Brief journal reflection.

ALAMO BERNAL CONSTRAINT: Only 2 days per week (15-20hrs total). If today is not an Alamo day, DO NOT suggest Alamo work.

THEMES OF FOCUS (pick 1-2 for the work block):
- Armstrong: Prospective hedge fund R&D lab (ML/AI/Agents/Markets) with Dave. Building conviction.
- Alamo Bernal: Paid tech work, profit protection ($2.5k/mo + performance). 2 DAYS/WEEK ONLY.
- CEcon Research: Complexity economics with Michael Ralph. complexityecon.loricorpuz.com. Reading "Making Sense of Chaos" (Farmer). Michael targeting Oxford assistant professorship.
- Stanford RL: CS231n + CS224r with Aman & Dima.
- AI Engineering Groups: AI Socratic (Fed), EAIG (Andrew), AGI Reading Group (Neel @ Tower Research Capital).
- Homebrew: AI Frontier community, home base.

STUDY SOURCES (for the 10am-12pm block):
- Intellectual roadmap: Stanford RL courses, complexity economics papers/books, AI/ML textbooks
- Execution skills: Whatever Armstrong or Alamo Bernal currently needs (quant methods, backtesting, specific tech)
`

  const prompt = `You are a daily compass for a builder-researcher. Generate ONE clear daily intention — not a task list.

GUIDING PHILOSOPHY: John Maynard Keynes — "The prime objects in life are love, the creation and enjoyment of aesthetic experience and the pursuit of knowledge. And love comes a long way first."

${dayContext}

CONTEXT:
Energy State: ${energyState.summary} (Mode: ${energyState.mode})

Recent Signals (${signals.length}):
${signals.map(s => `- ${s.title}: ${s.summary}`).join('\n') || 'None'}

${reconnect ? `Reconnect suggestion: ${reconnect.name} (${reconnect.daysSinceTouch} days since touch)${reconnect.nextAction ? ` — "${reconnect.nextAction}"` : ''}` : ''}

Pending Decisions (${pendingDecisions.length}):
${pendingDecisions.map(d => `- ${d.title} (${d.domain}) — review in ${d.daysUntilReview} days`).join('\n') || 'None'}

Reward Score: Yesterday ${rewardTrend.yesterday ?? 'N/A'} | Week avg ${rewardTrend.weekAvg ?? 'N/A'} | Trend: ${rewardTrend.trend}

Recent Journal Entries:
${journalEntries.length > 0 ? journalEntries.join('\n\n') : 'No recent entries.'}
${userFeedback.length > 0 ? `
USER FEEDBACK ON PREVIOUS BRIEFS (apply these preferences):
${userFeedback.map(f => `- "${f}"`).join('\n')}
` : ''}
Generate a JSON response with:

1. "dailyIntention": An object with four fields:
   - "study": One sentence. What to study in the 10am-12pm block and why. Be SPECIFIC — name the chapter, paper, course lecture, or skill. Include a concrete outcome (e.g., "finish Ch.4", "implement X", "derive Y"). ${dayOfWeek !== 'weekday' ? 'Can be light reading or empty string on weekends.' : ''}
   - "work": One sentence. Which 1-2 themes own the work block, with a SPECIFIC outcome including numbers where possible (e.g., "6 focused hours on Armstrong signal pipeline — have backtest running on 3 macro signals by EOD"). ${dayOfWeek !== 'weekday' ? 'Can be creative/personal or empty on weekends.' : 'MUST name the theme(s). If energy mode is RECOVER, suggest lighter work.'}
   - "evening": One sentence. Love & play / community / social learning suggestion. Name specific people, groups, or activities when possible.
   - "themeContext": 1-2 sentences explaining WHY these themes today — what's the leverage, what has momentum from recent journal entries, what hasn't gotten attention.

2. "keynesCheck": A short, warm one-liner (not preachy) reminding about love, beauty, or play. Vary it daily. Examples: "Aidas hasn't seen you relaxed in a while — be present tonight." or "When did you last make something just because it was beautiful?" or "The best ideas come after you stop trying. Go play."

3. "aiSynthesis": 2-3 sentences (max 80 words). Connect yesterday's score/journal to today's intention. Highlight one pattern worth noticing. ${dayOfWeek === 'saturday' ? 'Warm, celebrating the week.' : dayOfWeek === 'sunday' ? 'Calm, setting up the week.' : 'Direct, like a sharp friend.'}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "dailyIntention": { "study": "...", "work": "...", "evening": "...", "themeContext": "..." },
  "keynesCheck": "...",
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
      dailyIntention: {
        study: String(parsed.dailyIntention?.study || ''),
        work: String(parsed.dailyIntention?.work || ''),
        evening: String(parsed.dailyIntention?.evening || ''),
        themeContext: String(parsed.dailyIntention?.themeContext || ''),
      },
      keynesCheck: String(parsed.keynesCheck || ''),
      aiSynthesis: String(parsed.aiSynthesis || ''),
    }
  } catch (error) {
    console.error('[morning-brief] AI generation failed:', error)
    return {
      dailyIntention: {
        study: 'Pick up where you left off in your current textbook.',
        work: 'Review your themes and choose the one with most momentum.',
        evening: 'Be present with someone you love.',
        themeContext: 'AI generation failed — trust your instincts today.',
      },
      keynesCheck: 'Love comes a long way first.',
      aiSynthesis: 'AI synthesis unavailable. Check your signals and journal, then choose your theme.',
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
    reconnect,
    pendingDecisions,
    rewardTrend,
    userFeedback,
    journalEntries,
  ] = await Promise.all([
    safeGet<MorningBrief['energyState']>(() => fetchEnergyState(uid), { sleepHours: null, hrv: null, bodyBattery: null, stressLevel: null, nervousSystemState: null, mode: 'CONSERVE' as const, summary: 'Data unavailable' }),
    safeGet(() => fetchUnreadSignals(uid), []),
    safeGet(() => fetchReconnect(uid), null),
    safeGet(() => fetchPendingDecisions(uid), []),
    safeGet(() => fetchRewardTrend(uid), { yesterday: null, weekAvg: null, trend: 'flat' as const }),
    safeGet(() => fetchRecentBriefFeedback(uid), []),
    safeGet(() => fetchRecentJournalEntries(uid), []),
  ])

  // AI-generated components
  const { dailyIntention, keynesCheck, aiSynthesis } = await generateDailyIntention(
    energyState, signalDigest, reconnect, pendingDecisions,
    rewardTrend, userFeedback, journalEntries, dayOfWeek
  )

  return {
    date: todayKey,
    energyState,
    dailyIntention,
    signalDigest,
    reconnect,
    pendingDecisions,
    rewardTrend,
    dayOfWeek,
    keynesCheck,
    aiSynthesis,
  }
}
