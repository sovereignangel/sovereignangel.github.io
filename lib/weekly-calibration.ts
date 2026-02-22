/**
 * Weekly Calibration Report Generator
 *
 * Aggregates a full week of data across all Firestore collections and uses Gemini
 * to produce a Bridgewater-style weekly review delivered via Telegram every Sunday.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeeklyCalibration {
  weekStart: string  // YYYY-MM-DD (Monday)
  weekEnd: string    // YYYY-MM-DD (Sunday)

  // Performance summary
  performance: {
    avgRewardScore: number | null
    scoreTrajectory: 'improving' | 'declining' | 'flat'
    totalFocusHours: number
    totalShips: number
    totalRevenueAsks: number
    totalRevenue: number
    totalConversations: number
    totalIntros: number
    cadenceHitRate: number  // % of days all 7 cadence items completed
  }

  // Decision review
  decisions: {
    activeCount: number
    approachingReview: Array<{
      title: string
      hypothesis: string
      daysUntilReview: number
      confidenceLevel: number
    }>
    antitheses: Array<{
      decisionTitle: string
      antithesis: string
      killCriteriaStatus: string
    }>
  }

  // Attention allocation vs value
  attentionAllocation: Array<{
    project: string
    focusHoursThisWeek: number
    percentOfTotal: number
    revenueSignal: number
    health: 'ON_TRACK' | 'STALLED' | 'NEW' | 'DORMANT'
    aiCommentary: string
  }>

  // Network intelligence
  networkHealth: {
    totalContacts: number
    touchedThisWeek: number
    staleDecisionMakers: number
    warmIntroRate: number
    topRelationshipMoves: string[]
  }

  // Blind spots
  blindSpots: string[]

  // AI synthesis
  synthesis: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysBetween(dateStr: string, now: string): number {
  const a = new Date(dateStr + 'T12:00:00')
  const b = new Date(now + 'T12:00:00')
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Returns the Monday..Sunday date strings for the current week.
 * "Current week" = the week that contains today (Sunday).
 * If called on a Sunday, that Sunday is the end of the week.
 */
function getWeekDates(): { weekStart: string; weekEnd: string; dates: string[] } {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon ...
  // If Sunday (0), go back 6 days to Monday
  const diffToMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(localDateString(d))
  }

  return {
    weekStart: dates[0],
    weekEnd: dates[6],
    dates,
  }
}

// ---------------------------------------------------------------------------
// Safe data fetcher (never throw — return defaults)
// ---------------------------------------------------------------------------

async function getAdminDb() {
  const { adminDb } = await import('./firebase-admin')
  return adminDb
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeGet<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch (e) { console.error('[weekly-calibration] fetch error:', e); return fallback }
}

// ---------------------------------------------------------------------------
// Data aggregation
// ---------------------------------------------------------------------------

interface DailyLogData {
  date: string
  rewardScore?: { score?: number } | null
  focusHoursActual?: number
  whatShipped?: string
  shipsCount?: number
  revenueAsksCount?: number
  revenueThisSession?: number
  discoveryConversationsCount?: number
  warmIntrosMade?: number
  meetingsBooked?: number
  publicPostsCount?: number
  nervousSystemState?: string
  pillarsTouched?: string[]
  spineProject?: string
  revenueSignal?: number
}

async function fetchWeeklyLogs(uid: string, dates: string[]): Promise<DailyLogData[]> {
  const db = await getAdminDb()
  const snaps = await Promise.all(
    dates.map(d =>
      db.collection('users').doc(uid).collection('daily_logs').doc(d).get()
    )
  )

  return snaps
    .filter(snap => snap.exists)
    .map(snap => ({ date: snap.id, ...snap.data() } as DailyLogData))
}

