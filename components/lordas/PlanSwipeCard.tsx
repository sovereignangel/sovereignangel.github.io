'use client'

import { useState, useEffect } from 'react'
import type { SummerPlan } from '@/lib/types'
import { computePlanStats } from '@/lib/adventure-scheming'
import { PlanCalendarGrid } from './PlanCalendarGrid'
import { PlanWorldMap } from './PlanWorldMap'

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
  const [touchStart, setTouchStart] = useState(0)
  const [cardRotation, setCardRotation] = useState(0)
  const [cardOpacity, setCardOpacity] = useState(1)
  const stats = computePlanStats(plan)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (showFeedback) return
    const touchCurrent = e.touches[0].clientX
    const diff = touchCurrent - touchStart
    const rotation = diff / 20
    const opacity = Math.max(0.6, 1 - Math.abs(diff) / 400)
    setCardRotation(rotation)
    setCardOpacity(opacity)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchEnd - touchStart

    setCardRotation(0)
    setCardOpacity(1)

    // Swipe threshold: 100px
    if (diff > 100) {
      onSwipe('right')
    } else if (diff < -100) {
      onSwipe('left')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFeedback) return
      if (e.key === 'ArrowRight') {
        handleRight()
      } else if (e.key === 'ArrowLeft') {
        handleLeftSwipe()
      } else if (e.key === '?') {
        handleMaybe()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showFeedback])

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
        transform: `rotate(${cardRotation}deg)`,
        opacity: cardOpacity,
        transition: cardRotation === 0 ? 'all 0.3s ease' : 'none',
        cursor: 'grab',
        userSelect: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress */}
      <div style={{ fontSize: '11px', color: '#8a7e72', marginBottom: '16px', textAlign: 'center' }}>
        PLAN {index + 1} OF {total}
      </div>

      {/* Plan info */}
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: '#2a2420' }}>
        {plan.phases[0]?.name} → {plan.phases[plan.phases.length - 1]?.name}
      </h2>

      {/* Calendar grid view */}
      <div style={{ marginBottom: '20px' }}>
        <PlanCalendarGrid plan={plan} />
      </div>

      {/* World map with route */}
      <div style={{ marginBottom: '20px' }}>
        <PlanWorldMap plan={plan} compact={true} />
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
          title="Keyboard: Left Arrow"
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
          title="Keyboard: ?"
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
          title="Keyboard: Right Arrow"
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

      {/* Keyboard help */}
      <div
        style={{
          padding: '12px',
          background: '#ebe4d4',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#8a7e72',
          textAlign: 'center',
          marginBottom: '12px',
        }}
      >
        Desktop: arrow keys (← / →) or ? key
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
