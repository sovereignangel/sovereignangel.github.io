'use client'

import { useState, useRef, useEffect } from 'react'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { computeGE } from '@/lib/reward'
import { BODY_FELT_SCORE, NS_STATE_ENERGY_SCORE, TRAINING_SCORE } from '@/lib/constants'
import EnergySlideOut from './EnergySlideOut'

interface SubComponent {
  label: string
  value: string
  score: number
}

export default function EnergyStatusDot() {
  const { log, garminData } = useDailyLogContext()
  const [showHover, setShowHover] = useState(false)
  const [showSlideOut, setShowSlideOut] = useState(false)
  const hoverRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const geScore = log.rewardScore?.components?.ge ?? null
  const gateValue = log.rewardScore?.components?.gate ?? 1.0

  // Compute sub-component scores for dots
  const sleepScore = log.sleepHours ? Math.min(log.sleepHours / 7.5, 1) : 0
  const trainingTypes = log.trainingTypes && log.trainingTypes.length > 0
    ? log.trainingTypes
    : log.trainingType ? [log.trainingType] : []
  const trainingScore = trainingTypes.length > 0
    ? Math.max(...trainingTypes.map(t => TRAINING_SCORE[t] ?? 0.2))
    : 0.2
  const nsScore = NS_STATE_ENERGY_SCORE[log.nervousSystemState || 'regulated'] ?? 1.0
  const bodyScore = BODY_FELT_SCORE[log.bodyFelt || 'neutral'] ?? 0.6

  const subComponents: SubComponent[] = [
    { label: 'Sleep', value: log.sleepHours ? `${log.sleepHours}h` : '—', score: sleepScore },
    { label: 'Training', value: trainingTypes.length > 0 ? trainingTypes.join(', ') : 'None', score: trainingScore },
    { label: 'NS State', value: log.nervousSystemState === 'regulated' ? 'Regulated' : log.nervousSystemState === 'slightly_spiked' ? 'Slight' : log.nervousSystemState === 'spiked' ? 'Spiked' : log.nervousSystemState === 'sick' ? 'Sick' : '—', score: nsScore },
    { label: 'Body', value: log.bodyFelt ? log.bodyFelt.charAt(0).toUpperCase() + log.bodyFelt.slice(1) : '—', score: bodyScore },
  ]

  const dotColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-ink'
    if (score >= 0.4) return 'bg-amber-ink'
    return 'bg-red-ink'
  }

  const scoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-ink'
    if (score >= 0.4) return 'text-amber-ink'
    return 'text-red-ink'
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShowHover(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowHover(false), 200)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <>
      <div
        ref={hoverRef}
        className="relative flex items-center gap-0.5 cursor-pointer px-1.5 py-1 rounded-sm hover:bg-cream transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="font-mono text-[9px] text-ink-muted mr-0.5">GE</span>
        {subComponents.map((c, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${dotColor(c.score)} transition-colors`}
            title={`${c.label}: ${c.value}`}
          />
        ))}

        {/* Hover Panel */}
        {showHover && (
          <div
            className="absolute right-0 top-full mt-1 z-50 bg-paper border border-rule rounded-sm shadow-sm p-2 min-w-[220px]"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-rule">
              <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                Vitality
              </span>
              <span className={`font-mono text-[12px] font-bold ${geScore !== null ? scoreColor(geScore) : 'text-ink-muted'}`}>
                GE {geScore !== null ? (geScore * 100).toFixed(0) : '—'}
              </span>
            </div>

            {/* Sub-components */}
            {subComponents.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <span className="font-sans text-[10px] text-ink-muted">{c.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-ink">{c.value}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor(c.score)}`} />
                  <span className={`font-mono text-[9px] font-medium ${scoreColor(c.score)}`}>
                    {c.score.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Garmin HRV if available */}
            {garminData && (
              <div className="flex items-center justify-between py-0.5">
                <span className="font-sans text-[10px] text-ink-muted">
                  HRV <span className="font-mono text-[7px] text-green-ink">G</span>
                </span>
                <span className="font-mono text-[10px] text-ink">
                  {garminData.hrvRmssd ? `${Math.round(garminData.hrvRmssd)}ms` : '—'}
                </span>
              </div>
            )}

            {/* Gate */}
            <div className="flex items-center justify-between py-0.5 mt-0.5 pt-1 border-t border-rule-light">
              <span className="font-sans text-[10px] text-ink-muted">Gate</span>
              <span className={`font-mono text-[10px] font-semibold ${gateValue >= 1.0 ? 'text-green-ink' : gateValue >= 0.7 ? 'text-amber-ink' : 'text-red-ink'}`}>
                {gateValue.toFixed(1)} {gateValue < 1.0 ? '(active)' : ''}
              </span>
            </div>

            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowHover(false)
                setShowSlideOut(true)
              }}
              className="w-full mt-1.5 font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted hover:border-burgundy hover:text-burgundy transition-colors"
            >
              Edit Energy Inputs
            </button>
          </div>
        )}
      </div>

      {/* Slide-out panel */}
      {showSlideOut && (
        <EnergySlideOut onClose={() => setShowSlideOut(false)} />
      )}
    </>
  )
}
