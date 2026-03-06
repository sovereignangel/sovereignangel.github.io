import type { Timestamp } from 'firebase/firestore'

export type RegimeChangeType =
  | 'strategic_pivot'     // Major direction change (e.g., indie → PM + RL engineer)
  | 'reward_modification' // Changed weights, added/removed components
  | 'target_adjustment'   // Changed daily targets (focus hours, ask quotas)
  | 'gate_recalibration'  // Changed NS gate thresholds
  | 'component_addition'  // Added new reward component
  | 'component_removal'   // Deprecated a reward component

export type GovernanceStatus = 'active' | 'observing' | 'concluded'

export interface RewardGovernanceEntry {
  id?: string

  // What changed
  type: RegimeChangeType
  title: string                    // e.g., "Pivot: indie shipper → PM + RL engineer"
  rationale: string                // Why this change was made
  strategicContext: string         // What external/internal signal prompted this

  // Reward function changes
  changesDescription: string       // Human-readable description of what changed
  componentsAffected: string[]     // e.g., ['gvc', 'gi', 'sigma', 'kappa']
  previousWeights?: string         // Snapshot of old config (JSON or description)
  newWeights?: string              // Snapshot of new config

  // Predictions (your hypothesis about the regime change)
  predictedEffects: string         // e.g., "GVC drops 20%, GI rises 40%, Sigma rises 50%"
  expectedAdjustmentDays: number   // How many days before the new regime stabilizes
  successCriteria: string          // How you'll know this worked

  // Observed effects (filled in over time)
  status: GovernanceStatus
  observationNotes: string[]       // Running notes during observation period

  // Computed baselines (auto-filled from data)
  baselineScoreAvg?: number        // Average score in 7 days before change
  baselineComponents?: Record<string, number>  // Component averages before change
  postChangeScoreAvg?: number      // Average score after adjustment period
  postChangeComponents?: Record<string, number>

  // Resolution
  conclusion?: string              // What actually happened
  wasHypothesisCorrect?: boolean
  lessonsLearned?: string

  // Dates
  effectiveDate: string            // YYYY-MM-DD when the change takes effect
  observationEndDate?: string      // When observation period concluded

  createdAt: Timestamp
  updatedAt: Timestamp
}
