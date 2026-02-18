import type { Timestamp } from './shared'

// ─── ENUMS ────────────────────────────────────────────────────────────

export type ContactTier = 'decision_maker' | 'connector' | 'peer_operator'
export type SalesBelt = 'white' | 'blue' | 'purple' | 'brown' | 'black'
export type TrustStage = 1 | 2 | 3 | 4 | 5 | 6

// ─── SYSTEM STATE (Bridgewater diagnostic) ────────────────────────────

export type SystemState = 'NOMINAL' | 'WATCH' | 'CAUTION' | 'CRITICAL'

export function getSystemState(value: number, thresholds?: { nominal: number; watch: number; caution: number }): SystemState {
  const t = thresholds ?? { nominal: 0.7, watch: 0.5, caution: 0.3 }
  if (value >= t.nominal) return 'NOMINAL'
  if (value >= t.watch) return 'WATCH'
  if (value >= t.caution) return 'CAUTION'
  return 'CRITICAL'
}

export const SYSTEM_STATE_COLORS: Record<SystemState, { text: string; bg: string; border: string }> = {
  NOMINAL:  { text: 'text-green-ink',  bg: 'bg-green-bg',    border: 'border-green-ink/20' },
  WATCH:    { text: 'text-ink',        bg: 'bg-transparent',  border: 'border-rule' },
  CAUTION:  { text: 'text-amber-ink',  bg: 'bg-amber-bg',    border: 'border-amber-ink/20' },
  CRITICAL: { text: 'text-red-ink',    bg: 'bg-red-bg',      border: 'border-red-ink/20' },
}

// ─── NETWORK CONTACT ──────────────────────────────────────────────────

export interface NetworkContact {
  id?: string
  name: string
  tier: ContactTier
  relationshipStrength: number        // 1-10
  lastTouchDate: string               // YYYY-MM-DD
  nextAction: string
  whatTheyControl: string
  yourValueToThem: string
  trustStage: TrustStage
  warmIntrosGenerated: number
  isTop30: boolean
  notes?: string
  email?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── SALES ASSESSMENT (Monthly Bridgewater Audit) ─────────────────────

export interface RuinConditions {
  fragmented: boolean                 // All 30 contacts weak, no warm intros
  unclear: boolean                    // Message unclear, people don't get it
  noValue: boolean                    // All interactions are asks, no value delivery
}

export interface LayerScores {
  intros: number                      // 1-10: message clarity, warm intro generation
  understanding: number               // 1-10: know their goals, pain, network
  trust: number                       // 1-10: follow through, vulnerability, care
  allies: number                      // 1-10: help them win first, celebrate publicly
  asks: number                        // 1-10: crisp ask, earned, low pressure
  rhythm: number                      // 1-10: monthly tier 1, quarterly tier 2-3
  cohort: number                      // 1-10: peer operators meet quarterly
}

export interface SalesAssessment {
  id?: string
  date: string                        // YYYY-MM-DD (1st of month)
  currentBelt: SalesBelt
  beltProgress: number                // 0-100 within current belt
  oneLiner: string
  oneLinerClarityScore: number        // 1-5
  coldResponseRate: number            // percentage
  warmConversionRate: number          // percentage
  warmIntroRate: number               // percentage
  testimonialsCount: number
  contentPublished: number
  inboundInquiriesMonth: number
  ruinConditions: RuinConditions
  layerScores: LayerScores
  nextMonthFocus: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── MONTHLY METRICS (auto-aggregated from daily logs) ───────────────

export interface MonthlyMetrics {
  totalShips: number
  totalAsks: number
  totalPosts: number
  avgFocusHours: number
  totalRevenue: number
  daysWithOutput: number
  daysTracked: number
  shipsPerWeek: number
  asksPerWeek: number
  postsPerWeek: number
  twentyFourHourPct: number
  noEmotionalTextingPct: number
  publicPct: number
  feedbackPct: number
  totalConversations: number
  totalInsights: number
  avgScore: number
  scoreTrajectory: number
  contactCount: number
  top30Count: number
  avgStrength: number
  touchedIn30d: number
  staleCount: number
}

// ─── CONSTANTS ────────────────────────────────────────────────────────

export const TRUST_STAGE_LABELS: Record<TrustStage, string> = {
  1: 'Introduction',
  2: 'First Conversation',
  3: 'Value Delivery',
  4: 'Repeated Touch',
  5: 'Mutual Advocacy',
  6: 'Compounding Partnership',
}

export const BELT_ORDER: SalesBelt[] = ['white', 'blue', 'purple', 'brown', 'black']

export const BELT_LABELS: Record<SalesBelt, string> = {
  white: 'White Belt',
  blue: 'Blue Belt',
  purple: 'Purple Belt',
  brown: 'Brown Belt',
  black: 'Black Belt',
}

export const TIER_LABELS: Record<ContactTier, string> = {
  decision_maker: 'Decision-Maker',
  connector: 'Connector',
  peer_operator: 'Peer Operator',
}
