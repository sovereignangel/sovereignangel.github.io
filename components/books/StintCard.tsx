'use client'

import { useState } from 'react'
import type { ReadingStint, StintPriority } from '@/lib/books/reading-order'
import type { BookMeta } from '@/lib/books/types'

interface StintCardProps {
  stint: ReadingStint
  meta?: BookMeta
  onOpen: (slug: string, page?: number) => void
}

const PRIORITY_STYLE: Record<StintPriority, string> = {
  read: 'bg-burgundy-bg text-burgundy border-burgundy/20',
  skim: 'bg-amber-bg text-amber-ink border-amber-ink/20',
  skip: 'bg-transparent text-ink-faint border-rule',
}

export default function StintCard({ stint, meta, onOpen }: StintCardProps) {
  const [open, setOpen] = useState(stint.order === 1)
  const available = !!meta

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      {/* Header */}
      <div className="flex items-start gap-3 pb-1.5 mb-2 border-b-2 border-rule">
        <div className="font-serif text-[22px] font-bold text-burgundy leading-none w-6 shrink-0">
          {stint.order}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-[13px] font-semibold text-ink">{stint.title}</div>
          <div className="text-[10px] text-ink-muted">{stint.author}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[10px] text-ink-muted">{stint.window.split(' · ')[0]}</div>
          <div className="text-[10px] text-ink-faint">{stint.effort.split(' · ')[0]}</div>
        </div>
      </div>

      {/* Why here */}
      <div className="mb-2">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Why here
        </div>
        <p className="text-[11px] text-ink leading-relaxed">{stint.why}</p>
      </div>

      {/* Scope + question + product */}
      <div className="space-y-1.5 mb-2">
        <div className="flex gap-2">
          <span className="text-[10px] text-ink-muted w-20 shrink-0">Scope</span>
          <span className="text-[10px] text-ink flex-1">{stint.scope}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] text-ink-muted w-20 shrink-0">Window</span>
          <span className="text-[10px] text-ink flex-1">{stint.window}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] text-ink-muted w-20 shrink-0">Produces</span>
          <span className="text-[10px] text-ink flex-1">{stint.produces}</span>
        </div>
      </div>

      <div className="border-l-2 border-burgundy/30 pl-2 py-0.5 mb-2">
        <div className="text-[10px] text-ink-muted mb-0.5">The question to carry</div>
        <div className="text-[11px] text-ink italic leading-relaxed">{stint.questionToCarry}</div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => onOpen(stint.slug)}
          disabled={!available}
          className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Open in reader
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint"
        >
          {open ? 'Hide route' : `Route · ${stint.chapters.length} entries`}
        </button>
        {meta && (
          <span className="font-mono text-[10px] text-ink-faint self-center ml-auto">
            {meta.totalPages} pp
          </span>
        )}
        {!available && (
          <span className="text-[10px] text-amber-ink self-center ml-auto">
            Not extracted on this host
          </span>
        )}
      </div>

      {/* Chapter route */}
      {open && (
        <div className="border-t border-rule-light pt-2 space-y-1">
          {stint.chapters.map(ch => (
            <div key={ch.label} className="flex items-start gap-2 py-1">
              <span
                className={`shrink-0 font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border mt-0.5 ${PRIORITY_STYLE[ch.priority]}`}
              >
                {ch.priority}
              </span>
              <button
                onClick={() => onOpen(stint.slug, ch.page)}
                disabled={!available}
                className="font-mono text-[10px] text-burgundy hover:underline shrink-0 mt-0.5 w-11 text-left disabled:text-ink-faint disabled:no-underline"
              >
                p.{ch.page}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-ink leading-tight">{ch.label}</div>
                <div className="text-[10px] text-ink-muted leading-relaxed mt-0.5">{ch.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
