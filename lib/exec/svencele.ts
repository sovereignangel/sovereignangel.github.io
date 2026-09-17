/**
 * The Svencele block — Thursday 17 to Monday 21 September.
 *
 * Five days with a fixed shape: the wind windows are booked, so everything
 * else is cut to fit around them rather than the other way round. The point
 * of writing the days out here instead of leaving them to the daily orders is
 * that a short block is won or lost on the first morning — if the ladder is
 * not already standing when you arrive, two of the five days go to deciding
 * what the block is for.
 *
 * The windows below are the committed ones, not the forecast's. /exec still
 * reads the live wind and will disagree on a flat day; when it does, the
 * forecast is right about the water and this sheet is right about the hours —
 * the hours move to another spot, they do not evaporate.
 */

export const SVENCELE_START = '2026-09-17'
export const SVENCELE_END = '2026-09-21'

/** Lanes the block spends hours in. Four are the usual /exec lanes; Dave is local to the trip. */
export type TripLane = 'kite' | 'complexecon' | 'armstrong' | 'ironman' | 'alamo' | 'dave'

export const TRIP_LANE_COLOR: Record<TripLane, string> = {
  kite: '#1a8a8f',
  complexecon: '#2d4a6f',
  armstrong: '#7a5a2e',
  ironman: '#8f2d33',
  alamo: '#8c2d2d',
  dave: '#6b4a72',
}

export const TRIP_LANE_LABEL: Record<TripLane, string> = {
  kite: 'Kite',
  complexecon: 'CEcon',
  armstrong: 'Armstrong',
  ironman: 'Ironman',
  alamo: 'Alamo Bernal',
  dave: 'Dave',
}

export interface TripItem {
  /** Unique within its day. Persisted as `${date}:${id}`. */
  id: string
  lane: TripLane
  /** Clock window in Palanga time, or null for an item that floats in the day. */
  window: string | null
  label: string
  detail: string
  /** Hours this item banks toward its lane's goal when it is ticked. */
  hours: number
}

export interface TripDay {
  date: string
  label: string
  /** What the day is for in one line — the thing you would say out loud on the drive. */
  theme: string
  /** The clear goal for the day's water time. A day on the water without one is a day of laps. */
  kiteIntent: string
  items: TripItem[]
}

const deep = (id: string, lane: TripLane, window: string, label: string, detail: string, hours = 2): TripItem => ({
  id, lane, window, label, detail, hours,
})

const kite = (id: string, window: string, label: string, detail: string): TripItem => ({
  id, lane: 'kite', window, label, detail, hours: 2,
})

const swimOrRun = (window: string, detail: string): TripItem => ({
  id: 'ironman',
  lane: 'ironman',
  window,
  label: 'Run or swim — 1h',
  detail,
  hours: 1,
})

