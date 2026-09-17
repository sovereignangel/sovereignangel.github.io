/**
 * The Svencele block — Friday 18 to Monday 21 September.
 *
 * Thursday is off the sheet: it was the arrival day, and it taught the block
 * its one hard constraint. Sunset was 19:57 and the last rider came off the
 * water at 20:12 — roughly half an hour past sunset. That is the wall the day
 * is built backwards from: the water closes at ~20:10, so a five-hour session
 * has to be on by 15:00 and an evening run starts at 20:00, in the dusk.
 *
 * Four desk blocks of two hours, and every one of them is exchangeable. The
 * clock windows are fixed by the light and the wind; what happens inside a
 * window is not. A block carries a lane, a goal, and a KPI written before it
 * starts — a block without a stated outcome is the failure mode this sheet
 * exists to prevent, and the debrief says so out loud.
 *
 * The floor is five desk hours a day, six on a good one. Eight are scheduled,
 * which is deliberate: the surplus is what gets traded for wind.
 */

export const SVENCELE_START = '2026-09-18'
export const SVENCELE_END = '2026-09-21'

/** Desk hours banked. The floor is the commitment; the stretch is the good day. */
export const DAILY_FLOOR_H = 5
export const DAILY_STRETCH_H = 6

/** Observed Thursday 17 Sep, and the reason the evening is shaped the way it is. */
export const LIGHT = {
  sunset: '19:57',
  lastOut: '20:12',
  note: 'Sunset 19:57, last rider off at 20:12 — about 30 minutes of usable light past sunset. Water closes ~20:10.',
} as const

export type TripLane = 'complexecon' | 'armstrong' | 'alamo' | 'kite' | 'ironman' | 'open'

export const TRIP_LANE_COLOR: Record<TripLane, string> = {
  complexecon: '#2d4a6f',
  armstrong: '#7a5a2e',
  alamo: '#8c2d2d',
  kite: '#1a8a8f',
  ironman: '#8f2d33',
  open: '#7d8a86',
}

export const TRIP_LANE_LABEL: Record<TripLane, string> = {
  complexecon: 'CEcon',
  armstrong: 'Armstrong',
  alamo: 'AB paper',
  kite: 'Kite',
  ironman: 'Ironman',
  open: 'Open',
}

/** Lanes a desk block can be traded into. Kite and the evening run are not desk work. */
export const DESK_LANES: TripLane[] = ['complexecon', 'armstrong', 'alamo', 'open']

// ── The day's fixed windows ───────────────────────────────────────────────

export interface DeskSlot {
  id: string
  /** Clock window in Palanga time. Fixed by the light; the lane inside it is not. */
  window: string
  label: string
  defaultLane: TripLane
  hours: number
  note: string
}

export const DESK_SLOTS: DeskSlot[] = [
  {
    id: 's1',
    window: '07:00–09:00',
    label: 'Sunrise',
    defaultLane: 'complexecon',
    hours: 2,
    note: 'The quiet two hours, before anything has a claim on them. Reading and thinking do better here than execution.',
  },
  {
    id: 's2',
    window: '09:30–11:30',
    label: 'Morning',
    defaultLane: 'complexecon',
    hours: 2,
    note: 'After breakfast. The execution half of the research: code, data, reproduction.',
  },
  {
    id: 's3',
    window: '12:00–14:00',
    label: 'Midday',
    defaultLane: 'armstrong',
    hours: 2,
    note: 'Before lunch. The hardest Armstrong unit on the ladder, taken first.',
  },
  {
    id: 's4',
    window: '15:00–17:00',
    label: 'Afternoon',
    defaultLane: 'armstrong',
    hours: 2,
    note: 'The tradeable block. On a windy day this is the one that becomes kite hours 1 and 2.',
  },
]

export const DESK_SLOT_BY_ID: Record<string, DeskSlot> = DESK_SLOTS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<string, DeskSlot>
)

export const DESK_SCHEDULED_H = DESK_SLOTS.reduce((s, b) => s + b.hours, 0)

// ── Kite: five hours, each with its own job ───────────────────────────────
// Hours 1-3 are a complete session on their own and run 17:00-20:00. Hours 4
// and 5 exist for the day the wind is actually on: they start the session at
// 15:00 instead, and they are paid for by trading the afternoon desk block.

