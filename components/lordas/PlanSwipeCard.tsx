'use client'

import { useState } from 'react'
import type { SummerPlan } from '@/lib/types'
import { computePlanStats } from '@/lib/adventure-scheming'

interface PlanSwipeCardProps {
  plan: SummerPlan
  index: number
  total: number
  onSwipe: (vote: 'right' | 'left' | 'maybe', feedback?: string) => void
  onUndo?: () => void
}

export function PlanSwipeCard({ plan, index, total, onSwipe, onUndo }: PlanSwipeCardProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const stats = computePlanStats(plan)

  const handleLeftSwipe = () => {
    setShowFeedback(true)
  }

  const submitFeedback = () => {
    onSwipe('left', feedback)
    setFeedback('')
    setShowFeedback(false)
  }

  const handleRight = () => {
    onSwipe('right')
  }

  const handleMaybe = () => {
    onSwipe('maybe')
  }

  if (showFeedback) {
    return (
      <div
        style={{
          background: '#faf8f4',
          border: '1px solid #d8cfc4',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        <h3 style={{ marginBottom: '16px', color: '#b85c38', fontSize: '14px', fontWeight: 600 }}>
          What's driving the no?
        </h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Visa issues, budget, timing, other..."
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #d8cfc4',
            borderRadius: '4px',
            minHeight: '60px',
            marginBottom: '12px',
            fontFamily: 'inherit',
            fontSize: '13px',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={submitFeedback}
            style={{
              flex: 1,
              background: '#b85c38',
              color: '#faf7f2',
              padding: '10px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Submit
          </button>
          <button
            onClick={() => setShowFeedback(false)}
            style={{
              flex: 1,
              background: 'transparent',
              color: '#8a7e72',
              padding: '10px',
              border: '1px solid #d8cfc4',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#faf8f4',
        border: '1px solid #d8cfc4',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      {/* Progress */}
      <div style={{ fontSize: '11px', color: '#8a7e72', marginBottom: '16px', textAlign: 'center' }}>
        PLAN {index + 1} OF {total}
      </div>

      {/* Plan info */}
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: '#2a2420' }}>
        {plan.phases[0]?.name} → {plan.phases[plan.phases.length - 1]?.name}
      </h2>

      {/* Visual calendar preview (simplified) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '20px',
          padding: '16px',
          background: '#ebe4d4',
          borderRadius: '4px',
        }}
      >
        {plan.phases.map((phase) => (
          <div
            key={phase.name}
            style={{
              padding: '8px',
              background: getPhaseColor(phase.icon),
              color: '#faf7f2',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {phase.name}
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Kiting" value={Math.round(stats.kitingHours) + ' hrs'} />
        <StatCard label="Cycling" value={Math.round(stats.cyclingMiles) + ' mi'} />
        <StatCard label="Budget" value={'$' + stats.budget.toLocaleString()} />
        <StatCard label="Transit" value={Math.round(stats.transitHours) + ' hrs'} />
        <StatCard label="Cities" value={Math.round(stats.citiesCount)} />
        <StatCard label="Friends" value={Math.round(stats.friendsCount)} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={handleLeftSwipe}
          style={{
            flex: 1,
            padding: '12px',
            background: '#ebe4d4',
            color: '#b85c38',
            border: '1px solid #d8cfc4',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          👋 Not now
        </button>
        <button
          onClick={handleMaybe}
          style={{
            flex: 1,
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
          ? Maybe
        </button>
        <button
          onClick={handleRight}
          style={{
            flex: 1,
            padding: '12px',
            background: '#b85c38',
            color: '#faf7f2',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          ❤️ Love
        </button>
      </div>

      {onUndo && (
        <button
          onClick={onUndo}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            color: '#8a7e72',
            border: '1px solid #d8cfc4',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          ↶ Undo last swipe
        </button>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: '12px',
        background: '#ebe4d4',
        borderRadius: '4px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '10px', color: '#8a7e72', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#2a2420' }}>{value}</div>
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
