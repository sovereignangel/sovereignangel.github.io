/**
 * Travel calendar — Oct 2026 → Dec 2027.
 *
 * One typed plan: segments in time order, the forks (decisions still open)
 * that pick between them, and a rough cost line-up for each. Everything here
 * is an estimate in USD for a solo, mid-range traveler unless a line says
 * otherwise. Edit this file to move a date, resolve a fork, or correct a number;
 * the page derives the timeline, the scenario totals and the open-questions
 * list from it.
 *
 * Status vocabulary — keep it honest:
 *   fixed    dates set by an outside commitment (a program, a race, a ticket)
 *   planned  decided in intent, nothing booked, nothing open
 *   pending  at least one decision still open — always shown as such
 *   tbd      nothing decided
 */

export type Status = 'fixed' | 'planned' | 'pending' | 'tbd'

export type ForkId = 'birthday' | 'decDest' | 'oxford' | 'maui' | 'afterAD' | 'winter' | 'summer'

export interface CostLine {
  label: string
  low: number
  high: number
  note?: string
  /** Monthly rate, multiplied by the segment's length in months */
  perMonth?: boolean
  /** NYC rent — dropped from segments when a lease is held year-round (it becomes one fixed line instead) */
  nycRent?: boolean
}

export interface Segment {
  id: string
  start: string // YYYY-MM-DD, inclusive
  end: string // YYYY-MM-DD, inclusive
  title: string
  /** Label for the timeline bar, where the title will not fit */
  short?: string
  place: string
  status: Status
  /** 0 = the path, 1 = a trip inside a block. Alternatives not chosen are packed separately. */
  lane: 0 | 1
  /** Present when this segment is one option of a fork */
  fork?: { id: ForkId; option: string }
  summary: string
  notes?: string[]
  /** What is still undecided — surfaced on the card and in the roll-up */
  open?: string[]
  cost: CostLine[]
  /** When true the start date follows the end of whatever the afterAD fork chose */
  followsAfterAD?: boolean
  /** Dates are a placeholder, not a plan */
  datesSoft?: boolean
}

export interface ForkOption {
  id: string
  label: string
  detail?: string
}

export interface Fork {
  id: ForkId
  label: string
  window: string
  question: string
  options: ForkOption[]
  default: string
}

export type ForkState = Record<ForkId, string>

// ── Assumptions ─────────────────────────────────────────────────────────

/** NYC, per month. Rent is a one-bedroom or a furnished sublet; living is food, transit, gym, going out. */
export const NYC = {
  rent: { low: 3500, high: 5000 },
  living: { low: 2000, high: 3000 },
}

export const RANGE_START = '2026-10-01'
export const RANGE_END = '2027-12-31'
export const DEPARTURE = '2026-10-23'

/** Months between departure and the end of the range — the lease line when one is held year-round */
export const LEASE_MONTHS = 14.3

const NYC_LINES: CostLine[] = [
  { label: 'Rent, per month', low: NYC.rent.low, high: NYC.rent.high, perMonth: true, nycRent: true, note: 'sublet or lease' },
  { label: 'Living, per month', low: NYC.living.low, high: NYC.living.high, perMonth: true },
]

// ── Forks: the decisions still open ─────────────────────────────────────

