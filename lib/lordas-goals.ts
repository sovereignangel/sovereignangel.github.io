/**
 * Pure helpers for the Lordas goals & accountability system.
 * Shared by the API routes (server) and Goals components (client).
 */

import { weekStartDate, localDateString } from '@/lib/date-utils'
import type {
  LordasPerson,
  LordasGoalOwner,
  LordasGoalCategory,
  LordasNorthStar,
  LordasCampaign,
  LordasCommitment,
  LordasWeek,
} from '@/lib/types'

/**
 * The campaigns, in order. A campaign is a dated period with its own charter
 * and its own KPIs; it is declared here rather than created in the UI because
 * a period nobody agreed on in advance is a period that gets extended until
 * it was met. Adding one is a one-line edit, and its Firestore doc
 * (`campaign_<id>`) is written lazily on the first mutation.
 *
 * Summer ran on feel and closed on 31 August. September and October are
 * months, deliberately: a goal you cannot check on in four weeks is a goal
 * you find out about too late.
 */
export interface LordasCampaignDef {
  id: string
  name: string
  startDate: string // YYYY-MM-DD, inclusive
  endDate: string // YYYY-MM-DD, inclusive
}

export const LORDAS_CAMPAIGNS: LordasCampaignDef[] = [
  { id: 'summer-2026', name: 'Summer Campaign', startDate: '2026-06-01', endDate: '2026-08-31' },
  { id: 'september-2026', name: 'September', startDate: '2026-09-01', endDate: '2026-09-30' },
  { id: 'october-2026', name: 'October', startDate: '2026-10-01', endDate: '2026-10-31' },
]

export function campaignDef(id: string): LordasCampaignDef | undefined {
  return LORDAS_CAMPAIGNS.find((c) => c.id === id)
}

/**
 * The campaign today falls inside. Between campaigns — or past the last one —
 * it is the most recent one that has started, so the sprint always has
 * milestones to commit against rather than going blank on a gap day.
 */
export function activeCampaignId(today: string = localDateString(new Date())): string {
  const current = LORDAS_CAMPAIGNS.find((c) => c.startDate <= today && today <= c.endDate)
  if (current) return current.id
  const started = LORDAS_CAMPAIGNS.filter((c) => c.startDate <= today)
  if (started.length > 0) return started[started.length - 1].id
  return LORDAS_CAMPAIGNS[0].id
}

/** The campaign after the given one, if the registry has one. */
export function nextCampaignDef(id: string): LordasCampaignDef | undefined {
  const i = LORDAS_CAMPAIGNS.findIndex((c) => c.id === id)
  return i === -1 ? undefined : LORDAS_CAMPAIGNS[i + 1]
}

export function isCampaignClosed(def: LordasCampaignDef, today: string = localDateString(new Date())): boolean {
  return def.endDate < today
}


export const GOAL_OWNERS: LordasGoalOwner[] = ['lori', 'aidas', 'relationship']

export const GOAL_CATEGORIES: LordasGoalCategory[] = [
  'work',
  'beauty-fitness',
  'mind',
  'love',
  'network',
  'experiences',
]

export const CATEGORY_LABELS: Record<LordasGoalCategory, string> = {
  work: 'Work',
  'beauty-fitness': 'Beauty & Fitness',
  mind: 'Mind',
  love: 'Love',
  network: 'Network',
  experiences: 'Experiences',
}

export const DEFAULT_NORTH_STARS: Record<LordasGoalOwner, Omit<LordasNorthStar, 'updatedAt' | 'updatedBy'>> = {
  lori: {
    person: 'lori',
    statement:
      'Become a top hedge fund manager — best in class globally at agent-based modeling for macro understanding and high-alpha strategies.',
    doneLooksLike: '$10M net worth after taxes, then become a mom.',
    targetDate: '2031-12-31',
  },
  aidas: {
    person: 'aidas',
    statement: 'Become a solo founder, or join an elite frontier AI lab.',
    doneLooksLike: 'Founded a company that ships, or an offer signed at a frontier lab.',
    targetDate: '2027-12-31',
  },
  relationship: {
    person: 'relationship',
    statement:
      'Build a partnership where two world-class ambitions make each other stronger — rich in adventure, love, and mutual growth.',
    doneLooksLike: 'Weekly rituals kept, honest accountability, a life we are proud to narrate.',
    targetDate: '',
  },
}

/** A campaign nobody has written to yet — the registry entry, and nothing in it. */
export function emptyCampaign(id: string): LordasCampaign {
  const def = campaignDef(id) ?? LORDAS_CAMPAIGNS[0]
  return { ...def, charters: {}, milestones: [], updatedAt: 0 }
}

export const MAX_MILESTONES_PER_OWNER = 8
export const MAX_COMMITMENTS_PER_OWNER = 3

