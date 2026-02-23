'use client'

import { useMemo } from 'react'
import { useRLTransitions } from '@/hooks/useRLTransitions'
import { useRLValueFunction } from '@/hooks/useRLValueFunction'
import { useRLAudit } from '@/hooks/useRLAudit'
import { computeComponentStats } from '@/lib/rl-engine'
import TDErrorChart from './TDErrorChart'
import { STATE_CLUSTER_DISPLAY } from '@/lib/types/rl'
import type { ActionType } from '@/lib/types'

export default function AuditView() {
  const { transitions, loading: transLoading, actionStats } = useRLTransitions(30)
  const { enrichedTransitions, valueEstimates } = useRLValueFunction(transitions)
  const { currentAudit, recentAudits, loading: auditLoading, weekStart } = useRLAudit()

  // This week's transitions (last 7 days)
  const weekTransitions = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return enrichedTransitions.filter(t => t.date >= cutoffStr)
  }, [enrichedTransitions])

  // Component stats for reward health
  const componentStats = useMemo(() => computeComponentStats(weekTransitions), [weekTransitions])

  // Episode metrics
  const avgReward = weekTransitions.length > 0
    ? weekTransitions.reduce((s, t) => s + t.reward, 0) / weekTransitions.length
    : 0

  const priorWeekTransitions = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - 14)
    const end = new Date()
    end.setDate(end.getDate() - 7)
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    return enrichedTransitions.filter(t => t.date >= startStr && t.date < endStr)
  }, [enrichedTransitions])

  const priorAvg = priorWeekTransitions.length > 0
    ? priorWeekTransitions.reduce((s, t) => s + t.reward, 0) / priorWeekTransitions.length
    : null

  const trajectory: 'improving' | 'declining' | 'flat' = priorAvg === null ? 'flat'
    : avgReward > priorAvg + 0.3 ? 'improving'
    : avgReward < priorAvg - 0.3 ? 'declining'
    : 'flat'

  // Action distribution this week
  const weekActions: Partial<Record<ActionType, number>> = {}
  for (const t of weekTransitions) {
    for (const a of t.actions) {
      weekActions[a] = (weekActions[a] || 0) + 1
    }
  }

  // Dominant cluster
  const clusterCounts: Record<string, number> = {}
  for (const t of weekTransitions) {
    clusterCounts[t.cluster] = (clusterCounts[t.cluster] || 0) + 1
  }
  const dominantCluster = Object.entries(clusterCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'balanced_steady'

  // Reward health
  const atFloor = componentStats.filter(c => c.atFloor).map(c => c.component)
  const atCeiling = componentStats.filter(c => c.atCeiling).map(c => c.component)
  const volatile = componentStats.filter(c => c.volatile).map(c => c.component)

  const loading = transLoading || auditLoading

  if (loading) {
    return <div className="flex items-center justify-center h-32 text-[10px] text-ink-muted font-sans">Loading audit data...</div>
  }

  return (
    <div className="space-y-2">
      {/* Episode Summary */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Episode Summary {'\u2014'} Week of {weekStart}
        </h4>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="text-center">
            <div className={`font-mono text-[16px] font-bold ${avgReward >= 5 ? 'text-green-ink' : avgReward >= 3 ? 'text-amber-ink' : 'text-red-ink'}`}>
              {avgReward.toFixed(1)}
            </div>
            <div className="font-sans text-[9px] text-ink-muted">Avg Reward</div>
          </div>
          <div className="text-center">
            <div className={`font-mono text-[14px] font-bold ${
              trajectory === 'improving' ? 'text-green-ink' : trajectory === 'declining' ? 'text-red-ink' : 'text-amber-ink'
            }`}>
              {trajectory === 'improving' ? '\u2191' : trajectory === 'declining' ? '\u2193' : '\u2192'} {trajectory}
            </div>
            <div className="font-sans text-[9px] text-ink-muted">vs Last Week</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[14px] font-bold text-ink">{weekTransitions.length}</div>
            <div className="font-sans text-[9px] text-ink-muted">Transitions</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[10px] font-semibold text-ink">
              {STATE_CLUSTER_DISPLAY[dominantCluster as keyof typeof STATE_CLUSTER_DISPLAY]?.name || dominantCluster}
            </div>
            <div className="font-sans text-[9px] text-ink-muted">Dominant State</div>
          </div>
        </div>

        {/* Action distribution */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-mono text-[9px] text-ink-muted">Actions:</span>
          {(Object.entries(weekActions) as [ActionType, number][])
            .sort(([,a], [,b]) => b - a)
            .map(([action, count]) => (
            <span key={action} className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm bg-cream border border-rule">
              {action}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* TD Error Chart */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          TD Errors {'\u2014'} Surprise Signal
        </h4>
        <p className="font-sans text-[9px] text-ink-muted mb-2">
          {'\u03B4'} {'>'} 0 = surprisingly good day (green). {'\u03B4'} {'<'} 0 = surprisingly bad day (red). Large bars = maximum learning signal.
        </p>
        <TDErrorChart transitions={weekTransitions} />
      </div>

      {/* Reward Health */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Reward Function Health
        </h4>
        <div className="space-y-1.5">
          {atFloor.length > 0 && (
            <div className="flex items-start gap-1">
              <span className="font-mono text-[9px] text-red-ink font-semibold shrink-0">AT FLOOR:</span>
              <span className="font-sans text-[10px] text-ink">
                {atFloor.join(', ')} {'\u2014'} consistently below 0.15. Not discriminating. Are these components relevant to your current goals?
              </span>
            </div>
          )}
          {atCeiling.length > 0 && (
            <div className="flex items-start gap-1">
              <span className="font-mono text-[9px] text-amber-ink font-semibold shrink-0">AT CEILING:</span>
              <span className="font-sans text-[10px] text-ink">
                {atCeiling.join(', ')} {'\u2014'} consistently above 0.85. Gaming risk (Goodhart&apos;s Law). Are you genuinely performing or just hitting easy targets?
              </span>
            </div>
          )}
          {volatile.length > 0 && (
            <div className="flex items-start gap-1">
              <span className="font-mono text-[9px] text-amber-ink font-semibold shrink-0">VOLATILE:</span>
              <span className="font-sans text-[10px] text-ink">
                {volatile.join(', ')} {'\u2014'} high std dev ({'>'}0.25). These swing day-to-day. Either measurement noise or genuinely variable behavior.
              </span>
            </div>
          )}
          {atFloor.length === 0 && atCeiling.length === 0 && volatile.length === 0 && (
            <p className="font-sans text-[10px] text-green-ink">All components in healthy range. No floor/ceiling/volatility issues detected.</p>
          )}
        </div>

        {/* Component stats table */}
        <div className="mt-2 pt-1.5 border-t border-rule-light">
          <div className="grid grid-cols-5 gap-1 text-[8px] font-mono text-ink-muted uppercase mb-0.5">
            <span>Component</span>
            <span className="text-right">Mean</span>
            <span className="text-right">Min</span>
            <span className="text-right">Max</span>
            <span className="text-right">Std</span>
          </div>
          {componentStats.map(cs => (
            <div key={cs.component} className={`grid grid-cols-5 gap-1 text-[9px] font-mono py-0.5 ${
              cs.atFloor ? 'text-red-ink' : cs.atCeiling ? 'text-amber-ink' : 'text-ink'
            }`}>
              <span className="uppercase">{cs.component}</span>
              <span className="text-right font-semibold">{cs.mean.toFixed(2)}</span>
              <span className="text-right">{cs.min.toFixed(2)}</span>
              <span className="text-right">{cs.max.toFixed(2)}</span>
              <span className="text-right">{cs.std.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Audit (if cached) */}
      {currentAudit && (
        <>
          {currentAudit.policySuggestions.length > 0 && (
            <div className="bg-white border border-rule rounded-sm p-3">
              <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
                Policy Suggestions
              </h4>
              <ul className="space-y-1">
                {currentAudit.policySuggestions.map((s, i) => (
                  <li key={i} className="font-sans text-[10px] text-ink flex gap-1">
                    <span className="text-burgundy shrink-0">{'\u2022'}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentAudit.weekNarrative && (
            <div className="bg-white border border-rule rounded-sm p-3">
              <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
                Week Narrative
              </h4>
              <p className="font-sans text-[10px] text-ink leading-relaxed whitespace-pre-wrap">
                {currentAudit.weekNarrative}
              </p>
            </div>
          )}
        </>
      )}

      {/* 4-week comparison */}
      {recentAudits.length > 1 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Recent Episodes
          </h4>
          <div className="space-y-1">
            {recentAudits.map(audit => (
              <div key={audit.weekStart} className="flex items-center gap-2 py-0.5">
                <span className="font-mono text-[9px] text-ink-muted w-[70px]">{audit.weekStart}</span>
                <div className="flex-1 h-1.5 bg-cream rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${
                      audit.episode.avgReward >= 5 ? 'bg-green-ink' : audit.episode.avgReward >= 3 ? 'bg-amber-ink' : 'bg-red-ink'
                    }`}
                    style={{ width: `${Math.round(audit.episode.avgReward / 10 * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] font-semibold text-ink w-8 text-right">
                  {audit.episode.avgReward.toFixed(1)}
                </span>
                <span className={`font-mono text-[8px] ${
                  audit.episode.rewardTrajectory === 'improving' ? 'text-green-ink'
                  : audit.episode.rewardTrajectory === 'declining' ? 'text-red-ink'
                  : 'text-ink-muted'
                }`}>
                  {audit.episode.rewardTrajectory === 'improving' ? '\u2191' : audit.episode.rewardTrajectory === 'declining' ? '\u2193' : '\u2192'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
