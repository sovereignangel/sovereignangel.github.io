/**
 * The pair's Ironman detail view — everything /lordas/ironman renders.
 *
 * Per athlete: readiness and its factors, the pace profile their prescriptions
 * are built from, block compliance against the printed plan, distance progress
 * per discipline, the goal forecast for New York, and the recalibration that
 * says which discipline the remaining weeks belong to. Assembled server-side
 * so the two columns are computed identically and can be compared honestly.
 *
 * The two athletes do not share a finish time. Each column is scored against
 * that person's own goals, off that person's own sessions — they train at the
 * same time and at their own speeds, so neither column needs the other.
 */

import {
  computeReadiness, matchDay, computeProgress, dedupeActivities, paceSeconds, sportOfActivity,
  type Readiness, type SportProgress,
} from '@/lib/ironman/adapt'
import { computeRaceForecast, type RaceForecast } from '@/lib/ironman/forecast'
import { computeRebalance, type Rebalance } from '@/lib/ironman/rebalance'
import { raceTargets, type RaceTarget } from '@/lib/ironman/pace'
import {
  PLAN, RACE, RACE_NYC, STRENGTHS,
  daysToRace, goalsFor, goalSplits, goalDisplay, todayLocal,
  type AthleteId, type PlannedSession, type RaceGoals, type Sport3, type Standing,
} from '@/lib/ironman/plan'
import { loadBothAthletes, type AthleteData } from './athletes'
import { buildPairDay, paceProfile, type PairDay, type PaceProfile } from './pair-training'
import type { GarminActivity, LordasPerson } from '@/lib/types'

export interface ComplianceWeek {
  /** Monday of the week, or the block start for the first partial week */
  start: string
  end: string
  planned: number
  done: number
  partial: number
  missed: number
  upcoming: number
}

/**
 * The newest swim, on both clocks — the worked example behind the swim column.
 *
 * A model change is only believable next to the session it changes, so the
 * card carries the numbers rather than asserting the rule and asking to be
 * trusted. Null until this athlete has logged a swim with a distance on it.
 */
export interface SwimTiming {
  date: string
  distanceM: number
  elapsedSec: number
  movingSec: number
  /** Share of the timer that was rest, 0-1 */
  restShare: number
  per100Elapsed: number
  per100Moving: number
}

export interface AthleteDetail {
  person: LordasPerson
  name: string
  color: string
  readiness: Readiness
  /** This athlete's own targets — the two of them are not chasing one finish time */
  goals: RaceGoals
  splits: ReturnType<typeof goalSplits>
  display: ReturnType<typeof goalDisplay>
  strengths: Record<Sport3, Standing>
  profile: PaceProfile
  /** The newest swim measured both ways, so the swim column can show its work */
  swimTiming: SwimTiming | null
  /** Race-pace anchor per discipline, and how far the goal had to be backed off */
  targets: Record<Sport3, RaceTarget>
  /** Which discipline the remaining weeks belong to, and why */
  rebalance: Rebalance
  progress: SportProgress[]
  forecast: RaceForecast
  compliance: { planned: number; done: number; partial: number; missed: number; upcoming: number; weeks: ComplianceWeek[] }
  /** Sessions logged in the block that matched no planned session */
  extras: number
  noData: boolean
  /** Set when the feed could not be read at all — not the same as having none */
  loadError: string | null
  /** Newest date any reading covers */
  lastSync: string | null
  /** When the sync itself last ran, ISO */
  lastRefresh: string | null
}

/** One session, as printed on the block or as an athlete's own version of it */
export interface PlanSessionRow {
  sport: string
  title: string
  durationMin: number
  distanceKm?: number
  zone: string
  key?: boolean
}

/**
 * Something actually logged, set against what the card asked for.
 *
 * `against` is the printed session it counted towards, or null when nothing on
 * the card matched it — a 45min run on a swim-and-spin day is not a failure to
 * record, it is the day that happened.
 */
export interface LoggedSession {
  against: string | null
  sport: string | null
  status: 'done' | 'partial' | 'extra'
  durationMin: number
  distanceKm: number | null
  name: string | null
}

export type DayStanding = 'done' | 'partial' | 'missed' | 'upcoming'

/** One athlete against one printed day — behind it, or ahead of it. */
export interface PlanAthleteDay {
  status: DayStanding
  /** What happened: sessions that matched the card, then the ones that did not */
  logged: LoggedSession[]
  /** Printed sessions the day never delivered */
  missed: string[]
  /** This athlete's own version of the day, when calibration moved it off the print */
  prescribed: PlanSessionRow[] | null
  /** One line saying why it moved */
  note: string | null
}

/**
 * One printed day, with each athlete's standing against it. The block is the
 * backbone the whole page argues about, so it ships whole rather than as the
 * weekly aggregate the compliance grid shows.
 *
 * A printed day is a claim about the future and a question about the past, and
 * the row carries both answers per athlete: what they actually did on the days
 * behind, and what their recalibrated card is on the days ahead. The two of
 * them diverge in both directions — one rides 100km on a rest day, the other
 * rests through a brick — so a single shared row would be a fiction.
 */
