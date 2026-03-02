import type { DecisionDomain } from './decision'
import type { Timestamp } from './shared'

export type HypothesisStatus = 'open' | 'investigating' | 'resolved' | 'abandoned'
export type HypothesisResolution = 'belief' | 'blog' | 'both' | 'abandoned'

export interface HypothesisEvidence {
  id: string
  type: 'reading' | 'observation' | 'conversation' | 'data' | 'experiment'
  text: string
  supports: 'for' | 'against' | 'neutral'
  source?: string
  addedAt: string // YYYY-MM-DD
}

export interface Hypothesis {
  id?: string
  question: string             // The open question or testable claim
  context: string              // Why this matters, what prompted it
  domain: DecisionDomain
  status: HypothesisStatus
  priority: 'high' | 'medium' | 'low'
  evidence: HypothesisEvidence[]
  resolution?: HypothesisResolution
  resolutionNotes?: string
  linkedBeliefId?: string
  linkedBlogDraftId?: string
  abandonedReason?: string
  sourceType?: 'journal' | 'conversation' | 'transcript' | 'reading' | 'manual'
  sourceId?: string            // conversationId or transcriptId
  lastReviewedAt?: string      // YYYY-MM-DD
  reviewInterval?: number      // days until next review
  createdAt: Timestamp
  updatedAt: Timestamp
}
