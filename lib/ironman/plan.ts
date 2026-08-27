/**
 * Ironman Training Plan — race config + day-by-day base plan.
 *
 * The base plan is static (deterministic by date). The adaptive layer in
 * lib/ironman/adapt.ts overlays daily readiness adjustments and Garmin
 * completion matching on top of it.
 *
 * Change RACE below if the event or distance changes — everything else
 * (countdown, benchmarks, pacing) derives from it.
 */

export type Sport = 'swim' | 'bike' | 'run' | 'brick' | 'strength' | 'rest'
export type Zone = 'Z1' | 'Z2' | 'Z3' | 'race' | 'mixed' | '-'

export interface PlannedSession {
  sport: Sport
  title: string
  detail: string
  durationMin: number
  distanceKm?: number
  zone: Zone
  /** Key session — protect it when adapting; skip lower-priority work first */
  key?: boolean
}

export interface PlanDay {
  date: string // YYYY-MM-DD
  phase: 'Build 1' | 'Build 2' | 'Peak' | 'Taper' | 'Race 1' | 'Recover' | 'Sharpen' | 'Taper 2' | 'Race 2'
  focus: string
  sessions: PlannedSession[]
}

export const RACE = {
  name: 'Ironman 70.3 Belgrade',
  date: '2026-09-13',
  swimKm: 1.9,
  bikeKm: 90,
  runKm: 21.1,
  location: 'Belgrade',
}

/**
 * Race 2 — the A-race. Race 1 is the hard dress rehearsal; the block between
 * them recovers, sharpens, and tapers again so peak performance lands in
 * New York. Goals and the forecast model target this date.
 */
export const RACE_NYC = {
  name: 'Ironman 70.3 New York',
  date: '2026-09-26',
  swimKm: 1.9,
  bikeKm: 90,
  runKm: 21.1,
  location: 'New York City',
}

export const RACES = [RACE, RACE_NYC] as const

/** The next race still ahead of `today` (falls back to the last one) */
export function nextRace(today: string) {
  return RACES.find((r) => r.date >= today) ?? RACES[RACES.length - 1]
}

export const KM_PER_MILE = 1.609344

export type AthleteId = 'lori' | 'aidas'
/** The three disciplines that carry a time. Strength and rest do not. */
export type Sport3 = 'swim' | 'bike' | 'run'

/**
 * Race goals, stored as the split each athlete is aiming at.
 *
 * Splits rather than paces because that is how the targets were actually set
 * ("bike 2:40, run 2:00"), and because a split survives a change of race
 * distance in a way an mph number does not. Goal pace, forecast probability
 * and prescribed race effort all derive from these four numbers, so this is
 * the only place a target is ever edited.
 */
export interface RaceGoals {
  swimMinutes: number
  bikeMinutes: number
  runMinutes: number
  transitionMinutes: number
}

/**
 * Two athletes, two targets — and deliberately not the same shape. Aidas
 * gives up ten minutes in the water and takes twenty-six back on the bike,
 * which is exactly what the strength profile below says should happen. A
 * single shared number would ask each of them to train the other's race.
 */
export const ATHLETE_GOALS: Record<AthleteId, RaceGoals> = {
  // 40min swim, 18.0mph bike, 9:00/mile run — 5:52 total
  lori: { swimMinutes: 40, bikeMinutes: 186.4, runMinutes: 118, transitionMinutes: 8 },
  // 50min swim, 2:40 bike, 2:00 run — 5:38 total
  aidas: { swimMinutes: 50, bikeMinutes: 160, runMinutes: 120, transitionMinutes: 8 },
}

/** Lori's targets are the default wherever the solo dashboard asks for "the" goal */
export const GOALS = ATHLETE_GOALS.lori

export function goalsFor(person: AthleteId): RaceGoals {
  return ATHLETE_GOALS[person] ?? ATHLETE_GOALS.lori
}

/** Goal splits in minutes, and the finish they add up to */
export function goalSplits(goals: RaceGoals = GOALS) {
  const { swimMinutes: swim, bikeMinutes: bike, runMinutes: run, transitionMinutes: transitions } = goals
  return { swim, bike, run, transitions, total: swim + bike + run + transitions }
}

