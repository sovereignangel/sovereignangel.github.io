import type { Timestamp } from './shared'

export type DecisionDomain = 'portfolio' | 'product' | 'revenue' | 'personal' | 'thesis'
export type DecisionStatus = 'active' | 'pending_review' | 'reviewed' | 'superseded'

export interface Decision {
  id?: string
  title: string
  hypothesis: string
  options: string[]
  chosenOption: string
  reasoning: string
  confidenceLevel: number        // 0-100
  killCriteria: string[]
  premortem: string
  domain: DecisionDomain
  linkedProjectIds: string[]
  linkedSignalIds: string[]
  status: DecisionStatus
  reviewDate: string             // YYYY-MM-DD (90 days out)
  antithesis?: string              // AI-generated strongest counter-argument
  antithesisConfidence?: number    // AI confidence in the counter-argument (0-100)
  linkedBeliefIds?: string[]       // beliefs that drove this decision
  outcomeScore?: number          // 0-100
  actualOutcome?: string
  learnings?: string
  extensions?: Array<{            // audit trail for review date extensions
    extendedAt: string
    reason: string
    newReviewDate: string
  }>
  decidedAt: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