export const TRIP_DAYS: TripDay[] = [
  {
    date: '2026-09-17',
    label: 'Thu 17 Sep',
    theme: 'Land, rig, and get the block standing before the first session.',
    kiteIntent: 'Re-familiarisation. Nothing new — trim, body position, upwind, and finish every run above where you started.',
    items: [
      deep('cecon-1', 'complexecon', '09:30–11:30', 'CEcon — write the plan', 'The one deliverable of day one: what the research lane is, the first question, and what the first artefact looks like. Ends in a note, not a reading list.'),
      swimOrRun('12:00–13:00', 'Whatever the Ironman tab says for today. No bike until the 22nd — run or swim substitutes at equal duration.'),
      deep('armstrong', 'armstrong', '14:00–16:00', 'Armstrong — head of the ladder', 'Whatever the campaign ladder has at the front. One object for the block.'),
      kite('kite-1', '16:00–18:00', 'Kite — session I', 'First water of the block. Rig early, ride long.'),
      kite('kite-2', '18:00–20:00', 'Kite — session II', 'Second session after a 30-minute break. Ride until sunset.'),
    ],
  },
  {
    date: '2026-09-18',
    label: 'Fri 18 Sep',
    theme: 'The full shape of a Svencele day, run once properly.',
    kiteIntent: 'One skill, all session. Take the head of the drill ladder and give it both windows rather than sampling three things.',
    items: [
      swimOrRun('08:00–09:00', 'Before the day starts eating itself. Run or swim per the Ironman tab.'),
      deep('cecon-1', 'complexecon', '09:15–11:15', 'CEcon — research', 'Reading and reproduction against the plan written yesterday. Ends in a note someone else could use.'),
      kite('kite-1', '12:00–14:00', 'Kite — midday window', 'Midday session, stated goal above.'),
      deep('armstrong', 'armstrong', '14:45–16:45', 'Armstrong — deep block', 'The hardest thing on the board, taken first.'),
      deep('cecon-2', 'complexecon', '17:00–18:00', 'CEcon — tinkering', 'The instrument rather than the paper: code, data, the thing that makes tomorrow cheaper.', 1),
      kite('kite-2', '18:00–20:00', 'Kite — evening window', 'Evening session to sunset.'),
    ],
  },
  {
    date: '2026-09-19',
    label: 'Sat 19 Sep',
    theme: 'Mid-block. The day the plan either compounds or quietly slips.',
    kiteIntent: 'Same skill as yesterday, both sides. A skill you only have on your good side is half a skill.',
    items: [
      swimOrRun('08:00–09:00', 'Run or swim per the Ironman tab.'),
      deep('cecon-1', 'complexecon', '09:15–11:15', 'CEcon — research', 'Second research block against the plan. By the end of today there should be a draft artefact, however rough.'),
      kite('kite-1', '12:00–14:00', 'Kite — midday window', 'Midday session, stated goal above.'),
      deep('armstrong', 'armstrong', '14:45–16:45', 'Armstrong — deep block', 'Next unit on the ladder.'),
      deep('cecon-2', 'complexecon', '17:00–18:00', 'CEcon — tinkering', 'Instrument work.', 1),
      kite('kite-2', '18:00–20:00', 'Kite — evening window', 'Evening session to sunset.'),
    ],
  },
  {
    date: '2026-09-20',
    label: 'Sun 20 Sep',
    theme: 'Sunday — the paper feedback goes out, whatever else happens.',
    kiteIntent: 'Consolidation. Volume on what now half-works, so it is boring by the time you leave.',
    items: [
      swimOrRun('08:00–09:00', 'Run or swim per the Ironman tab.'),
      deep('cecon-1', 'complexecon', '09:15–11:15', 'CEcon — research', 'Third research block. Push the draft artefact toward something sendable.'),
      kite('kite-1', '12:00–14:00', 'Kite — midday window', 'Midday session, stated goal above.'),
      deep('alamo', 'alamo', '14:45–16:45', 'Alamo Bernal — paper feedback', 'The one dated commitment of the block. It takes the Armstrong slot today rather than being squeezed in after dinner.'),
      deep('cecon-2', 'complexecon', '17:00–18:00', 'CEcon — tinkering', 'Instrument work.', 1),
      kite('kite-2', '18:00–20:00', 'Kite — evening window', 'Evening session to sunset.'),
    ],
  },
  {
    date: '2026-09-21',
    label: 'Mon 21 Sep',
    theme: 'Morning water, afternoon desk, and the block written up before it ends.',
    kiteIntent: 'Last water of the block. Film one run, then name the single thing to take into the next trip.',
    items: [
      kite('kite-1', '08:00–10:00', 'Kite — session I', 'Early window — the whole morning is booked for water.'),
      kite('kite-2', '10:00–12:00', 'Kite — session II', 'Second half of the morning, 30-minute break between.'),
      swimOrRun('13:00–14:00', 'Run or swim per the Ironman tab. The bike comes back from the 22nd.'),
      deep('cecon-1', 'complexecon', '14:00–16:00', 'CEcon — research', 'Close the loop: the artefact, and what the next two weeks of the lane are.'),
      deep('armstrong', 'armstrong', '16:30–18:30', 'Armstrong — deep block', 'Last unit of the block.'),
      deep('cecon-2', 'complexecon', '19:00–20:00', 'Block write-up', 'Twenty minutes on what the five days actually produced, and what the next block inherits.', 1),
    ],
  },
]

