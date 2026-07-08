/**
 * Types for the Lordas goals & accountability system.
 * Hierarchy: North Star (identity statement) -> Summer Campaign charter
 * (overarching seasonal goal) -> milestones (season KPIs) -> Weekly Sprint
 * (partner-locked commitments with success criteria).
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

export interface LordasCampaign {
  id: string // e.g. 'summer-2026'
  name: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  charters?: Partial<Record<LordasGoalOwner, LordasCharter>>
  milestones: LordasMilestone[]
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
  campaign: LordasCampaign
  currentWeek: LordasWeek | null
  nextWeek: LordasWeek | null
  weekHistory: LordasWeek[]
}