export interface PlanDayRow {
  date: string
  phase: string
  focus: string
  sessions: PlanSessionRow[]
  athletes: Record<string, PlanAthleteDay>
}

export interface PairIronmanDetail {
  date: string
  /** The full block, day by day */
  plan: PlanDayRow[]
  /** Oldest of the two athletes' refreshes — the page is only as fresh as that */
  feedRefreshedAt: string | null
  races: { name: string; date: string; days: number; location: string }[]
  today: PairDay
  /**
   * Tomorrow, already recalibrated against today's work and the freshest
   * recovery on file. Provisional by construction — tonight's sleep has not
   * happened — but a session you can see coming is a session you can eat and
   * sleep for.
   */
  tomorrow: PairDay
  athletes: AthleteDetail[]
}

function mondayOf(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  const dow = (d.getUTCDay() + 6) % 7 // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function sessionRow(x: PlannedSession): PlanSessionRow {
  return {
    sport: x.sport,
    title: x.title,
    durationMin: x.durationMin,
    distanceKm: x.distanceKm,
    zone: x.zone,
    key: x.key,
  }
}

/** Two cards are the same card when every session matches title, length and zone. */
function sameCard(a: PlanSessionRow[], b: PlanSessionRow[]): boolean {
  return (
    a.length === b.length &&
    a.every((x, i) => x.title === b[i].title && x.durationMin === b[i].durationMin && x.zone === b[i].zone)
  )
}

/** The newest swim with a distance on it, measured on both clocks. */
function swimTimingOf(activities: GarminActivity[], today: string): SwimTiming | null {
  const swim = activities
    .filter((a) => a.date != null && a.date <= today && sportOfActivity(a.type) === 'swim')
    .filter((a) => (a.distanceMeters ?? 0) > 0 && (a.durationSeconds ?? 0) > 0)
    .sort((a, b) => ((a.date as string) < (b.date as string) ? 1 : -1))[0]
  if (!swim) return null

  const distanceM = swim.distanceMeters as number
  const elapsedSec = swim.durationSeconds as number
  const movingSec = paceSeconds(swim)
  const hundreds = distanceM / 100
  return {
    date: swim.date as string,
    distanceM: Math.round(distanceM),
    elapsedSec: Math.round(elapsedSec),
    movingSec: Math.round(movingSec),
    restShare: elapsedSec > 0 ? 1 - movingSec / elapsedSec : 0,
    per100Elapsed: elapsedSec / hundreds,
    per100Moving: movingSec / hundreds,
  }
}

function detailFor(data: AthleteData, today: string, partner?: AthleteData): AthleteDetail {
  const person = data.athlete.id as AthleteId
  const goals = goalsFor(person)
  const activities = dedupeActivities(data.activities)
  const readiness = computeReadiness(data.metrics, activities, today)
  const profile = paceProfile(activities, today)
  const progress = computeProgress(activities, today)
  const opts = { goals }
  const forecast = computeRaceForecast(activities, data.metrics, today, opts)
  const targets = raceTargets(forecast, goals)
  const rebalance = computeRebalance(activities, data.metrics, today, person, opts)

  const totals = { planned: 0, done: 0, partial: 0, missed: 0, upcoming: 0 }
  const weekMap = new Map<string, ComplianceWeek>()
  let extras = 0

  for (const day of PLAN.filter((d) => d.date <= today)) {
    const status = matchDay(day, activities, today)
    extras += status.extras.length
    const wk = mondayOf(day.date)
    const week = weekMap.get(wk) ?? { start: wk, end: wk, planned: 0, done: 0, partial: 0, missed: 0, upcoming: 0 }
    week.end = day.date > week.end ? day.date : week.end

    for (const s of status.sessions) {
      if (s.session.sport === 'rest') continue
      totals.planned += 1
      week.planned += 1
      if (s.status === 'done') { totals.done += 1; week.done += 1 }
      else if (s.status === 'partial') { totals.partial += 1; week.partial += 1 }
      else if (s.status === 'missed') { totals.missed += 1; week.missed += 1 }
      else { totals.upcoming += 1; week.upcoming += 1 }
    }
    weekMap.set(wk, week)
  }

  const lastSync = data.latestReading

  return {
    person: data.athlete.id,
    name: data.athlete.name,
    color: data.athlete.color,
    readiness,
    goals,
    splits: goalSplits(goals),
    display: goalDisplay(goals),
    strengths: STRENGTHS[person] ?? STRENGTHS.lori,
    profile,
    swimTiming: swimTimingOf(activities, today),
    targets,
    rebalance,
    progress,
    forecast,
    compliance: { ...totals, weeks: [...weekMap.values()].sort((a, b) => (a.start < b.start ? -1 : 1)) },
    extras,
    noData: data.empty,
    loadError: data.loadError,
    lastSync,
    lastRefresh: data.lastRefresh,
  }
}

