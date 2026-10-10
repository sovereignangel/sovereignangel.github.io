import type { AthleteId } from './plan'

/**
 * Championship qualifying — what a race on the calendar is worth in slots.
 *
 * From the 2026 cycle IRONMAN gives every qualifier the same number of slots
 * for women as for men. Each age-group winner takes one; everything left goes
 * to a Performance Pool, ranked by finish time multiplied by an age-grade
 * factor. Unclaimed slots roll down the same order. So for any one athlete,
 * the AG win and the pool both reduce to one question: is the raw finish
 * under a single number? `requiredMin` is that number.
 *
 * The slot counts and pool cutoffs below are estimates, not published
 * figures — the pool is a new system with one season of results behind it.
 * Every estimate carries its basis, and the cutoff spread is folded into the
 * odds so a guessed cutoff can not read as a sure one.
 */

export type AgeGroup = 'F30-34' | 'F35-39' | 'F40-44' | 'M30-34' | 'M35-39' | 'M40-44'

/**
 * IRONMAN 70.3 Standard age-grade factors (2026 cycle), as reported by
 * Triathlete and TRI247. Finish time × factor = pool time. Re-check against
 * IRONMAN's own table each season — the standard rolls on a five-year average.
 */
export const AGE_GRADE_703: Record<AgeGroup, number> = {
  'F30-34': 0.9828,
  'F35-39': 0.9658,
  'F40-44': 0.9426,
  'M30-34': 0.9655,
  'M35-39': 0.95,
  'M40-44': 0.9262,
}

/**
 * Age group is age on 31 December of the championship year, not race day.
 *
 * Lori raced F30-34 throughout 2022 (Puerto Rico, North Carolina, Florida
 * results), so 2027 puts her in F35-39. Aidas's birth year is not on file —
 * his group is assumed until it is entered here.
 */
export const AGE_GROUP_2027: Record<AthleteId, { group: AgeGroup; assumed: boolean }> = {
  lori: { group: 'F35-39', assumed: false },
  aidas: { group: 'M35-39', assumed: true },
}

export interface QualifyingRace {
  name: string
  date: string
  location: string
  /** Which championship the slots are for */
  championship: string
  championshipDate: string
  /** Age-group slots, split equally between women and men */
  slots: number
  /** Expected finishers by gender */
  field: { women: number; men: number }
  /**
   * Last pool time (finish × age-grade factor, minutes) expected to get a
   * slot once rolldown is done. One number per gender, because the pool is.
   */
  poolCutoffMin: { women: number; men: number }
  /** Relative spread on that cutoff — how much the estimate itself could miss by */
  cutoffSpread: number
  basis: string
}

export const QUALIFYING_RACES: QualifyingRace[] = [
  {
    name: 'Experience Oman IRONMAN 70.3 Muscat',
    date: '2027-02-06',
    location: 'Muscat',
    championship: 'IRONMAN 70.3 World Championship · Chattanooga',
    championshipDate: '2027-08-28',
    slots: 50,
    field: { women: 130, men: 620 },
    // Women: 25 slots, ~11 to AG winners, ~14 to the pool; a far-flung
    // championship means roughly 60% uptake, so the pool rolls to about the
    // 34th-best age-graded woman — near the top quarter of the field.
    // Men: same 25 slots across a field nearly five times larger, so the pool
    // stops around the top 6%.
    poolCutoffMin: { women: 350, men: 270 },
    cutoffSpread: 0.06,
    basis:
      'Slots: 50 at Oman 2025 (Coach Cox). Field: 718 finishers in 2025, 1,049 entrants in 2026. ' +
      'Cutoffs: modelled from the 2025 age-group top-5% times (F35-39 4:53, M35-39 4:21) and ~60% slot uptake.',
  },
]

/** Race-day spread on a projected finish four months out — fitness, heat, course */
const FINISH_SPREAD = 0.05

/** Standard normal CDF (Abramowitz–Stegun 7.1.26, error < 1.5e-7) */
function normCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2)
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t *
    Math.exp(-(z * z) / 2)
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2
}

export function genderOf(group: AgeGroup): 'women' | 'men' {
  return group.startsWith('F') ? 'women' : 'men'
}

/** The raw finish an athlete needs at this race for a slot */
export function requiredMin(race: QualifyingRace, athlete: AthleteId): number {
  const { group } = AGE_GROUP_2027[athlete]
  return race.poolCutoffMin[genderOf(group)] / AGE_GRADE_703[group]
}

/**
 * Chance of a slot if the athlete arrives fit for `projectedMin`. Both the
 * finish and the cutoff are uncertain; their spreads add in quadrature.
 */
export function slotChance(race: QualifyingRace, athlete: AthleteId, projectedMin: number): number {
  const need = requiredMin(race, athlete)
  const sd = Math.hypot(projectedMin * FINISH_SPREAD, need * race.cutoffSpread)
  return normCdf((need - projectedMin) / sd)
}

/** The qualifying races still ahead of `today` */
export function upcomingQualifiers(today: string): QualifyingRace[] {
  return QUALIFYING_RACES.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))
}
