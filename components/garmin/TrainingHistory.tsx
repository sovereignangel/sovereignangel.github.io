'use client'

import { useMemo } from 'react'
import type { GarminActivity } from '@/lib/types'

const SPORT_GROUPS: Array<{ label: string; types: string[] }> = [
  { label: 'Running', types: ['running', 'treadmill_running', 'track_running', 'trail_running'] },
  { label: 'Cycling', types: ['cycling', 'road_biking', 'virtual_ride', 'indoor_cycling', 'mountain_biking', 'gravel_cycling'] },
  { label: 'Rowing', types: ['indoor_rowing', 'rowing'] },
  { label: 'Swimming', types: ['lap_swimming', 'open_water_swimming'] },
  { label: 'Hiking & Walking', types: ['hiking', 'walking'] },
  { label: 'Strength & Gym', types: ['strength_training', 'hiit', 'stair_climbing', 'fitness_equipment', 'yoga'] },
  { label: 'Skiing', types: ['resort_skiing', 'backcountry_skiing'] },
]

function fmtHours(seconds: number): string {
  return Math.round(seconds / 3600) + 'h'
}

function fmtKm(meters: number): string {
  return meters >= 100000
    ? Math.round(meters / 1000).toLocaleString() + ' km'
    : (meters / 1000).toFixed(1) + ' km'
}

function fmtDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

export default function TrainingHistory({ activities }: { activities: GarminActivity[] }) {
  const summary = useMemo(() => {
    const groups = SPORT_GROUPS.map(g => ({ ...g, count: 0, seconds: 0, meters: 0, firstYear: null as string | null }))
    const other = { label: 'Other', count: 0, seconds: 0, meters: 0, firstYear: null as string | null }
    for (const a of activities) {
      const g = groups.find(x => x.types.includes(a.type)) ?? other
      g.count++
      g.seconds += a.durationSeconds ?? 0
      g.meters += a.distanceMeters ?? 0
      if (a.date && (!g.firstYear || a.date.slice(0, 4) < g.firstYear)) g.firstYear = a.date.slice(0, 4)
    }
    return [...groups, other].filter(g => g.count > 0).sort((a, b) => b.seconds - a.seconds)
  }, [activities])

  const recent = useMemo(
    () => [...activities].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 10),
    [activities]
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          By Sport — Since {activities[0]?.date?.slice(0, 4) ?? ''}
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-rule">
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2">Sport</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-right">Sessions</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-right">Time</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-right">Distance</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 text-right">Since</th>
            </tr>
          </thead>
          <tbody>
            {summary.map(g => (
              <tr key={g.label} className="border-b border-rule-light">
                <td className="text-[11px] text-ink py-1 pr-2">{g.label}</td>
                <td className="font-mono text-[11px] font-semibold text-ink py-1 pr-2 text-right">{g.count}</td>
                <td className="font-mono text-[10px] text-ink py-1 pr-2 text-right">{fmtHours(g.seconds)}</td>
                <td className="font-mono text-[10px] text-ink py-1 pr-2 text-right">{g.meters > 0 ? fmtKm(g.meters) : '—'}</td>
                <td className="font-mono text-[10px] text-ink-muted py-1 text-right">{g.firstYear ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Recent Sessions
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-rule">
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2">Date</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2">Activity</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-right">Time</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 text-right">Dist</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(a => (
              <tr key={a.activityId} className="border-b border-rule-light">
                <td className="font-mono text-[10px] text-ink-muted py-1 pr-2 whitespace-nowrap">{a.date?.slice(5) ?? '—'}</td>
                <td className="text-[11px] text-ink py-1 pr-2 truncate max-w-[180px]" title={a.name ?? ''}>{a.name ?? a.type}</td>
                <td className="font-mono text-[10px] text-ink py-1 pr-2 text-right whitespace-nowrap">{fmtDuration(a.durationSeconds)}</td>
                <td className="font-mono text-[10px] text-ink py-1 text-right whitespace-nowrap">{a.distanceMeters ? fmtKm(a.distanceMeters) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
