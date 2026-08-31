/**
 * Campaign engine — pure functions over a Campaign and a set of finished
 * unit ids. No IO, no clock: the date is always passed in, so /exec, the
 * campaign's own page, and any future cron all read the same answer.
 *
 * Everything here is defensive on purpose. The campaign data is hand-edited
 * prose in a .ts file; a mistyped date or a duplicated id should degrade the
 * pace read, never throw inside a server render.
 */

import type {
  Campaign,
  CampaignBlock,
  CampaignOrder,
  CampaignUnit,
  Pace,
  Standing,
} from './types'

const ISO = /^\d{4}-\d{2}-\d{2}$/

export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO.test(value)) return false
  const d = new Date(value + 'T12:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

/**
 * Whole days from `a` to `b`. Parsed at UTC noon so a DST boundary inside the
 * range cannot round the difference to the wrong integer.
 */
export function daysBetweenISO(a: string, b: string): number {
  if (!isISODate(a) || !isISODate(b)) return 0
  const ms = Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')
  return Math.round(ms / 86_400_000)
}

/** Days in [a, b] counting both ends. 0 when b is before a. */
export function daysInclusive(a: string, b: string): number {
  const n = daysBetweenISO(a, b) + 1
  return n > 0 ? n : 0
}

function sessionsOf(unit: CampaignUnit): number {
  const n = unit.sessions
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 1
}

/**
 * Blocks in date order, with malformed dates dropped and unit ids deduped
 * across the whole campaign (first occurrence wins). A duplicated id would
 * otherwise let one check-off silently satisfy two units.
 */
export function normalizeBlocks(campaign: Campaign): CampaignBlock[] {
  const seen = new Set<string>()
  return campaign.blocks
    .filter((b) => isISODate(b.start) && isISODate(b.end) && b.start <= b.end)
    .slice()
    .sort((x, y) => (x.start < y.start ? -1 : x.start > y.start ? 1 : 0))
    .map((b) => ({
      ...b,
      units: b.units.filter((u) => {
        if (!u.id || seen.has(u.id)) return false
        seen.add(u.id)
        return true
      }),
    }))
}

/**
 * The block today's work comes from.
 *
 * Inside a block → that block, live. Before the first block, or in a gap
 * between two blocks → the next block, not yet open. Past the last block's
 * end → the last block, with the campaign over. A gap resolves forward
 * rather than back so a finished block never keeps issuing orders.
 */
export function blockFor(
  blocks: CampaignBlock[],
  date: string
): { block: CampaignBlock | null; phase: 'before' | 'live' | 'after' } {
  if (blocks.length === 0) return { block: null, phase: 'after' }
  if (!isISODate(date)) return { block: blocks[0], phase: 'before' }

  const live = blocks.find((b) => date >= b.start && date <= b.end)
  if (live) return { block: live, phase: 'live' }

  const next = blocks.find((b) => date < b.start)
  if (next) return { block: next, phase: 'before' }

  return { block: blocks[blocks.length - 1], phase: 'after' }
}

const AHEAD_RATIO = 0.7
const ON_LINE_RATIO = 1.05

function standingOf(needPerDay: number, sessionsPerDay: number, sessionsLeft: number): Standing {
  if (sessionsLeft <= 0) return 'clear'
  if (!Number.isFinite(needPerDay)) return 'behind'
  const perDay = sessionsPerDay > 0 ? sessionsPerDay : 1
  const ratio = needPerDay / perDay
  if (ratio <= AHEAD_RATIO) return 'ahead'
  if (ratio <= ON_LINE_RATIO) return 'on-line'
  return 'behind'
}

export function paceFor(
  block: CampaignBlock | null,
  done: ReadonlySet<string>,
  date: string,
  sessionsPerDay: number,
  phase: 'before' | 'live' | 'after'
): Pace {
  const units = block?.units ?? []
  const open = units.filter((u) => !done.has(u.id))
  const sessionsLeft = open.reduce((sum, u) => sum + sessionsOf(u), 0)

  // Before the block opens, the honest denominator is the block's whole span,
  // not the zero days you have inside it today.
  const daysLeft = !block
    ? 0
    : phase === 'live'
      ? daysInclusive(date, block.end)
      : phase === 'before'
        ? daysInclusive(block.start, block.end)
        : 0

  const needPerDay = sessionsLeft === 0 ? 0 : daysLeft > 0 ? sessionsLeft / daysLeft : Infinity

  return {
    sessionsLeft,
    unitsLeft: open.length,
    unitsDone: units.length - open.length,
    unitsTotal: units.length,
    daysLeft,
    needPerDay,
    standing: standingOf(needPerDay, sessionsPerDay, sessionsLeft),
  }
}

/**
 * Today's order: the live block, the next open units in it, and the pace.
 *
 * When the live block is clear, units spill forward from the next block so
 * the page never says "nothing to do" while a deadline is still standing.
 * Spilled units are flagged — working ahead should look different from
 * working on plan.
 */
export function campaignOrder(
  campaign: Campaign,
  done: ReadonlySet<string>,
  date: string,
  count = 2
): CampaignOrder {
  const blocks = normalizeBlocks(campaign)
  const { block, phase } = blockFor(blocks, date)
  const n = Math.max(1, Math.floor(count))

  const openIn = (b: CampaignBlock) => b.units.filter((u) => !done.has(u.id))

  let units: CampaignUnit[] = block ? openIn(block).slice(0, n) : []
  let spilled = false

  if (units.length < n && block) {
    const idx = blocks.indexOf(block)
    for (let i = idx + 1; i < blocks.length && units.length < n; i++) {
      const extra = openIn(blocks[i]).slice(0, n - units.length)
      if (extra.length > 0) {
        spilled = true
        units = units.concat(extra)
      }
    }
  }

  const all = blocks.flatMap((b) => b.units)

  return {
    campaign,
    block,
    phase,
    units,
    spilled,
    pace: paceFor(block, done, date, campaign.sessionsPerDay, phase),
    overall: { done: all.filter((u) => done.has(u.id)).length, total: all.length },
    daysToDestination: isISODate(campaign.destination.date)
      ? daysBetweenISO(date, campaign.destination.date)
      : 0,
  }
}

/** "on line · 7 left / 12 days" — the pace read, in words, for one line of UI. */
export function paceLabel(pace: Pace): string {
  if (pace.unitsTotal === 0) return 'no units'
  if (pace.standing === 'clear') return 'block clear'
  const days = pace.daysLeft > 0 ? `${pace.daysLeft}d` : 'no days'
  return `${pace.unitsLeft} left / ${days}`
}

export function standingLabel(standing: Standing): string {
  return standing === 'clear' ? 'clear' : standing === 'on-line' ? 'on line' : standing
}

/** Weekday check for a 'weekdays' ritual. Monday–Friday in the date's own terms. */
export function isWeekdayISO(date: string): boolean {
  if (!isISODate(date)) return true
  const day = new Date(date + 'T12:00:00Z').getUTCDay()
  return day >= 1 && day <= 5
}

export function ritualDueOn(campaign: Campaign, date: string): boolean {
  if (!campaign.ritual) return false
  return campaign.ritual.cadence === 'daily' || isWeekdayISO(date)
}
