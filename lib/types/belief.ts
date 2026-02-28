import type { DecisionDomain } from './decision'
import type { Timestamp } from './shared'

export type BeliefStatus = 'active' | 'tested' | 'confirmed' | 'invalidated' | 'archived'

export interface BeliefExtension {
  extendedAt: string            // YYYY-MM-DD
  reason: string
  newAttentionDate: string      // YYYY-MM-DD
}

export interface BeliefPreviousStatement {
  statement: string             // the old statement text
  sharpenedAt: string           // YYYY-MM-DD when it was replaced
  reasoning: string             // AI reasoning for the change
}

export interface Belief {
  id?: string
  statement: string               // "I believe that..."
  confidence: number              // 0-100
  domain: DecisionDomain
  evidenceFor: string[]
  evidenceAgainst: string[]
  antithesis?: string             // AI-generated counter-argument
  antithesisStrength?: number     // 0-100
  status: BeliefStatus
  linkedDecisionIds: string[]
  linkedPrincipleIds: string[]
  sourceJournalDate: string       // YYYY-MM-DD
  attentionDate: string           // YYYY-MM-DD — 21 days from creation, extended with reason
  extensions?: BeliefExtension[]  // audit trail of extensions
  previousStatements?: BeliefPreviousStatement[]  // sharpen history
  lastReviewedAt?: string         // YYYY-MM-DD — for spaced repetition
  reviewInterval?: number         // days until next review (Anki-style)
  createdAt: Timestamp
  updatedAt: Timestamp
}
