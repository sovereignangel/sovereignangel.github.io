'use client'

/**
 * One race, drawn as a line of time — ported from the Lordas strip, F35-39
 * only.
 *
 * Two bands: the faint one is first to tenth in the age group, the placing
 * question; the solid one is the winner's time to the slowest time that
 * actually took a World Championship slot, the qualifying question. The dots
 * are the ladder. The axis runs slow to fast, left to right, so progress is
 * movement rightwards. A dot is hollow where the race has no scored slot data.
 *
 * Geometry only; the times all come from Lordas.
 */

import { V } from '@/components/lordas/design/tokens'
import { clock, splitRung } from './format'
import type { OppRung } from './types'

export interface StripProps {
  placing: { lo: number; hi: number } | null
  slots: { lo: number; hi: number; count: number; year: string } | null
  estimate: { lo: number; hi: number; place: number } | null
  dots: OppRung[]
  raceDay: number | null
  domain: { lo: number; hi: number }
  width?: number
}

const H = 26
const PAD = 5

function scale(domain: { lo: number; hi: number }, width: number) {
  const span = Math.max(1, domain.hi - domain.lo)
  return (sec: number) => {
    const raw = PAD + ((domain.hi - sec) / span) * (width - PAD * 2)
    return Math.max(PAD, Math.min(width - PAD, raw))
  }
}

