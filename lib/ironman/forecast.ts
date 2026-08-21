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
 */

import type { GarminActivity, GarminMetrics } from '@/lib/types'
import { RACE, RACE_NYC, GOALS, BASELINE } from './plan'
import { sportOfActivity } from './adapt'

// The forecast projects fitness to the A-race in New York — race 1 on
// Sep 13 is the rehearsal and simply feeds the model as training data.
const TARGET_DATE = RACE_NYC.date

type Sport3 = 'swim' | 'bike' | 'run'

export interface DisciplineForecast {
  sport: Sport3
  n: number // activities the model saw
  goalPaceMinKm: number
  currentPaceMinKm: number | null // recency-weighted, race-distance adjusted
  projectedPaceMinKm: number | null // projected to race day
  projectedSplitMin: number | null
  probability: number | null // 0-1, of hitting the goal
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
const PACE_BOUNDS: Record<Sport3, [number, number]> = { run: [3, 10], bike: [1.2, 4.5], swim: [15, 50] }
const HALF_LIFE_DAYS = 14
const LOOKBACK_DAYS = 56

const RACE_KM: Record<Sport3, number> = { swim: RACE.swimKm, bike: RACE.bikeKm, run: RACE.runKm }

export function goalPaceMinKm(sport: Sport3): number {
  if (sport === 'swim') return GOALS.swimMinutes / RACE.swimKm
  if (sport === 'bike') return 60 / (GOALS.bikeMph * 1.609344)
  return GOALS.runPaceMinPerMile / 1.609344
}

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
  for (const a of activities) {
    if (a.date == null || a.date > asOf || sportOfActivity(a.type) !== sport) continue
    const km = (a.distanceMeters ?? 0) / 1000
    const min = (a.durationSeconds ?? 0) / 60
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
    samples.push({ ageDays: LOOKBACK_DAYS, pace: benchPace, weight: Math.pow(0.5, LOOKBACK_DAYS / HALF_LIFE_DAYS) })
  }
  return samples
}

function forecastDiscipline(activities: GarminActivity[], sport: Sport3, asOf: string): DisciplineForecast {
  const goal = goalPaceMinKm(sport)
  const samples = collectSamples(activities, sport, asOf)
  const n = samples.length
  if (n === 0) {
    return { sport, n, goalPaceMinKm: goal, currentPaceMinKm: null, projectedPaceMinKm: null, projectedSplitMin: null, probability: null }
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

  const probability = clamp(normCdf((goal - projected) / sigma), 0.01, 0.99)

  return {
    sport,
    n,
    goalPaceMinKm: goal,
    currentPaceMinKm: wMean,
    projectedPaceMinKm: projected,
    projectedSplitMin: projected * RACE_KM[sport],
    probability,
  }
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
  asOf: string
): RaceForecast {
  const recoveryAdj = recoveryAdjustment(metrics, asOf)
  const disciplines = (['swim', 'bike', 'run'] as const).map((sport) => {
    const d = forecastDiscipline(activities, sport, asOf)
    return d.probability == null ? d : { ...d, probability: clamp(d.probability + recoveryAdj, 0.01, 0.99) }
  })

  const probs = disciplines.map((d) => d.probability)
  const allThree = probs.every((p): p is number => p != null) ? probs.reduce((a, b) => a * b, 1) : null

  const splits = disciplines.map((d) => d.projectedSplitMin)
  const forecastTotalMin = splits.every((s): s is number => s != null)
    ? splits.reduce((a, b) => a + b, 0) + GOALS.transitionMinutes
    : null

  return { asOf, disciplines, allThree, forecastTotalMin, recoveryAdj }
}
