/**
 * Pair training — one plan, two bodies.
 *
 * Lori and Aidas are training for the same two races off the same block, so
 * the session is shared by construction. What is *not* shared is recovery and
 * speed: readiness is computed per athlete from their own Garmin data, and
 * pace targets come from each athlete's own recent work. The output is one
 * workout with two prescriptions plus an explicit "how much of it you do
 * side by side" number, so a shared session never turns into one person
 * quietly training alone at the wrong intensity.
 */

import { computeReadiness, adaptDay, sportOfActivity, type Readiness } from '@/lib/ironman/adapt'
import { getPlanDay, type PlanDay, type PlannedSession, type Sport, type Zone } from '@/lib/ironman/plan'
import type { GarminActivity, LordasPerson } from '@/lib/types'
import type { AthleteData } from './athletes'

// ── Pace profiles ─────────────────────────────────────────────────────────

export interface PaceProfile {
  /** Habitual training pace, minutes per km */
  runMinPerKm: number | null
  /** Habitual training speed, km/h */
  bikeKmh: number | null
  /** Habitual training pace, seconds per 100m */
  swimSecPer100m: number | null
  samples: { run: number; bike: number; swim: number }
}

const MIN_DURATION_S = 600 // ignore warm-ups and accidental starts
const PROFILE_WINDOW_DAYS = 42

function withinWindow(a: GarminActivity, today: string): boolean {
  if (!a.date) return false
  const cutoff = new Date(today + 'T00:00:00Z')
  cutoff.setUTCDate(cutoff.getUTCDate() - PROFILE_WINDOW_DAYS)
  return a.date >= cutoff.toISOString().slice(0, 10) && a.date <= today
}

/**
 * Distance-weighted average across recent sessions. Weighting by distance
 * rather than by session count keeps a 10-minute shakeout from dragging the
 * profile as hard as a 90km ride.
 */
function weightedPace(acts: GarminActivity[]): { metres: number; seconds: number } | null {
  let metres = 0
  let seconds = 0
  for (const a of acts) {
    const d = a.distanceMeters ?? 0
    const t = a.durationSeconds ?? 0
    if (d <= 0 || t < MIN_DURATION_S) continue
    metres += d
    seconds += t
  }
  return metres > 0 ? { metres, seconds } : null
}

export function paceProfile(activities: GarminActivity[], today: string): PaceProfile {
  const recent = activities.filter((a) => withinWindow(a, today))
  const bySport = (sport: Sport) => recent.filter((a) => sportOfActivity(a.type) === sport)

  const run = weightedPace(bySport('run'))
  const bike = weightedPace(bySport('bike'))
  const swim = weightedPace(bySport('swim'))

  return {
    runMinPerKm: run ? run.seconds / 60 / (run.metres / 1000) : null,
    bikeKmh: bike ? bike.metres / 1000 / (bike.seconds / 3600) : null,
    swimSecPer100m: swim ? swim.seconds / (swim.metres / 100) : null,
    samples: {
      run: bySport('run').filter((a) => (a.durationSeconds ?? 0) >= MIN_DURATION_S).length,
      bike: bySport('bike').filter((a) => (a.durationSeconds ?? 0) >= MIN_DURATION_S).length,
      swim: bySport('swim').filter((a) => (a.durationSeconds ?? 0) >= MIN_DURATION_S).length,
    },
  }
}

// ── Zone → pace ───────────────────────────────────────────────────────────
//
// The profile is habitual training pace, which for an endurance block sits at
// Z2 by definition. Zones are expressed as offsets from it rather than from a
// tested threshold, because nobody here has done a lab test and a wrong
// threshold is more dangerous than an honest approximation.

const RUN_OFFSET_SEC_PER_KM: Record<Zone, number | null> = {
  Z1: 35, Z2: 0, Z3: -25, race: -35, mixed: 0, '-': null,
}
const BIKE_OFFSET_KMH: Record<Zone, number | null> = {
  Z1: -3, Z2: 0, Z3: 1.5, race: 2.5, mixed: 0, '-': null,
}
const SWIM_OFFSET_SEC_PER_100: Record<Zone, number | null> = {
  Z1: 8, Z2: 0, Z3: -5, race: -6, mixed: 0, '-': null,
}

