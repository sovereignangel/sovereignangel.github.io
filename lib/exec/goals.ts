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

export interface BroadGoal {
  id: 'armstrong' | 'alamo' | 'cecon'
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
