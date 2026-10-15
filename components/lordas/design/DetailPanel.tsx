'use client'

/**
 * The prose, moved off the page and into a drawer.
 *
 * Ported from Lordas `components/exec/DetailPanel.tsx`. A tearsheet is read
 * without scrolling: every number in view at once, and the argument for those
 * numbers one click away. Each card keeps its figures and hands its reasoning
 * to this — a trigger in the card's top-right corner, and one drawer shared by
 * the page.
 *
 * Colours resolve from CSS variables, so the drawer takes the palette of
 * whichever sheet hosts it. Mount `DetailHost` inside that sheet.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { V } from './tokens'

interface DetailContent {
  title: string
  meta?: string
  body: React.ReactNode
}

const DetailCtx = createContext<{
  open: (c: DetailContent) => void
  close: () => void
} | null>(null)

export function DetailHost({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<DetailContent | null>(null)

  const open = useCallback((c: DetailContent) => setContent(c), [])
  const close = useCallback(() => setContent(null), [])

  useEffect(() => {
    if (!content) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [content, close])

  return (
    <DetailCtx.Provider value={{ open, close }}>
      {children}

      <div
        className={`lordas-scrim${content ? ' is-open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={`lordas-drawer${content ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={content?.title ?? 'Detail'}
        aria-hidden={!content}
      >
        {content && (
          <>
            <div className="lordas-drawer-head">
              <div style={{ minWidth: 0 }}>
                <div className="lordas-display" style={{ fontSize: 17, fontWeight: 600, color: V.accent, lineHeight: 1.2 }}>
                  {content.title}
                </div>
                {content.meta && (
                  <div style={{ fontSize: 11, color: V.muted, marginTop: 3, lineHeight: 1.35 }}>
                    {content.meta}
                  </div>
                )}
              </div>
              <button type="button" onClick={close} className="lordas-drawer-x" aria-label="Close">
                ×
              </button>
            </div>
            <div className="lordas-drawer-body">{content.body}</div>
          </>
        )}
      </aside>
    </DetailCtx.Provider>
  )
}

export function useDetail() {
  const ctx = useContext(DetailCtx)
  if (!ctx) throw new Error('useDetail must be used inside DetailHost')
  return ctx
}

/** The trigger, sized for a card's meta slot — the top-right corner. */
export function DetailTrigger({
  label = 'Detail',
  title,
  meta,
  children,
}: {
  label?: string
  title: string
  meta?: string
  children: React.ReactNode
}) {
  const { open } = useDetail()
  return (
    <button
      type="button"
      className="lordas-detail-trigger"
      onClick={() => open({ title, meta, body: children })}
      title={`${title} — opens a detail panel`}
    >
      {label}
      <span aria-hidden="true" style={{ fontSize: 10, lineHeight: 1 }}>›</span>
    </button>
  )
}

/** A second heading inside a drawer, where one panel carries two related passages. */
export function DrawerRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="lordas-drawer-rule">
      <div className="lordas-display" style={{ fontSize: 14, fontWeight: 600, color: V.accent }}>
        {children}
      </div>
    </div>
  )
}
