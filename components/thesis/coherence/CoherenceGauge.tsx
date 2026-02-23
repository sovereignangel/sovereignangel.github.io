'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { dayOfWeekShort } from '@/lib/formatters'
import { PillarBreakdown } from '@/components/thesis/reward'
import dynamic from 'next/dynamic'

const RewardTrajectoryChart = dynamic(
  () => import('@/components/thesis/RewardTrajectoryChart'),
  { ssr: false, loading: () => <div className="h-[120px]" /> }
)

export default function CoherenceGauge() {
  const { log, recentLogs, dates } = useDailyLogContext()

  const reward = log.rewardScore
  const score = reward?.score ?? null
  const components = reward?.components

  const logMap = new Map(recentLogs.map(l => [l.date, l]))
  const chartData = dates.map(date => ({
    date: dayOfWeekShort(date).slice(0, 2),
    score: logMap.get(date)?.rewardScore?.score ?? null,
  }))
  const hasTrajectoryData = chartData.some(d => d.score !== null)

  const scoreColor = score === null ? 'text-ink-muted'
    : score >= 7 ? 'text-green-ink'
    : score >= 4 ? 'text-amber-ink'
    : 'text-red-ink'

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Reward Score
        </h3>
        <span className="font-mono text-[10px] text-ink-muted">g* &middot; today</span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto">
        {!reward ? (
          <p className="font-serif text-[11px] italic text-ink-muted text-center py-6">
            Fill in today&apos;s log to compute your reward score.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Score + Gate */}
            <div>
              <div className="flex items-end gap-2 mb-1.5">
                <span className={`font-mono text-[36px] font-bold leading-none ${scoreColor}`}>
                  {score !== null ? score.toFixed(1) : '—'}
                </span>
                <span className="font-mono text-[13px] text-ink-muted mb-0.5">/ 10</span>
              </div>
              {gateLabel && (
                <span className={`inline-flex items-center font-serif text-[8px] uppercase tracking-wider border rounded-sm px-1.5 py-0.5 ${gateColor}`}>
                  g(s&#x1D708;) = {components!.gate.toFixed(1)} &middot; {gateLabel}
                </span>
              )}
            </div>

            {/* Pillar breakdown (Body / Brain / Build) */}
            {components && (
              <PillarBreakdown components={components} compact />
            )}

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
                <div className="h-[80px] flex items-center justify-center">
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
