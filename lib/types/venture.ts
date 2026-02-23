import type { ThesisPillar } from './shared'

export type VentureStage = 'idea' | 'specced' | 'building' | 'deployed' | 'archived'
export type VentureBuildStatus = 'pending' | 'generating' | 'pushing' | 'deploying' | 'live' | 'failed'
export type VentureCategory = 'saas' | 'api' | 'marketplace' | 'tool' | 'content' | 'service' | 'other'

export interface VentureSpec {
  name: string                     // Short product name
  oneLiner: string                 // One-sentence pitch (max 120 chars)
  problem: string                  // What pain point this solves
  targetCustomer: string           // Who has this problem
  solution: string                 // How this solves it
  category: VentureCategory
  thesisPillars: ThesisPillar[]

  // Business model
  revenueModel: string             // How it makes money
  pricingIdea: string              // Rough pricing
  marketSize: string               // TAM estimate or qualitative size

  // Technical spec (for auto-build)
  techStack: string[]              // Suggested stack
  mvpFeatures: string[]            // 3-5 core features for the PoC
  apiIntegrations: string[]        // External APIs needed

  // Competitive / strategic
  existingAlternatives: string[]   // What people currently use
  unfairAdvantage: string          // Why you specifically can build this
  killCriteria: string[]           // Conditions that kill the idea (2-3)
}

export interface VentureBuild {
  status: VentureBuildStatus
  repoUrl: string | null
  previewUrl: string | null
  repoName: string | null
  buildLog: string[]               // Append-only status messages
  startedAt: unknown | null
  completedAt: unknown | null
  errorMessage: string | null
  filesGenerated: number | null
}

export interface Venture {
  id?: string
  rawInput: string                 // Original text/voice transcript
  inputSource: 'telegram_text' | 'telegram_voice' | 'dashboard'
  spec: VentureSpec
  build: VentureBuild
  stage: VentureStage

  // Linking
  linkedProjectId: string | null   // If promoted to a full Project

  // Notes & scoring
  notes: string                    // Free-form notes from dashboard
  score: number | null             // 0-100 conviction score

  createdAt: unknown               // Timestamp
  updatedAt: unknown               // Timestamp
}
