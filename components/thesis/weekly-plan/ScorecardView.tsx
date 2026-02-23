'use client'

import type { WeeklyScorecardMetric } from '@/lib/types'

interface ScorecardViewProps {
  scorecard: WeeklyScorecardMetric[]
}

export default function ScorecardView({ scorecard }: ScorecardViewProps) {
  if (scorecard.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="font-serif text-[13px] text-ink-muted">
          No scorecard targets set.
        </div>
      </div>
    )
  }

  return (
    <div className="py-3">
      <div className="font-mono text-[9px] tracking-[2px] text-burgundy font-semibold mb-3">
        WEEKLY SCORECARD — RUIN CONDITIONS
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {scorecard.map(metric => {
          const hitRate = metric.actual !== null && metric.targetNumeric > 0
            ? metric.actual / metric.targetNumeric
            : null

          return (
            <div key={metric.key} className="p-3 bg-paper border border-rule rounded-sm text-center">
              {/* Target */}
              <div className="font-mono text-[20px] font-bold text-ink">{metric.target}</div>
              <div className="font-mono text-[8px] tracking-[0.5px] text-ink-muted mt-1 uppercase">
                {metric.label}
              </div>

              {/* Actual vs Target */}
              {metric.actual !== null && (
                <div className="mt-2 pt-2 border-t border-rule-light">
                  <div className={`font-mono text-[14px] font-bold ${actualColor(hitRate)}`}>
                    {formatActual(metric)}
                  </div>
                  <div className="font-mono text-[8px] text-ink-muted mt-0.5">ACTUAL</div>
                  {hitRate !== null && (
                    <div className="mt-1">
                      <div className="flex h-1 rounded-sm overflow-hidden bg-rule-light">
                        <div
                          className={`transition-all ${progressColor(hitRate)}`}
                          style={{ width: `${Math.min(hitRate * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Ruin warning */}
      <div className="mt-2 p-2 bg-burgundy-bg rounded-sm text-center">
        <span className="font-mono text-[9px] text-burgundy font-semibold tracking-[0.5px]">
          ANY METRIC AT ZERO = MULTIPLICATIVE RUIN · g* COLLAPSES · NO EXCEPTIONS
        </span>
      </div>
    </div>
  )
}

function formatActual(metric: WeeklyScorecardMetric): string {
  if (metric.actual === null) return '—'
  if (metric.unit === '$') return `$${metric.actual.toLocaleString()}`
  if (metric.key === 'sleep') return `${metric.actual}/7`
  return String(metric.actual)
}

function actualColor(hitRate: number | null): string {
  if (hitRate === null) return 'text-ink-muted'
  if (hitRate >= 0.8) return 'text-green-ink'
  if (hitRate >= 0.5) return 'text-amber-ink'
  return 'text-red-ink'
}

function progressColor(hitRate: number): string {
  if (hitRate >= 0.8) return 'bg-green-ink'
  if (hitRate >= 0.5) return 'bg-amber-ink'
  return 'bg-red-ink'
}
