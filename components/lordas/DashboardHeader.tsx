'use client'

import type { RelationshipConversation, RelationshipSnapshot } from '@/lib/types'
import { CompassIcon } from './pillar-icons'

interface DashboardHeaderProps {
  latest: RelationshipConversation | null
  snapshot: RelationshipSnapshot | null
  conversationCount: number
  currentTab?: 'dashboard' | 'theory' | 'adventures'
  onTabChange?: (tab: 'dashboard' | 'theory' | 'adventures') => void
}

export function DashboardHeader({ latest, snapshot, conversationCount, currentTab = 'dashboard', onTabChange }: DashboardHeaderProps) {
  const scores = snapshot?.rollingAverage || latest?.scores || null
  const composite = scores?.composite ?? 0

  return (
    <div className="border-b-2 pb-4" style={{ borderColor: '#d8cfc4' }}>
      {/* Title row with buttons */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CompassIcon size={28} color="#b85c38" />
          <div>
            <h1 className="font-serif text-[20px] font-semibold tracking-[0.5px]" style={{ color: '#b85c38' }}>
              lordas
            </h1>
            <p className="text-[10px] uppercase tracking-[0.5px]" style={{ color: '#8a7e72' }}>
              Lori & Aidas · Connection Insights
            </p>
          </div>
        </div>

        {/* Buttons */}
        {onTabChange && (
          <div className="flex gap-1.5">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-sm border text-[9px] font-serif font-semibold uppercase transition-colors flex-shrink-0"
              style={{
                backgroundColor: currentTab === 'dashboard' ? '#b85c38' : 'transparent',
                color: currentTab === 'dashboard' ? '#faf7f2' : '#8a7e72',
                borderColor: currentTab === 'dashboard' ? '#b85c38' : '#d8cfc4',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="5" cy="10" r="1.5" />
                <circle cx="11" cy="10" r="1.5" />
                <path d="M8 4.5 L5 8.5 M8 4.5 L11 8.5 M5 10 L11 10" />
              </svg>
              Insights
            </button>

            <button
              onClick={() => onTabChange('adventures')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-sm border text-[9px] font-serif font-semibold uppercase transition-colors flex-shrink-0"
              style={{
                backgroundColor: currentTab === 'adventures' ? '#b85c38' : 'transparent',
                color: currentTab === 'adventures' ? '#faf7f2' : '#8a7e72',
                borderColor: currentTab === 'adventures' ? '#b85c38' : '#d8cfc4',
              }}
            >
              <svg width="9" height="10" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 1 L12 6 L7 13 L2 6 Z" />
                <path d="M7 1 L7 13 M2 6 L12 6" />
              </svg>
              <svg width="9" height="8" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="2" cy="10" r="1.8" />
                <circle cx="12" cy="10" r="1.8" />
                <path d="M2 10 L5 4 L9 4 L12 10 M5 4 L8 4 M5 4 L6 10" />
              </svg>
              Scheming
            </button>
          </div>
        )}

        {latest && (
          <div className="text-right">
            <p className="text-[10px]" style={{ color: '#8a7e72' }}>
              Last session
            </p>
            <p className="text-[12px] font-mono font-medium" style={{ color: '#2a2420' }}>
              {formatDate(latest.date)}
            </p>
            <p className="text-[10px]" style={{ color: '#8a7e72' }}>
              {conversationCount} session{conversationCount !== 1 ? 's' : ''} total
            </p>
          </div>
        )}
      </div>

      {/* Composite score */}
      {scores ? (
        <div className="flex items-end gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.5px] mb-0.5" style={{ color: '#8a7e72' }}>
              Connection Health
            </p>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[32px] font-semibold leading-none" style={{ color: '#2a2420' }}>
                {composite.toFixed(1)}
              </span>
              <span className="font-mono text-[14px]" style={{ color: '#8a7e72' }}>/10</span>
            </div>
          </div>

          <div className="flex gap-4 pb-1">
            <PillarBadge label="Safety" value={scores.safety} color="#2d5f4a" />
            <PillarBadge label="Growth" value={scores.growth} color="#b85c38" />
            <PillarBadge label="Alignment" value={scores.alignment} color="#c4873a" />
          </div>

          {/* Trend sparkline placeholder */}
          {snapshot && snapshot.conversationCount > 1 && (
            <div className="ml-auto pb-1">
              <p className="text-[9px] uppercase tracking-[0.5px]" style={{ color: '#8a7e72' }}>
                {snapshot.conversationCount}-session avg
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-4">
          <p className="text-[13px] font-serif" style={{ color: '#8a7e72' }}>
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
      <p className="text-[9px] uppercase tracking-[0.5px]" style={{ color: '#8a7e72' }}>
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
