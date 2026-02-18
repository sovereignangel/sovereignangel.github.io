'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { MUSCLE_TARGETS } from '@/lib/constants'
import { getSystemState, SYSTEM_STATE_COLORS } from '@/lib/types/sales'
import { dayOfWeekShort } from '@/lib/formatters'

// ─── Sparkline ────────────────────────────────────────────────────────

function Sparkline({ data, max }: { data: number[]; max?: number }) {
  const actualMax = max || Math.max(...data, 1)
  return (
    <span className="inline-flex items-end gap-px h-4">
      {data.map((val, i) => (
        <span
          key={i}
          className="w-[5px] bg-burgundy/60 rounded-t-[1px]"
          style={{
            height: `${Math.max((val / actualMax) * 100, val > 0 ? 10 : 0)}%`,
            minHeight: val > 0 ? '2px' : '0px',
          }}
        />
      ))}
    </span>
  )
}

// ─── Weekly target color ──────────────────────────────────────────────

function weeklyColor(current: number, target: number): string {
  const ratio = target > 0 ? current / target : 0
  const state = getSystemState(ratio, { nominal: 1.0, watch: 0.7, caution: 0.4 })
  return SYSTEM_STATE_COLORS[state].text
}

// ─── MusclesView ──────────────────────────────────────────────────────

export default function MusclesView() {
  const { log, recentLogs, dates } = useDailyLogContext()

  // Build 7-day data arrays aligned to dates
  const logMap = new Map(recentLogs.map(l => [l.date, l]))
  const shipsData = dates.map(d => (logMap.get(d)?.shipsCount ?? 0) as number)
  const asksData = dates.map(d => logMap.get(d)?.revenueAsksCount ?? 0)
  const postsData = dates.map(d => (logMap.get(d)?.publicPostsCount ?? 0) as number)
  const publicData = dates.map(d => logMap.get(d)?.publicIteration ?? false)

  // Weekly totals
  const weeklyShips = shipsData.reduce((s, v) => s + v, 0)
  const weeklyAsks = asksData.reduce((s, v) => s + v, 0)
  const weeklyPosts = postsData.reduce((s, v) => s + v, 0)

  return (
    <div className="h-full flex flex-col space-y-3 overflow-y-auto">
      {/* Muscle 1: Shipping Speed */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Shipping Speed
          </h4>
          <span className="font-mono text-[14px] font-semibold text-ink">
            {(log as Record<string, unknown>).shipsCount as number || 0}
          </span>
        </div>

        {/* 7-day sparkline */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">7d</span>
          <Sparkline data={shipsData} />
          <div className="flex gap-1 ml-auto">
            {dates.map((d, i) => (
              <span key={d} className="font-mono text-[7px] text-ink-muted text-center w-[5px]">
                {i === 0 || i === dates.length - 1 ? dayOfWeekShort(d).slice(0, 2) : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Weekly total vs target */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">This Week:</span>
          <span className={`font-mono text-[11px] font-semibold ${weeklyColor(weeklyShips, MUSCLE_TARGETS.shipsPerWeek)}`}>
            {weeklyShips} / {MUSCLE_TARGETS.shipsPerWeek}
          </span>
        </div>

        {/* Sub-metrics */}
        <div className="flex flex-wrap gap-1.5">
          {log.whatShipped && (
            <span className="font-mono text-[9px] text-ink-muted truncate max-w-full">
              {log.whatShipped}
            </span>
          )}
          <div className="flex gap-1">
            {log.publicIteration && (
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                Public
              </span>
            )}
            {log.speedOverPerfection && (
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-green-bg text-green-ink border-green-ink/20">
                Speed&gt;Perf
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Muscle 2: Revenue Asks */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Revenue Asks
          </h4>
          <span className="font-mono text-[14px] font-semibold text-ink">
            {log.revenueAsksCount || 0}
          </span>
        </div>

        {/* 7-day sparkline */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">7d</span>
          <Sparkline data={asksData} />
          <div className="flex gap-1 ml-auto">
            {dates.map((d, i) => (
              <span key={d} className="font-mono text-[7px] text-ink-muted text-center w-[5px]">
                {i === 0 || i === dates.length - 1 ? dayOfWeekShort(d).slice(0, 2) : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Weekly total vs target */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">This Week:</span>
          <span className={`font-mono text-[11px] font-semibold ${weeklyColor(weeklyAsks, MUSCLE_TARGETS.asksPerWeek)}`}>
            {weeklyAsks} / {MUSCLE_TARGETS.asksPerWeek}
          </span>
        </div>

        {/* Sub-metrics */}
        <div className="space-y-1">
          {log.revenueAsksList && log.revenueAsksList.length > 0 && (
            <span className="font-mono text-[9px] text-ink-muted block truncate">
              {log.revenueAsksList.join(', ')}
            </span>
          )}
          <span className="font-mono text-[8px] text-ink-faint italic">
            Conversion tracking coming soon
          </span>
        </div>
      </div>

      {/* Muscle 3: Public Narrative */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Public Narrative
          </h4>
          <span className="font-mono text-[14px] font-semibold text-ink">
            {(log as Record<string, unknown>).publicPostsCount as number || 0}
          </span>
        </div>

        {/* 7-day sparkline */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">7d</span>
          <Sparkline data={postsData} />
          <div className="flex gap-1 ml-auto">
            {dates.map((d, i) => (
              <span key={d} className="font-mono text-[7px] text-ink-muted text-center w-[5px]">
                {i === 0 || i === dates.length - 1 ? dayOfWeekShort(d).slice(0, 2) : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Weekly total vs target */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">This Week:</span>
          <span className={`font-mono text-[11px] font-semibold ${weeklyColor(weeklyPosts, MUSCLE_TARGETS.postsPerWeek)}`}>
            {weeklyPosts} / {MUSCLE_TARGETS.postsPerWeek}
          </span>
        </div>

        {/* Sub-metrics: publicIteration badge per day */}
        <div className="flex items-center gap-1">
          <span className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mr-1">Public:</span>
          {dates.map((d, i) => (
            <div key={d} className="flex flex-col items-center gap-0.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm border ${
                publicData[i]
                  ? 'bg-burgundy border-burgundy'
                  : 'bg-transparent border-rule'
              }`} />
              <span className="font-mono text-[7px] text-ink-muted">
                {dayOfWeekShort(d).slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
