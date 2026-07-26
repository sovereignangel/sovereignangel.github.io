'use client'

import { useMemo, useRef, useState } from 'react'
import { rollingMean } from '@/lib/garmin-analysis'

interface Night {
  date: string
  score: number | null
}

const W = 900
const H = 240
const PAD = { top: 12, right: 56, bottom: 24, left: 36 }

const NIGHTLY_COLOR = '#9a928a'
const AVG_COLOR = '#7c2d2d'

export default function SleepTrendChart({ nights }: { nights: Night[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const rolling = useMemo(
    () => rollingMean(nights.map(n => n.score), 7),
    [nights]
  )

  const scores = nights.map(n => n.score).filter((v): v is number => v !== null)
  if (scores.length < 2) {
    return <div className="text-[11px] text-ink-muted py-8 text-center">Not enough sleep data in this range.</div>
  }

  const yMin = Math.max(0, Math.floor((Math.min(...scores) - 5) / 10) * 10)
  const yMax = Math.min(100, Math.ceil((Math.max(...scores) + 5) / 10) * 10)
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (nights.length <= 1 ? 0 : (i / (nights.length - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH

  const path = (vals: Array<number | null>) => {
    let d = ''
    let pen = false
    vals.forEach((v, i) => {
      if (v === null) { pen = false; return }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
      pen = true
    })
    return d
  }

  const yTicks: number[] = []
  for (let t = yMin; t <= yMax; t += 10) yTicks.push(t)

  const monthTicks = nights
    .map((n, i) => ({ i, date: n.date }))
    .filter(({ date }, idx, arr) => idx === 0 || date.slice(0, 7) !== arr[idx - 1].date.slice(0, 7))
  const showEvery = Math.ceil(monthTicks.length / 8)

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((px - PAD.left) / plotW) * (nights.length - 1))
    setHover(idx >= 0 && idx < nights.length ? idx : null)
  }

  const h = hover !== null ? nights[hover] : null
  const hAvg = hover !== null ? rolling[hover] : null

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-1.5">
        <span className="flex items-center gap-1.5 text-[10px] text-ink-muted">
          <span className="inline-block w-3 h-[2px]" style={{ background: NIGHTLY_COLOR }} />
          Nightly score
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-ink-muted">
          <span className="inline-block w-3 h-[2px]" style={{ background: AVG_COLOR }} />
          7-night average
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map(t => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e8e2da" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#9a928a">{t}</text>
          </g>
        ))}
        {monthTicks.filter((_, idx) => idx % showEvery === 0).map(({ i, date }) => (
          <text key={date} x={x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="#9a928a">
            {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
          </text>
        ))}
        <path d={path(nights.map(n => n.score))} fill="none" stroke={NIGHTLY_COLOR} strokeWidth={1.5} strokeLinejoin="round" />
        <path d={path(rolling)} fill="none" stroke={AVG_COLOR} strokeWidth={2} strokeLinejoin="round" />
        {hover !== null && h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="#c8c0b8" strokeWidth={1} />
            {h.score !== null && (
              <circle cx={x(hover)} cy={y(h.score)} r={4} fill={NIGHTLY_COLOR} stroke="#ffffff" strokeWidth={2} />
            )}
            {hAvg !== null && (
              <circle cx={x(hover)} cy={y(hAvg)} r={4} fill={AVG_COLOR} stroke="#ffffff" strokeWidth={2} />
            )}
          </g>
        )}
      </svg>
      {hover !== null && h && (
        <div
          className="absolute pointer-events-none bg-white border border-rule rounded-sm px-2 py-1.5 shadow-sm"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            top: 24,
            transform: x(hover) > W * 0.7 ? 'translateX(-108%)' : 'translateX(8px)',
          }}
        >
          <div className="text-[10px] text-ink-muted whitespace-nowrap">
            {new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="font-mono text-[11px] font-semibold text-ink whitespace-nowrap">
            Score {h.score ?? '—'}
            {hAvg !== null && <span className="text-ink-muted font-medium"> · 7n avg {hAvg.toFixed(0)}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
