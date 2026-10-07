import type { PlanDay, PlannedSession, Sport, Zone } from './plan'

/**
 * Lori's fixed week — her structure, not the shared rolling cycle.
 *
 * From Monday Oct 5 2026 her days come from here; Aidas stays on
 * lib/ironman/cycle.ts. The anchors are the clubs: BKTC track Tuesday 7AM,
 * BKTC threshold Thursday, All Ways group ride Saturday. Everything else is
 * placed around them so the three hard days never touch and the leg lifts
 * sit on the hard run days, never on a recovery day.
 *
 *   Mon  easy      swim technique + mobility           (no leg loading)
 *   Tue  HARD      BKTC track 7AM           · PM Glutes A
 *   Wed  easy      bike Z2 + handling       · PM Pull
 *   Thu  HARD      BKTC threshold           · PM Glutes B
 *   Fri  moderate  swim main set            · PM Push
 *   Sat  HARD      All Ways group ride
 *   Sun  easy      Z2 run 1h + easy swim + mobility
 *
 * Priority when sessions compete: bike > swim > run > strength > kiting.
 *
 * Four-week rhythm: weeks 1-2 as written, week 3 adds 5% (one more rep on
 * the track and threshold sets), week 4 cuts endurance volume 30% and drops
 * one set from every lift. Each block grows 5% on the last, capped after
 * three. The daily dose on top of this — readiness, kiting, missed lifts —
 * only ever takes load away; it never redesigns the week.
 *
 * Pure and deterministic by date.
 */

export const LORI_WEEK_FROM = '2026-10-05'

/**
 * Functional threshold power, watts. Null until the first 20-minute test
 * (Sun Oct 11) — bike targets print as %FTP until then, watts after.
 */
export const LORI_FTP_W: number | null = null

// ── Date math (UTC, so DST never shifts a day) ───────────────────────────

const toMs = (d: string) => Date.parse(d + 'T00:00:00Z')
const daysBetween = (from: string, to: string) => Math.round((toMs(to) - toMs(from)) / 86400000)
/** 0 = Sunday … 6 = Saturday */
const dow = (date: string) => new Date(toMs(date)).getUTCDay()

// ── Builders ──────────────────────────────────────────────────────────────

