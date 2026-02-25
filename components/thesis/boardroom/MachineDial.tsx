'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { useBeliefs } from '@/hooks/useBeliefs'
import { useDecisions } from '@/hooks/useDecisions'

export default function MachineDial() {
  const { user } = useAuth()
  const { log } = useDailyLogContext()
  const { untested, stale, active: activeBeliefs } = useBeliefs(user?.uid)
  const { pendingReview, reviewed, decisions } = useDecisions(user?.uid)

  const score = log.rewardScore?.score
  const activeDecisions = decisions.filter(d => d.status === 'active')

  // Calibration gap: average |confidence - outcomeScore| for reviewed decisions
  const calibrationGap = reviewed.length > 0
    ? Math.round(
        reviewed.reduce((sum, d) => sum + Math.abs(d.confidenceLevel - (d.outcomeScore || 0)), 0) / reviewed.length
      )
    : null

  return (
    <div className="space-y-3">
      {/* Flow Health */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Flow Health
        </div>

        <div className="space-y-2">
          {/* Score */}
          {score != null && (
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-[11px] text-ink-muted">Score</span>
              <span className="font-mono text-[16px] font-bold text-ink">
                g = {score.toFixed(1)}
              </span>
            </div>
          )}

          {/* Beliefs */}
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-[11px] text-ink-muted">Active Beliefs</span>
            <span className="font-mono text-[11px] font-semibold text-ink">{activeBeliefs.length}</span>
          </div>

          {untested.length > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-[11px] text-amber-ink">Untested</span>
              <span className="font-mono text-[11px] font-semibold text-amber-ink">{untested.length}</span>
            </div>
          )}

          {stale.length > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-[11px] text-amber-ink">Stale ({'>'}21d)</span>
              <span className="font-mono text-[11px] font-semibold text-amber-ink">{stale.length}</span>
            </div>
          )}

          {/* Decisions */}
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-[11px] text-ink-muted">Active Decisions</span>
            <span className="font-mono text-[11px] font-semibold text-ink">{activeDecisions.length}</span>
          </div>

          {pendingReview.length > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-[11px] text-amber-ink">Pending Review</span>
              <span className="font-mono text-[11px] font-semibold text-amber-ink">{pendingReview.length}</span>
            </div>
          )}

          {/* Calibration */}
          {calibrationGap != null && (
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-[11px] text-ink-muted">Calibration</span>
              <span className={`font-mono text-[11px] font-semibold ${
                calibrationGap <= 10 ? 'text-green-ink'
                  : calibrationGap <= 20 ? 'text-amber-ink'
                  : 'text-red-ink'
              }`}>
                &plusmn;{calibrationGap}
              </span>
            </div>
          )}

          {/* Loop status */}
          <div className="pt-1 border-t border-rule-light">
            {untested.length === 0 && stale.length === 0 && pendingReview.length === 0 ? (
              <span className="font-serif text-[9px] text-green-ink italic">All loops closed. Machine running clean.</span>
            ) : (
              <span className="font-serif text-[9px] text-amber-ink italic">
                {untested.length + stale.length + pendingReview.length} open loop{untested.length + stale.length + pendingReview.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
