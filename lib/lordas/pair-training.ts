/**
 * Pair training — one plan, two bodies.
 *
 * Lori and Aidas are training for the same two races off the same block, so
 * the session is shared by construction. What is *not* shared is recovery,
 * speed, or the finish time each is chasing: readiness comes from each
 * athlete's own Garmin data, pace targets are anchored to each athlete's own
 * goal, and the day is rebalanced against what each has actually been doing.
 * The output is one workout with two prescriptions plus an explicit "how much
 * of it you do side by side" number, so a shared session never turns into one
 * person quietly training alone at the wrong intensity.
 */

import { computeReadiness, adaptDay, sportOfActivity, dedupeActivities, type Readiness } from '@/lib/ironman/adapt'
import { computeRaceForecast } from '@/lib/ironman/forecast'
import { computeRebalance, planDayWith, type Rebalance } from '@/lib/ironman/rebalance'
import { fmtPace, raceTargets, zonePaceMinKm, type RaceTarget } from '@/lib/ironman/pace'
import {
  DECLARED_CAPABILITY, STRENGTHS, getPlanDay,
  goalsFor,
  type AthleteId, type PlanDay, type PlannedSession, type RaceGoals,
  type Sport, type Sport3, type Zone,
} from '@/lib/ironman/plan'
import type { GarminActivity, LordasPerson } from '@/lib/types'
import type { AthleteData } from './athletes'

export { fmtRunPace, fmtSwimPace, fmtBikeSpeed, fmtPace } from '@/lib/ironman/pace'

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
  const recent = dedupeActivities(activities).filter((a) => withinWindow(a, today))
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

/** Habitual pace as min/km, the unit the zone ladder works in */
function habitualMinKm(sport: Sport3, p: PaceProfile): number | null {
  if (sport === 'run') return p.runMinPerKm
  if (sport === 'bike') return p.bikeKmh ? 60 / p.bikeKmh : null
  return p.swimSecPer100m ? (p.swimSecPer100m * 10) / 60 : null
}

/**
 * The partner's own pace for every sport they trained, by date. The forecast
 * uses it to tell a session ridden *together* from two sessions that merely
 * happened on the same day — the first measures whoever set the tempo, the
 * second measures each of them.
 */
export function partnerPacesOf(partner: AthleteData | undefined): Partial<Record<Sport3, Map<string, number>>> {
  const out: Partial<Record<Sport3, Map<string, number>>> = {}
  if (!partner) return out
  // Their longest session of a sport that day is the one that could have been
  // shared, so it is the pace worth remembering.
  const longest: Partial<Record<Sport3, Map<string, { min: number; pace: number }>>> = {}
  for (const a of dedupeActivities(partner.activities)) {
    const sport = a.date ? sportOfActivity(a.type) : null
    if (sport !== 'swim' && sport !== 'bike' && sport !== 'run') continue
    const km = (a.distanceMeters ?? 0) / 1000
    const min = (a.durationSeconds ?? 0) / 60
    if (km <= 0 || min < MIN_DURATION_S / 60) continue
    const map = (longest[sport] ??= new Map())
    const prev = map.get(a.date as string)
    if (!prev || min > prev.min) map.set(a.date as string, { min, pace: min / km })
  }
  for (const sport of ['swim', 'bike', 'run'] as const) {
    const map = longest[sport]
    if (!map) continue
    out[sport] = new Map([...map].map(([date, v]) => [date, v.pace]))
  }
  return out
}

// ── Zone → pace ───────────────────────────────────────────────────────────

/** The pace this athlete should hold for this session, or null when unknown. */
export function paceTarget(
  sport: Sport,
  zone: Zone,
  profile: PaceProfile,
  targets?: Record<Sport3, RaceTarget>
): string | null {
  // A brick spans sports — the bike leg sets the number worth quoting.
  const s: Sport3 | null =
    sport === 'run' || sport === 'bike' || sport === 'swim' ? sport : sport === 'brick' ? 'bike' : null
  if (!s) return null
  return fmtPace(s, zonePaceMinKm(s, zone, targets?.[s], habitualMinKm(s, profile)))
}

// ── Prescriptions ─────────────────────────────────────────────────────────

export interface PrescribedSession extends PlannedSession {
  /** This athlete's own number for the session, from their own goal and history */
  pace: string | null
  /** Set when readiness or the rebalance moved this session off the printed plan */
  adjusted: boolean
}

