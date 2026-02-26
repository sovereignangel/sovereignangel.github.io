import type { Timestamp } from 'firebase/firestore'

export type ThesisPillarExtended = 'ai' | 'markets' | 'mind' | 'emergence'

export interface PillarBriefFinding {
  finding: string
  source: string   // "arxiv" | "edgar" | "journal" | "signal" | "venture"
  relevance: string
}

export interface PillarBriefConnection {
  from: string     // signal/paper/pattern
  to: string       // venture/project/decision
  insight: string
}

export interface PillarBriefAction {
  action: string
  priority: 'high' | 'medium'
  reason: string
}

export interface PillarBrief {
  id?: string
  date: string
  pillar: ThesisPillarExtended

  // AI-generated sections
  synthesis: string
  keyFindings: PillarBriefFinding[]
  connections: PillarBriefConnection[]
  actionItems: PillarBriefAction[]
  openQuestion: string

  // Metadata
  reviewed: boolean
  generatedAt: Timestamp
  dataSourceCount: number
}
