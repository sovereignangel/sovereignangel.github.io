'use client'

import { useRLTransitions } from '@/hooks/useRLTransitions'
import { useRLValueFunction } from '@/hooks/useRLValueFunction'
import TransitionRow from './TransitionRow'
import type { ActionType } from '@/lib/types'

const ACTIONS: (ActionType | 'all')[] = ['all', 'ship', 'ask', 'signal', 'regulate', 'explore', 'compound']

export default function TransitionsView() {
  const {
    transitions,
    filteredTransitions,
    loading,
    actionStats,
    explorationRatio,
    filterAction,
    setFilterAction,
  } = useRLTransitions(90)

  const { enrichedTransitions } = useRLValueFunction(transitions)

  // Apply filter to enriched transitions
  const displayTransitions = filterAction === 'all'
    ? enrichedTransitions
    : enrichedTransitions.filter(t => t.actions.includes(filterAction))

  if (loading) {
    return <div className="flex items-center justify-center h-32 text-[10px] text-ink-muted font-sans">Loading transitions...</div>
  }

  return (
    <div className="space-y-2">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white border border-rule rounded-sm p-2 text-center">
          <div className="font-mono text-[14px] font-bold text-ink">{transitions.length}</div>
          <div className="font-sans text-[9px] text-ink-muted">Total Transitions</div>
        </div>
        <div className="bg-white border border-rule rounded-sm p-2 text-center">
          <div className="font-mono text-[14px] font-bold text-ink">
            {transitions.length > 0 ? (transitions.reduce((s, t) => s + t.reward, 0) / transitions.length).toFixed(1) : '0'}
          </div>
          <div className="font-sans text-[9px] text-ink-muted">Avg Reward</div>
        </div>
        <div className="bg-white border border-rule rounded-sm p-2 text-center">
          <div className="font-mono text-[14px] font-bold text-ink">{Math.round(explorationRatio * 100)}%</div>
          <div className="font-sans text-[9px] text-ink-muted">Explore Ratio</div>
        </div>
        <div className="bg-white border border-rule rounded-sm p-2 text-center">
          <div className="font-mono text-[14px] font-bold text-ink">
            {Object.entries(actionStats).sort(([,a], [,b]) => b.count - a.count)[0]?.[0] || '\u2014'}
          </div>
          <div className="font-sans text-[9px] text-ink-muted">Most Used Action</div>
        </div>
      </div>

      {/* Action stats breakdown */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Action Statistics
        </h4>
        <div className="grid grid-cols-6 gap-1">
          {(Object.entries(actionStats) as [ActionType, { count: number; avgReward: number }][]).map(([action, stats]) => (
            <div key={action} className="text-center p-1 bg-cream rounded-sm">
              <div className="font-mono text-[8px] uppercase text-burgundy font-semibold">{action}</div>
              <div className="font-mono text-[11px] font-bold text-ink">{stats.count}</div>
              <div className="font-mono text-[8px] text-ink-muted">avg {stats.avgReward.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1">
        <span className="font-sans text-[10px] text-ink-muted mr-1">Filter:</span>
        {ACTIONS.map(a => (
          <button
            key={a}
            onClick={() => setFilterAction(a)}
            className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border transition-colors ${
              filterAction === a
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-white text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {a}
          </button>
        ))}
        <span className="font-mono text-[9px] text-ink-muted ml-auto">
          {displayTransitions.length} transitions
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2 px-2 py-1 border-b-2 border-rule text-[8px] font-mono text-ink-muted uppercase">
        <span className="w-[70px]">Date</span>
        <span className="w-[24px]">State</span>
        <span className="w-[80px] ml-[2px]">Cluster</span>
        <span className="w-[80px]">Actions</span>
        <span className="w-[36px] text-right">r</span>
        <span className="w-[44px] text-right">{'\u03B4'} (TD)</span>
      </div>

      {/* Transition rows (most recent first) */}
      <div className="max-h-[400px] overflow-y-auto">
        {[...displayTransitions].reverse().map(t => (
          <TransitionRow key={t.date} transition={t} />
        ))}
      </div>

      {transitions.length === 0 && (
        <div className="text-center py-6 text-[11px] text-ink-muted font-sans">
          No transitions yet. Start logging daily with actionType selected to build your transition history.
        </div>
      )}
    </div>
  )
}
