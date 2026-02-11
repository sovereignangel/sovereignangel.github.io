'use client'

import type { DailyLog, GarminMetrics } from '@/lib/types'
import { dayOfWeekShort } from '@/lib/formatters'

interface NervousSystemTrendsProps {
  logs: DailyLog[]
  dates: string[]
  garminMetrics?: GarminMetrics[]
}

export default function NervousSystemTrends({ logs, dates, garminMetrics = [] }: NervousSystemTrendsProps) {
  const logMap = new Map(logs.map(l => [l.date, l]))
  const garminMap = new Map(garminMetrics.map(g => [g.date, g]))
  const hasGarmin = garminMetrics.length > 0

  return (
    <div className="space-y-5">
      <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink pb-2 border-b border-rule-light">
        This Week&apos;s Patterns
      </h3>

      {/* Sleep — use Garmin sleep score if available, fall back to manual hours */}
      <div>
        <div className="flex items-baseline gap-1.5 mb-2">
          <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">
            {hasGarmin ? 'Sleep Score' : 'Sleep Consistency'}
          </p>
          {hasGarmin && (
            <span className="font-mono text-[8px] text-ink-faint">garmin</span>
          )}
        </div>
        <div className="flex gap-1 items-end h-12">
          {dates.map((date) => {
            const garmin = garminMap.get(date)
            const log = logMap.get(date)

            if (hasGarmin) {
              const score = garmin?.sleepScore || 0
              const heightPct = score > 0 ? (score / 100) * 100 : 5
              const color = score >= 80 ? 'bg-green-ink' : score >= 60 ? 'bg-amber-ink' : score > 0 ? 'bg-red-ink' : 'bg-rule-light'
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: '48px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-sm ${color} transition-all`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  {score > 0 && <span className="font-mono text-[8px] text-ink-light">{score}</span>}
                  <span className="font-mono text-[8px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
                </div>
              )
            }

            // Fallback: manual sleep hours
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

      {/* Garmin: HRV */}
      {hasGarmin && (
        <div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">HRV (RMSSD)</p>
            <span className="font-mono text-[8px] text-ink-faint">regulation capacity</span>
          </div>
          <div className="flex gap-1 items-end h-12">
            {dates.map((date) => {
              const garmin = garminMap.get(date)
              const hrv = garmin?.hrvRmssd || 0
              const maxHrv = 120
              const heightPct = hrv > 0 ? Math.min((hrv / maxHrv) * 100, 100) : 5
              const color = hrv >= 50 ? 'bg-green-ink' : hrv >= 30 ? 'bg-amber-ink' : hrv > 0 ? 'bg-red-ink' : 'bg-rule-light'
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: '48px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-sm ${color} transition-all`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  {hrv > 0 && <span className="font-mono text-[8px] text-ink-light">{Math.round(hrv)}</span>}
                  <span className="font-mono text-[8px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Garmin: Body Battery */}
      {hasGarmin && (
        <div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">Body Battery</p>
            <span className="font-mono text-[8px] text-ink-faint">capacity to act</span>
          </div>
          <div className="flex gap-1 items-end h-12">
            {dates.map((date) => {
              const garmin = garminMap.get(date)
              const bb = garmin?.bodyBattery || 0
              const heightPct = bb > 0 ? bb : 5
              const color = bb >= 60 ? 'bg-green-ink' : bb >= 30 ? 'bg-amber-ink' : bb > 0 ? 'bg-red-ink' : 'bg-rule-light'
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: '48px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-sm ${color} transition-all`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  {bb > 0 && <span className="font-mono text-[8px] text-ink-light">{bb}</span>}
                  <span className="font-mono text-[8px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Garmin: Stress + Resting HR — compact row */}
      {hasGarmin && (
        <div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">Stress / Resting HR</p>
            <span className="font-mono text-[8px] text-ink-faint">g(s&#x1D708;) gate</span>
          </div>
          <div className="flex gap-2 items-center">
            {dates.map((date) => {
              const garmin = garminMap.get(date)
              const stress = garmin?.stressLevel || 0
              const rhr = garmin?.restingHeartRate || 0
              const stressColor = stress > 0
                ? stress <= 25 ? 'bg-green-ink' : stress <= 50 ? 'bg-amber-ink' : 'bg-red-ink'
                : 'bg-rule-light'
              return (
                <div key={date} className="flex flex-col items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${stressColor}`} />
                  {rhr > 0 && <span className="font-mono text-[8px] text-ink-light">{rhr}</span>}
                  <span className="font-mono text-[8px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Emotional Volatility (manual) */}
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
