import type { PlanDay, PlannedSession, Sport, Zone, TargetRace } from './plan'

/**
 * The rolling plan — what training looks like when no race is on the
 * calendar yet, and how it bends into one when a date is picked.
 *
 * After every race: about two weeks of recovery, then four-week blocks that
 * cycle the load — Base, Build, Load, Absorb — so the body gets three weeks
 * of rising stress and one to bank it. Each block runs a little bigger than
 * the last (5% a block, capped after three) so fitness keeps climbing without
 * a race to aim at.
 *
 * Picking a race date overrides the last three weeks before it: Peak, Taper,
 * Race week, then the race. The day after, the cycle starts over from that
 * race — a picked date that has passed becomes the new anchor on its own.
 *
 * Two quality sessions a week (Wednesday bike, Saturday long ride) and
 * everything else easy. The weekday shape is fixed on purpose: the long
 * sessions sit on the weekend so the hard training never lands on a deep-work
 * morning, and Monday is light so the week starts with a clear head.
 *
 * Pure and deterministic by date, like the static plan it continues.
 */

export type CycleKind = 'Base' | 'Build' | 'Load' | 'Absorb'
const CYCLE: CycleKind[] = ['Base', 'Build', 'Load', 'Absorb']

/** Volume multiplier for each kind of week */
const LOAD: Record<CycleKind | 'Peak' | 'Taper', number> = {
  Base: 0.85,
  Build: 0.95,
  Load: 1.05,
  Absorb: 0.6,
  Peak: 1.1,
  Taper: 0.65,
}

/** Days of recovery after a race before the first block can start */
const RECOVERY_DAYS = 14

// ── Date math (UTC, so DST never shifts a day) ───────────────────────────

const toMs = (d: string) => Date.parse(d + 'T00:00:00Z')
export function addDays(date: string, n: number): string {
  return new Date(toMs(date) + n * 86400000).toISOString().slice(0, 10)
}
export function daysBetween(from: string, to: string): number {
  return Math.round((toMs(to) - toMs(from)) / 86400000)
}
/** 0 = Sunday … 6 = Saturday */
const dow = (date: string) => new Date(toMs(date)).getUTCDay()

// ── Session builders ──────────────────────────────────────────────────────

// Rough training speeds, only to print a distance next to a duration.
const KM_PER_MIN: Record<'swim' | 'bike' | 'run', number> = { swim: 0.045, bike: 0.43, run: 1 / 6.2 }

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

function session(
  sport: Sport,
  title: string,
  detail: string,
  durationMin: number,
  zone: Zone,
  key?: boolean
): PlannedSession {
  const km =
    sport === 'swim' || sport === 'bike' || sport === 'run'
      ? Math.round(durationMin * KM_PER_MIN[sport] * (sport === 'swim' ? 10 : 1)) / (sport === 'swim' ? 10 : 1)
      : undefined
  return { sport, title, detail, durationMin, zone, distanceKm: km || undefined, key }
}

const rest = (title: string, detail: string): PlannedSession =>
  ({ sport: 'rest', title, detail, durationMin: 0, zone: '-' })

