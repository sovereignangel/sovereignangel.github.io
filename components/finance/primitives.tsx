'use client'

/**
 * Finance sheet primitives: money and percent formatting, the number input
 * that commits on blur, the ruled rows a bill and an input column are built
 * from. Block, Row and the sheet head come from the complexecon tearsheet so
 * the two apps read as one system.
 */

import { useEffect, useState, type ReactNode } from 'react'

export function fmtMoney(n: number, opts: { cents?: boolean; plus?: boolean } = {}): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const s = abs.toLocaleString(
    'en-US',
    opts.cents ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }
  )
  if (n < -0.005) return `−$${s}`
  return `${opts.plus && n > 0.005 ? '+' : ''}$${s}`
}

export function fmtPct(x: number, digits = 1): string {
  if (!Number.isFinite(x)) return '—'
  return `${(x * 100).toFixed(digits)}%`
}

export function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** "12,000", "12k", "1.2m", "(500)" all parse. */
export function parseNum(text: string): number {
  const t = text.trim().toLowerCase().replace(/[$,\s]/g, '').replace(/^\((.*)\)$/, '-$1')
  if (!t) return 0
  const m = t.match(/^(-?\d*\.?\d+)([km])?$/)
  if (!m) {
    const n = Number(t)
    return Number.isFinite(n) ? n : 0
  }
  const mult = m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1
  return Number(m[1]) * mult
}

export type Tone = 'ink' | 'muted' | 'faint' | 'burgundy' | 'green' | 'amber' | 'red'

const TEXT_TONE: Record<Tone, string> = {
  ink: 'text-ink',
  muted: 'text-ink-muted',
  faint: 'text-ink-faint',
  burgundy: 'text-burgundy',
  green: 'text-green-ink',
  amber: 'text-amber-ink',
  red: 'text-red-ink',
}

const SIZE: Record<12 | 13 | 14 | 16 | 22, string> = {
  12: 'text-[12px]',
  13: 'text-[13px]',
  14: 'text-[14px]',
  16: 'text-[16px]',
  22: 'text-[22px]',
}

export function Money({
  value,
  cents,
  plus,
  tone = 'ink',
  size = 14,
  strong,
}: {
  value: number
  cents?: boolean
  plus?: boolean
  tone?: Tone
  size?: 12 | 13 | 14 | 16 | 22
  strong?: boolean
}) {
  return (
    <span className={`font-mono tabular-nums ${SIZE[size]} ${TEXT_TONE[tone]} ${strong ? 'font-semibold' : ''}`}>
      {fmtMoney(value, { cents, plus })}
    </span>
  )
}

export function Pct({ value, tone = 'ink', size = 14, digits = 1 }: { value: number; tone?: Tone; size?: 12 | 13 | 14 | 16 | 22; digits?: number }) {
  return <span className={`font-mono tabular-nums ${SIZE[size]} ${TEXT_TONE[tone]}`}>{fmtPct(value, digits)}</span>
}

const TAG_TONE: Record<Tone, string> = {
  ink: 'bg-transparent text-ink border-rule',
  muted: 'bg-transparent text-ink-muted border-rule',
  faint: 'bg-transparent text-ink-faint border-rule-light',
  burgundy: 'bg-burgundy-bg text-burgundy border-burgundy/25',
  green: 'bg-green-bg text-green-ink border-green-ink/30',
  amber: 'bg-amber-bg text-amber-ink border-amber-ink/30',
  red: 'bg-red-bg text-red-ink border-red-ink/30',
}

