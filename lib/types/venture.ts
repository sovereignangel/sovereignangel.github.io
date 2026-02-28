import type { ThesisPillar } from './shared'

export type VentureStage = 'idea' | 'specced' | 'validated' | 'prd_draft' | 'building' | 'deployed' | 'archived'
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

export interface VentureMemoMetric {
  label: string                      // e.g. "TAM", "CAC", "LTV"
  value: string                      // e.g. "$4.2B", "$12", "$480"
  context: string                    // e.g. "Growing 24% YoY"
}

export interface MarketSizeRow {
  segment: string                    // "TAM", "SAM", "SOM"
  size: string                       // "$4.2B"
  cagr: string                       // "24%"
  notes: string                      // "Global clinical trials market"
}

export interface BusinessModelRow {
  lever: string                      // "Enterprise SaaS", "API Usage"
  mechanism: string                  // "Per-seat annual license"
  target: string                     // "$2,400/yr"
  marginProfile: string              // "85% gross margin"
}

export interface GTMPhase {
  phase: string                      // "0→10", "10→100", "100→1K"
  strategy: string                   // "Founder-led sales"
  channel: string                    // "Direct outbound to CROs"
  milestone: string                  // "10 design partners"
}

export interface FinancialProjectionRow {
  year: string                       // "Year 1", "Year 2", "Year 3"
  revenue: string                    // "$120K"
  customers: string                  // "15"
  burn: string                       // "$25K/mo"
  keyAssumption: string              // "3 enterprise contracts"
}

export interface UnitEconomicsRow {
  metric: string                     // "CAC", "LTV", "Payback", "Gross Margin"
  current: string                    // "$120" or "N/A (pre-launch)"
  target: string                     // "$45"
  benchmark: string                  // "Best-in-class SaaS: $35"
}

export interface UseOfFundsRow {
  category: string                   // "Engineering", "GTM", "Operations"
  allocation: string                 // "60%"
  amount: string                     // "$180K"
  rationale: string                  // "2 senior engineers × 6 months"
}

export interface MilestoneRow {
  timeline: string                   // "Month 1", "Month 3", "Month 6"
  milestone: string                  // "Ship v1 to 5 design partners"
  successMetric: string              // "5 active pilots"
}

export interface CompetitorRow {
  feature: string                    // High-leverage differentiator
  us: string                         // Our capability ("Yes", "AI-native", etc.)
  competitors: Record<string, string>  // { "Competitor A": "Partial", "Competitor B": "No" }
}

export interface VentureMemo {
  // Page 1 — Executive Summary
  companyPurpose: string             // One sentence: what this company does
  executiveSummary: string           // 2-3 paragraph narrative synthesis
  keyMetrics: VentureMemoMetric[]    // 4-6 headline metrics (TAM, CAC, LTV, etc.)

  // Core Narrative
  problem: string                    // Customer pain — vivid, specific, quantified
  solution: string                   // How the product solves it — mechanism + differentiation
  whyNow: string                    // Market timing / catalyst / inflection point
  insight: string                   // The non-obvious founder insight that makes this work

  // Market
  marketSize: string                 // Prose fallback
  marketSizeTable?: MarketSizeRow[]  // Structured TAM/SAM/SOM table
  marketDynamics: string             // Growth vectors, tailwinds, secular trends

  // Competition & Positioning
  competitiveLandscape: string       // Prose fallback
  competitorTable?: CompetitorRow[]  // Feature comparison matrix
  competitorNames?: string[]         // Column headers for competitor table
  defensibility: string              // Moats: network effects, data, switching costs, etc.

  // Business Model
  businessModel: string              // Prose fallback
  businessModelTable?: BusinessModelRow[]  // Structured revenue levers
  goToMarket: string                // Prose fallback
  gtmPhases?: GTMPhase[]            // Structured GTM phases

  // Founder Fit
  founderAdvantage: string           // Why THIS founder/team wins
  relevantExperience: string         // Track record, domain expertise, unfair access

  // Financial Projections
  financialProjection: string        // Prose fallback
  financialProjectionTable?: FinancialProjectionRow[]  // 3-year structured projection
  unitEconomics: string              // Prose fallback
  unitEconomicsTable?: UnitEconomicsRow[]  // Structured unit economics

  // The Ask
  fundingAsk: string                // How much, what it buys, milestones it unlocks
  useOfFunds: string                // Prose fallback
  useOfFundsTable?: UseOfFundsRow[] // Structured allocation breakdown
  milestones: string[]              // Prose fallback
  milestonesTable?: MilestoneRow[]  // Structured timeline table

  // Meta
  version: number
  feedbackHistory: string[]
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
  customDomain: string | null      // e.g. projectname.loricorpuz.com
  repoName: string | null
  buildLog: string[]               // Append-only status messages
  startedAt: unknown | null
  completedAt: unknown | null
  errorMessage: string | null
  filesGenerated: number | null
  methodology?: 'standard' | 'superpowers'  // Build methodology used
  skills?: string[]                          // Skill names used in build
}

export interface Venture {
  id?: string
  ventureNumber: number            // Sequential per-user number (for Telegram targeting)
  rawInput: string                 // Original text/voice transcript
  inputSource: 'telegram_text' | 'telegram_voice' | 'dashboard'
  spec: VentureSpec
  prd: VenturePRD | null           // null until PRD is generated
  memo: VentureMemo | null          // null until pitch memo is generated
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
