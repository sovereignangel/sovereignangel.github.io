'use client'

import type { DailyLog } from '@/lib/types'
import { dayOfWeekShort } from '@/lib/formatters'

interface NervousSystemTrendsProps {
  logs: DailyLog[]
  dates: string[]
}

export default function NervousSystemTrends({ logs, dates }: NervousSystemTrendsProps) {
  const logMap = new Map(logs.map(l => [l.date, l]))

  return (
    <div className="space-y-5">
      <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink pb-2 border-b border-rule-light">
        This Week&apos;s Patterns
      </h3>

      {/* Sleep Consistency */}
      <div>
        <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted mb-2">Sleep Consistency</p>
        <div className="flex gap-1 items-end h-12">
          {dates.map((date) => {
            const log = logMap.get(date)
            const hours = log?.sleepHours || 0
            const maxH = 10
            const heightPct = hours > 0 ? (hours / maxH) * 100 : 5
            const color = hours >= 7 ? 'bg-green-ink' : hours >= 6 ? 'bg-amber-ink' : hours > 0 ? 'bg-red-ink' : 'bg-rule-light'
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative" style={{ height: '48px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-sm ${color} transition-all`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="font-mono text-[8px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Emotional Volatility */}
      <div>
        <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted mb-2">Emotional State</p>
        <div className="flex gap-2 items-center">
          {dates.map((date) => {
            const log = logMap.get(date)
            const state = log?.nervousSystemState
            const color = state === 'regulated' ? 'bg-green-ink' : state === 'slightly_spiked' ? 'bg-amber-ink' : state === 'spiked' ? 'bg-red-ink' : 'bg-rule-light'
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="font-mono text-[8px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Shipping Cadence */}
      <div>
        <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted mb-2">Shipping Cadence</p>
        <div className="flex gap-2 items-center">
          {dates.map((date) => {
            const log = logMap.get(date)
            const shipped = log?.publicIteration
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full border ${
                  shipped ? 'bg-navy border-navy' : 'bg-transparent border-rule'
                }`} />
                <span className="font-mono text-[8px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Revenue Asks */}
      <div>
        <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted mb-2">Revenue Asks</p>
        <div className="flex gap-1 items-end h-8">
          {dates.map((date) => {
            const log = logMap.get(date)
            const asks = log?.revenueAsksCount || 0
            const maxAsks = 6
            const heightPct = asks > 0 ? (asks / maxAsks) * 100 : 5
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative" style={{ height: '32px' }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-sm bg-navy transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="font-mono text-[8px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-1 h-px bg-gold/30" style={{ position: 'relative', top: '-12px' }} />
      </div>
    </div>
  )
}
