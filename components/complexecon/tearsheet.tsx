'use client'

/**
 * Tearsheet primitives for /complexecon.
 *
 * The pathway page reads as a research tearsheet: a ruled sheet of blocks,
 * each block a stack of one-line rows that open for the detail. Nothing
 * expands unless it is asked to — the page is scanned first, read second.
 */

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'

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

/** A ruled block: caption bar, then rows. The bar folds the whole block. */
export function Block({
  label,
  meta,
  open = true,
  onToggle,
  children,
}: {
  label: string
  meta?: ReactNode
  open?: boolean
  onToggle?: () => void
  children: ReactNode
}) {
  const bar = (
    <>
      <span className="flex min-w-0 items-baseline gap-2">
        {onToggle && (
          <span className="translate-y-[-1px]">
            <Chevron open={open} />
          </span>
        )}
        <span className="font-serif text-[16px] font-semibold uppercase tracking-[1.5px] text-burgundy">{label}</span>
      </span>
      {meta && <span className="font-mono text-[13px] uppercase tracking-[1px] text-ink-muted">{meta}</span>}
    </>
  )
  return (
    <section className="border border-rule bg-white">
      {onToggle ? (
        <button
          onClick={onToggle}
          aria-expanded={open}
          className={`flex w-full items-baseline justify-between gap-3 bg-cream px-3 py-1 text-left ${
            open ? 'border-b border-rule' : ''
          }`}
        >
          {bar}
        </button>
      ) : (
        <div className="flex items-baseline justify-between gap-3 border-b border-rule bg-cream px-3 py-1">{bar}</div>
      )}
      {open && children}
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
      <div className={`flex items-start gap-2 px-3 py-1.5 ${indent ? 'pl-5' : ''}`}>
        {lead}
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="group flex min-w-0 flex-1 flex-wrap items-start gap-x-2 gap-y-0.5 text-left"
        >
          <span className="mt-[5px]">
            <Chevron open={open} />
          </span>
          <span className="min-w-0 flex-1 basis-[60%]">{head}</span>
          {meta && <span className="ml-auto mt-[3px] shrink-0 text-right">{meta}</span>}
        </button>
      </div>
      {open && <div className={`px-3 pb-2.5 ${indent ? 'pl-[46px]' : 'pl-[33px]'}`}>{children}</div>}
    </div>
  )
}

