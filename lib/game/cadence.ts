/**
 * Cadence — weekly KPIs and the month's goal, per quest line.
 *
 * The board answers "how far along"; this answers "what this week". Months are
 * written out longhand rather than generated, because a month's goal should be
 * an argument about that specific month, not a template. September is not a
 * normal month: two half-distance races, the Palanga exit and the CEcon data
 * sprint all close inside it. Four working weeks, two of them race weeks.
 *
 * To add a month: append to MONTHS. The board shows the entry matching today
 * and falls back to the most recent one, so a month that has not been written
 * yet degrades to last month's plan rather than to nothing.
 */

import type { QuestLineId } from './trees'

export interface WeeklyKpi {
  /** Stable persistence key — never rename. */
  id: string
  line: QuestLineId | 'mind'
  label: string
}

export interface MonthGoal {
  id: string
  line: QuestLineId | 'mind'
  /** The headline commitment, shown bold. */
  goal: string
  /** Why this and not something more ambitious. */
  note?: string
}

export interface WeekShape {
  week: string
  dates: string
  shape: string
  /** The week everything lands in at once. */
  hot?: boolean
}

export interface MonthPlan {
  /** YYYY-MM */
  id: string
  label: string
  framing: string
  weeks: WeekShape[]
  kpis: WeeklyKpi[]
  goals: MonthGoal[]
}

export const MONTHS: MonthPlan[] = [
  {
    id: '2026-09',
    label: 'September 2026',
    framing:
      'Two half-distance races, the Palanga exit and the data sprint all close inside this month — four working weeks, two of them race weeks. Five ambitious goals here would guarantee a miss in month one and teach you to ignore the board. So the weighting is deliberate: the Instrument carries September, the Edge gets the one thing that cannot slip, and the Room stays light but never zero.',
    weeks: [
      { week: 'W1', dates: 'Sep 1 – 6', shape: 'Build. Three sprint units. Passkey settled — the only unit that can invalidate the campaign.' },
      { week: 'W2', dates: 'Sep 7 – 13', shape: 'Taper. One sprint unit. Belgrade 70.3 on Sunday the 13th — the rehearsal, run as a rehearsal.' },
      { week: 'W3', dates: 'Sep 14 – 20', shape: 'Recover, then sharpen. Four units — the heaviest research week of the month. BRELL post drafted.' },
      { week: 'W4', dates: 'Sep 21 – 27', shape: 'Palanga exit Tue 23 · sprint closes Thu 25 · NYC 70.3 Sat 26. The compression point of the quarter.', hot: true },
      { week: 'W5', dates: 'Sep 28 – 30', shape: 'Recovery, honestly taken. October opens: §1 Incidence, and Armstrong moves to The Signal.' },
    ],
    kpis: [
      { id: 'k-cap-desk', line: 'capital', label: 'Desk pass on 5 of 5 market days' },
      { id: 'k-cap-risk', line: 'capital', label: 'Zero risk-rule violations through any drawdown' },
      { id: 'k-cap-queue', line: 'capital', label: 'Every queued name judged within a day' },
      { id: 'k-edge-units', line: 'edge', label: 'Sprint units cleared — three in a normal week, one in a race week' },
      { id: 'k-edge-kill', line: 'edge', label: 'At least one hypothesis logged and one killed or advanced' },
      { id: 'k-edge-cv', line: 'edge', label: 'One purged-CV or deflated-Sharpe run against something real' },
      { id: 'k-edge-log', line: 'edge', label: 'Research log written every working day' },
      { id: 'k-room-ship', line: 'room', label: 'One piece shipped' },
      { id: 'k-room-asks', line: 'room', label: 'Two asks a day, logged, detached from the answer' },
      { id: 'k-room-verbal', line: 'room', label: 'Every verbal carries a name, an amount and a date' },
      { id: 'k-inst-sessions', line: 'instrument', label: 'Sessions completed against the plan' },
      { id: 'k-inst-sleep', line: 'instrument', label: 'Sleep seven hours or more on six nights of seven' },
      { id: 'k-inst-wind', line: 'instrument', label: 'Every rideable window taken while the coast is still yours' },
      { id: 'k-mind-sits', line: 'mind', label: 'Sits five of seven' },
      { id: 'k-mind-study', line: 'mind', label: 'The weekly Mahamudra session, never skipped' },
    ],
    goals: [
      {
        id: 'g-2609-capital',
        line: 'capital',
        goal: 'The instrument, not the inflow.',
        note: 'August and September letters to the standard an allocator would read; the tearsheet exists as a document rather than a notebook cell; the thirty-day green-gate run begun and unbroken.',
      },
      {
        id: 'g-2609-edge',
        line: 'edge',
        goal: 'The data sprint closes on the 25th.',
        note: 'Every PJM series on disk and joinable, the forecast-revision chart drawn, PJ-2 pre-registered before any result exists. Plus Oxford supervisor emails out, Lafond first — the cheapest move on Credible Researcher in a race-heavy month, and it makes December meetings rather than first contact.',
      },
      {
        id: 'g-2609-room',
        line: 'room',
        goal: '"The Grid After BRELL" published before you leave Palanga on the 23rd.',
        note: 'Written on that coast it is a dispatch; written from New York it is a retrospective, and the location edge you spent the summer earning is gone. One collaborator conversation off the back of it — no more; the month cannot hold more.',
      },
      {
        id: 'g-2609-instrument',
        line: 'instrument',
        goal: 'Belgrade the rehearsal, NYC all three splits, the exit standard met by the 23rd.',
        note: 'Upwind automatic, 2.5m, two seconds of airtime, eighty percent clean landings, exit review written.',
      },
      {
        id: 'g-2609-mind',
        line: 'mind',
        goal: 'The streak survives both race weeks.',
        note: 'Not a new text. Equanimity inside a taper is the practice, not an interruption to it.',
      },
    ],
  },
]

/** The plan for a YYYY-MM-DD, falling back to the most recent month written. */
export function monthPlanFor(date: string): MonthPlan {
  const key = date.slice(0, 7)
  const exact = MONTHS.find((m) => m.id === key)
  if (exact) return exact
  const past = MONTHS.filter((m) => m.id <= key)
  return past.length ? past[past.length - 1] : MONTHS[0]
}

/**
 * ISO week key, e.g. "2026-W36" — the bucket a weekly KPI check-off lands in,
 * so a new week starts clean without anything having to reset it.
 */
export function isoWeekKey(date: string): string {
  const d = new Date(date + 'T12:00:00Z')
  if (Number.isNaN(d.getTime())) return '0000-W00'
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
