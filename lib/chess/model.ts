/**
 * The chess rating model — how fast a Chess.com rapid rating moves for an
 * adult training a fixed number of hours a week.
 *
 * This is a planning model, not a fit to your games. It encodes the one shape
 * every adult-improver dataset agrees on: points are cheap below 1200 (they
 * come from not hanging pieces) and expensive above 1800 (they come from
 * calculation and understanding that take years to build). The rates are
 * points per month at 7.5 hours a week of deliberate practice — tactics,
 * long games, and honest review — plus a steady diet of rated games. They sit
 * a little above an over-the-board model because online rapid gives far more
 * rated games per week, so the rating catches up to the strength faster.
 *
 * Hours scale the rate sub-linearly: the tenth hour of a week is worth less
 * than the fifth, because absorption, not exposure, is the bottleneck.
 *
 * Chess.com rapid ratings on /chess are plotted against these lines, so the model
 * gets checked by reality rather than defended.
 */

export const START_RATING = 900
export const START_DATE = '2026-10-09'
/** Chess.com rapid — the A Team is picked on a rating floor, set here. */
export const TARGET_RATING = 1700
export const TOURNAMENT_DATE = '2026-10-24'
export const TOURNAMENT_LABEL = 'Williamsburg — Oct 24'

/** Self-estimated from Chess.com play — replaced by the first logged rapid rating. */
export const START_IS_ESTIMATE = true

export const REFERENCE_HOURS = 7.5
const HOURS_EXPONENT = 0.7

export interface Band {
  from: number
  to: number
  /** Points per month at REFERENCE_HOURS. */
  rate: number
}

export const BANDS: Band[] = [
  // Below 800 a game is usually decided by the first piece left hanging; stop
  // doing that and the rating climbs fast.
  { from: 0, to: 800, rate: 80 },
  { from: 800, to: 1200, rate: 50 },
  { from: 1200, to: 1500, rate: 28 },
  { from: 1500, to: 1800, rate: 16 },
  { from: 1800, to: 2000, rate: 10 },
  { from: 2000, to: 2400, rate: 5 },
]

export const SCENARIOS = [5, 7.5, 10] as const
export type ScenarioHours = (typeof SCENARIOS)[number]

/** One walnut hue, light to dark by hours — validated as an ordinal ramp. */
export const SCENARIO_COLOR: Record<ScenarioHours, string> = {
  5: '#c49a6c',
  7.5: '#9a6a3a',
  10: '#6b4420',
}

export const MILESTONES = [1200, 1400, 1600, 1700] as const

function hoursMultiplier(hours: number): number {
  return Math.pow(Math.max(hours, 0.5) / REFERENCE_HOURS, HOURS_EXPONENT)
}

function rateAt(rating: number, hours: number): number {
  const band = BANDS.find((b) => rating >= b.from && rating < b.to) ?? BANDS[BANDS.length - 1]
  return band.rate * hoursMultiplier(hours)
}

/** Months from `from` to `to` rating at a steady weekly load. */
export function monthsBetween(from: number, to: number, hours: number): number {
  let r = from
  let months = 0
  while (r < to && months < 240) {
    const band = BANDS.find((b) => r >= b.from && r < b.to) ?? BANDS[BANDS.length - 1]
    const stop = Math.min(to, band.to)
    const rate = band.rate * hoursMultiplier(hours)
    months += (stop - r) / rate
    r = stop
  }
  return months
}

/** Projected rating after `months` at a steady weekly load. */
export function ratingAfter(from: number, months: number, hours: number): number {
  let r = from
  let left = months
  while (left > 1e-6) {
    const band = BANDS.find((b) => r >= b.from && r < b.to) ?? BANDS[BANDS.length - 1]
    const rate = rateAt(r, hours)
    const toEdge = (band.to - r) / rate
    if (toEdge >= left) return r + left * rate
    r = band.to
    left -= toEdge
  }
  return r
}

const DAY_MS = 86_400_000
const MONTH_DAYS = 30.44

export function addMonthsISO(date: string, months: number): string {
  const t = Date.parse(date + 'T12:00:00Z') + months * MONTH_DAYS * DAY_MS
  return new Date(t).toISOString().slice(0, 10)
}

export function monthsSince(from: string, to: string): number {
  return (Date.parse(to + 'T12:00:00Z') - Date.parse(from + 'T12:00:00Z')) / DAY_MS / MONTH_DAYS
}

/** The date each milestone lands on, per scenario. */
export function milestoneDates(from = START_RATING, start = START_DATE) {
  return SCENARIOS.map((hours) => ({
    hours,
    dates: MILESTONES.map((m) => ({ rating: m, date: addMonthsISO(start, monthsBetween(from, m, hours)) })),
  }))
}

