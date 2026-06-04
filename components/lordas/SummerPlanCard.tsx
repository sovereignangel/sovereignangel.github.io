'use client'

import type { SummerPlan } from '@/lib/types'
import { DreamsConstraintsSummary } from './DreamsConstraintsSummary'

interface SummerPlanCardProps {
  plan: SummerPlan | null
}

export function SummerPlanCard({ plan }: SummerPlanCardProps) {
  if (!plan) {
    return (
      <div className="bg-white border border-rule rounded-sm p-4">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-2 border-b border-rule">
          Summer Plan
        </h3>
        <p className="text-[11px] text-ink-muted">No summer plan created yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-rule rounded-sm p-4 space-y-4">
      <div>
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-2 border-b border-rule">
          Summer Plan {plan.year}
        </h3>
        <div className="text-[10px] font-mono text-ink-muted">
          {plan.dateRange.start} to {plan.dateRange.end}
        </div>
      </div>

      {/* Dreams & Constraints */}
      {plan.dreamsConstraints.length > 0 && (
        <div className="space-y-2 py-3 border-t border-rule-light">
          <h4 className="text-[10px] font-mono uppercase tracking-[0.08em] text-burgundy">
            Dreams & Constraints
          </h4>
          <DreamsConstraintsSummary items={plan.dreamsConstraints} />
        </div>
      )}

      {/* Milestones */}
      {plan.milestones.length > 0 && (
        <div className="space-y-2 py-3 border-t border-rule-light">
          <h4 className="text-[10px] font-mono uppercase tracking-[0.08em] text-burgundy">
            Milestones
          </h4>
          <div className="space-y-2">
            {plan.milestones.map((m, i) => (
              <div key={i} className="text-[10px]">
                <div className="font-semibold text-ink">{m.date}</div>
                <div className="text-[10px] text-ink font-mono">{m.title}</div>
                {m.description && (
                  <div className="text-[10px] text-ink-muted">{m.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priorities & Focuses */}
      {(plan.priorities.length > 0 || plan.focuses.length > 0) && (
        <div className="space-y-2 py-3 border-t border-rule-light">
          {plan.priorities.length > 0 && (
            <div>
              <h5 className="text-[10px] font-mono uppercase tracking-[0.08em] text-burgundy mb-1">
                Priorities
              </h5>
              <ul className="space-y-1">
                {plan.priorities.map((p, i) => (
                  <li key={i} className="text-[10px] text-ink">
                    · {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.focuses.length > 0 && (
            <div>
              <h5 className="text-[10px] font-mono uppercase tracking-[0.08em] text-burgundy mb-1">
                Focuses
              </h5>
              <ul className="space-y-1">
                {plan.focuses.map((f, i) => (
                  <li key={i} className="text-[10px] text-ink">
                    · {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Cost */}
      {plan.estimatedCost > 0 && (
        <div className="py-3 border-t border-rule-light">
          <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-burgundy mb-1">
            Estimated Cost
          </div>
          <div className="font-mono text-[13px] text-ink font-semibold">
            €{plan.estimatedCost.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}
