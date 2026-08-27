/**
 * The pair's Ironman detail view — everything /lordas/ironman renders.
 *
 * Per athlete: readiness and its factors, the pace profile their prescriptions
 * are built from, block compliance against the printed plan, distance progress
 * per discipline, and the goal forecast for New York. Assembled server-side so
 * the two columns are computed identically and can be compared honestly.
 */

import { computeReadiness, matchDay, computeProgress, type Readiness, type SportProgress } from '@/lib/ironman/adapt'
import { computeRaceForecast, type RaceForecast } from '@/lib/ironman/forecast'
import { PLAN, RACE, RACE_NYC, GOALS, goalSplits, daysToRace, todayLocal } from '@/lib/ironman/plan'
import { paceProfile, type PaceProfile } from './pair-training'
import { loadBothAthletes, type AthleteData } from './athletes'
import { buildPairDay, type PairDay } from './pair-training'
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
  profile: PaceProfile
  progress: SportProgress[]
  forecast: RaceForecast
  compliance: { planned: number; done: number; partial: number; missed: number; upcoming: number; weeks: ComplianceWeek[] }
  /** Sessions logged in the block that matched no planned session */
  extras: number
  noData: boolean
  lastSync: string | null
}

export interface PairIronmanDetail {
  date: string
  races: { name: string; date: string; days: number; location: string }[]
  goals: typeof GOALS
  goalSplits: ReturnType<typeof goalSplits>
  today: PairDay
  athletes: AthleteDetail[]
}

function mondayOf(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  const dow = (d.getUTCDay() + 6) % 7 // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

function detailFor(data: AthleteData, today: string): AthleteDetail {
  const readiness = computeReadiness(data.metrics, data.activities, today)
  const profile = paceProfile(data.activities, today)
  const progress = computeProgress(data.activities, today)
  const forecast = computeRaceForecast(data.activities, data.metrics, today)

  const totals = { planned: 0, done: 0, partial: 0, missed: 0, upcoming: 0 }
  const weekMap = new Map<string, ComplianceWeek>()
  let extras = 0

  for (const day of PLAN.filter((d) => d.date <= today)) {
    const status = matchDay(day, data.activities, today)
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

  const lastSync = data.metrics.length ? data.metrics.map((m) => m.date).sort().slice(-1)[0] : null

  return {
    person: data.athlete.id,
    name: data.athlete.name,
    color: data.athlete.color,
    readiness,
    profile,
    progress,
    forecast,
    compliance: { ...totals, weeks: [...weekMap.values()].sort((a, b) => (a.start < b.start ? -1 : 1)) },
    extras,
    noData: data.empty,
    lastSync,
  }
}

export async function buildPairIronmanDetail(date: string = todayLocal()): Promise<PairIronmanDetail> {
  const athletes = await loadBothAthletes()
  return {
    date,
    races: [RACE, RACE_NYC]
      .map((r) => ({ name: r.name, date: r.date, days: daysToRace(date, r.date), location: r.location }))
      .filter((r) => r.days >= 0),
    goals: GOALS,
    goalSplits: goalSplits(),
    today: buildPairDay(date, athletes),
    athletes: athletes.map((a) => detailFor(a, date)),
  }
}
