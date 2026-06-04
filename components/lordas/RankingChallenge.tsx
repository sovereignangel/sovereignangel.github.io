'use client'

import type { SummerPlan } from '@/lib/types'
import { computePlanStats } from '@/lib/adventure-scheming'

interface RankingChallengeProps {
  planA: SummerPlan
  planB: SummerPlan
  onChoose: (winnerId: string) => void
  onSkip?: () => void
}

export function RankingChallenge({ planA, planB, onChoose, onSkip }: RankingChallengeProps) {
  const statsA = computePlanStats(planA)
  const statsB = computePlanStats(planB)

  const PlanCompareCard = ({ plan, stats, side }: { plan: SummerPlan; stats: ReturnType<typeof computePlanStats>; side: 'left' | 'right' }) => (
    <div
      style={{
        padding: '16px',
        background: '#faf8f4',
        border: '2px solid #d8cfc4',
        borderRadius: '8px',
        flex: 1,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#b85c38'
        e.currentTarget.style.background = '#ebe4d4'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#d8cfc4'
        e.currentTarget.style.background = '#faf8f4'
      }}
      onClick={() => onChoose(plan.id)}
    >
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#2a2420', marginBottom: '12px' }}>
        {plan.phases[0]?.name} → {plan.phases[plan.phases.length - 1]?.name}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div style={{ padding: '8px', background: '#ebe4d4', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#8a7e72' }}>Kiting</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2a2420' }}>{Math.round(stats.kitingHours)}h</div>
        </div>
        <div style={{ padding: '8px', background: '#ebe4d4', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#8a7e72' }}>Cycling</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2a2420' }}>{Math.round(stats.cyclingMiles)}mi</div>
        </div>
        <div style={{ padding: '8px', background: '#ebe4d4', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#8a7e72' }}>Budget</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2a2420' }}>${(stats.budget / 1000).toFixed(1)}k</div>
        </div>
        <div style={{ padding: '8px', background: '#ebe4d4', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#8a7e72' }}>Cities</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2a2420' }}>{Math.round(stats.citiesCount)}</div>
        </div>
      </div>

      {/* Phase previews */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {plan.phases.map((phase) => (
          <span
            key={phase.name}
            style={{
              padding: '4px 8px',
              background: getPhaseColor(phase.icon),
              color: getPhaseTextColor(phase.icon),
              borderRadius: '3px',
              fontSize: '9px',
              fontWeight: 600,
            }}
          >
            {phase.name}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#faf8f4',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#b85c38',
            marginBottom: '24px',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Which excites you more?
        </h2>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <PlanCompareCard plan={planA} stats={statsA} side="left" />
          <PlanCompareCard plan={planB} stats={statsB} side="right" />
        </div>

        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#8a7e72',
              border: '1px solid #d8cfc4',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Skip this ranking
          </button>
        )}
      </div>
    </div>
  )
}

function getPhaseColor(icon: string): string {
  const colors: Record<string, string> = {
    morocco: '#C0703F',
    base: '#E7D9BE',
    spoke: '#6E1423',
    ride: '#A87A2C',
    como: '#560E1A',
  }
  return colors[icon] || '#D8CBB2'
}

function getPhaseTextColor(icon: string): string {
  const colors: Record<string, string> = {
    morocco: '#FBF6EC',
    base: '#5A5046',
    spoke: '#FBF6EC',
    ride: '#FBF6EC',
    como: '#FBF6EC',
  }
  return colors[icon] || '#2a2420'
}
