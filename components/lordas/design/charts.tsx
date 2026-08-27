'use client'

/**
 * Console data graphics.
 *
 * Fixed viewBox with non-scaling strokes, so a chart inside a hidden tab
 * renders correctly the moment it is shown — nothing here measures layout.
 * Gaps in a series are drawn as dotted hops rather than interpolated: a flat
 * line through a night the watch missed is a lie.
 */

import { C } from './tokens'

const W = 200

type Series = (number | null | undefined)[]

function clean(vals: Series): number[] {
  return vals.filter((v): v is number => typeof v === 'number' && isFinite(v))
}

function scale(vals: Series, pad = 0.14) {
  const nums = clean(vals)
  if (!nums.length) return null
  let lo = Math.min(...nums)
  let hi = Math.max(...nums)
  if (hi === lo) hi = lo + 1
  const p = (hi - lo) * pad
  return { lo: lo - p, hi: hi + p }
}

function points(vals: Series, h: number, sc: { lo: number; hi: number }) {
  const step = W / Math.max(1, vals.length - 1)
  const segs: [number, number][][] = []
  let cur: [number, number][] = []
  vals.forEach((v, i) => {
    if (typeof v !== 'number' || !isFinite(v)) {
      if (cur.length) segs.push(cur)
      cur = []
      return
    }
    cur.push([i * step, h - ((v - sc.lo) / (sc.hi - sc.lo)) * h])
  })
  if (cur.length) segs.push(cur)
  return segs
}

const d = (pts: [number, number][]) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

export function Spark({
  values,
  color = C.accent,
  height = 26,
  area = true,
  baseline,
  label,
}: {
  values: Series
  color?: string
  height?: number
  area?: boolean
  /** A second, dashed series — a rolling average the main line is judged against */
  baseline?: Series
  label?: string
}) {
  const sc = scale(baseline ? [...values, ...baseline] : values)
  if (!sc) return <div style={{ height, fontSize: 10, color: C.faint }}>no data</div>
  const segs = points(values, height, sc)
  const last = [...values].reduce<number | null>((acc, v, i) => (typeof v === 'number' ? i : acc), null)

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, overflow: 'visible' }}
      role="img"
      aria-label={label ?? 'trend'}
    >
      {area &&
        segs.map((seg, i) =>
          seg.length < 2 ? null : (
            <path
              key={`a${i}`}
              d={`${d(seg)} L${seg[seg.length - 1][0].toFixed(1)} ${height} L${seg[0][0].toFixed(1)} ${height} Z`}
              fill={color}
              opacity={0.15}
            />
          )
        )}
      {baseline &&
        points(baseline, height, sc).map((seg, i) => (
          <path key={`b${i}`} d={d(seg)} fill="none" stroke={C.faint} strokeWidth={1}
            strokeDasharray="3 2" vectorEffect="non-scaling-stroke" opacity={0.7} />
        ))}
      {/* Dotted hops mark days with no reading — never interpolate across them */}
      {segs.slice(1).map((seg, i) => {
        const prev = segs[i][segs[i].length - 1]
        return (
          <line key={`g${i}`} x1={prev[0].toFixed(1)} y1={prev[1].toFixed(1)}
            x2={seg[0][0].toFixed(1)} y2={seg[0][1].toFixed(1)} stroke={color}
            strokeWidth={1.1} strokeDasharray="1.5 2.5" opacity={0.35}
            vectorEffect="non-scaling-stroke" />
        )
      })}
      {segs.map((seg, i) => (
        <path key={`l${i}`} d={d(seg)} fill="none" stroke={color} strokeWidth={1.6}
          strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      ))}
      {last !== null && (
        <circle
          cx={(last * (W / Math.max(1, values.length - 1))).toFixed(1)}
          cy={(height - ((values[last] as number - sc.lo) / (sc.hi - sc.lo)) * height).toFixed(1)}
          r={2.2}
          fill={color}
        />
      )}
    </svg>
  )
}

/** Grouped columns — Lori first, Aidas second, always that order. */
export function PairColumns({
  a,
  b,
  colorA = C.sun,
  colorB = C.lens,
  height = 30,
  label,
}: {
  a: Series
  b: Series
  colorA?: string
  colorB?: string
  height?: number
  label?: string
}) {
  const all = [...clean(a), ...clean(b)]
  const max = all.length ? Math.max(...all) : 1
  const step = W / Math.max(1, a.length)
  const bw = step * 0.36

  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none"
      style={{ width: '100%', height }} role="img" aria-label={label ?? 'daily totals'}>
      {a.map((v, i) => {
        const x = i * step + step * 0.1
        return [
          [v, colorA, x] as const,
          [b[i], colorB, x + bw + 1.2] as const,
        ].map(([val, color, px], j) => {
          if (typeof val !== 'number' || val <= 0) return null
          const bh = Math.max(1, (val / max) * (height - 1))
          return (
            <rect key={`${i}-${j}`} x={px.toFixed(1)} y={(height - bh).toFixed(1)}
              width={bw.toFixed(1)} height={bh.toFixed(1)} fill={color} rx={0.6} />
          )
        })
      })}
    </svg>
  )
}

/** A bounded value as a track. Cheaper to read than a number alone. */
export function Track({ value, max = 100, color = C.accent, height = 3 }: {
  value: number; max?: number; color?: string; height?: number
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div style={{ height, background: C.rule, borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  )
}

/** Readiness at arm's length. Used where a card has one number that matters. */
export function Gauge({ value, color = C.ok, size = 62, max = 100 }: {
  value: number | null; color?: string; size?: number; max?: number
}) {
  const r = size * 0.4
  const cx = size / 2
  const start = -220
  const sweep = 260
  const pt = (deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180
    return [cx + r * Math.cos(a), cx + r * Math.sin(a)]
  }
  const arc = (from: number, to: number) => {
    const [x1, y1] = pt(from)
    const [x2, y2] = pt(to)
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
  }
  const v = value ?? 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
      aria-label={value === null ? 'no reading' : `${value} of ${max}`}>
      <path d={arc(start, start + sweep)} fill="none" stroke={C.rule} strokeWidth={5} strokeLinecap="round" />
      {value !== null && (
        <path d={arc(start, start + sweep * (v / max))} fill="none" stroke={color}
          strokeWidth={5} strokeLinecap="round" />
      )}
      <text x={cx} y={cx + size * 0.09} textAnchor="middle" fill={value === null ? C.faint : C.ink}
        style={{ fontFamily: 'var(--lordas-mono)', fontSize: size * 0.28, fontWeight: 500 }}>
        {value ?? '--'}
      </text>
    </svg>
  )
}
