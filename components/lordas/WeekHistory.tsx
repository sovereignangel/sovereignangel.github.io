'use client'

import { useState } from 'react'
import type { LordasGoalOwner, LordasMilestone, LordasPerson, LordasWeek } from '@/lib/types'
import { GOAL_OWNERS, hitRate, weekStreak, ownerLabel, personLabel } from '@/lib/lordas-goals'
import { dateShort } from '@/lib/date-utils'
import { SectionHeading } from './NorthStarCard'
import { CommitmentRow } from './CommitmentRow'
import { OWNER_COLORS, PAPER, INK, MUTED, RULE, SAGE } from './goals-theme'

interface WeekHistoryProps {
  weekHistory: LordasWeek[] // desc by weekStart
  milestones: LordasMilestone[]
  person: LordasPerson
}

export function WeekHistory({ weekHistory, milestones, person }: WeekHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (weekHistory.length === 0) {
    return (
      <section>
        <SectionHeading title="Track Record" subtitle="Past weeks, hit rates, and streaks" />
        <div className="rounded-sm border p-4" style={{ backgroundColor: PAPER, borderColor: RULE }}>
          <p className="text-[11px] italic" style={{ color: MUTED }}>
            No completed weeks yet. The record starts when your first week closes.
          </p>
        </div>
      </section>
    )
  }

  const ascending = [...weekHistory].reverse() // oldest → newest for the chart

  return (
    <section>
      <SectionHeading title="Track Record" subtitle="Past weeks, hit rates, and streaks" />

      <div className="rounded-sm border p-3 mb-3" style={{ backgroundColor: PAPER, borderColor: RULE }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {GOAL_OWNERS.map((o) => {
            const streak = weekStreak(weekHistory, o)
            return (
              <div key={o}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <p className="text-[10px] uppercase tracking-[0.5px] font-semibold" style={{ color: OWNER_COLORS[o] }}>
                    {ownerLabel(o)}
                  </p>
                  <p className="font-mono text-[10px]" style={{ color: streak > 0 ? SAGE : MUTED }}>
                    {streak > 0 ? `${streak} wk streak` : 'No streak'}
                  </p>
                </div>
                <HitRateBars weeks={ascending} owner={o} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        {weekHistory.map((week) => {
          const isOpen = expanded === week.weekStart
          return (
            <div key={week.weekStart} className="rounded-sm border bg-white" style={{ borderColor: RULE }}>
              <button
                onClick={() => setExpanded(isOpen ? null : week.weekStart)}
                className="w-full flex items-center justify-between p-2.5"
              >
                <span className="font-mono text-[11px]" style={{ color: INK }}>
                  Week of {dateShort(week.weekStart)}
                </span>
                <span className="flex items-center gap-3">
                  {GOAL_OWNERS.map((o) => {
                    const rate = hitRate(week, o)
                    if (rate === null && o === 'relationship') return null
                    return (
                      <span key={o} className="font-mono text-[10px]" style={{ color: rate === null ? MUTED : OWNER_COLORS[o] }}>
                        {ownerLabel(o).charAt(0)} {rate === null ? '—' : `${Math.round(rate * 100)}%`}
                      </span>
                    )
                  })}
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke={MUTED}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                  >
                    <path d="M2 4 L6 8 L10 4" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="px-2.5 pb-2.5 space-y-2 border-t pt-2" style={{ borderColor: RULE }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {GOAL_OWNERS.map((o) => {
                      const theirs = week.commitments.filter((c) => c.person === o)
                      if (theirs.length === 0 && o === 'relationship') return null
                      return (
                        <div key={o}>
                          <p className="text-[9px] uppercase tracking-[0.5px] font-semibold mb-1" style={{ color: OWNER_COLORS[o] }}>
                            {ownerLabel(o)}
                          </p>
                          <div className="space-y-1">
                            {theirs.length === 0 ? (
                              <p className="text-[10px] italic" style={{ color: MUTED }}>No commitments</p>
                            ) : (
                              theirs.map((c) => (
                                <CommitmentRow key={c.id} commitment={c} viewer={person} milestones={milestones} readOnly />
                              ))
                            )}
                          </div>
                          {o !== 'relationship' && week.reviews[o] && (
                            <div className="mt-1.5 text-[10px] rounded-sm border p-1.5" style={{ borderColor: RULE, color: INK, backgroundColor: PAPER }}>
                              {week.reviews[o]!.win && <p><span style={{ color: SAGE }}>Win · </span>{week.reviews[o]!.win}</p>}
                              {week.reviews[o]!.lesson && <p><span style={{ color: MUTED }}>Lesson · </span>{week.reviews[o]!.lesson}</p>}
                            </div>
                          )}
                          {o !== 'relationship' && week.partnerNotes[o === 'lori' ? 'aidas' : 'lori'] && (
                            <p className="mt-1 text-[10px] font-serif italic" style={{ color: MUTED }}>
                              &ldquo;{week.partnerNotes[o === 'lori' ? 'aidas' : 'lori']!.text}&rdquo; — {personLabel(o === 'lori' ? 'aidas' : 'lori')}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Inline SVG bar chart: one bar per past week (oldest left), height = hit rate.
 */
function HitRateBars({ weeks, owner }: { weeks: LordasWeek[]; owner: LordasGoalOwner }) {
  const H = 44
  const BAR_W = 14
  const GAP = 5
  const LABEL_H = 14
  const shown = weeks.slice(-12)
  const width = shown.length * (BAR_W + GAP) - GAP
  const color = OWNER_COLORS[owner]

  return (
    <svg width={Math.max(width, BAR_W)} height={H + LABEL_H} role="img" aria-label={`${ownerLabel(owner)} weekly hit rate`}>
      {shown.map((week, i) => {
        const rate = hitRate(week, owner)
        const x = i * (BAR_W + GAP)
        const barH = rate === null ? 2 : Math.max(2, Math.round(rate * H))
        return (
          <g key={week.weekStart}>
            <rect x={x} y={H - barH} width={BAR_W} height={barH} rx={1} fill={rate === null ? RULE : color} opacity={rate === null ? 0.6 : 0.85} />
            {rate !== null && rate >= 0.995 && (
              <rect x={x} y={0} width={BAR_W} height={2} rx={1} fill={SAGE} />
            )}
            <text x={x + BAR_W / 2} y={H + 11} textAnchor="middle" fontSize={11} fontFamily="monospace" fill={MUTED}>
              {rate === null ? '·' : Math.round(rate * 100)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