export interface AthletePrescription {
  person: LordasPerson
  name: string
  color: string
  /** When this athlete's Garmin last synced, ISO — not the newest reading */
  lastRefresh: string | null
  /** Newest date any reading covers, which is a different question */
  latestReading: string | null
  readiness: Readiness
  profile: PaceProfile
  goals: RaceGoals
  /** Race-pace anchor per discipline, and how far it had to back off the goal */
  targets: Record<Sport3, RaceTarget>
  /** Which sport is worth the most minutes, and what kind of session it needs */
  rebalance: Rebalance
  adaptLevel: string
  adaptHeadline: string
  adaptNote: string
  sessions: PrescribedSession[]
  totalMin: number
  /** True when this athlete has no Garmin data at all */
  noData: boolean
}

function prescribe(data: AthleteData, date: string, partner?: AthleteData): AthletePrescription {
  const person = data.athlete.id as AthleteId
  const goals = goalsFor(person)
  const activities = dedupeActivities(data.activities)
  const readiness = computeReadiness(data.metrics, activities, date)
  const profile = paceProfile(activities, date)

  const opts = { goals, declared: DECLARED_CAPABILITY[person], partnerPaces: partnerPacesOf(partner) }
  const forecast = computeRaceForecast(activities, data.metrics, date, opts)
  const targets = raceTargets(forecast, goals)
  const rebalance = computeRebalance(activities, data.metrics, date, person, opts)

  // The printed plan first, then anything the rebalance moved, then readiness.
  // Order matters: readiness should shrink the session you actually need, not
  // the one the calendar happened to print.
  const day: PlanDay | undefined = planDayWith(date, rebalance.moves)

  const base = {
    person: data.athlete.id,
    name: data.athlete.name,
    color: data.athlete.color,
    lastRefresh: data.lastRefresh,
    latestReading: data.latestReading,
    readiness,
    profile,
    goals,
    targets,
    rebalance,
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
  const printed = new Map((planDayWith(date, [])?.sessions ?? []).map((s) => [s.title, s]))
  const sessions: PrescribedSession[] = adaptation.sessions.map((s) => {
    const original = printed.get(s.title)
    return {
      ...s,
      pace: paceTarget(s.sport, s.zone, profile, targets),
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
  /** The printed plan for this date — the shared backbone, before either body or the recalibration had a say */
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

/**
 * Where the two race-pace anchors sit for a discipline both of them are about
 * to train together. This is the line that decides whether a shared session is
 * a session or a compromise: two anchors far apart mean one of them is either
 * soft-pedalling or drowning, and saying so beats discovering it at km 40.
 */
function paceDivergence(
  sport: Sport3,
  a: AthletePrescription,
  b: AthletePrescription,
  threshold: number
): string | null {
  const ta = a.targets[sport]?.prescribedPaceMinKm
  const tb = b.targets[sport]?.prescribedPaceMinKm
  if (ta == null || tb == null) return null
  const gap = Math.abs(ta - tb) / Math.min(ta, tb)
  if (gap < threshold) return null
  const faster = ta < tb ? a : b
  const slower = faster === a ? b : a
  const fs = faster.targets[sport]
  const ss = slower.targets[sport]
  const strongFor = STRENGTHS[faster.person as AthleteId]?.[sport]
  const weakFor = STRENGTHS[slower.person as AthleteId]?.[sport]
  const framing =
    strongFor === 'strong' && weakFor === 'weak'
      ? ` The strongest discipline for ${faster.name} is the weakest for ${slower.name}, so this gap does not close by race day.`
      : ''
  const head =
    `Race-pace ${sport} targets are ${Math.round(gap * 100)}% apart — ` +
    `${faster.name} ${fmtPace(sport, fs.prescribedPaceMinKm)}, ${slower.name} ${fmtPace(sport, ss.prescribedPaceMinKm)}.` +
    framing

  if (sport === 'bike') {
    return (
      `${head} Ride it as one anyway: ${faster.name} on the front the whole way holding ${slower.name}'s number, ` +
      `because drafting is the point. Race-effort bike work for ${faster.name} has to happen alone.`
    )
  }
  if (sport === 'run') {
    return (
      `${head} Run the same loop out and back rather than side by side, or ${faster.name} runs ` +
      `${slower.name}'s number and calls it Z2.`
    )
  }
  return `${head} Same lane and same set, different send-offs — nobody should be waiting on the wall.`
}

export function buildPairDay(date: string, athletes: AthleteData[]): PairDay {
  const prescriptions = athletes.map((a, i) => prescribe(a, date, athletes[1 - i]))
  // The printed plan is the shared backbone. Each athlete's card may have been
  // recalibrated away from it in a different direction, so the pair view shows
  // what was printed and names the divergence rather than picking a winner.
  const printed = getPlanDay(date)
  const working = prescriptions.filter((p) => p.totalMin > 0)
  const restDay =
    prescriptions.length > 0
      ? prescriptions.every((p) => p.sessions.every((s) => s.sport === 'rest'))
      : !printed || printed.sessions.every((s) => s.sport === 'rest')

  // Side-by-side time is the shorter of the two cards. If either of them is on
  // recovery there is no shared session at all, and saying "0min together" is
  // more useful than quietly reporting the other person's whole workout.
  const togetherMin =
    working.length === prescriptions.length && working.length > 0
      ? Math.min(...working.map((p) => p.totalMin))
      : 0

  const cardOf = (p: AthletePrescription) =>
    p.sessions.filter((s) => s.sport !== 'rest').map((s) => s.title).join(' + ')
  const sameCard = prescriptions.length === 2 && cardOf(prescriptions[0]) === cardOf(prescriptions[1])

  const divergence: string[] = []

  if (!restDay && prescriptions.length === 2) {
    const [a, b] = prescriptions

    if (!sameCard) {
      divergence.push(
        `Different cards today — ${a.name}: ${cardOf(a) || 'recovery'}. ${b.name}: ${cardOf(b) || 'recovery'}. ` +
          'The recalibration moved each of you off the printed session for different reasons.'
      )
    }

    const ahead = a.totalMin >= b.totalMin ? a : b
    const behind = ahead === a ? b : a
    const gap = ahead.totalMin - behind.totalMin

    if (gap >= 10) {
      divergence.push(
        `${ahead.name} has ${gap} more minutes on the card${behind.totalMin > 0 ? ` — ride out together for ${behind.totalMin}min, then ${ahead.name} takes the extra ${gap}min alone` : ` — ${behind.name} is on recovery today`}.`
      )
    } else if (gap > 0) {
      divergence.push(`Sessions are within ${gap}min of each other — do the whole thing together.`)
    } else if (sameCard) {
      divergence.push('Identical session for both of you — start and finish together.')
    }

    if (behind.totalMin === 0 && ahead.totalMin > 0) {
      divergence.push(`${behind.name}'s readiness pulled the session to recovery — going anyway costs more than it buys.`)
    }

    // Only speak about disciplines that are actually being trained today, and
    // only where the effort is high enough for a pace gap to matter. Two people
    // spinning easy side by side do not need a lecture about race pace.
    const onCard = new Set<Sport3>()
    for (const p of prescriptions) {
      for (const s of p.sessions) {
        if (s.zone === 'Z1' || s.zone === '-') continue
        if (s.sport === 'brick') onCard.add('bike')
        else if (s.sport === 'run' || s.sport === 'bike' || s.sport === 'swim') onCard.add(s.sport)
      }
    }
    // Bike speed diverges hardest and hurts a shared ride fastest, so it gets
    // the tightest threshold of the three.
    const THRESHOLD: Record<Sport3, number> = { bike: 0.06, run: 0.06, swim: 0.08 }
    for (const sport of ['bike', 'run', 'swim'] as const) {
      if (!onCard.has(sport)) continue
      const line = paceDivergence(sport, a, b, THRESHOLD[sport])
      if (line) divergence.push(line)
    }

    // A capability taken from a declaration rather than from logged work is a
    // claim, and the page should say so rather than quietly present it as data.
    for (const p of prescriptions) {
      for (const g of p.rebalance.sports) {
        if (!onCard.has(g.sport) || g.paceSource !== 'declared') continue
        divergence.push(
          `${p.name}'s ${g.sport} number is declared, not measured — ${g.sharedN} of the logged sessions were done together, ` +
            `so the model is using the stated solo figure. A solo effort would replace it with evidence.`
        )
      }
    }
  }

  const headline = restDay
    ? 'Rest day — both of you'
    : sameCard || prescriptions.length !== 2
      ? `${cardOf(prescriptions[0]) || 'No session on the plan'}${togetherMin > 0 ? ` · ${togetherMin}min together` : ''}`
      : `${printed ? printed.sessions.filter((x) => x.sport !== 'rest').map((x) => x.title).join(' + ') : 'No session on the plan'} — recalibrated separately`

  return {
    date,
    phase: printed?.phase ?? null,
    focus: printed?.focus ?? null,
    planned: printed?.sessions ?? [],
    athletes: prescriptions,
    togetherMin,
    headline,
    divergence,
    restDay,
  }
}

export { SPORT_WORD }