export function partnerOf(p: LordasPerson): LordasPerson {
  return p === 'lori' ? 'aidas' : 'lori'
}

export function personLabel(p: LordasPerson): string {
  return p === 'lori' ? 'Lori' : 'Aidas'
}

export function ownerLabel(o: LordasGoalOwner): string {
  if (o === 'relationship') return 'Relationship'
  return personLabel(o)
}

/** Who must countersign a commitment: anyone except its proposer. */
export function proposerOf(c: LordasCommitment): LordasPerson {
  if (c.createdBy) return c.createdBy
  // Legacy rows have no createdBy; owner proposed their own commitment
  return c.person === 'relationship' ? 'lori' : c.person
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
 * Completion rate for one owner's week: done = 1, partial = 0.5, else 0.
 * Returns null when the owner has no commitments that week.
 */
export function hitRate(week: LordasWeek, owner: LordasGoalOwner): number | null {
  const mine = week.commitments.filter((c) => c.person === owner)
  if (mine.length === 0) return null
  const score = mine.reduce(
    (sum, c) => sum + (c.status === 'done' ? 1 : c.status === 'partial' ? 0.5 : 0),
    0
  )
  return score / mine.length
}

export function doneCount(week: LordasWeek, owner: LordasGoalOwner): number {
  return week.commitments.filter((c) => c.person === owner && c.status === 'done').length
}

/**
 * Consecutive most-recent weeks (sorted desc by weekStart, current week
 * excluded by the caller) where the owner completed at least 2 commitments —
 * or all of them, when fewer than 2 were set.
 */
export function weekStreak(weeksDesc: LordasWeek[], owner: LordasGoalOwner): number {
  let streak = 0
  for (const week of weeksDesc) {
    const total = week.commitments.filter((c) => c.person === owner).length
    if (total > 0 && doneCount(week, owner) >= Math.min(2, total)) streak++
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

// ---------------------------------------------------------------------------
// Retrospective — everything below is derived, never stored
// ---------------------------------------------------------------------------

/**
 * A campaign's milestones, scored. Dropped milestones are counted but kept out
 * of the rate: a goal you consciously abandoned is a decision, not a miss, and
 * folding it into the denominator punishes the honest act of dropping it.
 */
export interface OwnerScore {
  owner: LordasGoalOwner
  done: number
  missed: number
  dropped: number
  /** done / (done + missed), or null when nothing was left standing */
  rate: number | null
}

export function scoreCampaign(campaign: LordasCampaign): Record<LordasGoalOwner, OwnerScore> {
  const out = {} as Record<LordasGoalOwner, OwnerScore>
  for (const owner of GOAL_OWNERS) {
    const mine = campaign.milestones.filter((m) => m.person === owner)
    const done = mine.filter((m) => m.status === 'done').length
    const dropped = mine.filter((m) => m.status === 'dropped').length
    const missed = mine.length - done - dropped
    out[owner] = { owner, done, missed, dropped, rate: done + missed > 0 ? done / (done + missed) : null }
  }
  return out
}

/** The weeks whose Monday falls inside a campaign's dates. */
export function weeksInCampaign(weeks: LordasWeek[], def: LordasCampaignDef): LordasWeek[] {
  return weeks.filter((w) => w.weekStart >= def.startDate && w.weekStart <= def.endDate)
}

/**
 * What the weekly sprint actually delivered across a campaign. `kept` scores
 * partials at a half, the same way `hitRate` does week to week, so the
 * campaign number and the weekly ones cannot tell different stories.
 */
export interface OwnerSprintStats {
  owner: LordasGoalOwner
  made: number
  kept: number
  rate: number | null
  weeksWithCommitments: number
}

export function sprintStats(
  weeks: LordasWeek[],
  def: LordasCampaignDef
): { weeks: number; bothReviewed: number; byOwner: Record<LordasGoalOwner, OwnerSprintStats> } {
  const inRange = weeksInCampaign(weeks, def)
  const byOwner = {} as Record<LordasGoalOwner, OwnerSprintStats>
  for (const owner of GOAL_OWNERS) {
    let made = 0
    let kept = 0
    let weeksWith = 0
    for (const w of inRange) {
      const mine = w.commitments.filter((c) => c.person === owner)
      if (mine.length === 0) continue
      weeksWith++
      made += mine.length
      kept += mine.reduce((sum, c) => sum + (c.status === 'done' ? 1 : c.status === 'partial' ? 0.5 : 0), 0)
    }
    byOwner[owner] = { owner, made, kept, rate: made > 0 ? kept / made : null, weeksWithCommitments: weeksWith }
  }
  return {
    weeks: inRange.length,
    bothReviewed: inRange.filter((w) => w.reviews.lori && w.reviews.aidas).length,
    byOwner,
  }
}
