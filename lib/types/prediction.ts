export type PredictionStatus = 'active' | 'pending_review' | 'reviewed'
export type PredictionDomain = 'market' | 'relationship' | 'product' | 'revenue' | 'personal'

export interface Prediction {
  id?: string
  prediction: string           // "I predict that..."
  reasoning: string            // Why they believe this
  domain: PredictionDomain
  confidenceLevel: number      // 0-100
  timeHorizon: number          // days until review
  reviewDate: string           // YYYY-MM-DD
  linkedProjectNames: string[]
  linkedContactNames: string[]

  // Filled at review time
  status: PredictionStatus
  actualOutcome?: string       // What actually happened
  wasCorrect?: boolean | null  // true/false/partially
  surprises?: string           // What surprised you
  lessonsLearned?: string      // What you learned

  // Calibration metadata
  antithesis?: string          // AI-generated counter-argument at creation time

  createdAt: unknown           // Timestamp
  updatedAt: unknown           // Timestamp
  reviewedAt?: string          // YYYY-MM-DD when reviewed
}

// Aggregate calibration stats
export interface CalibrationScore {
  totalPredictions: number
  reviewedPredictions: number
  correctCount: number
  incorrectCount: number
  partialCount: number
  overallAccuracy: number       // correctCount / reviewedPredictions
  // Calibration by confidence bucket
  buckets: Array<{
    confidenceRange: string     // e.g. "60-70%"
    predicted: number           // how many predictions in this range
    actualCorrect: number       // how many were actually correct
    calibrationError: number    // |predicted% - actual%|
  }>
  // Calibration by domain
  domainAccuracy: Record<PredictionDomain, { total: number; correct: number; accuracy: number }>
  // Blind spots
  systematicBiases: string[]    // AI-generated insights about systematic over/under-confidence
}
