/**
 * Pace anchoring — turning a goal into a number you can hold today.
 *
 * The old model expressed zones as fixed offsets from habitual training pace:
 * "race effort is your usual speed plus 2.5km/h". That breaks in both
 * directions. It breaks across athletes, because +2.5km/h is a different
 * physiological ask for a 20km/h rider than for a 32km/h one. And it breaks
 * against the goal, because habitual pace is whatever you have been doing —
 * a block spent riding at 20km/h will keep prescribing 22.5km/h as "race
 * effort" no matter that race day needs 29.
 *
 * So zones are anchored to race pace instead, and race pace comes from the
 * goal rather than from history — capped so it stays a stretch and not a
 * fantasy. If the projection says you are more than REACH off the goal, the
 * prescription is the projection improved by REACH, and the shortfall is
 * reported rather than buried. Every other zone is a fixed fraction of that
 * anchor, which makes the whole ladder scale correctly for both bodies.
 */

import { goalPaceMinKm, type RaceGoals, type Sport3, type Zone } from './plan'
import type { DisciplineForecast, RaceForecast } from './forecast'

/**
 * How far past the projected race-day pace a prescription is allowed to reach.
 * Eight percent is roughly what a well-executed race adds over training pace;
 * beyond that the session stops training the target system and starts
 * rehearsing a blow-up.
 */
export const REACH = 0.08

/**
 * Zone targets as multiples of race pace (min/km — higher is slower).
 * Bike spreads widest because aerodynamic drag makes speed fall away faster
 * than effort does; swimming spreads least because water gives back so little.
 */
const ZONE_PACE_FACTOR: Record<Sport3, Record<Zone, number | null>> = {
  run: { Z1: 1.22, Z2: 1.12, Z3: 1.04, race: 1.0, mixed: 1.12, '-': null },
  bike: { Z1: 1.25, Z2: 1.11, Z3: 1.03, race: 1.0, mixed: 1.11, '-': null },
  swim: { Z1: 1.15, Z2: 1.08, Z3: 1.03, race: 1.0, mixed: 1.08, '-': null },
}

export interface RaceTarget {
  sport: Sport3
  goalPaceMinKm: number
  projectedPaceMinKm: number | null
  /** What to actually hold when a session says "race effort" */
  prescribedPaceMinKm: number | null
  /** True when the goal was out of reach and the prescription had to back off it */
  capped: boolean
  /** How far the projection sits off the goal, as a fraction (0.26 = 26% slow) */
  gapPct: number | null
}

export function raceTargetOf(d: DisciplineForecast, goals: RaceGoals): RaceTarget {
  const goal = goalPaceMinKm(d.sport, goals)
  const projected = d.projectedPaceMinKm
  if (projected == null) {
    return { sport: d.sport, goalPaceMinKm: goal, projectedPaceMinKm: null, prescribedPaceMinKm: goal, capped: false, gapPct: null }
  }
  const floor = projected * (1 - REACH)
  const prescribed = Math.max(goal, floor)
  return {
    sport: d.sport,
    goalPaceMinKm: goal,
    projectedPaceMinKm: projected,
    prescribedPaceMinKm: prescribed,
    capped: prescribed > goal + 1e-9,
    gapPct: (projected - goal) / goal,
  }
}

export function raceTargets(forecast: RaceForecast, goals: RaceGoals): Record<Sport3, RaceTarget> {
  const out = {} as Record<Sport3, RaceTarget>
  for (const d of forecast.disciplines) out[d.sport] = raceTargetOf(d, goals)
  return out
}

/**
 * The pace for one session. Anchored to race pace where a target exists;
 * otherwise it falls back to habitual training pace, which is Z2 by
 * definition, and scales the other zones around it.
 */
export function zonePaceMinKm(
  sport: Sport3,
  zone: Zone,
  target: RaceTarget | undefined,
  habitualMinKm: number | null
): number | null {
  const factor = ZONE_PACE_FACTOR[sport][zone]
  if (factor == null) return null
  const anchor = target?.prescribedPaceMinKm
  if (anchor != null) return anchor * factor
  if (habitualMinKm != null) return habitualMinKm * (factor / (ZONE_PACE_FACTOR[sport].Z2 as number))
  return null
}

// ── Formatting ────────────────────────────────────────────────────────────

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

/** A min/km pace said the way its own discipline says it */
export function fmtPace(sport: Sport3, paceMinKm: number | null): string | null {
  if (paceMinKm == null || !isFinite(paceMinKm) || paceMinKm <= 0) return null
  if (sport === 'bike') return fmtBikeSpeed(60 / paceMinKm)
  if (sport === 'swim') return fmtSwimPace((paceMinKm * 60) / 10)
  return fmtRunPace(paceMinKm)
}

// ── US units ──────────────────────────────────────────────────────────────
//
// The races are scored in miles per hour and minutes per mile, and that is
// how the athlete thinks about the bike and the run. Metric stays available
// on hover rather than being thrown away, because every plan distance and
// every Garmin field underneath is still metric.

const M_PER_MILE = 1.609344
const M_PER_YARD = 0.9144

export function fmtRunPaceMile(minPerKm: number): string {
  const total = Math.round(minPerKm * M_PER_MILE * 60)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}/mi`
}

export function fmtBikeMph(kmh: number): string {
  return `${(kmh / M_PER_MILE).toFixed(1)} mph`
}

/** Swim is spoken in metres worldwide; yards is the second reading, not the first. */
export function fmtSwimPaceYd(secPer100m: number): string {
  const total = Math.round(secPer100m * M_PER_YARD)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}/100yd`
}

/** The same pace in US units — mph on the bike, min/mile on the run. */
export function fmtPaceUS(sport: Sport3, paceMinKm: number | null): string | null {
  if (paceMinKm == null || !isFinite(paceMinKm) || paceMinKm <= 0) return null
  if (sport === 'bike') return fmtBikeMph(60 / paceMinKm)
  if (sport === 'swim') return fmtSwimPace((paceMinKm * 60) / 10)
  return fmtRunPaceMile(paceMinKm)
}

/**
 * Both readings of one pace. `primary` is what the page shows; `secondary`
 * is what the hover reveals. Swim reads the same either way on the primary,
 * so its secondary is yards.
 */
export function paceBoth(sport: Sport3, paceMinKm: number | null): { primary: string; secondary: string } | null {
  const us = fmtPaceUS(sport, paceMinKm)
  if (!us) return null
  const metric = sport === 'swim'
    ? fmtSwimPaceYd((paceMinKm as number) * 60 / 10)
    : fmtPace(sport, paceMinKm)
  return { primary: us, secondary: metric ?? '' }
}

export function fmtSplit(minutes: number | null): string {
  if (minutes == null) return '--'
  const total = Math.round(minutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}min`
}
