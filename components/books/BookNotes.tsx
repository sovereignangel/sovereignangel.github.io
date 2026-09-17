'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getReadingSessions } from '@/lib/firestore/reading-sessions'
import type { ReadingSession } from '@/lib/types/reading'

interface BookNotesProps {
  /** Slugs on the shelf, in reading order — everything else is filtered out. */
  slugs: string[]
  onOpen: (slug: string, page: number) => void
}

type Entry =
  | { kind: 'highlight'; slug: string; page: number; text: string; note?: string; color: string; at: string }
  | { kind: 'note'; slug: string; text: string; at: string }
  | { kind: 'question'; slug: string; page?: number; text: string; answer: string; at: string }

const COLOR_DOT: Record<string, string> = {
  burgundy: 'bg-burgundy',
  green: 'bg-green-ink',
  amber: 'bg-amber-ink',
}

/** Reading sessions are keyed by sourceUrl; local books all live under /api/books/. */
function slugOf(session: ReadingSession): string | null {
  const m = session.sourceUrl.match(/^\/api\/books\/([a-z0-9-]+)\/file$/)
  return m ? m[1] : null
}

export default function BookNotes({ slugs, onOpen }: BookNotesProps) {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ReadingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    getReadingSessions(user.uid)
      .then(all => setSessions(all.filter(s => {
        const slug = slugOf(s)
        return slug !== null && slugs.includes(slug)
      })))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [user?.uid, slugs])

  const byBook = useMemo(() => {
    const out = new Map<string, { title: string; entries: Entry[] }>()
    for (const s of sessions) {
      const slug = slugOf(s)
      if (!slug) continue
      const entries: Entry[] = [
        ...s.highlights.map(h => ({
          kind: 'highlight' as const,
          slug,
          page: h.position.pageNumber,
          text: h.selectedText,
          note: h.note,
          color: h.color,
          at: h.createdAt,
        })),
        ...s.notes.map(n => ({ kind: 'note' as const, slug, text: n, at: s.lastReadAt })),
        ...s.questions.map(q => ({
          kind: 'question' as const,
          slug,
          page: q.pageNumber,
          text: q.question,
          answer: q.answer,
          at: q.createdAt,
        })),
      ]
      // Reading order within a book is page order, not capture order.
      entries.sort((a, b) => {
        const pa = 'page' in a && a.page ? a.page : Number.MAX_SAFE_INTEGER
        const pb = 'page' in b && b.page ? b.page : Number.MAX_SAFE_INTEGER
        return pa - pb
      })
      out.set(slug, { title: s.title, entries })
    }
    return out
  }, [sessions])

  const total = [...byBook.values()].reduce((a, b) => a + b.entries.length, 0)

  if (loading) return <div className="text-[11px] text-ink-muted py-8 text-center">Loading notes...</div>

  if (!total) {
    return (
      <div className="text-center py-12">
        <div className="text-[13px] text-ink-muted mb-1">Nothing captured yet</div>
        <div className="text-[11px] text-ink-faint">
          Select text in the reader to highlight, or use the Notes and Ask panels. Everything lands here.
        </div>
      </div>
    )
  }

  const shown = [...byBook.entries()]
    .filter(([slug]) => !filter || slug === filter)
    .sort(([a], [b]) => slugs.indexOf(a) - slugs.indexOf(b))

  return (
    <div>
      {byBook.size > 1 && (
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setFilter(null)}
            className={`font-serif text-[10px] font-medium px-2 py-1 rounded-sm border ${
              !filter ? 'bg-burgundy text-paper border-burgundy' : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            All · {total}
          </button>
          {[...byBook.entries()].map(([slug, b]) => (
            <button
              key={slug}
              onClick={() => setFilter(slug)}
              className={`font-serif text-[10px] font-medium px-2 py-1 rounded-sm border ${
                filter === slug ? 'bg-burgundy text-paper border-burgundy' : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {b.title.split(':')[0]} · {b.entries.length}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {shown.map(([slug, book]) => (
          <div key={slug} className="bg-white border border-rule rounded-sm p-3">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
              {book.title}
            </div>
            <div className="space-y-2">
              {book.entries.map((e, i) => (
                <div key={i} className="border-l-2 border-rule-light pl-2 py-0.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {e.kind === 'highlight' && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${COLOR_DOT[e.color] || 'bg-burgundy'}`} />
                    )}
                    <span className="font-mono text-[8px] uppercase text-ink-faint">{e.kind}</span>
                    {'page' in e && e.page && (
                      <button
                        onClick={() => onOpen(slug, e.page!)}
                        className="font-mono text-[10px] text-burgundy hover:underline"
                      >
                        p.{e.page}
                      </button>
                    )}
                  </div>
                  {e.kind === 'highlight' && (
                    <>
                      <div className="text-[11px] text-ink leading-relaxed">&ldquo;{e.text}&rdquo;</div>
                      {e.note && <div className="text-[10px] text-ink-muted italic mt-0.5">{e.note}</div>}
                    </>
                  )}
                  {e.kind === 'note' && <div className="text-[11px] text-ink leading-relaxed">{e.text}</div>}
                  {e.kind === 'question' && (
                    <>
                      <div className="text-[11px] font-medium text-ink leading-relaxed">{e.text}</div>
                      <div className="text-[10px] text-ink-muted leading-relaxed mt-0.5 whitespace-pre-wrap">{e.answer}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
