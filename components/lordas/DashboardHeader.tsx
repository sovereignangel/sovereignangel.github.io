'use client'

import type { RelationshipConversation, RelationshipSnapshot } from '@/lib/types'
import { CompassIcon } from './pillar-icons'
import { LordasTabs, type LordasTab } from './LordasTabs'

interface DashboardHeaderProps {
  latest: RelationshipConversation | null
  snapshot: RelationshipSnapshot | null
  conversationCount: number
  currentTab?: LordasTab
  onTabChange?: (tab: LordasTab) => void
}

export function DashboardHeader({ latest, snapshot, conversationCount, currentTab = 'dashboard', onTabChange }: DashboardHeaderProps) {
  const scores = snapshot?.rollingAverage || latest?.scores || null
  const composite = scores?.composite ?? 0

  return (
    <div className="border-b-2 pb-4" style={{ borderColor: '#3E2C20' }}>
      {/* Title row with buttons */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CompassIcon size={28} color="#6FA3CE" />
          <div>
            <h1 className="lordas-display text-[20px] font-semibold tracking-[0.5px]" style={{ color: '#6FA3CE' }}>
              lordas
            </h1>
            <p className="text-[10px] uppercase tracking-[0.5px]" style={{ color: '#B39D85' }}>
              Lori & Aidas · Connection Insights
            </p>
          </div>
        </div>

        {/* Buttons */}
        {onTabChange && <LordasTabs current={currentTab} onChange={onTabChange} />}

        {latest && (
          <div className="text-right">
            <p className="text-[10px]" style={{ color: '#B39D85' }}>
              Last session
            </p>
            <p className="text-[12px] font-mono font-medium" style={{ color: '#F2E8DA' }}>
              {formatDate(latest.date)}
            </p>
            <p className="text-[10px]" style={{ color: '#B39D85' }}>
              {conversationCount} session{conversationCount !== 1 ? 's' : ''} total
            </p>
          </div>
        )}
      </div>

      {/* Composite score */}
      {scores ? (
        <div className="flex items-end gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.5px] mb-0.5" style={{ color: '#B39D85' }}>
              Connection Health
            </p>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[32px] font-semibold leading-none" style={{ color: '#F2E8DA' }}>
                {composite.toFixed(1)}
              </span>
              <span className="font-mono text-[14px]" style={{ color: '#B39D85' }}>/10</span>
            </div>
          </div>

          <div className="flex gap-4 pb-1">
            <PillarBadge label="Safety" value={scores.safety} color="#6FB89A" />
            <PillarBadge label="Growth" value={scores.growth} color="#6FA3CE" />
            <PillarBadge label="Alignment" value={scores.alignment} color="#D9A63F" />
          </div>

          {/* Trend sparkline placeholder */}
          {snapshot && snapshot.conversationCount > 1 && (
            <div className="ml-auto pb-1">
              <p className="text-[9px] uppercase tracking-[0.5px]" style={{ color: '#B39D85' }}>
                {snapshot.conversationCount}-session avg
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-4">
          <p className="text-[13px] lordas-display" style={{ color: '#B39D85' }}>
            No sessions yet. Start a conversation with &ldquo;relational transcript&rdquo; to begin tracking.
          </p>
        </div>
      )}
    </div>
  )
}

function PillarBadge({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100)
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.5px]" style={{ color: '#B39D85' }}>
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[14px] font-semibold" style={{ color }}>
          {pct}%
        </span>
      </div>
      {/* Mini bar */}
      <div className="w-[60px] h-[3px] rounded-sm mt-0.5" style={{ backgroundColor: `${color}20` }}>
        <div
          className="h-full rounded-sm transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}
