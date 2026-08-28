'use client'

/**
 * Tearsheet primitives for /complexecon.
 *
 * The pathway page reads as a research tearsheet: a ruled sheet of blocks,
 * each block a stack of one-line rows that open for the detail. Nothing
 * expands unless it is asked to — the page is scanned first, read second.
 */

import type { ReactNode } from 'react'

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`h-[12px] w-[12px] shrink-0 text-ink-faint transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
    >
      <path
        d="M4 2.5 8 6l-4 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A ruled block: caption bar, then rows. */
export function Block({
  label,
  meta,
  children,
}: {
  label: string
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mb-5 border border-rule bg-white">
      <div className="flex items-baseline justify-between gap-3 border-b border-rule bg-cream px-3 py-1.5">
        <h2 className="font-serif text-[17px] font-semibold uppercase tracking-[1.5px] text-burgundy">{label}</h2>
        {meta && <span className="font-mono text-[13px] uppercase tracking-[1px] text-ink-muted">{meta}</span>}
      </div>
      {children}
    </section>
  )
}

/** Small caps mono label used for field prefixes and row meta. */
export function Meta({ children, tone }: { children: ReactNode; tone?: 'muted' | 'amber' | 'burgundy' }) {
  const color = tone === 'amber' ? 'text-amber-ink' : tone === 'burgundy' ? 'text-burgundy' : 'text-ink-muted'
  return <span className={`font-mono text-[13px] uppercase tracking-[1px] ${color}`}>{children}</span>
}

/**
 * One tearsheet row. `head` is always visible and toggles; `children` is the
 * detail that unfolds beneath it. `lead` renders outside the toggle button so
 * checkboxes stay independently clickable.
 */
export function Row({
  open,
  onToggle,
  lead,
  head,
  meta,
  indent,
  children,
}: {
  open: boolean
  onToggle: () => void
  lead?: ReactNode
  head: ReactNode
  meta?: ReactNode
  indent?: boolean
  children: ReactNode
}) {
  return (
    <div className={`border-b border-rule-light last:border-b-0 ${open ? 'bg-paper' : ''}`}>
      <div className={`flex items-start gap-2.5 px-3 py-2 ${indent ? 'pl-6' : ''}`}>
        {lead}
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="group flex min-w-0 flex-1 items-start gap-2.5 text-left"
        >
          <span className="mt-[6px]">
            <Chevron open={open} />
          </span>
          <span className="min-w-0 flex-1">{head}</span>
          {meta && <span className="mt-[3px] shrink-0 text-right">{meta}</span>}
        </button>
      </div>
      {open && <div className={`px-3 pb-3 ${indent ? 'pl-[52px]' : 'pl-[38px]'}`}>{children}</div>}
    </div>
  )
}

/** A row with nothing to unfold — used for static one-liners inside a block. */
export function FlatRow({ children }: { children: ReactNode }) {
  return <div className="border-b border-rule-light px-3 py-2 last:border-b-0">{children}</div>
}

export function ProgressRule({ pct }: { pct: number }) {
  return (
    <span className="block h-[2px] w-full bg-rule-light">
      <span className="block h-full bg-burgundy transition-all" style={{ width: `${pct}%` }} />
    </span>
  )
}

export function Checkbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={checked}
      aria-label={label}
      className={`mt-[7px] h-[14px] w-[14px] shrink-0 rounded-sm border transition-colors ${
        checked ? 'border-burgundy bg-burgundy' : 'border-rule bg-white hover:border-ink-faint'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 14 14" className="h-full w-full" aria-hidden="true">
          <path d="M3.5 7.2 6 9.7 10.5 4.5" fill="none" stroke="#faf8f4" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

/** One cell of the statistics strip in the sheet head. */
export function Stat({ value, label, muted }: { value: ReactNode; label: string; muted?: boolean }) {
  return (
    <div className="px-3 py-2 text-center">
      <div className={`font-mono text-[25px] font-semibold leading-none ${muted ? 'text-ink' : 'text-burgundy'}`}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[12px] uppercase tracking-[1px] text-ink-muted">{label}</div>
    </div>
  )
}
