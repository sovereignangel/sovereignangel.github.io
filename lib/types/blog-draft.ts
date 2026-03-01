import type { DecisionDomain } from './decision'
import type { Timestamp } from './shared'

export type BlogDraftStatus = 'idea' | 'outlining' | 'drafting' | 'ready' | 'published'

export interface BlogDraft {
  id?: string
  title: string
  subtitle?: string
  summary: string
  keyArguments: string[]
  domain: DecisionDomain
  status: BlogDraftStatus
  linkedHypothesisIds: string[]
  linkedBeliefIds: string[]
  substackUrl?: string
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
