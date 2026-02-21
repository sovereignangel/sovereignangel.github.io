export interface RewardComponents {
  ge: number           // Generative Energy [0, 1]
  gi: number           // Intelligence Growth Rate [0, 1]
  gvc: number          // Value Creation Rate [0, 1]
  kappa: number        // Capture Ratio [0, 1]
  optionality: number  // Optionality [0, 1] (placeholder)
  gd: number           // Generative Discovery [0, 1]
  gn: number           // Network Capital [0, 1]
  j: number            // Judgment + Cognition [0, 1]
  fragmentation: number // Fragmentation Tax [0, 1] (placeholder)
  theta: number        // Thesis Coherence [0, 1]
  gate: number         // Nervous System Gate [0.3, 1.0]
}

export interface RewardScore {
  score: number              // Final scalar [0, 10]
  delta: number | null       // Day-over-day score change
  components: RewardComponents
  computedAt: string         // ISO timestamp
}
