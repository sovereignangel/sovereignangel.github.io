/**
 * Ironman goal forecast — pure functions estimating the probability of
 * hitting each race goal (swim time, bike speed, run pace) from Garmin
 * activity history, plus a projected finish time.
 *
 * Model, per discipline:
 * 1. Take recent activities of that sport, filter out short efforts and
 *    data glitches.
 * 2. Convert each to a race-distance-equivalent pace via Riegel scaling
 *    (a 10km run pace understates half-marathon pace; scale by
 *    (raceDist/actDist)^(k-1)).
 * 3. Recency-weight (14-day half-life) and fit a weighted linear trend of
 *    adjusted pace over time; project it to race day with clamps so a hot
 *    week can't promise miracles (max 8% total improvement).
 * 4. Probability = normal CDF of the gap between goal pace and projected
 *    pace, with variance from the observed session-to-session spread,
 *    inflated by how far out race day still is.
 * 5. A small recovery modifier (7-day sleep + HRV vs baseline) nudges all
 *    probabilities by at most +/-4 points — chronic under-recovery lowers
 *    the forecast even when paces look good.
 *
 * Every logged session counts as evidence about the person who logged it, at
 * full weight. An earlier version discounted sessions the two athletes trained
 * on the same day, on the theory that riding together means riding at the
 * slower one's tempo. It does not: these two start together and ride their own
 * speeds, which is why one 26 August ride reads 96.8km at 23.5km/h and the
 * other 183.2km at 30.2km/h. Nothing here now cares who else was out.
 */

import type { GarminActivity, GarminMetrics } from '@/lib/types'
import {
  RACE, RACE_NYC, GOALS, BASELINE,
  goalPaceMinKm,
  type RaceGoals, type Sport3,
} from './plan'
import { sportOfActivity, dedupeActivities, paceSeconds } from './adapt'

// The forecast projects fitness to the A-race in New York — race 1 on
// Sep 13 is the rehearsal and simply feeds the model as training data.
const TARGET_DATE = RACE_NYC.date

/**
 * Where the capability number came from: real sessions, or the pre-block swim
 * benchmark standing in until some are logged.
 */
export type PaceSource = 'logged' | 'benchmark'

export interface DisciplineForecast {
  sport: Sport3
  n: number // activities the model saw
  paceSource: PaceSource | null
  goalPaceMinKm: number
  currentPaceMinKm: number | null // recency-weighted, race-distance adjusted
  projectedPaceMinKm: number | null // projected to race day
  projectedSplitMin: number | null
  probability: number | null // 0-1, of hitting the goal
  sigma: number | null // pace spread (min/km) the probability is scored against
}

/** Whose goals to score the projection against. */
export interface ForecastOptions {
  goals?: RaceGoals
}

export interface RaceForecast {
  asOf: string
  disciplines: DisciplineForecast[]
  allThree: number | null // probability all three goals land
  forecastTotalMin: number | null // projected splits + transitions
  recoveryAdj: number // +/- applied from 7-day sleep/HRV, in probability points
}

const RIEGEL_EXP: Record<Sport3, number> = { run: 1.06, bike: 1.05, swim: 1.06 }
const MIN_KM: Record<Sport3, number> = { run: 3, bike: 15, swim: 0.4 }
// Sanity bounds on raw pace (min/km) to drop GPS glitches
export const PACE_BOUNDS: Record<Sport3, [number, number]> = { run: [3, 10], bike: [1.2, 4.5], swim: [15, 50] }
const HALF_LIFE_DAYS = 14
const LOOKBACK_DAYS = 56

export const RACE_KM: Record<Sport3, number> = { swim: RACE.swimKm, bike: RACE.bikeKm, run: RACE.runKm }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Standard normal CDF (Abramowitz-Stegun erf approximation) */
function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to + 'T00:00:00Z').getTime() - new Date(from + 'T00:00:00Z').getTime()) / 86400000)
}

interface Sample {
  ageDays: number // days before asOf
  pace: number // race-distance-adjusted min/km
  weight: number
}

function collectSamples(activities: GarminActivity[], sport: Sport3, asOf: string): Sample[] {
  const samples: Sample[] = []
  for (const a of dedupeActivities(activities)) {
    if (a.date == null || a.date > asOf || sportOfActivity(a.type) !== sport) continue
    const km = (a.distanceMeters ?? 0) / 1000
    // Moving time, not timer time: this is a capability estimate, and the rest
    // between reps is not evidence about how fast anyone swims.
    const min = paceSeconds(a) / 60
    if (km < MIN_KM[sport] || min <= 0) continue
    const pace = min / km
    const [lo, hi] = PACE_BOUNDS[sport]
    if (pace < lo || pace > hi) continue
    const ageDays = daysBetween(a.date, asOf)
    if (ageDays > LOOKBACK_DAYS) continue
    const adjPace = pace * Math.pow(RACE_KM[sport] / km, RIEGEL_EXP[sport] - 1)
    samples.push({ ageDays, pace: adjPace, weight: Math.pow(0.5, ageDays / HALF_LIFE_DAYS) })
  }
  // No swims logged yet: seed with the pre-block benchmark so the forecast
  // is honest rather than empty
  if (sport === 'swim' && samples.length === 0) {
    const benchPace =
      (BASELINE.swimBenchmark.minutes / (BASELINE.swimBenchmark.distanceM / 1000)) *
      Math.pow(RACE_KM.swim / (BASELINE.swimBenchmark.distanceM / 1000), RIEGEL_EXP.swim - 1)
    samples.push({
      ageDays: LOOKBACK_DAYS,
      pace: benchPace,
      weight: Math.pow(0.5, LOOKBACK_DAYS / HALF_LIFE_DAYS),
    })
  }
  return samples
}