function aggregatePerformance(logs: DailyLogData[]): WeeklyCalibration['performance'] {
  const scores = logs
    .map(l => l.rewardScore?.score)
    .filter((s): s is number => typeof s === 'number')

  const avgRewardScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null

  // Trajectory: compare first half vs second half
  let scoreTrajectory: 'improving' | 'declining' | 'flat' = 'flat'
  if (scores.length >= 3) {
    const mid = Math.floor(scores.length / 2)
    const firstHalfAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid
    const secondHalfAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid)
    if (secondHalfAvg - firstHalfAvg > 0.3) scoreTrajectory = 'improving'
    else if (firstHalfAvg - secondHalfAvg > 0.3) scoreTrajectory = 'declining'
  }

  const totalFocusHours = logs.reduce((sum, l) => sum + (l.focusHoursActual || 0), 0)
  const totalShips = logs.reduce((sum, l) => {
    // Count ships: use shipsCount if available, otherwise check if whatShipped is non-empty
    if (typeof l.shipsCount === 'number' && l.shipsCount > 0) return sum + l.shipsCount
    if (l.whatShipped && l.whatShipped.trim().length > 0) return sum + 1
    return sum
  }, 0)
  const totalRevenueAsks = logs.reduce((sum, l) => sum + (l.revenueAsksCount || 0), 0)
  const totalRevenue = logs.reduce((sum, l) => sum + (l.revenueThisSession || 0), 0)
  const totalConversations = logs.reduce((sum, l) => sum + (l.discoveryConversationsCount || 0), 0)
  const totalIntros = logs.reduce((sum, l) => sum + (l.warmIntrosMade || 0), 0)

  // Cadence hit rate: % of days where all 7 cadence items are completed
  // The 7 cadence items: focusHours > 0, whatShipped, revenueAsks > 0,
  // discoveryConversations > 0, publicPosts > 0, warmIntros > 0, meetingsBooked > 0
  const cadenceDays = logs.filter(l => {
    const hasFocus = (l.focusHoursActual || 0) > 0
    const hasShip = !!(l.whatShipped && l.whatShipped.trim()) || (l.shipsCount || 0) > 0
    const hasAsk = (l.revenueAsksCount || 0) > 0
    const hasConvo = (l.discoveryConversationsCount || 0) > 0
    const hasPost = (l.publicPostsCount || 0) > 0
    const hasIntro = (l.warmIntrosMade || 0) > 0
    const hasMeeting = (l.meetingsBooked || 0) > 0
    return hasFocus && hasShip && hasAsk && hasConvo && hasPost && hasIntro && hasMeeting
  }).length
  const cadenceHitRate = logs.length > 0
    ? Math.round((cadenceDays / logs.length) * 100)
    : 0

  return {
    avgRewardScore,
    scoreTrajectory,
    totalFocusHours: Math.round(totalFocusHours * 10) / 10,
    totalShips,
    totalRevenueAsks,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalConversations,
    totalIntros,
    cadenceHitRate,
  }
}