export const FORKS: Fork[] = [
  {
    id: 'birthday',
    label: "Mom's 60th",
    window: 'Oct 23 – 27',
    question: 'Panama or LA?',
    options: [
      { id: 'panama', label: 'Panama', detail: 'a gift trip; her flight is the swing cost' },
      { id: 'la', label: 'Los Angeles', detail: 'cheaper and simpler if family is there' },
    ],
    default: 'panama',
  },
  {
    id: 'decDest',
    label: 'Nov 22 → Jan 3',
    window: 'six weeks',
    question: 'Stay in Brazil, or back to NYC?',
    options: [
      { id: 'brazil', label: 'Stay in Brazil', detail: 'Ceará wind season runs to January' },
      { id: 'nyc', label: 'Back to NYC', detail: 'the "otherwise" in your note' },
    ],
    default: 'nyc',
  },
  {
    id: 'oxford',
    label: 'Oxford in December',
    window: 'early – mid Dec',
    question: 'The roadmap has you presenting the draft at Oxford. Is that a trip?',
    options: [
      { id: 'include', label: 'Yes, go', detail: 'from the CEcon roadmap, not your list' },
      { id: 'skip', label: 'Not a trip' },
    ],
    default: 'include',
  },
  {
    id: 'maui',
    label: 'Christmas',
    window: 'Dec 23 – 27',
    question: 'Maui with family?',
    options: [
      { id: 'skip', label: 'Skip', detail: 'stay wherever the December fork puts you' },
      { id: 'solo', label: 'Maui, just you' },
      { id: 'family', label: 'Maui + Mom & Grandma', detail: 'adds their flights' },
    ],
    default: 'skip',
  },
  {
    id: 'afterAD',
    label: 'After Abu Dhabi',
    window: 'from Jan 15',
    question: 'Gulf tour, MIT IAP, or a week of each?',
    options: [
      { id: 'gulf1', label: 'Gulf, one week', detail: 'Oman + Qatar' },
      { id: 'gulf3', label: 'Gulf loop + Socotra', detail: 'three weeks; adds Saudi, Bahrain, Kuwait' },
      { id: 'iap', label: 'MIT IAP', detail: 'Jan 16 – 29, the second half' },
      { id: 'gulfIap', label: 'Gulf week, then IAP', detail: "IAP's last week only" },
    ],
    default: 'gulf1',
  },
  {
    id: 'winter',
    label: 'Late Jan → Apr 15',
    window: '~12 weeks',
    question: 'NYC, or Puerto Rico to fundraise?',
    options: [
      { id: 'nyc', label: 'NYC', detail: 'not the most ideal place to be, in your words' },
      { id: 'pr', label: 'Puerto Rico', detail: 'San Juan base, raise from the Act 60 crowd' },
    ],
    default: 'nyc',
  },
  {
    id: 'summer',
    label: 'Summer 2027',
    window: 'Jul 4 – Sep 2',
    question: 'Lithuania with Aidas, or the islands on their own?',
    options: [
      { id: 'lt', label: 'Lithuania + Mallorca + Tenerife', detail: 'if you are still together' },
      { id: 'islands', label: 'Mallorca + Tenerife, then NYC', detail: 'four weeks of islands' },
    ],
    default: 'lt',
  },
]

export const DEFAULT_FORKS: ForkState = FORKS.reduce((acc, f) => {
  acc[f.id] = f.default
  return acc
}, {} as ForkState)

// ── Segments ────────────────────────────────────────────────────────────

