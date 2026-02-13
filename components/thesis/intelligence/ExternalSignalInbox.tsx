'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getTodaysExternalSignals, updateExternalSignal } from '@/lib/firestore'
import { ExternalSignal, ThesisPillar } from '@/lib/types'

interface ExternalSignalInboxProps {
  onSignalCreated: () => void
}

export default function ExternalSignalInbox({ onSignalCreated }: ExternalSignalInboxProps) {
  const { user } = useAuth()
  const [signals, setSignals] = useState<ExternalSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | ThesisPillar>('all')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!user) return
    loadSignals()
  }, [user])

  const loadSignals = async () => {
    if (!user) return
    setLoading(true)
    try {
      const todaySignals = await getTodaysExternalSignals(user.uid)
      setSignals(todaySignals)
    } catch (error) {
      console.error('Error loading external signals:', error)
    }
    setLoading(false)
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
    if (filter === 'all') return true
    return signal.thesisPillars.includes(filter)
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
      {/* Header - Armstrong Style */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          External Signals · RSS
        </h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="font-mono text-[10px] text-ink-muted hover:text-burgundy underline transition-colors"
        >
          {showAll ? 'Top 5' : 'Show All'}
        </button>
      </div>

      {/* Filter Chips - Armstrong Style */}
      <div className="flex gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
            filter === 'all'
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('ai')}
          className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
            filter === 'ai'
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
          }`}
        >
          AI
        </button>
        <button
          onClick={() => setFilter('markets')}
          className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
            filter === 'markets'
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
          }`}
        >
          Markets
        </button>
        <button
          onClick={() => setFilter('mind')}
          className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
            filter === 'mind'
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
          }`}
        >
          Mind
        </button>
      </div>

      {/* Signals List */}
      {displayedSignals.length === 0 ? (
        <div className="bg-paper border border-rule rounded-sm p-6 text-center">
          <p className="font-sans text-[11px] text-ink-muted">
            {signals.length === 0
              ? 'No external signals yet. RSS aggregation runs daily at 6:00 AM.'
              : `No signals matching "${filter}" filter`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedSignals.map((signal) => (
            <div
              key={signal.id}
              className="bg-white border border-rule rounded-sm p-3 hover:border-burgundy/30 transition-colors"
            >
              {/* Signal Header */}
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-sans text-[11px] font-semibold text-ink">{signal.title}</h3>
                    <span className="font-mono text-[8px] text-ink-muted">
                      {Math.round(signal.relevanceScore * 100)}%
                    </span>
                  </div>
                  <p className="font-mono text-[9px] text-ink-muted mb-1.5">
                    {signal.sourceName} · {new Date(signal.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="font-sans text-[10px] text-ink leading-relaxed">{signal.aiSummary}</p>
                </div>
              </div>

              {/* Pillars */}
              <div className="flex gap-1 mb-2">
                {signal.thesisPillars.map((pillar) => {
                  const pillarColors = {
                    ai: 'bg-burgundy-bg text-burgundy border-burgundy/20',
                    markets: 'bg-green-bg text-green-ink border-green-ink/20',
                    mind: 'bg-amber-bg text-amber-ink border-amber-ink/20',
                  }
                  return (
                    <span
                      key={pillar}
                      className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${pillarColors[pillar as keyof typeof pillarColors]}`}
                    >
                      {pillar}
                    </span>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1 border-t border-rule-light">
                <button
                  onClick={() => window.open(signal.sourceUrl, '_blank')}
                  className="font-mono text-[9px] text-burgundy hover:text-burgundy-light font-medium transition-colors"
                >
                  Read →
                </button>
                <button
                  onClick={() => handleArchive(signal.id!)}
                  className="font-mono text-[9px] text-ink-muted hover:text-ink transition-colors"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredSignals.length > 5 && !showAll && (
        <p className="font-mono text-[9px] text-ink-muted text-center pt-1">
          Showing 5 of {filteredSignals.length}
        </p>
      )}
    </div>
  )
}
