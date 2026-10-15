/**
 * The shape of GET /api/ironman/lordas/performance — types only.
 *
 * Mirrors `lib/share/ironman/performance.ts` in Lordas, which is the one home
 * of the data. Nothing on this side holds a race time, a fuel figure or a
 * training day; it renders what Lordas returns. Change the two together.
 */

export type Sport3 = 'swim' | 'bike' | 'run'
export type Verdict = 'held' | 'short' | 'missed' | 'extra' | 'rest' | 'upcoming'
export type Completion = 'missed' | 'partial' | 'accomplished'
export type PaceGrade = 'under' | 'met' | 'dominated'

export interface PerfLedgerRow {
  date: string
  verdict: Verdict
  focus: string
  planned: { sport: string; min: number; key: boolean }[]
  /** Everything Garmin saw, planned or not; `asked` false is work no plan asked for */
  recorded: { label: string; min: number; km: number | null; asked: boolean }[]
  plannedMin: number
  actualMin: number
}

export interface PerfWeekItem {
  date: string
  title: string
  zone: string | null
  plannedMin: number
  actualMin: number
  status: 'done' | 'partial' | 'missed' | 'extra'
  /** Held pace, formatted for the sport; null where no distance was recorded */
  pace: string | null
  /** Prescribed pace for that zone that week, formatted */
  target: string | null
}

export interface PerfSportWeek {
  sport: Sport3
  completion: Completion | null
  pace: PaceGrade | null
  plannedMin: number
  actualMin: number
  paceRatio: number | null
  items: PerfWeekItem[]
}

export interface PerfWeek {
  weekStart: string
  weekEnd: string
  inProgress: boolean
  sports: Record<Sport3, PerfSportWeek>
}

export interface PerfNote {
  date: string
  text: string
  rpe?: number
  createdAt: string
  reply?: string
  replySource?: 'computed' | 'llm'
}

export interface PerfTraining {
  today: string
  /** Days through today, newest first */
  ledger: PerfLedgerRow[]
  weeks: PerfWeek[]
  notes: Record<string, PerfNote>
  notesError: string | null
  summary: { days: number; held: number; missed: number; pctOfPlanned: number; noted: number }
}

export type RaceLeg = 'Swim' | 'T1' | 'Bike' | 'T2' | 'Run' | 'Finish'

export interface PerfLegLine {
  leg: RaceLeg
  sec: number
  prevBestSec: number | null
  /** Belgrade minus the previous best; negative is a new best */
  vsBestSec: number | null
  eliteSec: number | null
  /** Lori minus the winner */
  vsEliteSec: number | null
  /** Lori over the winner — 1.0 is level */
  eliteRatio: number | null
}

export interface PerfElite {
  name: string
  category: 'men' | 'women'
  race: string
  date: string
  totalSec: number
  transitionSec: number
  swimPace: string
  bikeSpeed: string
  runPace: string
}

export interface PerfScoreRow {
  leg: string
  expected: string
  actual: string
  verdict: string
  tone: 'ok' | 'warn' | 'crit' | 'none'
}

export interface PerfFuelRow {
  phase: string
  carbs: number | null
  carbTargetG: string
  /** g/h held, where the phase has a duration */
  carbRate: number | null
  carbTarget: string
  caffeine: number | null
  caffeineTarget: string
  kcal: string | null
  kcalPerHour: string | null
  trimp: number | null
  hrr: string | null
  note: string | null
}

export interface PerfHistoryCell {
  date: string
  sec: number | null
  /** 0 fastest in the row through 1 slowest; null where unranked or a single race */
  rank: number | null
  ranked: boolean
  mark: '*' | '†' | null
}

export interface PerfHistoryRace {
  race: string
  date: string
  swim: string
  bike: string
  run: string
  finish: string
  caveat: string | null
}

export interface PerfRace {
  race: {
    name: string
    venue: string
    date: string
    swimKm: number
    bikeKm: number
    runKm: number
    waterC: number
    airFromC: number
    airToC: number
  }
  athlete: { name: string; kg: number; finishSec: number }
  legs: PerfLegLine[]
  elite: PerfElite | null
  /** Legs from closest to the winner to furthest, by multiple */
  ranks: { leg: string; ratio: number }[]
  /** The reasoning behind the race sheet, for its detail panel */
  sheetNotes: string[]
  read: {
    title: string
    headline: string
    standard: string
    note: string
    rows: PerfScoreRow[]
    findings: { tag: string; title: string; body: string[] }[]
    levers: { lever: string; worth: string; cost: string; why: string }[]
    notOnTheList: string | null
  }
  fuel: {
    kg: number
    rows: PerfFuelRow[]
    carbTotal: number | null
    carbTargetTotal: string
    caffeineTotal: number | null
    caffeineTargetTotal: string
    /** Over the 6 mg/kg ceiling */
    caffeineOver: boolean
    caffeineTargetMgPerKg: number | null
    kcalTotal: string
    kcalPerHourTotal: string
    trimpTotal: number
    verdict: string
    gut: string | null
    basis: string
    energyMethod: { leg: string; method: string }[]
    energyNote: string | null
    load: { acuteBefore: number; acuteAfter: number; chronic: string; form: string; read: string } | null
    garminCaveats: string[]
  }
  history: {
    races: PerfHistoryRace[]
    rows: { leg: RaceLeg; cells: PerfHistoryCell[]; vsBestSec: number | null }[]
    latest: string
    reading: string[]
    footnotes: string[]
  }
  questions: { n: string; question: string; why: string }[]
}

export interface PerformanceShare {
  training: PerfTraining | null
  trainingError: string | null
  race: PerfRace
}

export interface PerformanceNoteResult {
  success: true
  reply: string
  source: 'computed' | 'llm'
}