export function fmtRunPace(minPerKm: number): string {
  const total = Math.round(minPerKm * 60)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}/km`
}

export function fmtSwimPace(secPer100m: number): string {
  const total = Math.round(secPer100m)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}/100m`
}

export function fmtBikeSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`
}

/** The pace this athlete should hold for this session, or null when unknown. */
export function paceTarget(sport: Sport, zone: Zone, profile: PaceProfile): string | null {
  if (sport === 'run' && profile.runMinPerKm != null) {
    const off = RUN_OFFSET_SEC_PER_KM[zone]
    if (off === null) return null
    return fmtRunPace(profile.runMinPerKm + off / 60)
  }
  if (sport === 'bike' && profile.bikeKmh != null) {
    const off = BIKE_OFFSET_KMH[zone]
    if (off === null) return null
    return fmtBikeSpeed(profile.bikeKmh + off)
  }
  if (sport === 'swim' && profile.swimSecPer100m != null) {
    const off = SWIM_OFFSET_SEC_PER_100[zone]
    if (off === null) return null
    return fmtSwimPace(profile.swimSecPer100m + off)
  }
  // A brick spans sports — the bike leg sets the number worth quoting.
  if (sport === 'brick' && profile.bikeKmh != null) {
    const off = BIKE_OFFSET_KMH[zone]
    if (off === null) return null
    return fmtBikeSpeed(profile.bikeKmh + off)
  }
  return null
}

// ── Prescriptions ─────────────────────────────────────────────────────────

export interface PrescribedSession extends PlannedSession {
  /** This athlete's own number for the session, from their own recent work */
  pace: string | null
  /** Set when readiness moved this session off the printed plan */
  adjusted: boolean
}

export interface AthletePrescription {
  person: LordasPerson
  name: string
  color: string
  readiness: Readiness
  profile: PaceProfile
  adaptLevel: string
  adaptHeadline: string
  adaptNote: string
  sessions: PrescribedSession[]
  totalMin: number
  /** True when this athlete has no Garmin data at all */
  noData: boolean
}

function prescribe(data: AthleteData, day: PlanDay | undefined, today: string): AthletePrescription {
  const readiness = computeReadiness(data.metrics, data.activities, today)
  const profile = paceProfile(data.activities, today)
  const base = {
    person: data.athlete.id,
    name: data.athlete.name,
    color: data.athlete.color,
    readiness,
    profile,
    noData: data.empty,
  }

  if (!day) {
    return {
      ...base,
      adaptLevel: 'no-data',
      adaptHeadline: 'No session on the plan',
      adaptNote: 'The block does not cover this date.',
      sessions: [],
      totalMin: 0,
    }
  }

  const adaptation = adaptDay(day, readiness)
  const plannedByTitle = new Map(day.sessions.map((s) => [s.title, s]))
  const sessions: PrescribedSession[] = adaptation.sessions.map((s) => {
    const original = plannedByTitle.get(s.title)
    return {
      ...s,
      pace: paceTarget(s.sport, s.zone, profile),
      adjusted: !original || original.durationMin !== s.durationMin || original.zone !== s.zone,
    }
  })

  return {
    ...base,
    adaptLevel: adaptation.level,
    adaptHeadline: adaptation.headline,
    adaptNote: adaptation.note,
    sessions,
    totalMin: sessions.filter((s) => s.sport !== 'rest').reduce((sum, s) => sum + s.durationMin, 0),
  }
}

// ── The pair day ──────────────────────────────────────────────────────────

export interface PairDay {
  date: string
  phase: string | null
  focus: string | null
  /** The printed plan, before either body had a say */
  planned: PlannedSession[]
  athletes: AthletePrescription[]
  /** Minutes both of them can do side by side — the shorter adapted session */
  togetherMin: number
  /** One line: what you are doing together today */
  headline: string
  /** Where the two prescriptions diverge, and why */
  divergence: string[]
  restDay: boolean
}

const SPORT_WORD: Record<Sport, string> = {
  swim: 'Swim', bike: 'Bike', run: 'Run', brick: 'Brick', strength: 'Core', rest: 'Rest',
}

function sharedTitle(day: PlanDay | undefined): string {
  if (!day) return 'No session on the plan'
  const active = day.sessions.filter((s) => s.sport !== 'rest')
  if (active.length === 0) return 'Rest day — both of you'
  return active.map((s) => s.title).join(' + ')
}

export function buildPairDay(date: string, athletes: AthleteData[]): PairDay {
  const day = getPlanDay(date)
  const prescriptions = athletes.map((a) => prescribe(a, day, date))
  const working = prescriptions.filter((p) => p.totalMin > 0)
  const restDay = !day || day.sessions.every((s) => s.sport === 'rest')

  // Side-by-side time is the shorter of the two cards. If either of them is on
  // recovery there is no shared session at all, and saying "0min together" is
  // more useful than quietly reporting the other person's whole workout.
  const togetherMin =
    working.length === prescriptions.length && working.length > 0
      ? Math.min(...working.map((p) => p.totalMin))
      : 0

  const divergence: string[] = []

  if (!restDay && prescriptions.length === 2) {
    const [a, b] = prescriptions
    const ahead = a.totalMin >= b.totalMin ? a : b
    const behind = ahead === a ? b : a
    const gap = ahead.totalMin - behind.totalMin

    if (gap >= 10) {
      divergence.push(
        `${ahead.name} has ${gap} more minutes on the card${behind.totalMin > 0 ? ` — ride out together for ${behind.totalMin}min, then ${ahead.name} takes the extra ${gap}min alone` : ` — ${behind.name} is on recovery today`}.`
      )
    } else if (gap > 0) {
      divergence.push(`Sessions are within ${gap}min of each other — do the whole thing together.`)
    } else {
      divergence.push('Identical session for both of you — start and finish together.')
    }

    if (behind.totalMin === 0 && ahead.totalMin > 0) {
      divergence.push(`${behind.name}'s readiness pulled the session to recovery — going anyway costs more than it buys.`)
    }

    // Pace divergence is the thing that quietly ruins a shared endurance ride.
    for (const sport of ['run', 'bike', 'swim'] as const) {
      const pa = a.profile
      const pb = b.profile
      if (sport === 'run' && pa.runMinPerKm != null && pb.runMinPerKm != null) {
        const diffSec = Math.abs(pa.runMinPerKm - pb.runMinPerKm) * 60
        if (diffSec >= 20 && prescriptions.some((p) => p.sessions.some((s) => s.sport === 'run' || s.sport === 'brick'))) {
          const faster = pa.runMinPerKm < pb.runMinPerKm ? a : b
          divergence.push(
            `Run paces are ${Math.round(diffSec)}s/km apart — ${faster.name} runs at the slower number for the shared part, or you run the same loop out-and-back.`
          )
        }
      }
      if (sport === 'bike' && pa.bikeKmh != null && pb.bikeKmh != null) {
        const diff = Math.abs(pa.bikeKmh - pb.bikeKmh)
        if (diff >= 2 && prescriptions.some((p) => p.sessions.some((s) => s.sport === 'bike' || s.sport === 'brick'))) {
          const faster = pa.bikeKmh > pb.bikeKmh ? a : b
          divergence.push(
            `Bike speeds are ${diff.toFixed(1)} km/h apart — ${faster.name} sits on the front and holds the slower number; drafting is the point.`
          )
        }
      }
    }
  }

  const headline = restDay
    ? 'Rest day — both of you'
    : `${sharedTitle(day)}${togetherMin > 0 ? ` · ${togetherMin}min together` : ''}`

  return {
    date,
    phase: day?.phase ?? null,
    focus: day?.focus ?? null,
    planned: day?.sessions ?? [],
    athletes: prescriptions,
    togetherMin,
    headline,
    divergence,
    restDay,
  }
}

export { SPORT_WORD }
