'use client'

/**
 * The prose, moved off the board and into a drawer.
 *
 * Each card keeps its table and hands its reasoning to this: a trigger in the
 * card's own head, and one drawer shared by the whole board. Ported from the
 * Lordas console's DetailPanel; colours come from the host palette.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

interface DetailContent {
  title: string
  meta?: string
  body: React.ReactNode
}

const DetailCtx = createContext<{ open: (c: DetailContent) => void; close: () => void } | null>(null)

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
      <div className={`lordas-scrim${content ? ' is-open' : ''}`} onClick={close} aria-hidden="true" />
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
                <div className="opps-drawer-title">{content.title}</div>
                {content.meta && <div className="opps-drawer-meta">{content.meta}</div>}
              </div>
              <button type="button" onClick={close} className="lordas-drawer-x" aria-label="Close">
                &times;
              </button>
            </div>
            <div className="lordas-drawer-body">{content.body}</div>
          </>
        )}
      </aside>
    </DetailCtx.Provider>
  )
}

export function DetailTrigger({
  label = 'How to read',
  title,
  meta,
  children,
}: {
  label?: string
  title: string
  meta?: string
  children: React.ReactNode
}) {
  const ctx = useContext(DetailCtx)
  if (!ctx) return null
  return (
    <button
      type="button"
      className="lordas-detail-trigger"
      onClick={() => ctx.open({ title, meta, body: children })}
      title={`${title} — opens a detail panel`}
    >
      {label}
      <span aria-hidden="true">&rsaquo;</span>
    </button>
  )
}

/** A paragraph in the drawer: body sans, readable size. */
export function Para({ children }: { children: React.ReactNode }) {
  return <p className="opps-para">{children}</p>
}
