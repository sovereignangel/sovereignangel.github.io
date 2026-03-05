'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { authFetch } from '@/lib/auth-fetch'
import { getDailyLog } from '@/lib/firestore/daily-logs'
import { getConversation } from '@/lib/firestore/conversations'

// ─── TYPES ───────────────────────────────────────────────────────────

interface SearchResult {
  score: number
  collection: string
  documentId: string
  chunkIndex: number
  date: string
  sourceType: string
  contactNames: string[]
  projectNames: string[]
  textPreview: string
}

const SOURCE_LABELS: Record<string, string> = {
  journal: 'Journal',
  transcript: 'Transcript',
  note: 'Note',
  synthesis: 'Synthesis',
  insight: 'Insight',
  decision: 'Decision',
  signal: 'Signal',
}

const SOURCE_FILTERS = ['all', 'journal', 'transcript', 'note', 'insight', 'decision', 'signal'] as const
const PILLAR_FILTERS = ['all', 'ai', 'markets', 'mind', 'emergence'] as const

// ─── COMPONENT ──────────────────────────────────────────────────────

export default function SemanticSearch() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [pillarFilter, setPillarFilter] = useState<string>('all')

  // Expanded result (inline full text)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedText, setExpandedText] = useState<string | null>(null)
  const [expandLoading, setExpandLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const search = useCallback(async () => {
    if (!query.trim() || !user) return
    setLoading(true)
    setError(null)
    setSearched(true)
    setExpandedId(null)
    setExpandedText(null)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filters: Record<string, any> = {}
      if (sourceFilter !== 'all') filters.sourceType = sourceFilter
      if (pillarFilter !== 'all') filters.pillar = pillarFilter

      const res = await authFetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), filters, topK: 20 }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Search failed (${res.status})`)
      }

      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, user, sourceFilter, pillarFilter])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search()
  }

  const expand = useCallback(async (result: SearchResult) => {
    const id = `${result.collection}::${result.documentId}::${result.chunkIndex}`
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedText(null)
      return
    }

    if (!user) return
    setExpandedId(id)
    setExpandedText(null)
    setExpandLoading(true)

    try {
      let fullText = ''
      if (result.collection === 'daily_logs') {
        const log = await getDailyLog(user.uid, result.documentId)
        fullText = log?.journalEntry || 'No journal text found.'
      } else if (result.collection === 'conversations') {
        const conv = await getConversation(user.uid, result.documentId)
        fullText = conv?.transcript || conv?.aiSummary || 'No transcript found.'
      } else {
        // For insights, signals, etc. — show the preview (full text not easily fetchable)
        fullText = result.textPreview
      }
      setExpandedText(fullText)
    } catch {
      setExpandedText('Failed to load full text.')
    } finally {
      setExpandLoading(false)
    }
  }, [expandedId, user])

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search journals, transcripts, insights..."
          className="flex-1 font-sans text-[11px] bg-paper border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-burgundy"
        />
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border transition-colors bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 disabled:opacity-40"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1">
          <span className="font-sans text-[9px] text-ink-muted uppercase tracking-[0.5px]">Source</span>
          <div className="flex gap-0.5">
            {SOURCE_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                  sourceFilter === s
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                }`}
              >
                {s === 'all' ? 'All' : SOURCE_LABELS[s] || s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-sans text-[9px] text-ink-muted uppercase tracking-[0.5px]">Pillar</span>
          <div className="flex gap-0.5">
            {PILLAR_FILTERS.map(p => (
              <button
                key={p}
                onClick={() => setPillarFilter(p)}
                className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                  pillarFilter === p
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                }`}
              >
                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-ink/5 border border-red-ink/20 rounded-sm p-2">
          <span className="font-sans text-[10px] text-red-ink">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-6 text-center">
          <span className="font-serif text-[11px] italic text-ink-muted">Searching your knowledge base...</span>
        </div>
      )}

      {/* Empty state */}
      {searched && !loading && results.length === 0 && !error && (
        <div className="bg-paper border border-rule rounded-sm p-6 text-center">
          <p className="font-sans text-[11px] text-ink-muted">No results found for &ldquo;{query}&rdquo;</p>
          <p className="font-sans text-[10px] text-ink-faint mt-1">Try a different query or adjust filters</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1.5">
          <span className="font-sans text-[9px] text-ink-muted">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          {results.map((r, i) => {
            const id = `${r.collection}::${r.documentId}::${r.chunkIndex}`
            const isExpanded = expandedId === id
            const scorePercent = Math.round(Math.max(0, r.score) * 100)

            return (
              <button
                key={`${id}-${i}`}
                onClick={() => expand(r)}
                className={`w-full text-left bg-white border rounded-sm p-2.5 transition-colors ${
                  isExpanded ? 'border-burgundy/40' : 'border-rule hover:border-ink-faint'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 mb-1">
                  {/* Score bar */}
                  <div className="w-12 h-1 bg-rule rounded-sm overflow-hidden flex-shrink-0">
                    <div
                      className="h-full bg-burgundy rounded-sm"
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-[8px] text-ink-muted flex-shrink-0">{scorePercent}%</span>

                  {/* Source badge */}
                  <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20 flex-shrink-0">
                    {SOURCE_LABELS[r.sourceType] || r.sourceType}
                  </span>

                  {/* Date */}
                  <span className="font-mono text-[9px] text-ink-muted flex-shrink-0">{r.date}</span>

                  {/* Contact chips */}
                  {r.contactNames.length > 0 && (
                    <div className="flex gap-0.5 overflow-hidden">
                      {r.contactNames.slice(0, 3).map(name => (
                        <span
                          key={name}
                          className="font-mono text-[8px] px-1 py-0.5 rounded-sm bg-green-bg text-green-ink border border-green-ink/20 truncate max-w-[80px]"
                        >
                          {name}
                        </span>
                      ))}
                      {r.contactNames.length > 3 && (
                        <span className="font-mono text-[8px] text-ink-muted">+{r.contactNames.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Text preview */}
                <p className="font-sans text-[10px] text-ink leading-relaxed line-clamp-2">
                  {r.textPreview}
                </p>

                {/* Expanded full text */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-rule">
                    {expandLoading ? (
                      <span className="font-serif text-[10px] italic text-ink-muted">Loading full text...</span>
                    ) : expandedText ? (
                      <p className="font-sans text-[10px] text-ink leading-relaxed whitespace-pre-wrap">
                        {expandedText}
                      </p>
                    ) : null}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Pre-search hint */}
      {!searched && !loading && (
        <div className="p-8 text-center">
          <p className="font-serif text-[11px] text-ink-muted">Search across your journals, transcripts, and insights</p>
          <p className="font-sans text-[9px] text-ink-faint mt-1">Uses semantic similarity — ask in natural language</p>
        </div>
      )}
    </div>
  )
}
