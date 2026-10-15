'use client'

/**
 * The year so far — every rated live game Chess.com has for the year, one
 * point per day per speed, with the plan's three lines laid over the stretch
 * since the plan began. This is the "how am I tracking" view: the projection
 * chart answers where the plan goes; this one answers where you actually are.
 *
 * Speeds are categorical (blue rapid, aqua blitz, violet bullet — validated
 * for colour-blind separation); the plan keeps its walnut ramp, so the two
 * never share a hue. Aqua sits under 3:1 on the card, so every line carries a
 * direct label and the ledger below is the table view.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { LANE_INK } from '@/lib/exec/lanes'
import { SCENARIOS, SCENARIO_COLOR, TOURNAMENT_DATE, ratingAfter, monthsSince } from '@/lib/chess/model'
import type { TimeClass, YearSeries } from '@/lib/chess/chesscom'
import type { Anchor } from './ProjectionChart'

export const SPEED_COLOR: Record<TimeClass, string> = {
  rapid: '#2a78d6',
  blitz: '#1baf7a',
  bullet: '#4a3aa7',
}
const SPEED_LABEL: Record<TimeClass, string> = { rapid: 'Rapid', blitz: 'Blitz', bullet: 'Bullet' }
const SPEEDS: TimeClass[] = ['rapid', 'blitz', 'bullet']

const H = 250
const PAD = { top: 14, right: 74, bottom: 26, left: 40 }
const DAY = 86_400_000

const dayOf = (iso: string) => Date.parse(iso + 'T12:00:00Z')
const isoOfMs = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function YearChart({
  year,
  series,
  anchor,
  today,
}: {
  year: number
  series: YearSeries
  anchor: Anchor
  today: string
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(300, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const t0 = dayOf(`${year}-01-01`)
  const t1 = dayOf(`${year}-12-31`)
  const anchorT = dayOf(anchor.date)

  // The plan, from where it starts to the end of the year.
  const plan = useMemo(() => {
    if (anchorT > t1) return []
    return SCENARIOS.map((hours) => {
      const pts: { t: number; r: number }[] = []
      for (let t = anchorT; t <= t1; t += 7 * DAY) {
        pts.push({ t, r: ratingAfter(anchor.rating, monthsSince(anchor.date, isoOfMs(t)), hours) })
      }
      pts.push({ t: t1, r: ratingAfter(anchor.rating, monthsSince(anchor.date, `${year}-12-31`), hours) })
      return { hours, pts }
    })
  }, [anchorT, t1, anchor.rating, anchor.date, year])

  const all = SPEEDS.flatMap((k) => series[k].map((p) => p.rating))
  const planAll = plan.flatMap((p) => p.pts.map((q) => q.r))
  const yMin = Math.max(0, Math.floor((Math.min(...all, ...planAll, anchor.rating) - 50) / 100) * 100)
  const yMax = Math.ceil((Math.max(...all, ...planAll, anchor.rating) + 50) / 100) * 100

  const innerW = width - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * innerW
  const y = (r: number) => PAD.top + (1 - (r - yMin) / (yMax - yMin)) * innerH

  const yTicks: number[] = []
  const step = yMax - yMin > 600 ? 200 : 100
  for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) yTicks.push(v)
  const months = Array.from({ length: 12 }, (_, i) => ({
    t: dayOf(`${year}-${String(i + 1).padStart(2, '0')}-01`),
    label: new Date(Date.UTC(year, i, 15)).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }),
    show: width >= 560 || i % 2 === 0,
  }))

  const line = (pts: { t: number; r: number }[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.r).toFixed(1)}`).join('')

  // Direct labels at each speed's last point, nudged apart when they collide.
  const ends = SPEEDS.filter((k) => series[k].length)
    .map((k) => {
      const last = series[k][series[k].length - 1]
      return { k, rating: last.rating, yy: y(last.rating) }
    })
    .sort((a, b) => a.yy - b.yy)
  for (let i = 1; i < ends.length; i++) if (ends[i].yy - ends[i - 1].yy < 13) ends[i].yy = ends[i - 1].yy + 13

  const todayT = dayOf(today)
  const tourT = dayOf(TOURNAMENT_DATE)
  const games = SPEEDS.reduce((s, k) => s + series[k].reduce((a, p) => a + p.games, 0), 0)

  // Hover: the last known rating per speed at the hovered day, and the plan there.
  const hoverInfo = hover !== null
    ? {
        date: isoOfMs(hover),
        speeds: SPEEDS.map((k) => {
          const known = series[k].filter((p) => dayOf(p.date) <= hover)
          const last = known[known.length - 1]
          const exact = series[k].find((p) => p.date === isoOfMs(hover))
          return { k, rating: last?.rating ?? null, games: exact?.games ?? 0 }
        }).filter((s) => s.rating !== null),
        plan: hover >= anchorT
          ? SCENARIOS.map((h) => ({ h, r: Math.round(ratingAfter(anchor.rating, monthsSince(anchor.date, isoOfMs(hover)), h)) }))
          : [],
      }
    : null

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const f = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width))
    // Snap to a whole day; t0 is already at noon UTC, so every step stays on noon.
    setHover(t0 + Math.round((f * (t1 - t0)) / DAY) * DAY)
  }

  return (
    <div>
      <div className="flex items-baseline gap-3 flex-wrap mb-1.5 text-[10px]" style={{ color: LANE_INK.muted }}>
        <span>
          <span className="font-mono font-semibold" style={{ color: LANE_INK.ink }}>{games}</span> rated games in {year}
        </span>
        {SPEEDS.map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className="inline-block w-3 h-[2px]" style={{ backgroundColor: SPEED_COLOR[k] }} />
            {SPEED_LABEL[k]}
            {series[k].length === 0 && <span style={{ color: LANE_INK.faint }}> — none</span>}
          </span>
        ))}
        {plan.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-[2px]" style={{ backgroundColor: SCENARIO_COLOR[7.5] }} />
            Plan, 5–10h/wk
          </span>
        )}
      </div>

      <div ref={wrap} className="relative w-full">
        <svg width={width} height={H} role="img" aria-label={`Chess.com ratings through ${year} by speed, with the plan`}>
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={LANE_INK.ruleLight} strokeWidth={1} />
              <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill={LANE_INK.muted} fontFamily="ui-monospace, monospace">
                {v}
              </text>
            </g>
          ))}
          {months.filter((m) => m.show).map((m) => (
            <text key={m.t} x={x(m.t)} y={H - 8} textAnchor="start" fontSize={11} fill={LANE_INK.muted}>
              {m.label}
            </text>
          ))}

          {todayT >= t0 && todayT <= t1 && (
            <g>
              <line x1={x(todayT)} x2={x(todayT)} y1={PAD.top} y2={H - PAD.bottom} stroke={LANE_INK.muted} strokeWidth={1} strokeDasharray="2 3" />
              <text x={x(todayT) - 4} y={PAD.top + 10} textAnchor="end" fontSize={11} fill={LANE_INK.muted}>today</text>
            </g>
          )}
          {tourT >= t0 && tourT <= t1 && (
            <line x1={x(tourT)} x2={x(tourT)} y1={PAD.top} y2={H - PAD.bottom} stroke={LANE_INK.faint} strokeWidth={1} strokeDasharray="2 3" />
          )}

          {plan.map((p) => (
            <path key={p.hours} d={line(p.pts)} fill="none" stroke={SCENARIO_COLOR[p.hours]} strokeWidth={2} strokeLinejoin="round" />
          ))}

          {SPEEDS.map((k) => {
            const pts = series[k].map((p) => ({ t: dayOf(p.date), r: p.rating }))
            if (!pts.length) return null
            return (
              <g key={k}>
                {pts.length > 1 && <path d={line(pts)} fill="none" stroke={SPEED_COLOR[k]} strokeWidth={2} strokeLinejoin="round" />}
                {pts.map((p) => (
                  <circle key={p.t} cx={x(p.t)} cy={y(p.r)} r={4} fill={SPEED_COLOR[k]} stroke={LANE_INK.card} strokeWidth={2} />
                ))}
              </g>
            )
          })}

          {ends.map((e) => (
            <text key={e.k} x={width - PAD.right + 6} y={e.yy + 4} fontSize={11} fill={LANE_INK.ink}>
              {SPEED_LABEL[e.k]} {e.rating}
            </text>
          ))}

          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke={LANE_INK.muted} strokeWidth={1} />
          )}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hoverInfo && (hoverInfo.speeds.length > 0 || hoverInfo.plan.length > 0) && (
          <div
            className="absolute pointer-events-none border rounded-md px-2 py-1.5 text-[10px] shadow-sm"
            style={{
              left: Math.min(x(hover!) + 10, width - 175),
              top: PAD.top + 4,
              width: 165,
              backgroundColor: LANE_INK.card,
              borderColor: LANE_INK.rule,
              color: LANE_INK.ink,
            }}
          >
            <div className="font-semibold mb-0.5">
              {new Date(hoverInfo.date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
            </div>
            {hoverInfo.speeds.map((s) => (
              <div key={s.k} className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: SPEED_COLOR[s.k] }} />
                <span style={{ color: LANE_INK.muted }}>
                  {SPEED_LABEL[s.k]}{s.games ? ` · ${s.games} game${s.games > 1 ? 's' : ''}` : ''}
                </span>
                <span className="ml-auto font-mono">{s.rating}</span>
              </div>
            ))}
            {hoverInfo.plan.map((p) => (
              <div key={p.h} className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-[2px]" style={{ backgroundColor: SCENARIO_COLOR[p.h] }} />
                <span style={{ color: LANE_INK.muted }}>Plan {p.h}h/wk</span>
                <span className="ml-auto font-mono">{p.r}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
