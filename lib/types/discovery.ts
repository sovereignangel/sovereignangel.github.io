import type { ConversationType, ExternalSignalSource, ExternalSignalStatus, ThesisPillar, Timestamp } from './shared'

export interface Conversation {
  id?: string
  title: string
  date: string
  participants: string[]
  transcriptText: string
  durationMinutes: number
  conversationType: ConversationType

  // AI-extracted insights
  processInsights: string[]
  featureIdeas: string[]
  actionItems: string[]
  valueSignals: string[]

  // Metadata
  aiProcessed: boolean
  aiProcessedAt?: Timestamp
  linkedSignalIds: string[]
  linkedProjectId?: string

  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Contact {
  id?: string
  name: string
  lastConversationDate: string
  notes?: string

  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ExternalSignal {
  id?: string
  title: string
  source: ExternalSignalSource
  sourceUrl: string
  sourceName: string

  content: string
  publishedAt: string

  // AI relevance scoring
  relevanceScore: number
  thesisPillars: ThesisPillar[]
  aiSummary: string

  // Conversion tracking
  convertedToSignal: boolean
  linkedSignalId?: string

  status: ExternalSignalStatus

  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface DailyReport {
  id?: string
  date: string

  // Aggregated content
  topExternalSignals: string[]
  newConversations: string[]
  reconnectSuggestions: string[]

  // AI digest
  aiSummary: string

  // Status
  reviewed: boolean

  createdAt: Timestamp
}
