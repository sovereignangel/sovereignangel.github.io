import type { RewardComponents } from './types'

export type TrendDirection = 'improving' | 'slight_improving' | 'maintaining' | 'slight_decay' | 'decaying'

export interface AlphaBeta {
  component: string
  slope30d: number
  direction: TrendDirection
  isAlpha: boolean
  current: number
  avg30d: number
}

export const TREND_ARROWS: Record<TrendDirection, string> = {
  improving: '↑',
  slight_improving: '↗',
  maintaining: '→',
  slight_decay: '↘',
  decaying: '↓',
}

export const TREND_COLORS: Record<TrendDirection, string> = {
  improving: 'text-green-ink',
  slight_improving: 'text-green-ink/70',
  maintaining: 'text-ink-muted',
  slight_decay: 'text-amber-ink',
  decaying: 'text-red-ink',
}

/** Simple OLS linear regression: returns slope */
function linearSlope(values: number[]): number {
  const n = values.length
  if (n < 2) return 0

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += values[i]
    sumXY += i * values[i]
    sumX2 += i * i
  }

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) return 0

  return (n * sumXY - sumX * sumY) / denominator
}

function classifyTrend(slope: number): TrendDirection {
  if (slope > 0.015) return 'improving'
  if (slope > 0.005) return 'slight_improving'
  if (slope > -0.005) return 'maintaining'
  if (slope > -0.015) return 'slight_decay'
  return 'decaying'
}

const COMPONENT_KEYS: (keyof RewardComponents)[] = [
  'sleep', 'movement', 'regulation',
  'gi', 'gd', 'sigma', 'j',
  'gvc', 'kappa', 'gn', 'optionality',
]

const COMPONENT_LABELS: Record<string, string> = {
  sleep: 'S', movement: 'M', regulation: 'R',
  gi: 'GI', gd: 'GD', sigma: 'Σ', j: 'J',
  gvc: 'GVC', kappa: 'κ', gn: 'GN', optionality: '𝒪',
}

/** Compute alpha/beta for all components from recent reward scores */
export function computeAlphaBeta(
  recentComponents: Partial<RewardComponents>[]
): AlphaBeta[] {
  return COMPONENT_KEYS.map(key => {
    const values = recentComponents
      .map(c => c[key])
      .filter((v): v is number => v !== undefined)

    const current = values.length > 0 ? values[values.length - 1] : 0
    const avg = values.length > 0
      ? values.reduce((s, v) => s + v, 0) / values.length
      : 0

    const slope = linearSlope(values)
    const direction = classifyTrend(slope)

    return {
      component: COMPONENT_LABELS[key] || key,
      slope30d: slope,
      direction,
      isAlpha: slope > 0.005,
      current,
      avg30d: avg,
    }
  })
}
