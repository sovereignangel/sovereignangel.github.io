'use client'

/**
 * The block, week by week, as two questions — ported from Lordas.
 *
 * Pace on top (under, met or dominated against what that week prescribed) and
 * completion beneath it (missed, partial or accomplished against the planned
 * volume), sharing one week axis. Kept apart because they move apart: a week
 * can be fast and short, or long and slow.
 *
 * All three sports share each chart, so each carries a fixed vertical offset
 * and its own marker shape as well as its colour — identity never rests on
 * colour alone. Hover or tap a week for what the readings are made of.
 */

import { useEffect, useRef, useState } from 'react'
import { SportGlyph } from '@/components/lordas/design/assets'
import type { PerfWeek, PerfSportWeek, Sport3, Completion, PaceGrade } from './types'
import { FAINT, INK, MUTED, SPORT_INK, fmtMin, monthDay } from './format'

const PLOT_H = 80
const PAD_RIGHT = 14
const AXIS_H = 22
const HEAD_H = 18

const SPORTS3: Sport3[] = ['swim', 'bike', 'run']
const OFFSET: Record<Sport3, number> = { swim: -6, bike: 0, run: 6 }
const SPORT_NAME: Record<Sport3, string> = { swim: 'Swim', bike: 'Bike', run: 'Run' }

const COMPLETIONS: Completion[] = ['missed', 'partial', 'accomplished']
const PACE_GRADES: PaceGrade[] = ['under', 'met', 'dominated']
const COMPLETION_LABEL: Record<Completion, string> = { missed: 'Missed', partial: 'Partial', accomplished: 'Accomplished' }
const PACE_LABEL: Record<PaceGrade, string> = { under: 'Under pace', met: 'Met pace', dominated: 'Dominated' }

const PANEL = 'var(--lordas-panel)'
const RULE = 'var(--lordas-rule)'
const RULE_SOFT = 'var(--lordas-rule-soft)'

function paceWords(ratio: number | null): string {
  if (ratio == null) return 'pace not measured'
  const pct = Math.round(Math.abs(ratio - 1) * 100)
  if (pct === 0) return 'on prescribed pace'
  return `${pct}% ${ratio > 1 ? 'slower' : 'faster'} than prescribed`
}

