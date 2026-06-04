'use client'

import type { SummerPlan } from '@/lib/types'

interface PlanCalendarGridProps {
  plan: SummerPlan
}

export function PlanCalendarGrid({ plan }: PlanCalendarGridProps) {
  const getPhaseColor = (icon: string): string => {
    const colors: Record<string, string> = {
      morocco: '#C0703F',
      base: '#E7D9BE',
      spoke: '#6E1423',
      ride: '#A87A2C',
      como: '#560E1A',
    }
    return colors[icon] || '#D8CBB2'
  }

  const getPhaseTextColor = (icon: string): string => {
    const colors: Record<string, string> = {
      morocco: '#FBF6EC',
      base: '#5A5046',
      spoke: '#FBF6EC',
      ride: '#FBF6EC',
      como: '#FBF6EC',
    }
    return colors[icon] || '#2a2420'
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
