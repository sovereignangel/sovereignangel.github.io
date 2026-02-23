'use client'

import { useState } from 'react'
import type { WeeklyPlan } from '@/lib/types'

interface PlanLedgerProps {
  plans: WeeklyPlan[]
  onLoadMore: () => void
}

export default function PlanLedger({ plans, onLoadMore }: PlanLedgerProps) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  if (plans.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="font-serif text-[13px] text-ink-muted">
          No past weekly plans yet.
        </div>
        <p className="font-mono text-[10px] text-ink-faint mt-1">
          Completed weeks will appear here as a browsable archive.
        </p>
      </div>
    )
  }

  return (
    <div className="py-3">
      <div className="font-mono text-[9px] tracking-[2px] text-burgundy font-semibold mb-3">
        WEEKLY PLAN HISTORY
      </div>

      <div className="space-y-1">
        {plans.map(plan => {
          const isExpanded = expandedWeek === plan.weekStartDate
          const hitCount = plan.scorecard.filter(m =>
            m.actual !== null && m.targetNumeric > 0 && m.actual >= m.targetNumeric
          ).length
          const totalMetrics = plan.scorecard.length
          const hitRate = totalMetrics > 0 ? hitCount / totalMetrics : 0

          const goalsCompleted = plan.goals.reduce((sum, g) =>
            sum + g.items.filter(i => i.completed).length, 0
          )
          const goalsTotal = plan.goals.reduce((sum, g) => sum + g.items.length, 0)

          return (
            <div key={plan.weekStartDate} className="border border-rule rounded-sm">
              {/* Row header */}
              <div
                onClick={() => setExpandedWeek(isExpanded ? null : plan.weekStartDate)}
                className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-cream transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <StatusDot hitRate={hitRate} />
                  <span className="font-serif text-[13px] font-medium text-ink">
                    {plan.weekLabel || `Week of ${plan.weekStartDate}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {totalMetrics > 0 && (
                    <span className={`font-mono text-[10px] font-semibold ${hitRateColor(hitRate)}`}>
                      {hitCount}/{totalMetrics} targets
                    </span>
                  )}
                  {goalsTotal > 0 && (
                    <span className="font-mono text-[10px] text-ink-muted">
                      {goalsCompleted}/{goalsTotal} tasks
                    </span>
                  )}
                  <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${statusStyle(plan.status)}`}>
                    {plan.status}
                  </span>
                  <span
                    className="font-mono text-[10px] text-ink-faint transition-transform duration-200"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                  >
                    ▼
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-rule">
                  {/* Scorecard summary */}
                  {plan.scorecard.length > 0 && (
                    <div className="mt-2">
                      <div className="font-mono text-[9px] text-ink-muted uppercase tracking-[1px] mb-1.5">
                        Scorecard
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {plan.scorecard.map(m => {
                          const hit = m.actual !== null && m.actual >= m.targetNumeric
                          return (
                            <div key={m.key} className="text-center p-1.5 bg-paper rounded-sm">
                              <div className="font-mono text-[8px] text-ink-muted">{m.label}</div>
                              <div className="font-mono text-[12px] font-bold text-ink">{m.target}</div>
                              {m.actual !== null && (
                                <div className={`font-mono text-[10px] font-semibold ${hit ? 'text-green-ink' : 'text-red-ink'}`}>
                                  {m.unit === '$' ? `$${m.actual}` : m.actual}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Goals summary */}
                  {plan.goals.length > 0 && (
                    <div className="mt-3">
                      <div className="font-mono text-[9px] text-ink-muted uppercase tracking-[1px] mb-1.5">
                        Goals
                      </div>
                      <div className="space-y-1">
                        {plan.goals.map(g => {
                          const done = g.items.filter(i => i.completed).length
                          const total = g.items.length
                          return (
                            <div key={g.id} className="flex items-center justify-between py-1 border-b border-rule-light last:border-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-1.5 h-1.5 rounded-sm shrink-0"
                                  style={{ backgroundColor: g.accent }}
                                />
                                <span className="font-serif text-[11px] text-ink">{g.title}</span>
                              </div>
                              <span className={`font-mono text-[10px] font-semibold ${done === total ? 'text-green-ink' : 'text-ink-muted'}`}>
                                {done}/{total}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Retro summary */}
                  {plan.retrospective?.aiSummary && (
                    <div className="mt-3">
                      <div className="font-mono text-[9px] text-ink-muted uppercase tracking-[1px] mb-1.5">
                        Retrospective
                      </div>
                      <p className="font-serif text-[11px] text-ink-muted leading-relaxed line-clamp-3">
                        {plan.retrospective.aiSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusDot({ hitRate }: { hitRate: number }) {
  const color = hitRate >= 0.8 ? 'bg-green-ink' : hitRate >= 0.5 ? 'bg-amber-ink' : 'bg-red-ink'
  return <span className={`w-2 h-2 rounded-sm shrink-0 ${color}`} />
}

function hitRateColor(rate: number): string {
  if (rate >= 0.8) return 'text-green-ink'
  if (rate >= 0.5) return 'text-amber-ink'
  return 'text-red-ink'
}

function statusStyle(status: string): string {
  const styles: Record<string, string> = {
    draft: 'text-amber-ink border-amber-ink/20 bg-amber-bg',
    active: 'text-green-ink border-green-ink/20 bg-green-bg',
    completed: 'text-ink-muted border-rule bg-cream',
  }
  return styles[status] || styles.draft
}
