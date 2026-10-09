'use client'

/**
 * Rating projection — the three weekly-hours lines from lib/chess/model.ts,
 * with every logged rating plotted over them. The lines are the plan; the
 * dots are the truth. When the dots run under the 5h line, the plan is wrong
 * or the week is, and both are worth knowing.
 *
 * The three lines are one walnut hue stepped light to dark by hours, because
 * hours are ordered — validated as an ordinal ramp.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { LANE_INK } from '@/lib/exec/lanes'
import {
  SCENARIOS,
  SCENARIO_COLOR,
  START_DATE,
  TARGET_RATING,
  TOURNAMENT_DATE,
  addMonthsISO,
  monthsBetween,
  monthsSince,
  ratingAfter,
  type ScenarioHours,
} from '@/lib/chess/model'
import type { ChessLogEntry } from '@/lib/types'

const POOL_LABEL: Record<string, string> = {
  uscf: 'USCF',
  chesscom_rapid: 'Chess.com rapid',
  lichess_rapid: 'Lichess rapid',
}

type Range = 'sprint' | 'year' | 'full'

const RANGES: { id: Range; label: string }[] = [
  { id: 'sprint', label: 'To Oct 24' },
  { id: 'year', label: 'First year' },
  { id: 'full', label: `To ${TARGET_RATING}` },
]

const H = 250
const PAD = { top: 14, right: 64, bottom: 26, left: 40 }

function fmtMonth(iso: string, withDay = false): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', {
    ...(withDay ? { day: 'numeric' } : {}),
    month: 'short',
    timeZone: 'UTC',
  }) + (withDay ? '' : ` '${iso.slice(2, 4)}`)
}

export interface Anchor {
  rating: number
  date: string
}

/**
 * `synced` is the Chess.com rapid rating at the end of each day it was played —
 * filled dots. `log` is anything entered by hand — hollow rings. The lines start
 * at `anchor`: the self-estimate until the baseline games exist, then the real number.
 */
