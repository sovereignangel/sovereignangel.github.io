/**
 * Types for the Lordas relationship dashboard.
 * Tracks partnership health across Safety, Growth, and Alignment pillars.
 */

import { Timestamp } from 'firebase/firestore'

// ---------------------------------------------------------------------------
// Extraction — structured data pulled from each relational transcript
// ---------------------------------------------------------------------------

export type RelationalSpeaker = 'lori' | 'aidas'

export type HorsemanType = 'criticism' | 'contempt' | 'defensiveness' | 'stonewalling'

export type RepairType = 'humor' | 'affection' | 'accountability' | 'de-escalation' | 'meta-communication'

export type PursueWithdrawPattern = 'lori-pursues' | 'aidas-pursues' | 'balanced' | 'both-withdraw'

export type ConversationTone = 'constructive' | 'tense' | 'warm' | 'defensive' | 'breakthrough'

export type LifeDomain = 'money' | 'family' | 'career' | 'lifestyle' | 'intimacy' | 'social' | 'values' | 'household' | 'health'

export type RelThemeStatus = 'active' | 'improving' | 'resolved'

export interface HorsemenCounts {
  criticism: number
  contempt: number
  defensiveness: number
  stonewalling: number
}

export interface RepairAttempt {
  by: RelationalSpeaker
  type: RepairType
  successful: boolean
  quote?: string
}

export interface VulnerabilityMoment {
  by: RelationalSpeaker
  summary: string
}

export interface CuriosityAssumption {
  genuineQuestions: number
  assumptions: number
}

export interface AccountabilityBlame {
  ownership: number
  blame: number
}

export interface PriorityConflict {
  topic: string
  loriPosition: string
  aidasPosition: string
  resolution: 'resolved' | 'progressing' | 'unresolved' | 'new'
}

export interface ValueExpressed {
  by: RelationalSpeaker
  value: string
  context: string
}

export interface RelationalActionItem {
  task: string
  owner: RelationalSpeaker | 'both'
}

export interface RelationalExtraction {
  // Session metadata
  date: string
  durationMinutes: number
  triggerTopic: string

  // SAFETY
  horsemen: {
    lori: HorsemenCounts
    aidas: HorsemenCounts
  }
  repairAttempts: RepairAttempt[]
  vulnerabilityMoments: VulnerabilityMoment[]

  // GROWTH
  curiosityVsAssumption: {
    lori: CuriosityAssumption
    aidas: CuriosityAssumption
  }
  accountabilityVsBlame: {
    lori: AccountabilityBlame
    aidas: AccountabilityBlame
  }
  newUnderstandings: string[]
  pursueWithdraw: {
    pattern: PursueWithdrawPattern
    intensity: 'mild' | 'moderate' | 'strong'
  }

  // ALIGNMENT
  domain: LifeDomain
  valuesExpressed: ValueExpressed[]
  priorityConflicts: PriorityConflict[]
  sharedVisionStatements: string[]

  // Meta
  overallTone: ConversationTone
  keyTakeaways: string[]
  actionItems: RelationalActionItem[]
}

// ---------------------------------------------------------------------------
// Pillar scores
// ---------------------------------------------------------------------------

export interface PillarScores {
  safety: number
  growth: number
  alignment: number
  composite: number
}

// ---------------------------------------------------------------------------
// Firestore documents
// ---------------------------------------------------------------------------

export interface RelationshipConversation {
  id: string
  date: string
  durationMinutes: number
  waveSessionId: string
  transcriptText: string
  extraction: RelationalExtraction
  scores: PillarScores
  createdAt: Timestamp
}

export interface RelationshipTheme {
  id: string
  domain: LifeDomain
  label: string
  conversationIds: string[]
  status: RelThemeStatus
  positions: {
    lori: string
    aidas: string
  }
  updatedAt: Timestamp
}

export interface RelationshipValue {
  id: string
  value: string
  expressedBy: RelationalSpeaker | 'shared'
  firstSeen: string
  mentions: number
  contexts: string[]
}

export interface RelationshipSnapshot {
  date: string
  safety: number
  growth: number
  alignment: number
  composite: number
  conversationCount: number
  rollingAverage: PillarScores
}