const KM_PER_MIN: Record<'swim' | 'bike' | 'run', number> = { swim: 0.045, bike: 0.33, run: 1 / 6.2 }
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)
const clock = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}` : `${min}min`

function session(sport: Sport, title: string, detail: string, durationMin: number, zone: Zone, key?: boolean): PlannedSession {
  const km =
    sport === 'swim' || sport === 'bike' || sport === 'run'
      ? Math.round(durationMin * KM_PER_MIN[sport] * (sport === 'swim' ? 10 : 1)) / (sport === 'swim' ? 10 : 1)
      : undefined
  return { sport, title, detail, durationMin, zone, distanceKm: km || undefined, key }
}

/** A power band as watts once FTP is known, %FTP until then */
function watts(lo: number, hi: number): string {
  if (LORI_FTP_W == null) return `${lo}-${hi}% FTP`
  return `${Math.round((LORI_FTP_W * lo) / 100)}-${Math.round((LORI_FTP_W * hi) / 100)} W`
}

// ── Lifts ─────────────────────────────────────────────────────────────────

/**
 * Three supersets each, 2 reps in reserve, ~45 min. Glutes A and B together
 * put about 19 hard sets a week on the glutes — inside the growth range —
 * while the rest of the session pays the triathlon: anti-rotation, hip
 * stability, calves for the run, lats and cuff for the swim.
 */
const LIFTS = {
  glutesA: {
    title: 'Glutes A',
    sets: [
      ['Hip thrust', 4, '6', 'Dead bug', 4, '8/side'],
      ['RDL', 3, '6-8', 'Copenhagen plank', 3, '20s/side'],
      ['Bulgarian split squat', 3, '8/side', 'Straight-knee calf raise', 3, '10'],
    ],
  },
  glutesB: {
    title: 'Glutes B',
    sets: [
      ['Single-leg RDL', 3, '8/side', 'Pallof press', 3, '10/side'],
      ['High step-up', 3, '8/side', 'Side plank leg lift', 3, '10/side'],
      ['Single-leg hip thrust', 3, '10/side', 'Bent-knee calf raise', 3, '12'],
    ],
  },
  pull: {
    title: 'Pull',
    sets: [
      ['Pull-up', 4, '5-6', 'Straight-arm pulldown', 4, '10'],
      ['Single-arm row', 3, '8/side', 'Face pull', 3, '15'],
      ['Half-kneeling single-arm lat pulldown', 3, '10', 'Band external rotation', 3, '15'],
    ],
  },
  push: {
    title: 'Push',
    sets: [
      ['DB bench', 4, '6-8', 'Band pull-apart', 4, '15'],
      ['Half-kneeling landmine press', 3, '8/side', 'Triceps pushdown', 3, '12'],
      ['Tempo push-up', 3, 'near-max', 'Ab wheel', 3, '8'],
    ],
  },
} as const

type LiftKey = keyof typeof LIFTS

function lift(key: LiftKey, when: string, deload: boolean): PlannedSession {
  const l = LIFTS[key]
  const cut = deload ? 1 : 0
  const pairs = l.sets
    .map(([a, aSets, ar, b, bSets, br], i) => {
      const n = String.fromCharCode(65 + i)
      return `${n}1 ${a} ${aSets - cut}x${ar} + ${n}2 ${b} ${bSets - cut}x${br}`
    })
    .join(' · ')
  const progression = deload
    ? 'Deload week: one set fewer on everything, same weights.'
    : 'Two reps in reserve on every set. When all sets reach the top of the range, add load next time.'
  return session('strength', `${l.title} — 3 supersets`, `${when} ${pairs}. ${progression}`, 45, '-')
}

// ── The week ──────────────────────────────────────────────────────────────

type WeekKind = 'Base' | 'Build' | 'Absorb'

function weekOf(date: string): { block: number; week: number; kind: WeekKind } {
  const weeksIn = Math.floor(daysBetween(LORI_WEEK_FROM, date) / 7)
  const week = (weeksIn % 4) + 1
  return { block: Math.floor(weeksIn / 4) + 1, week, kind: week === 4 ? 'Absorb' : week === 3 ? 'Build' : 'Base' }
}

function weekDay(date: string, kind: WeekKind, growth: number): { focus: string; sessions: PlannedSession[] } {
  const deload = kind === 'Absorb'
  const scale = growth * (kind === 'Build' ? 1.05 : deload ? 0.7 : 1)
  const m = (base: number) => round5(base * scale)
  const extraRep = kind === 'Build' ? ' Progression week: one more rep than last time.' : ''
  const easedSets = deload ? ' Deload week: cut the main set by a third.' : ''

  switch (dow(date)) {
    case 1:
      return {
        focus: 'Easy — swim technique, no legs',
        sessions: [
          session('swim', `Swim ${clock(m(45))} technique`,
            'Drills + easy 100s: long exhale, high elbow, relaxed kick. Then 25min mobility — hips, T-spine, ankles, calves. No leg loading today.',
            m(45), 'Z1'),
        ],
      }
    case 2:
      return {
        focus: 'HARD — track + Glutes A',
        sessions: [
          session('run', 'BKTC track 7AM',
            `As coached. Warm-up jog + drills, the main set at the prescribed paces, cool-down. Even reps — do not race the group on rep 1.${extraRep}${easedSets}`,
            m(75), 'Z3', true),
          lift('glutesA', 'PM, 6+ hours after track.', deload),
        ],
      }
    case 3:
      return {
        focus: 'Easy — Z2 bike + skills, Pull',
        sessions: [
          session('bike', `Bike ${clock(m(80))} Z2 + handling`,
            `Z2 throughout (${watts(56, 75)}, conversational). Fold in handling: 4x1min spin-ups at 100+ rpm, drinking and looking back one-handed, cornering on a quiet loop. Easy on purpose — Tuesday and Thursday are the hard days either side.`,
            m(80), 'Z2'),
          lift('pull', 'PM, after the ride.', deload),
        ],
      }
    case 4:
      return {
        focus: 'HARD — threshold + Glutes B',
        sessions: [
          session('run', 'BKTC threshold',
            `As coached — comfortably hard, controlled breathing, the last rep as strong as the first.${extraRep}${easedSets}`,
            m(60), 'Z3', true),
          lift('glutesB', 'PM, 6+ hours after the run.', deload),
        ],
      }
    case 5:
      return {
        focus: 'Moderate — main swim set, Push',
        sessions: [
          session('swim', `Swim ${clock(m(50))}: main set`,
            `Warm-up 300 easy + 200 drill. Main: ${deload ? 6 : kind === 'Build' ? 9 : 8}x100 steady-hard, 20s rest — the week's quality swim, the second limiter. Cool 200 easy.`,
            m(50), 'Z3'),
          lift('push', 'PM, after the swim.', deload),
        ],
      }
    case 6:
      return {
        focus: 'HARD — All Ways group ride',
        sessions: [
          session('bike', 'All Ways group ride',
            `101 Bedford → Prospect Park, 5 loops, back: about 26mi / 42km, one climb a lap. Hold wheels, practise the handling, take turns only when it is steady. Cap the first 15min (${watts(60, 75)}) — the first 15min of Belgrade set the whole bike. Fuel 40-60g carbs per hour.`,
            m(150), 'mixed', true),
        ],
      }
    default:
      return {
        focus: 'Easy — Z2 run + easy swim',
        sessions: [
          session('run', `Z2 run ${clock(m(60))}`,
            'Conversational the whole way, flat to rolling. Finish feeling you could go again. Then 20min mobility.',
            m(60), 'Z2'),
          session('swim', `Easy swim ${clock(m(30))}`, 'Continuous, smooth, no clock.', m(30), 'Z1'),
        ],
      }
  }
}