export function Tag({ tone = 'muted', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-block whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.5px] ${TAG_TONE[tone]}`}
    >
      {children}
    </span>
  )
}

export function SmallButton({
  onClick,
  children,
  tone = 'muted',
  disabled,
  title,
}: {
  onClick: () => void
  children: ReactNode
  tone?: 'muted' | 'burgundy'
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-sm border px-2 py-px font-mono text-[11px] uppercase tracking-[1px] transition-colors disabled:opacity-40 ${
        tone === 'burgundy'
          ? 'border-burgundy bg-burgundy text-paper hover:opacity-90'
          : 'border-rule text-ink-muted hover:border-ink-faint hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label, title }: { checked: boolean; onChange: (v: boolean) => void; label: string; title?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      onClick={() => onChange(!checked)}
      className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.5px] transition-colors ${
        checked ? 'border-burgundy bg-burgundy text-paper' : 'border-rule bg-transparent text-ink-muted hover:border-ink-faint'
      }`}
    >
      {label}
    </button>
  )
}

/** A number field that keeps its own text while focused and commits on blur or Enter. */
export function NumInput({
  value,
  onChange,
  prefix = '$',
  suffix,
  width = 'w-[104px]',
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  width?: string
  ariaLabel?: string
}) {
  const [text, setText] = useState(value ? fmtNum(value) : '')
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(value ? fmtNum(value) : '')
  }, [value, focused])
  const commit = () => {
    setFocused(false)
    const n = parseNum(text)
    if (n !== value) onChange(n)
    else setText(value ? fmtNum(value) : '')
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-sm border border-rule bg-white px-1.5 focus-within:border-burgundy">
      {prefix && <span className="font-mono text-[12px] text-ink-faint">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={text}
        placeholder="0"
        onFocus={() => setFocused(true)}
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        className={`${width} bg-transparent py-0.5 text-right font-mono text-[13px] tabular-nums text-ink placeholder:text-ink-faint outline-none`}
      />
      {suffix && <span className="font-mono text-[12px] text-ink-faint">{suffix}</span>}
    </span>
  )
}

/** One input line: label and hint on the left, the field on the right. */
export function InputRow({
  label,
  hint,
  action,
  children,
}: {
  label: string
  hint?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-rule-light px-3 py-1.5 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[14px] leading-snug text-ink">{label}</div>
        {hint && <div className="text-[12px] leading-snug text-ink-muted">{hint}</div>}
        {action && <div className="mt-1">{action}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** Caption bar for a column inside a block. */
export function ColumnHead({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-rule bg-paper px-3 py-1">
      <span className="font-serif text-[14px] font-semibold uppercase tracking-[1px] text-burgundy">{children}</span>
      {meta && <span className="font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted">{meta}</span>}
    </div>
  )
}

/** One line of a bill: label, an optional note, the amount. */
export function BillLine({
  label,
  note,
  value,
  strong,
  indent,
  tone,
  cents,
}: {
  label: string
  note?: ReactNode
  value: number
  strong?: boolean
  indent?: boolean
  tone?: Tone
  cents?: boolean
}) {
  return (
    <div className={`flex items-baseline justify-between gap-3 border-b border-rule-light px-3 py-1 last:border-b-0 ${strong ? 'bg-paper' : ''}`}>
      <div className={`min-w-0 ${indent ? 'pl-3' : ''}`}>
        <span className={`text-[14px] ${strong ? 'font-semibold text-ink' : indent ? 'text-ink-muted' : 'text-ink'}`}>{label}</span>
        {note && <span className="ml-2 text-[12px] text-ink-muted">{note}</span>}
      </div>
      <Money value={value} tone={tone ?? (strong ? 'burgundy' : 'ink')} strong={strong} cents={cents} />
    </div>
  )
}

export function SubHead({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 mt-2.5 font-serif text-[14px] font-semibold uppercase tracking-[1px] text-burgundy first:mt-0">{children}</div>
  )
}

/** A short notice inside a block. */
export function Notice({ tone = 'muted', children }: { tone?: 'muted' | 'amber' | 'red'; children: ReactNode }) {
  const cls = tone === 'amber' ? 'text-amber-ink' : tone === 'red' ? 'text-red-ink' : 'text-ink-muted'
  return <p className={`px-3 py-2 text-[14px] leading-relaxed ${cls}`}>{children}</p>
}
