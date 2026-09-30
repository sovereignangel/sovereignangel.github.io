/**
 * Types for the Connection Insights dashboard.
 *
 * Tracks relationship health across three pillars — Safety, Growth, and
 * Alignment — extracted from recorded conflict-resolution conversations.
 *
 * The two people are represented by the generic slots `a` and `b`. Their
 * human-readable names live in `config/partners.ts` (set via env), so this
 * data model stays identity-agnostic and portable.
 */

import { Timestamp } from 'firebase/firestore'
import type { PartnerKey } from '@/lib/connectioninsights/partners'

// ---------------------------------------------------------------------------
// Extraction — structured data pulled from each conversation transcript
// ---------------------------------------------------------------------------

/** Which partner a moment is attributed to. See config/partners.ts for names. */
export type Speaker = PartnerKey // 'a' | 'b'

export type HorsemanType = 'criticism' | 'contempt' | 'defensiveness' | 'stonewalling'

export type RepairType = 'humor' | 'affection' | 'accountability' | 'de-escalation' | 'meta-communication'

export type PursueWithdrawPattern = 'a-pursues' | 'b-pursues' | 'balanced' | 'both-withdraw'

export type ConversationTone = 'constructive' | 'tense' | 'warm' | 'defensive' | 'breakthrough'

export type LifeDomain = 'money' | 'family' | 'career' | 'lifestyle' | 'intimacy' | 'social' | 'values' | 'household' | 'health'

export type ThemeStatus = 'active' | 'improving' | 'resolved'

export interface HorsemenCounts {
  criticism: number
  contempt: number
  defensiveness: number
  stonewalling: number
}

/** A metric split across the two partners. */
export interface PerPartner<T> {
  a: T
  b: T
}

export interface HorsemenInstance {
  by: Speaker
  type: HorsemanType
  quote: string
}

export interface RepairAttempt {
  by: Speaker
  type: RepairType
  successful: boolean
  quote?: string
}

export interface VulnerabilityMoment {
  by: Speaker
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

export interface AccountabilityInstance {
  by: Speaker
  type: 'ownership' | 'blame'
  quote: string
}

export interface CuriosityInstance {
  by: Speaker
  type: 'genuine-question' | 'assumption'
  quote: string
}

export interface PriorityConflict {
  topic: string
  positionA: string
  positionB: string
  resolution: 'resolved' | 'progressing' | 'unresolved' | 'new'
}

export interface ValueExpressed {
  by: Speaker
  value: string
  context: string
}

export interface ActionItem {
  task: string
  owner: Speaker | 'both'
}

export interface RelationalExtraction {
  // Session metadata
  date: string
  durationMinutes: number
  triggerTopic: string

  // SAFETY
  horsemen: PerPartner<HorsemenCounts>
  horsemenInstances?: HorsemenInstance[]
  repairAttempts: RepairAttempt[]
  vulnerabilityMoments: VulnerabilityMoment[]

  // GROWTH
  curiosityVsAssumption: PerPartner<CuriosityAssumption>
  curiosityInstances?: CuriosityInstance[]
  accountabilityVsBlame: PerPartner<AccountabilityBlame>
  accountabilityInstances?: AccountabilityInstance[]
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
  actionItems: ActionItem[]
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

export interface Conversation {
  id: string
  date: string
  durationMinutes: number
  /** Source id (e.g. Wave.ai session) — empty for pasted transcripts. */
  sourceId: string
  transcriptText: string
  extraction: RelationalExtraction
  scores: PillarScores
  createdAt: Timestamp | Date
}

export interface Theme {
  id: string
  domain: LifeDomain
  label: string
  conversationIds: string[]
  status: ThemeStatus
  positions: {
    a: string
    b: string
  }
  updatedAt: Timestamp | Date
}

export interface ValueEntry {
  id: string
  value: string
  expressedBy: Speaker | 'shared'
  firstSeen: string
  mentions: number
  contexts: string[]
}

export interface Snapshot {
  date: string
  safety: number
  growth: number
  alignment: number
  composite: number
  conversationCount: number
  rollingAverage: PillarScores
}