export const SEGMENTS: Segment[] = [
  // Oct 23 – 27 · Mom's 60th ------------------------------------------------
  {
    id: 'birthday-panama',
    short: '60th · Panama',
    start: '2026-10-23',
    end: '2026-10-27',
    title: "Mom's 60th — Panama",
    place: 'Panama City · Pacific coast or Bocas',
    status: 'pending',
    lane: 0,
    fork: { id: 'birthday', option: 'panama' },
    summary: 'Five days around the 60th itself, which falls on Monday Oct 26.',
    notes: [
      'Copa flies direct from Panama City to Guatemala City, San Pedro Sula, Managua and Belize City, so the Central America leg starts cleanly from here.',
    ],
    open: ['Panama or LA — this is the fork.', "Where Mom (and Grandma?) fly from; the flight line assumes the US West Coast."],
    cost: [
      { label: 'Your flight NYC → Panama City, one way', low: 250, high: 450 },
      { label: "Mom's flight, round trip", low: 400, high: 800, note: 'adjust for her home airport' },
      { label: 'Lodging, 4 nights, two rooms', low: 600, high: 1400 },
      { label: 'Birthday dinner, days out, transfers', low: 500, high: 1000 },
    ],
  },
  {
    id: 'birthday-la',
    short: '60th · LA',
    start: '2026-10-23',
    end: '2026-10-27',
    title: "Mom's 60th — Los Angeles",
    place: 'Los Angeles',
    status: 'pending',
    lane: 0,
    fork: { id: 'birthday', option: 'la' },
    summary: 'Five days around the 60th itself, which falls on Monday Oct 26.',
    notes: ['Nonstops from LAX to Guatemala City and Belize City for the leg after.'],
    open: ['Panama or LA — this is the fork.', 'Staying with family or a hotel; the lodging line spans both.'],
    cost: [
      { label: 'Your flight NYC → LAX, one way', low: 200, high: 400 },
      { label: 'Lodging, 4 nights', low: 0, high: 800, note: 'family, or a hotel' },
      { label: 'Car', low: 150, high: 300 },
      { label: 'Birthday dinner, celebration, days out', low: 500, high: 1200 },
    ],
  },

  // Oct 27 – Nov 2 · Central America ----------------------------------------
  {
    id: 'central-america',
    short: 'C. America',
    start: '2026-10-27',
    end: '2026-11-02',
    title: 'Central America',
    place: 'Belize · Guatemala · Honduras · Nicaragua, ideally',
    status: 'pending',
    lane: 0,
    summary: 'Six nights between the birthday and Costa Rica. Four countries is the wish; two is the realistic count.',
    notes: [
      'Land borders eat half a day each. Regional flights (TAG, Avianca, Copa) cost more and give the days back.',
      'Pairings that work in six nights: Guatemala (Antigua, Atitlán) + Belize (cayes), or Nicaragua (Granada, Ometepe) + the Honduran Bay Islands for diving.',
      'Managua and San Pedro Sula both have short direct flights into San José for Nov 2.',
    ],
    open: [
      'Which two (or stretch the window). Four countries in six nights is one to two nights each.',
      'Ideally is your word — this leg is soft until the pair is picked.',
    ],
    cost: [
      { label: 'Flight in from Panama or LA', low: 200, high: 500 },
      { label: 'Between countries: shuttles, one or two regional flights', low: 150, high: 450 },
      { label: 'Lodging, 6 nights', low: 360, high: 900 },
      { label: 'Food, guides, diving or the lake', low: 300, high: 700 },
      { label: 'Flight to San José', low: 120, high: 300 },
    ],
  },

  // Nov 2 – 15 · Costa Rica ---------------------------------------------------
  {
    id: 'costa-rica',
    short: 'Costa Rica',
    start: '2026-11-02',
    end: '2026-11-15',
    title: 'Costa Rica',
    place: 'Pacific coast · Arenal · Caribbean side',
    status: 'planned',
    lane: 0,
    summary: 'Two weeks. Decided in intent; nothing booked.',
    notes: [
      'Early November is the tail of the green season on the Pacific side; the Caribbean side (Puerto Viejo) is at its driest Sep–Nov.',
      'Bahía Salinas, the kite spot, opens late Nov / Dec — early for wind, but the first fronts sometimes land in this window.',
    ],
    cost: [
      { label: 'Lodging, 13 nights', low: 780, high: 2000 },
      { label: 'Food', low: 400, high: 800 },
      { label: 'Rental car, or shuttles', low: 250, high: 900 },
      { label: 'Surf, Arenal, Nicoya, kite', low: 300, high: 700 },
    ],
  },

  // Nov 16 – 22 · Brazil ------------------------------------------------------
  {
    id: 'brazil',
    short: 'Brazil',
    start: '2026-11-16',
    end: '2026-11-22',
    title: 'Brazil',
    place: 'Rio, São Paulo, Floripa, or Ceará for the wind',
    status: 'planned',
    lane: 0,
    summary: 'One week as listed. The December fork decides whether it turns into six more.',
    notes: [
      'Ceará (Cumbuco, Jericoacoara, Preá) is in full wind season through January — the strongest case for staying.',
      'Copa via Panama City or Avianca via Bogotá are the usual SJO → Brazil routings; Fortaleza is reachable via GRU or Lisbon.',
    ],
    open: ['Which Brazil — city, or the Ceará coast?'],
    cost: [
      { label: 'Flight San José → São Paulo or Fortaleza', low: 450, high: 900 },
      { label: 'Lodging, 6 nights', low: 420, high: 1000 },
      { label: 'Food, transport, activities', low: 300, high: 600 },
    ],
  },

  // Nov 22 → Jan 2 · the December fork -------------------------------------
  {
    id: 'dec-brazil',
    short: 'Brazil, ext.',
    start: '2026-11-22',
    end: '2027-01-02',
    title: 'Brazil, extended',
    place: 'A monthly rental — Ceará coast or Rio',
    status: 'pending',
    lane: 0,
    fork: { id: 'decDest', option: 'brazil' },
    summary: 'Six weeks through New Year, flying to Abu Dhabi from São Paulo on Jan 2.',
    notes: [
      'Lodging spikes Dec 26 – Jan 2 everywhere on the coast; book that week early or leave it before.',
      'Etihad flies São Paulo → Abu Dhabi direct, about 14 hours, so the Jan 3 arrival is clean.',
      'This choice makes Maui a round-the-world detour and Oxford a 12-hour flight each way.',
    ],
    open: ['Maybe, in your words. Decides Maui and the Oxford routing.'],
    cost: [
      { label: 'Monthly rental, ~6 weeks', low: 1700, high: 3500 },
      { label: 'Living', low: 900, high: 1800 },
      { label: 'Kite, transport, New Year', low: 400, high: 1000 },
    ],
  },
  {
    id: 'dec-nyc',
    short: 'NYC',
    start: '2026-11-22',
    end: '2027-01-02',
    title: 'NYC through the holidays',
    place: 'New York',
    status: 'pending',
    lane: 0,
    fork: { id: 'decDest', option: 'nyc' },
    summary: 'Home for six weeks; Oxford and Maui are each a direct flight from here.',
    open: ['The "otherwise" — chosen only if Brazil is not extended.'],
    cost: [{ label: 'Flight Brazil → NYC', low: 450, high: 900 }, ...NYC_LINES],
  },

  // December · Oxford (from the roadmap) --------------------------------------
  {
    id: 'oxford',
    short: 'Oxford',
    start: '2026-12-07',
    end: '2026-12-12',
    title: 'Oxford — present the draft',
    place: 'Oxford · Smith School',
    status: 'pending',
    lane: 1,
    fork: { id: 'oxford', option: 'include' },
    datesSoft: true,
    summary: 'Not on your list. The CEcon roadmap has the paper draft due Dec 5 and presented in person at Oxford, with supervisor meetings.',
    notes: ['Dates here are a placeholder in the week after the draft is due.'],
    open: ['Is it a trip, and when? Pin the dates once Lafond replies.'],
    cost: [
      { label: 'Flight, round trip', low: 450, high: 1200, note: 'JFK–LHR 450–800; GRU–LHR 800–1,200' },
      { label: 'Lodging, 5 nights', low: 600, high: 1000 },
      { label: 'Trains, food', low: 250, high: 450 },
    ],
  },

  // Dec 23 – 27 · Maui ---------------------------------------------------------
  {
    id: 'maui-solo',
    short: 'Maui',
    start: '2026-12-23',
    end: '2026-12-27',
    title: 'Maui with family',
    place: 'Maui',
    status: 'pending',
    lane: 1,
    fork: { id: 'maui', option: 'solo' },
    summary: 'Christmas with family, then straight on toward Abu Dhabi.',
    notes: [
      'From NYC this is a normal Christmas flight. From Brazil it is São Paulo → Maui → Abu Dhabi across Christmas week, thirty-plus hours each leg.',
    ],
    open: ['Would be nice, in your words. Only makes sense if the December fork is NYC.'],
    cost: [
      { label: 'Flights, round trip, Christmas week', low: 700, high: 2000, note: 'NYC 700–1,200; Brazil 1,200–2,000' },
      { label: 'Lodging, 4 nights', low: 0, high: 2400, note: 'family, or a Christmas-week rate' },
      { label: 'Car, food', low: 400, high: 800 },
    ],
  },
  {
    id: 'maui-family',
    short: 'Maui + M&G',
    start: '2026-12-23',
    end: '2026-12-27',
    title: 'Maui with family + Mom & Grandma',
    place: 'Maui',
    status: 'pending',
    lane: 1,
    fork: { id: 'maui', option: 'family' },
    summary: 'Christmas with family, bringing Mom and Grandma over.',
    notes: [
      'From NYC this is a normal Christmas flight. From Brazil it is São Paulo → Maui → Abu Dhabi across Christmas week, thirty-plus hours each leg.',
      "Grandma's travel needs (assistance, a ground-floor room, a short transfer) are worth confirming before booking her a Christmas-week itinerary.",
    ],
    open: ['Would be nice, in your words. Only makes sense if the December fork is NYC.', 'Whether Mom and Grandma come — and who pays their flights.'],
    cost: [
      { label: 'Your flights, round trip, Christmas week', low: 700, high: 2000, note: 'NYC 700–1,200; Brazil 1,200–2,000' },
      { label: 'Mom + Grandma flights, Christmas week', low: 1000, high: 1900 },
      { label: 'Lodging, 4 nights, two rooms', low: 0, high: 4000, note: 'family, or a Christmas-week rate' },
      { label: 'Car, food, their ground costs', low: 500, high: 1100 },
    ],
  },

  // Jan 3 – 15 · Abu Dhabi ------------------------------------------------------
  {
    id: 'abu-dhabi',
    short: 'Abu Dhabi',
    start: '2027-01-03',
    end: '2027-01-15',
    title: 'Abu Dhabi — SFI winter school',
    place: 'Abu Dhabi',
    status: 'fixed',
    lane: 0,
    summary: 'Reimagining Economics winter school. The Lane V paper and lightning talk are due on arrival.',
    notes: ['The flight in is costed here because its origin depends on the December fork.'],
    open: [
      'End date: your list says Jan 15; the roadmap has the room running Jan 3 – 17. Verify.',
      'Does the school cover lodging and meals? The lodging line runs from zero (covered) to a full twelve nights.',
    ],
    cost: [
      { label: 'Flight in, one way', low: 700, high: 1900, note: 'NYC 700–1,300; São Paulo 1,000–1,600; Maui 1,200–1,900' },
      { label: 'Lodging, 12 nights', low: 0, high: 2400, note: 'zero if the program covers it' },
      { label: 'Food, transport', low: 400, high: 700 },
    ],
  },

  // After Abu Dhabi · the January fork -----------------------------------------
  {
    id: 'gulf-1wk',
    short: 'Gulf',
    start: '2027-01-15',
    end: '2027-01-22',
    title: 'Gulf — Oman + Qatar',
    place: 'Muscat · Jebel Shams or Wahiba · Doha',
    status: 'pending',
    lane: 0,
    fork: { id: 'afterAD', option: 'gulf1' },
    summary: 'One week fits two countries well. Five days in Oman, two in Doha, fly home from there.',
    notes: [
      'US passport: Oman e-visa (cheap, online); Qatar is visa-free for 30 days.',
      'Bahrain and Kuwait are one- to two-day city stops; Saudi wants a week; Socotra is a week on its own. None of those fit in seven days.',
    ],
    open: ['Can I travel the Gulf after — yes for two countries in a week; the six-country list needs the three-week option.'],
    cost: [
      { label: 'Regional flights AUH → MCT → DOH', low: 150, high: 400 },
      { label: 'Lodging, 7 nights', low: 500, high: 1100 },
      { label: 'Food, desert and mountain tours, Doha', low: 400, high: 900 },
      { label: 'Visas', low: 20, high: 60 },
      { label: 'Flight home, Doha → NYC', low: 500, high: 1000 },
    ],
  },
  {
    id: 'gulf-3wk',
    short: 'Gulf + Socotra',
    start: '2027-01-15',
    end: '2027-02-05',
    title: 'Gulf loop + Socotra',
    place: 'Oman · Qatar · Bahrain · Saudi Arabia · Kuwait · Socotra',
    status: 'pending',
    lane: 0,
    fork: { id: 'afterAD', option: 'gulf3' },
    summary: 'The whole list, three weeks. Socotra is a fixed seven-day tour that sets the dates for everything around it.',
    notes: [
      'Socotra: the Abu Dhabi charter was suspended in January 2026. The current route is Jeddah ⇄ Socotra, roughly weekly, bookable only through a tour operator. Mainland Yemen is out (US State Dept Level 4; Socotra shares the advisory, but tours run).',
      'Saudi e-visa for US passports is online (~$130 with insurance); Bahrain is a causeway drive from the Eastern Province; Kuwait is a day or two.',
      'Pushes the winter block start from Jan 23 to about Feb 5.',
    ],
    open: ['Is Socotra worth a week? It fixes the loop. Without it, two weeks covers the five mainland countries.', 'The exact Jeddah ⇄ Socotra dates for January 2027 — ask an operator now; seats are few.'],
    cost: [
      { label: 'Regional flights around the loop', low: 500, high: 1000 },
      { label: 'Socotra tour, 7 days, land', low: 1500, high: 2500 },
      { label: 'Jeddah ⇄ Socotra flight', low: 900, high: 1200 },
      { label: 'Lodging elsewhere, 14 nights', low: 1000, high: 2400 },
      { label: 'Food, tours', low: 800, high: 1600 },
      { label: 'Visas, Saudi, Bahrain, Kuwait, Oman, Yemen via the tour', low: 300, high: 450 },
      { label: 'Flight home', low: 500, high: 1000 },
    ],
  },
  {
    id: 'iap',
    short: 'MIT IAP',
    start: '2027-01-16',
    end: '2027-01-29',
    title: 'MIT IAP, second half',
    place: 'Cambridge, MA',
    status: 'pending',
    lane: 0,
    fork: { id: 'afterAD', option: 'iap' },
    summary: 'IAP 2027 officially runs Mon Jan 4 – Fri Jan 29. Arriving Jan 16 is the second half.',
    notes: ['Many IAP activities are open to the public; for-credit subjects are not. The hook decides whether two weeks is worth the flight.'],
    open: ['What is the hook — an MIT affiliation, a specific program (Trust Center, Media Lab, a course), or auditing open sessions?', 'Option, in your words.'],
    cost: [
      { label: 'Flight Abu Dhabi → Boston', low: 600, high: 1100 },
      { label: 'Cambridge lodging, 13 nights', low: 1300, high: 2600 },
      { label: 'Food, transit', low: 400, high: 700 },
    ],
  },
  {
    id: 'gulf-iap',
    short: 'Gulf → IAP',
    start: '2027-01-15',
    end: '2027-01-29',
    title: 'Gulf week, then IAP’s last week',
    place: 'Oman · Qatar → Cambridge, MA',
    status: 'pending',
    lane: 0,
    fork: { id: 'afterAD', option: 'gulfIap' },
    summary: 'Both, thinly: Oman and Doha for a week, then fly Doha → Boston for the final week of IAP.',
    open: ['Same hook question as IAP — one week in Cambridge needs a reason.'],
    cost: [
      { label: 'Regional flights AUH → MCT → DOH', low: 150, high: 400 },
      { label: 'Gulf lodging + food, 7 nights', low: 900, high: 2000 },
      { label: 'Visas', low: 20, high: 60 },
      { label: 'Flight Doha → Boston', low: 600, high: 1100 },
      { label: 'Cambridge lodging, 7 nights', low: 700, high: 1400 },
      { label: 'Food, transit', low: 200, high: 400 },
    ],
  },

  // Late Jan → Apr 15 · the winter fork ----------------------------------------
  {
    id: 'winter-nyc',
    short: 'NYC',
    start: '2027-01-23',
    end: '2027-04-15',
    title: 'NYC — winter block',
    place: 'New York',
    status: 'pending',
    lane: 0,
    fork: { id: 'winter', option: 'nyc' },
    followsAfterAD: true,
    summary: 'Roughly twelve weeks. Start date follows whatever the January fork ends on.',
    notes: ['Jan – Mar is the dense stretch for East Coast allocator meetings; iConnections Global Alts in Miami is late January.'],
    open: ['NYC? or? — your question mark. Puerto Rico is the alternative on the table.'],
    cost: [...NYC_LINES],
  },
  {
    id: 'winter-pr',
    short: 'Puerto Rico',
    start: '2027-01-23',
    end: '2027-04-15',
    title: 'Puerto Rico — fundraise',
    place: 'San Juan · Condado or Dorado',
    status: 'pending',
    lane: 0,
    fork: { id: 'winter', option: 'pr' },
    followsAfterAD: true,
    summary: 'A San Juan base for the fundraise. Start date follows the January fork.',
    notes: [
      'The Act 60 investor community concentrates in Dorado and Condado; Miami is a two-and-a-half-hour hop for conferences.',
      'Trade-wind kite season at Isla Verde runs Dec – Apr.',
      'Per-month lines scale with the window, so a shorter block costs less.',
    ],
    open: ['Perhaps, in your words. Who specifically is in PR to raise from? If the list is short, two weeks beats twelve.'],
    cost: [
      { label: 'Flights, round trip + a Miami hop', low: 300, high: 700 },
      { label: 'Furnished rental, per month', low: 2500, high: 4000, perMonth: true },
      { label: 'Living, per month', low: 1500, high: 2500, perMonth: true },
      { label: 'Car, per month', low: 0, high: 1000, perMonth: true, note: 'optional' },
      { label: 'Events, dinners, memberships', low: 500, high: 1500 },
    ],
  },

  // Apr 15 → Jul 3 · NYC spring ------------------------------------------------
  {
    id: 'spring-nyc',
    short: 'NYC',
    start: '2027-04-15',
    end: '2027-07-03',
    title: 'NYC — spring',
    place: 'New York',
    status: 'planned',
    lane: 0,
    summary: 'April through June, as listed.',
    open: ['The Jul 4 departure assumes the summer fork; otherwise open-ended into July.'],
    cost: [...NYC_LINES],
  },

  // Jul 4 → Sep 2 · the summer fork --------------------------------------------
  {
    id: 'summer-lt',
    short: 'Lithuania + islands',
    start: '2027-07-04',
    end: '2027-09-02',
    title: 'Lithuania summer + Mallorca + Tenerife',
    place: 'Palanga · Pollença · El Médano',
    status: 'pending',
    lane: 0,
    fork: { id: 'summer', option: 'lt' },
    summary: 'Two months on the Baltic with a week each on the islands.',
    notes: [
      'El Médano (Tenerife) is windiest Jul – Aug; Pollença / Alcúdia bay on Mallorca has summer thermals.',
      'Both are cheap Ryanair / Wizz hops from Lithuania in shoulder weeks and expensive in the August peak.',
    ],
    open: ['If Aidas and I are still dating — your condition. Contingent until then.', 'Palanga lodging: with Aidas, or a rental?'],
    cost: [
      { label: 'Flights NYC ⇄ Vilnius or Palanga', low: 600, high: 1000 },
      { label: 'Palanga lodging, 2 months', low: 0, high: 3600, note: 'zero if staying with Aidas' },
      { label: 'Living, 2 months', low: 2400, high: 4000 },
      { label: 'Mallorca week, incl. flights', low: 900, high: 1800 },
      { label: 'Tenerife week, incl. flights', low: 900, high: 1700 },
    ],
  },
  {
    id: 'summer-islands',
    short: 'Islands',
    start: '2027-07-04',
    end: '2027-08-01',
    title: 'Mallorca + Tenerife, four weeks',
    place: 'Pollença · El Médano',
    status: 'pending',
    lane: 0,
    fork: { id: 'summer', option: 'islands' },
    summary: 'The islands without the Baltic: two weeks each, in peak season.',
    open: ['The fallback if Lithuania is off. Peak-season lodging is the swing cost.'],
    cost: [
      { label: 'Flights NYC ⇄ Spain + inter-island', low: 700, high: 1300 },
      { label: 'Lodging, 4 weeks, peak season', low: 2400, high: 5000 },
      { label: 'Living, kite', low: 1200, high: 2200 },
    ],
  },
  {
    id: 'summer-nyc-tail',
    short: 'NYC',
    start: '2027-08-02',
    end: '2027-09-02',
    title: 'NYC — August',
    place: 'New York',
    status: 'pending',
    lane: 0,
    fork: { id: 'summer', option: 'islands' },
    summary: 'Back in the city for August if the summer is islands-only.',
    cost: [...NYC_LINES],
  },

  // Sep 2 → Dec 31, 2027 · TBD -------------------------------------------------
  {
    id: 'fall-tbd',
    short: 'TBD',
    start: '2027-09-02',
    end: '2027-12-31',
    title: 'Sep → Dec 2027',
    place: 'TBD',
    status: 'tbd',
    lane: 0,
    summary: 'Nothing decided. Not costed.',
    notes: [
      'If the Oxford DPhil application lands (deadlines fall Dec 2026 – Jan 2027 for Oct 2027 entry), Michaelmas term starts around Oct 10 and this block becomes Oxford.',
      'Otherwise the defaults: NYC, a 2027 race to pick, and Ceará’s wind season running Aug – Jan again.',
    ],
    open: ['TBD, in your words.'],
    cost: [],
  },
]