/** The same targets said the way each discipline is normally spoken about */
export function goalDisplay(goals: RaceGoals = GOALS) {
  return {
    swimSecPer100m: (goals.swimMinutes * 60) / (RACE.swimKm * 10),
    bikeKmh: RACE.bikeKm / (goals.bikeMinutes / 60),
    bikeMph: RACE.bikeKm / KM_PER_MILE / (goals.bikeMinutes / 60),
    runMinPerKm: goals.runMinutes / RACE.runKm,
    runPaceMinPerMile: goals.runMinutes / (RACE.runKm / KM_PER_MILE),
  }
}

/** Goal pace in min/km — the unit the forecast and the zone targets both work in */
export function goalPaceMinKm(sport: Sport3, goals: RaceGoals = GOALS): number {
  if (sport === 'swim') return goals.swimMinutes / RACE.swimKm
  if (sport === 'bike') return goals.bikeMinutes / RACE.bikeKm
  return goals.runMinutes / RACE.runKm
}

/**
 * Relative standing per discipline. This sets no targets — the goals do that.
 * It decides what a gap *means*: a weakness with minutes still on the table is
 * where a block is won, while a strength already at goal only needs keeping
 * awake.
 */
export type Standing = 'strong' | 'even' | 'weak'

export const STRENGTHS: Record<AthleteId, Record<Sport3, Standing>> = {
  lori: { swim: 'strong', bike: 'weak', run: 'strong' },
  aidas: { swim: 'weak', bike: 'strong', run: 'even' },
}

/** Baselines observed before the plan started */
export const BASELINE = {
  longestRideKm: 60, // 2026-08-18
  swimBenchmark: { distanceM: 1800, minutes: 54 }, // ~3:00/100m, mid-July
}

const s = (
  sport: Sport,
  title: string,
  detail: string,
  durationMin: number,
  zone: Zone,
  distanceKm?: number,
  key?: boolean
): PlannedSession => ({ sport, title, detail, durationMin, zone, distanceKm, key })

