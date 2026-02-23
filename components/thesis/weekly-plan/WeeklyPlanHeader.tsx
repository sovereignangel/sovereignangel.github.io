'use client'

import type { WeeklyPlan } from '@/lib/types'

interface WeeklyPlanHeaderProps {
  plan: WeeklyPlan
}

export default function WeeklyPlanHeader({ plan }: WeeklyPlanHeaderProps) {
  return (
    <div className="shrink-0">
      {/* Header row — compact */}
      <div className="flex items-center justify-between pb-1.5 border-b-2 border-burgundy">
        <div className="font-mono text-[9px] tracking-[3px] text-ink-muted uppercase">
          Weekly Allocation
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-muted">{plan.weekLabel}</span>
          <StatusBadge status={plan.status} />
        </div>
      </div>

      {/* Spine Resolution — compact */}
      {plan.spineResolution && (
        <div className="mt-1.5 px-2.5 py-1.5 bg-burgundy-bg border border-burgundy/10 border-l-[3px] border-l-burgundy rounded-sm flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[8px] tracking-[1.5px] text-burgundy font-semibold uppercase">
              SPINE{' '}
            </span>
            <span className="font-serif text-[12px] font-semibold text-ink">
              {plan.spineResolution}
            </span>
            {plan.spineResolutionDetail && (
              <span className="font-serif text-[12px] text-ink-muted ml-1.5">
                — {plan.spineResolutionDetail}
              </span>
            )}
          </div>
          {plan.revenueTarget && (
            <div className="shrink-0 text-center px-2 py-1 bg-white border border-rule rounded-sm">
              <div className="font-mono text-[14px] font-bold text-green-ink leading-none">{plan.revenueTarget}</div>
              <div className="font-mono text-[7px] text-ink-muted tracking-[0.5px] mt-0.5">TARGET</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'text-amber-ink border-amber-ink/20 bg-amber-bg',
    active: 'text-green-ink border-green-ink/20 bg-green-bg',
    completed: 'text-ink-muted border-rule bg-cream',
  }
  return (
    <span className={`inline-block font-mono text-[8px] uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-sm border ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}
