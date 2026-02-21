import type { DailyLog, Project, RewardScore, RewardComponents, ThesisPillar } from './types'
import {
  NERVOUS_SYSTEM_GATE,
  TRAINING_SCORE,
  BODY_FELT_SCORE,
  NS_STATE_ENERGY_SCORE,
  REWARD_FLOOR,
} from './constants'

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function floor(val: number): number {
  return Math.max(val, REWARD_FLOOR)
}

// ─── COMPONENT FUNCTIONS ────────────────────────────────────────────────

/** Generative Energy: geometric mean of sleep × training × body × regulation */
export function computeGE(log: Partial<DailyLog>, sleepTarget: number = 7.5): number {
  const sleepScore = floor(sleepTarget > 0 ? clamp((log.sleepHours || 0) / sleepTarget, 0, 1) : 0)

  const types = log.trainingTypes && log.trainingTypes.length > 0
    ? log.trainingTypes
    : log.trainingType ? [log.trainingType] : []
  const trainingScore = floor(types.length > 0
    ? Math.max(...types.map(t => TRAINING_SCORE[t] ?? 0.2))
    : 0.2)

  const bodyScore = floor(BODY_FELT_SCORE[log.bodyFelt || 'neutral'] ?? 0.6)
  const nsScore = floor(NS_STATE_ENERGY_SCORE[log.nervousSystemState || 'regulated'] ?? 1.0)

  // Weighted geometric mean: sleep^0.35 × training^0.2 × body^0.2 × ns^0.25
  // If any sub-component is at floor (0.05), it drags the entire GE down
  return floor(
    Math.pow(sleepScore, 0.35) *
    Math.pow(trainingScore, 0.2) *
    Math.pow(bodyScore, 0.2) *
    Math.pow(nsScore, 0.25)
  )
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
export function computeGVC(log: Partial<DailyLog>, focusTarget: number = 6): number {
  const shippedBase = (log.whatShipped && log.whatShipped.trim() !== '') ? 0.4 : 0.05
  const publicBonus = log.publicIteration ? 0.2 : 0
  const focusRatio = focusTarget > 0 ? clamp((log.focusHoursActual || 0) / focusTarget, 0, 1) : 0
  const speedBonus = log.speedOverPerfection ? 0.1 : 0

  const daysOut = log.daysSinceLastOutput || 0
  const recencyScore = daysOut === 0 ? 1.0 : daysOut === 1 ? 0.7 : daysOut === 2 ? 0.4 : 0.1

  const raw = (shippedBase + publicBonus) * 0.35 + focusRatio * 0.35 + recencyScore * 0.2 + speedBonus
  return floor(clamp(raw, 0, 1))
}

/** Capture Ratio: revenue asks + revenue earned + feedback loops */
export function computeKappa(log: Partial<DailyLog>, askQuota: number = 2): number {
  const askRatio = askQuota > 0 ? clamp((log.revenueAsksCount || 0) / askQuota, 0, 1) : 0
  const revenueSignal = (log.revenueThisSession || 0) > 0 ? 1.0 : 0.2
  const feedbackBonus = log.feedbackLoopClosed ? 0.15 : 0

  const streamMultiplier =
    log.revenueStreamType === 'recurring' ? 1.15 :
    log.revenueStreamType === 'organic' ? 0.9 : 1.0

  const raw = (askRatio * 0.5 + revenueSignal * 0.35 + feedbackBonus) * streamMultiplier
  return floor(clamp(raw, 0, 1))
}

/** Optionality: portfolio diversity via Herfindahl-Hirschman Index */
export function computeOptionality(projects: Project[] = []): number {
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

  return floor(clamp(1 - hhi + backupBonus, 0, 1))
}

/** Fragmentation Tax: KL divergence between actual focus and thesis allocation */
export function computeFragmentation(log: Partial<DailyLog>, projects: Project[] = []): number {
  const active = projects.filter(p => p.status !== 'archived')
  if (active.length === 0) return 0 // no projects loaded, no penalty

  const totalPercent = active.reduce((sum, p) => sum + p.timeAllocationPercent, 0)
  if (totalPercent === 0) return 0

  // Build thesis distribution (w_thesis)
  const wThesis = active.map(p => p.timeAllocationPercent / totalPercent)

  // Build actual distribution: assign today's focus hours to the active project
  const focusHours = log.focusHoursActual || 0
  if (focusHours === 0) return 0 // no focus logged, no divergence measurable

  const spineProject = log.spineProject || ''
  const wActual = active.map(p => {
    // Assign all focus to the project matching spineProject, rest get a small epsilon
    if (p.name.toLowerCase() === spineProject.toLowerCase() || p.id === spineProject) {
      return 0.9 // simplified: most focus goes to spine
    }
    return 0.1 / Math.max(active.length - 1, 1) // distribute rest evenly
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

/** Thesis Coherence: 7-day rolling pillar engagement */
export function computeTheta(log: Partial<DailyLog>, recentLogs: Partial<DailyLog>[] = []): number {
  // Collect all pillars touched across recent logs + today
  const allLogs = [...recentLogs, log]
  const touchedPillars = new Set<ThesisPillar>()

  for (const l of allLogs) {
    const pillars = (l.pillarsTouched as ThesisPillar[] | undefined) || []
    for (const p of pillars) {
      touchedPillars.add(p)
    }
  }

  const count = touchedPillars.size
  return count === 0 ? 0.0 : count === 1 ? 0.33 : count === 2 ? 0.67 : 1.0
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

/** Network Capital: conversations + intros + meetings + public posts */
export function computeGN(log: Partial<DailyLog>): number {
  const conversationTarget = 2
  const conversationScore = Math.min((log.discoveryConversationsCount || 0) / conversationTarget, 1.0)
  const introScore = Math.min(((log.warmIntrosMade || 0) + (log.warmIntrosReceived || 0)) / 2, 1.0)
  const meetingScore = (log.meetingsBooked || 0) > 0 ? 1.0 : 0.2
  const publicScore = (log.publicPostsCount || 0) > 0 ? 0.8 : 0.2

  return floor(clamp(
    conversationScore * 0.35 +
    introScore * 0.25 +
    meetingScore * 0.2 +
    publicScore * 0.2,
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
    : 0.5 // neutral when no data

  return floor(clamp(psycapScore, 0.05, 1))
}

// ─── MAIN REWARD FUNCTION ───────────────────────────────────────────────

export interface RewardContext {
  recentLogs?: Partial<DailyLog>[]
  projects?: Project[]
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

  const ge = computeGE(log, sleepTarget)
  const gi = computeGI(log)
  const gvc = computeGVC(log, focusTarget)
  const kappa = computeKappa(log, askQuota)
  const optionality = computeOptionality(projects)
  const fragmentation = computeFragmentation(log, projects)
  const theta = computeTheta(log, recentLogs)
  const gd = computeGD(log)
  const gn = computeGN(log)
  const j = computeJ(log)

  const gate = NERVOUS_SYSTEM_GATE[log.nervousSystemState || 'regulated'] ?? 1.0

  // Geometric mean of 8 multiplicative components
  const geoMean = Math.pow(ge * gi * gvc * kappa * optionality * gd * gn * j, 1 / 8)

  // Apply gate, fragmentation penalty, thesis coherence bonus
  const rawScore = gate * geoMean - fragmentation * 0.3 + theta * 0.15

  // Scale to 0-10 with one decimal place
  const score = clamp(Math.round(rawScore * 10 * 10) / 10, 0, 10)

  const components: RewardComponents = { ge, gi, gvc, kappa, optionality, gd, gn, j, fragmentation, theta, gate }

  return {
    score,
    delta: null, // computed by caller with access to yesterday's score
    components,
    computedAt: new Date().toISOString(),
  }
}