export interface KiteHour {
  id: string
  /** Session position, not clock time — a five-hour day starts two hours earlier. */
  position: number
  label: string
  goal: string
  detail: string
  /** True for the three hours that run on an ordinary day. */
  base: boolean
}

export const KITE_HOURS: KiteHour[] = [
  {
    id: 'kite-h1',
    position: 1,
    label: 'Hour 1 — warm-up and baseline',
    goal: 'Rig, trim, and count.',
    detail:
      'Trim the bar properly before anything else, then ride ten minutes just holding upwind. Before you try anything new, log a baseline: how many of the target skill you land out of ten, cold. Without the cold number at the start you cannot tell at the end whether the session did anything.',
    base: true,
  },
  {
    id: 'kite-h2',
    position: 2,
    label: 'Hour 2 — the skill, good side',
    goal: 'One skill. Volume, not variety.',
    detail:
      'Take the single skill at the head of the drill ladder and give it the whole hour on your good side. Reps beat ambition in waist-deep flat water — this is the spot people cross a level in a week, and they do it by being boring.',
    base: true,
  },
  {
    id: 'kite-h3',
    position: 3,
    label: 'Hour 3 — the same skill, weak side',
    goal: 'The other side, to the same count.',
    detail:
      'A skill you only have on one side is half a skill, and the half you are missing is the one that will stop you two rungs up. Match the good-side count before you allow yourself anything else. This is the hour most people skip.',
    base: true,
  },
  {
    id: 'kite-h4',
    position: 4,
    label: 'Hour 4 — under load',
    goal: 'Same skill, harder conditions.',
    detail:
      'Repeat it tired, or overpowered, or on the smaller kite — whichever is honest today. A skill that only works fresh and perfectly powered is not yours yet. This hour is what turns last week into this week.',
    base: false,
  },
  {
    id: 'kite-h5',
    position: 5,
    label: 'Hour 5 — film, then free ride',
    goal: 'One filmed run, then ride for the joy of it.',
    detail:
      'Film a single run — you cannot fix a body position you have never seen. Then stop coaching yourself and go ride. Log the session afterwards: baseline count, ending count, and the one thing to take into tomorrow.',
    base: false,
  },
]

export const KITE_BASE_HOURS = KITE_HOURS.filter((h) => h.base).length
export const KITE_MAX_HOURS = KITE_HOURS.length

/** Clock for the kite session, given how many hours you intend to ride. */
export function kiteWindow(hours: number): string {
  const end = 20
  const start = Math.max(15, end - Math.max(1, Math.min(KITE_MAX_HOURS, hours)))
  return `${String(start).padStart(2, '0')}:00–20:00`
}

export const IRONMAN_HOUR = {
  id: 'ironman',
  window: '20:00–21:00',
  label: 'Run — 1h',
  detail:
    'Straight off the water, in the dusk. Run or swim per the Ironman tab; no bike until the 22nd. Head torch after 20:30.',
  hours: 1,
}

// ── The four days ─────────────────────────────────────────────────────────

export interface TripDay {
  date: string
  label: string
  theme: string
  /** The clear goal for the water, stated before you rig. */
  kiteIntent: string
  /** Where a day departs from the standard shape. */
  override?: { slotId: string; lane: TripLane; why: string }
}

export const TRIP_DAYS: TripDay[] = [
  {
    date: '2026-09-18',
    label: 'Fri 18 Sep',
    theme: 'Set the block: every lane gets its first unit today, or it will not get one at all.',
    kiteIntent: 'Establish the baseline. Pick the one skill the block is about and get an honest cold count of it.',
  },
  {
    date: '2026-09-19',
    label: 'Sat 19 Sep',
    theme: 'The deep day. Nothing is due, nobody is waiting — this is where the reproduction gets finished.',
    kiteIntent: 'Volume on the good side. Beat yesterday’s count by a number you decided in advance.',
  },
  {
    date: '2026-09-20',
    label: 'Sun 20 Sep',
    theme: 'Sunday — the paper feedback goes back, in one block, and the rest of the day is yours.',
    kiteIntent: 'Weak side, to the same count as the good side. Boring on purpose.',
    override: {
      slotId: 's3',
      lane: 'alamo',
      why: 'One block, two hours, and it is done. Feedback that takes four hours has stopped being feedback and started being a rewrite of their paper.',
    },
  },
  {
    date: '2026-09-21',
    label: 'Mon 21 Sep',
    theme: 'Close it: the claim written, the memo sent, the block’s one lesson named.',
    kiteIntent: 'Last water. Film one run, then name the single thing to take into the next trip.',
  },
]

