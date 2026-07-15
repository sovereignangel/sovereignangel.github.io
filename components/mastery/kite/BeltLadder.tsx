'use client'

import { useState } from 'react'
import type { KiteStats } from '@/lib/types'
import { KITE_BELTS, isCriterionMet, computeBeltStatuses, type BeltCriterion } from '@/lib/kite/belts'

interface Props {
  stats: KiteStats
  milestones: Record<string, boolean>
  onToggleMilestone: (criterionId: string, checked: boolean) => void
}

function autoValue(c: BeltCriterion, stats: KiteStats): string {
  if (!c.metric) return ''
  const v = stats[c.metric]
  return `${v % 1 === 0 ? v : v.toFixed(1)}${c.unit} / ${c.threshold}${c.unit}`
}

export function BeltLadder({ stats, milestones, onToggleMilestone }: Props) {
  const { statuses, currentIndex, targetIndex } = computeBeltStatuses(stats, milestones)
  const [expanded, setExpanded] = useState<string | null>(KITE_BELTS[targetIndex]?.id ?? null)

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="flex items-baseline justify-between mb-2 pb-1.5 border-b-2 border-rule">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Belt Progression
        </div>
        <div className="text-[10px] text-ink-muted">
          Current: <span className="font-semibold text-ink">{currentIndex >= 0 ? KITE_BELTS[currentIndex].name : 'Unranked'}</span>
          {' '}· Next: <span className="font-semibold text-burgundy">{KITE_BELTS[targetIndex].name} — {KITE_BELTS[targetIndex].title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 items-start">
        {statuses.map(({ belt, earned, metCount, totalCount }, i) => {
          const isTarget = i === targetIndex && !earned
          const isOpen = expanded === belt.id
          return (
            <div
              key={belt.id}
              className={`border rounded-sm ${
                earned ? 'border-rule bg-green-bg' : isTarget ? 'border-burgundy/40 bg-burgundy-bg' : 'border-rule-light'
              }`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : belt.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-left"
              >
                <span
                  className="inline-block w-4 h-2.5 rounded-sm border border-ink/20 shrink-0"
                  style={{ backgroundColor: belt.color }}
                />
                <span className="font-serif text-[12px] font-semibold text-ink w-14 shrink-0">{belt.name}</span>
                <span className="text-[11px] text-ink-muted flex-1 truncate">{belt.title}</span>
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 bg-transparent text-ink-muted border-rule">
                  {belt.hoursGuide}
                </span>
                <span
                  className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${
                    earned
                      ? 'bg-green-bg text-green-ink border-green-ink/30'
                      : isTarget
                        ? 'bg-burgundy-bg text-burgundy border-burgundy/30'
                        : 'bg-transparent text-ink-faint border-rule-light'
                  }`}
                >
                  {earned ? 'Earned' : `${metCount}/${totalCount}`}
                </span>
              </button>

              {isOpen && (
                <div className="px-2 pb-2 pt-1 space-y-1 border-t border-rule-light">
                  <div className="text-[10px] text-ink-muted italic">{belt.summary}</div>
                  {belt.criteria.map(c => {
                    const met = isCriterionMet(c, stats, milestones)
                    return (
                      <div key={c.id} className="flex items-center gap-2">
                        {c.kind === 'manual' ? (
                          <input
                            type="checkbox"
                            checked={!!milestones[c.id]}
                            onChange={e => onToggleMilestone(c.id, e.target.checked)}
                            className="w-3 h-3 accent-[#7c2d2d] shrink-0"
                          />
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center w-3 h-3 rounded-sm border text-[8px] shrink-0 ${
                              met ? 'bg-green-ink text-paper border-green-ink' : 'bg-transparent text-ink-faint border-rule'
                            }`}
                          >
                            {met ? '✓' : ''}
                          </span>
                        )}
                        <span className={`text-[10px] ${met ? 'text-ink' : 'text-ink-muted'}`}>{c.label}</span>
                        {c.kind === 'auto' && (
                          <span className={`font-mono text-[10px] ml-auto shrink-0 ${met ? 'text-green-ink' : 'text-ink-muted'}`}>
                            {autoValue(c, stats)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
