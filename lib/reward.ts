import type { DailyLog, RewardScore, RewardComponents, ThesisPillar } from './types'
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

/** Generative Energy: sleep + training + body + regulation */
export function computeGE(log: Partial<DailyLog>, sleepTarget: number = 7.5): number {
  const sleepScore = sleepTarget > 0 ? clamp((log.sleepHours || 0) / sleepTarget, 0, 1) : 0

  // Support both new trainingTypes[] and legacy trainingType
  const types = log.trainingTypes && log.trainingTypes.length > 0
    ? log.trainingTypes
    : log.trainingType ? [log.trainingType] : []
  const trainingScore = types.length > 0
    ? Math.max(...types.map(t => TRAINING_SCORE[t] ?? 0.2))
    : 0.2

  const bodyScore = BODY_FELT_SCORE[log.bodyFelt || 'neutral'] ?? 0.6
  const nsScore = NS_STATE_ENERGY_SCORE[log.nervousSystemState || 'regulated'] ?? 1.0

  return floor(sleepScore * 0.35 + trainingScore * 0.2 + bodyScore * 0.2 + nsScore * 0.25)
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

/** Optionality — placeholder until calendar/portfolio integration */
export function computeOptionality(): number {
  return 0.5
}

/** Fragmentation Tax — placeholder until calendar integration */
export function computeFragmentation(): number {
  return 0
}

/** Thesis Coherence: how many of {AI, Markets, Mind} were touched today */
export function computeTheta(log: Partial<DailyLog>): number {
  const pillars = (log.pillarsTouched as ThesisPillar[] | undefined) || []
  const count = pillars.length
  return count === 0 ? 0.0 : count === 1 ? 0.33 : count === 2 ? 0.67 : 1.0
}

// ─── MAIN REWARD FUNCTION ───────────────────────────────────────────────

export function computeReward(
  log: Partial<DailyLog>,
  settings?: { sleepTarget?: number; focusHoursPerDay?: number; revenueAskQuotaPerDay?: number }
): RewardScore {
  const sleepTarget = settings?.sleepTarget ?? 7.5
  const focusTarget = settings?.focusHoursPerDay ?? 6
  const askQuota = settings?.revenueAskQuotaPerDay ?? 2

  const ge = computeGE(log, sleepTarget)
  const gi = computeGI(log)
  const gvc = computeGVC(log, focusTarget)
  const kappa = computeKappa(log, askQuota)
  const optionality = computeOptionality()
  const fragmentation = computeFragmentation()
  const theta = computeTheta(log)

  const gate = NERVOUS_SYSTEM_GATE[log.nervousSystemState || 'regulated'] ?? 1.0

  // Log-space combination: all components in [REWARD_FLOOR, 1]
  const logSum = Math.log(ge) + Math.log(gi) + Math.log(gvc) + Math.log(kappa) + Math.log(optionality)

  // Normalize from [log(0.05)*5, 0] → [0, 1]
  const minLogSum = Math.log(REWARD_FLOOR) * 5
  const normalizedLog = (logSum - minLogSum) / (0 - minLogSum)

  // Apply gate, fragmentation penalty, thesis coherence bonus
  const rawScore = gate * normalizedLog - fragmentation + theta * 0.15

  // Scale to 0-10 with one decimal place
  const score = clamp(Math.round(rawScore * 10 * 10) / 10, 0, 10)

  const components: RewardComponents = { ge, gi, gvc, kappa, optionality, fragmentation, theta, gate }

  return {
    score,
    components,
    computedAt: new Date().toISOString(),
  }
}