export function QualifyingStrip({ placing, slots, estimate, dots, raceDay, domain, width = 205 }: StripProps) {
  const x = scale(domain, width)
  const bar = (a: number, b: number) => ({ x: Math.min(x(a), x(b)), width: Math.max(1.5, Math.abs(x(b) - x(a))) })
  const cutoff = slots?.hi ?? estimate?.hi ?? null

  return (
    <svg
      viewBox={`0 0 ${width} ${H}`}
      width={width}
      height={H}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', maxWidth: width, minWidth: 120, height: H }}
      role="img"
    >
      <line x1={PAD} x2={width - PAD} y1={H / 2} y2={H / 2} stroke={V.ruleSoft} strokeWidth={1} />

      {placing && (
        <rect {...bar(placing.lo, placing.hi)} y={H / 2 - 6} height={12} fill={V.muted} opacity={0.18} />
      )}

      {slots && (
        <>
          <rect {...bar(slots.lo, slots.hi)} y={H / 2 - 3.5} height={7} fill={V.ok} opacity={0.5} />
          <line x1={x(slots.hi)} x2={x(slots.hi)} y1={H / 2 - 7} y2={H / 2 + 7} stroke={V.ok} strokeWidth={1.4} />
        </>
      )}

      {!slots && estimate && (
        <>
          <rect
            {...bar(estimate.lo, estimate.hi)}
            y={H / 2 - 3.5}
            height={7}
            fill="none"
            stroke={V.ok}
            strokeWidth={1}
            strokeDasharray="3 2"
            opacity={0.8}
          />
          <line
            x1={x(estimate.hi)} x2={x(estimate.hi)} y1={H / 2 - 7} y2={H / 2 + 7}
            stroke={V.ok} strokeWidth={1.2} strokeDasharray="2 2"
          />
        </>
      )}

      {raceDay != null && (
        <g>
          <line x1={x(raceDay)} x2={x(raceDay)} y1={1} y2={H - 1} stroke={V.accent} strokeWidth={2} />
          <title>
            {`On race day ${clock(raceDay)} — the ladder projected to this date` +
              (cutoff != null
                ? raceDay <= cutoff
                  ? `, inside the ${slots ? '' : 'estimated '}cutoff`
                  : `, ${clock(raceDay - cutoff)} outside the ${slots ? '' : 'estimated '}cutoff`
                : '')}
          </title>
        </g>
      )}

      {dots.map((d) => {
        const inTen = placing ? d.sec <= placing.hi : null
        const inSlots = cutoff != null ? d.sec <= cutoff : null
        const known = !!slots
        const colour = inSlots ? V.ok : inTen ? V.warn : V.crit
        return (
          <g key={d.label}>
            <circle
              cx={x(d.sec)}
              cy={H / 2}
              r={3.4}
              fill={known ? colour : V.panel}
              stroke={known ? V.panel : colour}
              strokeWidth={known ? 1.1 : 1.4}
            />
            <title>
              {`${d.label} — ` +
                (slots
                  ? inSlots
                    ? `inside the slots (cutoff ${clock(slots.hi)}, ${slots.count} taken at the ${slots.year} edition)`
                    : `outside the slots by ${clock(d.sec - slots.hi)}`
                  : estimate
                    ? `no scored slot data — on the typical depth (${estimate.place}th in AG) this would ${d.sec <= estimate.hi ? 'be inside' : 'miss'} the slots`
                    : `no scored slot data for this race — ${inTen ? 'inside' : 'outside'} the top ten`)}
            </title>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * The ruler that names the dots, once at the head of the column. Every strip
 * shares one domain, so the four rungs sit at the same four x positions in
 * every row. Labels alternate above and below the line so they never collide;
 * the rung names are in the ladder key above the table, so the ruler carries
 * the times.
 */
export function StripRuler({ dots, domain, width = 205 }: { dots: OppRung[]; domain: { lo: number; hi: number }; width?: number }) {
  const x = scale(domain, width)
  const ordered = [...dots].sort((a, b) => x(a.sec) - x(b.sec))
  const RH = 30
  return (
    <svg
      viewBox={`0 0 ${width} ${RH}`}
      width={width}
      height={RH}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', maxWidth: width, minWidth: 120, height: RH, marginTop: 2 }}
      aria-hidden
    >
      {ordered.map((d, i) => {
        const [name, time] = splitRung(d.label)
        const top = i % 2 === 0
        return (
          <g key={d.label}>
            <line x1={x(d.sec)} x2={x(d.sec)} y1={top ? 12 : 14} y2={top ? 17 : 19} stroke={V.faint} strokeWidth={0.8} />
            <text
              x={x(d.sec)}
              y={top ? 10 : 29}
              textAnchor="middle"
              fill={V.muted}
              style={{ fontSize: 11, fontFamily: 'var(--lordas-mono)', letterSpacing: 0, textTransform: 'none', fontWeight: 400 }}
            >
              <title>{`${name} ${time}`}</title>
              {time}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Trimmed to the middle 96% of what is drawn, widened to hold every rung. */
export function stripDomain(values: number[], always: number[] = []): { lo: number; hi: number } {
  const real = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (!real.length) return { lo: 0, hi: 1 }
  const at = (q: number) => real[Math.min(real.length - 1, Math.max(0, Math.round(q * (real.length - 1))))]
  const lo = Math.min(at(0.02), ...always)
  const hi = Math.max(at(0.98), ...always)
  const pad = Math.max(120, (hi - lo) * 0.04)
  return { lo: lo - pad, hi: hi + pad }
}

/** The key beneath the table — a strip nobody can read is decoration. */
export function StripLegend() {
  return (
    <div className="opps-legend">
      <span className="opps-legend-axis">slower &larr; &rarr; faster</span>
      <Key swatch={<span className="sw" style={{ height: 8, background: V.muted, opacity: 0.18 }} />}>10th to 1st in AG</Key>
      <Key swatch={<span className="sw" style={{ height: 5, background: V.ok, opacity: 0.5 }} />}>slot cutoff to winner</Key>
      <Key swatch={<Dot color={V.ok} />}>that rung takes a slot</Key>
      <Key swatch={<Dot color={V.warn} />}>top ten, no slot</Key>
      <Key swatch={<Dot color={V.crit} />}>outside both</Key>
      <Key swatch={<span className="sw" style={{ height: 6, border: `1px dashed ${V.ok}` }} />}>estimated slot depth</Key>
      <Key swatch={<Dot color={V.muted} hollow />}>not measured here</Key>
      <Key swatch={<span className="sw" style={{ width: 2, height: 12, background: V.accent }} />}>you on race day</Key>
    </div>
  )
}

export function Key({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="opps-key">
      {swatch}
      <span>{children}</span>
    </span>
  )
}

export function Dot({ color, hollow }: { color: string; hollow?: boolean }) {
  return (
    <span
      className="opps-dot"
      style={{ background: hollow ? 'transparent' : color, border: hollow ? `1.4px solid ${color}` : undefined }}
    />
  )
}
