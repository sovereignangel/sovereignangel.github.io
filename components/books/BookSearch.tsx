'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import type { BookSearchResponse, BookSearchHit } from '@/lib/books/types'

interface BookSearchProps {
  onOpenHit: (slug: string, page: number) => void
}

/** Highlight the matched terms inside a snippet without dangerouslySetInnerHTML. */
function Snippet({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>
  const pattern = terms
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|')
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'))
  const lower = terms.map(t => t.toLowerCase())
  return (
    <>
      {parts.map((part, i) =>
        lower.includes(part.toLowerCase()) ? (
          <mark key={i} className="bg-amber-bg text-ink font-medium px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export default function BookSearch({ onOpenHit }: BookSearchProps) {
  const [query, setQuery] = useState('')
  const [slugFilter, setSlugFilter] = useState<string | null>(null)
  const [results, setResults] = useState<BookSearchResponse | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqRef = useRef(0)

  const run = useCallback(async (q: string, slug: string | null) => {
    if (!q.trim()) {
      setResults(null)
      return
    }
    const id = ++reqRef.current
    setSearching(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: q.trim() })
      if (slug) params.set('slug', slug)
      const res = await authFetch(`/api/books/search?${params}`)
      const data = await res.json()
      if (id !== reqRef.current) return // a newer keystroke already won
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setResults(data)
    } catch (err) {
      if (id === reqRef.current) setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      if (id === reqRef.current) setSearching(false)
    }
  }, [])

  // Debounce the corpus scan so typing stays responsive.
  useEffect(() => {
    const t = setTimeout(() => run(query, slugFilter), 250)
    return () => clearTimeout(t)
  }, [query, slugFilter, run])

  const grouped: Record<string, BookSearchHit[]> = {}
  for (const hit of results?.hits || []) {
    ;(grouped[hit.slug] ||= []).push(hit)
  }

  return (
    <div className="mb-6">
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search all three books — use "quotes" for an exact phrase'
            className="flex-1 text-[11px] border border-rule rounded-sm px-3 py-2 bg-paper text-ink placeholder:text-ink-faint"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSlugFilter(null) }}
              className="font-serif text-[10px] font-medium px-3 py-2 rounded-sm border border-rule text-ink-muted hover:border-ink-faint"
            >
              Clear
            </button>
          )}
        </div>

        {results && results.byBook.length > 1 && (
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => setSlugFilter(null)}
              className={`font-serif text-[10px] font-medium px-2 py-1 rounded-sm border ${
                !slugFilter
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              All · {results.totalHits}
            </button>
            {results.byBook.map(b => (
              <button
                key={b.slug}
                onClick={() => setSlugFilter(b.slug)}
                className={`font-serif text-[10px] font-medium px-2 py-1 rounded-sm border ${
                  slugFilter === b.slug
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                }`}
              >
                {b.title.split(':')[0]} · {b.hits}
              </button>
            ))}
          </div>
        )}

        {searching && <div className="text-[10px] text-ink-muted mt-2">Scanning the corpus...</div>}
        {error && <div className="text-[10px] text-red-ink mt-2">{error}</div>}
        {results && !searching && results.totalHits === 0 && (
          <div className="text-[10px] text-ink-muted mt-2">
            No pages match. Try fewer words, or drop the quotes.
          </div>
        )}
      </div>

      {results && results.totalHits > 0 && (
        <div className="mt-3 space-y-3">
          {Object.entries(grouped).map(([slug, hits]) => (
            <div key={slug}>
              <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
                {hits[0].title}
                <span className="ml-2 font-mono text-[10px] font-normal normal-case tracking-normal text-ink-muted">
                  {results.byBook.find(b => b.slug === slug)?.hits} pages
                </span>
              </div>
              <div className="space-y-1.5">
                {hits.map(hit => (
                  <button
                    key={`${hit.slug}-${hit.page}`}
                    onClick={() => onOpenHit(hit.slug, hit.page)}
                    className="w-full text-left bg-white border border-rule rounded-sm p-3 hover:border-ink-faint transition-colors"
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-mono text-[10px] text-burgundy shrink-0">p.{hit.page}</span>
                      <span className="font-mono text-[10px] text-ink-faint shrink-0">{hit.score.toFixed(1)}</span>
                    </div>
                    <div className="text-[10px] text-ink leading-relaxed">
                      <Snippet text={hit.snippet} terms={results.terms} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {results.totalHits > results.hits.length && (
            <div className="text-[10px] text-ink-muted text-center py-1">
              Showing the top {results.hits.length} of {results.totalHits} matching pages.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
