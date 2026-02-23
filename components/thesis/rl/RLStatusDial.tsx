'use client'

import { useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { useRLCurriculum } from '@/hooks/useRLCurriculum'
import { useRLPolicyRules } from '@/hooks/useRLPolicyRules'
import { useRLTransitions } from '@/hooks/useRLTransitions'
import { useRLValueFunction } from '@/hooks/useRLValueFunction'
import { logToState, classifyState, suggestActionForState, evaluatePolicyRules } from '@/lib/rl-engine'
import { STATE_CLUSTER_DISPLAY } from '@/lib/types/rl'

export default function RLStatusDial() {
  const { user } = useAuth()
  const { log } = useDailyLogContext()
  const { completedCount } = useRLCurriculum(user?.uid)
  const { rules } = useRLPolicyRules(user?.uid)
  const { transitions, explorationRatio } = useRLTransitions(90)
  const { valueEstimates, enrichedTransitions } = useRLValueFunction(transitions)

  // Current state
  const currentState = logToState(log)
  const currentCluster = currentState ? classifyState(currentState) : null
  const currentClusterInfo = currentCluster ? STATE_CLUSTER_DISPLAY[currentCluster] : null

  // Current V(s)
  const currentV = currentCluster
    ? valueEstimates.find(v => v.cluster === currentCluster)?.v ?? null
    : null

  // Evaluate rules and suggest action
  const evaluatedRules = useMemo(() => evaluatePolicyRules(rules, transitions), [rules, transitions])
  const suggestion = currentState ? suggestActionForState(currentState, evaluatedRules) : null

  // This week avg
  const weekCutoff = new Date()
  weekCutoff.setDate(weekCutoff.getDate() - 7)
  const weekStr = weekCutoff.toISOString().split('T')[0]
  const weekTransitions = enrichedTransitions.filter(t => t.date >= weekStr)
  const weekAvg = weekTransitions.length > 0
    ? weekTransitions.reduce((s, t) => s + t.reward, 0) / weekTransitions.length
    : null

  // Top rules by evidence
  const topRules = evaluatedRules
    .filter(r => r.isActive && r.matchCount > 0)
    .sort((a, b) => (b.avgRewardWhenFollowed ?? 0) - (a.avgRewardWhenFollowed ?? 0))
    .slice(0, 5)

  return (
    <div className="border-l border-rule h-full">
      <div className="px-3 py-2 border-b border-rule">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          RL Status
        </h3>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto">
        {/* Curriculum Progress */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-sans text-[10px] text-ink-muted">Curriculum</span>
            <span className="font-mono text-[11px] font-semibold text-ink">{completedCount}/9</span>
          </div>
          <div className="h-1.5 bg-cream rounded-sm overflow-hidden">
            <div
              className="h-full bg-burgundy rounded-sm transition-all"
              style={{ width: `${Math.round(completedCount / 9 * 100)}%` }}
            />
          </div>
        </div>

        {/* Current State */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <span className="font-sans text-[10px] text-ink-muted block mb-1">Current State</span>
          {currentClusterInfo ? (
            <>
              <span className="font-serif text-[11px] font-semibold text-ink block">{currentClusterInfo.name}</span>
              <span className="font-sans text-[9px] text-ink-muted">{currentClusterInfo.description}</span>
              {currentV !== null && (
                <div className="mt-1 font-mono text-[10px]">
                  V(s) = <span className={`font-semibold ${currentV >= 5 ? 'text-green-ink' : currentV >= 3 ? 'text-amber-ink' : 'text-red-ink'}`}>
                    {currentV.toFixed(1)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="font-sans text-[9px] text-ink-faint">No reward computed yet today</span>
          )}
        </div>

        {/* Suggested Action */}
        {suggestion && (
          <div className="p-2 bg-burgundy-bg border border-burgundy/20 rounded-sm">
            <span className="font-sans text-[10px] text-ink-muted block mb-0.5">Suggested Action</span>
            <span className="font-mono text-[12px] font-bold text-burgundy uppercase">{suggestion.action}</span>
            <span className="font-sans text-[9px] text-ink-muted block">
              per rule: {suggestion.ruleName}
            </span>
          </div>
        )}

        {/* This Week */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <span className="font-sans text-[10px] text-ink-muted block mb-1">This Week</span>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[9px] text-ink-muted">Avg Reward</span>
            <span className={`font-mono text-[12px] font-bold ${
              weekAvg === null ? 'text-ink-muted' : weekAvg >= 5 ? 'text-green-ink' : weekAvg >= 3 ? 'text-amber-ink' : 'text-red-ink'
            }`}>
              {weekAvg !== null ? weekAvg.toFixed(1) : '\u2014'}
            </span>
          </div>
        </div>

        {/* Data Summary */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <span className="font-sans text-[10px] text-ink-muted block mb-1">Data</span>
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Transitions</span>
              <span className="font-mono text-[10px] font-semibold text-ink">{transitions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Policy Rules</span>
              <span className="font-mono text-[10px] font-semibold text-ink">{rules.filter(r => r.isActive).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Explore Ratio</span>
              <span className="font-mono text-[10px] font-semibold text-ink">{Math.round(explorationRatio * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Top Policy Rules */}
        {topRules.length > 0 && (
          <div className="p-2 bg-white border border-rule rounded-sm">
            <span className="font-sans text-[10px] text-ink-muted block mb-1">Top Policy Rules</span>
            <div className="space-y-1">
              {topRules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between">
                  <span className="font-sans text-[9px] text-ink truncate flex-1 mr-1">{rule.name}</span>
                  <span className={`font-mono text-[9px] font-semibold shrink-0 ${
                    (rule.avgRewardWhenFollowed ?? 0) >= 5 ? 'text-green-ink' : 'text-amber-ink'
                  }`}>
                    {rule.avgRewardWhenFollowed?.toFixed(1) ?? '\u2014'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
