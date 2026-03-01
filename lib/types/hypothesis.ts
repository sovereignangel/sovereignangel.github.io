import type { DecisionDomain } from './decision'
import type { Timestamp } from './shared'

export type HypothesisStatus = 'open' | 'investigating' | 'resolved' | 'abandoned'
export type HypothesisResolution = 'belief' | 'blog' | 'both' | 'abandoned'

export interface HypothesisEvidence {
  id: string                          // crypto.randomUUID()
  type: 'reading' | 'observation' | 'conversation' | 'data' | 'experiment'
  text: string
  supports: 'for' | 'against' | 'neutral'
  source?: string                     // book title, person, URL
  addedAt: string                     // YYYY-MM-DD
}

export interface Hypothesis {
  id?: string
  question: string                    // "Is X true?" or "What if Y?"
  context: string                     // Why this matters, what prompted it
  domain: DecisionDomain
  status: HypothesisStatus
  priority: 'high' | 'medium' | 'low'
  evidence: HypothesisEvidence[]
  resolution?: HypothesisResolution
  resolutionNotes?: string
  linkedBeliefId?: string             // set on resolve → belief
  linkedBlogDraftId?: string          // set on resolve → blog
  abandonedReason?: string
  lastReviewedAt?: string       // YYYY-MM-DD — for spaced repetition
  reviewInterval?: number       // days until next review
  createdAt: Timestamp
  updatedAt: Timestamp
}