/** Circle, square, triangle — the shape channel that carries identity alongside colour */
function Marker({ sport, cx, cy, r, hollow }: { sport: Sport3; cx: number; cy: number; r: number; hollow: boolean }) {
  const fill = hollow ? PANEL : SPORT_INK[sport]
  const stroke = hollow ? SPORT_INK[sport] : PANEL
  if (sport === 'bike') {
    const s = r * 1.7
    return <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} fill={fill} stroke={stroke} strokeWidth={2} />
  }
  if (sport === 'run') {
    const s = r * 1.25
    return (
      <path
        d={`M${cx},${cy - s * 1.15} L${cx + s * 1.1},${cy + s * 0.8} L${cx - s * 1.1},${cy + s * 0.8} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    )
  }
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={2} />
}

interface PlotSpec<L extends string> {
  title: string
  note: string
  levels: L[]
  label: Record<L, string>
  reference: L
  value: (sw: PerfSportWeek) => L | null
}

function Plot<L extends string>({
  spec, weeks, width, gutter, x, active, setActive, narrow,
}: {
  spec: PlotSpec<L>
  weeks: PerfWeek[]
  width: number
  gutter: number
  x: (i: number) => number
  active: number | null
  setActive: (fn: (a: number | null) => number | null) => void
  narrow: boolean
}) {
  const levelStep = (PLOT_H - 20) / (spec.levels.length - 1)
  const top = HEAD_H + 8
  const yLine = (l: L) => top + PLOT_H - 10 - spec.levels.indexOf(l) * levelStep
  const y = (l: L, sport: Sport3) => yLine(l) + OFFSET[sport]
  const height = top + PLOT_H + AXIS_H
  const step = weeks.length > 1 ? (width - gutter - PAD_RIGHT) / (weeks.length - 1) : width - gutter - PAD_RIGHT
  const labelEvery = Math.max(1, Math.ceil(64 / Math.max(step, 1)))

  const segments = (sport: Sport3) => {
    // Break the line where a week has no reading rather than bridging the gap.
    const out: string[] = []
    let cur: string[] = []
    weeks.forEach((w, i) => {
      const v = spec.value(w.sports[sport])
      if (v == null) {
        if (cur.length > 1) out.push(cur.join(' '))
        cur = []
        return
      }
      cur.push(`${cur.length ? 'L' : 'M'}${x(i).toFixed(1)},${y(v, sport).toFixed(1)}`)
    })
    if (cur.length > 1) out.push(cur.join(' '))
    return out
  }

  return (
    <svg width={width} height={height} role="img" aria-label={`${spec.title} by week, swim, bike and run`} style={{ display: 'block' }}>
      <text x={12} y={14} fontSize={13} fontWeight={600} fill="var(--lordas-accent)" style={{ fontFamily: 'var(--lordas-display)' }}>
        {spec.title}
      </text>
      {!narrow && (
        <text x={12 + spec.title.length * 8 + 14} y={14} fontSize={11} fill={MUTED}>
          {spec.note}
        </text>
      )}
      {spec.levels.map((l) => (
        <g key={l}>
          <line x1={gutter - 4} x2={width - PAD_RIGHT} y1={yLine(l)} y2={yLine(l)} stroke={l === spec.reference ? RULE : RULE_SOFT} strokeWidth={1} />
          <text
            x={gutter - 10}
            y={yLine(l) + 4}
            textAnchor="end"
            fontSize={11}
            fill={l === spec.reference ? MUTED : FAINT}
          >
            {spec.label[l]}
          </text>
        </g>
      ))}

      {SPORTS3.map((sport) => (
        <g key={sport}>
          {segments(sport).map((d, k) => (
            <path key={k} d={d} fill="none" stroke={SPORT_INK[sport]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </g>
      ))}
      {SPORTS3.map((sport) => (
        <g key={sport}>
          {weeks.map((w, i) => {
            const v = spec.value(w.sports[sport])
            if (v == null) return null
            return <Marker key={w.weekStart} sport={sport} cx={x(i)} cy={y(v, sport)} r={active === i ? 5 : 4} hollow={w.inProgress} />
          })}
        </g>
      ))}

      {weeks.map((w, i) =>
        i % labelEvery === 0 || i === weeks.length - 1 ? (
          <text
            key={w.weekStart}
            x={x(i)}
            y={height - 6}
            textAnchor={i === 0 && weeks.length > 1 ? 'start' : i === weeks.length - 1 && weeks.length > 1 ? 'end' : 'middle'}
            fontSize={11}
            fill={active === i ? INK : FAINT}
            style={{ fontFamily: 'var(--lordas-mono)' }}
          >
            {monthDay(w.weekStart)}
          </text>
        ) : null
      )}

      {active != null && (
        <line x1={x(active)} x2={x(active)} y1={top - 4} y2={top + PLOT_H} stroke={MUTED} strokeWidth={1} opacity={0.5} />
      )}

      {weeks.map((w, i) => (
        <rect
          key={w.weekStart}
          x={x(i) - step / 2}
          y={0}
          width={step}
          height={height}
          fill="transparent"
          onMouseEnter={() => setActive(() => i)}
          onClick={() => setActive((a) => (a === i ? null : i))}
          style={{ cursor: 'pointer' }}
        />
      ))}
    </svg>
  )
}

const PACE_SPEC: PlotSpec<PaceGrade> = {
  title: 'Pace',
  note: 'Against what that week prescribed. Within 3% counts as met.',
  levels: PACE_GRADES,
  label: PACE_LABEL,
  reference: 'met',
  value: (sw) => sw.pace,
}

const COMPLETION_SPEC: PlotSpec<Completion> = {
  title: 'Completion',
  note: 'Minutes done against planned. 80% counts as accomplished.',
  levels: COMPLETIONS,
  label: COMPLETION_LABEL,
  reference: 'accomplished',
  value: (sw) => sw.completion,
}

export function TrainingTrend({ weeks }: { weeks: PerfWeek[] }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)
  const [active, setActiveState] = useState<number | null>(null)
  const setActive = (fn: (a: number | null) => number | null) => setActiveState(fn)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(300, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!weeks.length) return null

  const narrow = width < 560
  const gutter = narrow ? 96 : 108
  const plotW = width - gutter - PAD_RIGHT
  const x = (i: number) => gutter + (weeks.length > 1 ? (i * plotW) / (weeks.length - 1) : plotW / 2)
  const activeWeek = active != null ? weeks[active] : null
  const tipLeft = active != null && x(active) > width / 2

  return (
    <div ref={wrap} className="iron-perf-trend" onMouseLeave={() => setActiveState(null)}>
      <div className="iron-perf-trend-head">
        <span className="iron-perf-h">Week by week</span>
        {SPORTS3.map((s) => (
          <span key={s} className="iron-perf-legend">
            <svg width={26} height={12} aria-hidden>
              <line x1={1} x2={25} y1={6} y2={6} stroke={SPORT_INK[s]} strokeWidth={2} strokeLinecap="round" />
              <Marker sport={s} cx={13} cy={6} r={3.5} hollow={false} />
            </svg>
            {SPORT_NAME[s]}
          </span>
        ))}
        <span className="iron-perf-hint">Open mark is this week so far. Hover or tap a week.</span>
      </div>

      <Plot spec={PACE_SPEC} weeks={weeks} width={width} gutter={gutter} x={x} active={active} setActive={setActive} narrow={narrow} />
      <div style={{ height: 6, borderTop: `1px solid ${RULE_SOFT}`, margin: '0 12px' }} />
      <Plot spec={COMPLETION_SPEC} weeks={weeks} width={width} gutter={gutter} x={x} active={active} setActive={setActive} narrow={narrow} />

      {activeWeek && (
        <WeekPanel
          week={activeWeek}
          // On a phone the panel covers the chart, so it takes touches; on a
          // desktop it must not, or it would swallow the hover it answers.
          interactive={narrow}
          onClose={() => setActiveState(null)}
          style={{
            position: 'absolute',
            top: 30,
            ...(narrow
              ? { left: 8, right: 8 }
              : tipLeft
                ? { right: width - x(active!) + 14 }
                : { left: x(active!) + 14 }),
          }}
        />
      )}
    </div>
  )
}

function WeekPanel({
  week, style, interactive, onClose,
}: {
  week: PerfWeek
  style: React.CSSProperties
  interactive: boolean
  onClose: () => void
}) {
  return (
    <div
      onClick={interactive ? onClose : undefined}
      className="iron-perf-weekpanel"
      style={{
        ...style,
        width: style.left != null && style.right != null ? undefined : 340,
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    >
      <div className="lordas-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--lordas-accent)', marginBottom: 4 }}>
        Week of {monthDay(week.weekStart)} – {monthDay(week.weekEnd)}
        {week.inProgress && <span style={{ fontFamily: 'var(--lordas-body)', fontWeight: 400, fontSize: 11, color: MUTED }}> · in progress</span>}
      </div>
      {SPORTS3.map((s) => <SportBlock key={s} sw={week.sports[s]} />)}
    </div>
  )
}

function SportBlock({ sw }: { sw: PerfSportWeek }) {
  const { sport } = sw
  return (
    <div style={{ borderTop: `1px solid ${RULE_SOFT}`, padding: '5px 0 3px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <svg width={10} height={10} aria-hidden>
          <Marker sport={sport} cx={5} cy={5} r={3.2} hollow={false} />
        </svg>
        <SportGlyph sport={sport} size={11} color={MUTED} />
        <span style={{ color: INK }}>{SPORT_NAME[sport]}</span>
        <span style={{ marginLeft: 'auto', color: INK, fontWeight: 600 }}>
          {sw.completion
            ? `${sw.pace ? PACE_LABEL[sw.pace] : 'Pace not measured'} · ${COMPLETION_LABEL[sw.completion]}`
            : 'Nothing planned'}
        </span>
      </div>
      {sw.completion && (
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
          <span className="lordas-mono">
            {fmtMin(sw.actualMin)} of {sw.plannedMin ? fmtMin(sw.plannedMin) : '0m'}
            {sw.plannedMin > 0 && ` (${Math.round((sw.actualMin / sw.plannedMin) * 100)}%)`}
          </span>{' '}
          planned · {paceWords(sw.paceRatio)}
        </div>
      )}
      {sw.items.map((it, k) => (
        <div key={k} style={{ fontSize: 10.5, color: FAINT, display: 'flex', gap: 6, marginTop: 2 }}>
          <span className="lordas-mono" style={{ width: 44, flexShrink: 0 }}>{monthDay(it.date)}</span>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: MUTED }}>
            {it.status === 'extra' ? '+ ' : ''}{it.title}
            {it.zone ? ` · ${it.zone}` : ''}
          </span>
          <span className="lordas-mono" style={{ flexShrink: 0 }}>
            {it.status === 'missed'
              ? 'missed'
              : `${fmtMin(it.actualMin)}${it.plannedMin ? `/${fmtMin(it.plannedMin)}` : ''}`}
            {it.pace && ` · ${it.pace}`}
            {it.pace && it.target && ` vs ${it.target}`}
          </span>
        </div>
      ))}
      {sport === 'swim' && sw.paceRatio != null && (
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 3 }}>
          Pool sessions count rest at the wall, so swim pace reads slower than it swam.
        </div>
      )}
    </div>
  )
}
