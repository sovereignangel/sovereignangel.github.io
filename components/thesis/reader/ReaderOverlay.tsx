'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useReadingSession } from '@/hooks/useReadingSession'
import ReaderSidebar from './ReaderSidebar'
import type { HighlightRect, DocumentSourceType } from '@/lib/types/reading'

const PDFReaderView = dynamic(() => import('./PDFReaderView'), { ssr: false })

export interface ReaderSource {
  title: string
  author: string
  /** Identity of the document — the reading session is keyed on it. */
  sourceUrl: string
  /**
   * Where pdf.js actually fetches from, when that differs from sourceUrl — a
   * signed bucket link that changes every few hours while the session key must not.
   */
  fileUrl?: string
  sourceType: DocumentSourceType
  linkedPaperId?: string
  linkedProfessorId?: string
}

interface ReaderOverlayProps {
  source: ReaderSource
  onClose: () => void
  /** Jump here on open (e.g. a search hit), overriding the saved position once. */
  initialPage?: number
  /** Local corpus slug — enables whole-book retrieval in the Ask panel. */
  bookSlug?: string
}

type HighlightColor = 'burgundy' | 'green' | 'amber'

export default function ReaderOverlay({ source, onClose, initialPage, bookSlug }: ReaderOverlayProps) {
  // Blob URLs (uploads), data URLs and same-origin paths (local books) don't need proxying
  // A fileUrl is already loadable (signed bucket link with CORS), never proxied.
  const needsProxy =
    !source.fileUrl &&
    !source.sourceUrl.startsWith('blob:') &&
    !source.sourceUrl.startsWith('data:') &&
    !source.sourceUrl.startsWith('/')
  const proxyUrl = source.fileUrl
    ? source.fileUrl
    : needsProxy
      ? `/api/archive-proxy?url=${encodeURIComponent(source.sourceUrl)}`
      : source.sourceUrl

  const {
    session,
    loading,
    initSession,
    setPage,
    setTotalPages,
    addHighlight,
    removeHighlight,
    updateHighlightNote,
    addNote,
    addQuestion,
    toggleBookmark,
    updateBookmarkLabel,
  } = useReadingSession(source.sourceUrl)

  const [pendingSelection, setPendingSelection] = useState<{
    text: string
    rects: HighlightRect[]
    pageNumber: number
    screenPos: { x: number; y: number }
  } | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPageText, setCurrentPageText] = useState('')
  // The panel would eat a phone screen; start it closed there.
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)
  const [jumpRequest, setJumpRequest] = useState<{ page: number; seq: number } | null>(null)
  const [commenting, setCommenting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentColor, setCommentColor] = useState<HighlightColor>('burgundy')
  const popupRef = useRef<HTMLDivElement>(null)
  const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  const currentPage = session?.currentPage || 1

  const highlights = session?.highlights || []
  const notes = session?.notes || []
  const questions = session?.questions || []
  const bookmarks = session?.bookmarks || []
  const bookmarkedPages = new Set(bookmarks.map(b => b.page))

  const jumpTo = useCallback((page: number) => {
    setJumpRequest({ page, seq: Date.now() })
  }, [])

  const handleTotalPages = useCallback((total: number) => {
    setTotalPages(total)
    // Init session on first load
    if (!session) {
      initSession({
        title: source.title,
        author: source.author,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
        totalPages: total,
        linkedPaperId: source.linkedPaperId,
        linkedProfessorId: source.linkedProfessorId,
      })
    }
  }, [session, initSession, setTotalPages, source])

  const handleTextSelected = useCallback((text: string, rects: HighlightRect[], pageNumber: number, screenPos: { x: number; y: number }) => {
    setPendingSelection({ text, rects, pageNumber, screenPos })
  }, [])

  const handleHighlight = useCallback((color: HighlightColor, note?: string) => {
    if (!pendingSelection) return
    addHighlight({
      position: {
        pageNumber: pendingSelection.pageNumber,
        rects: pendingSelection.rects,
      },
      selectedText: pendingSelection.text,
      color,
      ...(note?.trim() ? { note: note.trim() } : {}),
    })
    setPendingSelection(null)
    setCommenting(false)
    setCommentText('')
    window.getSelection()?.removeAllRanges()
  }, [pendingSelection, addHighlight])

  const dismissSelection = useCallback(() => {
    setPendingSelection(null)
    setCommenting(false)
    setCommentText('')
  }, [])

  const handlePageTextExtracted = useCallback((_pageNumber: number, text: string) => {
    setCurrentPageText(text)
  }, [])

  // Close popup when clicking outside
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (pendingSelection && popupRef.current && !popupRef.current.contains(e.target as Node)) {
      // A fresh selection's own mouseup lands here too; only an empty click dismisses.
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) dismissSelection()
    }
  }, [pendingSelection, dismissSelection])

  return (
    <div
      className="fixed inset-0 z-50 bg-cream flex flex-col"
      onClick={handleOverlayClick}
    >
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-rule bg-white shrink-0">
        <button
          onClick={onClose}
          className="text-[10px] font-serif font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
        >
          Close
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-serif text-[13px] font-semibold text-burgundy truncate">
            {source.title}
          </div>
          <div className="text-[9px] text-ink-muted">{source.author}</div>
        </div>

        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`text-[10px] font-serif px-2 py-1 rounded-sm border transition-colors ${
            showSearch
              ? 'bg-burgundy text-paper border-burgundy'
              : 'border-rule text-ink-muted hover:text-ink'
          }`}
        >
          Search
        </button>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`text-[10px] font-serif px-2 py-1 rounded-sm border transition-colors ${
            sidebarOpen
              ? 'bg-burgundy text-paper border-burgundy'
              : 'border-rule text-ink-muted hover:text-ink'
          }`}
        >
          {sidebarOpen ? 'Hide Panel' : 'Show Panel'}
        </button>
      </div>

      {/* Search bar (conditional) */}
      {showSearch && (
        <div className="px-3 py-1.5 border-b border-rule-light bg-cream/50 shrink-0">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search in document..."
            className="w-full max-w-md text-[10px] border border-rule rounded-sm px-2 py-1 bg-white text-ink"
            autoFocus
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex min-h-0 relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[11px] text-ink-muted">Loading reader...</span>
          </div>
        ) : (
          <>
            <PDFReaderView
              url={proxyUrl}
              currentPage={currentPage}
              highlights={highlights}
              onPageChange={setPage}
              onTotalPages={handleTotalPages}
              onTextSelected={handleTextSelected}
              onPageTextExtracted={handlePageTextExtracted}
              searchQuery={searchQuery}
              startPage={initialPage ?? session?.currentPage}
              jumpRequest={jumpRequest}
              bookmarkedPages={bookmarkedPages}
              onToggleBookmark={toggleBookmark}
            />

            {sidebarOpen && (
              <ReaderSidebar
                highlights={highlights}
                notes={notes}
                questions={questions}
                bookmarks={bookmarks}
                documentTitle={source.title}
                currentPageText={currentPageText}
                currentPage={currentPage}
                bookSlug={bookSlug}
                onJumpToPage={jumpTo}
                onToggleBookmark={toggleBookmark}
                onUpdateBookmarkLabel={updateBookmarkLabel}
                onRemoveHighlight={removeHighlight}
                onUpdateHighlightNote={updateHighlightNote}
                onAddNote={addNote}
                onAddQuestion={addQuestion}
              />
            )}
          </>
        )}
      </div>

      {/* Floating highlight popup — anchored near selection. On touch screens it
          docks at the bottom, clear of the native copy/select callout. */}
      {pendingSelection && (
        <div
          ref={popupRef}
          className="fixed z-[60] bg-white border border-rule rounded-sm shadow-sm p-1.5"
          style={coarsePointer ? {
            left: '50%',
            bottom: '16px',
            transform: 'translateX(-50%)',
            width: commenting ? 'min(92vw, 360px)' : undefined,
          } : {
            left: `${Math.min(Math.max(pendingSelection.screenPos.x, 180), window.innerWidth - 180)}px`,
            top: `${Math.max(pendingSelection.screenPos.y - (commenting ? 120 : 40), 8)}px`,
            transform: 'translateX(-50%)',
            width: commenting ? '320px' : undefined,
          }}
        >
          {!commenting ? (
            <div className="flex gap-1 items-center">
              <span className="text-[10px] text-ink-muted mr-1 max-w-[120px] truncate">
                &ldquo;{pendingSelection.text.slice(0, 40)}&hellip;&rdquo;
              </span>
              <button
                onClick={() => handleHighlight('burgundy')}
                className="w-5 h-5 rounded-sm bg-burgundy/80 hover:bg-burgundy border border-burgundy/40"
                title="Highlight (burgundy)"
              />
              <button
                onClick={() => handleHighlight('green')}
                className="w-5 h-5 rounded-sm bg-green-ink/60 hover:bg-green-ink/80 border border-green-ink/30"
                title="Highlight (green — important)"
              />
              <button
                onClick={() => handleHighlight('amber')}
                className="w-5 h-5 rounded-sm bg-amber-ink/60 hover:bg-amber-ink/80 border border-amber-ink/30"
                title="Highlight (amber — question)"
              />
              <button
                onClick={() => setCommenting(true)}
                className="text-[10px] font-serif font-medium px-2 py-0.5 rounded-sm border border-rule text-ink hover:border-ink-faint ml-0.5"
              >
                Comment
              </button>
              <button
                onClick={dismissSelection}
                className="text-[10px] text-ink-faint hover:text-ink px-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[10px] text-ink-muted italic line-clamp-2 border-l-2 border-burgundy/30 pl-1.5">
                &ldquo;{pendingSelection.text.slice(0, 160)}{pendingSelection.text.length > 160 ? '\u2026' : ''}&rdquo;
              </div>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Your comment..."
                rows={3}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleHighlight(commentColor, commentText)
                  if (e.key === 'Escape') dismissSelection()
                }}
                className="w-full text-[11px] border border-rule rounded-sm px-2 py-1 bg-paper text-ink resize-none focus:outline-none focus:border-ink-faint"
              />
              <div className="flex items-center gap-1">
                {(['burgundy', 'green', 'amber'] as HighlightColor[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setCommentColor(c)}
                    title={c}
                    className={`w-4 h-4 rounded-sm border ${
                      c === 'burgundy' ? 'bg-burgundy/80 border-burgundy/40' :
                      c === 'green' ? 'bg-green-ink/60 border-green-ink/30' : 'bg-amber-ink/60 border-amber-ink/30'
                    } ${commentColor === c ? 'ring-1 ring-offset-1 ring-ink' : ''}`}
                  />
                ))}
                <div className="flex-1" />
                <button
                  onClick={dismissSelection}
                  className="text-[10px] text-ink-faint hover:text-ink px-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleHighlight(commentColor, commentText)}
                  disabled={!commentText.trim()}
                  className="text-[10px] font-serif font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy disabled:opacity-30"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
