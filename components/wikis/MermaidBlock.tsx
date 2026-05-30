'use client'

// Mermaid renderer for wiki markdown — intercepts ```mermaid``` fenced code
// blocks and renders them as SVG using the mermaid library.
//
// Used by MarkdownView via the `code` component renderer: when ReactMarkdown
// encounters a fenced block with className "language-mermaid", it passes the
// diagram source through to <MermaidBlock>. We initialize mermaid lazily on
// first mount (heavy library, don't load on SSR or first wiki list view).

import { useEffect, useRef, useState } from 'react'

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const mermaid = mod.default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          // Match the wiki/Armstrong brand palette so diagrams feel like part
          // of the document, not a foreign embed.
          primaryColor: '#f5f1ea',
          primaryTextColor: '#2a2522',
          primaryBorderColor: '#7c2d2d',
          lineColor: '#5c5550',
          secondaryColor: '#efe9df',
          tertiaryColor: '#faf8f4',
          fontFamily: '"Crimson Pro", Georgia, serif',
          fontSize: '14px',
        },
        flowchart: { useMaxWidth: true, htmlLabels: true },
        sequence: { useMaxWidth: true },
      })
      return mermaid
    })
  }
  return mermaidPromise
}

export default function MermaidBlock({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const idRef = useRef(`mmd-${Math.random().toString(36).slice(2, 10)}`)

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      try {
        const mermaid = await loadMermaid()
        if (cancelled || !ref.current) return
        // mermaid.render returns { svg, bindFunctions }
        const { svg, bindFunctions } = await mermaid.render(idRef.current, source)
        if (cancelled || !ref.current) return
        ref.current.innerHTML = svg
        bindFunctions?.(ref.current)
        setErr(null)
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [source])

  if (err) {
    return (
      <div className="my-3 border border-rule bg-paper-warm p-3 text-[12px]">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.5px] text-burgundy">
          mermaid render error
        </div>
        <pre className="whitespace-pre-wrap font-mono text-[11px] text-ink-light">{err}</pre>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-ink-muted">{source}</pre>
      </div>
    )
  }
  return <div ref={ref} className="my-4 overflow-x-auto" />
}
