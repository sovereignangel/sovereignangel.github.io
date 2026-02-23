'use client'

import { useState } from 'react'
import { REWARD_PILLARS, REWARD_COMPONENT_META } from '@/lib/constants'
import type { RewardComponents } from '@/lib/types'
import type { PillarKey } from '@/lib/constants'

interface PillarBreakdownProps {
  components: RewardComponents
  compact?: boolean
  defaultExpanded?: PillarKey | null
}

export default function PillarBreakdown({ components, compact = false, defaultExpanded = null }: PillarBreakdownProps) {
  const [expanded, setExpanded] = useState<PillarKey | null>(defaultExpanded)

  const toggle = (key: PillarKey) => {
    setExpanded(prev => prev === key ? null : key)
  }

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {REWARD_PILLARS.map(pillar => {
        const pillarScore = components[pillar.key]
        const isExpanded = expanded === pillar.key
        const pct = (pillarScore * 100).toFixed(0)

        return (
          <div key={pillar.key}>
            {/* Pillar row */}
            <button
              onClick={() => toggle(pillar.key)}
              className="w-full flex items-center gap-2 group cursor-pointer"
            >
              {/* Chevron */}
              <svg
                className={`w-2.5 h-2.5 text-ink-muted shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>

              {/* Pillar label */}
              <span className={`font-serif ${compact ? 'text-[9px]' : 'text-[10px]'} font-semibold uppercase tracking-[0.5px] ${pillar.color} w-10 shrink-0 text-left`}>
                {pillar.label}
              </span>

              {/* Bar */}
              <div className="flex-1 h-2.5 bg-rule-light rounded-sm overflow-hidden">
                <div
                  className={`h-full ${pillar.barColor} rounded-sm transition-all`}
                  style={{ width: `${pillarScore * 100}%` }}
                />
              </div>

              {/* Score */}
              <span className={`font-mono ${compact ? 'text-[9px]' : 'text-[10px]'} font-semibold text-ink w-6 text-right`}>
                {pct}
              </span>

              {/* Weight */}
              <span className={`font-mono ${compact ? 'text-[7px]' : 'text-[8px]'} text-ink-faint w-5 text-right`}>
                {pillar.weight}
              </span>
            </button>

            {/* Expanded sub-components */}
            {isExpanded && (
              <div className={`${compact ? 'ml-5 mt-1 space-y-1' : 'ml-5 mt-1.5 space-y-1'}`}>
                {pillar.components.map(compKey => {
                  const meta = REWARD_COMPONENT_META[compKey]
                  if (!meta) return null
                  const val = components[compKey as keyof RewardComponents] as number
                  const display = (val * 100).toFixed(0)
                  return (
                    <div key={compKey} className="flex items-center gap-2">
                      <span className={`font-mono ${compact ? 'text-[8px]' : 'text-[9px]'} text-ink-muted w-7 shrink-0 text-right`}>
                        {meta.symbol}
                      </span>
                      <div className="flex-1 h-1.5 bg-rule-light rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${meta.barColor} rounded-sm transition-all`}
                          style={{ width: `${val * 100}%` }}
                        />
                      </div>
                      <span className={`font-mono ${compact ? 'text-[7px]' : 'text-[8px]'} text-ink-light w-6 text-right`}>
                        {display}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Fragmentation penalty (outside pillars) */}
      {components.fragmentation > 0.02 && (
        <div className="flex items-center gap-2 pt-1 border-t border-rule-light">
          <span className="w-2.5 shrink-0" />
          <span className={`font-mono ${compact ? 'text-[9px]' : 'text-[10px]'} text-red-ink w-10 shrink-0 text-left`}>
            -F
          </span>
          <div className="flex-1 h-2 bg-rule-light rounded-sm overflow-hidden">
            <div
              className="h-full bg-red-ink rounded-sm transition-all"
              style={{ width: `${components.fragmentation * 100}%` }}
            />
          </div>
          <span className={`font-mono ${compact ? 'text-[9px]' : 'text-[10px]'} text-red-ink w-6 text-right`}>
            {(components.fragmentation * 100).toFixed(0)}
          </span>
          <span className="w-5" />
        </div>
      )}
    </div>
  )
}