export const TRIP_DAY_BY_DATE: Record<string, TripDay> = TRIP_DAYS.reduce(
  (acc, d) => ({ ...acc, [d.date]: d }),
  {} as Record<string, TripDay>
)

// ── Stored state ──────────────────────────────────────────────────────────

export interface SlotState {
  /** Traded lane, when the block was exchanged out of its default. */
  lane?: TripLane
  /** Written before the block starts. */
  goal?: string
  kpi?: string
  /** Written after. */
  result?: string
  /** Did the KPI land. */
  hit?: boolean
  done?: boolean
}

/** Persistence key for one item on one day. Trip-level items carry no date. */
export const tripKey = (date: string | null, itemId: string) => `${date ?? 'trip'}:${itemId}`

/** The lane a block is actually in today: traded, else the day's override, else the default. */
export function laneFor(date: string, slot: DeskSlot, state: SlotState | undefined): TripLane {
  // A lane stored before it was retired (the paper, the meetings) is no longer a
  // lane. Fall back to Open rather than rendering a block with no colour and no
  // name — the hours were still worked.
  if (state?.lane) return DESK_LANES.includes(state.lane) ? state.lane : 'open'
  const ov = TRIP_DAY_BY_DATE[date]?.override
  if (ov && ov.slotId === slot.id) return ov.lane
  return slot.defaultLane
}

export interface DayStanding {
  date: string
  /** Desk hours banked. */
  hours: number
  kiteHours: number
  /** Blocks with a goal written, out of four. */
  planned: number
  /** Blocks marked done whose KPI landed. */
  hits: number
  misses: number
  ironman: boolean
}

export function dayStanding(
  date: string,
  slots: Record<string, SlotState>,
  ticks: ReadonlySet<string>
): DayStanding {
  let hours = 0
  let planned = 0
  let hits = 0
  let misses = 0
  for (const slot of DESK_SLOTS) {
    const s = slots[tripKey(date, slot.id)]
    if (s?.goal?.trim()) planned += 1
    if (s?.done) {
      hours += slot.hours
      if (s.hit === true) hits += 1
      else if (s.hit === false) misses += 1
    }
  }
  const kiteHours = KITE_HOURS.filter((h) => ticks.has(tripKey(date, h.id))).length
  return { date, hours, kiteHours, planned, hits, misses, ironman: ticks.has(tripKey(date, IRONMAN_HOUR.id)) }
}

// ── Block goals ───────────────────────────────────────────────────────────

export interface TripGoal {
  id: string
  lane: TripLane
  label: string
  target: number
  unit: 'h' | '×'
  /** The outcome, stated so you would know if it happened. */
  headline: string
  detail: string
}

export const TRIP_GOALS: TripGoal[] = [
  {
    id: 'complexecon',
    lane: 'complexecon',
    label: 'CEcon',
    target: 8,
    unit: 'h',
    headline: 'One mechanism, owned end to end',
    detail:
      'By Monday: one published result reproduced from raw data, one assumption broken, and one falsifiable claim about a live market written down with a horizon and a number.',
  },
  {
    id: 'armstrong',
    lane: 'armstrong',
    label: 'Armstrong',
    target: 8,
    unit: 'h',
    headline: 'A house view, a hedge, and Dave’s three dashboard asks',
    detail:
      'The 6–24 month rates view written and priced into a hedge menu, the fundraise sequenced, and the first of Dave’s three dashboard asks actually shipped.',
  },
  {
    id: 'kite',
    lane: 'kite',
    label: 'Kite',
    target: 20,
    unit: 'h',
    headline: '12h base, 20h if every day goes to five',
    detail:
      'Three hours a day is the commitment (17:00–20:00). Five is the day you traded the afternoon block for wind. Twenty here is five NYC weeks of water in four days — that is what the block is for.',
  },
  {
    id: 'alamo',
    lane: 'alamo',
    label: 'AB paper',
    target: 1,
    unit: '×',
    headline: 'Feedback returned Sunday, in one block',
    detail:
      'Two hours is the cap, not the estimate. The block’s one external commitment, and the one most likely to quietly eat a day.',
  },
  {
    id: 'ironman',
    lane: 'ironman',
    label: 'Ironman',
    target: 4,
    unit: '×',
    headline: 'An hour a day, straight off the water',
    detail:
      'Run or swim per the Ironman tab, 20:00–21:00 in the dusk. No bike until the 22nd. Four hours here plus the hours either side of the block is how the standing six a week gets made.',
  },
]

