/**
 * The three broad goals — the horizon above the day.
 *
 * /exec answers what today is. These answer what today is for. They change
 * on the order of quarters, so they are written here rather than tracked:
 * the only live parts are the countdown and, where a roadmap already exists,
 * the phase that roadmap says you are in.
 *
 * Two of the three are build goals and one is explicitly maintenance. Saying
 * so matters — an unlabelled maintenance goal quietly competes for the same
 * hours as a build goal and loses, or worse, wins.
 */

import { currentPhase } from '@/lib/complexecon/roadmap'
import { CAMPAIGNS, campaignOrder } from '@/lib/campaign'

export type GoalMode = 'build' | 'maintain'

/**
 * The athlete goal's numbers, in one place.
 *
 * Six hours of Ironman training a week is the standing commitment; four hours
 * on the water is the NYC baseline, which is what an ordinary week looks like
 * when the Atlantic is the nearest lagoon. A block changes only the water
 * figure — Svencele is twenty hours over four days, five weeks of NYC water in
 * a long weekend, which is exactly why the block exists.
 */
export const ATHLETE = {
  trainWeeklyH: 6,
  waterWeeklyH: 4,
  waterBlockH: 20,
} as const

export interface BroadGoal {
  id: 'armstrong' | 'alamo' | 'cecon' | 'athlete'
  name: string
  /** The outcome, stated so you would know if it happened. */
  target: string
  mode: GoalMode
  /** YYYY-MM-DD, or null where the goal is a standing commitment. */
  deadline: string | null
  deadlineLabel: string
  detail: string
  href: string
  accent: string
}

export const BROAD_GOALS: BroadGoal[] = [
  {
    id: 'athlete',
    name: '4xAthlete',
    target: 'Consistent progression — Ironman and the water',
    mode: 'build',
    deadline: null,
    deadlineLabel: `Standing · ${ATHLETE.trainWeeklyH}h + ${ATHLETE.waterWeeklyH}h a week`,
    detail:
      'Two sports, one discipline: the hours are the progression. Six hours of training and four on the water in an ordinary NYC week; twenty on the water when a block takes you to a lagoon.',
    href: '/ironman',
    accent: '#1a8a8f',
  },
  {
    id: 'armstrong',
    name: 'Armstrong',
    target: 'Fundraise $10–20M',
    mode: 'build',
    deadline: '2027-12-31',
    deadlineLabel: 'December 2027',
    detail:
      'The track record is permission; the relationship is the decision. Everything on the Armstrong ladder is upstream of a wire.',
    href: '/game',
    accent: '#7a5a2e',
  },
  {
    id: 'alamo',
    name: 'Alamo Bernal',
    target: 'Tech and research support, executed',
    mode: 'maintain',
    deadline: null,
    deadlineLabel: 'Standing · 2 days a week',
    detail:
      'Maintenance, and labelled as such. It funds the other two, and the whole discipline is holding it to its boundary so it does not quietly eat them.',
    href: '/thesis/operate',
    accent: '#8c2d2d',
  },
  {
    id: 'cecon',
    name: 'Complexity Economics',
    target: 'Establish a research lane',
    mode: 'build',
    deadline: '2027-01-03',
    deadlineLabel: 'Abu Dhabi, January 2027',
    detail:
      'Research that moves the field rather than restating it — built on what came before, legible to Farmer as complexity and to López de Prado as method, and evidenced where possible on the live books.',
    href: '/complexecon/roadmap',
    accent: '#2d4a6f',
  },
]

export interface GoalStanding {
  goal: BroadGoal
  /** Days to the deadline. Null for standing commitments. */
  daysLeft: number | null
  /** Where the roadmap or campaign says you are right now. */
  phase: string | null
  /** What has to be true to leave it. */
  gate: string | null
}

function daysBetween(a: string, b: string): number {
  const x = Date.parse(a + 'T12:00:00Z')
  const y = Date.parse(b + 'T12:00:00Z')
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 0
  return Math.round((y - x) / 86_400_000)
}

/**
 * Standing for each goal, today. CEcon reads its live phase from the roadmap
 * that already exists at /complexecon/roadmap, and Armstrong from the campaign
 * ladder — neither is a second copy of the plan.
 */
export function goalStandings(today: string, doneIds: ReadonlySet<string> = new Set()): GoalStanding[] {
  return BROAD_GOALS.map((goal) => {
    const daysLeft = goal.deadline ? daysBetween(today, goal.deadline) : null

    if (goal.id === 'cecon') {
      const p = currentPhase(today)
      return { goal, daysLeft, phase: `${p.name} · ${p.window}`, gate: p.gate }
    }
    if (goal.id === 'armstrong') {
      const order = campaignOrder(CAMPAIGNS.armstrong, doneIds, today, 1)
      return {
        goal,
        daysLeft,
        phase: order.block ? `${order.block.numeral} · ${order.block.name}` : null,
        gate: order.block?.gate ?? null,
      }
    }
    return { goal, daysLeft, phase: null, gate: null }
  })
}

// ── The athlete standing ──────────────────────────────────────────────────
// Hours, counted from what the watch and the session log actually recorded.
// A goal about consistency cannot be self-reported in the same breath as it is
// set, so nothing here is ticked by hand.

import { SVENCELE_END, SVENCELE_START, tripIsLive } from './svencele'

export interface AthleteStanding {
  /** Ironman training hours in the window. */
  trainH: number
  /** Hours on the water in the window. */
  waterH: number
  trainTarget: number
  waterTarget: number
  /** What the window is — "last 7 days", or the block. */
  windowLabel: string
  /** Dates counted, oldest first. */
  dates: string[]
}

function daysBack(today: string, n: number): string[] {
  const out: string[] = []
  const d = new Date(today + 'T12:00:00Z')
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d)
    x.setUTCDate(x.getUTCDate() - i)
    out.push(x.toISOString().slice(0, 10))
  }
  return out
}

function datesBetween(from: string, to: string): string[] {
  const out: string[] = []
  const d = new Date(from + 'T12:00:00Z')
  const end = new Date(to + 'T12:00:00Z')
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

/**
 * Training and water hours over the window that matters today.
 *
 * During a block the water figure is measured over the block rather than a
 * rolling week: twenty hours in four days is not a weekly rate, and averaging
 * it into one would flatter the weeks on either side of it. Training stays on
 * the rolling seven days throughout — it is a habit, and a habit is only ever
 * measured by the last week of it.
 */
export function athleteStanding(
  today: string,
  trainHoursByDate: Record<string, number>,
  waterHoursByDate: Record<string, number>
): AthleteStanding {
  const inBlock = tripIsLive(today)
  const week = daysBack(today, 7)
  const waterDates = inBlock ? datesBetween(SVENCELE_START, SVENCELE_END) : week
  const sum = (dates: string[], src: Record<string, number>) =>
    dates.reduce((s, d) => s + (src[d] || 0), 0)

  return {
    trainH: sum(week, trainHoursByDate),
    waterH: sum(waterDates, waterHoursByDate),
    trainTarget: ATHLETE.trainWeeklyH,
    waterTarget: inBlock ? ATHLETE.waterBlockH : ATHLETE.waterWeeklyH,
    windowLabel: inBlock ? 'Svencele block' : 'last 7 days',
    dates: waterDates,
  }
}
