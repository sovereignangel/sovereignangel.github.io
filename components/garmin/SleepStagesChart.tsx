'use client'

import { useState } from 'react'
import type { SleepNight } from '@/lib/garmin-analysis'

const STAGES = [
  { key: 'deepSleepMinutes' as const, label: 'Deep', color: '#356db0' },
  { key: 'lightSleepMinutes' as const, label: 'Light', color: '#a8842f' },
  { key: 'remSleepMinutes' as const, label: 'REM', color: '#a04545' },
  { key: 'awakeMinutes' as const, label: 'Awake', color: '#9a928a' },
]

const W = 900
const H = 220
const PAD = { top: 8, right: 8, bottom: 24, left: 34 }

function fmtHm(min: number): string {
  return `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, '0')}m`
}

export default function SleepStagesChart({ nights }: { nights: SleepNight[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const withStages = nights.filter(n => n.deepSleepMinutes !== null || n.lightSleepMinutes !== null)
  if (withStages.length === 0) {
    return <div className="text-[11px] text-ink-muted py-8 text-center">No sleep stage data in this range.</div>
  }

  const totals = withStages.map(n =>
    STAGES.reduce((s, st) => s + (n[st.key] ?? 0), 0)
  )
  const maxTotal = Math.max(...totals)
  const yMaxH = Math.ceil(maxTotal / 60)
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const slot = plotW / withStages.length
  const barW = Math.max(4, Math.min(26, slot - 4))
  const yScale = (min: number) => (min / (yMaxH * 60)) * plotH

  const h = hover !== null ? withStages[hover] : null

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-1.5">
        {STAGES.map(st => (
          <span key={st.key} className="flex items-center gap-1.5 text-[10px] text-ink-muted">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: st.color }} />
            {st.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: yMaxH + 1 }, (_, i) => i).filter(i => i % 2 === 0).map(hr => (
          <g key={hr}>
            <line
              x1={PAD.left} x2={W - PAD.right}
              y1={PAD.top + plotH - yScale(hr * 60)} y2={PAD.top + plotH - yScale(hr * 60)}
              stroke="#e8e2da" strokeWidth={1}
            />
            <text x={PAD.left - 6} y={PAD.top + plotH - yScale(hr * 60) + 4} textAnchor="end" fontSize={11} fill="#9a928a">
              {hr}h
            </text>
          </g>
        ))}
        {withStages.map((n, i) => {
          const cx = PAD.left + i * slot + slot / 2
          let yCursor = PAD.top + plotH
          return (
            <g key={n.date} onMouseEnter={() => setHover(i)}>
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {STAGES.map(st => {
                const v = n[st.key] ?? 0
                if (v <= 0) return null
                const hgt = Math.max(0, yScale(v) - 2)
                yCursor -= yScale(v)
                return (
                  <rect
                    key={st.key}
                    x={cx - barW / 2}
                    y={yCursor}
                    width={barW}
                    height={hgt}
                    rx={2}
                    fill={st.color}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )
              })}
              {(i === 0 || n.date.slice(8) === '01' || i % 7 === 0) && (
                <text x={cx} y={H - 6} textAnchor="middle" fontSize={11} fill="#9a928a">
                  {new Date(n.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {hover !== null && h && (
        <div
          className="absolute pointer-events-none bg-white border border-rule rounded-sm px-2 py-1.5 shadow-sm"
          style={{
            left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%`,
            top: 20,
            transform: hover > withStages.length * 0.7 ? 'translateX(-108%)' : 'translateX(8px)',
          }}
        >
          <div className="text-[10px] text-ink-muted whitespace-nowrap">
            {new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {h.sleepScore !== null && <span> · score {h.sleepScore}</span>}
          </div>
          {STAGES.map(st => (
            <div key={st.key} className="flex items-center gap-1.5 font-mono text-[10px] text-ink whitespace-nowrap">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: st.color }} />
              {st.label} {h[st.key] !== null ? fmtHm(h[st.key] as number) : '—'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
