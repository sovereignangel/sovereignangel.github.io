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
  computeReadiness, matchDay, computeProgress, dedupeActivities,
  type Readiness, type SportProgress,
} from '@/lib/ironman/adapt'
import { computeRaceForecast, type RaceForecast } from '@/lib/ironman/forecast'
import { computeRebalance, type Rebalance } from '@/lib/ironman/rebalance'
import { raceTargets, type RaceTarget } from '@/lib/ironman/pace'
import {
  PLAN, RACE, RACE_NYC, STRENGTHS,
  daysToRace, goalsFor, goalSplits, goalDisplay, todayLocal,
  type AthleteId, type RaceGoals, type Sport3, type Standing,
} from '@/lib/ironman/plan'
import { loadBothAthletes, type AthleteData } from './athletes'
import { buildPairDay, paceProfile, type PairDay, type PaceProfile } from './pair-training'
import type { LordasPerson } from '@/lib/types'

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
  /** Newest date any reading covers */
  lastSync: string | null
  /** When the sync itself last ran, ISO */
  lastRefresh: string | null
}

/**
 * One printed day, with each athlete's standing against it. The block is the
 * backbone the whole page argues about, so it ships whole rather than as the
 * weekly aggregate the compliance grid shows.
 */
export interface PlanDayRow {
  date: string
  phase: string
  focus: string
  sessions: { sport: string; title: string; durationMin: number; distanceKm?: number; zone: string; key?: boolean }[]
  /** done | partial | missed | upcoming, per athlete */
  status: Record<string, string>
}

export interface PairIronmanDetail {
  date: string
  /** The full block, day by day */
  plan: PlanDayRow[]
  /** Oldest of the two athletes' refreshes — the page is only as fresh as that */
  feedRefreshedAt: string | null
  races: { name: string; date: string; days: number; location: string }[]
  today: PairDay
  athletes: AthleteDetail[]
}

function mondayOf(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  const dow = (d.getUTCDay() + 6) % 7 // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
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
    targets,
    rebalance,
    progress,
    forecast,
    compliance: { ...totals, weeks: [...weekMap.values()].sort((a, b) => (a.start < b.start ? -1 : 1)) },
    extras,
    noData: data.empty,
    lastSync,
    lastRefresh: data.lastRefresh,
  }
}

export async function buildPairIronmanDetail(date: string = todayLocal()): Promise<PairIronmanDetail> {
  const athletes = await loadBothAthletes()
  const refreshes = athletes.map((a) => a.lastRefresh).filter(Boolean) as string[]

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

  const plan: PlanDayRow[] = PLAN.map((d) => ({
    date: d.date,
    phase: d.phase,
    focus: d.focus,
    sessions: d.sessions.map((x) => ({
      sport: x.sport,
      title: x.title,
      durationMin: x.durationMin,
      distanceKm: x.distanceKm,
      zone: x.zone,
      key: x.key,
    })),
    status: Object.fromEntries(
      matched.map((m) => {
        const st = m.days.get(d.date)
        const active = st?.sessions.filter((x) => x.session.sport !== 'rest') ?? []
        if (!active.length) return [m.person, d.date <= date ? 'done' : 'upcoming']
        const done = active.filter((x) => x.status === 'done').length
        const partial = active.filter((x) => x.status === 'partial').length
        const missed = active.filter((x) => x.status === 'missed').length
        const label =
          done === active.length ? 'done'
            : done + partial > 0 ? 'partial'
            : missed > 0 ? 'missed'
            : 'upcoming'
        return [m.person, label]
      })
    ),
  }))

  return {
    date,
    plan,
    // A pair page is only as current as its staler half.
    feedRefreshedAt: refreshes.length === athletes.length ? refreshes.sort()[0] : null,
    races: [RACE, RACE_NYC]
      .map((r) => ({ name: r.name, date: r.date, days: daysToRace(date, r.date), location: r.location }))
      .filter((r) => r.days >= 0),
    today: buildPairDay(date, athletes),
    athletes: athletes.map((a, i) => detailFor(a, date, athletes[1 - i])),
  }
}
