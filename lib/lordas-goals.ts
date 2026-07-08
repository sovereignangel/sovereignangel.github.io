/**
 * Pure helpers for the Lordas goals & accountability system.
 * Shared by the API routes (server) and Goals components (client).
 */

import { weekStartDate, localDateString } from '@/lib/date-utils'
import type {
  LordasPerson,
  LordasNorthStar,
  LordasCampaign,
  LordasWeek,
} from '@/lib/types'

export const LORDAS_CAMPAIGN_ID = 'summer-2026'

export const DEFAULT_NORTH_STARS: Record<LordasPerson, Omit<LordasNorthStar, 'updatedAt' | 'updatedBy'>> = {
  lori: {
    person: 'lori',
    statement:
      'Become a top hedge fund manager — best in class globally at agent-based modeling for macro understanding and high-alpha strategies.',
    doneLooksLike: '$10M net worth after taxes. Then become a mom.',
    targetDate: '2031-12-31',
  },
  aidas: {
    person: 'aidas',
    statement: 'Become a solo founder, or join an elite frontier AI lab.',
    doneLooksLike: 'Founded a company that ships, or an offer signed at a frontier lab.',
    targetDate: '2027-12-31',
  },
}

export const EMPTY_CAMPAIGN: LordasCampaign = {
  id: LORDAS_CAMPAIGN_ID,
  name: 'Summer Campaign',
  startDate: '2026-06-01',
  endDate: '2026-08-31',
  milestones: [],
  updatedAt: 0,
}

export const MAX_MILESTONES_PER_PERSON = 5
export const MAX_COMMITMENTS_PER_PERSON = 3

export function partnerOf(p: LordasPerson): LordasPerson {
  return p === 'lori' ? 'aidas' : 'lori'
}

export function personLabel(p: LordasPerson): string {
  return p === 'lori' ? 'Lori' : 'Aidas'
}

/** Monday of the week after the given date, YYYY-MM-DD local. */
export function nextWeekStart(from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + 7)
  return weekStartDate(d)
}

/** Monday of the current week, YYYY-MM-DD local. */
export function currentWeekStart(from: Date = new Date()): string {
  return weekStartDate(from)
}

/**
 * Completion rate for one person's week: done = 1, partial = 0.5, else 0.
 * Returns null when the person has no commitments that week.
 */
export function hitRate(week: LordasWeek, person: LordasPerson): number | null {
  const mine = week.commitments.filter((c) => c.person === person)
  if (mine.length === 0) return null
  const score = mine.reduce(
    (sum, c) => sum + (c.status === 'done' ? 1 : c.status === 'partial' ? 0.5 : 0),
    0
  )
  return score / mine.length
}

export function doneCount(week: LordasWeek, person: LordasPerson): number {
  return week.commitments.filter((c) => c.person === person && c.status === 'done').length
}

/**
 * Consecutive most-recent weeks (weeks sorted desc by weekStart, current week
 * excluded by the caller) where the person completed at least 2 commitments.
 */
export function weekStreak(weeksDesc: LordasWeek[], person: LordasPerson): number {
  let streak = 0
  for (const week of weeksDesc) {
    if (doneCount(week, person) >= 2) streak++
    else break
  }
  return streak
}

/** Sunday YYYY-MM-DD for a given Monday weekStart. */
export function weekEndDate(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const end = new Date(y, m - 1, d)
  end.setDate(end.getDate() + 6)
  return localDateString(end)
}
