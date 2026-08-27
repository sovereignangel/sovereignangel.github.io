'use client'

/**
 * Lordas Console primitives.
 *
 * Every screen composes from these. The important one is `Seam`: cards never
 * sit in gaps, they share a 1px rule-coloured seam, which is what makes the
 * ecosystem read as one instrument instead of scattered tiles. See
 * LORDAS_BRAND_STRATEGY.md §4.
 */

import { C, TONE, wash, edge, type Tone } from './tokens'

// ── Seam grid ─────────────────────────────────────────────────────────────

export function Seam({
  cols = 2,
  children,
  className = '',
  style,
}: {
  cols?: 1 | 2 | 3 | 4
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`lordas-seam lordas-seam-${cols} ${className}`} style={style}>
      {children}
    </div>
  )
}

// ── Field card ────────────────────────────────────────────────────────────

export function FieldCard({
  label,
  meta,
  tone = 'none',
  quiet,
  span,
  children,
  className = '',
  style,
}: {
  label?: React.ReactNode
  meta?: React.ReactNode
  tone?: Tone
  quiet?: boolean
  /** Let a card run wider than one column: `true` for the full row, or a count */
  span?: boolean | number
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`lordas-fc ${className}`}
      style={{
        background: quiet ? C.panelQuiet : C.panel,
        boxShadow: tone === 'none' ? undefined : `inset 2px 0 0 ${TONE[tone]}`,
        gridColumn: span === true ? '1 / -1' : typeof span === 'number' ? `span ${span}` : undefined,
        ...style,
      }}
    >
      {(label || meta) && (
        <div className="lordas-fc-head">
          <span>{label}</span>
          {meta ? <span>{meta}</span> : null}
        </div>
      )}
      {children}
    </div>
  )
}

/** The answer, as a sentence with a full stop. Never combined with Stat. */
export function Lede({ children, color }: { children: React.ReactNode; color?: string }) {
  return <div className="lordas-fc-lede" style={color ? { color } : undefined}>{children}</div>
}

/** The answer, as a number. Never combined with Lede. */
export function Stat({ value, unit, color }: { value: React.ReactNode; unit?: string; color?: string }) {
  return (
    <div className="lordas-fc-stat" style={color ? { color } : undefined}>
      {value}
      {unit ? <small>{` ${unit}`}</small> : null}
    </div>
  )
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <div className="lordas-fc-sub">{children}</div>
}

export function Row({
  icon,
  label,
  detail,
  value,
  valueColor,
}: {
  icon?: React.ReactNode
  label: React.ReactNode
  detail?: React.ReactNode
  value?: React.ReactNode
  valueColor?: string
}) {
  return (
    <div className="lordas-fc-row">
      <span className="t">
        {icon}
        <span style={{ minWidth: 0 }}>
          <b>{label}</b>
          {detail ? <span className="d">{detail}</span> : null}
        </span>
      </span>
      {value !== undefined ? (
        <span className="v" style={valueColor ? { color: valueColor } : undefined}>{value}</span>
      ) : null}
    </div>
  )
}

export function Rows({ children }: { children: React.ReactNode }) {
  return <div className="lordas-fc-rows">{children}</div>
}

export function Foot({ children }: { children: React.ReactNode }) {
  return <div className="lordas-fc-foot">{children}</div>
}

export function Chip({
  tone = 'none',
  children,
  onClick,
  active,
  title,
}: {
  tone?: Tone
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  title?: string
}) {
  const color = tone === 'none' ? C.muted : TONE[tone]
  const style: React.CSSProperties = active
    ? { color: C.ground, background: C.accent, borderColor: C.accent }
    : tone === 'none'
      ? { color, borderColor: C.rule }
      : { color, borderColor: edge(color), background: wash(color) }
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag className="lordas-chip" style={style} onClick={onClick} title={title} type={onClick ? 'button' : undefined}>
      {children}
    </Tag>
  )
}

// ── Section heading ───────────────────────────────────────────────────────

export function SectionHead({
  title,
  meta,
  right,
}: {
  title: React.ReactNode
  meta?: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="lordas-sechd">
      <span className="lordas-sechd-t">{title}</span>
      {meta ? <span className="lordas-sechd-m">{meta}</span> : null}
      {right ? <span style={{ marginLeft: 'auto' }}>{right}</span> : null}
    </div>
  )
}

/** Reasoning that belongs to the block above it, not to any one card. */
export function Callout({ tone = 'accent', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <div className="lordas-callout" style={{ borderColor: TONE[tone] }}>
      {children}
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="lordas-empty">{children}</div>
}


// ── Hover reveal ──────────────────────────────────────────────────────────

/**
 * A value that carries its own justification. The number stays the thing you
 * read; the reasoning behind it — the target it is being scored against —
 * appears on hover or focus rather than taking a row of its own.
 *
 * Keyboard reachable, so the explanation is not mouse-only.
 */
export function Hover({
  children,
  panel,
  align = 'right',
}: {
  children: React.ReactNode
  panel: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <span className="lordas-hover" tabIndex={0}>
      {children}
      <span className={`lordas-hover-panel lordas-hover-${align}`} role="tooltip">
        {panel}
      </span>
    </span>
  )
}

// ── Ticker lane ───────────────────────────────────────────────────────────

/** Standing facts that never change within a session — dates, targets, counts. */
export function Ticker({ items }: { items: { label: string; value: React.ReactNode; color?: string }[] }) {
  return (
    <div className="lordas-ticker">
      {items.map((it, i) => (
        <span key={i} className="lordas-ticker-item">
          <span className="l">{it.label}</span>
          <span className="v" style={it.color ? { color: it.color } : undefined}>{it.value}</span>
        </span>
      ))}
    </div>
  )
}
