/**
 * Ironman adaptive engine — pure functions, usable from both the client
 * dashboard and the server cron.
 *
 * Inputs: garmin_metrics (recovery) + garmin_activities (completed work).
 * Outputs: daily readiness, per-session completion matching, and an
 * adjusted version of today's plan.
 */

import type { GarminMetrics, GarminActivity } from '@/lib/types'
import { PLAN, RACE, type PlanDay, type PlannedSession, type Sport } from './plan'

// ── Sport matching ────────────────────────────────────────────────────────

const SPORT_TYPES: Record<Exclude<Sport, 'rest'>, string[]> = {
  run: ['running', 'treadmill_running', 'track_running', 'trail_running'],
  bike: ['cycling', 'road_biking', 'virtual_ride', 'indoor_cycling', 'mountain_biking', 'gravel_cycling'],
  swim: ['lap_swimming', 'open_water_swimming'],
  strength: ['strength_training', 'yoga', 'pilates', 'indoor_cardio'],
  brick: [
    'cycling', 'road_biking', 'virtual_ride', 'indoor_cycling', 'gravel_cycling',
    'running', 'treadmill_running', 'trail_running',
    'lap_swimming', 'open_water_swimming',
    'multisport', 'triathlon',
  ],
}

export function sportOfActivity(type: string): Sport | null {
  if (SPORT_TYPES.swim.includes(type)) return 'swim'
  if (SPORT_TYPES.bike.includes(type)) return 'bike'
  if (SPORT_TYPES.run.includes(type)) return 'run'
  if (SPORT_TYPES.strength.includes(type)) return 'strength'
  if (type === 'multisport' || type === 'triathlon') return 'brick'
  return null
}

/**
 * Drop double-logged sessions before anything measures them.
 *
 * A ride recorded by both a head unit and a watch arrives as two activities
 * with the same date, sport and numbers. Left alone it counts twice in weekly
 * volume and twice in the pace model, which quietly doubles the apparent load
 * of whoever happens to wear two devices. Same sport, same day, within 5% on
 * both distance and duration is a duplicate; the longer record survives.
 */
export function dedupeActivities(activities: GarminActivity[]): GarminActivity[] {
  const kept: GarminActivity[] = []
  const near = (a: number, b: number) => {
    const hi = Math.max(a, b)
    return hi === 0 ? true : Math.abs(a - b) / hi <= 0.05
  }
  for (const a of [...activities].sort((x, y) => (y.durationSeconds ?? 0) - (x.durationSeconds ?? 0))) {
    const sport = sportOfActivity(a.type)
    const dup = kept.some(
      (k) =>
        k.date === a.date &&
        sportOfActivity(k.type) === sport &&
        sport !== null &&
        near(k.distanceMeters ?? 0, a.distanceMeters ?? 0) &&
        near(k.durationSeconds ?? 0, a.durationSeconds ?? 0)
    )
    if (!dup) kept.push(a)
  }
  return kept
}

/**
 * Below this share of the timer, a "moving" time is a broken record rather
 * than a hard set. The deepest rest ratio in this file is 46%.
 */
const MIN_MOVING_SHARE = 0.4

/**
 * The seconds a pace should be measured over.
 *
 * Not the same question as "how long was the session". A 20x100 set off a
 * minute is 64 minutes of your evening and 44 minutes of swimming, and only
 * the second one divides into distance to give a speed. Elapsed time stays the
 * right answer for volume, compliance and load — this is for pace alone.
 *
 * Swimming only, deliberately. On a run or a ride Garmin's timer already
 * pauses, so the two clocks agree to within a percent, and what disagreement
 * remains is as often a dropped signal as a real stop: one 55km ride in this
 * file reports a moving time implying 73km/h. Trading a rounding error for
 * that is a bad trade. In a pool the gap is not an artefact, it is the
 * workout — the rest between reps is designed in, and counting it as swimming
 * made the hardest set of the block arrive as evidence of getting slower.
 */
