'use client'

import type { RelationshipConversation } from '@/lib/types'
import { SpiralIcon } from './pillar-icons'

interface GrowthPillarProps {
  conversations: RelationshipConversation[]
}

export function GrowthPillar({ conversations }: GrowthPillarProps) {
  const recent = conversations.slice(0, 5)
  const latest = conversations[0] || null

  if (!latest) return null

  const { extraction } = latest

  // Curiosity ratios
  const loriQ = extraction.curiosityVsAssumption.lori
  const aidasQ = extraction.curiosityVsAssumption.aidas
  const loriCuriosityPct = (loriQ.genuineQuestions + loriQ.assumptions) > 0
    ? Math.round((loriQ.genuineQuestions / (loriQ.genuineQuestions + loriQ.assumptions)) * 100)
    : 50
  const aidasCuriosityPct = (aidasQ.genuineQuestions + aidasQ.assumptions) > 0
    ? Math.round((aidasQ.genuineQuestions / (aidasQ.genuineQuestions + aidasQ.assumptions)) * 100)
    : 50

  // Accountability ratios
  const loriA = extraction.accountabilityVsBlame.lori
  const aidasA = extraction.accountabilityVsBlame.aidas
  const loriAcctPct = (loriA.ownership + loriA.blame) > 0
    ? Math.round((loriA.ownership / (loriA.ownership + loriA.blame)) * 100)
    : 50
  const aidasAcctPct = (aidasA.ownership + aidasA.blame) > 0
    ? Math.round((aidasA.ownership / (aidasA.ownership + aidasA.blame)) * 100)
    : 50

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: '#d8cfc4' }}>
        <SpiralIcon size={18} color="#b85c38" />
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: '#b85c38' }}>
          Growth
        </h2>
        <span className="text-[10px] ml-auto" style={{ color: '#8a7e72' }}>
          Are we evolving together?
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Curiosity vs Assumption */}
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#2a2420' }}>
            Curiosity vs Assumption
          </h3>
          <p className="text-[10px] mb-3" style={{ color: '#8a7e72' }}>
            Genuine questions vs assuming intent
          </p>

          <div className="space-y-3">
            <RatioBar
              label="Lori"
              leftLabel="Curiosity"
              rightLabel="Assumption"
              leftValue={loriQ.genuineQuestions}
              rightValue={loriQ.assumptions}
              percentage={loriCuriosityPct}
              color="#b85c38"
            />
            <RatioBar
              label="Aidas"
              leftLabel="Curiosity"
              rightLabel="Assumption"
              leftValue={aidasQ.genuineQuestions}
              rightValue={aidasQ.assumptions}
              percentage={aidasCuriosityPct}
              color="#2d5f4a"
            />
          </div>

          {/* Trend */}
          {recent.length > 1 && (
            <div className="mt-3 pt-2 border-t" style={{ borderColor: '#e8e0d6' }}>
              <p className="text-[9px] uppercase tracking-[0.5px] mb-1" style={{ color: '#8a7e72' }}>
                Combined curiosity ratio
              </p>
              <div className="flex items-end gap-1 h-[24px]">
                {[...recent].reverse().map((conv, i) => {
                  const l = conv.extraction.curiosityVsAssumption.lori
                  const a = conv.extraction.curiosityVsAssumption.aidas
                  const totalQ = l.genuineQuestions + a.genuineQuestions
                  const totalA = l.assumptions + a.assumptions
                  const ratio = (totalQ + totalA) > 0 ? totalQ / (totalQ + totalA) : 0.5
                  const isLatest = i === recent.length - 1
                  return (
                    <div
                      key={conv.id || i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${Math.max(2, ratio * 24)}px`,
                        backgroundColor: isLatest ? '#b85c38' : 'rgba(184, 92, 56, 0.25)',
                      }}
                      title={`${conv.date}: ${Math.round(ratio * 100)}%`}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Accountability vs Blame */}
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#2a2420' }}>
            Accountability vs Blame
          </h3>
          <p className="text-[10px] mb-3" style={{ color: '#8a7e72' }}>
            Owning your part vs externalizing
          </p>

          <div className="space-y-3">
            <RatioBar
              label="Lori"
              leftLabel="Ownership"
              rightLabel="Blame"
              leftValue={loriA.ownership}
              rightValue={loriA.blame}
              percentage={loriAcctPct}
              color="#b85c38"
            />
            <RatioBar
              label="Aidas"
              leftLabel="Ownership"
              rightLabel="Blame"
              leftValue={aidasA.ownership}
              rightValue={aidasA.blame}
              percentage={aidasAcctPct}
              color="#2d5f4a"
            />
          </div>

          {/* Trend */}
          {recent.length > 1 && (
            <div className="mt-3 pt-2 border-t" style={{ borderColor: '#e8e0d6' }}>
              <p className="text-[9px] uppercase tracking-[0.5px] mb-1" style={{ color: '#8a7e72' }}>
                Combined accountability ratio
              </p>
              <div className="flex items-end gap-1 h-[24px]">
                {[...recent].reverse().map((conv, i) => {
                  const l = conv.extraction.accountabilityVsBlame.lori
                  const a = conv.extraction.accountabilityVsBlame.aidas
                  const totalO = l.ownership + a.ownership
                  const totalB = l.blame + a.blame
                  const ratio = (totalO + totalB) > 0 ? totalO / (totalO + totalB) : 0.5
                  const isLatest = i === recent.length - 1
                  return (
                    <div
                      key={conv.id || i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${Math.max(2, ratio * 24)}px`,
                        backgroundColor: isLatest ? '#2d5f4a' : 'rgba(45, 95, 74, 0.25)',
                      }}
                      title={`${conv.date}: ${Math.round(ratio * 100)}%`}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dynamics + Insights */}
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#2a2420' }}>
            Dynamics
          </h3>

          {/* Pursue-withdraw pattern */}
          <div className="mb-3">
            <p className="text-[10px] mb-1" style={{ color: '#8a7e72' }}>
              Pursue / Withdraw pattern
            </p>
            <div className="flex items-center gap-2">
              <PursueWithdrawIndicator
                pattern={extraction.pursueWithdraw.pattern}
                intensity={extraction.pursueWithdraw.intensity}
              />
            </div>
          </div>

          {/* New understandings */}
          {extraction.newUnderstandings.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-medium mb-1" style={{ color: '#2a2420' }}>
                New understandings
              </p>
              <div className="space-y-1">
                {extraction.newUnderstandings.map((u, i) => (
                  <p key={i} className="text-[10px]" style={{ color: '#8a7e72' }}>
                    • {u}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Pursue-withdraw trend */}
          {recent.length > 1 && (
            <div className="mt-3 pt-2 border-t" style={{ borderColor: '#e8e0d6' }}>
              <p className="text-[9px] uppercase tracking-[0.5px] mb-1" style={{ color: '#8a7e72' }}>
                Pattern history
              </p>
              <div className="space-y-0.5">
                {[...recent].reverse().map((conv, i) => {
                  const p = conv.extraction.pursueWithdraw
                  return (
                    <div key={conv.id || i} className="flex items-center gap-1">
                      <span className="text-[8px] font-mono w-[40px]" style={{ color: '#c0b8aa' }}>
                        {conv.date.slice(5)}
                      </span>
                      <PursueWithdrawDot pattern={p.pattern} />
                      <span className="text-[8px]" style={{ color: '#c0b8aa' }}>
                        {p.pattern.replace('-', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RatioBar({
  label, leftLabel, rightLabel, leftValue, rightValue, percentage, color,
}: {
  label: string
  leftLabel: string
  rightLabel: string
  leftValue: number
  rightValue: number
  percentage: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
        <span className="font-mono text-[11px] font-semibold" style={{ color }}>
          {percentage}%
        </span>
      </div>
      <div className="w-full h-[4px] rounded-sm" style={{ backgroundColor: `${color}15` }}>
        <div
          className="h-full rounded-sm transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-[8px] mt-0.5" style={{ color: '#c0b8aa' }}>
        <span>{leftLabel}: {leftValue}</span>
        <span>{rightLabel}: {rightValue}</span>
      </div>
    </div>
  )
}

function PursueWithdrawIndicator({ pattern, intensity }: { pattern: string; intensity: string }) {
  const labels: Record<string, string> = {
    'lori-pursues': 'Lori pursues → Aidas withdraws',
    'aidas-pursues': 'Aidas pursues → Lori withdraws',
    'balanced': 'Balanced engagement',
    'both-withdraw': 'Both withdrawing',
  }
  const colors: Record<string, string> = {
    'lori-pursues': '#b85c38',
    'aidas-pursues': '#2d5f4a',
    'balanced': '#c4873a',
    'both-withdraw': '#8c3d3d',
  }
  const intensityLabel = intensity === 'strong' ? '●●●' : intensity === 'moderate' ? '●●○' : '●○○'

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium" style={{ color: colors[pattern] || '#8a7e72' }}>
        {labels[pattern] || pattern}
      </span>
      <span className="text-[9px]" style={{ color: '#c0b8aa' }}>{intensityLabel}</span>
    </div>
  )
}

function PursueWithdrawDot({ pattern }: { pattern: string }) {
  const colors: Record<string, string> = {
    'lori-pursues': '#b85c38',
    'aidas-pursues': '#2d5f4a',
    'balanced': '#c4873a',
    'both-withdraw': '#8c3d3d',
  }
  return (
    <div
      className="w-[6px] h-[6px] rounded-sm"
      style={{ backgroundColor: colors[pattern] || '#c0b8aa' }}
    />
  )
}
