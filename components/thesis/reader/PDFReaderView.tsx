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
  /** Scroll here once the document is laid out — the saved position on reopen. */
  startPage?: number
  /** External jumps (sidebar, bookmarks). A new seq re-fires the same page. */
  jumpRequest?: { page: number; seq: number } | null
  bookmarkedPages?: Set<number>
  onToggleBookmark?: (page: number) => void
}

/** Pages either side of the current one that get a real canvas. */
const RENDER_WINDOW = 3

export default function PDFReaderView({
  url,
  currentPage,
  highlights,
  onPageChange,
  onTotalPages,
  onTextSelected,
  onPageTextExtracted,
  searchQuery,
  startPage,
  jumpRequest,
  bookmarkedPages,
  onToggleBookmark,
}: PDFReaderViewProps) {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [loadError, setLoadError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const isJumping = useRef(false)
  const ratiosRef = useRef<Map<number, number>>(new Map())
  // Unscaled size of page 1. Every page off-window is a placeholder of this
  // size, so the scroll height is right before anything renders and a jump to
  // page 400 lands on page 400.
  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null)
  // Pages that should render a canvas regardless of scroll — the jump target.
  const [pinnedPage, setPinnedPage] = useState<number | null>(null)

  function onDocumentLoadSuccess(pdf: { numPages: number; getPage: (n: number) => Promise<{ getViewport: (o: { scale: number }) => { width: number; height: number } }> }) {
    setNumPages(pdf.numPages)
    onTotalPages(pdf.numPages)
    setLoadError(null)
    pdf.getPage(1)
      .then(page => {
        const vp = page.getViewport({ scale: 1 })
        setBaseSize({ w: vp.width, h: vp.height })
      })
      .catch(() => setBaseSize({ w: 612, h: 792 }))
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
        // Entries only carry pages whose visibility changed, so keep a running
        // map and pick the most visible page overall.
        for (const entry of entries) {
          const pageNum = Number(entry.target.getAttribute('data-page'))
          if (!pageNum) continue
          if (entry.intersectionRatio > 0) ratiosRef.current.set(pageNum, entry.intersectionRatio)
          else ratiosRef.current.delete(pageNum)
        }
        if (isJumping.current) return
        let best: { page: number; ratio: number } | null = null
        ratiosRef.current.forEach((ratio, page) => {
          if (!best || ratio > best.ratio || (ratio === best.ratio && page < best.page)) best = { page, ratio }
        })
        if (best) onPageChange((best as { page: number }).page)
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    pageRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [numPages, baseSize, onPageChange])

  // Jump to page when currentPage changes externally (e.g. page input or sidebar click)
  const onPageChangeRef = useRef(onPageChange)
  onPageChangeRef.current = onPageChange
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage

  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const jumpToPage = useCallback((page: number) => {
    const el = pageRefs.current.get(page)
    if (!el) return
    isJumping.current = true
    setPinnedPage(page)
    el.scrollIntoView({ behavior: 'auto', block: 'start' })
    // Pages near the target render at their true height a beat later; settle
    // onto the target again once they have, then hand scrolling back.
    if (jumpTimer.current) clearTimeout(jumpTimer.current)
    jumpTimer.current = setTimeout(() => {
      pageRefs.current.get(page)?.scrollIntoView({ behavior: 'auto', block: 'start' })
      setTimeout(() => {
        isJumping.current = false
        setPinnedPage(null)
        // Re-read what is actually on screen; the page state may have been set
        // before a session existed to hold it.
        let best: { page: number; ratio: number } | null = null
        ratiosRef.current.forEach((ratio, p) => {
          if (!best || ratio > best.ratio || (ratio === best.ratio && p < best.page)) best = { page: p, ratio }
        })
        onPageChangeRef.current(best ? (best as { page: number }).page : page)
      }, 150)
    }, 450)
  }, [])

  // Zooming rescales every placeholder; stay on the page being read.
  const scaleRef = useRef(scale)
  useEffect(() => {
    if (scaleRef.current === scale) return
    scaleRef.current = scale
    const page = currentPageRef.current
    requestAnimationFrame(() => jumpToPage(page))
  }, [scale, jumpToPage])

  // Reopen where you left off.
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current || !numPages || !baseSize) return
    startedRef.current = true
    const target = Math.min(Math.max(1, startPage || 1), numPages)
    if (target > 1) {
      onPageChange(target)
      // Wait a frame so the placeholders are in the DOM.
      requestAnimationFrame(() => jumpToPage(target))
    }
  }, [numPages, baseSize, startPage, onPageChange, jumpToPage])

  useEffect(() => {
    if (!jumpRequest || !numPages) return
    const target = Math.min(Math.max(1, jumpRequest.page), numPages)
    onPageChange(target)
    jumpToPage(target)
  }, [jumpRequest, numPages, onPageChange, jumpToPage])

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
      if (selection && selection.rangeCount && !container.contains(selection.getRangeAt(0).commonAncestorContainer)) return
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

    // Touch selection never fires mouseup on the container — iOS and Android
    // adjust the handles and stop. Read the selection once it settles instead.
    const coarse = window.matchMedia('(pointer: coarse)').matches
    let settle: ReturnType<typeof setTimeout> | null = null
    const handleSelectionChange = () => {
      if (settle) clearTimeout(settle)
      settle = setTimeout(handleMouseUp, 500)
    }
    if (coarse) document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
      if (coarse) document.removeEventListener('selectionchange', handleSelectionChange)
      if (settle) clearTimeout(settle)
    }
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

        {onToggleBookmark && numPages > 0 && (() => {
          const marked = !!bookmarkedPages?.has(currentPage)
          return (
            <button
              onClick={() => onToggleBookmark(currentPage)}
              title={marked ? 'Remove bookmark' : 'Bookmark this page'}
              className={`flex items-center gap-1 text-[10px] font-serif px-1.5 py-0.5 rounded-sm border transition-colors ${
                marked
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'border-rule text-ink-muted hover:text-ink hover:border-ink-faint'
              }`}
            >
              <svg width="9" height="11" viewBox="0 0 9 11" aria-hidden="true">
                <path d="M1 1h7v9L4.5 7.5 1 10z" fill={marked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              {marked ? 'Bookmarked' : 'Bookmark'}
            </button>
          )
        })()}

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
              <div className="text-[10px] text-ink-muted">
                {loadError.includes('401') || loadError.includes('Unexpected server response')
                  ? 'This book is lending-only on Internet Archive and cannot be downloaded directly. Try borrowing it on archive.org first, or upload a PDF you already have.'
                  : loadError}
              </div>
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
            {baseSize && pages.map((pageNum) => {
              const near =
                Math.abs(pageNum - currentPage) <= RENDER_WINDOW ||
                (pinnedPage !== null && Math.abs(pageNum - pinnedPage) <= 1)
              const w = baseSize.w * scale
              const h = baseSize.h * scale
              return (
                <div
                  key={pageNum}
                  data-page={pageNum}
                  ref={(el) => {
                    if (el) pageRefs.current.set(pageNum, el)
                    else pageRefs.current.delete(pageNum)
                  }}
                  className="flex justify-center mb-4 relative"
                  style={{ minHeight: h }}
                >
                  <div className="relative">
                    {near ? (
                      <Page
                        pageNumber={pageNum}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        onRenderSuccess={() => handlePageRenderSuccess(pageNum)}
                        loading={<div className="bg-white" style={{ width: w, height: h }} />}
                      />
                    ) : (
                      <div className="bg-white/60 border border-rule-light" style={{ width: w, height: h }} />
                    )}
                    {/* Highlight overlays for this page */}
                    {near && (highlightsByPage.get(pageNum) || []).map(hl => (
                      <HighlightOverlay key={hl.id} highlight={hl} />
                    ))}
                    {bookmarkedPages?.has(pageNum) && (
                      <svg
                        className="absolute -top-1 right-4 text-burgundy pointer-events-none"
                        width="14" height="22" viewBox="0 0 14 22" aria-label="Bookmarked"
                      >
                        <path d="M0 0h14v22l-7-5-7 5z" fill="currentColor" />
                      </svg>
                    )}
                  </div>
                </div>
              )
            })}
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
