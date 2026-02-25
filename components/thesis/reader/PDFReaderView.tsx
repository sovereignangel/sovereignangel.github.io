'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
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
  onTextSelected: (text: string, rects: HighlightRect[], pageNumber: number, screenPos: { x: number; y: number }) => void
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const isJumping = useRef(false)

  function onDocumentLoadSuccess({ numPages: total }: { numPages: number }) {
    setNumPages(total)
    onTotalPages(total)
    setLoadError(null)
  }

  function onDocumentLoadError(error: Error) {
    setLoadError(error.message || 'Failed to load PDF')
  }

  // IntersectionObserver to track which page is visible
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || numPages === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (isJumping.current) return
        let mostVisible: { page: number; ratio: number } | null = null
        for (const entry of entries) {
          const pageNum = Number(entry.target.getAttribute('data-page'))
          if (pageNum && entry.intersectionRatio > (mostVisible?.ratio ?? 0)) {
            mostVisible = { page: pageNum, ratio: entry.intersectionRatio }
          }
        }
        if (mostVisible) {
          onPageChange(mostVisible.page)
        }
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    pageRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [numPages, onPageChange])

  // Jump to page when currentPage changes externally (e.g. page input or sidebar click)
  const jumpToPage = useCallback((page: number) => {
    const el = pageRefs.current.get(page)
    if (!el) return
    isJumping.current = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => { isJumping.current = false }, 600)
  }, [])

  // Extract text when a page renders
  const handlePageRenderSuccess = useCallback((pageNumber: number) => {
    if (!onPageTextExtracted) return
    const el = pageRefs.current.get(pageNumber)
    if (!el) return
    const textLayer = el.querySelector('.react-pdf__Page__textContent')
    if (textLayer) {
      onPageTextExtracted(pageNumber, textLayer.textContent || '')
    }
  }, [onPageTextExtracted])

  // Handle text selection — detect which page it's on
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleMouseUp = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.toString().trim()) return

      const text = selection.toString().trim()
      if (text.length < 3) return

      const range = selection.getRangeAt(0)

      // Walk up from the selection to find the data-page container
      let node: Node | null = range.startContainer
      let pageNumber = currentPage
      while (node && node !== container) {
        if (node instanceof HTMLElement && node.hasAttribute('data-page')) {
          pageNumber = Number(node.getAttribute('data-page'))
          break
        }
        node = node.parentNode
      }

      // Find the page element for rect normalization
      const pageEl = pageRefs.current.get(pageNumber)
      const pdfPage = pageEl?.querySelector('.react-pdf__Page')
      if (!pdfPage) return

      const pageRect = pdfPage.getBoundingClientRect()
      const rangeRects = Array.from(range.getClientRects())

      const normalizedRects: HighlightRect[] = rangeRects
        .filter(r => r.width > 0 && r.height > 0)
        .map(r => ({
          x1: ((r.left - pageRect.left) / pageRect.width) * 100,
          y1: ((r.top - pageRect.top) / pageRect.height) * 100,
          x2: ((r.right - pageRect.left) / pageRect.width) * 100,
          y2: ((r.bottom - pageRect.top) / pageRect.height) * 100,
          pageNumber,
        }))

      if (normalizedRects.length > 0) {
        // Compute screen position for popup — use midpoint-top of last rect
        const lastRect = rangeRects[rangeRects.length - 1]
        const screenPos = {
          x: lastRect.left + lastRect.width / 2,
          y: lastRect.top,
        }
        onTextSelected(text, normalizedRects, pageNumber, screenPos)
      }
    }

    container.addEventListener('mouseup', handleMouseUp)
    return () => container.removeEventListener('mouseup', handleMouseUp)
  }, [currentPage, onTextSelected])

  // Group highlights by page
  const highlightsByPage = useMemo(() => {
    const map = new Map<number, ReadingHighlight[]>()
    for (const h of highlights) {
      const p = h.position.pageNumber
      if (!map.has(p)) map.set(p, [])
      map.get(p)!.push(h)
    }
    return map
  }, [highlights])

  // Page numbers to render
  const pages = useMemo(() => {
    return Array.from({ length: numPages }, (_, i) => i + 1)
  }, [numPages])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-rule bg-cream/50 shrink-0">
        <span className="font-mono text-[10px] text-ink-muted">
          {currentPage} / {numPages || '...'}
        </span>

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
            if (p >= 1 && p <= numPages) {
              onPageChange(p)
              jumpToPage(p)
            }
          }}
          className="w-12 text-[10px] font-mono text-center border border-rule rounded-sm px-1 py-0.5 bg-white text-ink"
        />
      </div>

      {/* PDF Content — continuous scroll */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-cream/30 py-4"
      >
        {loadError ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white border border-red-ink/20 rounded-sm p-4 max-w-sm text-center">
              <div className="text-[11px] font-semibold text-red-ink mb-1">Failed to load PDF</div>
              <div className="text-[10px] text-ink-muted">{loadError}</div>
            </div>
          </div>
        ) : (
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
            {pages.map((pageNum) => (
              <div
                key={pageNum}
                data-page={pageNum}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNum, el)
                  else pageRefs.current.delete(pageNum)
                }}
                className="flex justify-center mb-4 relative"
              >
                <div className="relative">
                  <Page
                    pageNumber={pageNum}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderSuccess={() => handlePageRenderSuccess(pageNum)}
                  />
                  {/* Highlight overlays for this page */}
                  {(highlightsByPage.get(pageNum) || []).map(h => (
                    <HighlightOverlay key={h.id} highlight={h} />
                  ))}
                </div>
              </div>
            ))}
          </Document>
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