/**
 * The two Dave sessions. They sit outside the day grid on purpose — the
 * dates move with his week, the commitment does not.
 */
export const TRIP_MEETINGS: TripItem[] = [
  {
    id: 'dave-1',
    lane: 'dave',
    window: null,
    label: 'Dave I — tooling',
    detail: 'Gear and setup audit. Leave with the tooling upgraded, not with a list of what to buy later.',
    hours: 0,
  },
  {
    id: 'dave-2',
    lane: 'dave',
    window: null,
    label: 'Dave II — plans',
    detail: 'What the next block of progression is, in his words, written down before you leave.',
    hours: 0,
  },
]

export interface TripGoal {
  id: string
  lane: TripLane
  label: string
  /** Hours, or a count of things done. */
  target: number
  unit: 'h' | '×'
  detail: string
}

export const TRIP_GOALS: TripGoal[] = [
  { id: 'kite',        lane: 'kite',        label: 'Kite',      target: 20, unit: 'h', detail: 'Twenty hours on the water with a stated goal every day.' },
  { id: 'dave',        lane: 'dave',        label: 'Dave',      target: 2,  unit: '×', detail: 'Two sessions: tooling upgraded, next block of plans set.' },
  { id: 'complexecon', lane: 'complexecon', label: 'CEcon',     target: 10, unit: 'h', detail: 'Two hours a day is the floor — plan established, then executed against.' },
  { id: 'armstrong',   lane: 'armstrong',   label: 'Armstrong', target: 8,  unit: 'h', detail: 'The ladder keeps moving while the block is away.' },
  { id: 'ironman',     lane: 'ironman',     label: 'Ironman',   target: 5,  unit: '×', detail: 'An hour of running or swimming every day. No bike until the 22nd.' },
  { id: 'alamo',       lane: 'alamo',       label: 'AB paper',  target: 1,  unit: '×', detail: 'Sunday. Feedback returned.' },
]

export const TRIP_DAY_BY_DATE: Record<string, TripDay> = TRIP_DAYS.reduce(
  (acc, d) => ({ ...acc, [d.date]: d }),
  {} as Record<string, TripDay>
)

/** Persistence key for one item on one day. Trip-level items carry no date. */
export const tripKey = (date: string | null, itemId: string) => `${date ?? 'trip'}:${itemId}`

export interface TripStanding {
  goal: TripGoal
  /** Hours banked, or things done. */
  done: number
  /** Everything the sheet has scheduled for that lane across the block. */
  scheduled: number
  pct: number
}

/** Where each goal stands, given the set of ticked keys. */
export function tripStandings(doneKeys: ReadonlySet<string>): TripStanding[] {
  return TRIP_GOALS.map((goal) => {
    const all: { key: string; item: TripItem }[] = [
      ...TRIP_DAYS.flatMap((d) => d.items.map((item) => ({ key: tripKey(d.date, item.id), item }))),
      ...TRIP_MEETINGS.map((item) => ({ key: tripKey(null, item.id), item })),
    ].filter(({ item }) => item.lane === goal.lane)

    const amount = (item: TripItem) => (goal.unit === 'h' ? item.hours : 1)
    const scheduled = all.reduce((s, { item }) => s + amount(item), 0)
    const done = all.reduce((s, { key, item }) => s + (doneKeys.has(key) ? amount(item) : 0), 0)

    return { goal, done, scheduled, pct: Math.min(1, done / goal.target) }
  })
}

/** Day index within the block, 1-based. Null before it starts or after it ends. */
export function tripDayNumber(date: string): number | null {
  const i = TRIP_DAYS.findIndex((d) => d.date === date)
  return i === -1 ? null : i + 1
}

/** The sheet is live from the day it starts until the day after it ends. */
export function tripIsLive(date: string): boolean {
  return date >= SVENCELE_START && date <= addDay(SVENCELE_END)
}

function addDay(date: string): string {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
