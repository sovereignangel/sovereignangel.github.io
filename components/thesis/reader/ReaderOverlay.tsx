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
  sourceUrl: string
  sourceType: DocumentSourceType
  linkedPaperId?: string
  linkedProfessorId?: string
}

interface ReaderOverlayProps {
  source: ReaderSource
  onClose: () => void
}

type HighlightColor = 'burgundy' | 'green' | 'amber'

export default function ReaderOverlay({ source, onClose }: ReaderOverlayProps) {
  const proxyUrl = `/api/archive-proxy?url=${encodeURIComponent(source.sourceUrl)}`

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
  } = useReadingSession(source.sourceUrl)

  const [pendingSelection, setPendingSelection] = useState<{
    text: string
    rects: HighlightRect[]
    pageNumber: number
  } | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPageText, setCurrentPageText] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const popupRef = useRef<HTMLDivElement>(null)

  const currentPage = session?.currentPage || 1
  const highlights = session?.highlights || []
  const notes = session?.notes || []
  const questions = session?.questions || []

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

  const handleTextSelected = useCallback((text: string, rects: HighlightRect[], pageNumber: number) => {
    setPendingSelection({ text, rects, pageNumber })
  }, [])

  const handleHighlight = useCallback((color: HighlightColor) => {
    if (!pendingSelection) return
    addHighlight({
      position: {
        pageNumber: pendingSelection.pageNumber,
        rects: pendingSelection.rects,
      },
      selectedText: pendingSelection.text,
      color,
    })
    setPendingSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [pendingSelection, addHighlight])

  const handlePageTextExtracted = useCallback((_pageNumber: number, text: string) => {
    setCurrentPageText(text)
  }, [])

  // Close popup when clicking outside
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (pendingSelection && popupRef.current && !popupRef.current.contains(e.target as Node)) {
      setPendingSelection(null)
    }
  }, [pendingSelection])

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
      <div className="flex-1 flex min-h-0">
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
            />

            {sidebarOpen && (
              <ReaderSidebar
                highlights={highlights}
                notes={notes}
                questions={questions}
                documentTitle={source.title}
                currentPageText={currentPageText}
                onJumpToPage={setPage}
                onRemoveHighlight={removeHighlight}
                onUpdateHighlightNote={updateHighlightNote}
                onAddNote={addNote}
                onAddQuestion={addQuestion}
              />
            )}
          </>
        )}
      </div>

      {/* Floating highlight popup */}
      {pendingSelection && (
        <div
          ref={popupRef}
          className="fixed z-[60] bg-white border border-rule rounded-sm shadow-sm p-1.5 flex gap-1"
          style={{
            left: '50%',
            bottom: '80px',
            transform: 'translateX(-50%)',
          }}
        >
          <span className="text-[9px] text-ink-muted self-center mr-1 max-w-[120px] truncate">
            &ldquo;{pendingSelection.text.slice(0, 40)}...&rdquo;
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
            onClick={() => setPendingSelection(null)}
            className="text-[9px] text-ink-faint hover:text-ink px-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