function forecastDiscipline(
  activities: GarminActivity[],
  sport: Sport3,
  asOf: string,
  opts: ForecastOptions
): DisciplineForecast {
  const goals = opts.goals ?? GOALS
  const goal = goalPaceMinKm(sport, goals)
  const samples = collectSamples(activities, sport, asOf)
  const n = samples.length
  if (n === 0) {
    return {
      sport, n, paceSource: null, goalPaceMinKm: goal,
      currentPaceMinKm: null, projectedPaceMinKm: null, projectedSplitMin: null,
      probability: null, sigma: null,
    }
  }

  const wSum = samples.reduce((s, x) => s + x.weight, 0)
  const wMean = samples.reduce((s, x) => s + x.pace * x.weight, 0) / wSum

  // Weighted linear trend of pace vs time (x = -ageDays, so slope < 0 = improving)
  const daysToRace = Math.max(0, daysBetween(asOf, TARGET_DATE))
  const dateSpread = Math.max(...samples.map((x) => x.ageDays)) - Math.min(...samples.map((x) => x.ageDays))
  let projected = wMean
  if (n >= 4 && dateSpread >= 7) {
    const xMean = samples.reduce((s, x) => s + -x.ageDays * x.weight, 0) / wSum
    let sxx = 0
    let sxy = 0
    for (const x of samples) {
      const dx = -x.ageDays - xMean
      sxx += x.weight * dx * dx
      sxy += x.weight * dx * (x.pace - wMean)
    }
    if (sxx > 0) {
      const slope = sxy / sxx // min/km per day
      projected = wMean + slope * (daysToRace - xMean) // regression value at race day
    }
  }
  // A hot fortnight can't promise miracles; a rough one isn't destiny either
  projected = clamp(projected, wMean * 0.92, wMean * 1.03)

  // Spread of adjusted paces around the weighted mean, floored, inflated by
  // forecast horizon (further out = less certain)
  const variance = samples.reduce((s, x) => s + x.weight * (x.pace - wMean) ** 2, 0) / wSum
  let sigma = Math.sqrt(variance)
  sigma = Math.max(sigma, projected * (n < 3 ? 0.06 : 0.025))
  sigma *= 1 + daysToRace / 90

  // The one case where the number is not a logged session: the swim seed.
  const paceSource: PaceSource =
    sport === 'swim' && n === 1 && samples[0].ageDays === LOOKBACK_DAYS ? 'benchmark' : 'logged'

  const probability = clamp(normCdf((goal - projected) / sigma), 0.01, 0.99)

  return {
    sport,
    n,
    paceSource,
    goalPaceMinKm: goal,
    currentPaceMinKm: wMean,
    projectedPaceMinKm: projected,
    projectedSplitMin: projected * RACE_KM[sport],
    probability,
    sigma,
  }
}

/** Inverse standard normal CDF (Acklam's rational approximation) */
export function invNormCdf(p: number): number {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924]
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857]
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878]
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742]
  const pLow = 0.02425
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - pLow) {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  const q = p - 0.5
  const r = q * q
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/**
 * The race-adjusted pace (min/km) that would put this discipline's goal
 * probability at `targetProb` — the model's formula solved for pace.
 * `recoveryAdj` is subtracted first since it is added on top of the base
 * probability in computeRaceForecast.
 */
export function paceForProbability(d: DisciplineForecast, targetProb: number, recoveryAdj = 0): number | null {
  if (d.sigma == null) return null
  const base = clamp(targetProb - recoveryAdj, 0.01, 0.99)
  return d.goalPaceMinKm - d.sigma * invNormCdf(base)
}

/** 7-day recovery modifier from sleep score + HRV vs weekly baseline, +/-4 points max */
function recoveryAdjustment(metrics: GarminMetrics[], asOf: string): number {
  const recent = metrics.filter((m) => m.date <= asOf).slice(-7)
  if (recent.length === 0) return 0
  const sleeps = recent.map((m) => m.sleepScore).filter((v): v is number => typeof v === 'number')
  const hrvRatios = recent
    .filter((m) => m.hrvRmssd != null && m.hrvWeeklyAvg != null && m.hrvWeeklyAvg! > 0)
    .map((m) => m.hrvRmssd! / m.hrvWeeklyAvg!)
  const parts: number[] = []
  if (sleeps.length) parts.push(((sleeps.reduce((a, b) => a + b, 0) / sleeps.length - 72) / 100) * 0.3)
  if (hrvRatios.length) parts.push((hrvRatios.reduce((a, b) => a + b, 0) / hrvRatios.length - 1) * 0.3)
  if (!parts.length) return 0
  return clamp(parts.reduce((a, b) => a + b, 0) / parts.length, -0.04, 0.04)
}

export function computeRaceForecast(
  activities: GarminActivity[],
  metrics: GarminMetrics[],
  asOf: string,
  opts: ForecastOptions = {}
): RaceForecast {
  const goals = opts.goals ?? GOALS
  const recoveryAdj = recoveryAdjustment(metrics, asOf)
  const disciplines = (['swim', 'bike', 'run'] as const).map((sport) => {
    const d = forecastDiscipline(activities, sport, asOf, opts)
    return d.probability == null ? d : { ...d, probability: clamp(d.probability + recoveryAdj, 0.01, 0.99) }
  })

  const probs = disciplines.map((d) => d.probability)
  const allThree = probs.every((p): p is number => p != null) ? probs.reduce((a, b) => a * b, 1) : null

  const splits = disciplines.map((d) => d.projectedSplitMin)
  const forecastTotalMin = splits.every((s): s is number => s != null)
    ? splits.reduce((a, b) => a + b, 0) + goals.transitionMinutes
    : null

  return { asOf, disciplines, allThree, forecastTotalMin, recoveryAdj }
}