export function ProjectionChart({
  log,
  synced = [],
  anchor,
}: {
  log: ChessLogEntry[]
  synced?: { date: string; rating: number; games: number }[]
  anchor: Anchor
}) {
  const anchorM = monthsSince(START_DATE, anchor.date)
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)
  const [range, setRange] = useState<Range>('full')
  const [hoverM, setHoverM] = useState<number | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(300, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const spanMonths = useMemo(() => {
    if (range === 'sprint') return monthsSince(START_DATE, TOURNAMENT_DATE) + 0.15
    if (range === 'year') return 12
    return Math.ceil(anchorM + monthsBetween(anchor.rating, TARGET_RATING, 5)) + 3
  }, [range, anchorM, anchor.rating])

  const series = useMemo(() => {
    const steps = 120
    return SCENARIOS.map((hours) => ({
      hours,
      // Each line stops where it reaches the bar — past the bar it has nothing left to say.
      pts: Array.from({ length: steps + 1 }, (_, i) => {
        const m = anchorM + ((spanMonths - anchorM) * i) / steps
        return { m, r: ratingAfter(anchor.rating, m - anchorM, hours) }
      })
        .filter((p, i, all) => i === 0 || all[i - 1].r < TARGET_RATING)
        .map((p) => ({ m: p.m, r: Math.min(p.r, TARGET_RATING) })),
    }))
  }, [spanMonths, anchorM, anchor.rating])

  const actual = useMemo(
    () =>
      [
        ...synced.map((s) => ({ m: monthsSince(START_DATE, s.date), r: s.rating, kind: 'sync' as const, label: `Chess.com rapid · ${s.games} game${s.games > 1 ? 's' : ''}`, key: 's' + s.date })),
        ...log
          .filter((e) => typeof e.rating === 'number')
          .map((e) => ({ m: monthsSince(START_DATE, e.date), r: e.rating as number, kind: 'log' as const, label: POOL_LABEL[e.pool || ''] || 'Logged', key: 'l' + e.date })),
      ].filter((p) => p.m >= -0.25 && p.m <= spanMonths),
    [log, synced, spanMonths]
  )

  const yMax = useMemo(() => {
    const top = Math.max(...series.flatMap((s) => s.pts.map((p) => p.r)), ...actual.map((a) => a.r))
    if (range === 'full') return TARGET_RATING + 100
    return Math.ceil((top + 40) / 50) * 50
  }, [series, actual, range])
  const low = Math.min(anchor.rating, ...actual.map((a) => a.r))
  const yMin = range === 'full' ? Math.min(800, Math.floor((low - 50) / 100) * 100) : Math.max(0, Math.floor((low - 40) / 50) * 50)

  const innerW = width - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (m: number) => PAD.left + (Math.max(0, m) / spanMonths) * innerW
  const y = (r: number) => PAD.top + (1 - (r - yMin) / (yMax - yMin)) * innerH

  const yTicks = useMemo(() => {
    const step = yMax - yMin > 600 ? 200 : yMax - yMin > 200 ? 100 : 25
    const out: number[] = []
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) out.push(v)
    return out
  }, [yMin, yMax])

  const xTicks = useMemo(() => {
    const out: { m: number; label: string }[] = []
    if (range === 'sprint') {
      for (let d = 0; d <= 15; d += 5) {
        const m = (d / 30.44)
        out.push({ m, label: fmtMonth(addMonthsISO(START_DATE, m), true) })
      }
      return out
    }
    if (range === 'year') {
      for (let m = 0; m <= spanMonths; m += 2) out.push({ m, label: fmtMonth(addMonthsISO(START_DATE, m)) })
      return out
    }
    // Year ticks on Jan 1 — "Oct 26" reads as a date, not as 2026.
    for (let yr = Number(START_DATE.slice(0, 4)) + 1; ; yr++) {
      const m = monthsSince(START_DATE, `${yr}-01-01`)
      if (m > spanMonths) break
      out.push({ m, label: String(yr) })
    }
    return out
  }, [range, spanMonths])

  const path = (pts: { m: number; r: number }[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.m).toFixed(1)},${y(Math.min(p.r, yMax)).toFixed(1)}`).join('')

  const tournamentM = monthsSince(START_DATE, TOURNAMENT_DATE)

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - box.left
    setHoverM(Math.max(0, Math.min(spanMonths, (px / box.width) * spanMonths)))
  }

  const hover = hoverM !== null
    ? {
        date: addMonthsISO(START_DATE, hoverM),
        values: hoverM >= anchorM ? SCENARIOS.map((h) => ({ h, r: Math.round(ratingAfter(anchor.rating, hoverM - anchorM, h)) })) : [],
        logged: actual.reduce<(typeof actual)[number] | null>(
          (best, a) => (Math.abs(a.m - hoverM) < spanMonths * 0.03 && (!best || Math.abs(a.m - hoverM) < Math.abs(best.m - hoverM)) ? a : best),
          null
        ),
      }
    : null

  return (
    <div>
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border transition-colors"
            style={
              range === r.id
                ? { backgroundColor: LANE_INK.ink, color: LANE_INK.card, borderColor: LANE_INK.ink }
                : { color: LANE_INK.muted, borderColor: LANE_INK.rule }
            }
          >
            {r.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-3 flex-wrap">
          {SCENARIOS.map((h) => (
            <span key={h} className="flex items-center gap-1 text-[10px]" style={{ color: LANE_INK.muted }}>
              <span className="inline-block w-3 h-[2px]" style={{ backgroundColor: SCENARIO_COLOR[h] }} />
              {h}h/wk
            </span>
          ))}
          <span className="flex items-center gap-1 text-[10px]" style={{ color: LANE_INK.muted }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: LANE_INK.ink }} />
            Chess.com rapid
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: LANE_INK.muted }}>
            <span className="inline-block w-2 h-2 rounded-full border" style={{ borderColor: LANE_INK.ink }} />
            By hand
          </span>
        </span>
      </div>

      <div ref={wrap} className="relative w-full">
        <svg width={width} height={H} role="img" aria-label="Projected rating by weekly training hours, with logged ratings">
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={LANE_INK.ruleLight} strokeWidth={1} />
              <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill={LANE_INK.muted} fontFamily="ui-monospace, monospace">
                {v}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t.m} x={x(t.m)} y={H - 8} textAnchor="middle" fontSize={11} fill={LANE_INK.muted}>
              {t.label}
            </text>
          ))}

          {TARGET_RATING <= yMax && (
            <g>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(TARGET_RATING)} y2={y(TARGET_RATING)} stroke={LANE_INK.ink} strokeWidth={1} strokeDasharray="4 4" />
              <text x={PAD.left + 8} y={y(TARGET_RATING) + 15} fontSize={11} fill={LANE_INK.ink}>
                {TARGET_RATING} rapid · A Team bar
              </text>
            </g>
          )}
          {tournamentM <= spanMonths && range !== 'full' && (
            <g>
              <line x1={x(tournamentM)} x2={x(tournamentM)} y1={PAD.top} y2={H - PAD.bottom} stroke={LANE_INK.faint} strokeWidth={1} strokeDasharray="2 3" />
              <text x={x(tournamentM) + (range === 'sprint' ? -4 : 4)} y={PAD.top + 10} textAnchor={range === 'sprint' ? 'end' : 'start'} fontSize={11} fill={LANE_INK.muted}>
                Oct 24
              </text>
            </g>
          )}

          {series.map((s) => (
            <path key={s.hours} d={path(s.pts)} fill="none" stroke={SCENARIO_COLOR[s.hours]} strokeWidth={2} strokeLinejoin="round" />
          ))}
          {/* Direct labels at the right edge — identity is never colour alone. */}
          {(() => {
            const ends = series.map((s) => {
              const last = s.pts[s.pts.length - 1]
              return { h: s.hours, xx: x(last.m), yy: y(Math.min(last.r, yMax)), reached: last.r >= TARGET_RATING }
            })
            // Lines that reached the bar are labelled above their end point;
            // lines still climbing at the right edge are labelled beside it.
            const edge = ends.filter((e) => !e.reached).sort((a, b) => a.yy - b.yy)
            for (let i = 1; i < edge.length; i++) if (edge[i].yy - edge[i - 1].yy < 13) edge[i].yy = edge[i - 1].yy + 13
            return ends.map((e) => (
              <text
                key={e.h}
                x={e.reached ? e.xx : width - PAD.right + 6}
                y={e.reached ? e.yy - 7 : e.yy + 4}
                textAnchor={e.reached ? 'middle' : 'start'}
                fontSize={11}
                fill={LANE_INK.ink}
              >
                {e.h}h
              </text>
            ))
          })()}

          {actual.map((a) => (
            a.kind === 'sync' ? (
              <circle key={a.key} cx={x(a.m)} cy={y(a.r)} r={4.5} fill={LANE_INK.ink} stroke={LANE_INK.card} strokeWidth={2} />
            ) : (
              <circle key={a.key} cx={x(a.m)} cy={y(a.r)} r={4} fill={LANE_INK.card} stroke={LANE_INK.ink} strokeWidth={1.75} />
            )
          ))}

          {hover && (
            <line x1={x(hoverM!)} x2={x(hoverM!)} y1={PAD.top} y2={H - PAD.bottom} stroke={LANE_INK.muted} strokeWidth={1} />
          )}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHoverM(null)}
          />
        </svg>

        {hover && (
          <div
            className="absolute pointer-events-none border rounded-md px-2 py-1.5 text-[10px] shadow-sm"
            style={{
              left: Math.min(x(hoverM!) + 10, width - 170),
              top: PAD.top + 4,
              width: 160,
              backgroundColor: LANE_INK.card,
              borderColor: LANE_INK.rule,
              color: LANE_INK.ink,
            }}
          >
            <div className="font-semibold mb-0.5">{fmtMonth(hover.date, true)} {hover.date.slice(0, 4)}</div>
            {hover.values.map((v) => (
              <div key={v.h} className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-[2px]" style={{ backgroundColor: SCENARIO_COLOR[v.h as ScenarioHours] }} />
                <span style={{ color: LANE_INK.muted }}>{v.h}h/wk</span>
                <span className="ml-auto font-mono">{v.r}</span>
              </div>
            ))}
            {hover.logged && (
              <div className="flex items-center gap-1.5 mt-0.5 pt-0.5 border-t" style={{ borderColor: LANE_INK.ruleLight }}>
                <span
                  className="inline-block w-2 h-2 rounded-full border"
                  style={{ backgroundColor: hover.logged.kind === 'sync' ? LANE_INK.ink : 'transparent', borderColor: LANE_INK.ink }}
                />
                <span style={{ color: LANE_INK.muted }}>{hover.logged.label}</span>
                <span className="ml-auto font-mono font-semibold">{hover.logged.r}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
