'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import type { ReadingHighlight, HighlightRect } from '@/lib/types/reading'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFReaderViewProps {
  url: string
  currentPage: number
  highlights: ReadingHighlight[]
  onPageChange: (page: number) => void
  onTotalPages: (total: number) => void
  onTextSelected: (text: string, rects: HighlightRect[], pageNumber: number) => void
  onPageTextExtracted?: (pageNumber: number, text: string) => void
  searchQuery?: string
}

export default function PDFReaderView({
  url,
  currentPage,
  highlights,
  onPageChange,
  onTotalPages,
  onTextSelected,
  onPageTextExtracted,
  searchQuery,
}: PDFReaderViewProps) {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [loadError, setLoadError] = useState<string | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function onDocumentLoadSuccess({ numPages: total }: { numPages: number }) {
    setNumPages(total)
    onTotalPages(total)
    setLoadError(null)
  }

  function onDocumentLoadError(error: Error) {
    setLoadError(error.message || 'Failed to load PDF')
  }

  // Extract text when page renders (for search + Q&A context)
  const handlePageRenderSuccess = useCallback(() => {
    if (!onPageTextExtracted || !pageRef.current) return
    const textLayer = pageRef.current.querySelector('.react-pdf__Page__textContent')
    if (textLayer) {
      onPageTextExtracted(currentPage, textLayer.textContent || '')
    }
  }, [currentPage, onPageTextExtracted])

  // Handle text selection
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseUp = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.toString().trim()) return

      const text = selection.toString().trim()
      if (text.length < 3) return

      // Get selection rects relative to the page
      const range = selection.getRangeAt(0)
      const pageEl = pageRef.current?.querySelector('.react-pdf__Page')
      if (!pageEl) return

      const pageRect = pageEl.getBoundingClientRect()
      const rangeRects = Array.from(range.getClientRects())

      const normalizedRects: HighlightRect[] = rangeRects
        .filter(r => r.width > 0 && r.height > 0)
        .map(r => ({
          x1: ((r.left - pageRect.left) / pageRect.width) * 100,
          y1: ((r.top - pageRect.top) / pageRect.height) * 100,
          x2: ((r.right - pageRect.left) / pageRect.width) * 100,
          y2: ((r.bottom - pageRect.top) / pageRect.height) * 100,
          pageNumber: currentPage,
        }))

      if (normalizedRects.length > 0) {
        onTextSelected(text, normalizedRects, currentPage)
      }
    }

    container.addEventListener('mouseup', handleMouseUp)
    return () => container.removeEventListener('mouseup', handleMouseUp)
  }, [currentPage, onTextSelected])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        if (currentPage < numPages) onPageChange(currentPage + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (currentPage > 1) onPageChange(currentPage - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentPage, numPages, onPageChange])

  const pageHighlights = highlights.filter(h => h.position.pageNumber === currentPage)

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-rule bg-cream/50 shrink-0">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="text-[10px] font-serif px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink disabled:opacity-30"
        >
          Prev
        </button>
        <span className="font-mono text-[10px] text-ink-muted">
          {currentPage} / {numPages || '...'}
        </span>
        <button
          onClick={() => currentPage < numPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= numPages}
          className="text-[10px] font-serif px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink disabled:opacity-30"
        >
          Next
        </button>

        <div className="flex-1" />

        {/* Zoom */}
        <button
          onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
          className="text-[10px] font-mono px-1 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink"
        >
          -
        </button>
        <span className="font-mono text-[9px] text-ink-muted w-10 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(s => Math.min(2.5, s + 0.1))}
          className="text-[10px] font-mono px-1 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink"
        >
          +
        </button>

        {/* Quick page jump */}
        <input
          type="number"
          min={1}
          max={numPages}
          value={currentPage}
          onChange={e => {
            const p = parseInt(e.target.value)
            if (p >= 1 && p <= numPages) onPageChange(p)
          }}
          className="w-12 text-[10px] font-mono text-center border border-rule rounded-sm px-1 py-0.5 bg-white text-ink"
        />
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex justify-center bg-cream/30 py-4">
        {loadError ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white border border-red-ink/20 rounded-sm p-4 max-w-sm text-center">
              <div className="text-[11px] font-semibold text-red-ink mb-1">Failed to load PDF</div>
              <div className="text-[10px] text-ink-muted">{loadError}</div>
            </div>
          </div>
        ) : (
          <div ref={pageRef} className="relative">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-96">
                  <span className="text-[11px] text-ink-muted">Loading document...</span>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onRenderSuccess={handlePageRenderSuccess}
              />
            </Document>

            {/* Highlight overlays */}
            {pageHighlights.map(h => (
              <HighlightOverlay key={h.id} highlight={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HighlightOverlay({ highlight }: { highlight: ReadingHighlight }) {
  const colorMap = {
    burgundy: 'bg-burgundy/20 border-burgundy/40',
    green: 'bg-green-ink/15 border-green-ink/30',
    amber: 'bg-amber-ink/15 border-amber-ink/30',
  }

  return (
    <>
      {highlight.position.rects.map((rect, i) => (
        <div
          key={i}
          className={`absolute pointer-events-none border ${colorMap[highlight.color]} rounded-[1px]`}
          style={{
            left: `${rect.x1}%`,
            top: `${rect.y1}%`,
            width: `${rect.x2 - rect.x1}%`,
            height: `${rect.y2 - rect.y1}%`,
          }}
          title={highlight.note || highlight.selectedText}
        />
      ))}
    </>
  )
}
