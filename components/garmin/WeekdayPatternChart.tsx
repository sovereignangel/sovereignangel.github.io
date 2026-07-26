'use client'

import type { WeekdayStat } from '@/lib/garmin-analysis'

export default function WeekdayPatternChart({ stats }: { stats: WeekdayStat[] }) {
  const avgs = stats.map(s => s.avg).filter((v): v is number => v !== null)
  if (avgs.length === 0) {
    return <div className="text-[11px] text-ink-muted py-8 text-center">No data.</div>
  }
  const best = Math.max(...avgs)

  return (
    <div className="flex items-end gap-1.5 h-[180px] pt-4">
      {stats.map(s => {
        const hPct = s.avg !== null ? (s.avg / 100) * 100 : 0
        const isBest = s.avg !== null && s.avg === best
        return (
          <div key={s.label} className="flex-1 flex flex-col items-center justify-end h-full" title={`${s.label}: ${s.avg?.toFixed(1) ?? '—'} (n=${s.n})`}>
            <div className="font-mono text-[10px] font-medium text-ink mb-0.5">
              {s.avg !== null ? Math.round(s.avg) : '—'}
            </div>
            <div
              className="w-full rounded-sm"
              style={{
                height: `${hPct * 0.75}%`,
                background: isBest ? '#7c2d2d' : '#c8b8b8',
              }}
            />
            <div className="text-[10px] text-ink-muted mt-1">{s.label}</div>
          </div>
        )
      })}
    </div>
  )
}
