import type { Timestamp } from 'firebase/firestore'
import type { ThesisPillar } from './shared'

// ---------------------------------------------------------------------------
// Four Signal Streams
// ---------------------------------------------------------------------------

export type SignalStream = 'research' | 'market' | 'observation' | 'venture'

export type OvernightPhase = 'harvest' | 'process' | 'synthesis'

export type OvernightStatus = 'pending' | 'running' | 'completed' | 'failed'

// Research domains for paper reproduction
export type PaperResearchDomain =
  | 'cognitive-science-ai'    // Cognitive science & AI/RL
  | 'markets-econometrics-ai' // Markets/econometrics & AI/RL
  | 'blend'                   // Intersection of both

// ---------------------------------------------------------------------------
// Watchlist (market signal sources)
// ---------------------------------------------------------------------------

export interface WatchlistEntry {
  name: string
  role: string              // e.g. "Investor", "Founder/CEO"
  blogUrl?: string
  twitterHandle?: string
  substackUrl?: string
  rssFeedUrl?: string
  pillars: ThesisPillar[]
}

// ---------------------------------------------------------------------------
// Overnight Run (persisted record of each nightly run)
// ---------------------------------------------------------------------------

export interface OvernightRun {
  id?: string
  date: string              // YYYY-MM-DD
  phase: OvernightPhase
  status: OvernightStatus
  stream: SignalStream | 'all'
  startedAt: string         // ISO timestamp
  completedAt?: string
  results: OvernightPhaseResult
  errors: string[]
  createdAt: Timestamp
}

export interface OvernightPhaseResult {
  // Harvest
  signalsIngested?: number
  papersFound?: number
  postsScraped?: number
  journalEntriesParsed?: number

  // Process
  papersQueued?: number
  beliefsExtracted?: number
  convictionShifts?: ConvictionShift[]
  ventureUpdates?: number

  // Synthesis
  crossLinks?: CrossDomainLink[]
  briefGenerated?: boolean
  teachBackItems?: number
}

export interface ConvictionShift {
  belief: string
  direction: 'stronger' | 'weaker' | 'new'
  evidence: string
  stream: SignalStream
}

export interface CrossDomainLink {
  from: { stream: SignalStream; item: string }
  to: { stream: SignalStream; item: string }
  insight: string
  strength: number          // 0-1
}

// ---------------------------------------------------------------------------
// Morning Thesis Briefing (the unified view)
// ---------------------------------------------------------------------------

export interface ThesisBriefing {
  id?: string
  date: string
  generatedAt: string

  // Overall
  headline: string          // One-line summary of overnight findings
  signalsProcessed: number
  actionRequired: number

  // Per-stream summaries
  streams: {
    research: StreamBriefing
    market: StreamBriefing
    observation: StreamBriefing
    venture: StreamBriefing
  }

  // Cross-domain synthesis
  convictionShifts: ConvictionShift[]
  crossLinks: CrossDomainLink[]
  emergingPatterns: string[]

  // Teach-back queue
  teachBackQueue: TeachBackItem[]

  // Discernment prompt
  discernmentPrompt: string

  createdAt: Timestamp
}

export interface StreamBriefing {
  stream: SignalStream
  itemCount: number
  topItems: Array<{
    title: string
    summary: string
    relevance: number
    actionType?: 'review' | 'reproduce' | 'invest' | 'build' | 'reflect'
  }>
  status: 'active' | 'quiet' // Whether new signals came in
}

export interface TeachBackItem {
  title: string
  stream: SignalStream
  sourceId?: string
  concept: string           // What you need to be able to explain
  mechanism: string         // The underlying mechanism to understand
  testQuestion: string      // Question to test your understanding
  status: 'pending' | 'passed' | 'failed'
}