function aggregateAttentionAllocation(
  logs: DailyLogData[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: Array<{ name: string; status: string; data: Record<string, any> }>
): Array<{
  project: string
  focusHoursThisWeek: number
  percentOfTotal: number
  revenueSignal: number
  health: 'ON_TRACK' | 'STALLED' | 'NEW' | 'DORMANT'
}> {
  // Count focus hours per spine project
  const hoursByProject: Record<string, number> = {}
  const revenueByProject: Record<string, number> = {}
  for (const log of logs) {
    const proj = log.spineProject || 'Unassigned'
    hoursByProject[proj] = (hoursByProject[proj] || 0) + (log.focusHoursActual || 0)
    revenueByProject[proj] = (revenueByProject[proj] || 0) + (log.revenueThisSession || 0)
  }

  const totalHours = Object.values(hoursByProject).reduce((a, b) => a + b, 0) || 1

  // Merge with project metadata
  const projectNames = new Set([
    ...Object.keys(hoursByProject),
    ...projects.map(p => p.name),
  ])

  const result: Array<{
    project: string
    focusHoursThisWeek: number
    percentOfTotal: number
    revenueSignal: number
    health: 'ON_TRACK' | 'STALLED' | 'NEW' | 'DORMANT'
  }> = []

  for (const name of Array.from(projectNames)) {
    if (name === 'Unassigned' && (hoursByProject[name] || 0) === 0) continue

    const hours = hoursByProject[name] || 0
    const revenue = revenueByProject[name] || 0
    const projectMeta = projects.find(p => p.name === name)

    let health: 'ON_TRACK' | 'STALLED' | 'NEW' | 'DORMANT' = 'DORMANT'
    if (projectMeta) {
      const status = projectMeta.data.status || ''
      if (status === 'pre_launch') health = 'NEW'
      else if (hours > 0 && (revenue > 0 || hours >= 3)) health = 'ON_TRACK'
      else if (hours > 0 && revenue === 0) health = 'STALLED'
      else health = 'DORMANT'
    } else if (hours > 0) {
      health = 'ON_TRACK'
    }

    result.push({
      project: name,
      focusHoursThisWeek: Math.round(hours * 10) / 10,
      percentOfTotal: Math.round((hours / totalHours) * 100),
      revenueSignal: Math.round(revenue * 100) / 100,
      health,
    })
  }

  // Sort by hours descending
  result.sort((a, b) => b.focusHoursThisWeek - a.focusHoursThisWeek)
  return result
}

async function fetchActiveDecisions(uid: string): Promise<Array<{
  title: string
  hypothesis: string
  confidenceLevel: number
  killCriteria: string[]
  reviewDate: string
  reasoning: string
  chosenOption: string
  domain: string
}>> {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('decisions')
    .where('status', '==', 'active')
    .get()

  return snap.docs.map(d => {
    const data = d.data()
    return {
      title: (data.title as string) || '',
      hypothesis: (data.hypothesis as string) || '',
      confidenceLevel: (data.confidenceLevel as number) || 0,
      killCriteria: (data.killCriteria as string[]) || [],
      reviewDate: (data.reviewDate as string) || '',
      reasoning: (data.reasoning as string) || '',
      chosenOption: (data.chosenOption as string) || '',
      domain: (data.domain as string) || '',
    }
  })
}

async function fetchProjects(uid: string): Promise<Array<{
  name: string
  status: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}>> {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('projects').get()
  return snap.docs
    .map(d => {
      const data = d.data()
      return {
        name: (data.name as string) || '',
        status: (data.status as string) || '',
        data,
      }
    })
    .filter(p => p.status !== 'archived')
}

async function fetchNetworkHealth(
  uid: string,
  weekDates: string[],
  logs: DailyLogData[]
): Promise<WeeklyCalibration['networkHealth']> {
  const db = await getAdminDb()
  const todayKey = localDateString(new Date())
  const weekStart = weekDates[0]
  const weekEnd = weekDates[weekDates.length - 1]

  const snap = await db.collection('users').doc(uid).collection('network_contacts').get()

  let totalContacts = 0
  let touchedThisWeek = 0
  let staleDecisionMakers = 0
  let decisionMakersTouchedThisWeek = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    totalContacts++

    const lastTouch = (data.lastTouchDate as string) || ''
    const tier = (data.tier as string) || ''
    const isTouchedThisWeek = lastTouch >= weekStart && lastTouch <= weekEnd

    if (isTouchedThisWeek) {
      touchedThisWeek++
      if (tier === 'decision_maker') decisionMakersTouchedThisWeek++
    }

    // Stale = decision_maker with last touch > 14 days ago
    if (tier === 'decision_maker' && lastTouch) {
      const daysSince = daysBetween(lastTouch, todayKey)
      if (daysSince > 14) staleDecisionMakers++
    }
  }

  // Warm intro rate: intros this week / decision-makers touched (reuse logs already fetched)
  const totalIntrosThisWeek = logs.reduce((sum, l) => sum + (l.warmIntrosMade || 0), 0)
  const warmIntroRate = decisionMakersTouchedThisWeek > 0
    ? Math.round((totalIntrosThisWeek / decisionMakersTouchedThisWeek) * 100)
    : 0

  return {
    totalContacts,
    touchedThisWeek,
    staleDecisionMakers,
    warmIntroRate,
    topRelationshipMoves: [],  // Will be filled by AI
  }
}

async function fetchRecentInsights(uid: string): Promise<string[]> {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('insights')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get()

  return snap.docs.map(d => {
    const data = d.data()
    return (data.summary as string) || (data.content as string) || ''
  }).filter(Boolean)
}

async function fetchStaleDecisionMakerDetails(uid: string): Promise<Array<{
  name: string
  daysSinceTouch: number
  nextAction: string
  warmIntrosGenerated: number
}>> {
  const db = await getAdminDb()
  const todayKey = localDateString(new Date())
  const snap = await db.collection('users').doc(uid).collection('network_contacts')
    .where('tier', '==', 'decision_maker')
    .get()

  return snap.docs
    .map(d => {
      const data = d.data()
      const lastTouch = (data.lastTouchDate as string) || ''
      const daysSince = lastTouch ? daysBetween(lastTouch, todayKey) : 999
      return {
        name: (data.name as string) || '',
        daysSinceTouch: daysSince,
        nextAction: (data.nextAction as string) || '',
        warmIntrosGenerated: (data.warmIntrosGenerated as number) || 0,
      }
    })
    .filter(c => c.daysSinceTouch > 14)
    .sort((a, b) => b.daysSinceTouch - a.daysSinceTouch)
    .slice(0, 10)
}

async function fetchActivePrinciples(uid: string): Promise<string[]> {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('principles')
    .orderBy('reinforcementCount', 'desc')
    .limit(5)
    .get()

  return snap.docs.map(d => {
    const data = d.data()
    return (data.shortForm as string) || (data.text as string) || ''
  }).filter(Boolean)
}

// ---------------------------------------------------------------------------
// AI Generation
// ---------------------------------------------------------------------------

