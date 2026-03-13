import type { DailyLog, GarminMetrics, Project, RewardScore, RewardComponents } from './types'
import {
  NERVOUS_SYSTEM_GATE,
  NS_STATE_ENERGY_SCORE,
  MOVEMENT_SCORE,
  STEPS_TARGET,
  REWARD_FLOOR,
} from './constants'

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function floor(val: number): number {
  return Math.max(val, REWARD_FLOOR)
}

// ─── COMPONENT FUNCTIONS ────────────────────────────────────────────────

/** Sleep: hours vs target */
export function computeSleep(log: Partial<DailyLog>, sleepTarget: number = 7.5): number {
  return floor(sleepTarget > 0 ? clamp((log.sleepHours || 0) / sleepTarget, 0, 1) : 0)
}

/** Movement: steps toward 15k + training program adherence
 *  Steps from Garmin (60% weight), training program (40% weight)
 *  Sunday is rest — program score is 1.0 if rest day */
export function computeMovement(log: Partial<DailyLog>, garminData?: GarminMetrics | null): number {
  const steps = garminData?.steps ?? 0
  const stepsScore = clamp(steps / STEPS_TARGET, 0, 1)
  const movementType = log.movementType || 'none'
  const programScore = MOVEMENT_SCORE[movementType] ?? 0.1

  return floor(Math.pow(stepsScore, 0.6) * Math.pow(programScore, 0.4))
}

/** Regulation: Garmin stress score + journal processing nuance
 *  Garmin stress: 0-100, lower = more regulated
 *  Journal: dampens the stress signal — processing stress = regulating it
 *  e.g. stress=60 raw=0.20, but journaling lifts effective stress to ~0.40 */
export function computeRegulation(log: Partial<DailyLog>, garminData?: GarminMetrics | null): number {
  const stress = garminData?.stressLevel
  if (stress == null) {
    // Fallback to manual NS state toggle when no Garmin data
    return floor(NS_STATE_ENERGY_SCORE[log.nervousSystemState || 'regulated'] ?? 1.0)
  }

  const rawScore = clamp(1 - (stress / 75), 0, 1)  // 0 stress = 1.0, 75+ = 0.0
  const journaled = !!(log.journalEntry && log.journalEntry.trim().length > 20)

  // Journaling dampens stress: lifts score 30% toward 1.0
  // stress=60 → raw=0.20 → with journal: 0.20 + 0.30*(1-0.20) = 0.44
  // stress=30 → raw=0.60 → with journal: 0.60 + 0.30*(1-0.60) = 0.72
  const regulated = journaled ? rawScore + 0.3 * (1 - rawScore) : rawScore

  return floor(clamp(regulated, 0.05, 1))
}

/** Intelligence Growth Rate: problems detected + problem selected for testing */
export function computeGI(log: Partial<DailyLog>): number {
  const problems = log.problems || []
  const filled = problems.filter(p => p.problem && p.problem.trim() !== '').length
  const problemScore = filled === 0 ? 0.1 : filled === 1 ? 0.5 : filled === 2 ? 0.8 : 1.0
  const selectedBonus = (log.problemSelected && log.problemSelected.trim() !== '') ? 0.2 : 0

  return floor(clamp(problemScore + selectedBonus, 0, 1))
}