const clock = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}` : `${min}min`)

// ── Recovery after a race ─────────────────────────────────────────────────

function recoveryDay(since: number, date: string): { focus: string; sessions: PlannedSession[] } {
  if (since <= 2) {
    return {
      focus: 'Post-race — do nothing',
      sessions: [rest('Rest — walk only', 'Walk 20-30min, eat well, sleep long. The muscle damage from a 70.3 takes days to clear; training now only delays it.')],
    }
  }
  if (since <= 7) {
    const day: Record<number, { focus: string; sessions: PlannedSession[] }> = {
      3: { focus: 'First movement', sessions: [session('swim', 'Easy swim 25min', 'Loose, any stroke, no clock. Water takes the load off the legs.', 25, 'Z1')] },
      4: { focus: 'Rest', sessions: [rest('Rest', 'Walk if you like. If the legs still ache on stairs, they are still repairing.')] },
      5: { focus: 'Flush the legs', sessions: [session('bike', 'Easy spin 40min', 'High cadence, light gear, never above conversation.', 40, 'Z1')] },
      6: { focus: 'Easy water', sessions: [session('swim', 'Easy swim 30min', 'Technique only — long exhale, high elbow. Stop before it feels like work.', 30, 'Z1')] },
      7: { focus: 'Rest', sessions: [rest('Rest', 'Full rest. The first week back is about sleep and food, not fitness.')] },
    }
    return day[since]
  }
  // Second week: easy, short, every sport — no intensity until the block starts.
  const week: Record<number, { focus: string; sessions: PlannedSession[] }> = {
    1: { focus: 'Rest', sessions: [rest('Rest', 'Full rest day.')] },
    2: { focus: 'Easy run', sessions: [session('run', 'Easy run 30min', 'Truly easy. If the pace feels slow, it is right.', 30, 'Z1')] },
    3: { focus: 'Aerobic ride', sessions: [session('bike', 'Ride 60min Z2', 'Steady and conversational, flat route.', 60, 'Z2')] },
    4: {
      focus: 'Swim + strength',
      sessions: [
        session('swim', 'Swim 40min Z2', 'Continuous 200s with 20s rest. Smooth, not fast.', 40, 'Z2'),
        session('strength', 'Core + mobility 20min', 'Planks, side planks, glute bridges, hip mobility. Light.', 20, '-'),
      ],
    },
    5: { focus: 'Rest', sessions: [rest('Rest', 'Full rest day.')] },
    6: { focus: 'Long-ish ride, easy', sessions: [session('bike', 'Ride 90min Z2', 'The longest session since the race. Easy all the way — this is reopening, not training.', 90, 'Z2')] },
    0: { focus: 'Easy run', sessions: [session('run', 'Run 45min Z2', 'Conversational the whole way. Finish feeling you could go again.', 45, 'Z2')] },
  }
  return week[dow(date)]
}

// ── The training week ─────────────────────────────────────────────────────

type WeekKind = CycleKind | 'Peak' | 'Taper'

const WED_SET: Record<WeekKind, { title: string; detail: string; base: number; zone: Zone }> = {
  Base: { title: '3x10min tempo', detail: 'Warm-up 15min. 3x10min at Z3 (comfortably hard), 5min easy between. Cool down.', base: 70, zone: 'Z3' },
  Build: { title: '4x10min race effort', detail: 'Warm-up 15min. 4x10min at race effort, 4min easy between. Even pacing — the last rep as strong as the first.', base: 70, zone: 'race' },
  Load: { title: '3x15min race effort', detail: 'Warm-up 15min. 3x15min at race effort, 5min easy between. Fuel 30g carbs during.', base: 70, zone: 'race' },
  Absorb: { title: '4x4min, crisp', detail: 'Warm-up 15min. 4x4min at race effort, 4min easy between. Short enough to stay sharp without adding fatigue.', base: 70, zone: 'race' },
  Peak: { title: '2x25min race effort', detail: 'Warm-up 15min. 2x25min at race effort, 5min easy between. The longest sustained effort of the block.', base: 70, zone: 'race' },
  Taper: { title: '3x8min race effort', detail: 'Warm-up 15min. 3x8min at race effort, 4min easy between. Keep the intensity, lose the volume.', base: 70, zone: 'race' },
}

const SAT_NOTE: Record<WeekKind, string> = {
  Base: 'All Z2. Fuel 40-60g carbs per hour from the first hour — the long ride is where under-fueling turns into a wasted Sunday.',
  Build: 'Z2, with 2x20min at race effort in the second half. 60g carbs per hour.',
  Load: 'Z2, with 2x30min at race effort in the second half. 60-70g carbs per hour — rehearse race fueling.',
  Absorb: 'Easy Z2 the whole way. A recovery week ride, not a test.',
  Peak: 'Z2 with 3x20min at race effort. Full race fueling and race kit. The dress rehearsal for the bike.',
  Taper: 'Z2 with 2x15min at race effort. Shorter, still sharp.',
}

function trainingDay(date: string, kind: WeekKind): { focus: string; sessions: PlannedSession[] } {
  const m = (base: number) => round5(base * LOAD[kind])
  const light = kind === 'Absorb'
  switch (dow(date)) {
    case 1: // Monday — the light day, clear head for the week
      return light
        ? { focus: 'Rest', sessions: [rest('Rest', 'Recovery week. Full rest.')] }
        : { focus: 'Technique swim', sessions: [session('swim', `Swim ${clock(m(40))} technique`, 'Drills + easy 100s. Long exhale, high elbow, relaxed kick. Should leave you fresher than you started.', m(40), 'Z1')] }
    case 2:
      return {
        focus: 'Easy run',
        sessions: [session('run', `Easy run ${clock(m(50))} + strides`, 'Conversational the whole way, then 6x20s strides — fast and relaxed, full recovery between. Easy means easy: this is where most of the run fitness comes from.', m(50), 'Z2')],
      }
    case 3: {
      const w = WED_SET[kind]
      return {
        focus: 'Bike quality — key session',
        sessions: [session('bike', `Bike ${clock(m(w.base))}: ${w.title}`, `${w.detail} Do it after the morning's thinking work, not before.`, m(w.base), w.zone, true)],
      }
    }
    case 4:
      return {
        focus: 'Swim + strength',
        sessions: light
          ? [session('swim', `Swim ${clock(m(50))} easy`, 'Continuous, smooth. No sets.', m(50), 'Z1')]
          : [
              session('swim', `Swim ${clock(m(50))}: race-pace 100s`, kind === 'Base'
                ? 'Warm-up 400m. 8x100m steady (Z2) with 20s rest. Cool 200m.'
                : 'Warm-up 400m. 10x100m at race pace with 15s rest. Cool 200m. Lock in the rhythm.', m(50), kind === 'Base' ? 'Z2' : 'race'),
              session('strength', 'Strength + core 30min', 'Squats, single-leg deadlifts, step-ups, planks. Moderate weight — strength supports the bike and run, it should not cost them.', 30, '-'),
            ],
      }
    case 5:
      return light
        ? { focus: 'Rest', sessions: [rest('Rest', 'Recovery week. Full rest.')] }
        : { focus: 'Easy spin', sessions: [session('bike', `Easy spin ${clock(m(50))}`, 'Z1, high cadence. Loosens the legs before the weekend.', m(50), 'Z1')] }
    case 6: {
      const ride = m(160)
      const sessions = [session('bike', `Long ride ${clock(ride)}`, SAT_NOTE[kind], ride, kind === 'Base' || light ? 'Z2' : 'mixed', true)]
      if (kind === 'Load' || kind === 'Peak') {
        sessions.push(session('run', 'Brick run 20min', 'Straight off the bike, Z2. Learn what the first km of the race run feels like.', 20, 'Z2'))
      }
      return { focus: 'Long ride — key session', sessions }
    }
    default: {
      const run = m(80)
      const finish = kind === 'Load' || kind === 'Peak'
        ? ' Last 20min at race pace — practice holding form when tired.'
        : ''
      return {
        focus: 'Long run',
        sessions: [session('run', `Long run ${clock(run)}`, `Z2, flat to rolling.${finish} Gels every 30-40min from the first hour.`, run, finish ? 'mixed' : 'Z2', kind === 'Load' || kind === 'Peak')],
      }
    }
  }
}

