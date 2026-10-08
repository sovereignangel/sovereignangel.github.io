'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getReadingSessions } from '@/lib/firestore/reading-sessions'
import type { BookMeta } from '@/lib/books/types'
import type { ReadingSession } from '@/lib/types'

/**
 * Every PDF in app/books/, with where you left off. The default /books view:
 * open any volume, and a book you have started opens on the page you closed it.
 * Progress is the reader's own reading_sessions doc, keyed by the stable
 * /api/books/<slug>/file URL.
 */

interface ShelfViewProps {
  books: BookMeta[]
  /** The book being fetched, with download progress once it starts. */
  opening?: { slug: string; progress: number | null } | null
  /** Slugs with a current copy on this device — open instantly, read offline. */
  offline?: Set<string>
  onOpen: (slug: string) => void
}

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ShelfView({ books, opening, offline, onOpen }: ShelfViewProps) {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Map<string, ReadingSession>>(new Map())

  useEffect(() => {
    if (!user?.uid) return
    getReadingSessions(user.uid)
      .then(all => {
        const bySource = new Map<string, ReadingSession>()
        // Newest first, so the first session per source is the live one.
        for (const s of all) if (!bySource.has(s.sourceUrl)) bySource.set(s.sourceUrl, s)
        setSessions(bySource)
      })
      .catch(() => setSessions(new Map()))
  }, [user?.uid])

  const rows = books
    .map(book => ({ book, session: sessions.get(`/api/books/${book.slug}/file`) }))
    .sort((a, b) => {
      const at = a.session?.lastReadAt || ''
      const bt = b.session?.lastReadAt || ''
      if (at !== bt) return bt.localeCompare(at)
      return a.book.title.localeCompare(b.book.title)
    })

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule flex items-baseline">
        On the shelf
        <span className="ml-auto font-mono text-[10px] font-normal normal-case tracking-normal text-ink-faint">
          {books.length} volumes
        </span>
      </div>

      <div className="divide-y divide-rule-light">
        {rows.map(({ book, session }) => {
          const total = session?.totalPages || book.totalPages || 0
          const page = session?.currentPage || 0
          const pct = total && page ? Math.min(100, Math.round((page / total) * 100)) : 0
          const highlights = session?.highlights?.length || 0
          const bookmarks = session?.bookmarks?.length || 0
          return (
            <button
              key={book.slug}
              onClick={() => onOpen(book.slug)}
              className="w-full text-left py-2 group flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-ink group-hover:text-burgundy transition-colors leading-snug">
                  {book.title}
                </div>
                <div className="text-[10px] text-ink-muted truncate">
                  {book.author}{book.year ? ` · ${book.year}` : ''}
                  {offline?.has(book.slug) && (
                    <span className="ml-1.5 font-mono text-[8px] uppercase px-1 py-px rounded-sm border bg-green-bg text-green-ink border-green-ink/20 align-middle">
                      offline
                    </span>
                  )}
                </div>
                {session && page > 0 ? (
                  <div className="mt-1">
                    <div className="h-[3px] bg-rule-light rounded-sm overflow-hidden">
                      <div className="h-full bg-burgundy" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-x-2 mt-0.5 font-mono text-[10px] text-ink-faint">
                      <span>p.{page}{total ? ` / ${total}` : ''}</span>
                      {highlights > 0 && <span>{highlights} highlight{highlights === 1 ? '' : 's'}</span>}
                      {bookmarks > 0 && <span>{bookmarks} bookmark{bookmarks === 1 ? '' : 's'}</span>}
                      <span>{ago(session.lastReadAt)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-[10px] text-ink-faint mt-0.5">
                    {book.totalPages ? `${book.totalPages} pp · ` : ''}not started
                    {!book.extracted && ' · not yet searchable'}
                  </div>
                )}
              </div>
              <span
                className={`shrink-0 font-serif text-[10px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                  session && page > 1
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'text-ink-muted border-rule group-hover:border-ink-faint'
                }`}
              >
                {opening?.slug === book.slug
                  ? opening.progress !== null
                    ? `Saving ${Math.round(opening.progress * 100)}%`
                    : 'Opening...'
                  : session && page > 1 ? `Resume p.${page}` : 'Read'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
