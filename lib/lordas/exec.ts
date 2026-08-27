/**
 * Lordas daily orders — the pair version of /exec.
 *
 * Same two questions as the solo page ("where do we kite, what do we train"),
 * answered once for two people. The wind half is genuinely shared: one coast,
 * one forecast, one window. The training half is one session with two
 * prescriptions, assembled in lib/lordas/pair-training.
 *
 * This module is the single assembly point, so the page, the API and the
 * Telegram brief can never disagree about what today's call was.
 */

import {
  fetchAllSpots,
  weekSessions,
  weekPossibles,
  precipLabel,
  type SpotForecast,
} from '@/lib/kite/lithuania-spots'
import { daysToRace, todayLocal, RACE, RACE_NYC } from '@/lib/ironman/plan'
import {
  addDaysISO,
  buildExecWindDay,
  spotStatuses,
  fmtWindow,
  TIMEZONE,
  type ExecWindDay,
  type SpotStatus,
} from '@/lib/exec/windows'
import { loadBothAthletes } from './athletes'
import { buildPairDay, type PairDay } from './pair-training'

export interface LordasWindDay {
  day: ExecWindDay
  statuses: SpotStatus[]
}

export interface RaceCountdown {
  name: string
  date: string
  days: number
}

export interface LordasOrders {
  date: string
  generatedAt: string
  generatedLabel: string
  /** One line covering both of you — the thing a notification leads with */
  headline: string
  wind: { today: LordasWindDay; tomorrow: LordasWindDay; stale: boolean }
  training: { today: PairDay; tomorrow: PairDay }
  races: RaceCountdown[]
}

function countdowns(date: string): RaceCountdown[] {
  return [RACE, RACE_NYC]
    .map((r) => ({ name: r.name, date: r.date, days: daysToRace(date, r.date) }))
    .filter((r) => r.days >= 0)
}

function headlineOf(wind: ExecWindDay, pair: PairDay): string {
  const parts: string[] = []
  if (wind.pick) {
    parts.push(`Kite ${fmtWindow(wind.pick.startHour, wind.pick.endHour)} at ${wind.pick.spotName}${wind.pick.possible ? ' (maybe)' : ''}`)
  }
  if (pair.restDay) parts.push('Rest day')
  else if (pair.togetherMin > 0) parts.push(`${pair.headline}`)
  else parts.push(pair.headline)
  if (!parts.length) return 'No wind, no session — recover'
  return parts.join(' · ')
}

export async function buildLordasOrders(
  date: string = todayLocal(),
  now: Date = new Date()
): Promise<LordasOrders> {
  const [forecastResult, athletes] = await Promise.all([
    fetchAllSpots().catch(() => null),
    loadBothAthletes(),
  ])

  const forecasts: SpotForecast[] = forecastResult ?? []
  const stale = forecastResult === null
  const tomorrow = addDaysISO(date, 1)

  const sessions = forecasts.length ? weekSessions(forecasts) : []
  const possibles = forecasts.length ? weekPossibles(forecasts) : []

  const windToday = buildExecWindDay(date, sessions, possibles)
  const windTomorrow = buildExecWindDay(tomorrow, sessions, possibles)

  const pairToday = buildPairDay(date, athletes)
  const pairTomorrow = buildPairDay(tomorrow, athletes)

  return {
    date,
    generatedAt: now.toISOString(),
    generatedLabel: new Intl.DateTimeFormat('en-GB', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now),
    headline: headlineOf(windToday, pairToday),
    wind: {
      today: { day: windToday, statuses: spotStatuses(date, forecasts) },
      tomorrow: { day: windTomorrow, statuses: spotStatuses(tomorrow, forecasts) },
      stale,
    },
    training: { today: pairToday, tomorrow: pairTomorrow },
    races: countdowns(date),
  }
}

// ── Notification text ─────────────────────────────────────────────────────

