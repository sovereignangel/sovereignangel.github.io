'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import { CHART, roleColor } from '@/lib/complexecon/models/palette'
import type { ChartSpec, Point } from '@/lib/complexecon/models'

const TICK = { fontSize: 11, fill: CHART.tick, fontFamily: 'ui-monospace, Menlo, monospace' }
const PLOT_HEIGHT = 230

/**
 * The chart is sized from its own box, measured with a ResizeObserver, rather
 * than through Recharts' ResponsiveContainer — which stayed empty when a row
 * was opened after the page had loaded.
 */
function useWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setW(Math.floor(el.getBoundingClientRect().width))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

function fmtTick(v: number): string {
  if (!Number.isFinite(v)) return ''
  const a = Math.abs(v)
  if (a >= 10000) return `${(v / 1000).toFixed(0)}k`
  if (Number.isInteger(v)) return String(v)
  if (a >= 1000) return `${(v / 1000).toFixed(1)}k`
  if (a >= 100) return v.toFixed(0)
  if (a >= 10) return v.toFixed(1)
  if (a >= 1) return v.toFixed(2)
  if (a === 0) return '0'
  return v.toFixed(3)
}

/** One tooltip, every series, values first. */
function Tip({ active, payload, label, spec }: TooltipProps<number, string> & { spec: ChartSpec }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="border border-rule bg-white px-2 py-1 shadow-sm">
      <div className="font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted">
        {spec.xLabel} {typeof label === 'number' ? fmtTick(label) : String(label)}
      </div>
      {payload.map(item => (
        <div key={String(item.dataKey)} className="flex items-center gap-2">
          <span className="inline-block h-[2px] w-[12px]" style={{ background: item.color }} />
          <span className="font-mono text-[13px] font-semibold text-ink">
            {typeof item.value === 'number' ? fmtTick(item.value) : String(item.value)}
          </span>
          <span className="text-[12px] text-ink-muted">{item.name}</span>
        </div>
      ))}
    </div>
  )
}

/** A bar with a 3px rounded data-end and a square baseline, whichever side of zero it sits. */
function SignedBar(props: { x?: number; y?: number; width?: number; height?: number; value?: number; fill?: string }) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0, fill } = props
  const top = Math.min(y, y + height)
  const h = Math.abs(height)
  const r = Math.min(3, width / 2, h)
  if (h <= 0 || width <= 0) return null
  const bottom = top + h
  const d =
    value >= 0
      ? `M${x},${bottom} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + width - r},${top} Q${x + width},${top} ${x + width},${top + r} L${x + width},${bottom} Z`
      : `M${x},${top} L${x + width},${top} L${x + width},${bottom - r} Q${x + width},${bottom} ${x + width - r},${bottom} L${x + r},${bottom} Q${x},${bottom} ${x},${bottom - r} Z`
  return <path d={d} fill={fill} />
}