export const PLAN: PlanDay[] = [
  // ── Build 1: Aug 19–23 — establish tri frequency, first brick ──────────
  {
    date: '2026-08-19',
    phase: 'Build 1',
    focus: 'Swim frequency starts today',
    sessions: [
      s('swim', 'Swim 2000m endurance', 'Warm-up 300m. Main: 3x400m steady with 30s rest, focus long exhale + high elbow. Cool 200m. Pool or calm sea.', 55, 'Z2', 2.0, true),
      s('run', 'Easy run 30min', 'Conversational pace, flat. Legs are loaded from the 60km ride — keep it truly easy.', 30, 'Z1', 5),
    ],
  },
  {
    date: '2026-08-20',
    phase: 'Build 1',
    focus: 'Bike strength',
    sessions: [
      s('bike', 'Bike 75min sweet spot', 'Warm-up 15min. 3x8min strong-but-steady (can speak short sentences), 4min easy between. Spin home.', 75, 'Z3', 30, true),
      s('strength', 'Core 20min', 'Plank series, side planks, dead bugs, single-leg bridges. Triathlon posture insurance.', 20, '-'),
    ],
  },
  {
    date: '2026-08-21',
    phase: 'Build 1',
    focus: 'Run base + feel for water',
    sessions: [
      s('run', 'Run 50min + strides', 'Z2 throughout, then 4x20s relaxed fast strides with full recovery.', 50, 'Z2', 8, true),
      s('swim', 'Open-water 1200m easy', 'Optional. Sea practice: sighting every 6-8 strokes, relaxed breathing. Skip if sea is rough.', 30, 'Z1', 1.2),
    ],
  },
  {
    date: '2026-08-22',
    phase: 'Build 1',
    focus: 'First long ride + brick',
    sessions: [
      s('brick', 'Long ride 80km + 15min brick run', 'Ride Z2, eat 60g carbs/hour, drink every 15min. Rack the bike, immediately run 15min easy. This teaches the legs the transition.', 210, 'Z2', 83, true),
    ],
  },
  {
    date: '2026-08-23',
    phase: 'Build 1',
    focus: 'Long run',
    sessions: [
      s('run', 'Long run 75min', 'All Z2. Walk 30s at every 10min if needed — finishing fresh beats finishing fast today.', 75, 'Z2', 12, true),
    ],
  },

  // ── Build 2: Aug 24–30 — biggest week ──────────────────────────────────
  {
    date: '2026-08-24',
    phase: 'Build 2',
    focus: 'Recovery + technique',
    sessions: [
      s('swim', 'Recovery swim 1500m', 'All easy. 6x50m drill (catch-up, fingertip drag) inside. Yoga or mobility in the evening.', 40, 'Z1', 1.5),
    ],
  },
  {
    date: '2026-08-25',
    phase: 'Build 2',
    focus: 'Race-effort bike',
    sessions: [
      s('bike', 'Bike 90min: 4x10min race effort', 'Warm-up 15min. 4x10min at target 90km effort (strong, sustainable), 5min easy between. Practice race nutrition.', 90, 'race', 38, true),
      s('strength', 'Core 15min', 'Short core circuit after the ride.', 15, '-'),
    ],
  },
  {
    date: '2026-08-26',
    phase: 'Build 2',
    focus: 'Run intensity + swim volume',
    sessions: [
      s('run', 'Run 60min: 3x10min half-marathon effort', 'Warm-up 15min. 3x10min at target race-run effort, 3min jog between. Cool down.', 60, 'race', 10, true),
      s('swim', 'Swim 2000m steady', '2x(600m steady + 200m pull). Focus: hold form when tired.', 50, 'Z2', 2.0),
    ],
  },
  {
    date: '2026-08-27',
    phase: 'Build 2',
    focus: 'Race-distance swim',
    sessions: [
      s('swim', 'Swim 1900m continuous', 'The full race distance without stopping, at steady effort. Note the time — this is your benchmark v2.', 60, 'race', 1.9, true),
      s('bike', 'Easy spin 30min', 'Flush the legs, high cadence, no effort.', 30, 'Z1', 10),
    ],
  },
  {
    date: '2026-08-28',
    phase: 'Build 2',
    focus: 'Rest',
    sessions: [s('rest', 'Full rest', 'No training. Sleep, food, walk. The biggest weekend of the block starts tomorrow.', 0, '-')],
  },
  {
    date: '2026-08-29',
    phase: 'Build 2',
    focus: 'Longest ride of the block',
    sessions: [
      s('brick', 'Long ride 100km + 20min brick run', 'Z2 all day. Full race nutrition rehearsal: 60-80g carbs/hour, electrolytes. Then 20min run off the bike at easy effort.', 260, 'Z2', 104, true),
    ],
  },
  {
    date: '2026-08-30',
    phase: 'Build 2',
    focus: 'Longest run of the block',
    sessions: [
      s('run', 'Long run 90min', 'Z2, last 15min at race effort if feeling good. Practice drinking on the run.', 90, 'Z2', 14, true),
    ],
  },

  // ── Peak: Aug 31 – Sep 6 — sharpen + race simulation ───────────────────
  {
    date: '2026-08-31',
    phase: 'Peak',
    focus: 'Recovery + swim speed',
    sessions: [
      s('swim', 'Swim 2000m: race-pace 100s', 'Warm-up 400m. 10x100m at target race pace with 20s rest. Cool 400m. Lock in the rhythm.', 55, 'race', 2.0, true),
    ],
  },
  {
    date: '2026-09-01',
    phase: 'Peak',
    focus: 'Bike race effort',
    sessions: [
      s('bike', 'Bike 75min: 3x12min race effort', 'Last hard bike block. 3x12min at race effort, 5min easy between. Aero position throughout the intervals.', 75, 'race', 32, true),
    ],
  },
  {
    date: '2026-09-02',
    phase: 'Peak',
    focus: 'Run race rhythm + OW dress rehearsal',
    sessions: [
      s('run', 'Run 55min: 30min race effort', 'Warm-up 15min, 30min continuous at race effort, cool 10min. Trust the rhythm, do not exceed it.', 55, 'race', 9, true),
      s('swim', 'Open-water 1900m in wetsuit', 'Full race-distance sea swim in race kit. Sighting, drafting lines, exit and jog 2min.', 55, 'Z2', 1.9),
    ],
  },
  {
    date: '2026-09-03',
    phase: 'Peak',
    focus: 'Flush',
    sessions: [s('bike', 'Easy spin 45min', 'High cadence, coffee ride. Nothing hard.', 45, 'Z1', 15)],
  },
  {
    date: '2026-09-04',
    phase: 'Peak',
    focus: 'Rest before simulation',
    sessions: [s('rest', 'Full rest', 'Prepare simulation kit and nutrition for tomorrow exactly as race day.', 0, '-')],
  },
  {
    date: '2026-09-05',
    phase: 'Peak',
    focus: 'Race simulation',
    sessions: [
      s('brick', 'Simulation: 1000m swim + 60km bike + 8km run', 'Half-scale dress rehearsal at exact race effort with full transitions, race kit, race nutrition. This is the most informative day of the plan — record everything.', 240, 'race', 69, true),
    ],
  },
  {
    date: '2026-09-06',
    phase: 'Peak',
    focus: 'Recovery',
    sessions: [
      s('run', 'Recovery jog 40min', 'Very easy, soft surface if possible. Mobility after.', 40, 'Z1', 6),
    ],
  },

  // ── Taper: Sep 7–12 — absorb the work ──────────────────────────────────
  {
    date: '2026-09-07',
    phase: 'Taper',
    focus: 'Volume drops, touch of pace stays',
    sessions: [
      s('swim', 'Swim 1500m with race-pace 50s', 'Easy 1000m, then 6x50m at race pace, long rest. Feel fast, leave fresh.', 40, 'Z2', 1.5),
    ],
  },
  {
    date: '2026-09-08',
    phase: 'Taper',
    focus: 'Bike sharpener',
    sessions: [
      s('bike', 'Bike 60min: 3x5min race effort', 'Short and crisp. 3x5min at race effort, full recovery. Check the bike mechanically while you are at it.', 60, 'race', 24),
    ],
  },
  {
    date: '2026-09-09',
    phase: 'Taper',
    focus: 'Run sharpener',
    sessions: [
      s('run', 'Run 40min: 3x3min race effort', 'Easy running with 3x3min at race effort floated in. Strides to finish.', 40, 'race', 7),
    ],
  },
  {
    date: '2026-09-10',
    phase: 'Taper',
    focus: 'Easy swim + spin',
    sessions: [
      s('swim', 'Open-water 1000m easy', 'Relaxed sea swim, a few sighting reps. Confidence, not fitness.', 25, 'Z1', 1.0),
      s('bike', 'Spin 30min', 'Very easy, high cadence. Nothing more.', 30, 'Z1', 10),
    ],
  },
  {
    date: '2026-09-11',
    phase: 'Taper',
    focus: 'Rest + logistics',
    sessions: [
      s('rest', 'Rest + race prep', 'Gear check, numbers, nutrition packed, bike checked. Long sleep tonight matters more than tomorrow night.', 0, '-'),
    ],
  },
  {
    date: '2026-09-12',
    phase: 'Taper',
    focus: 'Activation',
    sessions: [
      s('brick', 'Activation: 20min spin + 10min run + 10min swim', 'Short openers in each sport with 3-4 pickups to race effort. Done before noon. Feet up after.', 40, 'mixed', undefined),
    ],
  },

  // ── Race 1 — the hard dress rehearsal ───────────────────────────────────
  {
    date: '2026-09-13',
    phase: 'Race 1',
    focus: 'Race day 1',
    sessions: [
      s('brick', 'RACE 1: 1.9km swim / 90km bike / 21.1km run',
        'Swim: settle in 200m, then steady — your race starts at the buoy line, not the gun. Bike: cap effort the first 20km, eat 70g carbs/hour from minute 15. Run: first 5km deliberately conservative, then hold; the race starts at km 14. NYC is 13 days out — race hard, but this is the rehearsal, not the peak.',
        330, 'race', 113, true),
    ],
  },

  // ── Recover: Sep 14–17 — absorb race 1, nothing earns fitness now ──────
  {
    date: '2026-09-14',
    phase: 'Recover',
    focus: 'Full rest',
    sessions: [s('rest', 'Full rest', 'No training. Eat, sleep, walk. The next 4 days decide how good NYC can be — recovery is the workout.', 0, '-')],
  },
  {
    date: '2026-09-15',
    phase: 'Recover',
    focus: 'Flush the legs',
    sessions: [
      s('bike', 'Recovery spin 30min', 'High cadence, zero pressure on the pedals. Mobility and stretching after.', 30, 'Z1', 10),
    ],
  },
  {
    date: '2026-09-16',
    phase: 'Recover',
    focus: 'Easy water',
    sessions: [
      s('swim', 'Recovery swim 1200m', 'All easy with drills: catch-up, fingertip drag. Feel for the water, no clock.', 30, 'Z1', 1.2),
    ],
  },
  {
    date: '2026-09-17',
    phase: 'Recover',
    focus: 'Test the legs',
    sessions: [
      s('run', 'Easy run 30min + strides', 'Z1 conversational. If legs respond well, 4x20s relaxed strides. If not, jog only — honesty here protects NYC.', 30, 'Z1', 5),
    ],
  },

  // ── Sharpen: Sep 18–21 — brief race-pace touches, then travel ──────────
  {
    date: '2026-09-18',
    phase: 'Sharpen',
    focus: 'Bike sharpener',
    sessions: [
      s('bike', 'Bike 60min: 3x8min race effort', 'Warm-up 15min. 3x8min at NYC race effort, 4min easy between. Crisp, not heroic — fitness is banked, this keeps it awake.', 60, 'race', 25, true),
    ],
  },
  {
    date: '2026-09-19',
    phase: 'Sharpen',
    focus: 'Run sharpener',
    sessions: [
      s('run', 'Run 45min: 2x10min race effort', 'Warm-up 15min. 2x10min at race-run effort, 3min jog between. Should feel controlled and smooth.', 45, 'race', 8, true),
    ],
  },
  {
    date: '2026-09-20',
    phase: 'Sharpen',
    focus: 'Swim rhythm + spin',
    sessions: [
      s('swim', 'Swim 1800m: race-pace 100s', 'Warm-up 400m. 8x100m at race pace with 20s rest. Cool 400m. Lock the NYC rhythm in.', 50, 'race', 1.8, true),
      s('bike', 'Easy spin 30min', 'Flush ride, high cadence.', 30, 'Z1', 10),
    ],
  },
  {
    date: '2026-09-21',
    phase: 'Sharpen',
    focus: 'Travel to New York',
    sessions: [
      s('rest', 'Rest + fly to NYC', 'Travel day. Hydrate hard, compression on the flight, walk every hour. On arrival: light, daylight, early sleep — start beating jet lag immediately.', 0, '-'),
    ],
  },

  // ── Taper 2: Sep 22–25 — reset the clock, stay sharp ──────────────────
  {
    date: '2026-09-22',
    phase: 'Taper 2',
    focus: 'Jet-lag reset',
    sessions: [
      s('run', 'Shake-out run 25min + strides', 'Morning run in daylight — it resets the body clock. Easy pace, 4x20s strides. Then stay on NYC time ruthlessly.', 25, 'Z1', 4),
    ],
  },
  {
    date: '2026-09-23',
    phase: 'Taper 2',
    focus: 'Bike opener + recon',
    sessions: [
      s('bike', 'Bike 45min: 3x4min race effort', 'Short and crisp on the race bike after reassembly — confirms everything works. Ride part of the course if possible.', 45, 'race', 18),
    ],
  },
  {
    date: '2026-09-24',
    phase: 'Taper 2',
    focus: 'Feel for the water',
    sessions: [
      s('swim', 'Swim 1000m easy + race-pace 50s', 'Easy 800m, then 4x50m at race pace. If a practice swim at the venue is offered, take it.', 25, 'Z1', 1.0),
    ],
  },
  {
    date: '2026-09-25',
    phase: 'Taper 2',
    focus: 'Rest + logistics',
    sessions: [
      s('rest', 'Rest + race prep', 'Bike check-in, numbers, nutrition packed. Off your feet. Tonight-minus-one was the sleep that mattered — tonight just relax.', 0, '-'),
    ],
  },

  // ── Race 2 — the A-race ─────────────────────────────────────────────────
  {
    date: '2026-09-26',
    phase: 'Race 2',
    focus: 'Race day 2 — the one you peaked for',
    sessions: [
      s('brick', 'RACE 2 (NYC): 1.9km swim / 90km bike / 21.1km run',
        'You did the full rehearsal 13 days ago — trust it. Same script, executed better: settle the swim in 200m, cap the first 20km of the bike, 70g carbs/hour, conservative first 5km of the run, then race from km 14. This is the peak.',
        330, 'race', 113, true),
    ],
  },
]

export function getPlanDay(date: string): PlanDay | undefined {
  return PLAN.find((d) => d.date === date)
}

/** Days from `today` to a race date — defaults to the next race still ahead */
export function daysToRace(today: string, raceDate?: string): number {
  const target = raceDate ?? nextRace(today).date
  const ms = new Date(target + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()
  return Math.round(ms / 86400000)
}

/** Local date string in the athlete's timezone (Palanga) */
export function todayLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vilnius' }).format(new Date())
}