export function paceSeconds(a: GarminActivity): number {
  const elapsed = a.durationSeconds ?? 0
  if (sportOfActivity(a.type) !== 'swim') return elapsed
  const moving = a.movingDurationSeconds
  if (moving == null || moving <= 0 || moving > elapsed || moving < elapsed * MIN_MOVING_SHARE) return elapsed
  return moving
}

// ── Readiness ─────────────────────────────────────────────────────────────

export interface ReadinessFactor {
  label: string
  value: string
  score: number | null // 0-100 contribution before weighting
}

export interface Readiness {
  score: number | null // 0-100, null if no data
  band: 'green' | 'amber' | 'red' | 'unknown'
  factors: ReadinessFactor[]
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * Readiness from the latest metrics doc, with a ~30-day window for baselines.
 * Weights: sleep 30, HRV vs weekly avg 25, body battery 20, RHR vs baseline 15,
 * yesterday's training load vs 7d avg 10.
 */
export function computeReadiness(history: GarminMetrics[], activities: GarminActivity[], today: string): Readiness {
  /**
   * Garmin labels a night by the date you woke up, so the record dated *today*
   * is last night's sleep — the exact night readiness is about. Excluding it
   * meant every readiness score was computed from the night before last.
   *
   * Today's record only counts once Garmin has actually scored the night;
   * before that it exists with a null sleepScore, so fall back to the newest
   * night that has one.
   */
  const past = history.filter((m) => m.date <= today).sort((a, b) => (a.date < b.date ? 1 : -1))
  const latest = past.find((m) => m.sleepScore != null) ?? past[0]
  if (!latest) return { score: null, band: 'unknown', factors: [] }

  const factors: ReadinessFactor[] = []
  let weighted = 0
  let weightSum = 0
  const add = (label: string, value: string, score: number | null, weight: number) => {
    factors.push({ label, value, score })
    if (score !== null) {
      weighted += score * weight
      weightSum += weight
    }
  }

  // Sleep score maps directly
  add('Sleep', latest.sleepScore != null ? `${latest.sleepScore}` : 'no data', latest.sleepScore, 30)

  // HRV: last night vs weekly average — 100% of avg = 75pts, +/-20% swings it
  if (latest.hrvRmssd != null && latest.hrvWeeklyAvg != null && latest.hrvWeeklyAvg > 0) {
    const ratio = latest.hrvRmssd / latest.hrvWeeklyAvg
    const score = clamp(75 + (ratio - 1) * 250, 0, 100)
    add('HRV vs weekly', `${Math.round(latest.hrvRmssd)} / ${Math.round(latest.hrvWeeklyAvg)}ms`, score, 25)
  } else {
    add('HRV vs weekly', 'no data', null, 25)
  }

  // Body battery peak
  add('Body battery', latest.bodyBattery != null ? `${latest.bodyBattery}` : 'no data', latest.bodyBattery, 20)

  // Resting HR vs 30-day baseline: each bpm above baseline costs 8pts
  const rhrBaseline = mean(past.slice(0, 30).map((m) => m.restingHeartRate))
  if (latest.restingHeartRate != null && rhrBaseline != null) {
    const delta = latest.restingHeartRate - rhrBaseline
    add('Resting HR', `${latest.restingHeartRate} (avg ${Math.round(rhrBaseline)})`, clamp(75 - delta * 8, 0, 100), 15)
  } else {
    add('Resting HR', 'no data', null, 15)
  }

  // Yesterday's training load vs trailing 7-day mean — big spike lowers readiness
  const yest = prevDate(today)
  const loadYest = sumLoad(activities, yest, yest)
  const load7 = sumLoad(activities, prevDate(today, 7), yest) / 7
  if (load7 > 0) {
    const ratio = loadYest / load7
    add('Yesterday load', `${Math.round(loadYest)} vs ${Math.round(load7)}/d avg`, clamp(100 - Math.max(0, ratio - 1) * 40, 20, 100), 10)
  } else {
    add('Yesterday load', 'no history', null, 10)
  }

  if (weightSum === 0) return { score: null, band: 'unknown', factors }
  const score = Math.round(weighted / weightSum)
  const band = score >= 68 ? 'green' : score >= 50 ? 'amber' : 'red'
  return { score, band, factors }
}

function mean(vals: Array<number | null | undefined>): number | null {
  const nums = vals.filter((v): v is number => typeof v === 'number' && isFinite(v))
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

function prevDate(date: string, back = 1): string {
  // UTC-anchored arithmetic so the result is timezone-independent
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}

function sumLoad(activities: GarminActivity[], from: string, to: string): number {
  return activities
    .filter((a) => a.date != null && a.date >= from && a.date <= to)
    .reduce((sum, a) => sum + (a.trainingLoad ?? (a.durationSeconds ?? 0) / 120), 0)
}

// ── Completion matching ───────────────────────────────────────────────────

export interface SessionStatus {
  session: PlannedSession
  status: 'done' | 'partial' | 'missed' | 'upcoming'
  actual?: { distanceKm: number | null; durationMin: number; name: string | null }
}

export interface DayStatus {
  day: PlanDay
  sessions: SessionStatus[]
  /** Activities logged this day that matched no planned session — still counted, shown as logged extras */
  extras: Array<{ sport: Sport | null; type: string; distanceKm: number | null; durationMin: number }>
}

export function matchDay(day: PlanDay, activities: GarminActivity[], today: string): DayStatus {
  const dayActs = activities.filter((a) => a.date === day.date)
  const used = new Set<string>()

  const sessions = day.sessions.map((session): SessionStatus => {
    const sport = session.sport
    if (sport === 'rest') {
      return { session, status: day.date <= today ? 'done' : 'upcoming' }
    }
    const candidates = dayActs.filter(
      (a) => !used.has(String(a.activityId)) && SPORT_TYPES[sport].includes(a.type)
    )
    if (candidates.length > 0) {
      // Brick days may span several activities — aggregate them
      const pool = session.sport === 'brick' ? candidates : [candidates.sort(
        (a, b) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0)
      )[0]]
      pool.forEach((a) => used.add(String(a.activityId)))
      const durationMin = Math.round(pool.reduce((s2, a) => s2 + (a.durationSeconds ?? 0), 0) / 60)
      const distanceKm = pool.some((a) => a.distanceMeters != null)
        ? Math.round(pool.reduce((s2, a) => s2 + (a.distanceMeters ?? 0), 0) / 100) / 10
        : null
      const ratio = session.durationMin > 0 ? durationMin / session.durationMin : 1
      return {
        session,
        status: ratio >= 0.6 ? 'done' : 'partial',
        actual: { distanceKm, durationMin, name: pool[0].name ?? null },
      }
    }
    return { session, status: day.date < today ? 'missed' : 'upcoming' }
  })

  const extras = dayActs
    .filter((a) => !used.has(String(a.activityId)) && (a.durationSeconds ?? 0) >= 600)
    .map((a) => ({
      sport: sportOfActivity(a.type),
      type: a.type,
      distanceKm: a.distanceMeters != null ? Math.round(a.distanceMeters / 100) / 10 : null,
      durationMin: Math.round((a.durationSeconds ?? 0) / 60),
    }))

  return { day, sessions, extras }
}

// ── Daily adaptation ──────────────────────────────────────────────────────

export interface Adaptation {
  level: 'as-planned' | 'ease-intensity' | 'reduce' | 'recover' | 'no-data'
  headline: string
  note: string
  sessions: PlannedSession[] // the adjusted sessions for today
}

export function adaptDay(day: PlanDay, readiness: Readiness): Adaptation {
  const isRaceDay = day.phase === 'Race 1' || day.phase === 'Race 2'
  const isRest = day.sessions.every((x) => x.sport === 'rest')

  if (isRaceDay) {
    return {
      level: 'as-planned',
      headline: 'Race day — execute the plan',
      note: 'No adjustments on race day. Trust the taper.',
      sessions: day.sessions,
    }
  }
  if (isRest) {
    return {
      level: 'as-planned',
      headline: 'Rest day as planned',
      note: 'Recovery is training. Sleep and eat well.',
      sessions: day.sessions,
    }
  }
  if (readiness.score === null) {
    return {
      level: 'no-data',
      headline: 'No recovery data — session as planned',
      note: 'Garmin metrics have not synced yet. Default to the plan, self-assess honestly.',
      sessions: day.sessions,
    }
  }

  if (readiness.score >= 68) {
    return {
      level: 'as-planned',
      headline: 'Green light — full session as planned',
      note: `Readiness ${readiness.score}. Recovery supports the planned load.`,
      sessions: day.sessions,
    }
  }

  if (readiness.score >= 50) {
    return {
      level: 'ease-intensity',
      headline: 'Amber — keep the volume, drop the intensity',
      note: `Readiness ${readiness.score}. Do the planned duration but cap effort at Z2: convert intervals to steady endurance. Key sessions stay, quality moves to tomorrow if possible.`,
      sessions: day.sessions.map((x) =>
        x.zone === 'race' || x.zone === 'Z3'
          ? { ...x, zone: 'Z2' as const, title: x.title + ' (eased to Z2)', detail: 'EASED: same duration, all steady Z2 — no intervals today. ' + x.detail }
          : x
      ),
    }
  }

  if (readiness.score >= 38) {
    return {
      level: 'reduce',
      headline: 'Low readiness — cut volume 40%, all easy',
      note: `Readiness ${readiness.score}. Shorten everything by ~40% and stay Z1-Z2. Skip non-key sessions entirely.`,
      sessions: day.sessions
        .filter((x) => x.key || day.sessions.length === 1)
        .map((x) => ({
          ...x,
          zone: 'Z2' as const,
          durationMin: Math.round(x.durationMin * 0.6),
          distanceKm: x.distanceKm ? Math.round(x.distanceKm * 0.6 * 10) / 10 : undefined,
          title: x.title + ' (reduced 40%)',
          detail: 'REDUCED: readiness is low — 60% of planned volume, all easy. ' + x.detail,
        })),
    }
  }

  return {
    level: 'recover',
    headline: 'Red — swap to recovery',
    note: `Readiness ${readiness.score}. Training today digs the hole deeper. Walk, mobility, 20min easy spin at most. The missed session is absorbed, not rescheduled.`,
    sessions: [
      {
        sport: 'rest',
        title: 'Recovery day (swapped in)',
        detail: 'Body says no: poor sleep, suppressed HRV, or elevated RHR. Walk + mobility + food + early night.',
        durationMin: 0,
        zone: '-',
      },
    ],
  }
}

// ── Progress summaries ────────────────────────────────────────────────────

export interface SportProgress {
  sport: 'swim' | 'bike' | 'run'
  plannedKm: number
  actualKm: number
  longestKm: number
  raceKm: number
}

export function computeProgress(activities: GarminActivity[], today: string): SportProgress[] {
  const start = PLAN[0].date
  const inBlock = activities.filter((a) => a.date != null && a.date >= start && a.date <= today)

  return (['swim', 'bike', 'run'] as const).map((sport) => {
    const acts = inBlock.filter((a) => sportOfActivity(a.type) === sport)
    const actualKm = Math.round(acts.reduce((s2, a) => s2 + (a.distanceMeters ?? 0), 0) / 100) / 10
    const longestKm = Math.round(Math.max(0, ...acts.map((a) => a.distanceMeters ?? 0)) / 100) / 10
    const plannedKm = PLAN.filter((d) => d.date <= today)
      .flatMap((d) => d.sessions)
      .filter((x) => x.sport === sport || (x.sport === 'brick' && sport === 'bike'))
      .reduce((s2, x) => s2 + (x.distanceKm ?? 0), 0)
    const raceKm = sport === 'swim' ? RACE.swimKm : sport === 'bike' ? RACE.bikeKm : RACE.runKm
    return { sport, plannedKm: Math.round(plannedKm), actualKm, longestKm, raceKm }
  })
}