async function generateAIAnalysis(
  performance: WeeklyCalibration['performance'],
  attentionAllocation: Array<{
    project: string
    focusHoursThisWeek: number
    percentOfTotal: number
    revenueSignal: number
    health: 'ON_TRACK' | 'STALLED' | 'NEW' | 'DORMANT'
  }>,
  activeDecisions: Array<{
    title: string
    hypothesis: string
    confidenceLevel: number
    killCriteria: string[]
    reviewDate: string
    reasoning: string
    chosenOption: string
    domain: string
  }>,
  networkHealth: WeeklyCalibration['networkHealth'],
  staleDecisionMakers: Array<{ name: string; daysSinceTouch: number; nextAction: string; warmIntrosGenerated: number }>,
  recentInsights: string[],
  principles: string[],
  logs: DailyLogData[],
  weekStart: string,
  weekEnd: string,
): Promise<{
  antitheses: WeeklyCalibration['decisions']['antitheses']
  blindSpots: string[]
  synthesis: string
  topRelationshipMoves: string[]
  attentionCommentary: Record<string, string>
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const todayKey = localDateString(new Date())

  const prompt = `You are a Bridgewater-style radical transparency advisor. Generate a weekly calibration report. Be direct, uncomfortable truths only, no flattery.

WEEK: ${weekStart} to ${weekEnd}

PERFORMANCE:
- Avg Reward Score: ${performance.avgRewardScore ?? 'N/A'} / 10 (${performance.scoreTrajectory})
- Focus Hours: ${performance.totalFocusHours}h
- Ships: ${performance.totalShips}
- Revenue Asks: ${performance.totalRevenueAsks}
- Revenue: $${performance.totalRevenue}
- Conversations: ${performance.totalConversations}
- Intros: ${performance.totalIntros}
- Cadence Hit Rate: ${performance.cadenceHitRate}%

ATTENTION ALLOCATION:
${attentionAllocation.map(a => `- ${a.project}: ${a.focusHoursThisWeek}h (${a.percentOfTotal}%), revenue $${a.revenueSignal}, health: ${a.health}`).join('\n')}

ACTIVE DECISIONS (${activeDecisions.length}):
${activeDecisions.map(d => {
    const daysUntil = d.reviewDate ? daysBetween(todayKey, d.reviewDate) : 999
    return `- "${d.title}" (confidence: ${d.confidenceLevel}%, review in ${daysUntil} days)
  Hypothesis: ${d.hypothesis}
  Chosen: ${d.chosenOption}
  Reasoning: ${d.reasoning}
  Kill criteria: ${d.killCriteria.join('; ') || 'None set'}`
  }).join('\n') || 'None'}

NETWORK:
- Total contacts: ${networkHealth.totalContacts}
- Touched this week: ${networkHealth.touchedThisWeek}
- Stale decision-makers: ${networkHealth.staleDecisionMakers}
- Warm intro rate: ${networkHealth.warmIntroRate}%
Stale decision-makers:
${staleDecisionMakers.map(c => `  - ${c.name} (${c.daysSinceTouch} days stale, next: "${c.nextAction}", intros generated: ${c.warmIntrosGenerated})`).join('\n') || '  None'}

RECENT INSIGHTS:
${recentInsights.slice(0, 5).map(i => `- ${i}`).join('\n') || 'None'}

ACTIVE PRINCIPLES:
${principles.map(p => `- ${p}`).join('\n') || 'None'}

DAILY LOG DETAILS:
${logs.map(l => `${l.date}: score=${l.rewardScore?.score ?? 'N/A'}, focus=${l.focusHoursActual || 0}h, spine="${l.spineProject || ''}", shipped="${l.whatShipped || ''}", asks=${l.revenueAsksCount || 0}, revenue=$${l.revenueThisSession || 0}, convos=${l.discoveryConversationsCount || 0}, intros=${l.warmIntrosMade || 0}, posts=${l.publicPostsCount || 0}, NS=${l.nervousSystemState || 'N/A'}`).join('\n')}

Generate the following (be brutally honest, Bridgewater-style):

1. ANTITHESES — For each active decision, generate the strongest counter-argument. What is the case that this decision is wrong? Which kill criteria are closest to triggering? Be specific to the data.

2. BLIND SPOTS — 3-5 patterns in the data the user is likely not seeing. Look for:
   - Misallocated attention (time vs revenue)
   - Missing follow-through (asks without follow-ups, conversations without intros)
   - Energy patterns (nervous system states vs output quality)
   - Breadth vs depth imbalances
   - Stalled momentum disguised as activity

3. SYNTHESIS — A 2-3 paragraph narrative (max 200 words) that tells the honest story of this week. What actually happened vs what should have happened? What is the one thing that would change the trajectory?

4. TOP 3 RELATIONSHIP MOVES — Specific next-week actions for the network. Use actual contact names where available.

5. ATTENTION COMMENTARY — For each project in the attention allocation, one sentence of direct commentary on whether the time-to-revenue ratio makes sense.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "antitheses": [
    { "decisionTitle": "...", "antithesis": "...", "killCriteriaStatus": "..." }
  ],
  "blindSpots": ["...", "..."],
  "synthesis": "...",
  "topRelationshipMoves": ["...", "...", "..."],
  "attentionCommentary": { "ProjectName": "..." }
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
      antitheses: (parsed.antitheses || []).map((a: Record<string, unknown>) => ({
        decisionTitle: String(a.decisionTitle || ''),
        antithesis: String(a.antithesis || ''),
        killCriteriaStatus: String(a.killCriteriaStatus || ''),
      })),
      blindSpots: (parsed.blindSpots || []).map((b: unknown) => String(b)),
      synthesis: String(parsed.synthesis || ''),
      topRelationshipMoves: (parsed.topRelationshipMoves || []).map((m: unknown) => String(m)),
      attentionCommentary: parsed.attentionCommentary || {},
    }
  } catch (error) {
    console.error('[weekly-calibration] AI generation failed:', error)
    return {
      antitheses: [],
      blindSpots: ['AI analysis unavailable. Review your weekly data manually.'],
      synthesis: 'Weekly AI synthesis failed. Check logs for details.',
      topRelationshipMoves: [],
      attentionCommentary: {},
    }
  }
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateWeeklyCalibration(uid: string): Promise<WeeklyCalibration> {
  const { weekStart, weekEnd, dates } = getWeekDates()

  // Fetch logs first (needed by networkHealth), then everything else in parallel
  const logs = await safeGet(() => fetchWeeklyLogs(uid, dates), [])

  const [
    activeDecisions,
    projects,
    networkHealth,
    staleDecisionMakers,
    recentInsights,
    principles,
  ] = await Promise.all([
    safeGet(() => fetchActiveDecisions(uid), []),
    safeGet(() => fetchProjects(uid), []),
    safeGet(() => fetchNetworkHealth(uid, dates, logs), {
      totalContacts: 0, touchedThisWeek: 0, staleDecisionMakers: 0,
      warmIntroRate: 0, topRelationshipMoves: [],
    }),
    safeGet(() => fetchStaleDecisionMakerDetails(uid), []),
    safeGet(() => fetchRecentInsights(uid), []),
    safeGet(() => fetchActivePrinciples(uid), []),
  ])

  // Aggregate performance
  const performance = aggregatePerformance(logs)

  // Aggregate attention allocation
  const attentionAllocationRaw = aggregateAttentionAllocation(logs, projects)

  // Build decision review
  const todayKey = localDateString(new Date())
  const approachingReview = activeDecisions
    .map(d => ({
      title: d.title,
      hypothesis: d.hypothesis,
      daysUntilReview: d.reviewDate ? daysBetween(todayKey, d.reviewDate) : 999,
      confidenceLevel: d.confidenceLevel,
    }))
    .filter(d => d.daysUntilReview <= 30)
    .sort((a, b) => a.daysUntilReview - b.daysUntilReview)

  // AI generation for antitheses, blind spots, synthesis, relationship moves, commentary
  const aiAnalysis = await generateAIAnalysis(
    performance,
    attentionAllocationRaw,
    activeDecisions,
    networkHealth,
    staleDecisionMakers,
    recentInsights,
    principles,
    logs,
    weekStart,
    weekEnd,
  )

  // Merge AI commentary into attention allocation
  const attentionAllocation = attentionAllocationRaw.map(a => ({
    ...a,
    aiCommentary: aiAnalysis.attentionCommentary[a.project] || '',
  }))

  // Merge AI relationship moves into network health
  const finalNetworkHealth: WeeklyCalibration['networkHealth'] = {
    ...networkHealth,
    topRelationshipMoves: aiAnalysis.topRelationshipMoves,
  }

  return {
    weekStart,
    weekEnd,
    performance,
    decisions: {
      activeCount: activeDecisions.length,
      approachingReview,
      antitheses: aiAnalysis.antitheses,
    },
    attentionAllocation,
    networkHealth: finalNetworkHealth,
    blindSpots: aiAnalysis.blindSpots,
    synthesis: aiAnalysis.synthesis,
  }
}
