'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { computeReward } from '@/lib/reward'
import { dayOfWeekShort } from '@/lib/formatters'
import PortfolioDecomposition from '@/components/thesis/reward/PortfolioDecomposition'
import dynamic from 'next/dynamic'

const RewardTrajectoryChart = dynamic(
  () => import('@/components/thesis/RewardTrajectoryChart'),
  { ssr: false, loading: () => <div className="h-[120px]" /> }
)

export default function MachineDial() {
  const { log, recentLogs, dates } = useDailyLogContext()
  const [rewardExpanded, setRewardExpanded] = useState(false)

  const score = log.rewardScore?.score
  const components = log.rewardScore?.components

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

  const scoreColor = score == null ? 'text-ink-muted'
    : score >= 7 ? 'text-green-ink'
    : score >= 4 ? 'text-amber-ink'
    : 'text-red-ink'

  return (
    <div className="space-y-3">
      {/* Reward Score — Collapsible */}
      <div className="bg-white border border-rule rounded-sm">
        <button
          onClick={() => setRewardExpanded(!rewardExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-cream/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-3 h-3 text-ink-muted transition-transform ${rewardExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Reward Score
            </span>
          </div>
          {score != null && (
            <span className={`font-mono text-[16px] font-bold ${scoreColor}`}>
              {score.toFixed(1)}
            </span>
          )}
        </button>

        {rewardExpanded && score != null && (
          <div className="border-t border-rule px-3 pb-3 pt-2 space-y-3">
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
    </div>
  )
}
