import type { ThesisPillar } from './shared'

export type VentureStage = 'idea' | 'specced' | 'validated' | 'prd_draft' | 'prd_approved' | 'building' | 'deployed' | 'archived'
export type VentureBuildStatus = 'pending' | 'generating' | 'pushing' | 'deploying' | 'live' | 'failed'
export type VentureCategory = 'saas' | 'api' | 'marketplace' | 'tool' | 'content' | 'service' | 'other'
export type VenturePRDPriority = 'P0' | 'P1' | 'P2'

export interface VenturePRDFeature {
  name: string
  description: string
  priority: VenturePRDPriority
}

export interface VenturePRD {
  projectName: string                // kebab-case for repo/subdomain
  features: VenturePRDFeature[]
  dataSchema: string                 // Markdown description of data model
  userFlows: string[]                // Step-by-step user journeys
  designNotes: string                // Armstrong aesthetic + project-specific notes
  successMetrics: string[]           // How to measure if this works
  estimatedBuildMinutes: number      // AI estimate
  version: number                    // Increments with feedback
  feedbackHistory: string[]          // User feedback messages
}

export interface VentureIteration {
  request: string
  completedAt: unknown               // Timestamp
}

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
  prd: VenturePRD | null           // null until PRD is generated
  build: VentureBuild
  stage: VentureStage
  iterations: VentureIteration[]   // History of iteration requests

  // Linking
  linkedProjectId: string | null   // If promoted to a full Project

  // Notes & scoring
  notes: string                    // Free-form notes from dashboard
  score: number | null             // 0-100 conviction score

  createdAt: unknown               // Timestamp
  updatedAt: unknown               // Timestamp
}
