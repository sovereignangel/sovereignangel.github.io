import type { DecisionDomain } from './decision'
import type { Timestamp } from './shared'

export type PrincipleSource = 'decision' | 'synthesis' | 'conversation' | 'manual' | 'book' | 'framework'

export interface Principle {
  id?: string
  text: string
  shortForm: string
  source: PrincipleSource
  sourceId?: string
  sourceDescription: string
  domain: DecisionDomain
  dateFirstApplied: string
  reinforcementCount: number
  lastReinforcedAt: string
  linkedDecisionIds: string[]
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
