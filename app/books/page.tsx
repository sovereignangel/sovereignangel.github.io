'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/components/auth/AuthProvider'
import { authFetch } from '@/lib/auth-fetch'
import BookSearch from '@/components/books/BookSearch'
import StintCard from '@/components/books/StintCard'
import FullListView from '@/components/books/FullListView'
import BookNotes from '@/components/books/BookNotes'
import ShelfView from '@/components/books/ShelfView'
import { READING_ORDER, ORDER_ARGUMENT, SCHEDULE, LONG_FORM } from '@/lib/books/reading-order'
import type { BookMeta } from '@/lib/books/types'
import { getCachedPdf, downloadPdf, listCachedPdfs } from '@/lib/books/pdf-cache'
import type { ReaderSource } from '@/components/thesis/reader/ReaderOverlay'

const ReaderOverlay = dynamic(() => import('@/components/thesis/reader/ReaderOverlay'), { ssr: false })

const SHELF_SLUGS = READING_ORDER.map(s => s.slug)

/** Identity of the file a device holds offline; changes whenever an upload replaces it. */
function pdfVersion(meta: BookMeta): string {
  return `${meta.uploadedSize ?? meta.sourceSize}`
}

type ActiveBook = { source: ReaderSource; slug: string; page?: number } | null
type Tab = 'shelf' | 'order' | 'list' | 'search' | 'notes'