/** A row with nothing to unfold — used for static one-liners inside a block. */
export function FlatRow({ children }: { children: ReactNode }) {
  return <div className="border-b border-rule-light px-3 py-1.5 last:border-b-0">{children}</div>
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
      className={`mt-[6px] h-[13px] w-[13px] shrink-0 rounded-sm border transition-colors ${
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
    <div className="px-2.5 py-1.5 text-center">
      <div className={`font-mono text-[22px] font-semibold leading-none ${muted ? 'text-ink' : 'text-burgundy'}`}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase leading-tight tracking-[0.5px] text-ink-muted">{label}</div>
    </div>
  )
}

/** The three tabs, shared by every sheet. */
const TABS: { id: SheetTab; label: string; href: string }[] = [
  { id: 'roadmap', label: 'Roadmap', href: '/complexecon/roadmap' },
  { id: 'pathway', label: 'Pathway', href: '/complexecon' },
  { id: 'research', label: 'Research', href: '/complexecon/research' },
  { id: 'strategy', label: 'Strategy', href: '/complexecon/strategy' },
]

export type SheetTab = 'roadmap' | 'pathway' | 'research' | 'strategy'

export function Masthead({
  kicker,
  title,
  meta,
  active,
}: {
  kicker: string
  title: string
  meta: string
  active: SheetTab
}) {
  return (
    <header className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-rule pb-2">
      <div>
        <div className="font-mono text-[12px] uppercase tracking-[3px] text-ink-muted">{kicker}</div>
        <h1 className="font-serif text-[32px] font-semibold leading-tight text-ink md:text-[38px]">{title}</h1>
      </div>
      <div className="text-right">
        <div className="font-mono text-[12px] uppercase tracking-[1.5px] text-ink-muted">{meta}</div>
        <nav className="mt-1 flex justify-end gap-3">
          {TABS.map(t =>
            t.id === active ? (
              <span
                key={t.id}
                className="border-b-2 border-burgundy font-serif text-[19px] font-semibold text-burgundy"
              >
                {t.label}
              </span>
            ) : (
              <Link
                key={t.id}
                href={t.href}
                className="font-serif text-[19px] text-ink-muted transition-colors hover:text-ink"
              >
                {t.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  )
}

/** The question beside the numbers, with the expand/collapse controls beneath. */
export function SheetHead({
  question,
  subline,
  stats,
  openCount,
  onExpandAll,
  onCollapseAll,
}: {
  question: string
  subline: string
  stats: ReactNode
  openCount: number
  onExpandAll: () => void
  onCollapseAll: () => void
}) {
  return (
    <section className="mb-3 border border-rule bg-white">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 border-b border-rule px-4 py-3 lg:border-b-0 lg:border-r">
          <p className="font-serif text-[21px] italic leading-snug text-ink md:text-[23px]">&ldquo;{question}&rdquo;</p>
          <p className="mt-1 font-mono text-[12px] uppercase tracking-[1.5px] text-ink-muted">{subline}</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-rule-light sm:grid-cols-6 lg:w-[680px] lg:shrink-0">
          {stats}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule px-3 py-1">
        <Meta>Every line opens · {openCount} open</Meta>
        <div className="flex gap-1">
          <button
            onClick={onExpandAll}
            className="rounded-sm border border-rule px-2 py-px font-mono text-[11px] uppercase tracking-[1px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
          >
            Expand all
          </button>
          <button
            onClick={onCollapseAll}
            className="rounded-sm border border-rule px-2 py-px font-mono text-[11px] uppercase tracking-[1px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
          >
            Collapse all
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * Rows are closed until asked for; blocks are open until folded away. Both are
 * remembered per sheet, so a page reopens exactly as it was left.
 */
export function useSheetState({
  storageKey,
  blockIds,
  defaultRows = [],
}: {
  storageKey: string
  blockIds: string[]
  defaultRows?: string[]
}) {
  const rowsKey = `${storageKey}-open`
  const blocksKey = `${storageKey}-blocks-closed`

  const [openRows, setOpenRows] = useState<Set<string>>(new Set())
  const [closedBlocks, setClosedBlocks] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const rows = localStorage.getItem(rowsKey)
      setOpenRows(new Set(rows ? (JSON.parse(rows) as string[]) : defaultRows))
      const blocks = localStorage.getItem(blocksKey)
      if (blocks) setClosedBlocks(new Set(JSON.parse(blocks) as string[]))
    } catch {
      setOpenRows(new Set(defaultRows))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const writeRows = (next: Set<string>) => {
    localStorage.setItem(rowsKey, JSON.stringify(Array.from(next)))
    return next
  }
  const writeBlocks = (next: Set<string>) => {
    localStorage.setItem(blocksKey, JSON.stringify(Array.from(next)))
    return next
  }

  const toggleRow = (id: string) =>
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return writeRows(next)
    })

  const toggleBlock = (id: string) =>
    setClosedBlocks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return writeBlocks(next)
    })

  const expandAll = (rowIds: string[]) => {
    setOpenRows(writeRows(new Set(rowIds)))
    setClosedBlocks(writeBlocks(new Set()))
  }

  const collapseAll = () => {
    setOpenRows(writeRows(new Set()))
    setClosedBlocks(writeBlocks(new Set(blockIds)))
  }

  return { openRows, closedBlocks, toggleRow, toggleBlock, expandAll, collapseAll }
}

/** Split an ordered list of groups into two columns of roughly equal height. */
export function splitColumns<T>(groups: T[], weight: (g: T) => number): [T[], T[]] {
  const weights = groups.map(weight)
  const total = weights.reduce((a, b) => a + b, 0)
  let running = 0
  let cut = 1
  let best = Infinity
  weights.forEach((w, i) => {
    running += w
    const imbalance = Math.abs(total - 2 * running)
    if (i < groups.length - 1 && imbalance < best) {
      best = imbalance
      cut = i + 1
    }
  })
  return [groups.slice(0, cut), groups.slice(cut)]
}

/** Two columns of rows, ruled apart — how a wide block packs its lines. */
export function TwoUp({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-rule-light">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  )
}
