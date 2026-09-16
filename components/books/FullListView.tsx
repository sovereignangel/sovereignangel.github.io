'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LIBRARY, SHELF_LANE_LABEL } from '@/lib/complexecon/pathway'
import type { ShelfLane, LibraryItem } from '@/lib/complexecon/pathway'
import { READING_ORDER } from '@/lib/books/reading-order'
import { SHELF_GLOSSARY } from '@/lib/books/glossary'

/**
 * The full list, derived rather than duplicated.
 *
 * The master shelf lives in lib/complexecon/pathway.ts, because that is where
 * it is tracked, memoed and checked off. This view reads it and re-cuts it by
 * job — the same books, sorted by the work they do rather than by topic.
 */

type Filter = 'all' | ShelfLane | 'extracted'

/** Slugs of the volumes that exist locally as extracted PDFs. */
const EXTRACTED_TITLES = new Set(READING_ORDER.map(s => s.title))

interface ListRow {
  item: LibraryItem
  topic: string
  lane: ShelfLane
  extracted: boolean
}

const ROWS: ListRow[] = LIBRARY.flatMap(topic =>
  topic.items.map(item => ({
    item,
    topic: topic.name,
    lane: (topic.lane ?? 'sfi') as ShelfLane,
    extracted: EXTRACTED_TITLES.has(item.title),
  })),
)

const TIER_STYLE: Record<string, string> = {
  spine: 'bg-burgundy-bg text-burgundy border-burgundy/20',
  foundation: 'bg-amber-bg text-amber-ink border-amber-ink/20',
  reference: 'bg-transparent text-ink-muted border-rule',
}

export default function FullListView() {
  const [filter, setFilter] = useState<Filter>('all')

  const rows = ROWS.filter(r => {
    if (filter === 'all') return true
    if (filter === 'extracted') return r.extracted
    return r.lane === filter
  })

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: ROWS.length },
    { id: 'sfi', label: SHELF_LANE_LABEL.sfi, count: ROWS.filter(r => r.lane === 'sfi').length },
    { id: 'shocks', label: SHELF_LANE_LABEL.shocks, count: ROWS.filter(r => r.lane === 'shocks').length },
    { id: 'extracted', label: 'On this shelf', count: ROWS.filter(r => r.extracted).length },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`font-serif text-[10px] font-medium px-2 py-1 rounded-sm border ${
              filter === f.id
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {f.label} · {f.count}
          </button>
        ))}
      </div>

      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-baseline justify-between gap-2 mb-2 pb-1.5 border-b-2 border-rule">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Every book, by the job it does
          </div>
          <Link
            href="/complexecon"
            className="font-mono text-[10px] uppercase tracking-[0.5px] text-ink-muted hover:text-burgundy"
          >
            Track it &rarr;
          </Link>
        </div>

        <div className="hidden md:flex gap-3 pb-1 mb-1 border-b border-rule-light">
          <div className="w-44 shrink-0 font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
            Job to be done
          </div>
          <div className="w-52 shrink-0 font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
            Book
          </div>
          <div className="flex-1 font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
            Why this one
          </div>
        </div>

        {rows.map(({ item, topic, extracted }) => (
          <div
            key={item.id}
            className="flex flex-col md:flex-row gap-1 md:gap-3 py-2 border-b border-rule-light last:border-0"
          >
            <div className="w-full md:w-44 shrink-0">
              <div className="text-[11px] font-semibold text-ink leading-tight">{item.jobToBeDone}</div>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${TIER_STYLE[item.tier]}`}
                >
                  {item.tier}
                </span>
                {extracted && (
                  <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-green-bg text-green-ink border-green-ink/20">
                    extracted
                  </span>
                )}
              </div>
            </div>
            <div className="w-full md:w-52 shrink-0">
              <div className="text-[11px] text-ink leading-tight italic">{item.title}</div>
              <div className="text-[10px] text-ink-muted">
                {item.author}, {item.year}
              </div>
              <div className="text-[10px] text-ink-faint">{topic}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-ink-muted leading-relaxed">{item.note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Terms the list assumes
        </div>
        <div className="space-y-1.5">
          {SHELF_GLOSSARY.map(g => (
            <div key={g.term}>
              <span className="text-[11px] font-semibold text-ink">{g.term}</span>
              <span className="text-[10px] text-ink-muted leading-relaxed"> &mdash; {g.definition}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
