'use client'

import { useState } from 'react'
import { READING_ORDER } from '@/lib/books/reading-order'
import { SHOCK_QUEUE, QUEUE_GLOSSARY, LANE_LABEL } from '@/lib/books/queue'
import type { BookLane, QueueStatus } from '@/lib/books/queue'

interface ListRow {
  id: string
  lane: BookLane
  jobToBeDone: string
  title: string
  author: string
  whyThisOne: string
  status: QueueStatus
}

const STATUS_STYLE: Record<QueueStatus, string> = {
  shelf: 'bg-green-bg text-green-ink border-green-ink/20',
  queued: 'bg-amber-bg text-amber-ink border-amber-ink/20',
}

const STATUS_LABEL: Record<QueueStatus, string> = {
  shelf: 'on shelf',
  queued: 'to acquire',
}

/** The shelf and the queue, flattened to one list keyed by job. */
function buildRows(): ListRow[] {
  const shelf: ListRow[] = READING_ORDER.map(stint => ({
    id: stint.id,
    lane: 'sfi',
    jobToBeDone: stint.jobToBeDone,
    title: stint.title,
    author: stint.author,
    whyThisOne: stint.why,
    status: 'shelf',
  }))
  const queue: ListRow[] = SHOCK_QUEUE.map(b => ({
    id: b.id,
    lane: b.lane,
    jobToBeDone: b.jobToBeDone,
    title: b.title,
    author: b.author,
    whyThisOne: b.whyThisOne,
    status: b.status,
  }))
  return [...shelf, ...queue]
}

type Filter = 'all' | BookLane

export default function FullListView() {
  const [filter, setFilter] = useState<Filter>('all')
  const rows = buildRows().filter(r => filter === 'all' || r.lane === filter)
  const lanes: Filter[] = ['all', 'sfi', 'shocks']

  return (
    <div className="space-y-3">
      {/* Lane filter */}
      <div className="flex gap-1">
        {lanes.map(l => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`font-serif text-[10px] font-medium px-2 py-1 rounded-sm border ${
              filter === l
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {l === 'all' ? `All · ${buildRows().length}` : LANE_LABEL[l]}
          </button>
        ))}
      </div>

      {/* The list */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Every book, by the job it does
        </div>

        {/* Column heads */}
        <div className="hidden md:flex gap-3 pb-1 mb-1 border-b border-rule-light">
          <div className="w-40 shrink-0 font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
            Job to be done
          </div>
          <div className="w-52 shrink-0 font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
            Book
          </div>
          <div className="flex-1 font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
            Why this one
          </div>
        </div>

        <div>
          {rows.map(row => (
            <div
              key={row.id}
              className="flex flex-col md:flex-row gap-1 md:gap-3 py-2 border-b border-rule-light last:border-0"
            >
              <div className="w-full md:w-40 shrink-0">
                <div className="text-[11px] font-semibold text-ink leading-tight">{row.jobToBeDone}</div>
                <span
                  className={`inline-block mt-1 font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${STATUS_STYLE[row.status]}`}
                >
                  {STATUS_LABEL[row.status]}
                </span>
              </div>
              <div className="w-full md:w-52 shrink-0">
                <div className="text-[11px] text-ink leading-tight italic">{row.title}</div>
                <div className="text-[10px] text-ink-muted">{row.author}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-ink-muted leading-relaxed">{row.whyThisOne}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Glossary */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Terms the list assumes
        </div>
        <div className="space-y-1.5">
          {QUEUE_GLOSSARY.map(g => (
            <div key={g.term}>
              <span className="text-[11px] font-semibold text-ink">{g.term}</span>
              <span className="text-[10px] text-ink-muted leading-relaxed"> — {g.definition}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
