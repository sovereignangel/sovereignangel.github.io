'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/components/auth/AuthProvider'
import { authFetch } from '@/lib/auth-fetch'
import BookSearch from '@/components/books/BookSearch'
import StintCard from '@/components/books/StintCard'
import { READING_ORDER, ORDER_ARGUMENT, SCHEDULE } from '@/lib/books/reading-order'
import type { BookMeta } from '@/lib/books/types'
import type { ReaderSource } from '@/components/thesis/reader/ReaderOverlay'

const ReaderOverlay = dynamic(() => import('@/components/thesis/reader/ReaderOverlay'), { ssr: false })

type ActiveBook = { source: ReaderSource; slug: string; page?: number } | null
type Tab = 'order' | 'search'

export default function BooksPage() {
  const { user, signIn, loading: authLoading } = useAuth()
  const [books, setBooks] = useState<BookMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<ActiveBook>(null)
  const [tab, setTab] = useState<Tab>('order')

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    authFetch('/api/books')
      .then(r => r.json())
      .then(d => setBooks(d.books || []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false))
  }, [user?.uid])

  const openBook = useCallback((slug: string, page?: number) => {
    const meta = books.find(b => b.slug === slug)
    if (!meta) return
    setActive({
      slug,
      page,
      source: {
        title: meta.title,
        author: meta.author,
        // Stable URL — highlights and notes persist across sessions, unlike a blob upload.
        sourceUrl: `/api/books/${slug}/file`,
        sourceType: 'direct_url',
      },
    })
  }, [books])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[11px] text-ink-muted">Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white border border-rule rounded-sm p-8 max-w-sm w-full text-center">
          <h1 className="font-serif text-[22px] font-bold text-ink mb-1">Books</h1>
          <p className="text-[11px] text-ink-muted mb-6">The local shelf, in order</p>
          <button
            onClick={signIn}
            className="w-full bg-burgundy text-paper font-serif text-[13px] font-semibold rounded-sm px-4 py-2.5 hover:bg-burgundy/90 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  if (active) {
    return (
      <ReaderOverlay
        source={active.source}
        bookSlug={active.slug}
        initialPage={active.page}
        onClose={() => setActive(null)}
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-serif text-[22px] font-bold text-ink">Books</h1>
        <p className="text-[11px] text-ink-muted">
          Three volumes, sequenced against Abu Dhabi — January 3, 2027
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-rule pb-2 mb-4">
        {(['order', 'search'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-serif text-[16px] py-2 transition-colors ${
              tab === t
                ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-2.5'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t === 'order' ? 'The Order' : 'Search'}
          </button>
        ))}
      </div>

      {loading && <div className="text-[11px] text-ink-muted py-8 text-center">Loading the shelf...</div>}

      {!loading && books.length === 0 && (
        <div className="bg-white border border-amber-ink/20 rounded-sm p-3 mb-4">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-amber-ink mb-1">
            Corpus not on this host
          </div>
          <p className="text-[10px] text-ink-muted leading-relaxed">
            The PDFs and their extracted text are gitignored — they are copyrighted, and never deployed.
            Run <span className="font-mono text-ink">node scripts/books/extract.mjs</span> locally to build the
            shelf. The order below stands either way.
          </p>
        </div>
      )}

      {tab === 'search' && !loading && books.length > 0 && (
        <BookSearch onOpenHit={(slug, page) => openBook(slug, page)} />
      )}

      {tab === 'order' && (
        <>
          {/* Why this order */}
          <div className="bg-white border border-rule rounded-sm p-3 mb-3">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
              Why this order
            </div>
            <div className="space-y-2.5">
              {ORDER_ARGUMENT.map(arg => (
                <div key={arg.head}>
                  <div className="text-[11px] font-semibold text-ink mb-0.5">{arg.head}</div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">{arg.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* The three stints */}
          <div className="space-y-3">
            {READING_ORDER.map(stint => (
              <StintCard
                key={stint.id}
                stint={stint}
                meta={books.find(b => b.slug === stint.slug)}
                onOpen={openBook}
              />
            ))}
          </div>

          {/* Schedule */}
          <div className="bg-white border border-rule rounded-sm p-3 mt-3">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
              Fitted to the calendar
            </div>
            <div className="space-y-1.5">
              {SCHEDULE.map(row => (
                <div key={row.window} className="flex items-start gap-2 py-1 border-b border-rule-light last:border-0">
                  <div className="w-24 shrink-0">
                    <div className="font-mono text-[10px] text-ink">{row.window}</div>
                    <div className="text-[10px] text-ink-faint">{row.place}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-ink leading-tight">{row.work}</div>
                    <div className="text-[10px] text-ink-muted leading-relaxed mt-0.5">{row.constraint}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