/** Dated one-offs that replace a template day */
function override(date: string): { focus: string; sessions: PlannedSession[] } | null {
  if (date === '2026-10-10') {
    return {
      focus: 'All Ways recruitment ride',
      sessions: [
        session('bike', 'All Ways recruitment ride',
          '101 Bedford → Prospect Park, 5 loops, back: about 26mi / 42km. Pace unknown — treat it as the hard day, ride it steady, and fuel 40-60g carbs per hour. Tomorrow is the FTP test.',
          150, 'mixed', true),
      ],
    }
  }
  if (date === '2026-10-11') {
    return {
      focus: 'FTP test — only if readiness is green',
      sessions: [
        session('bike', 'FTP test — 20min',
          'Warm-up 15min with 3x1min at 100+ rpm, calibrate the Rally pedals. 5min hard (8/10), 10min easy. Then 20min as hard as you can hold evenly: start at ~140 W, raise 5-10 W after minute 5 if you can, empty it in the last 5. Lap button at start and end. Cool down 10min. FTP = 20-min average x 0.95. Turn off FTP auto-detect on the watch.',
          60, 'race', true),
        session('swim', 'Easy swim 30min (optional)', 'Loose and continuous. No run this week.', 30, 'Z1'),
      ],
    }
  }
  return null
}

/** Lori's plan day for a date on or after LORI_WEEK_FROM */
export function loriWeekDay(date: string): PlanDay {
  const { block, week, kind } = weekOf(date)
  const growth = 1 + 0.05 * Math.min(block - 1, 3)
  const d = override(date) ?? weekDay(date, kind, growth)
  const label = kind === 'Absorb' ? 'deload' : kind === 'Build' ? 'progression' : 'base'
  return { date, phase: kind, focus: `${d.focus} · block ${block}, week ${week}/4 (${label})`, sessions: d.sessions }
}

/** Where `date` sits in Lori's four-week rhythm, shaped like a CyclePosition */
export function loriWeekPosition(date: string) {
  const { block, week, kind } = weekOf(date)
  const blockStart = new Date(toMs(LORI_WEEK_FROM) + (block - 1) * 28 * 86400000).toISOString().slice(0, 10)
  return { anchor: LORI_WEEK_FROM, cycleStart: LORI_WEEK_FROM, block, week, kind, blockStart }
}