export interface TripStanding {
  goal: TripGoal
  done: number
  pct: number
  /** Hours a day still needed to land it, over the days left. */
  paceNeeded: number | null
}

export function tripStandings(
  slots: Record<string, SlotState>,
  ticks: ReadonlySet<string>,
  today: string
): TripStanding[] {
  const deskHoursFor = (lane: TripLane) =>
    TRIP_DAYS.reduce(
      (sum, d) =>
        sum +
        DESK_SLOTS.reduce((s, slot) => {
          const st = slots[tripKey(d.date, slot.id)]
          return s + (st?.done && laneFor(d.date, slot, st) === lane ? slot.hours : 0)
        }, 0),
      0
    )

  const daysLeft = Math.max(1, TRIP_DAYS.filter((d) => d.date >= today).length)

  return TRIP_GOALS.map((goal) => {
    let done = 0
    if (goal.lane === 'kite') {
      done = TRIP_DAYS.reduce(
        (s, d) => s + KITE_HOURS.filter((h) => ticks.has(tripKey(d.date, h.id))).length,
        0
      )
    } else if (goal.lane === 'ironman') {
      done = TRIP_DAYS.filter((d) => ticks.has(tripKey(d.date, IRONMAN_HOUR.id))).length
    } else if (goal.unit === 'h') {
      done = deskHoursFor(goal.lane)
    } else {
      // A count goal served by desk blocks — one block sat is the whole target.
      done = Math.min(goal.target, deskHoursFor(goal.lane) > 0 ? 1 : 0)
    }
    const remaining = Math.max(0, goal.target - done)
    return {
      goal,
      done,
      pct: Math.min(1, done / goal.target),
      paceNeeded: remaining > 0 ? remaining / daysLeft : null,
    }
  })
}

// ── The goal bank ─────────────────────────────────────────────────────────
// Prewritten units, in the order they should be taken. Dropping one into a
// block fills its goal and KPI; both stay editable. The ladder is the point:
// an unfinished unit stays at the head of the queue rather than being
// rewritten every morning into something easier.

export interface BankUnit {
  id: string
  lane: TripLane
  goal: string
  kpi: string
}

