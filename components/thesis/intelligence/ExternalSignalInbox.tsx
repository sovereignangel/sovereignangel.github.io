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
    return <div className="p-8 text-center text-neutral-500">Loading external signals...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">External Signals (RSS Feeds)</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAll ? 'Show Top 5' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('ai')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            filter === 'ai'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          AI
        </button>
        <button
          onClick={() => setFilter('markets')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            filter === 'markets'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Markets
        </button>
        <button
          onClick={() => setFilter('mind')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            filter === 'mind'
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Mind
        </button>
      </div>

      {/* Signals List */}
      {displayedSignals.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
          <p className="text-neutral-600">
            {signals.length === 0
              ? 'No external signals yet. RSS aggregation runs daily at 6:00 AM.'
              : `No signals matching "${filter}" filter`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedSignals.map((signal) => (
            <div
              key={signal.id}
              className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
            >
              {/* Signal Header */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-neutral-900">{signal.title}</h3>
                    <span className="text-xs text-neutral-500">
                      {Math.round(signal.relevanceScore * 100)}% relevant
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mb-2">
                    {signal.sourceName} • {new Date(signal.publishedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-neutral-700">{signal.aiSummary}</p>
                </div>
              </div>

              {/* Pillars */}
              <div className="flex gap-2 mb-3">
                {signal.thesisPillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700"
                  >
                    {pillar}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(signal.sourceUrl, '_blank')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Read Full →
                </button>
                <button
                  onClick={() => handleArchive(signal.id!)}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Archive
                </button>
                {/* TODO: Add "Convert to Signal" button in Phase 3 */}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredSignals.length > 5 && !showAll && (
        <p className="text-sm text-neutral-500 text-center">
          Showing top 5 of {filteredSignals.length} signals
        </p>
      )}
    </div>
  )
}
