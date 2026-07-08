/**
 * Types for the Lordas goals & accountability system.
 * Three layers: North Star (career identity), Summer Campaign (seasonal
 * milestones), Weekly Sprint (partner-locked commitments + reviews).
 */

import type { RelationalSpeaker } from './relationship'

export type LordasPerson = RelationalSpeaker // 'lori' | 'aidas'

export interface LordasNorthStar {
  person: LordasPerson
  statement: string
  doneLooksLike: string
  targetDate: string // YYYY-MM-DD
  updatedAt: number // epoch millis; 0 = seeded default, never edited
  updatedBy: LordasPerson
}

export type LordasMilestoneStatus = 'on-track' | 'at-risk' | 'done' | 'dropped'

export interface LordasMilestone {
  id: string
  person: LordasPerson
  title: string
  metric: string
  target: string
  current: string
  status: LordasMilestoneStatus
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export interface LordasCampaign {
  id: string // e.g. 'summer-2026'
  name: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  milestones: LordasMilestone[]
  updatedAt: number
}

export type LordasCommitmentStatus = 'pending' | 'in-progress' | 'done' | 'partial' | 'missed'

export interface LordasCommitment {
  id: string
  person: LordasPerson
  title: string
  milestoneId?: string
  why?: string
  status: LordasCommitmentStatus
  lockedBy?: LordasPerson // the partner who countersigned; absent = proposed
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
  northStars: Partial<Record<LordasPerson, LordasNorthStar>>
  campaign: LordasCampaign
  currentWeek: LordasWeek | null
  nextWeek: LordasWeek | null
  weekHistory: LordasWeek[]
}
