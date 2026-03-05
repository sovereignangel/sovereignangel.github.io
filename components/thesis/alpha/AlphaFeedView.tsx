'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getSignals, saveSignal, saveHypothesis } from '@/lib/firestore'
import type { Signal } from '@/lib/types'

const DOMAIN_LABELS: Record<string, string> = {
  problem: 'Problem',
  market: 'Market',
  research: 'Research',
  arbitrage: 'Arbitrage',
}

export default function AlphaFeedView() {
  const { user } = useAuth()
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [arbitrageGap, setArbitrageGap] = useState('')
  const [promoting, setPromoting] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const data = await getSignals(user.uid)
      setSignals(data.filter(s => s.status !== 'archived'))
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { refresh() }, [refresh])

  const handleCreate = async () => {
    if (!user?.uid || !title.trim()) return
    await saveSignal(user.uid, {
      title: title.trim(),
      description: description.trim(),
      arbitrageGap: arbitrageGap.trim(),
      signalType: 'arbitrage',
      marketSignalType: '',
      painPoint: '',
      currentSolution: '',
      whyBroken: '',
      aiMarketAngle: '',
      researchConcept: '',
      thesisConnection: '',
      whyChangesEdge: '',
      testIdea: '',
      timelineDays: 0,
      revenuePotential: 0,
      actionThisWeek: '',
      relevantToThesis: true,
      status: 'open',
      sourceType: 'manual',
    })
    setTitle('')
    setDescription('')
    setArbitrageGap('')
    setShowForm(false)
    await refresh()
  }

  const handlePromote = async (signal: Signal) => {
    if (!user?.uid || !signal.id) return
    setPromoting(signal.id)
    try {
      await saveHypothesis(user.uid, {
        question: signal.arbitrageGap || signal.title,
        context: signal.description,
        domain: 'portfolio',
        status: 'open',
        priority: 'medium',
        evidence: [],
        sourceType: 'manual',
        sourceId: signal.id,
      })
      // Mark signal as being investigated
      await saveSignal(user.uid, { status: 'testing' }, signal.id)
      await refresh()
    } finally {
      setPromoting(null)
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'testing': return 'text-amber-ink bg-amber-bg border-amber-ink/20'
      case 'open': return 'text-green-ink bg-green-bg border-green-ink/20'
      default: return 'text-ink-muted bg-cream border-rule'
    }
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Signal Feed
          </h3>
          <p className="font-sans text-[9px] text-ink-muted mt-0.5">
            Raw observations — market anomalies, idea sparks, arbitrage gaps
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
            showForm
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
          }`}
        >
          {showForm ? 'Cancel' : '+ Signal'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-rule rounded-sm p-3 space-y-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Signal title..."
            className="w-full font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What did you observe?"
            rows={2}
            className="w-full font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 placeholder:text-ink-faint focus:outline-none focus:border-burgundy resize-none"
          />
          <input
            value={arbitrageGap}
            onChange={e => setArbitrageGap(e.target.value)}
            placeholder="Arbitrage gap — where's the edge?"
            className="w-full font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
          />
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-40"
          >
            Save Signal
          </button>
        </div>
      )}

      {/* Signal Cards */}
      {loading ? (
        <p className="font-sans text-[10px] text-ink-muted">Loading signals...</p>
      ) : signals.length === 0 ? (
        <div className="bg-white border border-rule rounded-sm p-3 text-center">
          <p className="font-sans text-[10px] text-ink-muted">No signals yet. Add your first observation.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {signals.map(signal => (
            <div key={signal.id} className="bg-white border border-rule rounded-sm p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-sans text-[11px] font-semibold text-ink truncate">{signal.title}</span>
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${statusColor(signal.status)}`}>
                      {signal.status}
                    </span>
                    <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border text-ink-muted bg-cream border-rule">
                      {DOMAIN_LABELS[signal.signalType] || signal.signalType}
                    </span>
                  </div>
                  {signal.description && (
                    <p className="font-sans text-[9px] text-ink-muted line-clamp-2">{signal.description}</p>
                  )}
                  {signal.arbitrageGap && (
                    <p className="font-mono text-[9px] text-burgundy mt-0.5">
                      Edge: {signal.arbitrageGap}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handlePromote(signal)}
                  disabled={promoting === signal.id || signal.status === 'testing'}
                  className="font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border bg-transparent text-burgundy border-burgundy/30 hover:bg-burgundy-bg disabled:opacity-40 shrink-0"
                >
                  {promoting === signal.id ? '...' : signal.status === 'testing' ? 'Promoted' : 'Form Thesis →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
