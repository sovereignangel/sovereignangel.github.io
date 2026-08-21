/**
 * Exec page scheduling — pure helpers that turn the wind planner's session
 * picks and the ironman plan into concrete calendar blocks for today and
 * tomorrow, plus Google Calendar deep links.
 *
 * Rules (agreed for /exec):
 * - Kiting: weekdays get one 2h block, weekends aim for two 2h blocks.
 *   Blocks are carved from the recommended spot's best window (windows are
 *   2-4h by construction); a second weekend block falls back to an
 *   alternate spot's window when the primary one is too short.
 * - Ironman: default start 07:00 Palanga time; if a kite block overlaps,
 *   the workout moves to right after the last kite block.
 */

import type { SessionPick } from '@/lib/kite/lithuania-spots'
import { kiteSizeHint } from '@/lib/kite/lithuania-spots'
import type { PlanDay } from '@/lib/ironman/plan'

export const TIMEZONE = 'Europe/Vilnius'

export interface KiteBlock {
  startHour: number
  endHour: number
  spotName: string
  spotSlug: string
  avgKn: number
  possible: boolean // EU model only — recheck before going
}

export interface ExecWindDay {
  date: string
  weekend: boolean
  pick: {
    spotName: string
    spotSlug: string
    area: string
    lat: number
    lon: number
    startHour: number
    endHour: number
    avgKn: number
    gustKn: number
    dirLabel: string
    kiteSize: string
    possible: boolean
  } | null
  blocks: KiteBlock[]
  alternates: { spotName: string; startHour: number; endHour: number; avgKn: number }[]
  note: string
}

export function addDaysISO(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function isWeekend(date: string): boolean {
  const dow = new Date(date + 'T12:00:00Z').getUTCDay()
  return dow === 0 || dow === 6
}

function pickToBlock(p: SessionPick, startHour: number, endHour: number, possible: boolean): KiteBlock {
  return { startHour, endHour, spotName: p.spot.name, spotSlug: p.spot.slug, avgKn: p.window.avgSpeedKn, possible }
}

/** Carve the day's practice blocks: one 2h block on weekdays, two on weekends when the wind allows. */
function carveBlocks(picks: SessionPick[], weekend: boolean, possible: boolean): { blocks: KiteBlock[]; note: string } {
  if (picks.length === 0) return { blocks: [], note: '' }
  const best = picks[0]
  const { startHour: s, endHour: e } = best.window
  const len = e - s
  const blocks: KiteBlock[] = [pickToBlock(best, s, Math.min(s + 2, e), possible)]
  let note = ''
  if (weekend) {
    if (len >= 4) {
      blocks.push(pickToBlock(best, e - 2, e, possible))
      note = 'Two blocks in the same window — rig once, rest between.'
    } else {
      // Second block from an alternate spot whose window extends past block 1
      const alt = picks.slice(1).find((p) => p.window.endHour - Math.max(p.window.startHour, blocks[0].endHour) >= 2)
      if (alt) {
        const altStart = Math.max(alt.window.startHour, blocks[0].endHour)
        blocks.push(pickToBlock(alt, altStart, altStart + 2, possible))
        note = `Second block at ${alt.spot.name} — the wind holds longer there.`
      } else {
        note = `Window is only ${len}h — one block today, make it count.`
      }
    }
  }
  return { blocks, note }
}

export function buildExecWindDay(
  date: string,
  sessions: SessionPick[],
  possibles: SessionPick[]
): ExecWindDay {
  const weekend = isWeekend(date)
  const dayPicks = sessions.filter((p) => p.date === date)
  const dayPossibles = possibles.filter((p) => p.date === date)
  const usingPossible = dayPicks.length === 0 && dayPossibles.length > 0
  const picks = dayPicks.length > 0 ? dayPicks : dayPossibles

  if (picks.length === 0) {
    return { date, weekend, pick: null, blocks: [], alternates: [], note: '' }
  }

  const best = picks[0]
  const { blocks, note } = carveBlocks(picks, weekend, usingPossible)
  return {
    date,
    weekend,
    pick: {
      spotName: best.spot.name,
      spotSlug: best.spot.slug,
      area: best.spot.area,
      lat: best.spot.lat,
      lon: best.spot.lon,
      startHour: best.window.startHour,
      endHour: best.window.endHour,
      avgKn: best.window.avgSpeedKn,
      gustKn: best.window.maxGustKn,
      dirLabel: best.window.directionLabel,
      kiteSize: kiteSizeHint(best.window.avgSpeedKn),
      possible: usingPossible,
    },
    blocks,
    alternates: picks.slice(1, 3).map((p) => ({
      spotName: p.spot.name,
      startHour: p.window.startHour,
      endHour: p.window.endHour,
      avgKn: p.window.avgSpeedKn,
    })),
    note,
  }
}

// ── Ironman slot ──────────────────────────────────────────────────────────

export interface IronmanSlot {
  startMin: number // minutes from midnight, Palanga time
  endMin: number
  moved: boolean // pushed later because a kite block claimed the morning
}

/** Total planned minutes for the day (rest days return 0). */
export function planDayMinutes(day: PlanDay): number {
  return day.sessions.filter((s) => s.sport !== 'rest').reduce((sum, s) => sum + s.durationMin, 0)
}

/** Default 07:00 start; slides to after the last kite block if they collide. */
export function ironmanSlot(day: PlanDay, blocks: KiteBlock[]): IronmanSlot | null {
  const dur = planDayMinutes(day)
  if (dur === 0) return null
  let startMin = 7 * 60
  let moved = false
  const overlaps = (s: number) => blocks.some((b) => s < b.endHour * 60 && s + dur > b.startHour * 60)
  if (overlaps(startMin)) {
    startMin = Math.max(...blocks.map((b) => b.endHour)) * 60 + 30
    moved = true
  }
  return { startMin, endMin: startMin + dur, moved }
}

export function fmtHourMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function fmtWindow(startHour: number, endHour: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(startHour)}–${pad(endHour)}h`
}

// ── Google Calendar links ─────────────────────────────────────────────────

function gcalStamp(date: string, minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${date.replace(/-/g, '')}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`
}

export function gcalUrl(opts: {
  title: string
  date: string // YYYY-MM-DD, Palanga-local
  startMin: number
  endMin: number
  details?: string
  location?: string
}): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates: `${gcalStamp(opts.date, opts.startMin)}/${gcalStamp(opts.date, opts.endMin)}`,
    ctz: TIMEZONE,
  })
  if (opts.details) params.set('details', opts.details)
  if (opts.location) params.set('location', opts.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