function Legend({ spec }: { spec: ChartSpec }) {
  if (spec.series.length < 2) return null
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 px-1 pb-1">
      {spec.series.map(s => (
        <span key={s.key} className="flex items-center gap-1.5 text-[12px] text-ink-light">
          <span className="inline-block h-[2px] w-[14px]" style={{ background: roleColor(s.role) }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

/** The table-view twin — every value on the chart, reachable without hovering. */
function TableView({ spec, data }: { spec: ChartSpec; data: Point[] }) {
  const cols = [spec.xKey, ...spec.series.map(s => s.key)]
  const names = [spec.xLabel, ...spec.series.map(s => s.label)]
  const rows = data.length > 80 ? data.filter((_, i) => i % Math.ceil(data.length / 80) === 0) : data
  return (
    <details className="mt-0.5">
      <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted hover:text-ink">
        Table · {data.length} rows{rows.length < data.length ? ` (every ${Math.ceil(data.length / 80)}th shown)` : ''}
      </summary>
      <div className="mt-1 max-h-[220px] overflow-auto border border-rule-light">
        <table className="w-full border-collapse font-mono text-[12px]">
          <thead className="sticky top-0 bg-cream">
            <tr>
              {names.map(n => (
                <th key={n} className="border-b border-rule px-2 py-0.5 text-right font-normal uppercase tracking-[0.5px] text-ink-muted">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-rule-light last:border-b-0">
                {cols.map(c => (
                  <td key={c} className="px-2 py-0.5 text-right tabular-nums text-ink">
                    {fmtTick(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

/**
 * A dot field for the bifurcation diagram — thousands of points, drawn as
 * plain SVG. Hovering reads the x value under the pointer.
 */
function DotField({ spec, data, markX }: { spec: ChartSpec; data: Point[]; markX?: number }) {
  const W = 640
  const H = 240
  const M = { l: 46, r: 12, t: 10, b: 28 }
  const yKey = spec.series[0].key
  const { xMin, xMax, yMax } = useMemo(() => {
    let xMin = Infinity
    let xMax = -Infinity
    let yMax = 0.05
    for (const d of data) {
      const x = d[spec.xKey]
      const y = Math.abs(d[yKey])
      if (x < xMin) xMin = x
      if (x > xMax) xMax = x
      if (y > yMax) yMax = y
    }
    if (!Number.isFinite(xMin)) {
      xMin = 0
      xMax = 1
    }
    return { xMin, xMax, yMax: yMax * 1.1 }
  }, [data, spec.xKey, yKey])
  const sx = (x: number) => M.l + ((x - xMin) / (xMax - xMin || 1)) * (W - M.l - M.r)
  const sy = (y: number) => M.t + (1 - (y + yMax) / (2 * yMax)) * (H - M.t - M.b)
  const [hoverX, setHoverX] = useState<number | null>(null)
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map(f => xMin + f * (xMax - xMin))
  const yTicks = [-yMax, 0, yMax].map(v => +(v * 0.9).toFixed(3))
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={spec.title}
        onMouseMove={e => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - rect.left) / rect.width) * W
          const x = xMin + ((px - M.l) / (W - M.l - M.r)) * (xMax - xMin)
          setHoverX(x >= xMin && x <= xMax ? x : null)
        }}
        onMouseLeave={() => setHoverX(null)}
      >
        {yTicks.map(v => (
          <g key={v}>
            <line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} stroke={CHART.grid} strokeWidth="1" />
            <text x={M.l - 6} y={sy(v) + 4} fontSize="11" fill={CHART.tick} fontFamily="ui-monospace, Menlo, monospace" textAnchor="end">
              {fmtTick(v)}
            </text>
          </g>
        ))}
        {xTicks.map(v => (
          <text key={v} x={sx(v)} y={H - 8} fontSize="11" fill={CHART.tick} fontFamily="ui-monospace, Menlo, monospace" textAnchor="middle">
            {fmtTick(v)}
          </text>
        ))}
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke={CHART.axis} strokeWidth="1" />
        <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} stroke={CHART.axis} strokeWidth="1" />
        {spec.refY?.map(v => (
          <line key={v} x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} stroke={CHART.reference} strokeWidth="1" />
        ))}
        {data.map((d, i) => (
          <circle key={i} cx={sx(d[spec.xKey])} cy={sy(Math.max(-yMax, Math.min(yMax, d[yKey])))} r="1.4" fill={CHART.accent} fillOpacity="0.55" />
        ))}
        {markX !== undefined && markX >= xMin && markX <= xMax && (
          <line x1={sx(markX)} x2={sx(markX)} y1={M.t} y2={H - M.b} stroke={CHART.reference} strokeWidth="1.5" />
        )}
        {hoverX !== null && (
          <line x1={sx(hoverX)} x2={sx(hoverX)} y1={M.t} y2={H - M.b} stroke={CHART.tick} strokeWidth="1" strokeOpacity="0.6" />
        )}
      </svg>
      <div className="pointer-events-none absolute right-2 top-1 font-mono text-[11px] text-ink-muted">
        {hoverX !== null ? `${spec.xLabel} ≈ ${fmtTick(hoverX)}` : markX !== undefined ? `current ${spec.xLabel} = ${fmtTick(markX)}` : ''}
      </div>
    </div>
  )
}

export default function ModelChart({ spec, data, markX }: { spec: ChartSpec; data: Point[]; markX?: number }) {
  const yDomain = spec.yDomain ?? (['auto', 'auto'] as const)
  const [box, width] = useWidth()
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-serif text-[15px] font-semibold text-ink">{spec.title}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted">{spec.yLabel}</span>
      </div>
      <p className="mb-1 text-[13px] leading-snug text-ink-muted">{spec.read}</p>
      <Legend spec={spec} />
      {spec.kind === 'dots' ? (
        <DotField spec={spec} data={data} markX={markX} />
      ) : (
        <div ref={box} className="w-full min-w-0" style={{ height: PLOT_HEIGHT }}>
          {width > 0 && spec.kind === 'bars' && (
            <BarChart width={width} height={PLOT_HEIGHT} data={data} margin={{ top: 6, right: 8, bottom: 4, left: 0 }} barCategoryGap="20%">
              <CartesianGrid stroke={CHART.grid} strokeWidth={1} vertical={false} />
              <XAxis dataKey={spec.xKey} type="category" tick={TICK} tickLine={false} axisLine={{ stroke: CHART.axis }} interval="preserveStartEnd" tickFormatter={v => fmtTick(Number(v))} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} width={46} tickFormatter={fmtTick} domain={yDomain as [number, number]} />
              <Tooltip content={<Tip spec={spec} />} cursor={{ fill: CHART.grid, fillOpacity: 0.6 }} />
              {spec.refY?.map(v => <ReferenceLine key={v} y={v} stroke={CHART.reference} strokeWidth={1} />)}
              {spec.series.map(s => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={roleColor(s.role)} maxBarSize={24} isAnimationActive={false} shape={<SignedBar />}>
                  {spec.signed && data.map((d, i) => <Cell key={i} fill={d[s.key] >= 0 ? CHART.positive : CHART.negative} />)}
                </Bar>
              ))}
            </BarChart>
          )}
          {width > 0 && spec.kind === 'line' && (
            <LineChart width={width} height={PLOT_HEIGHT} data={data} margin={{ top: 6, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={CHART.grid} strokeWidth={1} vertical={false} />
              <XAxis dataKey={spec.xKey} type="number" domain={['dataMin', 'dataMax']} ticks={spec.xTicks} tick={TICK} tickLine={false} axisLine={{ stroke: CHART.axis }} tickCount={6} tickFormatter={fmtTick} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} width={46} tickFormatter={fmtTick} domain={yDomain as [number, number]} />
              <Tooltip content={<Tip spec={spec} />} cursor={{ stroke: CHART.tick, strokeWidth: 1 }} />
              {spec.band && <ReferenceArea y1={spec.band[0]} y2={spec.band[1]} fill={CHART.band} fillOpacity={0.08} stroke="none" />}
              {spec.refY?.map(v => <ReferenceLine key={`y${v}`} y={v} stroke={CHART.reference} strokeWidth={1} />)}
              {spec.refX?.map(v => <ReferenceLine key={`x${v}`} x={v} stroke={CHART.reference} strokeWidth={1} />)}
              {spec.series.map(s => (
                <Line key={s.key} type="linear" dataKey={s.key} name={s.label} stroke={roleColor(s.role)} strokeWidth={s.role === 'context' ? 1.5 : 2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }} isAnimationActive={false} />
              ))}
            </LineChart>
          )}
        </div>
      )}
      <TableView spec={spec} data={data} />
    </div>
  )
}