export async function buildPairIronmanDetail(date: string = todayLocal()): Promise<PairIronmanDetail> {
  const athletes = await loadBothAthletes()
  const refreshes = athletes.map((a) => a.lastRefresh).filter(Boolean) as string[]
  const next = shiftDate(date, 1)

  // Tomorrow is built exactly like today, one day forward. Nothing special is
  // needed for it to see today's work: readiness reads the freshest metrics
  // doc and yesterday-relative load, and the recalibration looks at the five
  // days before the day it is editing — so a 100km ride today is already in
  // both by the time it asks about tomorrow.
  const today = buildPairDay(date, athletes)
  const tomorrow = buildPairDay(next, athletes)
  const details = athletes.map((a, i) => detailFor(a, date, athletes[1 - i]))

  // Statuses are matched per athlete against the same printed day, so a row
  // shows who did it and who did not without re-deriving the plan twice.
  const matched = athletes.map((a) => ({
    person: a.athlete.id as string,
    days: new Map(
      PLAN.map((d) => [
        d.date,
        matchDay(d, dedupeActivities(a.activities), date),
      ])
    ),
  }))

  // Every day this athlete's card differs from the print, and why. The
  // recalibration supplies the days out to its horizon; today and tomorrow are
  // then overwritten by the full prescription, which carries readiness on top
  // of the recalibration and is therefore the more complete answer for the only
  // two days where recovery is actually known.
  const overrides = new Map<string, Map<string, { sessions: PlanSessionRow[]; note: string }>>()
  for (const d of details) {
    const own = new Map<string, { sessions: PlanSessionRow[]; note: string }>()
    for (const mv of d.rebalance.moves) {
      own.set(mv.date, {
        sessions: mv.after.map(sessionRow),
        note: mv.reason || (mv.kind === 'retune' ? 'Retuned against the last few days' : 'Trimmed — already banked'),
      })
    }
    for (const [when, pair] of [[date, today], [next, tomorrow]] as const) {
      const p = pair.athletes.find((x) => x.person === d.person)
      if (!p) continue
      // Two layers moved this card and they moved it for different reasons.
      // Naming only the readiness one produces the contradiction of "full
      // session as planned" printed beside a session that plainly is not, so
      // the recalibration speaks first and recovery only when it did something.
      const moved = p.rebalance.moves.find((m) => m.date === when)?.reason
      const eased = p.adaptLevel === 'as-planned' || p.adaptLevel === 'no-data' ? null : p.adaptHeadline
      own.set(when, {
        sessions: p.sessions.map(sessionRow),
        note: [moved, eased].filter(Boolean).join(' · ') || p.adaptHeadline,
      })
    }
    overrides.set(d.person, own)
  }

  const plan: PlanDayRow[] = PLAN.map((d) => {
    const printed = d.sessions.map(sessionRow)
    return {
      date: d.date,
      phase: d.phase,
      focus: d.focus,
      sessions: printed,
      athletes: Object.fromEntries(
        matched.map((m): [string, PlanAthleteDay] => {
          const st = m.days.get(d.date)
          const active = st?.sessions.filter((x) => x.session.sport !== 'rest') ?? []
          const done = active.filter((x) => x.status === 'done').length
          const partial = active.filter((x) => x.status === 'partial').length
          const missedCount = active.filter((x) => x.status === 'missed').length
          const status: DayStanding =
            active.length === 0 ? (d.date <= date ? 'done' : 'upcoming')
              : done === active.length ? 'done'
              : done + partial > 0 ? 'partial'
              : missedCount > 0 ? 'missed'
              : 'upcoming'

          // Matched work first, then whatever went in instead of the card.
          const logged: LoggedSession[] = [
            ...active
              .filter((x) => x.actual)
              .map((x) => ({
                against: x.session.title,
                sport: x.session.sport as string,
                status: x.status === 'partial' ? ('partial' as const) : ('done' as const),
                durationMin: x.actual!.durationMin,
                distanceKm: x.actual!.distanceKm,
                name: x.actual!.name,
              })),
            ...(st?.extras ?? []).map((e) => ({
              against: null,
              sport: e.sport,
              status: 'extra' as const,
              durationMin: e.durationMin,
              distanceKm: e.distanceKm,
              name: null,
            })),
          ]

          const ov = overrides.get(m.person)?.get(d.date)
          const prescribed = ov && !sameCard(ov.sessions, printed) ? ov.sessions : null

          return [
            m.person,
            {
              status,
              logged,
              missed: active.filter((x) => x.status === 'missed').map((x) => x.session.title),
              prescribed,
              note: prescribed ? (ov?.note ?? null) : null,
            },
          ]
        })
      ),
    }
  })

  return {
    date,
    plan,
    // A pair page is only as current as its staler half.
    feedRefreshedAt: refreshes.length === athletes.length ? refreshes.sort()[0] : null,
    races: [RACE, RACE_NYC]
      .map((r) => ({ name: r.name, date: r.date, days: daysToRace(date, r.date), location: r.location }))
      .filter((r) => r.days >= 0),
    today,
    tomorrow,
    athletes: details,
  }
}
