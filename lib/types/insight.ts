import type { ThesisPillar, Timestamp } from './shared'

export type InsightType =
  | 'process_insight'
  | 'feature_idea'
  | 'action_item'
  | 'value_signal'
  | 'market_pattern'
  | 'arbitrage_opportunity'

export type InsightStatus = 'active' | 'acted_on' | 'archived'

export interface Insight {
  id?: string

  // Core content
  type: InsightType
  content: string
  summary: string // One-liner for list views (AI-generated)

  // Source linkage
  sourceConversationId: string
  sourceConversationTitle: string // Denormalized for display
  sourceConversationDate: string // YYYY-MM-DD

  // Project linkage (many-to-many)
  linkedProjectIds: string[]
  linkedProjectNames: string[] // Denormalized for display/filtering

  // Classification
  tags: string[]
  thesisPillars: ThesisPillar[]

  // Status tracking
  status: InsightStatus

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface MacroPattern {
  id?: string
  pattern: string
  supportingInsightIds: string[]
  supportingConversationIds: string[]
  projectIds: string[]
  projectNames: string[] // Denormalized
  confidence: 'emerging' | 'confirmed' | 'strong'
  createdAt: Timestamp
  updatedAt: Timestamp
}
