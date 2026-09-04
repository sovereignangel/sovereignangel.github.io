'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Masthead, Meta } from '@/components/complexecon/tearsheet'
import { MEMOS } from '@/lib/complexecon/memos'

export default function MemosSheet() {
  const [q, setQ] = useState('')

  const memos = useMemo(() => {
    const sorted = [...MEMOS].sort((a, b) => b.date.localeCompare(a.date))
    const needle = q.trim().toLowerCase()
    if (!needle) return sorted
    return sorted.filter(
      m =>
        m.title.toLowerCase().includes(needle) ||
        m.summary.toLowerCase().includes(needle) ||
        m.tags.some(t => t.toLowerCase().includes(needle))
    )
  }, [q])

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-[1320px] px-3 py-5 md:px-5 md:py-7">
        <Masthead
          kicker="Lori Corpuz · Research Memos"
          title="Memos"
          meta="primers, dossiers, working notes · newest first"
          active="memos"
        />

        <div className="mb-3 border border-rule bg-white px-3 py-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search memos — title, summary, tags..."
            aria-label="Search memos"
            className="w-full bg-transparent font-serif text-[18px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>

        <div className="border border-rule bg-white">
          {memos.length === 0 && (
            <div className="px-3 py-4 text-[16px] text-ink-muted">
              Nothing matches &ldquo;{q}&rdquo; — try a person, a topic, or an acronym.
            </div>
          )}
          {memos.map(m => (
            <Link
              key={m.slug}
              href={`/complexecon/memos/${m.slug}`}
              className="block border-b border-rule-light px-3 py-2.5 transition-colors last:border-b-0 hover:bg-paper"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-serif text-[20px] font-semibold text-ink">{m.title}</span>
                <Meta>{m.date}</Meta>
              </span>
              <p className="mt-0.5 max-w-[90ch] text-[15.5px] leading-relaxed text-ink-muted">{m.summary}</p>
              <span className="mt-1 flex flex-wrap gap-1.5">
                {m.tags.map(t => (
                  <span
                    key={t}
                    className="rounded-sm border border-rule px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted"
                  >
                    {t}
                  </span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
