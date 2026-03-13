export interface RewardComponents {
  // Body pillar (3 components)
  sleep: number        // Sleep quality [0, 1]
  movement: number     // Steps + training program [0, 1]
  regulation: number   // Nervous system regulation [0, 1]
  // Brain pillar (4 components)
  gi: number           // Intelligence Growth Rate [0, 1]
  gd: number           // Generative Discovery [0, 1]
  sigma: number        // Skill Building [0, 1]
  j: number            // Judgment + Cognition [0, 1]
  // Build pillar (4 components)
  gvc: number          // Value Creation Rate [0, 1]
  kappa: number        // Capture Ratio [0, 1]
  gn: number           // Network Capital [0, 1]
  optionality: number  // Optionality [0, 1]
  // Modifiers
  fragmentation: number // Fragmentation Tax [0, 1]
  gate: number         // Nervous System Gate [0.2, 1.0]
  // Pillar scores (geometric sub-means of *logged* components)
  body: number         // (sleep · movement · regulation)^(1/n) [0, 1]
  brain: number        // geo_mean of logged brain components    [0, 1]
  build: number        // geo_mean of logged build components    [0, 1]
  // Cascading compound: body × (1 + brain) × (1 + build) / 4
  compound: number     // Pre-gate cascading score [0, 1]
  // Trajectory
  streak: number       // Consecutive days logged (0+)
  streakBonus: number  // Streak multiplier bonus [0, 0.15]
  // Legacy (kept for old data compatibility)
  ge?: number          // Former Generative Energy (deprecated)
  theta?: number       // Former Thesis Coherence (deprecated)
}

export interface RewardScore {
  score: number              // Final scalar [0, 10]
  delta: number | null       // Day-over-day score change
  components: RewardComponents
  computedAt: string         // ISO timestamp
}