/** Value Creation Rate: shipping + focus hours + recency + speed */
export function computeGVC(log: Partial<DailyLog>, focusTarget: number = 6, recentLogs: Partial<DailyLog>[] = []): number {
  const shippedToday = !!(log.whatShipped && log.whatShipped.trim() !== '')
  const shippedBase = shippedToday ? 0.4 : 0.05
  const publicBonus = log.publicIteration ? 0.2 : 0
  const focusRatio = focusTarget > 0 ? clamp((log.focusHoursActual || 0) / focusTarget, 0, 1) : 0
  const speedBonus = log.speedOverPerfection ? 0.1 : 0

  // Auto-compute days since last ship from recentLogs (Bug 3 fix)
  let daysOut = 0
  if (!shippedToday) {
    const sorted = [...recentLogs]
      .filter(l => l.date && l.date < (log.date || '9'))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    for (const past of sorted) {
      daysOut++
      if (past.whatShipped && past.whatShipped.trim() !== '') break
    }
    // If no ship found in window, assume worst case
    if (sorted.length > 0 && !sorted.some(l => l.whatShipped && l.whatShipped.trim() !== '')) {
      daysOut = sorted.length + 1
    }
  }

  const recencyScore = daysOut === 0 ? 1.0 : daysOut === 1 ? 0.7 : daysOut === 2 ? 0.4 : 0.1

  const raw = (shippedBase + publicBonus) * 0.35 + focusRatio * 0.35 + recencyScore * 0.2 + speedBonus
  return floor(clamp(raw, 0, 1))
}

/** Capture Ratio: revenue asks + revenue earned + feedback loops */
export function computeKappa(log: Partial<DailyLog>, askQuota: number = 2): number {
  const askRatio = askQuota > 0 ? clamp((log.revenueAsksCount || 0) / askQuota, 0, 1) : 0
  const revenueSignal = (log.revenueThisSession || 0) > 0 ? 1.0 : 0.2
  const feedbackBonus = log.feedbackLoopClosed ? 0.15 : 0

  // Stream quality adjusts revenue weight — recurring genuinely earns more
  // Max base: 0.50 + 0.40 + 0.15 = 1.05 (recurring) → clamped to 1.0
  // Max base: 0.50 + 0.35 + 0.15 = 1.00 (one-time) → exactly 1.0
  // Max base: 0.50 + 0.25 + 0.15 = 0.90 (organic)  → caps at 0.9
  const revenueWeight =
    log.revenueStreamType === 'recurring' ? 0.40 :
    log.revenueStreamType === 'organic' ? 0.25 : 0.35

  const raw = askRatio * 0.50 + revenueSignal * revenueWeight + feedbackBonus
  return floor(clamp(raw, 0, 1))
}

/** Optionality: portfolio diversity (HHI) + daily pillar diversification */
export function computeOptionality(projects: Project[] = [], log: Partial<DailyLog> = {}): number {
  const active = projects.filter(p => p.status !== 'archived')
  if (active.length === 0) return 0.5 // no projects loaded yet, neutral default

  const totalPercent = active.reduce((sum, p) => sum + p.timeAllocationPercent, 0)
  if (totalPercent === 0) return REWARD_FLOOR

  // HHI = sum of squared shares; HHI=1 means all-in, HHI~0.25 means 4 even projects
  const hhi = active.reduce((sum, p) => {
    const share = p.timeAllocationPercent / totalPercent
    return sum + share * share
  }, 0)

  // Bonus for having backup/optionality projects (cheap call options)
  const hasBackup = active.some(p => p.status === 'backup' || p.status === 'optionality')
  const backupBonus = hasBackup ? 0.1 : 0

  // Daily diversification: touching multiple pillars today signals active exploration
  const pillarCount = (log.pillarsTouched || []).length
  const diversificationBonus = pillarCount >= 3 ? 0.15 : pillarCount >= 2 ? 0.08 : 0

  return floor(clamp(1 - hhi + backupBonus + diversificationBonus, 0, 1))
}