/** Scale a day's sessions by block growth (the template is already sized by week kind) */
function grow(sessions: PlannedSession[], growth: number): PlannedSession[] {
  if (growth === 1) return sessions
  return sessions.map((x) => {
    if (x.sport === 'rest' || x.sport === 'strength' || x.durationMin === 0) return x
    const durationMin = round5(x.durationMin * growth)
    const distanceKm = x.distanceKm != null ? Math.round(x.distanceKm * growth * 10) / 10 : undefined
    return { ...x, durationMin, distanceKm, title: x.title.replace(/\d+h\d*|\d+min/, clock(durationMin)) }
  })
}

// ── Race week ─────────────────────────────────────────────────────────────

function raceWeekDay(daysOut: number, target: TargetRace): { focus: string; sessions: PlannedSession[] } {
  const name = target.name || 'the race'
  const days: Record<number, { focus: string; sessions: PlannedSession[] }> = {
    6: { focus: 'Race week — swim feel', sessions: [session('swim', 'Swim 30min + race-pace 50s', 'Easy 20min, then 6x50m at race pace. Short and sharp.', 30, 'race')] },
    5: { focus: 'Race week — bike opener', sessions: [session('bike', 'Bike 60min: 3x5min race effort', 'Everything easy except the three efforts. Check the bike works properly.', 60, 'race')] },
    4: { focus: 'Race week — run opener', sessions: [session('run', 'Run 35min: 4x2min race pace', 'Easy, with four short efforts at race pace. Legs should feel springy.', 35, 'race')] },
    3: { focus: 'Race week — easy', sessions: [session('swim', 'Easy swim 25min', 'Loose. If travel is today, skip it and walk instead.', 25, 'Z1')] },
    2: { focus: 'Opener', sessions: [session('bike', 'Spin 20min + jog 10min with strides', 'Wake the body up, nothing more. Two nights before is the sleep that matters most.', 30, 'Z1')] },
    1: { focus: 'Rest + logistics', sessions: [rest('Rest + race prep', `Bike check-in, numbers, nutrition packed for ${name}. Off your feet. Carb-rich dinner, early night.`)] },
  }
  return days[daysOut]
}

