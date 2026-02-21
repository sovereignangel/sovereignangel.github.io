import type { ThesisPillar, Timestamp } from './shared'

export type KnowledgeType = 'book' | 'paper' | '10k_filing' | 'article' | 'lecture' | 'course'
export type KnowledgeStatus = 'queued' | 'in_progress' | 'completed' | 'abandoned'

export interface KnowledgeItem {
  id?: string
  type: KnowledgeType
  title: string
  author: string
  source?: string
  status: KnowledgeStatus
  startDate?: string
  completionDate?: string
  thesisPillars: ThesisPillar[]
  tags: string[]
  aiSummary?: string
  keyTakeaways: string[]
  linkedSignalIds: string[]
  linkedPrincipleIds: string[]
  impactRating?: number          // 1-5
  createdAt: Timestamp
  updatedAt: Timestamp
}
