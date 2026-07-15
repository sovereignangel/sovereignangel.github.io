'use client'

import { useMemo, useState } from 'react'
import type { KiteSession } from '@/lib/types'

const SPRINT_START = '2026-07-14'
const SPRINT_END = '2026-09-26'

interface Props {
  sessions: KiteSession[]
}

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateRange(start: string, end: string): string[] {
  const days: string[] = []
  const d = new Date(`${start}T12:00:00`)
  const stop = new Date(`${end}T12:00:00`)
  while (d <= stop) {
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    )
    d.setDate(d.getDate() + 1)
  }
  return days
}

export function HoursChart({ sessions }: Props) {
  const [hover, setHover] = useState<number | null>(null)

  const { days, hoursByDay, maxHours, ticks, todayIdx } = useMemo(() => {
    const days = dateRange(SPRINT_START, SPRINT_END)
    const hoursByDay = days.map(date =>
      sessions.filter(s => s.date === date).reduce((sum, s) => sum + (s.hours || 0), 0)
    )
    const maxHours = Math.max(3, ...hoursByDay)
    // Tick each Monday
    const ticks = days
      .map((date, i) => ({ date, i }))
      .filter(({ date }) => new Date(`${date}T12:00:00`).getDay() === 1)
    const todayIdx = days.indexOf(localToday())
    return { days, hoursByDay, maxHours, ticks, todayIdx }
  }, [sessions])

  const W = 1160
  const H = 150
  const PAD_L = 30
  const PAD_B = 22
  const PAD_T = 8
  const plotW = W - PAD_L - 8
  const plotH = H - PAD_T - PAD_B
  const step = plotW / days.length
  const barW = Math.max(2, step - 2)
  const y = (h: number) => PAD_T + plotH - (h / maxHours) * plotH

  const fmtTick = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        Hours on Water — Daily
      </div>
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily hours on water">
          {/* Gridlines */}
          {[1, 2, 3].filter(h => h <= maxHours).map(h => (
            <g key={h}>
              <line x1={PAD_L} x2={W - 8} y1={y(h)} y2={y(h)} stroke="#e8e2da" strokeWidth={1} />
              <text x={PAD_L - 6} y={y(h) + 4} textAnchor="end" fontSize={11} fill="#9a928a">
                {h}h
              </text>
            </g>
          ))}
          {/* Baseline */}
          <line x1={PAD_L} x2={W - 8} y1={y(0)} y2={y(0)} stroke="#d8d0c8" strokeWidth={1} />

          {/* Today marker */}
          {todayIdx >= 0 && (
            <line
              x1={PAD_L + todayIdx * step + step / 2}
              x2={PAD_L + todayIdx * step + step / 2}
              y1={PAD_T}
              y2={y(0)}
              stroke="#c8c0b8"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {/* Bars */}
          {hoursByDay.map((h, i) =>
            h > 0 ? (
              <rect
                key={days[i]}
                x={PAD_L + i * step + (step - barW) / 2}
                y={y(h)}
                width={barW}
                height={y(0) - y(h)}
                rx={2}
                fill={hover === i ? '#5e2222' : '#7c2d2d'}
              />
            ) : null
          )}

          {/* Hover hit targets (full column, larger than the mark) */}
          {days.map((date, i) => (
            <rect
              key={`hit-${date}`}
              x={PAD_L + i * step}
              y={PAD_T}
              width={step}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}

          {/* Hover label */}
          {hover !== null && hoursByDay[hover] > 0 && (
            <text
              x={Math.min(Math.max(PAD_L + hover * step + step / 2, PAD_L + 40), W - 60)}
              y={y(hoursByDay[hover]) - 6}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill="#2a2522"
            >
              {fmtTick(days[hover])} · {hoursByDay[hover]}h
            </text>
          )}

          {/* Week ticks */}
          {ticks.map(({ date, i }) => (
            <text
              key={date}
              x={PAD_L + i * step + step / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize={11}
              fill="#9a928a"
            >
              {fmtTick(date)}
            </text>
          ))}
        </svg>
      </div>
      <div className="text-[10px] text-ink-muted mt-0.5">
        Palanga sprint window: Jul 14 — Sep 26. Dashed line marks today.
      </div>
    </div>
  )
}
