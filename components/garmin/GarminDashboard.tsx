'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getAllGarminMetrics, getAllGarminActivities } from '@/lib/firestore'
import type { GarminMetrics, GarminActivity } from '@/lib/types'
import { computeSleepDrivers, weekdaySleepPattern, mean } from '@/lib/garmin-analysis'
import SleepTrendChart from './SleepTrendChart'
import SleepStagesChart from './SleepStagesChart'
import SleepDriversPanel from './SleepDriversPanel'
import WeekdayPatternChart from './WeekdayPatternChart'
import MetricTrendChart from './MetricTrendChart'
import TrainingHistory from './TrainingHistory'

type Range = '30' | '90' | '365' | '1095' | '1825' | 'si'

const RANGES: Array<{ key: Range; label: string }> = [
  { key: '30', label: '30D' },
  { key: '90', label: '90D' },
  { key: '365', label: '1Y' },
  { key: '1095', label: '3Y' },
  { key: '1825', label: '5Y' },
  { key: 'si', label: 'SI' },
]

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-rule rounded-sm p-3 ${className}`}>
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        {title}
      </div>
      {children}
    </div>
  )
}

function StatTile({
  label,
  value,
  unit,
  delta,
  betterWhenLower = false,
}: {
  label: string
  value: number | null
  unit: string
  delta: number | null
  betterWhenLower?: boolean
}) {
  const good = delta !== null && (betterWhenLower ? delta < 0 : delta > 0)
  const flat = delta !== null && Math.abs(delta) < 0.5
  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="text-[11px] text-ink-muted mb-1">{label}</div>
      <div className="font-mono text-[22px] font-semibold text-ink leading-none">
        {value !== null ? Math.round(value) : '—'}
        <span className="text-[11px] font-medium text-ink-muted ml-1">{unit}</span>
      </div>
      <div
        className="font-mono text-[10px] font-medium mt-1.5"
        style={{ color: delta === null || flat ? '#9a928a' : good ? '#2d5f3f' : '#8c2d2d' }}
      >
        {delta === null ? 'vs 30n avg —' : `${delta > 0 ? '+' : ''}${delta.toFixed(0)} vs 30n avg`}
      </div>
    </div>
  )
}

export default function GarminDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<GarminMetrics[] | null>(null)
  const [activities, setActivities] = useState<GarminActivity[]>([])
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>('90')

  useEffect(() => {
    if (!user) return
    getAllGarminMetrics(user.uid)
      .then(setMetrics)
      .catch(e => setError((e as Error).message))
    getAllGarminActivities(user.uid)
      .then(setActivities)
      .catch(() => setActivities([]))
  }, [user])

  const ranged = useMemo(() => {
    if (!metrics) return []
    if (range === 'si') return metrics
    const cutoff = new Date(Date.now() - Number(range) * 86400000)
      .toISOString()
      .slice(0, 10)
    return metrics.filter(m => m.date >= cutoff)
  }, [metrics, range])

  const drivers = useMemo(() => (metrics ? computeSleepDrivers(metrics) : []), [metrics])
  const weekday = useMemo(() => (metrics ? weekdaySleepPattern(metrics) : []), [metrics])

  if (error) {
    return <div className="text-[11px] text-red-ink py-12 text-center">Failed to load Garmin data: {error}</div>
  }
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-24 bg-white border border-rule rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }
  if (metrics.length === 0) {
    return (
      <div className="text-[11px] text-ink-muted py-12 text-center">
        No Garmin data found for this account.
      </div>
    )
  }

  const last30 = metrics.slice(-30)
  const latestNight = [...metrics].reverse().find(m => m.sleepScore !== null)
  const avg = (f: (m: GarminMetrics) => number | null | undefined) => mean(last30.map(f))
  const delta = (v: number | null | undefined, base: number | null) =>
    v !== null && v !== undefined && base !== null ? v - base : null

  const stageNights = metrics.slice(-42).map(m => ({
    date: m.date,
    sleepScore: m.sleepScore,
    deepSleepMinutes: m.deepSleepMinutes,
    lightSleepMinutes: m.lightSleepMinutes,
    remSleepMinutes: m.remSleepMinutes,
    awakeMinutes: m.awakeMinutes,
    hrvRmssd: m.hrvRmssd,
    restingHeartRate: m.restingHeartRate,
    respirationRate: m.respirationRate,
  }))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatTile
          label="Sleep Score"
          value={latestNight?.sleepScore ?? null}
          unit=""
          delta={delta(latestNight?.sleepScore, avg(m => m.sleepScore))}
        />
        <StatTile
          label="Deep Sleep"
          value={latestNight?.deepSleepMinutes ?? null}
          unit="min"
          delta={delta(latestNight?.deepSleepMinutes, avg(m => m.deepSleepMinutes))}
        />
        <StatTile
          label="Overnight HRV"
          value={latestNight?.hrvRmssd ?? null}
          unit="ms"
          delta={delta(latestNight?.hrvRmssd, avg(m => m.hrvRmssd))}
        />
        <StatTile
          label="Resting HR"
          value={latestNight?.restingHeartRate ?? null}
          unit="bpm"
          delta={delta(latestNight?.restingHeartRate, avg(m => m.restingHeartRate))}
          betterWhenLower
        />
        <StatTile
          label="Battery Charged"
          value={latestNight?.bodyBatteryCharged ?? null}
          unit=""
          delta={delta(latestNight?.bodyBatteryCharged, avg(m => m.bodyBatteryCharged))}
        />
      </div>

      <Card title="Sleep Score Trend — Since Jun 2021">
        <div className="flex gap-1 mb-2">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border ${
                range === r.key
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <SleepTrendChart
          nights={ranged
            .filter(m => m.date >= '2021-06-03')
            .map(m => ({ date: m.date, score: m.sleepScore }))}
        />
        <div className="text-[10px] text-ink-muted mt-1">
          Garmin sleep scores begin Jun 2021 (first score-capable watch) — this metric cannot go back further. The full 10-year record is the duration chart below.
        </div>
      </Card>

      <Card title="Sleep Duration — 10 Years, Since Jun 2016">
        <MetricTrendChart
          points={metrics
            .filter(m => m.sleepDurationMinutes != null)
            .map(m => ({ date: m.date, value: (m.sleepDurationMinutes as number) / 60 }))}
          unit="h"
          rollingWindow={30}
          valueFormat={v => v.toFixed(1)}
        />
        <div className="text-[10px] text-ink-muted mt-1">
          Nightly sleep duration (grey) with 30-night average (burgundy). Pre-2021 is duration-only tracking from the older watch; gaps are unworn stretches.
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Sleep Architecture — Last 6 Weeks" className="lg:col-span-2">
          <SleepStagesChart nights={stageNights} />
        </Card>
        <Card title="Score by Weekday">
          <WeekdayPatternChart stats={weekday} />
          <div className="text-[10px] text-ink-muted mt-2">
            Average sleep score by wake-up day, full history. Sun = Saturday night.
          </div>
        </Card>
      </div>

      <Card title="Sleep Drivers">
        <SleepDriversPanel groups={drivers} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="VO2max — Since 2016">
          <MetricTrendChart
            points={metrics
              .filter(m => m.vo2max != null)
              .map(m => ({ date: m.date, value: m.vo2max as number }))}
            rollingWindow={10}
            valueFormat={v => v.toFixed(1)}
            showDots
          />
          <div className="text-[10px] text-ink-muted mt-1">
            Garmin estimate on qualifying activity days; 10-reading average in burgundy.
          </div>
        </Card>
        <Card title="Endurance Score">
          <MetricTrendChart
            points={metrics
              .filter(m => m.enduranceScore != null)
              .map(m => ({ date: m.date, value: m.enduranceScore as number }))}
            rollingWindow={14}
            valueFormat={v => Math.round(v).toLocaleString()}
          />
          <div className="text-[10px] text-ink-muted mt-1">
            Available since the Forerunner 970 (May 2025); 14-day average in burgundy.
          </div>
        </Card>
      </div>

      {activities.length > 0 && (
        <Card title={`Training History — ${activities.length} Activities`}>
          <TrainingHistory activities={activities} />
        </Card>
      )}

      <details className="bg-white border border-rule rounded-sm p-3">
        <summary className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy cursor-pointer">
          Data — Last 30 Nights
        </summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule">
                {['Date', 'Score', 'Deep', 'Light', 'REM', 'Awake', 'HRV', 'RHR', 'Stress', 'Steps'].map(hdr => (
                  <th key={hdr} className="text-[10px] text-ink-muted font-medium py-1 pr-3">{hdr}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...last30].reverse().map(m => (
                <tr key={m.date} className="border-b border-rule-light">
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.date}</td>
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.sleepScore ?? '—'}</td>
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.deepSleepMinutes ?? '—'}</td>
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.lightSleepMinutes ?? '—'}</td>
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.remSleepMinutes ?? '—'}</td>
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.awakeMinutes ?? '—'}</td>
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.hrvRmssd ?? '—'}</td>
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.restingHeartRate ?? '—'}</td>
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.stressLevel ?? '—'}</td>
                  <td className="font-mono text-[10px] text-ink py-1 pr-3">{m.steps ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="text-[10px] text-ink-muted pb-4">
        {metrics.length} days synced · {metrics[0].date} to {metrics[metrics.length - 1].date} · synced daily from Garmin Connect
      </div>
    </div>
  )
}
