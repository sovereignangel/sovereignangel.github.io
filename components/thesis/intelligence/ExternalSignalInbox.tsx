'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getInboxExternalSignals, saveExternalSignal, updateExternalSignal } from '@/lib/firestore'
import type { ExternalSignal, ExternalSignalReadStatus, ThesisPillar } from '@/lib/types'

interface ExternalSignalInboxProps {
  onSignalCreated: () => void
}

const READ_STATUS_CYCLE: ExternalSignalReadStatus[] = ['unread', 'read', 'disliked']

const READ_STATUS_DISPLAY: Record<ExternalSignalReadStatus, { symbol: string; label: string; className: string }> = {
  unread: { symbol: '◇', label: 'Want to read', className: 'text-ink-muted' },
  read: { symbol: '✓', label: 'Have read', className: 'text-green-ink' },
  disliked: { symbol: '✗', label: 'Did not like', className: 'text-red-ink' },
}

export default function ExternalSignalInbox({ onSignalCreated }: ExternalSignalInboxProps) {
  const { user } = useAuth()
  const [signals, setSignals] = useState<ExternalSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [pillarFilter, setPillarFilter] = useState<'all' | ThesisPillar>('all')
  const [readFilter, setReadFilter] = useState<'all' | ExternalSignalReadStatus>('all')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!user) return
    loadSignals()
  }, [user])

  const loadSignals = async () => {
    if (!user) return
    setLoading(true)
    try {
      const inboxSignals = await getInboxExternalSignals(user.uid)
      setSignals(inboxSignals)
    } catch (error) {
      console.error('Error loading external signals:', error)
    }
    setLoading(false)
  }

  const handleFetchSignals = async () => {
    if (!user || fetching) return
    setFetching(true)
    try {
      const res = await fetch('/api/rss/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.success && data.signals) {
        // Save each signal to Firestore
        for (const signal of data.signals) {
          await saveExternalSignal(user.uid, signal)
        }
        await loadSignals()
        onSignalCreated()
      }
    } catch (error) {
      console.error('Error fetching RSS signals:', error)
    }
    setFetching(false)
  }

  const handleCycleReadStatus = async (signal: ExternalSignal) => {
    if (!user || !signal.id) return
    const current = signal.readStatus || 'unread'
    const currentIdx = READ_STATUS_CYCLE.indexOf(current)
    const next = READ_STATUS_CYCLE[(currentIdx + 1) % READ_STATUS_CYCLE.length]
    try {
      await updateExternalSignal(user.uid, signal.id, { readStatus: next })
      setSignals(signals.map(s => s.id === signal.id ? { ...s, readStatus: next } : s))
    } catch (error) {
      console.error('Error updating read status:', error)
    }
  }

  const handleArchive = async (signalId: string) => {
    if (!user) return
    try {
      await updateExternalSignal(user.uid, signalId, { status: 'archived' })
      setSignals(signals.filter((s) => s.id !== signalId))
    } catch (error) {
      console.error('Error archiving signal:', error)
    }
  }

  const filteredSignals = signals.filter((signal) => {
    if (pillarFilter !== 'all' && !signal.thesisPillars.includes(pillarFilter)) return false
    if (readFilter !== 'all' && (signal.readStatus || 'unread') !== readFilter) return false
    return true
  })

  const displayedSignals = showAll ? filteredSignals : filteredSignals.slice(0, 5)

  if (loading) {
    return (
      <div className="p-8 text-center">
        <span className="font-serif text-[11px] italic text-ink-muted">Loading external signals...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          External Signals · RSS
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchSignals}
            disabled={fetching}
            className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              fetching
                ? 'bg-rule text-ink-muted border-rule cursor-wait'
                : 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
            }`}
          >
            {fetching ? 'Fetching…' : 'Fetch Signals'}
          </button>
          <button
            onClick={() => setShowAll(!showAll)}
            className="font-mono text-[10px] text-ink-muted hover:text-burgundy underline transition-colors"
          >
            {showAll ? 'Top 5' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Pillar Filters */}
      <div className="flex gap-1">
        {(['all', 'ai', 'markets', 'mind'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setPillarFilter(f)}
            className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              pillarFilter === f
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Read Status Filters */}
      <div className="flex gap-1">
        {(['all', 'unread', 'read', 'disliked'] as const).map((f) => {
          const display = f === 'all' ? null : READ_STATUS_DISPLAY[f]
          return (
            <button
              key={f}
              onClick={() => setReadFilter(f)}
              className={`font-mono text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                readFilter === f
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {f === 'all' ? 'All' : `${display!.symbol} ${display!.label}`}
            </button>
          )
        })}
      </div>

      {/* Signals List */}
      {displayedSignals.length === 0 ? (
        <div className="bg-paper border border-rule rounded-sm p-6 text-center">
          <p className="font-sans text-[11px] text-ink-muted">
            {signals.length === 0
              ? 'No external signals yet. Click "Fetch Signals" to pull from RSS feeds.'
              : 'No signals matching current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedSignals.map((signal) => {
            const readStatus = signal.readStatus || 'unread'
            const statusDisplay = READ_STATUS_DISPLAY[readStatus]
            const pillarColors = {
              ai: 'bg-burgundy-bg text-burgundy border-burgundy/20',
              markets: 'bg-green-bg text-green-ink border-green-ink/20',
              mind: 'bg-amber-bg text-amber-ink border-amber-ink/20',
            }

            return (
              <div
                key={signal.id}
                className="bg-white border border-rule rounded-sm p-3 hover:border-burgundy/30 transition-colors"
              >
                {/* Top Row: Read Status + Title + Relevance */}
                <div className="flex items-start gap-2 mb-1.5">
                  <button
                    onClick={() => handleCycleReadStatus(signal)}
                    title={statusDisplay.label}
                    className={`font-mono text-[14px] leading-none mt-0.5 transition-colors hover:opacity-70 ${statusDisplay.className}`}
                  >
                    {statusDisplay.symbol}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <a
                        href={signal.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-[11px] font-semibold text-ink hover:text-burgundy transition-colors truncate"
                      >
                        {signal.title}
                      </a>
                      <span className="font-mono text-[8px] text-ink-muted shrink-0">
                        {Math.round(signal.relevanceScore * 100)}%
                      </span>
                    </div>
                    <p className="font-mono text-[9px] text-ink-muted">
                      {signal.sourceName} · {new Date(signal.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Key Takeaway */}
                {signal.keyTakeaway && (
                  <p className="font-sans text-[10px] font-semibold text-ink leading-relaxed mb-1.5 ml-5">
                    {signal.keyTakeaway}
                  </p>
                )}

                {/* Value Bullets */}
                {signal.valueBullets && signal.valueBullets.length > 0 && (
                  <ul className="ml-5 mb-2 space-y-0.5">
                    {signal.valueBullets.map((bullet, i) => (
                      <li key={i} className="font-sans text-[9px] text-ink-muted leading-relaxed flex items-start gap-1.5">
                        <span className="text-burgundy mt-px shrink-0">·</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Fallback: show aiSummary if no rich data */}
                {!signal.keyTakeaway && signal.aiSummary && (
                  <p className="font-sans text-[10px] text-ink leading-relaxed mb-1.5 ml-5">
                    {signal.aiSummary}
                  </p>
                )}

                {/* Pillars */}
                <div className="flex gap-1 mb-2 ml-5">
                  {signal.thesisPillars.map((pillar) => (
                    <span
                      key={pillar}
                      className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${pillarColors[pillar as keyof typeof pillarColors]}`}
                    >
                      {pillar}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1 border-t border-rule-light ml-5">
                  <a
                    href={signal.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[9px] text-burgundy hover:text-burgundy/70 font-medium transition-colors"
                  >
                    Read →
                  </a>
                  <button
                    onClick={() => handleArchive(signal.id!)}
                    className="font-mono text-[9px] text-ink-muted hover:text-ink transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredSignals.length > 5 && !showAll && (
        <p className="font-mono text-[9px] text-ink-muted text-center pt-1">
          Showing 5 of {filteredSignals.length}
        </p>
      )}

      {/* Legend */}
      <div className="flex gap-3 pt-2 border-t border-rule-light">
        {READ_STATUS_CYCLE.map((status) => {
          const display = READ_STATUS_DISPLAY[status]
          return (
            <span key={status} className="flex items-center gap-1">
              <span className={`font-mono text-[11px] ${display.className}`}>{display.symbol}</span>
              <span className="font-mono text-[8px] text-ink-muted">{display.label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