/** Fragmentation Tax: KL divergence between actual focus and thesis allocation */
export function computeFragmentation(log: Partial<DailyLog>, projects: Project[] = []): number {
  const active = projects.filter(p => p.status !== 'archived')
  if (active.length === 0) return 0 // no projects loaded, no penalty

  const totalPercent = active.reduce((sum, p) => sum + p.timeAllocationPercent, 0)
  if (totalPercent === 0) return 0

  // Build thesis distribution (w_thesis)
  const wThesis = active.map(p => p.timeAllocationPercent / totalPercent)

  // Build actual distribution using pillar engagement as a proxy for focus spread
  const focusHours = log.focusHoursActual || 0
  if (focusHours === 0) return 0 // no focus logged, no divergence measurable

  const spineProject = log.spineProject || ''
  const pillarCount = (log.pillarsTouched || []).length

  // Estimate spine concentration from pillar engagement:
  // 0-1 pillars → highly concentrated on spine (85%)
  // 2 pillars   → moderate spread (70% spine)
  // 3+ pillars  → broadly spread (55% spine)
  const spineShare = pillarCount <= 1 ? 0.85 : pillarCount === 2 ? 0.70 : 0.55
  const restShare = 1 - spineShare

  const wActual = active.map(p => {
    if (p.name.toLowerCase() === spineProject.toLowerCase() || p.id === spineProject) {
      return spineShare
    }
    return restShare / Math.max(active.length - 1, 1)
  })

  // Normalize w_actual
  const totalActual = wActual.reduce((s, v) => s + v, 0)
  const wActualNorm = wActual.map(v => v / totalActual)

  // D_KL(actual || thesis) = sum w_actual[i] * log(w_actual[i] / w_thesis[i])
  let kl = 0
  for (let i = 0; i < active.length; i++) {
    if (wActualNorm[i] > 0 && wThesis[i] > 0) {
      kl += wActualNorm[i] * Math.log(wActualNorm[i] / wThesis[i])
    }
  }

  return clamp(kl, 0, 1)
}

/** Skill Building: deliberate practice + new techniques + automation/leverage */
export function computeSigma(log: Partial<DailyLog>): number {
  // Deliberate practice: minutes spent specifically on getting better
  // Target: 30 min/day of deliberate practice
  const practiceTarget = 30
  const practiceScore = Math.min((log.deliberatePracticeMinutes || 0) / practiceTarget, 1.0)

  // New technique: used a tool/method for the first time today
  const techniqueScore = log.newTechniqueApplied ? 1.0 : 0.1

  // Automation/leverage: built something that saves future time
  const automationScore = log.automationCreated ? 1.0 : 0.1

  // Weighted: practice 50%, technique 25%, automation 25%
  const raw = practiceScore * 0.50 + techniqueScore * 0.25 + automationScore * 0.25

  return floor(clamp(raw, 0.05, 1))
}

/** Generative Discovery: customer conversations + RSS signal review + insights extracted */
export function computeGD(log: Partial<DailyLog>): number {
  const conversationTarget = 2  // Target: 2 discovery calls/day
  const signalReviewTarget = 5   // Target: 5 external signals reviewed/day

  const conversationScore = Math.min(
    (log.discoveryConversationsCount || 0) / conversationTarget,
    1.0
  )

  const signalReviewScore = Math.min(
    (log.externalSignalsReviewed || 0) / signalReviewTarget,
    1.0
  )

  const insightScore = (log.insightsExtracted || 0) > 0 ? 1.0 : 0.1

  // Weighted: conversations 50%, signal review 30%, insights 20%
  const rawScore = conversationScore * 0.5
                 + signalReviewScore * 0.3
                 + insightScore * 0.2

  return floor(clamp(rawScore, 0.05, 1))
}

/** Network Capital: intros + meetings + public posts + inbound (conversations counted in GD) */
export function computeGN(log: Partial<DailyLog>): number {
  // NOTE: discoveryConversationsCount is intentionally excluded here — it's
  // already weighted 50% in computeGD. GN measures *network growth* signals.
  const introScore = Math.min(((log.warmIntrosMade || 0) + (log.warmIntrosReceived || 0)) / 2, 1.0)
  const meetingScore = (log.meetingsBooked || 0) > 0 ? 1.0 : 0.1
  const publicScore = Math.min((log.publicPostsCount || 0) / 2, 1.0) // target: 2 posts/day
  const inboundScore = (log.inboundInquiries || 0) > 0 ? 1.0 : 0.1

  return floor(clamp(
    introScore * 0.30 +
    meetingScore * 0.25 +
    publicScore * 0.25 +
    inboundScore * 0.20,
    0.05, 1
  ))
}

