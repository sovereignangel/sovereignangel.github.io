'use client'

import type { SummerPlan } from '@/lib/types'

interface PlanCalendarGridProps {
  plan: SummerPlan
}

export function PlanCalendarGrid({ plan }: PlanCalendarGridProps) {
  const getPhaseColor = (icon: string): string => {
    const colors: Record<string, string> = {
      morocco: '#DE7259',
      base: '#2E1F16',
      spoke: '#DE7259',
      ride: '#D9A63F',
      como: '#DE7259',
    }
    return colors[icon] || '#3E2C20'
  }

  const getPhaseTextColor = (icon: string): string => {
    const colors: Record<string, string> = {
      morocco: '#1B120C',
      base: '#836F5C',
      spoke: '#1B120C',
      ride: '#1B120C',
      como: '#1B120C',
    }
    return colors[icon] || '#F2E8DA'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '6px' }}>
      {plan.phases.map((phase) => {
        const startDate = new Date(phase.startDate)
        const endDate = new Date(phase.endDate)
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

        return (
          <div
            key={phase.name}
            style={{
              padding: '8px',
              background: getPhaseColor(phase.icon),
              color: getPhaseTextColor(phase.icon),
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '11px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '10px' }}>{phase.name}</div>
            <div style={{ fontSize: '9px', opacity: 0.85 }}>
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div style={{ fontSize: '9px', opacity: 0.7 }}>{days} days</div>
          </div>
        )
      })}
    </div>
  )
}