// ── Derivation ──────────────────────────────────────────────────────────

export interface ResolvedLine {
  label: string
  low: number
  high: number
  note?: string
}

export interface ResolvedSegment extends Segment {
  /** Dates after fork-driven shifts */
  start: string
  end: string
  days: number
  months: number
  active: boolean
  lines: ResolvedLine[]
  low: number
  high: number
}

export interface Scenario {
  segments: ResolvedSegment[]
  active: ResolvedSegment[]
  lease: ResolvedLine | null
  low: number
  high: number
  warnings: string[]
}

const DAY = 86400000

export function dayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / DAY)
}

export function isoFromIndex(idx: number): string {
  return new Date(idx * DAY).toISOString().slice(0, 10)
}

export function addDays(iso: string, n: number): string {
  return isoFromIndex(dayIndex(iso) + n)
}

/** Inclusive day count */
export function spanDays(start: string, end: string): number {
  return dayIndex(end) - dayIndex(start) + 1
}

export function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isActive(seg: Segment, forks: ForkState): boolean {
  if (!seg.fork) return true
  return forks[seg.fork.id] === seg.fork.option
}

function fmt0(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

export function resolve(forks: ForkState, leaseHeld: boolean): Scenario {
  const afterAD = SEGMENTS.find(s => s.fork?.id === 'afterAD' && s.fork.option === forks.afterAD)
  const winterStart = afterAD ? addDays(afterAD.end, 1) : '2027-01-23'

  const segments: ResolvedSegment[] = SEGMENTS.map(seg => {
    const start = seg.followsAfterAD ? winterStart : seg.start
    const end = seg.end
    const days = Math.max(1, spanDays(start, end))
    const months = days / 30.44
    const lines: ResolvedLine[] = []
    for (const c of seg.cost) {
      if (c.nycRent && leaseHeld) continue
      if (c.perMonth) {
        lines.push({
          label: `${c.label.replace(', per month', '')}, ${months.toFixed(1)} mo`,
          low: Math.round((c.low * months) / 50) * 50,
          high: Math.round((c.high * months) / 50) * 50,
          note: c.note ? `${c.note} · ${fmt0(c.low)}–${fmt0(c.high)}/mo` : `${fmt0(c.low)}–${fmt0(c.high)}/mo`,
        })
      } else {
        lines.push({ label: c.label, low: c.low, high: c.high, note: c.note })
      }
    }
    const low = lines.reduce((a, l) => a + l.low, 0)
    const high = lines.reduce((a, l) => a + l.high, 0)
    return { ...seg, start, end, days, months, active: isActive(seg, forks), lines, low, high }
  })

  const active = segments.filter(s => s.active)
  const lease: ResolvedLine | null = leaseHeld
    ? {
        label: `NYC lease held year-round, ${LEASE_MONTHS} mo`,
        low: NYC.rent.low * LEASE_MONTHS,
        high: NYC.rent.high * LEASE_MONTHS,
        note: `${fmt0(NYC.rent.low)}–${fmt0(NYC.rent.high)}/mo, Oct 23 → Dec 31`,
      }
    : null

  const low = active.reduce((a, s) => a + s.low, 0) + (lease?.low ?? 0)
  const high = active.reduce((a, s) => a + s.high, 0) + (lease?.high ?? 0)

  const warnings: string[] = []
  if (forks.decDest === 'brazil' && forks.maui !== 'skip') {
    warnings.push('Brazil → Maui → Abu Dhabi is a round-the-world routing across Christmas week. Costed, but this is the case you flagged as not making sense.')
  }
  if (forks.decDest === 'brazil' && forks.oxford === 'include') {
    warnings.push('Oxford from Brazil is a twelve-hour flight each way (São Paulo – London); from NYC it is seven.')
  }
  if (forks.afterAD === 'gulf3') {
    warnings.push('The three-week Gulf loop runs to about Feb 5, so the winter block starts two weeks later than Jan 23.')
  }
  if (forks.afterAD === 'iap' || forks.afterAD === 'gulfIap') {
    warnings.push('IAP officially runs Jan 4 – 29. Arriving mid-month is the second half, and the MIT hook is still an open question.')
  }
  if (forks.winter === 'pr' && leaseHeld) {
    warnings.push('With a lease held, Puerto Rico is entirely on top of NYC rent — the twelve weeks double-pay.')
  }

  return { segments, active, lease, low, high, warnings }
}

/** Cost of one fork option in the current scenario, holding every other fork fixed */
export function optionCost(fork: ForkId, option: string, forks: ForkState, leaseHeld: boolean): { low: number; high: number } {
  const s = resolve({ ...forks, [fork]: option }, leaseHeld)
  return { low: s.low, high: s.high }
}

// ── Formatting ──────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtDate(iso: string, withYear = false): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}${withYear ? `, ${y}` : ''}`
}