/** What the sprint to the tournament is worth on the rating, per scenario. */
export function tournamentProjection(from = START_RATING, start = START_DATE) {
  const months = monthsSince(start, TOURNAMENT_DATE)
  return SCENARIOS.map((hours) => ({ hours, rating: Math.round(ratingAfter(from, months, hours)) }))
}

// ── The stages ────────────────────────────────────────────────────────────
// The mastery flow. Each stage is defined by the error that costs the most
// points at that level, because that is the thing worth training — not
// whatever is most interesting to study.

export interface Stage {
  id: string
  numeral: string
  name: string
  band: [number, number]
  /** The error that loses the most games in this band. */
  leak: string
  /** What the hours go to. */
  focus: string[]
  /** Books and tools, in the order to use them. */
  stack: string[]
  /** How you know you are done with the stage — not the rating alone. */
  exit: string
  /** Weekly split, hours at 7.5/week. Sums to 7.5. */
  split: { label: string; hours: number }[]
}

export const STAGES: Stage[] = [
  {
    id: 'blunder',
    numeral: 'I',
    name: 'Blunder-Proof',
    band: [0, 1200],
    leak: 'Hanging pieces and missing one-move threats. At 900 most games are decided by a piece left en prise, not by a plan.',
    focus: [
      'A blunder check on every move: checks, captures, threats — mine and theirs',
      'One- and two-move tactics until the motifs are instant',
      'The basic mates and king-and-pawn endings',
      'A small, sound opening repertoire that reaches a playable middlegame',
    ],
    stack: [
      'Chess Steps (Brunia & van Wijgerden), steps 2–3 workbooks',
      'Chess.com puzzles, untimed, calculated to the end before moving',
      "Silman's Complete Endgame Course, Class E–D chapters",
      'Logical Chess Move by Move (Chernev) — one game a week',
    ],
    exit: 'Ten consecutive rapid games with no piece hung in one move, and the K+Q and K+R mates done cold against a clock.',
    split: [
      { label: 'Tactics', hours: 3 },
      { label: 'Long games', hours: 2 },
      { label: 'Review own games', hours: 1.5 },
      { label: 'Endgames', hours: 1 },
    ],
  },
  {
    id: 'pattern',
    numeral: 'II',
    name: 'Pattern Library',
    band: [1200, 1500],
    leak: 'Two- and three-move combinations missed on both sides, and drifting once the opening is over.',
    focus: [
      'The Woodpecker method: one fixed puzzle set, solved in shrinking cycles',
      'Opening principles into plans — know what each opening is trying to do',
      'Rook endings and the basic theoretical positions',
      'Rated 15+10 rapid every week, over the board when you can',
    ],
    stack: [
      'The Woodpecker Method (Smith & Tikkanen), easy and intermediate sets',
      'Build Up Your Chess 1 (Yusupov)',
      "Silman's Complete Endgame Course, Class C chapters",
      'A coach, monthly — the cheapest rating points available',
    ],
    exit: 'Woodpecker intermediate set solved twice at under half the first-pass time; every game annotated before the engine is opened.',
    split: [
      { label: 'Tactics', hours: 2.5 },
      { label: 'Long games', hours: 2 },
      { label: 'Review own games', hours: 1.5 },
      { label: 'Endgames', hours: 1 },
      { label: 'Openings', hours: 0.5 },
    ],
  },
  {
    id: 'plans',
    numeral: 'III',
    name: 'Plans and Structures — the A Team bar',
    band: [1500, 1700],
    leak: 'Positional drift: no plan in quiet positions, bad trades, pawn structures misread.',
    focus: [
      'Pawn structures and the plans that come with them',
      'Calculation depth — candidate moves, then the tree, written down',
      'Model games in your own openings',
      'A real repertoire file, kept current after every game',
    ],
    stack: [
      'Build Up Your Chess 2 (Yusupov)',
      'Pawn Structure Chess (Soltis)',
      'Calculation drills — Aagaard, Calculation (Grandmaster Preparation)',
      'Coach every two weeks; one OTB tournament a month',
    ],
    exit: '1700 Chess.com rapid, held for a month — and your losses come from calculation errors rather than strategy.',
    split: [
      { label: 'Calculation', hours: 2 },
      { label: 'Long games', hours: 2 },
      { label: 'Review own games', hours: 1.5 },
      { label: 'Structures + model games', hours: 1 },
      { label: 'Endgames', hours: 1 },
    ],
  },
]

export function stageFor(rating: number): Stage {
  return STAGES.find((s) => rating >= s.band[0] && rating < s.band[1]) ?? STAGES[STAGES.length - 1]
}
