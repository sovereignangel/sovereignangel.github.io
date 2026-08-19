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
  phase: 'Build 1' | 'Build 2' | 'Peak' | 'Taper' | 'Race'
  focus: string
  sessions: PlannedSession[]
}

export const RACE = {
  name: 'Ironman 70.3',
  date: '2026-09-13',
  swimKm: 1.9,
  bikeKm: 90,
  runKm: 21.1,
  location: 'TBC',
}

/** Race goal targets — the numbers the whole build is aimed at */
export const GOALS = {
  swimMinutes: 40, // full 1.9km swim
  bikeMph: 18, // average over 90km
  runPaceMinPerMile: 9, // average over 21.1km
  transitionMinutes: 8, // T1 + T2 combined
}

const KM_PER_MILE = 1.609344

/** Goal splits in minutes, derived from GOALS + RACE distances */
export function goalSplits() {
  const swim = GOALS.swimMinutes
  const bike = (RACE.bikeKm / KM_PER_MILE / GOALS.bikeMph) * 60
  const run = (RACE.runKm / KM_PER_MILE) * GOALS.runPaceMinPerMile
  const transitions = GOALS.transitionMinutes
  return { swim, bike, run, transitions, total: swim + bike + run + transitions }
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

  // ── Race day ────────────────────────────────────────────────────────────
  {
    date: '2026-09-13',
    phase: 'Race',
    focus: 'Race day',
    sessions: [
      s('brick', 'RACE: 1.9km swim / 90km bike / 21.1km run',
        'Swim: settle in 200m, then steady — your race starts at the buoy line, not the gun. Bike: cap effort the first 20km, eat 70g carbs/hour from minute 15. Run: first 5km deliberately conservative, then hold; the race starts at km 14.',
        330, 'race', 113, true),
    ],
  },
]

export function getPlanDay(date: string): PlanDay | undefined {
  return PLAN.find((d) => d.date === date)
}

export function daysToRace(today: string): number {
  const ms = new Date(RACE.date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()
  return Math.round(ms / 86400000)
}

/** Local date string in the athlete's timezone (Palanga) */
export function todayLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vilnius' }).format(new Date())
}
