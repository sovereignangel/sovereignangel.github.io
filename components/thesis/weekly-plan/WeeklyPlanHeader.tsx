'use client'

import type { WeeklyPlan } from '@/lib/types'

interface WeeklyPlanHeaderProps {
  plan: WeeklyPlan
}

export default function WeeklyPlanHeader({ plan }: WeeklyPlanHeaderProps) {
  return (
    <div className="shrink-0">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-2 pb-2 border-b-2 border-burgundy">
        <div>
          <div className="font-mono text-[9px] tracking-[3px] text-ink-muted uppercase">
            Weekly Allocation
          </div>
          <h1 className="font-serif text-[28px] font-bold text-ink tracking-tight leading-none">
            Lori Corpuz
          </h1>
          <p className="font-serif text-[14px] text-burgundy italic mt-1">
            Building the machine that builds AI businesses
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] text-ink-muted">{plan.weekLabel}</div>
          <div className="font-mono text-[10px] text-ink-faint mt-0.5">loricorpuz.com</div>
          <StatusBadge status={plan.status} />
        </div>
      </div>

      {/* Spine Resolution Banner */}
      {plan.spineResolution && (
        <div className="mt-3 p-3 bg-burgundy-bg border border-burgundy/10 border-l-[3px] border-l-burgundy rounded-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="max-w-[560px]">
              <div className="font-mono text-[9px] tracking-[2px] text-burgundy font-semibold mb-1.5">
                SPINE RESOLUTION
              </div>
              <p className="font-serif text-[16px] font-semibold text-ink leading-snug mb-1.5">
                {plan.spineResolution}
              </p>
              {plan.spineResolutionDetail && (
                <p className="font-serif text-[12px] text-ink-muted leading-relaxed">
                  {plan.spineResolutionDetail}
                </p>
              )}
            </div>
            {plan.revenueTarget && (
              <div className="text-center p-2.5 bg-white border border-rule rounded-sm">
                <div className="font-mono text-[22px] font-bold text-green-ink">{plan.revenueTarget}</div>
                <div className="font-mono text-[9px] text-ink-muted tracking-[1px] mt-0.5">WEEKLY TARGET</div>
              </div>
            )}
          </div>
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
    <span className={`inline-block font-mono text-[8px] uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-sm border mt-1 ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}