/** Judgment + Cognition: PsyCap + cadence completion (calibration requires external data) */
export function computeJ(log: Partial<DailyLog>): number {
  // PsyCap average (from daily log, 1-5 scale normalized to 0-1)
  const psycap = [
    log.psyCapHope, log.psyCapEfficacy,
    log.psyCapResilience, log.psyCapOptimism,
  ].filter((v): v is number => v !== undefined && v > 0)
  const psycapScore = psycap.length > 0
    ? (psycap.reduce((s, v) => s + v, 0) / psycap.length) / 5
    : 0 // no free pass — fill in PsyCap or J drops to floor

  return floor(clamp(psycapScore, 0.05, 1))
}

// ─── COMPONENT LOGGING DETECTION ────────────────────────────────────────
// Determines if a component has real user input vs sitting at defaults.
// Unlogged components are excluded from their pillar's geometric mean
// rather than dragging the score down — "score what you measure."

function isComponentLogged(log: Partial<DailyLog>, component: string): boolean {
  switch (component) {
    case 'sleep': return (log.sleepHours || 0) > 0
    case 'movement': return true  // Garmin auto-populates or user sets movementType
    case 'regulation': return true  // Garmin stress or NS state toggle
    case 'gi': return (log.problems || []).some(p => p.problem?.trim()) || !!(log.problemSelected?.trim())
    case 'gd': return (log.discoveryConversationsCount || 0) > 0 || (log.externalSignalsReviewed || 0) > 0 || (log.insightsExtracted || 0) > 0
    case 'sigma': return (log.deliberatePracticeMinutes || 0) > 0 || !!log.newTechniqueApplied || !!log.automationCreated
    case 'j': return [log.psyCapHope, log.psyCapEfficacy, log.psyCapResilience, log.psyCapOptimism].some(v => v !== undefined && v > 0)
    case 'gvc': return !!(log.whatShipped?.trim()) || (log.focusHoursActual || 0) > 0
    case 'kappa': return (log.revenueAsksCount || 0) > 0 || (log.revenueThisSession || 0) > 0 || !!log.feedbackLoopClosed
    case 'gn': return (log.warmIntrosMade || 0) > 0 || (log.warmIntrosReceived || 0) > 0 || (log.meetingsBooked || 0) > 0 || (log.publicPostsCount || 0) > 0 || (log.inboundInquiries || 0) > 0
    case 'optionality': return true  // always compute from projects
    default: return false
  }
}

/** Geometric mean of only the values provided. Returns neutral 0.5 if empty. */
function geoMeanOfLogged(values: number[]): number {
  if (values.length === 0) return 0.5  // neutral prior — no data, no penalty
  return Math.pow(values.reduce((p, v) => p * v, 1), 1 / values.length)
}

/** Count consecutive days with a recorded score, going backwards from most recent */
function computeStreak(recentLogs: Partial<DailyLog>[], todayDate?: string): number {
  const sorted = [...recentLogs]
    .filter(l => l.date && l.date < (todayDate || '9'))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  let streak = 0
  for (const log of sorted) {
    if (log.rewardScore && log.rewardScore.score > 0) streak++
    else break
  }
  return streak
}

// ─── MAIN REWARD FUNCTION ───────────────────────────────────────────────
//
// Architecture: Cascading Compound (Body → Brain → Build)
//
// When you wake up, the reward begins with how well you rested (Body).
// That foundation compounds throughout the day via intelligence growth
// (Brain) and output (Build).
//
// Formula:
//   compound = body × (1 + brain) × (1 + build) / 4
//   score = 10 × gate × compound × (1 + streakBonus) − fragmentation_penalty
//
// Within each pillar: geometric mean of LOGGED components only.
// Unlogged components are excluded (neutral prior), not floored at 0.15.
// This scores what you measure — missing data widens uncertainty, not punishment.
//
// Cross-pillar: arithmetic cascade, not geometric mean.
// A weak Brain day reduces but doesn't destroy a great Body + Build day.
// Body is always multiplicative (foundation) — zero rest = zero score.

