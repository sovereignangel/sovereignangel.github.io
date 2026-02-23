'use client'

import type { DailyLog } from '@/lib/types'
import { dayOfWeekShort } from '@/lib/formatters'
import { PillarBreakdown } from '@/components/thesis/reward'
import dynamic from 'next/dynamic'

const RewardTrajectoryChart = dynamic(
  () => import('./RewardTrajectoryChart'),
  { ssr: false, loading: () => <div className="h-[140px]" /> }
)

interface RewardScoreCardProps {
  todayLog: DailyLog | null
  recentLogs: DailyLog[]
  dates: string[]
}

export default function RewardScoreCard({ todayLog, recentLogs, dates }: RewardScoreCardProps) {
  const reward = todayLog?.rewardScore
  const score = reward?.score ?? null
  const components = reward?.components

  // Build 7-day trajectory data
  const logMap = new Map(recentLogs.map(l => [l.date, l]))
  const chartData = dates.map(date => ({
    date: dayOfWeekShort(date).slice(0, 2),
    score: logMap.get(date)?.rewardScore?.score ?? null,
  }))

  const hasTrajectoryData = chartData.some(d => d.score !== null)

  // Score color
  const scoreColor = score === null ? 'text-ink-muted'
    : score >= 7 ? 'text-green-ink'
    : score >= 4 ? 'text-amber-ink'
    : 'text-red-ink'

  // Gate display
  const gateLabel = components
    ? components.gate >= 1.0 ? 'Regulated'
      : components.gate >= 0.7 ? 'Slightly Spiked'
      : 'Spiked'
    : null

  const gateColor = components
    ? components.gate >= 1.0 ? 'bg-green-bg text-green-ink border-green-ink/20'
      : components.gate >= 0.7 ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
      : 'bg-red-bg text-red-ink border-red-ink/20'
    : ''

  return (
    <div className="bg-paper border border-rule rounded-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Reward Score
        </h3>
        <span className="font-mono text-[11px] text-ink-muted">
          g* &middot; today
        </span>
      </div>

      {!reward ? (
        <p className="font-serif text-[12px] italic text-ink-muted text-center py-4">
          Fill in today&apos;s log to compute your reward score.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left: Score + Gate + Component breakdown */}
          <div>
            <div className="flex items-end gap-2 mb-2">
              <span className={`font-mono text-[42px] font-bold leading-none ${scoreColor}`}>
                {score !== null ? score.toFixed(1) : '—'}
              </span>
              <span className="font-mono text-[14px] text-ink-muted mb-1">/ 10</span>
            </div>

            {gateLabel && (
              <span className={`inline-flex items-center font-serif text-[9px] uppercase tracking-wider border rounded-sm px-2 py-0.5 ${gateColor}`}>
                g(s&#x1D708;) = {components!.gate.toFixed(1)} &middot; {gateLabel}
              </span>
            )}

            {/* Pillar breakdown (Body / Brain / Build) */}
            {components && (
              <div className="mt-4">
                <PillarBreakdown components={components} />
              </div>
            )}
          </div>

          {/* Right: 7-day trajectory */}
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-2">
              7-Day Trajectory
            </p>
            {hasTrajectoryData ? (
              <div className="h-[140px]">
                <RewardTrajectoryChart data={chartData} />
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center">
                <p className="font-serif text-[11px] italic text-ink-faint">
                  Log more days to see your trajectory
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
