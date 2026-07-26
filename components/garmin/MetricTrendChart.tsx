'use client'

import { useMemo, useRef, useState } from 'react'
import { rollingMean } from '@/lib/garmin-analysis'

interface Point {
  date: string
  value: number
}

interface Props {
  points: Point[]
  color?: string
  unit?: string
  rollingWindow?: number
  valueFormat?: (v: number) => string
  yDomain?: [number, number]
  showDots?: boolean
}

const W = 900
const H = 220
const PAD = { top: 12, right: 16, bottom: 24, left: 44 }
const DAY_MS = 86400000
const RAW_COLOR = '#9a928a'

export default function MetricTrendChart({
  points,
  color = '#7c2d2d',
  unit = '',
  rollingWindow = 30,
  valueFormat = v => v.toFixed(1),
  yDomain,
  showDots = false,
}: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const times = useMemo(() => points.map(p => Date.parse(p.date + 'T12:00:00')), [points])
  const rolling = useMemo(
    () => rollingMean(points.map(p => p.value), rollingWindow),
    [points, rollingWindow]
  )

  if (points.length < 2) {
    return <div className="text-[11px] text-ink-muted py-8 text-center">Not enough data.</div>
  }

  const values = points.map(p => p.value)
  const [yMin, yMax] = yDomain ?? [
    Math.min(...values) - (Math.max(...values) - Math.min(...values)) * 0.08,
    Math.max(...values) + (Math.max(...values) - Math.min(...values)) * 0.08,
  ]
  const t0 = times[0]
  const t1 = times[times.length - 1]
  const spanDays = Math.max(1, (t1 - t0) / DAY_MS)
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (t1 === t0 ? 0 : ((times[i] - t0) / (t1 - t0)) * plotW)
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH

  const path = (vals: Array<number | null>, maxGapDays: number) => {
    let d = ''
    let pen = false
    vals.forEach((v, i) => {
      if (v === null) { pen = false; return }
      if (pen && i > 0 && times[i] - times[i - 1] > maxGapDays * DAY_MS) pen = false
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
      pen = true
    })
    return d
  }

  const yTicks: number[] = []
  const step = (yMax - yMin) / 4
  for (let i = 0; i <= 4; i++) yTicks.push(yMin + step * i)

  const byYear = spanDays > 550
  const seen = new Set<string>()
  const xTicks: Array<{ i: number; label: string }> = []
  points.forEach((p, i) => {
    const key = byYear ? p.date.slice(0, 4) : p.date.slice(0, 7)
    if (!seen.has(key)) {
      seen.add(key)
      xTicks.push({
        i,
        label: byYear
          ? p.date.slice(0, 4)
          : new Date(p.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }),
      })
    }
  })
  const showEvery = Math.ceil(xTicks.length / 8)

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(x(i) - px)
      if (d < bestDist) { bestDist = d; best = i }
    }
    setHover(bestDist < 40 ? best : null)
  }

  const h = hover !== null ? points[hover] : null
  const hAvg = hover !== null ? rolling[hover] : null

  return (
    <div className="relative">
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
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#9a928a">
              {valueFormat(t)}
            </text>
          </g>
        ))}
        {xTicks.filter((_, idx) => idx % showEvery === 0).map(({ i, label }) => (
          <text key={`${label}-${i}`} x={x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="#9a928a">
            {label}
          </text>
        ))}
        <path d={path(values, 45)} fill="none" stroke={RAW_COLOR} strokeWidth={1} strokeLinejoin="round" opacity={0.55} />
        {showDots && points.map((p, i) => (
          <circle key={p.date + i} cx={x(i)} cy={y(p.value)} r={1.8} fill={RAW_COLOR} opacity={0.6} />
        ))}
        <path d={path(rolling, 90)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {hover !== null && h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="#c8c0b8" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(h.value)} r={4} fill={color} stroke="#ffffff" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hover !== null && h && (
        <div
          className="absolute pointer-events-none bg-white border border-rule rounded-sm px-2 py-1.5 shadow-sm"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            top: 12,
            transform: x(hover) > W * 0.7 ? 'translateX(-108%)' : 'translateX(8px)',
          }}
        >
          <div className="text-[10px] text-ink-muted whitespace-nowrap">
            {new Date(h.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="font-mono text-[11px] font-semibold text-ink whitespace-nowrap">
            {valueFormat(h.value)}{unit}
            {hAvg !== null && <span className="text-ink-muted font-medium"> · avg {valueFormat(hAvg)}{unit}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