function raceDay(target: TargetRace): PlannedSession[] {
  return [{
    sport: 'brick',
    title: `RACE: ${target.name || '70.3'} — 1.9km / 90km / 21.1km`,
    detail: 'Settle the swim in the first 200m. Cap the first 20km of the bike. 70g carbs per hour. Conservative first 5km of the run, then race from km 14.',
    durationMin: 330,
    zone: 'race',
    distanceKm: 113,
    key: true,
  }]
}

// ── Public ────────────────────────────────────────────────────────────────

export interface CyclePosition {
  /** Most recent race on or before this date — the cycle restarts from it */
  anchor: string
  /** Monday the first block starts */
  cycleStart: string
  /** 1-based block number; null during recovery */
  block: number | null
  /** 1-4 within the block; null during recovery */
  week: number | null
  kind: CycleKind | null
  /** First day of the current block (or of recovery) — the window volume is counted over */
  blockStart: string
}

export function cyclePosition(date: string, raceDates: string[]): CyclePosition {
  const anchor = raceDates.filter((d) => d < date).sort().pop() ?? raceDates.sort()[0]
  const earliest = addDays(anchor, RECOVERY_DAYS + 1)
  const cycleStart = addDays(earliest, (8 - dow(earliest)) % 7) // next Monday on or after
  if (date < cycleStart) {
    return { anchor, cycleStart, block: null, week: null, kind: null, blockStart: addDays(anchor, 1) }
  }
  const weeksIn = Math.floor(daysBetween(cycleStart, date) / 7)
  const block = Math.floor(weeksIn / 4)
  return {
    anchor,
    cycleStart,
    block: block + 1,
    week: (weeksIn % 4) + 1,
    kind: CYCLE[weeksIn % 4],
    blockStart: addDays(cycleStart, block * 28),
  }
}

/**
 * A generated plan day for any date after the static plan ends. `raceDates`
 * are every race already on the calendar (anchors), `target` the picked next
 * race if there is one.
 */
export function cycleDay(date: string, raceDates: string[], target: TargetRace | null): PlanDay {
  const anchors = target && target.date < date ? [...raceDates, target.date] : raceDates
  const pos = cyclePosition(date, anchors)
  // Peak and Taper scale with the block too, so a race late in the cycle
  // peaks above the Load weeks that came before it, not below them.
  const growth = 1 + 0.05 * Math.min((pos.block ?? 1) - 1, 3)

  if (target && target.date >= date) {
    const out = daysBetween(date, target.date)
    if (out === 0) return { date, phase: 'Race', focus: `Race day — ${target.name || 'the next 70.3'}`, sessions: raceDay(target) }
    if (out <= 6) return { date, phase: 'Race week', ...raceWeekDay(out, target) }
    if (out <= 20) {
      const kind = out <= 13 ? 'Taper' : 'Peak'
      const d = trainingDay(date, kind)
      return { date, phase: kind, focus: `${d.focus} · ${out} days out`, sessions: grow(d.sessions, growth) }
    }
  }

  if (pos.kind == null) {
    const since = daysBetween(pos.anchor, date)
    return { date, phase: 'Recover', ...recoveryDay(since, date) }
  }
  const d = trainingDay(date, pos.kind)
  return {
    date,
    phase: pos.kind,
    focus: `${d.focus} · block ${pos.block}, week ${pos.week}/4`,
    sessions: grow(d.sessions, growth),
  }
}
