export type QuantTopic =
  | 'probability_statistics'
  | 'linear_algebra'
  | 'calculus_optimization'
  | 'stochastic_processes'
  | 'time_series'
  | 'portfolio_theory'
  | 'signal_processing'
  | 'algorithm_design'

export type QuantDifficulty = 1 | 2 | 3 | 4 | 5

export const QUANT_TOPIC_LABELS: Record<QuantTopic, string> = {
  probability_statistics: 'Probability & Statistics',
  linear_algebra: 'Linear Algebra',
  calculus_optimization: 'Calculus & Optimization',
  stochastic_processes: 'Stochastic Processes',
  time_series: 'Time Series',
  portfolio_theory: 'Portfolio Theory',
  signal_processing: 'Signal Processing',
  algorithm_design: 'Algorithm Design',
}

export const QUANT_LEVEL_TITLES: Record<number, string> = {
  1: 'Apprentice', 2: 'Apprentice', 3: 'Apprentice',
  4: 'Analyst', 5: 'Analyst', 6: 'Analyst',
  7: 'Strategist', 8: 'Strategist', 9: 'Strategist',
  10: 'Quant', 11: 'Quant', 12: 'Quant',
  13: 'Grandmaster',
}

export interface QuantProblem {
  date: string
  topic: QuantTopic
  difficulty: QuantDifficulty
  title: string
  statement: string
  hints: string[]
  solution: string
  keyInsight: string
  financeApplication: string
  status: 'unseen' | 'attempted' | 'solved' | 'skipped'
  userAnswer?: string
  hintsUsed: number
  selfRating?: 1 | 2 | 3 | 4 | 5
  generatedAt?: unknown
  completedAt?: unknown
}

export interface QuantTopicStat {
  attempted: number
  solved: number
  avgDifficulty: number
  lastPracticed: string
}

export interface QuantStats {
  currentStreak: number
  longestStreak: number
  lastPracticeDate: string
  totalSolved: number
  totalAttempted: number
  xp: number
  level: number
  topicStats: Partial<Record<QuantTopic, QuantTopicStat>>
}

export const DEFAULT_QUANT_STATS: QuantStats = {
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: '',
  totalSolved: 0,
  totalAttempted: 0,
  xp: 0,
  level: 1,
  topicStats: {},
}