export default function BooksPage() {
  const { user, signIn, loading: authLoading } = useAuth()
  const [books, setBooks] = useState<BookMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<ActiveBook>(null)
  const [tab, setTab] = useState<Tab>('shelf')

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    authFetch('/api/books')
      .then(r => r.json())
      .then(d => setBooks(d.books || []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false))
  }, [user?.uid])

  const [opening, setOpening] = useState<{ slug: string; progress: number | null } | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)
  const [offline, setOffline] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    listCachedPdfs().then(setOffline)
  }, [active])

  // Blob URLs hold the whole PDF in memory; release it when the reader closes.
  const blobUrlRef = useRef<string | null>(null)
  useEffect(() => {
    if (active || !blobUrlRef.current) return
    URL.revokeObjectURL(blobUrlRef.current)
    blobUrlRef.current = null
  }, [active])

  /**
   * Where pdf.js loads the book from. In dev, the local streaming route. When
   * deployed, a copy kept on this device, downloaded once from a signed link.
   */
  const resolveFileUrl = useCallback(async (meta: BookMeta): Promise<string> => {
    const version = pdfVersion(meta)
    const cached = await getCachedPdf(meta.slug, version)
    if (cached) return URL.createObjectURL(cached)

    const res = await authFetch(`/api/books/${meta.slug}/url`)
    if (!res.ok) throw new Error(res.status === 403 ? 'This shelf is private.' : 'Could not get the file.')
    const { url } = (await res.json()) as { url: string }
    if (url.startsWith('/')) return url

    setOpening({ slug: meta.slug, progress: 0 })
    const blob = await downloadPdf(meta.slug, version, url, p => setOpening({ slug: meta.slug, progress: p }))
    return URL.createObjectURL(blob)
  }, [])

  const openBook = useCallback(async (slug: string, page?: number) => {
    const meta = books.find(b => b.slug === slug)
    if (!meta || opening) return
    setOpening({ slug, progress: null })
    setOpenError(null)
    try {
      const fileUrl = await resolveFileUrl(meta)
      if (fileUrl.startsWith('blob:')) blobUrlRef.current = fileUrl
      setActive({
        slug,
        page,
        source: {
          title: meta.title,
          author: meta.author,
          // Stable identity — highlights, bookmarks and the saved page persist on
          // it, while fileUrl (a device copy when deployed) is free to change.
          sourceUrl: `/api/books/${slug}/file`,
          fileUrl,
          sourceType: 'direct_url',
        },
      })
    } catch (err) {
      setOpenError(`Could not open ${meta.title}. ${err instanceof Error ? err.message : ''}`)
    } finally {
      setOpening(null)
    }
  }, [books, opening, resolveFileUrl])

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
          Three volumes sequenced against Abu Dhabi — January 3, 2027. The full list, by job, under The List.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-x-4 border-b border-rule pb-2 mb-4">
        {(['shelf', 'order', 'list', 'search', 'notes'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-serif text-[16px] py-2 transition-colors ${
              tab === t
                ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-2.5'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t === 'shelf' ? 'Shelf' : t === 'order' ? 'The Order' : t === 'list' ? 'The List' : t === 'search' ? 'Search' : 'Notes'}
          </button>
        ))}
      </div>

      {loading && tab !== 'list' && <div className="text-[11px] text-ink-muted py-8 text-center">Loading the shelf...</div>}

      {!loading && tab !== 'list' && books.length === 0 && (
        <div className="bg-white border border-amber-ink/20 rounded-sm p-3 mb-4">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-amber-ink mb-1">
            Shelf is empty
          </div>
          <p className="text-[10px] text-ink-muted leading-relaxed">
            The PDFs are copyrighted and never go through git. Deployed, the shelf reads from the private
            books bucket — run <span className="font-mono text-ink">node scripts/books/upload.mjs</span> locally
            to fill it. The order below stands either way.
          </p>
        </div>
      )}

      {openError && (
        <div className="bg-white border border-red-ink/20 rounded-sm p-2 mb-3 text-[10px] text-red-ink">{openError}</div>
      )}

      {tab === 'shelf' && !loading && books.length > 0 && (
        <ShelfView
          books={books}
          opening={opening}
          offline={new Set(books.filter(b => offline.get(b.slug) === pdfVersion(b)).map(b => b.slug))}
          onOpen={slug => openBook(slug)}
        />
      )}

      {tab === 'list' && <FullListView />}

      {tab === 'search' && !loading && books.length > 0 && (
        <BookSearch onOpenHit={(slug, page) => openBook(slug, page)} />
      )}

      {tab === 'notes' && !loading && (
        <BookNotes slugs={SHELF_SLUGS} onOpen={openBook} />
      )}

      {tab === 'order' && (
        <>
          {/* Why this order. The argument is read once and the shelf is read
              daily, so it opens on demand rather than sitting above everything. */}
          <details className="bg-white border border-rule rounded-sm p-3 mb-3 group">
            <summary className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy cursor-pointer list-none marker:hidden">
              Why this order
              <span className="ml-1.5 font-sans text-[10px] font-normal normal-case tracking-normal text-ink-faint group-open:hidden">
                Mauss, then Arthur, then Grinold
              </span>
            </summary>
            <div className="space-y-2.5 mt-2 pt-1.5 border-t-2 border-rule">
              {ORDER_ARGUMENT.map(arg => (
                <div key={arg.head}>
                  <div className="text-[11px] font-semibold text-ink mb-0.5">{arg.head}</div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">{arg.body}</p>
                </div>
              ))}
            </div>
          </details>

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

          {/* Research and long-form. Below the stints because it is a shelf,
              not a queue — reached for by question, never worked through. */}
          <div className="bg-white border border-rule rounded-sm p-3 mt-3">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
              Research &amp; long form
            </div>
            <div className="space-y-2.5">
              {LONG_FORM.map(item => (
                <details key={item.id} className="group border-b border-rule-light last:border-0 pb-1.5 last:pb-0">
                  <summary className="flex items-baseline gap-1.5 flex-wrap cursor-pointer list-none marker:hidden">
                    <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20 shrink-0">
                      {item.kind}
                    </span>
                    <span className="text-[11px] font-semibold text-ink group-hover:text-burgundy transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-ink-muted">{item.author} &middot; {item.year}</span>
                    <span className="text-[10px] text-ink-faint ml-auto">{item.jobToBeDone}</span>
                  </summary>
                  <p className="text-[11px] text-ink-muted leading-relaxed mt-1">{item.why}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[10px] text-burgundy hover:underline mt-1"
                  >
                    Open &rarr;
                  </a>
                </details>
              ))}
            </div>
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
