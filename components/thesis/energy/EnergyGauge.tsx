'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { dayOfWeekShort } from '@/lib/formatters'

const METRICS = [
  { key: 'sleep', label: 'Sleep', garminField: 'sleepScore' as const, logField: 'sleepHours' as const, max: 100, manualMax: 10, unit: '', thresholds: { good: 80, warn: 60 }, manualThresholds: { good: 7, warn: 6 } },
  { key: 'hrv', label: 'HRV', garminField: 'hrvRmssd' as const, max: 120, thresholds: { good: 50, warn: 30 } },
  { key: 'battery', label: 'Battery', garminField: 'bodyBattery' as const, max: 100, thresholds: { good: 60, warn: 30 } },
]

export default function EnergyGauge() {
  const { recentLogs, garminMetrics, dates, log } = useDailyLogContext()
  const logMap = new Map(recentLogs.map(l => [l.date, l]))
  const garminMap = new Map(garminMetrics.map(g => [g.date, g]))
  const hasGarmin = garminMetrics.length > 0

  const geScore = log.rewardScore?.components?.ge
  const gateValue = log.rewardScore?.components?.gate

  const cellColor = (val: number, good: number, warn: number) => {
    if (val <= 0) return 'text-ink-faint bg-transparent'
    if (val >= good) return 'text-green-ink bg-green-bg'
    if (val >= warn) return 'text-amber-ink bg-amber-bg'
    return 'text-red-ink bg-red-bg'
  }

  const dotColor = (state: string | undefined) => {
    if (state === 'regulated') return 'bg-green-ink'
    if (state === 'slightly_spiked') return 'bg-amber-ink'
    if (state === 'spiked') return 'bg-red-ink'
    return 'bg-rule-light'
  }

  const bodyColor = (felt: string | undefined) => {
    if (felt === 'open') return 'bg-green-ink'
    if (felt === 'neutral') return 'bg-amber-ink'
    if (felt === 'tense') return 'bg-red-ink'
    return 'bg-rule-light'
  }

  return (
    <div className="h-full flex flex-col">
      {/* GE Score header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Nervous System &middot; 7 Days
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-muted">GE</span>
          <span className={`font-mono text-[16px] font-bold ${
            geScore != null ? (geScore >= 0.7 ? 'text-green-ink' : geScore >= 0.4 ? 'text-amber-ink' : 'text-red-ink') : 'text-ink-muted'
          }`}>
            {geScore != null ? (geScore * 100).toFixed(0) : '—'}
          </span>
          {gateValue != null && (
            <span className={`font-serif text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
              gateValue >= 1.0 ? 'bg-green-bg text-green-ink border-green-ink/20'
              : gateValue >= 0.7 ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
              : 'bg-red-bg text-red-ink border-red-ink/20'
            }`}>
              {gateValue >= 1.0 ? 'Reg' : gateValue >= 0.7 ? 'Slight' : 'Spiked'}
            </span>
          )}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="bg-paper border border-rule rounded-sm p-3 flex-1">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left font-serif text-[9px] italic text-ink-muted w-16 pb-1.5" />
              {dates.map(date => (
                <th key={date} className="text-center font-mono text-[9px] text-ink-muted pb-1.5 w-[13%]">
                  {dayOfWeekShort(date).charAt(0)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Sleep row */}
            <tr>
              <td className="font-serif text-[9px] italic text-ink-light py-1">
                {hasGarmin ? 'Sleep' : 'Sleep (h)'}
              </td>
              {dates.map(date => {
                const garmin = garminMap.get(date)
                const log = logMap.get(date)
                if (hasGarmin) {
                  const val = garmin?.sleepScore || 0
                  return (
                    <td key={date} className="text-center py-1">
                      <span className={`font-mono text-[10px] font-medium px-1 py-0.5 rounded-sm ${cellColor(val, 80, 60)}`}>
                        {val > 0 ? val : '—'}
                      </span>
                    </td>
                  )
                }
                const hours = log?.sleepHours || 0
                return (
                  <td key={date} className="text-center py-1">
                    <span className={`font-mono text-[10px] font-medium px-1 py-0.5 rounded-sm ${cellColor(hours, 7, 6)}`}>
                      {hours > 0 ? hours : '—'}
                    </span>
                  </td>
                )
              })}
            </tr>

            {/* HRV row (garmin only) */}
            {hasGarmin && (
              <tr>
                <td className="font-serif text-[9px] italic text-ink-light py-1">HRV</td>
                {dates.map(date => {
                  const val = garminMap.get(date)?.hrvRmssd || 0
                  return (
                    <td key={date} className="text-center py-1">
                      <span className={`font-mono text-[10px] font-medium px-1 py-0.5 rounded-sm ${cellColor(val, 50, 30)}`}>
                        {val > 0 ? Math.round(val) : '—'}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )}

            {/* Body Battery (garmin only) */}
            {hasGarmin && (
              <tr>
                <td className="font-serif text-[9px] italic text-ink-light py-1">Battery</td>
                {dates.map(date => {
                  const val = garminMap.get(date)?.bodyBattery || 0
                  return (
                    <td key={date} className="text-center py-1">
                      <span className={`font-mono text-[10px] font-medium px-1 py-0.5 rounded-sm ${cellColor(val, 60, 30)}`}>
                        {val > 0 ? val : '—'}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )}

            {/* Stress / RHR (garmin only) */}
            {hasGarmin && (
              <tr>
                <td className="font-serif text-[9px] italic text-ink-light py-1">Stress</td>
                {dates.map(date => {
                  const garmin = garminMap.get(date)
                  const stress = garmin?.stressLevel || 0
                  const rhr = garmin?.restingHeartRate || 0
                  const color = stress > 0
                    ? stress <= 25 ? 'bg-green-ink' : stress <= 50 ? 'bg-amber-ink' : 'bg-red-ink'
                    : 'bg-rule-light'
                  return (
                    <td key={date} className="text-center py-1">
                      <div className="flex items-center justify-center gap-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        {rhr > 0 && <span className="font-mono text-[8px] text-ink-light">{rhr}</span>}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )}

            {/* NS State row */}
            <tr>
              <td className="font-serif text-[9px] italic text-ink-light py-1">NS</td>
              {dates.map(date => {
                const state = logMap.get(date)?.nervousSystemState
                return (
                  <td key={date} className="text-center py-1">
                    <div className={`w-2.5 h-2.5 rounded-full mx-auto ${dotColor(state)}`} />
                  </td>
                )
              })}
            </tr>

            {/* Body Felt row */}
            <tr>
              <td className="font-serif text-[9px] italic text-ink-light py-1">Body</td>
              {dates.map(date => {
                const felt = logMap.get(date)?.bodyFelt
                return (
                  <td key={date} className="text-center py-1">
                    <div className={`w-2.5 h-2.5 rounded-full mx-auto ${bodyColor(felt)}`} />
                  </td>
                )
              })}
            </tr>

            {/* Ship row */}
            <tr>
              <td className="font-serif text-[9px] italic text-ink-light py-1">Ship</td>
              {dates.map(date => {
                const shipped = logMap.get(date)?.publicIteration
                return (
                  <td key={date} className="text-center py-1">
                    <div className={`w-2.5 h-2.5 rounded-full mx-auto border ${
                      shipped ? 'bg-navy border-navy' : 'bg-transparent border-rule'
                    }`} />
                  </td>
                )
              })}
            </tr>

            {/* Revenue asks row */}
            <tr>
              <td className="font-serif text-[9px] italic text-ink-light py-1">Asks</td>
              {dates.map(date => {
                const asks = logMap.get(date)?.revenueAsksCount || 0
                return (
                  <td key={date} className="text-center py-1">
                    <span className={`font-mono text-[10px] ${asks > 0 ? 'text-gold font-medium' : 'text-ink-faint'}`}>
                      {asks > 0 ? asks : '—'}
                    </span>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-rule-light">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-ink" />
            <span className="font-mono text-[7px] text-ink-muted">good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-ink" />
            <span className="font-mono text-[7px] text-ink-muted">watch</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-ink" />
            <span className="font-mono text-[7px] text-ink-muted">alert</span>
          </div>
          {hasGarmin && (
            <span className="font-mono text-[7px] text-ink-faint ml-auto">garmin synced</span>
          )}
        </div>
      </div>
    </div>
  )
}