const SITE = 'https://lordas.loricorpuz.com'

/**
 * The morning brief, in plain text. Kite first — it is the only order the
 * weather can withdraw — then the shared session, then each athlete's own
 * numbers, then what to do about the gap between them.
 */
export function ordersMessage(o: LordasOrders): string {
  const lines: string[] = []
  const w = o.wind.today.day
  const p = o.training.today

  const race = o.races[0]
  lines.push(
    race
      ? `LORDAS — ${race.days} day${race.days === 1 ? '' : 's'} to ${race.name}`
      : 'LORDAS — daily orders'
  )
  lines.push('')

  // ── Kite ──
  if (o.wind.stale) {
    lines.push('KITE — forecast service unreachable, check the page before rigging.')
  } else if (w.pick) {
    const k = w.pick
    lines.push(`KITE — ${k.spotName} (${k.area})`)
    lines.push(`  ${fmtWindow(k.startHour, k.endHour)} · ${k.avgKn} kn, gusts ${k.gustKn} · ${k.dirLabel} · ${k.kiteSize}`)
    for (const b of w.blocks) {
      lines.push(`  Block: ${fmtWindow(b.startHour, b.endHour)} at ${b.spotName}`)
    }
    if (k.possible) lines.push('  Possible only — EU model alone sees this, recheck before you drive.')
    if (k.drizzleMm !== undefined) lines.push(`  ${precipLabel(k.drizzleMm)} in the window — still kiteable.`)
    if (w.note) lines.push(`  ${w.note}`)
  } else {
    lines.push('KITE — no rideable window today.')
  }
  lines.push('')

  // ── Training ──
  lines.push(`TRAIN — ${p.phase ?? 'off-plan'}${p.focus ? `: ${p.focus}` : ''}`)
  if (p.restDay) {
    lines.push('  Rest day for both of you. Recovery is the session.')
  } else {
    for (const s of p.planned.filter((x) => x.sport !== 'rest')) {
      const meta = [
        s.durationMin > 0 ? `${s.durationMin}min` : null,
        s.distanceKm ? `${s.distanceKm}km` : null,
        s.zone !== '-' ? s.zone : null,
      ].filter(Boolean).join(' · ')
      lines.push(`  ${s.title}${meta ? ` (${meta})` : ''}`)
    }
    if (p.togetherMin > 0) lines.push(`  Together: ${p.togetherMin}min side by side.`)
  }
  lines.push('')

  // ── Per athlete ──
  for (const a of p.athletes) {
    const band = a.readiness.band === 'unknown' ? 'no data' : a.readiness.band.toUpperCase()
    lines.push(`${a.name.toUpperCase()} — readiness ${a.readiness.score ?? '--'}/100 (${band})`)
    lines.push(`  ${a.adaptHeadline}`)
    for (const s of a.sessions.filter((x) => x.sport !== 'rest')) {
      const meta = [
        `${s.durationMin}min`,
        s.distanceKm ? `${s.distanceKm}km` : null,
        s.zone !== '-' ? s.zone : null,
        s.pace,
      ].filter(Boolean).join(' · ')
      lines.push(`  ${s.title} — ${meta}`)
    }
    if (a.noData) lines.push('  No Garmin data synced — numbers are the printed plan, go by feel.')
    lines.push('')
  }

  // ── How to run it together ──
  if (p.divergence.length) {
    lines.push('TOGETHER')
    for (const d of p.divergence) lines.push(`  ${d}`)
    lines.push('')
  }

  // ── Tomorrow ──
  const t = o.wind.tomorrow.day
  lines.push(
    t.pick
      ? `Tomorrow: ${t.pick.spotName} ${fmtWindow(t.pick.startHour, t.pick.endHour)}, ${t.pick.avgKn} kn.`
      : 'Tomorrow: no wind window — plan around the session.'
  )
  lines.push(`${SITE}/exec`)

  return lines.join('\n')
}
