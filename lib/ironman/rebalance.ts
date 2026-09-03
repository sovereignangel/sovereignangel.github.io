/**
 * Which sport, and why — the recalibration layer.
 *
 * The printed plan in plan.ts is static: a date says a sport. That is the
 * right backbone and the wrong answer on its own, because it cannot see what
 * actually happened. Ride 97km on a day the plan said "run and swim" and the
 * static plan will still cheerfully order a 100km ride three days later, while
 * the run it displaced is never spoken of again.
 *
 * This module closes that loop. For each discipline it asks three questions:
 *
 *   How many minutes is it costing?  Projected split minus goal split. This is
 *     leverage, and it is the only honest ranking — a discipline 20% off goal
 *     but worth 40 minutes of race matters more than one 30% off and worth 10.
 *   Is the distance covered?  Longest qualifying session against a fraction of
 *     race distance. Endurance and speed are different deficits and they take
 *     different sessions; conflating them is how blocks get wasted.
 *   What was just done?  Trailing-week actual against trailing-week planned.
 *     A discipline in surplus does not need more of itself this week, however
 *     much leverage it carries.
 *
 * Leverage ranks them, coverage says what kind of session the leader needs,
 * and the recent balance decides whether the next big session of a surplus
 * sport should still run as printed. The result is a ranking with reasons and
 * a small set of concrete edits to upcoming days — never a wholesale rewrite,
 * because a plan that reshuffles itself every morning is not a plan.
 */

import type { GarminActivity } from '@/lib/types'
import {
  PLAN, RACE, GOALS, STRENGTHS, getPlanDay, goalSplits,
  type AthleteId, type PlanDay, type PlannedSession, type RaceGoals,
  type Sport3, type Standing,
} from './plan'
import { dedupeActivities, matchDay, paceSeconds, sportOfActivity } from './adapt'
import { computeRaceForecast, PACE_BOUNDS, RACE_KM, type DisciplineForecast, type ForecastOptions, type RaceForecast } from './forecast'
import { fmtPace, raceTargets, type RaceTarget } from './pace'

/** Trailing window the actual-vs-planned balance is measured over */
const RECENT_DAYS = 7
/** Window the longest session is taken from — the same one the forecast reads */
const LONGEST_WINDOW_DAYS = 56
/** Days back a big session still counts as "just did this" for a duplicate */
const DUPLICATE_WINDOW_DAYS = 5
/**
 * Minutes in one discipline the day before that count as a hard day, whether
 * or not they matched the size of today's printed session. A 220-minute ride
 * yesterday leaves the same legs regardless of what the plan happened to ask
 * for today.
 */
const HARD_DAY_MIN = 90
/**
 * How much of the printed session survives, by how long ago the work was
 * banked. The distance being ticked is only half the question — the other
 * half is whether the body has had time to absorb it. Same-week is a
 * duplicate; yesterday is fatigue.
 */
function retuneFactor(daysSince: number): { factor: number; recovery: boolean } {
  if (daysSince <= 1) return { factor: 0.4, recovery: true }
  if (daysSince <= 3) return { factor: 0.6, recovery: false }
  return { factor: 0.8, recovery: false }
}

function daysApart(from: string, to: string): number {
  return Math.round(
    (new Date(to + 'T00:00:00Z').getTime() - new Date(from + 'T00:00:00Z').getTime()) / 86400000
  )
}
/** Minutes over goal below which a discipline is simply holding */
const AT_GOAL_MIN = 5
/**
 * How far off race pace a session can be and still count as having *covered*
 * the distance. Beyond this it was time on the feet rather than a rehearsal:
 * a three-hour eighteen-kilometre outing proves you can be outside all
 * morning, not that you can run a half marathon.
 */
const COVERAGE_PACE_LIMIT = 1.35

/**
 * Fraction of race distance a training session has to reach before the
 * endurance question is settled. You swim the full race distance in training
 * and you never run it: standard 70.3 practice, and the reason these differ.
 */
const ENDURANCE_COVER: Record<Sport3, number> = { swim: 1.0, bike: 0.85, run: 0.7 }

export type SportNeed = 'volume' | 'intensity' | 'both' | 'holding' | 'unknown'

