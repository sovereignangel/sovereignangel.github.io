/**
 * Daily Orders — what the watch shows, assembled once on the server.
 *
 * The source of truth is `buildLordasOrders()`, the same assembly behind
 * lordas.loricorpuz.com/exec. That page answers for two athletes; the watch
 * answers for one, so this module picks a person out of the pair and flattens
 * their half. Nothing here recomputes wind or training — if the page and the
 * wrist ever disagree, it is a bug in this projection, not a second opinion.
 *
 * Two phases, matching the review rhythm that already runs on cron:
 *
 *   morning  — how the body is, what today's kite windows are, and the session
 *              that was promised last night, plus anything that has since
 *              changed and why.
 *   evening  — what actually got done, how the body took it, and tomorrow's
 *              full plan: kite windows, drills, session.
 *
 * The "changed since last night" lines come from a promise ledger: each
 * evening writes what it committed to for tomorrow, and each morning diffs
 * against it. Without that, a forecast that moved overnight looks identical to
 * one that never moved, and the watch quietly stops being trustworthy.
 */

import { precipLabel } from '@/lib/kite/lithuania-spots'
import { buildLordasOrders, type LordasOrders } from '@/lib/lordas/exec'
import { loadAthleteData, athlete, type AthleteData } from '@/lib/lordas/athletes'
import type { AthletePrescription, PairDay } from '@/lib/lordas/pair-training'
import { todayLocal } from '@/lib/ironman/plan'
import { addDaysISO, fmtWindow, TIMEZONE, type ExecWindDay, type SpotStatus } from '@/lib/exec/windows'
import { computeKiteStats } from '@/lib/kite/belts'
import { nextMilestones } from '@/lib/kite/paths'
import type { Readiness } from '@/lib/ironman/adapt'
import type { GarminActivity, GarminMetrics, KiteSession, LordasPerson } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────

export type OrderPhase = 'morning' | 'evening'
export type Person = LordasPerson

export interface BodyBlock {
  /** Morning only — the number that decides whether the plan survives contact */
  sleepScore: number | null
  readiness: number | null
  band: Readiness['band']
  /** Short "sleep 71" / "hrv 58" strings, straight from the readiness factors */
  factors: string[]
  /** Acute load: total training load over the trailing 7 days */
  loadAcute: number | null
  /** Acute vs chronic (28d, scaled to a week). >1.3 is ramping, <0.8 is losing it. */
  loadRatio: number | null
  loadTrend: 'ramping' | 'steady' | 'detraining' | null
  enduranceScore: number | null
  /** Change vs a week ago — the direction matters more than the number */
  enduranceDelta: number | null
}

export interface KiteWindow {
  window: string
  spot: string
}

export interface KitePlan {
  spot: string
  area: string
  /** The 2h practice blocks, not the raw forecast window */
  windows: KiteWindow[]
  fullWindow: string
  avgKn: number
  gustKn: number
  dir: string
  kiteSize: string
  possible: boolean
  note: string
}

export interface TrainPlan {
  slot: string | null
  title: string
  detail: string
  durationMin: number
  zone: string
  sport: string
  pace: string | null
  /** Which discipline the remaining weeks belong to, and why — one line */
  why: string | null
  /** Minutes the two of them can do side by side */
  togetherMin: number
  adaptLevel: string
  adaptHeadline: string
  adjusted: boolean
}

export interface Drill {
  label: string
  drill: string
}

export interface DoneActivity {
  label: string
  detail: string
}

export interface DayPlan {
  kite: KitePlan | null
  drills: Drill[]
  train: TrainPlan | null
}

export interface DailyOrders {
  date: string
  person: Person
  personName: string
  phase: OrderPhase
  generatedAt: string
  generatedLabel: string
  /** One line for the glance */
  headline: string
  body: BodyBlock
  /** Morning: today's plan. Evening: what today was. */
  today: DayPlan
  /** Evening only — what the watch actually recorded */
  done: DoneActivity[]
  /** Evening only — the commitment the morning will be held to */
  tomorrow: DayPlan | null
  /** Morning only — how today differs from what last night promised */
  changed: { kite: string | null; train: string | null }
  spots: SpotStatus[]
  race: { name: string; days: number } | null
  windStale: boolean
}

