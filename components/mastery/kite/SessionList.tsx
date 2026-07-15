'use client'

import type { KiteSession } from '@/lib/types'

interface Props {
  sessions: KiteSession[]
  onDelete: (sessionId: string) => void
}

const fmt = (v: number | null, unit: string) => (v === null || v === undefined ? '—' : `${v}${unit}`)

export function SessionList({ sessions, onDelete }: Props) {
  const recent = [...sessions].sort((a, b) => b.date.localeCompare(a.date))

  if (recent.length === 0) {
    return (
      <div className="text-[11px] text-ink-muted py-2">
        No sessions yet. Log the first one after your next window.
      </div>
    )
  }

  return (
    <table className="w-full text-left">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-rule">
          {['Date', 'Hrs', 'Wind', 'Kite', 'Focus', 'Air', 'Height', 'Dist', 'Jumps', ''].map(h => (
            <th key={h} className="text-[10px] text-ink-muted font-medium py-1 pr-2 uppercase tracking-[0.5px]">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {recent.map(s => (
          <tr key={s.id} className="border-b border-rule-light align-top">
            <td className="font-mono text-[10px] text-ink py-1 pr-2 whitespace-nowrap">{s.date.slice(5)}</td>
            <td className="font-mono text-[11px] font-semibold text-ink py-1 pr-2">{s.hours}</td>
            <td className="font-mono text-[10px] text-ink py-1 pr-2">{fmt(s.windKn, 'kn')}</td>
            <td className="font-mono text-[10px] text-ink py-1 pr-2">{fmt(s.kiteSize, 'm')}</td>
            <td className="text-[10px] text-ink-muted py-1 pr-2 max-w-[160px]">
              <div className="truncate" title={`${s.focus}${s.notes ? ` — ${s.notes}` : ''}`}>
                {s.focus || '—'}
              </div>
            </td>
            <td className="font-mono text-[10px] text-ink py-1 pr-2">{fmt(s.bestAirtimeSec, 's')}</td>
            <td className="font-mono text-[10px] text-ink py-1 pr-2">{fmt(s.bestHeightM, 'm')}</td>
            <td className="font-mono text-[10px] text-ink py-1 pr-2">{fmt(s.bestDistanceM, 'm')}</td>
            <td className="font-mono text-[10px] text-ink py-1 pr-2">
              {s.jumps !== null && s.jumps !== undefined ? `${s.landed ?? 0}/${s.jumps}` : '—'}
            </td>
            <td className="py-1 text-right">
              <button
                onClick={() => onDelete(s.id)}
                className="text-[10px] text-ink-faint hover:text-red-ink"
                title="Delete session"
              >
                ×
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