export interface SportGap {
  sport: Sport3
  standing: Standing
  goalSplitMin: number
  projectedSplitMin: number | null
  /** Minutes this discipline currently costs against its own goal — the leverage */
  minutesOverGoal: number | null
  longestKm: number
  coverKm: number
  raceKm: number
  enduranceCovered: boolean
  /** Minutes actually logged over the trailing week */
  recentMin: number
  /** Minutes the plan asked for over the same week */
  plannedMin: number
  /** Positive = did more than the plan asked */
  balanceMin: number
  need: SportNeed
  priority: number
  target: RaceTarget
  /** Whether the capability number came from logged sessions or the swim seed */
  paceSource: DisciplineForecast['paceSource']
  why: string
}

export interface PlanMove {
  date: string
  kind: 'retune' | 'trim'
  reason: string
  before: PlannedSession[]
  after: PlannedSession[]
}

export interface Rebalance {
  asOf: string
  sports: SportGap[] // priority descending
  lead: Sport3 | null
  headline: string
  /** Planned sessions the last few days lost, and what took their place */
  displaced: string[]
  /** Why nothing above is being rescheduled */
  displacedNote: string
  /** Newest activity the ranking could see — a stale feed makes all of it a guess */
  dataThrough: string | null
  /** Set when the feed has not caught up, so the reader knows to discount the lot */
  staleNote: string | null
  moves: PlanMove[]
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Sessions that pass the same sanity filters the forecast uses.
 *
 * Each carries two clocks and they answer different questions. `min` is the
 * session — how much of the week it took, whether it duplicates an upcoming
 * one. `paceMin` is the swimming, riding or running inside it, and is the only
 * one a pace may be divided out of. On a run they are the same number; on a
 * 20x100 set off a minute they are 64 and 44.
 */
function qualifying(activities: GarminActivity[], sport: Sport3, from: string, to: string) {
  const [lo, hi] = PACE_BOUNDS[sport]
  return dedupeActivities(activities)
    .filter((a) => a.date != null && a.date >= from && a.date <= to && sportOfActivity(a.type) === sport)
    .map((a) => ({
      date: a.date as string,
      km: (a.distanceMeters ?? 0) / 1000,
      min: (a.durationSeconds ?? 0) / 60,
      paceMin: paceSeconds(a) / 60,
      name: a.name ?? null,
    }))
    .filter((a) => a.min > 0 && (a.km === 0 || (a.paceMin / a.km >= lo && a.paceMin / a.km <= hi)))
}

/** Planned minutes for a sport over a date range — a brick counts as its bike leg */
function plannedMinutes(sport: Sport3, from: string, to: string): number {
  return PLAN.filter((d) => d.date >= from && d.date <= to)
    .flatMap((d) => d.sessions)
    .filter((x) => x.sport === sport || (x.sport === 'brick' && sport === 'bike'))
    .reduce((sum, x) => sum + x.durationMin, 0)
}

function needOf(covered: boolean, over: number | null): SportNeed {
  if (over == null) return 'unknown'
  const slow = over > AT_GOAL_MIN
  if (!covered && slow) return 'both'
  if (!covered) return 'volume'
  return slow ? 'intensity' : 'holding'
}

const NEED_WORD: Record<SportNeed, string> = {
  volume: 'distance',
  intensity: 'speed',
  both: 'distance and speed',
  holding: 'nothing — hold it',
  unknown: 'evidence',
}

function gapFor(
  sport: Sport3,
  activities: GarminActivity[],
  forecast: RaceForecast,
  targets: Record<Sport3, RaceTarget>,
  goals: RaceGoals,
  standing: Standing,
  asOf: string
): SportGap {
  const splits = goalSplits(goals)
  const goalSplitMin = sport === 'swim' ? splits.swim : sport === 'bike' ? splits.bike : splits.run
  const d = forecast.disciplines.find((x) => x.sport === sport)
  const projectedSplitMin = d?.projectedSplitMin ?? null
  const minutesOverGoal = projectedSplitMin == null ? null : projectedSplitMin - goalSplitMin

  const target = targets[sport]
  const paceCeiling =
    target.prescribedPaceMinKm != null ? target.prescribedPaceMinKm * COVERAGE_PACE_LIMIT : null
  const long = qualifying(activities, sport, shiftDate(asOf, -LONGEST_WINDOW_DAYS), asOf).filter(
    (a) => paceCeiling == null || a.km === 0 || a.paceMin / a.km <= paceCeiling
  )
  const longestKm = Math.round(Math.max(0, ...long.map((a) => a.km)) * 10) / 10
  const raceKm = RACE_KM[sport]
  const coverKm = Math.round(raceKm * ENDURANCE_COVER[sport] * 10) / 10
  const enduranceCovered = longestKm >= coverKm

  const from = shiftDate(asOf, -(RECENT_DAYS - 1))
  const recentMin = Math.round(
    qualifying(activities, sport, from, asOf).reduce((s, a) => s + a.min, 0)
  )
  const plannedMin = Math.round(plannedMinutes(sport, from, asOf))
  const balanceMin = recentMin - plannedMin

  const need = needOf(enduranceCovered, minutesOverGoal)

  // Leverage is minutes on the table. A discipline with no measurement gets a
  // placeholder stake rather than a zero — not knowing is itself a reason to
  // go and find out, and a zero would bury it under everything measured.
  const leverage = minutesOverGoal == null ? goalSplitMin * 0.15 : Math.max(0, minutesOverGoal)
  // Distance not yet covered is the more urgent kind of gap: you can race a
  // discipline slower than you hoped, you cannot race one you have not covered.
  const coverageFactor = enduranceCovered ? 1 : 1.25
  // And a discipline just hammered does not need more of itself this week,
  // however much leverage it carries.
  const freshness = balanceMin >= 90 ? 0.5 : balanceMin >= 45 ? 0.75 : balanceMin <= -60 ? 1.15 : 1
  const priority = Math.round(leverage * coverageFactor * freshness * 10) / 10

  const bits: string[] = []
  if (minutesOverGoal == null) {
    bits.push('nothing logged in the window — the projection is a guess until something is')
  } else if (minutesOverGoal > AT_GOAL_MIN) {
    bits.push(`${Math.round(minutesOverGoal)}min over goal split`)
  } else {
    bits.push('at or inside goal split')
  }
  bits.push(enduranceCovered ? `${longestKm}km longest covers the ${coverKm}km mark` : `longest is ${longestKm}km against a ${coverKm}km mark`)
  if (balanceMin >= 45) bits.push(`${balanceMin}min above plan this week`)
  else if (balanceMin <= -45) bits.push(`${Math.abs(balanceMin)}min under plan this week`)
  if (standing === 'weak' && need !== 'holding') bits.push('weakest discipline, so the minutes here are the cheapest to buy')
  if (standing === 'strong' && need === 'holding') bits.push('strongest discipline and already there — keep it awake, do not chase it')
  if (d && d.paceSource === 'benchmark') bits.push('no swims logged in the window — standing on the pre-block benchmark')

  return {
    sport, standing, goalSplitMin, projectedSplitMin, minutesOverGoal,
    longestKm, coverKm, raceKm, enduranceCovered,
    recentMin, plannedMin, balanceMin, need, priority, target,
    paceSource: d?.paceSource ?? null,
    why: bits.join(' · '),
  }
}

// ── Moves ─────────────────────────────────────────────────────────────────

const round5 = (n: number) => Math.round(n / 5) * 5

/**
 * Rewrite an upcoming long session that the last few days already delivered.
 *
 * The test is deliberately narrow: a big printed session, and a real one of
 * the same sport inside the last five days that reached most of its duration
 * or nearly all of its distance. What replaces it depends on what the sport
 * actually needs — if the distance is covered and the speed is not, the second
 * slow session buys nothing a shorter, faster one would not buy better.
 */
function movesFor(
  activities: GarminActivity[],
  gaps: Record<Sport3, SportGap>,
  asOf: string
): PlanMove[] {
  const moves: PlanMove[] = []
  const horizon = shiftDate(asOf, 8)

  // Today counts. A recalibration that only ever edits tomorrow reverts to the
  // printed session the morning it was supposed to change anything.
  for (const day of PLAN.filter((d) => d.date >= asOf && d.date <= horizon)) {
    if (day.phase === 'Race 1' || day.phase === 'Race 2') continue
    let changed = false
    const after = day.sessions.map((session) => {
      if (session.durationMin < 150) return session
      if (session.sport !== 'bike' && session.sport !== 'run' && session.sport !== 'brick') return session
      const sport: Sport3 = session.sport === 'brick' ? 'bike' : session.sport

      // Strictly before the day in question: a session cannot be the reason to
      // shrink itself, and on the day it runs, today's log is that session.
      const window = qualifying(activities, sport, shiftDate(day.date, -DUPLICATE_WINDOW_DAYS), shiftDate(day.date, -1))
      const duplicates = window.filter(
        (a) =>
          a.min >= session.durationMin * 0.85 ||
          (session.distanceKm != null && a.km >= session.distanceKm * 0.9)
      )
      // The biggest session proves the distance is banked; the most recent one
      // decides whether the legs have had time to absorb it. They are rarely
      // the same session, and using only the biggest treated a ride three days
      // ago exactly like one yesterday.
      const biggest = [...duplicates].sort((a, b) => b.min - a.min)[0]
      const yesterdayMin = window
        .filter((a) => daysApart(a.date, day.date) <= 1)
        .reduce((sum, a) => sum + a.min, 0)
      const hardYesterday = yesterdayMin >= HARD_DAY_MIN
      if (!biggest && !hardYesterday) return session

      const latest = [...(biggest ? duplicates : window)]
        .filter((a) => daysApart(a.date, day.date) >= 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0]
      const daysSince = latest ? daysApart(latest.date, day.date) : 99
      const { factor, recovery } = retuneFactor(daysSince)

      const gap = gaps[sport]
      const anchor = biggest ?? latest
      const banked = anchor
        ? `${Math.round(anchor.km)}km in ${Math.round(anchor.min)}min on ${anchor.date}`
        : `${Math.round(yesterdayMin)}min yesterday`
      // Name yesterday's own work rather than implying the banked session was
      // yesterday — they are usually different days, and saying otherwise
      // reads as the engine not knowing what it looked at.
      const fatigue = recovery
        ? ` And ${Math.round(yesterdayMin)}min of it went in yesterday, which the legs have not absorbed yet — so this is the lighter version.`
        : ''
      changed = true

      if (gap.need === 'intensity') {
        const total = round5(session.durationMin * factor)
        // A brick off the back of yesterday's long ride is the part that hurts
        // and the part that teaches least, so it is the first thing dropped.
        const brickMin = session.sport === 'brick' && !recovery ? 20 : 0
        const work = total - brickMin - 20
        const reps = clamp(Math.floor(work / 25), 2, 4)
        const at = fmtPace(sport, gap.target.prescribedPaceMinKm) ?? 'race effort'
        const goalAt = fmtPace(sport, gap.target.goalPaceMinKm)
        const reach =
          gap.target.capped && goalAt
            ? ` Goal pace is ${goalAt}; ${at} is what the current projection can be stretched to, and closing the rest is what these intervals are for.`
            : ''
        return {
          ...session,
          zone: 'race' as const,
          durationMin: total,
          distanceKm: session.distanceKm ? Math.round(session.distanceKm * factor) : undefined,
          title: `${sport === 'bike' ? 'Bike' : 'Run'} ${total}min race effort${brickMin ? ` + ${brickMin}min brick run` : ''}`,
          detail:
            `RETUNED: ${banked} already banked the distance — the endurance box is ticked and another slow one buys nothing.${fatigue} ` +
            `Warm up 20min, then ${reps}x20min at ${at} with 5min easy between.${reach}` +
            (brickMin ? ` Rack the bike and run ${brickMin}min straight off it.` : '') +
            ' Full race nutrition — the fuelling rehearsal is still worth having.',
        }
      }

      const trimTo = round5(session.durationMin * Math.min(factor + 0.15, 0.85))
      return {
        ...session,
        durationMin: trimTo,
        distanceKm: session.distanceKm ? Math.round(session.distanceKm * Math.min(factor + 0.15, 0.85)) : undefined,
        title: `${session.title} (trimmed to ${trimTo}min)`,
        detail: `TRIMMED: ${banked} means this session is paying twice for one adaptation. ${trimTo}min at the printed effort keeps it without the cost.${fatigue} ` + session.detail,
      }
    })

    if (!changed) continue
    const kind: PlanMove['kind'] = after.some((x, i) => x.zone !== day.sessions[i].zone) ? 'retune' : 'trim'
    moves.push({
      date: day.date,
      kind,
      reason: after.find((x, i) => x !== day.sessions[i])?.detail.split('.')[0] ?? '',
      before: day.sessions,
      after,
    })
  }

  return moves
}

/** Planned sessions from the last few days that never happened, and what did */
function displacedNotes(activities: GarminActivity[], asOf: string): string[] {
  const notes: string[] = []
  for (const day of PLAN.filter((d) => d.date < asOf && d.date >= shiftDate(asOf, -3))) {
    const status = matchDay(day, activities, asOf)
    const missed = status.sessions.filter((s) => s.status === 'missed' && s.session.sport !== 'rest')
    if (missed.length === 0) continue
    const instead = status.extras
      .filter((e) => e.durationMin >= 45)
      .map((e) => `${e.distanceKm ? `${e.distanceKm}km ` : ''}${e.durationMin}min ${e.sport ?? e.type}`)
    notes.push(
      `${day.date}: ${missed.map((m) => m.session.title).join(' + ')}` +
        (instead.length ? ` — ${instead.join(', ')} went in instead` : ' — nothing logged')
    )
  }
  return notes
}

// ── Entry point ───────────────────────────────────────────────────────────

export function computeRebalance(
  activities: GarminActivity[],
  metrics: Parameters<typeof computeRaceForecast>[1],
  asOf: string,
  person: AthleteId = 'lori',
  opts: ForecastOptions = {}
): Rebalance {
  const goals = opts.goals ?? GOALS
  const forecast = computeRaceForecast(activities, metrics, asOf, { ...opts, goals })
  const targets = raceTargets(forecast, goals)
  const standings = STRENGTHS[person] ?? STRENGTHS.lori

  const sports = (['swim', 'bike', 'run'] as const)
    .map((sport) => gapFor(sport, activities, forecast, targets, goals, standings[sport], asOf))
    .sort((a, b) => b.priority - a.priority)

  const byS = Object.fromEntries(sports.map((s) => [s.sport, s])) as Record<Sport3, SportGap>
  const lead = sports[0]?.priority > 0 ? sports[0].sport : null
  const moves = movesFor(activities, byS, asOf)

  const headline = lead
    ? `${lead[0].toUpperCase()}${lead.slice(1)} is where the race is — ${NEED_WORD[byS[lead].need]}` +
      (byS[lead].minutesOverGoal != null && byS[lead].minutesOverGoal > AT_GOAL_MIN
        ? `, ${Math.round(byS[lead].minutesOverGoal as number)}min on the table`
        : '')
    : 'All three disciplines are inside their goal splits — hold the block'

  const dates = activities.map((a) => a.date).filter((d): d is string => !!d && d <= asOf).sort()
  const dataThrough = dates.length ? dates[dates.length - 1] : null
  const staleDays = dataThrough ? Math.round((new Date(asOf + 'T00:00:00Z').getTime() - new Date(dataThrough + 'T00:00:00Z').getTime()) / 86400000) : null

  return {
    asOf,
    sports,
    lead,
    headline,
    displaced: displacedNotes(activities, asOf),
    displacedNote:
      'Absorbed, not rescheduled — three weeks out, chasing a missed session costs more than the session was worth. It shows up in the ranking above as a week under plan, which is the honest place for it.',
    dataThrough,
    staleNote:
      staleDays != null && staleDays > 1
        ? `Nothing has synced since ${dataThrough} — ${staleDays} days. Everything above is scored on a feed that has not caught up, so treat the ranking as provisional until it does.`
        : null,
    moves,
  }
}

/** The plan for a date with any rebalance edits already applied */
export function planDayWith(date: string, moves: PlanMove[]): PlanDay | undefined {
  const day = getPlanDay(date)
  if (!day) return undefined
  const move = moves.find((m) => m.date === date)
  return move ? { ...day, sessions: move.after } : day
}

export { NEED_WORD, ENDURANCE_COVER }