/** What an evening commits to, so the next morning can diff against it. */
export interface DayPromise {
  kiteSpot: string | null
  kiteWindows: string[]
  trainTitle: string | null
  trainSlot: string | null
  trainMinutes: number
}

// ── Phase ─────────────────────────────────────────────────────────────────

// 20:00 Palanga, not 17:00 — the evening cron fires then, and a kite window
// can legitimately run to 21h. Flipping to "log the day" while the window is
// still open would ask you to close out a session you are still riding.
const EVENING_FROM_HOUR = 20

export function currentPhase(now: Date = new Date()): OrderPhase {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', hour12: false }).format(now)
  )
  return hour >= EVENING_FROM_HOUR ? 'evening' : 'morning'
}

// ── Small helpers ─────────────────────────────────────────────────────────

/** Cap a string for the watch without cutting a word in half. */
function clip(text: string, max: number): string {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[.,;:—-]$/, '') + '…'
}

function round(n: number, dp = 0): number {
  const f = Math.pow(10, dp)
  return Math.round(n * f) / f
}

// ── Body block ────────────────────────────────────────────────────────────

const LOAD_ACUTE_DAYS = 7
const LOAD_CHRONIC_DAYS = 28

function loadOver(activities: GarminActivity[], from: string, to: string): number {
  return activities
    .filter((a) => a.date && a.date > from && a.date <= to)
    .reduce((sum, a) => sum + (a.trainingLoad ?? 0), 0)
}

/**
 * Most recent non-null value at or before `date`, within `lookback` days.
 *
 * Garmin writes the day's document before every field is populated, so today's
 * doc routinely exists with a null sleepScore for a few hours after waking. A
 * plain `byDate.get(date)` therefore reports "no sleep data" on exactly the
 * morning the number matters most.
 */
function recent(
  byDate: Map<string, GarminMetrics>,
  field: 'sleepScore' | 'enduranceScore',
  date: string,
  lookback = 3
): number | null {
  for (let i = 0; i <= lookback; i += 1) {
    const v = byDate.get(addDaysISO(date, -i))?.[field]
    if (v !== null && v !== undefined) return v
  }
  return null
}

function bodyBlock(
  data: AthleteData,
  readiness: Readiness,
  date: string,
  phase: OrderPhase
): BodyBlock {
  const byDate = new Map(
    data.metrics.filter((m) => m.date).map((m) => [m.date, m] as [string, GarminMetrics])
  )

  const acute = loadOver(data.activities, addDaysISO(date, -LOAD_ACUTE_DAYS), date)
  const chronicTotal = loadOver(data.activities, addDaysISO(date, -LOAD_CHRONIC_DAYS), date)
  // Chronic scaled to the same window length as acute, so the ratio reads as
  // "this week against a normal week" rather than against a month.
  const chronicWeekly = chronicTotal / (LOAD_CHRONIC_DAYS / LOAD_ACUTE_DAYS)
  const ratio = chronicWeekly > 0 ? acute / chronicWeekly : null

  let trend: BodyBlock['loadTrend'] = null
  if (ratio !== null) {
    trend = ratio > 1.3 ? 'ramping' : ratio < 0.8 ? 'detraining' : 'steady'
  }

  const endurance = recent(byDate, 'enduranceScore', date)
  const enduranceThen = recent(byDate, 'enduranceScore', addDaysISO(date, -7))

  return {
    // The evening has nothing to say about last night's sleep that the morning
    // did not already say, so it is dropped from that half.
    sleepScore: phase === 'morning' ? recent(byDate, 'sleepScore', date, 1) : null,
    readiness: readiness.score,
    band: readiness.band,
    factors: readiness.factors.slice(0, 4).map((f) => clip(`${f.label} ${f.value}`, 26)),
    loadAcute: acute > 0 ? round(acute) : null,
    loadRatio: ratio !== null ? round(ratio, 2) : null,
    loadTrend: trend,
    enduranceScore: endurance,
    enduranceDelta: endurance !== null && enduranceThen !== null ? endurance - enduranceThen : null,
  }
}

