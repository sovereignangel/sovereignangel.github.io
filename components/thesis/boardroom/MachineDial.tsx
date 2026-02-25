'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { useBeliefs } from '@/hooks/useBeliefs'
import { useDecisions } from '@/hooks/useDecisions'
import { computeReward } from '@/lib/reward'
import { dayOfWeekShort } from '@/lib/formatters'
import PortfolioDecomposition from '@/components/thesis/reward/PortfolioDecomposition'
import dynamic from 'next/dynamic'

const RewardTrajectoryChart = dynamic(
  () => import('@/components/thesis/RewardTrajectoryChart'),
  { ssr: false, loading: () => <div className="h-[120px]" /> }
)

export default function MachineDial() {
  const { user } = useAuth()
  const { log, recentLogs, dates } = useDailyLogContext()
  const { untested, stale, active: activeBeliefs } = useBeliefs(user?.uid)
  const { pendingReview, reviewed, decisions } = useDecisions(user?.uid)

  const score = log.rewardScore?.score
  const components = log.rewardScore?.components
  const activeDecisions = decisions.filter(d => d.status === 'active')

  // 7-day trajectory chart data
  const logMap = new Map(recentLogs.map(l => [l.date, l]))
  const chartData = dates.map(date => {
    const dayLog = logMap.get(date)
    if (!dayLog) return { date: dayOfWeekShort(date).slice(0, 2), score: null }
    const s = dayLog.rewardScore?.score
      ?? computeReward(dayLog, undefined, { recentLogs }).score
    return { date: dayOfWeekShort(date).slice(0, 2), score: s }
  })
  const hasTrajectoryData = chartData.some(d => d.score !== null)

  // Calibration gap: average |confidence - outcomeScore| for reviewed decisions
  const calibrationGap = reviewed.length > 0
    ? Math.round(
        reviewed.reduce((sum, d) => sum + Math.abs(d.confidenceLevel - (d.outcomeScore || 0)), 0) / reviewed.length
      )
    : null

  const scoreColor = score == null ? 'text-ink-muted'
    : score >= 7 ? 'text-green-ink'
    : score >= 4 ? 'text-amber-ink'
    : 'text-red-ink'

  return (
    <div className="space-y-3">
      {/* Reward Score + Attribution */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Reward Score
        </div>

        {score != null && (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className={`font-mono text-[24px] font-bold leading-none ${scoreColor}`}>
                {score.toFixed(1)}
              </span>
              <span className="font-mono text-[11px] text-ink-muted mb-0.5">/ 10</span>
            </div>

            {components && <PortfolioDecomposition components={components} />}

            {/* 7-day trajectory */}
            <div>
              <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-1.5">
                7-Day Trajectory
              </p>
              {hasTrajectoryData ? (
                <div className="h-[120px]">
                  <RewardTrajectoryChart data={chartData} />
                </div>
              ) : (
                <div className="h-[60px] flex items-center justify-center">
                  <p className="font-serif text-[10px] italic text-ink-faint">
                    Log more days to see trajectory
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Flow Health */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Flow Health
        </div>

        <div className="space-y-2">
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