export interface RewardContext {
  recentLogs?: Partial<DailyLog>[]
  projects?: Project[]
  garminData?: GarminMetrics | null
}

export function computeReward(
  log: Partial<DailyLog>,
  settings?: { sleepTarget?: number; focusHoursPerDay?: number; revenueAskQuotaPerDay?: number },
  context?: RewardContext
): RewardScore {
  const sleepTarget = settings?.sleepTarget ?? 7.5
  const focusTarget = settings?.focusHoursPerDay ?? 6
  const askQuota = settings?.revenueAskQuotaPerDay ?? 2
  const recentLogs = context?.recentLogs ?? []
  const projects = context?.projects ?? []
  const garminData = context?.garminData ?? null

  // ── Compute all 11 components (unchanged) ──
  const sleep = computeSleep(log, sleepTarget)
  const movement = computeMovement(log, garminData)
  const regulation = computeRegulation(log, garminData)

  const gi = computeGI(log)
  const gd = computeGD(log)
  const sigma = computeSigma(log)
  const j = computeJ(log)

  const gvc = computeGVC(log, focusTarget, recentLogs)
  const kappa = computeKappa(log, askQuota)
  const gn = computeGN(log)
  const optionality = computeOptionality(projects, log)

  const fragmentation = computeFragmentation(log, projects)
  const gate = NERVOUS_SYSTEM_GATE[log.nervousSystemState || 'regulated'] ?? 1.0

  // ── Pillar sub-means (geo mean of LOGGED components only) ──
  const bodyComponents = { sleep, movement, regulation }
  const brainComponents = { gi, gd, sigma, j }
  const buildComponents = { gvc, kappa, gn, optionality }

  const bodyLogged = Object.entries(bodyComponents)
    .filter(([key]) => isComponentLogged(log, key))
    .map(([, val]) => val)
  const brainLogged = Object.entries(brainComponents)
    .filter(([key]) => isComponentLogged(log, key))
    .map(([, val]) => val)
  const buildLogged = Object.entries(buildComponents)
    .filter(([key]) => isComponentLogged(log, key))
    .map(([, val]) => val)

  const body = geoMeanOfLogged(bodyLogged)
  const brain = geoMeanOfLogged(brainLogged)
  const build = geoMeanOfLogged(buildLogged)

  // ── Cascading compound ──
  // Body is the foundation. Brain amplifies it. Build amplifies further.
  // Max: 1.0 × 2.0 × 2.0 / 4 = 1.0
  // Body-only (great rest, nothing else logged): 1.0 × 1.5 × 1.5 / 4 = 0.5625 → score ~5.6
  // Zero body: 0 × anything = 0 → score 0
  const compound = body * (1 + brain) * (1 + build) / 4

  // ── Streak bonus (trajectory reward) ──
  // Each consecutive day of logging adds 3%, capped at 15% (5-day streak)
  const streak = computeStreak(recentLogs, log.date)
  const streakBonus = Math.min(streak * 0.03, 0.15)

  // ── Final score ──
  const rawScore = gate * compound * (1 + streakBonus) - fragmentation * 0.15

  // Scale to 0-10 with one decimal place
  const score = clamp(Math.round(rawScore * 10 * 10) / 10, 0, 10)

  const components: RewardComponents = {
    sleep, movement, regulation,
    gi, gd, sigma, j,
    gvc, kappa, gn, optionality,
    fragmentation, gate,
    body, brain, build,
    compound,
    streak,
    streakBonus,
  }

  return {
    score,
    delta: null, // computed by caller with access to yesterday's score
    components,
    computedAt: new Date().toISOString(),
  }
}
