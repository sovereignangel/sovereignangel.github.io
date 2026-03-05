'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getHypotheses, saveHypothesis } from '@/lib/firestore'
import { saveAlphaExperiment } from '@/lib/firestore'
import type { Hypothesis } from '@/lib/types'

export default function AlphaThesesView({ onExperimentCreated }: { onExperimentCreated?: () => void }) {
  const { user } = useAuth()
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const refresh = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const data = await getHypotheses(user.uid)
      setHypotheses(data)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { refresh() }, [refresh])

  const handlePromote = async (h: Hypothesis) => {
    if (!user?.uid || !h.id) return
    setPromoting(h.id)
    try {
      await saveAlphaExperiment(user.uid, {
        title: h.question,
        thesis: h.question,
        domain: 'financial',
        strategy: '',
        expectedOutcome: '',
        killCriteria: [],
        timeHorizonDays: 30,
        investmentDescription: '',
        status: 'design',
        linkedSignalIds: h.sourceId ? [h.sourceId] : [],
        linkedHypothesisIds: [h.id],
        logEntries: [],
      })
      // Mark hypothesis as investigating
      await saveHypothesis(user.uid, { status: 'investigating' }, h.id)
      await refresh()
      onExperimentCreated?.()
    } finally {
      setPromoting(null)
    }
  }

  const handleStatusChange = async (h: Hypothesis, newStatus: string) => {
    if (!user?.uid || !h.id) return
    await saveHypothesis(user.uid, { status: newStatus as Hypothesis['status'] }, h.id)
    await refresh()
  }

  const filtered = statusFilter === 'all' ? hypotheses : hypotheses.filter(h => h.status === statusFilter)

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-burgundy bg-burgundy-bg border-burgundy/20'
      case 'medium': return 'text-amber-ink bg-amber-bg border-amber-ink/20'
      default: return 'text-ink-muted bg-cream border-rule'
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'investigating': return 'text-amber-ink bg-amber-bg border-amber-ink/20'
      case 'resolved': return 'text-green-ink bg-green-bg border-green-ink/20'
      case 'abandoned': return 'text-ink-muted bg-cream border-rule'
      default: return 'text-burgundy bg-burgundy-bg border-burgundy/20'
    }
  }

  const FILTERS = ['all', 'open', 'investigating', 'resolved', 'abandoned']

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div>
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Alpha Theses
        </h3>
        <p className="font-sans text-[9px] text-ink-muted mt-0.5">
          Directional hypotheses with evidence tracking — promote to experiments when ready
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
              statusFilter === f
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Hypotheses */}
      {loading ? (
        <p className="font-sans text-[10px] text-ink-muted">Loading theses...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-rule rounded-sm p-3 text-center">
          <p className="font-sans text-[10px] text-ink-muted">
            {statusFilter === 'all' ? 'No hypotheses yet. Promote signals from the Feed.' : `No ${statusFilter} hypotheses.`}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(h => (
            <div key={h.id} className="bg-white border border-rule rounded-sm p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="font-sans text-[11px] font-semibold text-ink">{h.question}</span>
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${statusColor(h.status)}`}>
                      {h.status}
                    </span>
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${priorityColor(h.priority)}`}>
                      {h.priority}
                    </span>
                  </div>
                  {h.context && (
                    <p className="font-sans text-[9px] text-ink-muted line-clamp-2 mt-0.5">{h.context}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[9px] text-ink-muted">
                      Evidence: {h.evidence?.length || 0}
                    </span>
                    {h.evidence && h.evidence.length > 0 && (
                      <>
                        <span className="font-mono text-[8px] text-green-ink">
                          +{h.evidence.filter(e => e.supports === 'for').length}
                        </span>
                        <span className="font-mono text-[8px] text-red-ink">
                          -{h.evidence.filter(e => e.supports === 'against').length}
                        </span>
                      </>
                    )}
                    {h.domain && (
                      <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border text-ink-muted bg-cream border-rule">
                        {h.domain}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {h.status === 'open' && (
                    <button
                      onClick={() => handleStatusChange(h, 'investigating')}
                      className="font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint"
                    >
                      Investigate
                    </button>
                  )}
                  {(h.status === 'open' || h.status === 'investigating') && (
                    <button
                      onClick={() => handlePromote(h)}
                      disabled={promoting === h.id}
                      className="font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border bg-transparent text-burgundy border-burgundy/30 hover:bg-burgundy-bg disabled:opacity-40"
                    >
                      {promoting === h.id ? '...' : 'Design Experiment →'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