// ── Activities accomplished ───────────────────────────────────────────────

const ACTIVITY_WORD: Record<string, string> = {
  kiteboarding: 'Kiting',
  kiteboarding_v2: 'Kiting',
  kite_surfing: 'Kiting',
  wind_kite_surfing: 'Kiting',
  lap_swimming: 'Swim',
  open_water_swimming: 'Swim',
  running: 'Run',
  treadmill_running: 'Run',
  trail_running: 'Run',
  cycling: 'Bike',
  road_biking: 'Bike',
  indoor_cycling: 'Bike',
  virtual_ride: 'Bike',
  strength_training: 'Strength',
  yoga: 'Yoga',
  walking: 'Walk',
  hiking: 'Hike',
}

function activityWord(type: string): string {
  if (ACTIVITY_WORD[type]) return ACTIVITY_WORD[type]
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * "Kiting 2h" / "Swim 2.0k" — the shape the day is remembered in. Distance
 * leads for the measured sports because that is the number worth logging;
 * everything else reports time.
 */
function doneToday(activities: GarminActivity[], date: string): DoneActivity[] {
  return activities
    .filter((a) => a.date === date)
    .map((a) => {
      const word = activityWord(a.type)
      const min = Math.round((a.durationSeconds ?? 0) / 60)
      const km = a.distanceMeters ? a.distanceMeters / 1000 : null
      const time = min >= 90 ? `${round(min / 60, 1)}h` : `${min}min`

      let label = `${word} ${time}`
      if (km !== null && km > 0.2) {
        const isSwim = word === 'Swim'
        label = isSwim ? `${word} ${round(km, 1)}k` : `${word} ${round(km, 1)}km`
      }

      const bits: string[] = []
      if (km !== null && km > 0.2) bits.push(time)
      if (a.averageHr) bits.push(`${a.averageHr} bpm`)
      if (a.trainingLoad) bits.push(`load ${round(a.trainingLoad)}`)

      return { label: clip(label, 28), detail: clip(bits.join(' · '), 40) }
    })
}

// ── Kite / drills / training projections ──────────────────────────────────

function kitePlanOf(wind: ExecWindDay): KitePlan | null {
  const p = wind.pick
  if (!p) return null

  const notes: string[] = []
  if (p.drizzleMm !== undefined) notes.push(`${precipLabel(p.drizzleMm)} — ride through it`)
  if (wind.note) notes.push(wind.note)

  return {
    spot: p.spotName,
    area: p.area,
    windows: wind.blocks.map((b) => ({ window: fmtWindow(b.startHour, b.endHour), spot: b.spotName })),
    fullWindow: fmtWindow(p.startHour, p.endHour),
    avgKn: p.avgKn,
    gustKn: p.gustKn,
    dir: p.dirLabel,
    kiteSize: p.kiteSize,
    possible: p.possible,
    note: clip(notes.join(' · '), 90),
  }
}

function prescriptionFor(pair: PairDay, person: Person): AthletePrescription | null {
  return pair.athletes.find((a) => a.person === person) ?? null
}

function trainPlanOf(pair: PairDay, person: Person, wind: ExecWindDay): TrainPlan | null {
  const rx = prescriptionFor(pair, person)
  if (!rx) return null

  const working = rx.sessions.filter((s) => s.sport !== 'rest')
  if (working.length === 0) {
    return {
      slot: null,
      title: 'Rest',
      detail: clip(rx.adaptNote || 'Full rest. Recovery is the session.', 120),
      durationMin: 0,
      zone: '-',
      sport: 'rest',
      pace: null,
      why: clip(rx.rebalance.headline, 90),
      togetherMin: 0,
      adaptLevel: rx.adaptLevel,
      adaptHeadline: clip(rx.adaptHeadline, 60),
      adjusted: false,
    }
  }

  const lead = working[0]
  const total = working.reduce((sum, s) => sum + s.durationMin, 0)
  const slot = ironmanSlotFor(total, wind)

  return {
    slot,
    title: clip(working.map((s) => s.title).join(' + '), 52),
    detail: clip(working.map((s) => s.detail).join(' '), 160),
    durationMin: total,
    zone: lead.zone,
    sport: lead.sport,
    pace: lead.pace,
    why: clip(rx.rebalance.headline, 90),
    togetherMin: pair.togetherMin,
    adaptLevel: rx.adaptLevel,
    adaptHeadline: clip(rx.adaptHeadline, 60),
    adjusted: working.some((s) => s.adjusted),
  }
}

/** Default 07:00 start; slides past the last kite block when they collide. */
function ironmanSlotFor(durationMin: number, wind: ExecWindDay): string | null {
  if (durationMin <= 0) return null
  let startMin = 7 * 60
  const overlaps = (s: number) =>
    wind.blocks.some((b) => s < b.endHour * 60 && s + durationMin > b.startHour * 60)
  if (overlaps(startMin)) {
    startMin = Math.max(...wind.blocks.map((b) => b.endHour)) * 60 + 30
  }
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  return `${fmt(startMin)}–${fmt(startMin + durationMin)}`
}

async function drillsFor(person: Person, data: AthleteData): Promise<Drill[]> {
  const { adminDb } = await import('@/lib/firebase-admin')
  const base =
    person === 'lori'
      ? adminDb.collection('users').doc(process.env.FIREBASE_UID as string)
      : adminDb.collection('lordas_athletes').doc(person)

  let manual: KiteSession[] = []
  let milestones: Record<string, boolean> = {}
  try {
    const [sessionsSnap, progressSnap] = await Promise.all([
      base.collection('kite_sessions').get(),
      base.collection('kite_progress').doc('milestones').get(),
    ])
    manual = sessionsSnap.docs.map((d) => ({ ...(d.data() as Omit<KiteSession, 'id'>), id: d.id }))
    milestones = (progressSnap.exists ? (progressSnap.data() as { milestones?: Record<string, boolean> }) : null)?.milestones ?? {}
  } catch {
    // No ladder for this athlete yet — the fundamentals are the right answer.
  }

  const fromGarmin: KiteSession[] = data.activities
    .filter((a) => a.date && ACTIVITY_WORD[a.type] === 'Kiting')
    .map((a) => ({
      id: `garmin-${a.activityId}`,
      date: a.date as string,
      hours: round((a.durationSeconds ?? 0) / 3600, 1),
      windKn: null,
      kiteSize: null,
      focus: 'garmin',
      notes: '',
      bestAirtimeSec: null,
      bestHeightM: null,
      bestDistanceM: null,
      jumps: null,
      landed: null,
    }) as KiteSession)
    .filter((s) => s.hours > 0)

  const stats = computeKiteStats([...manual, ...fromGarmin])
  return nextMilestones(stats, milestones, 3).map((m) => ({
    label: clip(m.milestone.label, 40),
    drill: clip(m.milestone.drill, 120),
  }))
}

// ── Promise diffing ───────────────────────────────────────────────────────

export function promiseOf(plan: DayPlan): DayPromise {
  return {
    kiteSpot: plan.kite?.spot ?? null,
    kiteWindows: plan.kite?.windows.map((w) => w.window) ?? [],
    trainTitle: plan.train?.title ?? null,
    trainSlot: plan.train?.slot ?? null,
    trainMinutes: plan.train?.durationMin ?? 0,
  }
}

/**
 * What moved between last night's commitment and this morning's answer.
 * Returns null when nothing changed — the caller shows nothing rather than a
 * reassuring "no change" line nobody reads.
 */
function diffKite(promised: DayPromise | null, now: KitePlan | null): string | null {
  if (!promised) return null
  const wasSpot = promised.kiteSpot
  const wasWindows = promised.kiteWindows.join(', ')

  if (!wasSpot && !now) return null
  if (!wasSpot && now) return `New window appeared: ${now.spot} ${now.windows.map((w) => w.window).join(', ')}`
  if (wasSpot && !now) return `Dropped — last night said ${wasSpot} ${wasWindows}`

  const nowWindows = now!.windows.map((w) => w.window).join(', ')
  if (wasSpot !== now!.spot) return `Moved: was ${wasSpot} ${wasWindows}, now ${now!.spot} ${nowWindows}`
  if (wasWindows !== nowWindows) return `Retimed at ${now!.spot}: was ${wasWindows}, now ${nowWindows}`
  return null
}

function diffTrain(promised: DayPromise | null, now: TrainPlan | null, body: BodyBlock): string | null {
  if (!promised || !promised.trainTitle || !now) return null

  const reasons: string[] = []
  if (promised.trainTitle !== now.title) reasons.push(`was ${clip(promised.trainTitle, 30)}`)
  else if (promised.trainMinutes !== now.durationMin) {
    reasons.push(`was ${promised.trainMinutes}min, now ${now.durationMin}min`)
  } else if (promised.trainSlot !== now.slot && now.slot) {
    reasons.push(`moved to ${now.slot}`)
  }

  if (reasons.length === 0) return null

  // Say why, not just what — the whole point of restating last night's plan is
  // that a change should be attributable to the body, not to a silent redraw.
  const why: string[] = []
  if (body.sleepScore !== null && body.sleepScore < 60) why.push(`sleep ${body.sleepScore}`)
  if (body.band === 'red' || body.band === 'amber') why.push(`readiness ${body.readiness}`)
  if (body.loadTrend === 'ramping') why.push('load ramping')
  if (body.band === 'green' && body.sleepScore !== null && body.sleepScore >= 75) why.push('recovered well')

  return clip(`${reasons.join(' · ')}${why.length ? ` — ${why.join(', ')}` : ''}`, 96)
}

// ── Public builder ────────────────────────────────────────────────────────

export async function buildDailyOrders(
  person: Person = 'lori',
  date: string = todayLocal(),
  now: Date = new Date(),
  promised: DayPromise | null = null
): Promise<DailyOrders> {
  const phase = currentPhase(now)

  const [lordas, data] = await Promise.all([
    buildLordasOrders(date, now),
    loadAthleteData(person),
  ])

  const rxToday = prescriptionFor(lordas.training.today, person)
  const readiness: Readiness = rxToday?.readiness ?? { score: null, band: 'unknown', factors: [] }
  const body = bodyBlock(data, readiness, date, phase)

  const windToday = lordas.wind.today.day
  const windTomorrow = lordas.wind.tomorrow.day

  const drills = await drillsFor(person, data)

  const today: DayPlan = {
    kite: kitePlanOf(windToday),
    drills,
    train: trainPlanOf(lordas.training.today, person, windToday),
  }

  const tomorrow: DayPlan | null =
    phase === 'evening'
      ? {
          kite: kitePlanOf(windTomorrow),
          drills,
          train: trainPlanOf(lordas.training.tomorrow, person, windTomorrow),
        }
      : null

  const done = phase === 'evening' ? doneToday(data.activities, date) : []

  const changed =
    phase === 'morning'
      ? { kite: diffKite(promised, today.kite), train: diffTrain(promised, today.train, body) }
      : { kite: null, train: null }

  const race = lordas.races.length ? { name: lordas.races[0].name, days: lordas.races[0].days } : null

  return {
    date,
    person,
    personName: athlete(person).name,
    phase,
    generatedAt: lordas.generatedAt,
    generatedLabel: lordas.generatedLabel,
    headline: headlineOf(phase, today, tomorrow, done),
    body,
    today,
    done,
    tomorrow,
    changed,
    spots: lordas.wind.today.statuses,
    race,
    windStale: lordas.wind.stale,
  }
}

/** The one line the glance shows. */
function headlineOf(phase: OrderPhase, today: DayPlan, tomorrow: DayPlan | null, done: DoneActivity[]): string {
  if (phase === 'evening') {
    const plan = tomorrow ?? today
    const parts: string[] = []
    if (plan.kite) parts.push(`Kite ${plan.kite.windows.map((w) => w.window).join('+') || plan.kite.fullWindow} ${plan.kite.spot}`)
    if (plan.train && plan.train.slot) parts.push(`${plan.train.sport.toUpperCase()} ${plan.train.slot.split('–')[0]}`)
    const head = parts.length ? `Tomorrow: ${parts.join(' · ')}` : 'Tomorrow: nothing scheduled'
    return done.length ? `${done.map((d) => d.label).join(' · ')} — ${head}` : head
  }

  const parts: string[] = []
  if (today.kite) parts.push(`KITE ${today.kite.windows.map((w) => w.window).join('+') || today.kite.fullWindow} ${today.kite.spot}`)
  if (today.train && today.train.slot) parts.push(`${today.train.sport.toUpperCase()} ${today.train.slot.split('–')[0]}`)
  else if (today.train && today.train.sport === 'rest') parts.push('REST')
  if (!parts.length) return 'No wind, no session — study and recover'
  return parts.join(' · ')
}

// ── Watch wire format ─────────────────────────────────────────────────────

const SPOT_STATE_CODE: Record<SpotStatus['state'], string> = {
  rideable: 'r',
  possible: 'p',
  hazard: 'h',
  flat: 'f',
}

function compactKite(k: KitePlan | null): Record<string, unknown> | undefined {
  if (!k) return undefined
  return {
    s: k.spot,
    a: k.area,
    w: k.windows.map((x) => (x.spot === k.spot ? x.window : `${x.window} ${x.spot}`)),
    fw: k.fullWindow,
    kn: k.avgKn,
    g: k.gustKn,
    dr: k.dir,
    sz: k.kiteSize,
    ...(k.possible ? { p: 1 } : {}),
    ...(k.note ? { n: k.note } : {}),
  }
}

function compactTrain(t: TrainPlan | null): Record<string, unknown> | undefined {
  if (!t) return undefined
  return {
    ...(t.slot ? { sl: t.slot } : {}),
    ti: t.title,
    du: t.durationMin,
    z: t.zone,
    sp: t.sport,
    dt: t.detail,
    ...(t.pace ? { pc: t.pace } : {}),
    ...(t.why ? { wy: t.why } : {}),
    ...(t.togetherMin > 0 ? { tg: t.togetherMin } : {}),
    ah: t.adaptHeadline,
    ...(t.adjusted ? { aj: 1 } : {}),
  }
}

function compactPlan(p: DayPlan | null): Record<string, unknown> | undefined {
  if (!p) return undefined
  const out: Record<string, unknown> = {}
  const k = compactKite(p.kite)
  if (k) out.k = k
  const t = compactTrain(p.train)
  if (t) out.t = t
  if (p.drills.length) out.dl = p.drills.map((d) => ({ l: d.label, d: d.drill }))
  return out
}

/**
 * Short-keyed projection for Connect IQ. Keys are two characters or fewer and
 * empty branches are dropped entirely, so the watch never allocates a
 * Dictionary slot for a field it will not draw.
 */
export function compactOrders(o: DailyOrders): Record<string, unknown> {
  const out: Record<string, unknown> = {
    v: 2,
    d: o.date,
    pr: o.person,
    ph: o.phase === 'evening' ? 'e' : 'm',
    hl: o.headline,
    gen: o.generatedLabel,
  }

  const b: Record<string, unknown> = { bd: o.body.band }
  if (o.body.sleepScore !== null) b.sl = o.body.sleepScore
  if (o.body.readiness !== null) b.rd = o.body.readiness
  if (o.body.factors.length) b.fx = o.body.factors
  if (o.body.loadAcute !== null) b.la = o.body.loadAcute
  if (o.body.loadRatio !== null) b.lr = o.body.loadRatio.toFixed(2)
  if (o.body.loadTrend) b.lt = o.body.loadTrend
  if (o.body.enduranceScore !== null) b.en = o.body.enduranceScore
  if (o.body.enduranceDelta !== null) b.ed = o.body.enduranceDelta
  out.b = b

  const today = compactPlan(o.today)
  if (today) out.td = today

  const tomorrow = compactPlan(o.tomorrow)
  if (tomorrow) out.tm = tomorrow

  if (o.done.length) out.dn = o.done.map((x) => ({ l: x.label, d: x.detail }))
  if (o.changed.kite) out.ck = o.changed.kite
  if (o.changed.train) out.ct = o.changed.train
  if (o.windStale) out.ws = 1
  if (o.spots.length) out.sp = o.spots.map((s) => ({ n: s.spotName, s: SPOT_STATE_CODE[s.state], l: s.label }))
  if (o.race) out.rc = { n: o.race.name, d: o.race.days }

  return out
}
