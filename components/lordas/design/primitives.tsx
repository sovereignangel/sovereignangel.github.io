'use client'

/**
 * Lordas Console primitives.
 *
 * Every screen composes from these. The important one is `Seam`: cards never
 * sit in gaps, they share a 1px rule-coloured seam, which is what makes the
 * ecosystem read as one instrument instead of scattered tiles. See
 * LORDAS_BRAND_STRATEGY.md §4.
 */

import { C, TONE, V, wash, edge, LORDAS_MOTTO, type Tone } from './tokens'

/**
 * Tones as CSS variables rather than literals. A primitive rendered inside a
 * second palette — the solo Ironman page hosts these in burgundy and blush —
 * must resolve its colours from the host, not from the espresso constants.
 */
const TONE_V: Record<Tone, string> = {
  ok: V.ok, warn: V.warn, crit: V.crit, accent: V.accent, none: 'transparent',
}

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
        background: quiet ? V.panelQuiet : V.panel,
        boxShadow: tone === 'none' ? undefined : `inset 2px 0 0 ${TONE_V[tone]}`,
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
  const color = tone === 'none' ? V.muted : TONE_V[tone]
  const literal = tone === 'none' ? C.muted : TONE[tone]
  const style: React.CSSProperties = active
    ? { color: V.ground, background: V.accent, borderColor: V.accent }
    : tone === 'none'
      ? { color, borderColor: V.rule }
      // colour-mix would be cleaner, but the wash and edge helpers need a
      // literal, so semantic chips fall back to the espresso value for those
      // two derived shades only.
      : { color, borderColor: edge(literal), background: wash(literal) }
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
    <div className="lordas-callout" style={{ borderColor: TONE_V[tone] }}>
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

/**
 * Standing facts that never change within a session — dates, targets, counts.
 * With `motto`, the wordmark line rides the same row rather than costing the
 * header a line of its own.
 */
export function Ticker({
  items,
  motto,
}: {
  items: { label: string; value: React.ReactNode; color?: string }[]
  motto?: boolean
}) {
  return (
    <div className={`lordas-ticker${motto ? ' has-motto' : ''}`}>
      {motto && <span className="lordas-ticker-motto">{LORDAS_MOTTO}</span>}
      <span className="lordas-ticker-band">
      {items.map((it, i) => (
        <span key={i} className="lordas-ticker-item">
          <span className="l">{it.label}</span>
          <span className="v" style={it.color ? { color: it.color } : undefined}>{it.value}</span>
        </span>
      ))}
      </span>
    </div>
  )
}


// ── Disclosure ────────────────────────────────────────────────────────────

/**
 * Detail that earns its place only once you ask for it.
 *
 * The page has to answer its question without scrolling, which means most of
 * the evidence starts closed. Native `<details>` so it works without
 * JavaScript, keeps keyboard and screen-reader behaviour for free, and
 * survives the page being printed with everything open.
 */
export function Disclosure({
  summary,
  meta,
  children,
  open,
}: {
  summary: React.ReactNode
  meta?: React.ReactNode
  children: React.ReactNode
  open?: boolean
}) {
  return (
    <details className="lordas-disc" open={open}>
      <summary>
        <span className="lordas-disc-mark" aria-hidden="true" />
        <span className="lordas-disc-t">{summary}</span>
        {meta ? <span className="lordas-disc-m">{meta}</span> : null}
      </summary>
      <div className="lordas-disc-body">{children}</div>
    </details>
  )
}

// ── Tearsheet ─────────────────────────────────────────────────────────────

export interface SheetRow {
  label: React.ReactNode
  /** One cell per discipline, in swim / bike / run order */
  cells: React.ReactNode[]
  /** Sets the row apart as a conclusion rather than an input */
  emphasis?: boolean
  colors?: (string | undefined)[]
}

/**
 * The institutional layout: disciplines across, metrics down. Reading a row
 * compares the three sports on one measure; reading a column is one sport's
 * whole case. A stack of per-sport cards can do neither.
 */
export function Tearsheet({
  columns,
  rows,
}: {
  columns: { key: string; label: React.ReactNode }[]
  rows: SheetRow[]
}) {
  return (
    <table className="lordas-sheet">
      <thead>
        <tr>
          <th />
          {columns.map((c) => <th key={c.key}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={r.emphasis ? 'em' : undefined}>
            <th scope="row">{r.label}</th>
            {r.cells.map((cell, j) => (
              <td key={j} style={r.colors?.[j] ? { color: r.colors[j] } : undefined}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