export function fmtRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  if (sy === ey && sm === em) return `${MONTHS[sm - 1]} ${sd} – ${ed}`
  if (sy === ey) return `${MONTHS[sm - 1]} ${sd} – ${MONTHS[em - 1]} ${ed}`
  return `${MONTHS[sm - 1]} ${sd}, ${sy} – ${MONTHS[em - 1]} ${ed}, ${ey}`
}

export function fmtMoney(n: number): string {
  return `$${fmt0(n)}`
}

export function fmtMoneyRange(low: number, high: number): string {
  if (low === 0 && high === 0) return '—'
  return `${fmtMoney(low)} – ${fmt0(high)}`
}

/** Compact: $1.8k – 3.7k */
export function fmtK(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `$${k >= 10 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return `$${fmt0(n)}`
}

export function fmtKRange(low: number, high: number): string {
  if (low === 0 && high === 0) return '—'
  return `${fmtK(low)} – ${fmtK(high).slice(1)}`
}

export function monthsInRange(): { label: string; start: string; days: number }[] {
  const out: { label: string; start: string; days: number }[] = []
  let [y, m] = RANGE_START.split('-').map(Number)
  const endIdx = dayIndex(RANGE_END)
  while (true) {
    const start = `${y}-${String(m).padStart(2, '0')}-01`
    if (dayIndex(start) > endIdx) break
    const nextY = m === 12 ? y + 1 : y
    const nextM = m === 12 ? 1 : m + 1
    const next = `${nextY}-${String(nextM).padStart(2, '0')}-01`
    const days = Math.min(dayIndex(next), endIdx + 1) - dayIndex(start)
    out.push({ label: `${MONTHS[m - 1]}${m === 1 || out.length === 0 ? ` ${String(y).slice(2)}` : ''}`, start, days })
    y = nextY
    m = nextM
  }
  return out
}