export const GOAL_BANK: BankUnit[] = [
  // Complexity economics — the reproduction ladder.
  {
    id: 'ce-1',
    lane: 'complexecon',
    goal: 'Name the mechanism, not the field',
    kpi: 'One paragraph: the mechanism, the observable it predicts, and the observation that would falsify it. If it cannot be falsified it is not the block’s question.',
  },
  {
    id: 'ce-2',
    lane: 'complexecon',
    goal: 'Three skims, one pick',
    kpi: 'Three papers skimmed only to choose one with a result reproducible on data you can actually get. Output: the chosen paper, its data source, and one line on why each of the other two lost.',
  },
  {
    id: 'ce-3',
    lane: 'complexecon',
    goal: 'Reproduce the core result',
    kpi: 'Their headline number or figure regenerated end to end from raw data, with the diff against the published value stated. A near-miss you can explain counts; a match you cannot explain does not.',
  },
  {
    id: 'ce-4',
    lane: 'complexecon',
    goal: 'Break it',
    kpi: 'One assumption perturbed — the sample, the calibration, the interaction structure. Report the result under the perturbation and one sentence on why it moved or held.',
  },
  {
    id: 'ce-5',
    lane: 'complexecon',
    goal: 'Turn it into a claim with a number',
    kpi: 'One falsifiable claim about a live market: direction, magnitude, horizon, and the data that settles it. Written into the research ledger, dated.',
  },
  {
    id: 'ce-6',
    lane: 'complexecon',
    goal: 'Write the 500 words',
    kpi: 'A memo a stranger could act on: mechanism, reproduction, break, claim. This is the artefact the Abu Dhabi lane is built from, not a summary of what you read.',
  },

  // Armstrong — strategy first, because the rates view is time-sensitive.
  {
    id: 'arm-1',
    lane: 'armstrong',
    goal: 'STRATEGY — the 6–24 month view, written',
    kpi: 'Three scenarios with probabilities that sum to one, each with the single indicator that would move it, and what each does to the book. One page. Without this the hedge is a guess.',
  },
  {
    id: 'arm-2',
    lane: 'armstrong',
    goal: 'STRATEGY — hedge menu, priced',
    kpi: 'Three structures costed: cost as % of NAV, payoff at two scenario points, and the carry to hold six months. Include the LEAPS that survive a hiking path, and say which do not.',
  },
  {
    id: 'arm-3',
    lane: 'armstrong',
    goal: 'STRATEGY — the decision memo for Dave',
    kpi: 'One recommendation with a size and the trigger that puts it on. A menu is not a decision; Dave should be able to say yes or no to a sentence.',
  },
  {
    id: 'arm-4',
    lane: 'armstrong',
    goal: 'TECHNOLOGY — prediction-market signals',
    kpi: 'Every market we care about mapped to its prediction-market contract, last price on the dashboard, anything older than 24h flagged stale. Coverage stated as n of n, not "mostly".',
  },
  {
    id: 'arm-5',
    lane: 'armstrong',
    goal: 'TECHNOLOGY — thesis themes per ticker from IBKR',
    kpi: 'Every IBKR position carries a one-line thesis and a theme tag; positions with no thesis surface as their own list. The list of untagged positions is the deliverable, not an error state.',
  },
  {
    id: 'arm-6',
    lane: 'armstrong',
    goal: 'TECHNOLOGY — target allocation recommendation',
    kpi: 'A daily recommendation: target weights from risk, correlation and factor exposure, shown as a diff against the current book. Run it by hand each morning for Dave until the parameters stop changing, then automate it — the manual runs are how the prompt gets built.',
  },
  {
    id: 'arm-7',
    lane: 'armstrong',
    goal: 'CAPITAL — the fundraise, sequenced',
    kpi: 'Target size, vehicle, minimum viable close, and twenty names ranked by warmth with the first five asks dated. A plan without dated asks is a wish.',
  },
  {
    id: 'arm-8',
    lane: 'armstrong',
    goal: 'CAPITAL — the one-pager you would send cold',
    kpi: 'Strategy, track record, terms, and the ask on one page. Test: you would send it to the coldest name on the list today without apologising for it.',
  },

  {
    id: 'ab-1',
    lane: 'alamo',
    goal: 'Paper feedback, returned',
    kpi: 'Comments back to the authors inside two hours: the three things that would change a reader’s mind, ranked, and one paragraph on what the paper claims versus what it shows. At the two-hour mark you send what you have.',
  },
]

export const bankFor = (lane: TripLane) => GOAL_BANK.filter((u) => u.lane === lane)

// ── The debrief ───────────────────────────────────────────────────────────
// Rules, not encouragement. Every line is computed from what was actually
// ticked, and the ones that sting are the ones worth printing.

export type DebriefTone = 'good' | 'warn' | 'flat'

export interface DebriefLine {
  tone: DebriefTone
  text: string
}

const h = (n: number) => (n % 1 === 0 ? `${n}h` : `${n.toFixed(1)}h`)

