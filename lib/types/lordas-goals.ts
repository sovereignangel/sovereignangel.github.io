/**
 * Types for the Lordas goals & accountability system.
 * Hierarchy: North Star (identity statement) -> Campaign charter (the
 * overarching goal for one dated period) -> milestones (campaign KPIs) ->
 * Weekly Sprint (partner-locked commitments with success criteria). A
 * finished campaign closes with a retrospective.
 * Goals are owned by 'lori', 'aidas', or 'relationship' (shared).
 */

import type { RelationalSpeaker } from './relationship'

export type LordasPerson = RelationalSpeaker // 'lori' | 'aidas'

export type LordasGoalOwner = LordasPerson | 'relationship'

export type LordasGoalCategory =
  | 'work'
  | 'beauty-fitness'
  | 'mind'
  | 'love'
  | 'network'
  | 'experiences'

export interface LordasNorthStar {
  person: LordasGoalOwner
  statement: string
  doneLooksLike: string
  targetDate: string // YYYY-MM-DD
  updatedAt: number // epoch millis; 0 = seeded default, never edited
  updatedBy: LordasPerson
}

export type LordasMilestoneStatus = 'on-track' | 'at-risk' | 'done' | 'dropped'

export interface LordasMilestone {
  id: string
  person: LordasGoalOwner
  title: string
  metric: string
  target: string
  current: string
  category?: LordasGoalCategory
  status: LordasMilestoneStatus
  sortOrder: number
  /** Id of the milestone in the previous campaign this one was carried from */
  carriedFrom?: string
  createdAt: number
  updatedAt: number
}

/** Overarching seasonal goal for one owner — the campaign headline. */
export interface LordasCharter {
  owner: LordasGoalOwner
  statement: string
  doneLooksLike: string
  updatedAt: number
  updatedBy: LordasPerson
}

/**
 * One owner's written verdict on a finished campaign. Kept as three separate
 * fields rather than one box because the third one is the only one that
 * changes behaviour — what worked and what didn't are history, what carries
 * is a commitment — and a single box lets it go unwritten.
 */
export interface LordasRetroReflection {
  owner: LordasGoalOwner
  worked: string
  didnt: string
  carries: string
  updatedAt: number
  updatedBy: LordasPerson
}

/**
 * The closing statement on a campaign. Scores are not stored — they are
 * derived from the milestones, which are the record — so nothing here can
 * disagree with the board above it. What is stored is what only a person can
 * supply: the reflections, and which milestones are being carried forward.
 */
export interface LordasRetro {
  reflections: Partial<Record<LordasGoalOwner, LordasRetroReflection>>
  /** Milestone ids marked to roll into the next campaign */
  carryForward: string[]
  /** Campaign ids this retro's carry-forward has already been copied into */
  carriedInto?: string[]
  updatedAt: number
}

export interface LordasCampaign {
  id: string // e.g. 'summer-2026'
  name: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  charters?: Partial<Record<LordasGoalOwner, LordasCharter>>
  milestones: LordasMilestone[]
  retro?: LordasRetro
  updatedAt: number
}

export type LordasCommitmentStatus = 'pending' | 'in-progress' | 'done' | 'partial' | 'missed'

export interface LordasCommitment {
  id: string
  person: LordasGoalOwner
  createdBy?: LordasPerson // proposer; absent on legacy rows (treated as owner)
  title: string
  successCriteria?: string // measurable definition of done for the week
  milestoneId?: string
  category?: LordasGoalCategory
  why?: string
  status: LordasCommitmentStatus
  lockedBy?: LordasPerson // whoever countersigned (never the proposer)
  lockedAt?: number
  createdAt: number
  updatedAt: number
}

export interface LordasWeekReview {
  person: LordasPerson
  win: string
  lesson: string
  submittedAt: number
}

export interface LordasPartnerNote {
  from: LordasPerson
  about: LordasPerson
  text: string
  createdAt: number
}

export interface LordasWeek {
  weekStart: string // Monday YYYY-MM-DD, doubles as doc ID
  commitments: LordasCommitment[]
  reviews: Partial<Record<LordasPerson, LordasWeekReview>>
  partnerNotes: Partial<Record<LordasPerson, LordasPartnerNote>> // keyed by author
  createdAt: number
  updatedAt: number
}

export interface LordasGoalsData {
  northStars: Partial<Record<LordasGoalOwner, LordasNorthStar>>
  /** Every campaign in the registry, oldest first, hydrated or empty */
  campaigns: LordasCampaign[]
  /** The one containing today — what the weekly sprint commits against */
  activeCampaignId: string
  currentWeek: LordasWeek | null
  nextWeek: LordasWeek | null
  weekHistory: LordasWeek[]
}
