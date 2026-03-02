import type { Timestamp, ThesisPillar } from './shared'
import type { ContactTier, TrustStage, PipelineStage } from './sales'

// ─── ALIASES ─────────────────────────────────────────────────────────

export interface ContactAlias {
  name: string                       // The alias text (e.g. "S. Chen")
  normalizedName: string             // Lowercase, stripped (e.g. "s. chen")
  source: 'manual' | 'journal' | 'transcript' | 'screenshot' | 'migration' | 'note'
  addedAt: string                    // YYYY-MM-DD
}

// ─── INTERACTIONS ────────────────────────────────────────────────────

export interface ContactInteraction {
  date: string                       // YYYY-MM-DD
  source: 'journal' | 'transcript' | 'note' | 'screenshot' | 'manual'
  sourceDocId?: string               // Firestore doc ID of originating document
  sourceCollection?: string          // 'daily_logs', 'conversations', etc.
  summary: string                    // 1-2 sentence context from extraction
  sentiment?: 'positive' | 'neutral' | 'negative'
}

// ─── UNIFIED CONTACT ─────────────────────────────────────────────────

export interface UnifiedContact {
  id?: string

  // Identity
  canonicalName: string              // Display name (e.g. "Sarah Chen")
  normalizedName: string             // Lowercase for matching (e.g. "sarah chen")
  aliases: ContactAlias[]            // All known name variants

  // Contact info
  email?: string
  phone?: string
  company?: string
  role?: string

  // Relationship (absorbs NetworkContact fields from lib/types/sales.ts)
  tier: ContactTier | 'acquaintance'
  relationshipStrength: number       // 1-10
  trustStage: TrustStage             // 1-6
  isTop30: boolean

  // Pipeline & Revenue (optional, from NetworkContact)
  pipelineStage?: PipelineStage
  dealValue?: number
  dealCurrency?: 'monthly' | 'one_time'
  expectedCloseDate?: string
  linkedProjectName?: string
  problemIdentified?: string

  // Network
  connectedTo: string[]              // Canonical names of other contacts
  warmIntrosGenerated: number
  touchCount: number
  lastTouchDate: string              // YYYY-MM-DD
  lastAskDate?: string

  // Auto-extracted intelligence
  interactions: ContactInteraction[] // Last 50 interactions
  interactionCount: number           // Total ever recorded
  topics: string[]                   // Auto-extracted from interactions
  painPoints: string[]               // Their frustrations/problems
  thesisPillars: ThesisPillar[]      // Which pillars they connect to

  // CRM fields from NetworkContact
  nextAction: string
  whatTheyControl: string
  yourValueToThem: string
  notes?: string

  // Resolution metadata
  needsReview: boolean               // True if fuzzy match was ambiguous
  lastResolvedAt?: string            // ISO timestamp of last resolution

  // Migration tracking
  migratedFromContactId?: string
  migratedFromNetworkContactId?: string

  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── RESOLUTION RESULT ───────────────────────────────────────────────

export type ResolutionMethod = 'exact' | 'alias' | 'fuzzy' | 'llm' | 'new'

export interface ResolutionResult {
  contact: UnifiedContact
  contactId: string
  method: ResolutionMethod
  confidence: number                 // 0-1
  isNew: boolean
}