export function debrief(
  date: string,
  slots: Record<string, SlotState>,
  ticks: ReadonlySet<string>,
  standings: TripStanding[]
): DebriefLine[] {
  const day = dayStanding(date, slots, ticks)
  const lines: DebriefLine[] = []

  // The floor.
  if (day.hours >= DAILY_STRETCH_H) {
    lines.push({ tone: 'good', text: `${h(day.hours)} of desk work — past the stretch. This is the day to repeat, not the day to celebrate.` })
  } else if (day.hours >= DAILY_FLOOR_H) {
    lines.push({ tone: 'good', text: `${h(day.hours)} banked — floor cleared, ${h(DAILY_STRETCH_H - day.hours)} short of the stretch.` })
  } else {
    lines.push({ tone: 'warn', text: `${h(day.hours)} banked — ${h(DAILY_FLOOR_H - day.hours)} under the floor. One more block closes it.` })
  }

  // Planning discipline, which is the whole point of the sheet.
  const unplanned = DESK_SLOTS.length - day.planned
  if (unplanned > 0) {
    lines.push({
      tone: 'warn',
      text: `${unplanned} of ${DESK_SLOTS.length} blocks have no goal written. A block without a stated outcome is the one that disappears.`,
    })
  }
  if (day.misses > 0) {
    lines.push({
      tone: 'flat',
      text: `${day.misses} KPI${day.misses > 1 ? 's' : ''} missed against ${day.hits} hit. A miss you wrote down is data; the block was still worth sitting.`,
    })
  } else if (day.hits >= 3) {
    lines.push({ tone: 'good', text: `${day.hits} KPIs landed. If they are all landing, they are not sized right — make tomorrow’s harder.` })
  }

  // Water.
  if (day.kiteHours >= KITE_MAX_HOURS) {
    lines.push({ tone: 'good', text: `${day.kiteHours} hours on the water — the full five. The afternoon block was well traded.` })
  } else if (day.kiteHours >= KITE_BASE_HOURS) {
    lines.push({ tone: 'good', text: `${day.kiteHours} hours on the water, base session complete.` })
  } else if (day.kiteHours > 0) {
    lines.push({ tone: 'flat', text: `${day.kiteHours} of ${KITE_BASE_HOURS} base kite hours. Wind, light, or the day got away — say which in the block notes.` })
  }

  // The one commitment with someone else's clock on it, and the one most able
  // to take a whole day if nobody says stop.
  const paperH = DESK_SLOTS.reduce((sum, slot) => {
    const st = slots[tripKey(date, slot.id)]
    return sum + (st?.done && laneFor(date, slot, st) === 'alamo' ? slot.hours : 0)
  }, 0)
  if (paperH > 2) {
    lines.push({
      tone: 'warn',
      text: `The paper took ${h(paperH)} against a two-hour cap. That is a block borrowed from your own work — note what it bought.`,
    })
  }

  if (!day.ironman) {
    lines.push({ tone: 'flat', text: 'The hour after the water is unticked. It is the cheapest hour of the day to keep and the easiest to lose.' })
  }

  // Are the block goals actually moving.
  for (const s of standings) {
    if (s.paceNeeded === null) {
      lines.push({ tone: 'good', text: `${s.goal.label}: done — ${s.goal.headline.toLowerCase()}.` })
      continue
    }
    const daysLeft = TRIP_DAYS.filter((d) => d.date >= date).length
    const unit = s.goal.unit === 'h' ? h(s.paceNeeded) : `${Math.ceil(s.paceNeeded)}`
    if (daysLeft <= 1) {
      lines.push({ tone: 'warn', text: `${s.goal.label}: ${s.goal.target - s.done} short with the block ending. It ends where it ends — decide now whether it carries or dies.` })
    } else {
      lines.push({
        tone: s.pct >= (TRIP_DAYS.length - daysLeft + 1) / TRIP_DAYS.length ? 'good' : 'warn',
        text: `${s.goal.label}: ${s.goal.unit === 'h' ? h(s.done) : s.done} of ${s.goal.unit === 'h' ? h(s.goal.target) : s.goal.target} — needs ${unit}${s.goal.unit === 'h' ? '/day' : ' more'} across the ${daysLeft} days left.`,
      })
    }
  }

  return lines
}

/** Tomorrow's date inside the block, if there is one. */
export function nextTripDate(date: string): string | null {
  const i = TRIP_DAYS.findIndex((d) => d.date === date)
  return i >= 0 && i < TRIP_DAYS.length - 1 ? TRIP_DAYS[i + 1].date : null
}

/** How much of tomorrow is already written. */
export function tomorrowReadiness(date: string, slots: Record<string, SlotState>): { date: string; planned: number; total: number } | null {
  const next = nextTripDate(date)
  if (!next) return null
  const planned = DESK_SLOTS.filter((s) => slots[tripKey(next, s.id)]?.goal?.trim()).length
  return { date: next, planned, total: DESK_SLOTS.length }
}

export function tripDayNumber(date: string): number | null {
  const i = TRIP_DAYS.findIndex((d) => d.date === date)
  return i === -1 ? null : i + 1
}

/**
 * Live from the eve of the block until the day after it ends. The eve matters:
 * the four goals for the first morning get written the night before, and a
 * sheet that only appears on day one is a sheet that misses its own first day.
 */
export function tripIsLive(date: string): boolean {
  return date >= addDay(SVENCELE_START, -1) && date <= addDay(SVENCELE_END, 1)
}

function addDay(date: string, n: number): string {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
