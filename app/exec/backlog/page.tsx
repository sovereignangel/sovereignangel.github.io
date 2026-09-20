'use client'

/**
 * The backlog — everything the feed pulled that has not been read.
 *
 * The card on /exec is deliberately four items per subject. This is where the
 * rest goes, and where anything shown but not opened stays. Filters are date
 * range, keyword and subject, because those are the three ways a question
 * arrives later: "what was that thing in August", "everything on guidance",
 * "what have I not read in macro".
 *
 * Marking read is the only write. Nothing is ever deleted — an item you decide
 * against is still evidence about what the sources emit, and the archive stays
 * searchable after the fact.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

type SubjectId = 'value' | 'macro' | 'ai' | 'systems' | 'capital'
type Status = 'unread' | 'read' | 'all'

interface Entry {
  id: string
  title: string
  link: string
  source: string
  subject: SubjectId
  publishedDate: string
  score: number | null
  reason: string | null
  read: boolean
}

const SUBJECT_LABEL: Record<SubjectId, string> = {
  value: 'Value',
  macro: 'Macro',
  ai: 'AI & Compute',
  systems: 'Systems',
  capital: 'Capital',
}

const SUBJECTS = Object.keys(SUBJECT_LABEL) as SubjectId[]

function daysAgoISO(n: number): string {
  const d = new Date(Date.now() - n * 86400000)
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function BacklogPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [stats, setStats] = useState({ unread: 0, read: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState<SubjectId | ''>('')
  const [status, setStatus] = useState<Status>('unread')

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    if (subject) p.set('subject', subject)
    p.set('status', status)
    return p.toString()
  }, [q, from, to, subject, status])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    // Debounced so typing a keyword does not fire a request per character.
    const t = setTimeout(() => {
      fetch(`/api/exec/feed?${query}`)
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return
          if (d.error) { setError(d.error); return }
          setError(null)
          setEntries(d.entries || [])
          setStats(d.stats || { unread: 0, read: 0, total: 0 })
        })
        .catch((e) => !cancelled && setError(String(e)))
        .finally(() => !cancelled && setLoading(false))
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query])

  const toggleRead = useCallback((entry: Entry) => {
    const next = !entry.read
    // Optimistic: the list is the thing being filtered, so waiting for the
    // round trip would leave a row that no longer matches sitting in place.
    setEntries((prev) =>
      status === 'all'
        ? prev.map((e) => (e.id === entry.id ? { ...e, read: next } : e))
        : prev.filter((e) => e.id !== entry.id),
    )
    setStats((s) => ({ ...s, unread: s.unread + (next ? -1 : 1), read: s.read + (next ? 1 : -1) }))
    fetch('/api/exec/feed', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: entry.id, read: next }),
    }).catch(() => { /* the next load reconciles */ })
  }, [status])

  const clearFilters = () => { setQ(''); setFrom(''); setTo(''); setSubject(''); setStatus('unread') }
  const filtered = q || from || to || subject || status !== 'unread'

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #edefea 0%, #f2ecdf 320px)' }}>
      <div className="max-w-[1000px] mx-auto px-3 md:px-4 py-3 md:py-5">
        <header className="flex items-baseline gap-2 md:gap-3 mb-3">
          <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap">
            Backlog
          </h1>
          <span className="text-[10px] text-surf-muted">
            {stats.unread} unread &middot; {stats.read} read &middot; {stats.total} held
          </span>
          <a
            href="/exec"
            className="ml-auto font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent transition-colors text-surf-muted border-surf-rule hover:text-surf-deep hover:border-surf-teal/50"
          >
            Exec
          </a>
        </header>

        {/* Filters */}
        <div className="border rounded-xl p-2.5 md:p-3 bg-surf-card border-surf-rule shadow-[0_2px_12px_rgba(13,92,99,0.06)] mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Keywords — all must match"
              className="flex-1 min-w-[180px] text-[11px] px-2 py-1.5 rounded-md border border-surf-rule bg-white text-surf-ink placeholder:text-surf-faint focus:outline-none focus:border-surf-teal/50"
            />
            <label className="flex items-center gap-1 text-[10px] text-surf-muted">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="text-[11px] px-1.5 py-1 rounded-md border border-surf-rule bg-white text-surf-ink"
              />
            </label>
            <label className="flex items-center gap-1 text-[10px] text-surf-muted">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="text-[11px] px-1.5 py-1 rounded-md border border-surf-rule bg-white text-surf-ink"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-2">
            {(['unread', 'read', 'all'] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`font-serif text-[10px] font-medium px-2 py-1 rounded-full border transition-colors ${
                  status === s
                    ? 'bg-surf-teal text-white border-surf-teal'
                    : 'bg-transparent text-surf-muted border-surf-rule hover:border-surf-teal/50'
                }`}
              >
                {s}
              </button>
            ))}
            <span className="w-px h-4 bg-surf-rule mx-1" />
            <button
              onClick={() => setSubject('')}
              className={`font-serif text-[10px] font-medium px-2 py-1 rounded-full border transition-colors ${
                subject === ''
                  ? 'bg-surf-teal text-white border-surf-teal'
                  : 'bg-transparent text-surf-muted border-surf-rule hover:border-surf-teal/50'
              }`}
            >
              all subjects
            </button>
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`font-serif text-[10px] font-medium px-2 py-1 rounded-full border transition-colors ${
                  subject === s
                    ? 'bg-surf-teal text-white border-surf-teal'
                    : 'bg-transparent text-surf-muted border-surf-rule hover:border-surf-teal/50'
                }`}
              >
                {SUBJECT_LABEL[s]}
              </button>
            ))}
            <span className="w-px h-4 bg-surf-rule mx-1" />
            {[7, 31].map((n) => (
              <button
                key={n}
                onClick={() => { setFrom(daysAgoISO(n)); setTo('') }}
                className="font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent text-surf-muted border-surf-rule hover:border-surf-teal/50 transition-colors"
              >
                last {n}d
              </button>
            ))}
            {filtered && (
              <button
                onClick={clearFilters}
                className="font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent text-surf-coral border-surf-rule hover:border-surf-coral/50 transition-colors"
              >
                clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="text-[11px] text-surf-coral mb-3">{error}</div>
        )}

        {loading && <div className="text-[11px] text-surf-muted py-6 text-center">Reading the backlog...</div>}

        {!loading && entries.length === 0 && !error && (
          <div className="text-[11px] text-surf-muted py-6 text-center">
            Nothing matches. {status === 'unread' && !filtered ? 'The backlog is clear.' : 'Try widening the filters.'}
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="border rounded-xl bg-surf-card border-surf-rule shadow-[0_2px_12px_rgba(13,92,99,0.06)] divide-y divide-surf-rule-light">
            {entries.map((e) => (
              <div key={e.id} className="flex items-start gap-2 px-2.5 md:px-3 py-2">
                <button
                  onClick={() => toggleRead(e)}
                  title={e.read ? 'Mark unread' : 'Mark read'}
                  className={`mt-0.5 w-3.5 h-3.5 shrink-0 rounded-sm border transition-colors ${
                    e.read
                      ? 'bg-surf-teal border-surf-teal'
                      : 'bg-transparent border-surf-rule hover:border-surf-teal'
                  }`}
                >
                  {e.read && (
                    <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
                      <path d="M2.5 6.2l2.2 2.2 4.8-4.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <a
                    href={e.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-[11px] leading-snug hover:underline decoration-1 underline-offset-2 ${
                      e.read ? 'text-surf-faint' : 'text-surf-ink'
                    }`}
                  >
                    {e.title}
                  </a>
                  {e.reason && <div className="text-[10px] text-surf-muted leading-snug mt-0.5">{e.reason}</div>}
                  <div className="font-mono text-[9px] uppercase tracking-[0.3px] text-surf-muted mt-0.5">
                    {e.source}
                    <span className="text-surf-faint"> · {SUBJECT_LABEL[e.subject]}</span>
                    {e.publishedDate && <span className="text-surf-faint"> · {e.publishedDate}</span>}
                    {e.score !== null && <span className="text-surf-teal"> · {e.score}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
