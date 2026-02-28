import type { Timestamp } from './shared'
import type { DecisionDomain } from './decision'

export type JournalReviewStatus = 'saved' | 'corrected'
export type ReviewItemStatus = 'saved' | 'edited' | 'deleted'

export interface ReviewableContact {
  docId: string
  name: string
  context: string
  status: ReviewItemStatus
}

export interface ReviewableDecision {
  docId: string
  title: string
  hypothesis: string
  chosenOption: string
  reasoning: string
  domain: DecisionDomain
  confidenceLevel: number
  status: ReviewItemStatus
}

export interface ReviewablePrinciple {
  docId: string
  text: string
  shortForm: string
  domain: DecisionDomain
  status: ReviewItemStatus
}

export interface ReviewableBelief {
  docId: string
  statement: string
  confidence: number
  domain: DecisionDomain
  evidenceFor: string[]
  evidenceAgainst: string[]
  status: ReviewItemStatus
}

export interface ReviewableNote {
  docId: string
  text: string
  actionRequired: boolean
  status: ReviewItemStatus
}

export interface JournalReview {
  id?: string
  uid: string
  date: string                       // YYYY-MM-DD
  journalText: string                // original journal text
  contacts: ReviewableContact[]
  decisions: ReviewableDecision[]
  principles: ReviewablePrinciple[]
  beliefs: ReviewableBelief[]
  notes: ReviewableNote[]
  status: JournalReviewStatus
  telegramChatId: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
