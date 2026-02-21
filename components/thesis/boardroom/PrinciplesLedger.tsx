'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePrinciples } from '@/hooks/usePrinciples'
import type { Principle, PrincipleSource, DecisionDomain } from '@/lib/types'

const SOURCE_LABELS: Record<PrincipleSource, string> = {
  decision: 'Decision',
  synthesis: 'Synthesis',
  conversation: 'Conversation',
  manual: 'Manual',
  book: 'Book',
}

const DOMAIN_LABELS: Record<DecisionDomain, string> = {
  portfolio: 'Portfolio',
  product: 'Product',
  revenue: 'Revenue',
  personal: 'Personal',
  thesis: 'Thesis',
}

export default function PrinciplesLedger() {
  const { user } = useAuth()
  const { principles, active, loading, save, reinforce, remove } = usePrinciples(user?.uid)
  const [showForm, setShowForm] = useState(false)
  const [filterDomain, setFilterDomain] = useState<DecisionDomain | 'all'>('all')

  // New principle form state
  const [text, setText] = useState('')
  const [shortForm, setShortForm] = useState('')
  const [source, setSource] = useState<PrincipleSource>('manual')
  const [sourceDescription, setSourceDescription] = useState('')
  const [domain, setDomain] = useState<DecisionDomain>('thesis')

  const filtered = filterDomain === 'all'
    ? principles
    : principles.filter(p => p.domain === filterDomain)

  const handleSave = async () => {
    if (!text.trim()) return
    const today = new Date().toISOString().split('T')[0]
    await save({
      text: text.trim(),
      shortForm: shortForm.trim() || text.trim().slice(0, 40),
      source,
      sourceDescription: sourceDescription.trim(),
      domain,
      dateFirstApplied: today,
      lastReinforcedAt: today,
      linkedDecisionIds: [],
    })
    setText('')
    setShortForm('')
    setSourceDescription('')
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-rule-light/40 rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Principles
          </h3>
          <span className="font-mono text-[9px] text-ink-muted">
            {active.length} active
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-burgundy text-burgundy hover:bg-burgundy hover:text-paper transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Domain Filter */}
      <div className="flex gap-0.5 mb-2">
        {(['all', 'portfolio', 'product', 'revenue', 'personal', 'thesis'] as const).map(d => (
          <button
            key={d}
            onClick={() => setFilterDomain(d)}
            className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
              filterDomain === d
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {d === 'all' ? 'All' : DOMAIN_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="mb-2 p-2 border border-rule rounded-sm bg-white space-y-1.5">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
            placeholder="Principle text (e.g., 'Pain + Reflection = Progress')"
          />
          <input
            value={shortForm}
            onChange={e => setShortForm(e.target.value)}
            className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
            placeholder="Short form (optional, max 40 chars)"
          />
          <div className="flex gap-1.5">
            <div className="flex-1">
              <span className="font-serif text-[8px] text-ink-muted uppercase block mb-0.5">Source</span>
              <select
                value={source}
                onChange={e => setSource(e.target.value as PrincipleSource)}
                className="w-full font-sans text-[9px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-burgundy"
              >
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <span className="font-serif text-[8px] text-ink-muted uppercase block mb-0.5">Domain</span>
              <select
                value={domain}
                onChange={e => setDomain(e.target.value as DecisionDomain)}
                className="w-full font-sans text-[9px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-burgundy"
              >
                {Object.entries(DOMAIN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <input
            value={sourceDescription}
            onChange={e => setSourceDescription(e.target.value)}
            className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
            placeholder="Where did this principle come from?"
          />
          <div className="flex justify-end gap-1">
            <button onClick={() => setShowForm(false)} className="font-serif text-[8px] px-2 py-0.5 text-ink-muted">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!text.trim()}
              className="font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Principles List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-serif text-[11px] text-ink-muted">No principles recorded yet.</p>
          <p className="font-serif text-[9px] text-ink-faint mt-1">
            Derive principles from decisions, synthesis, and experience.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-start gap-2 p-2 border border-rule rounded-sm bg-white group">
              <div className="flex-1 min-w-0">
                <p className="font-serif text-[11px] font-medium text-ink leading-tight">
                  {p.text}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                    {DOMAIN_LABELS[p.domain]}
                  </span>
                  <span className="font-mono text-[7px] text-ink-faint">
                    {SOURCE_LABELS[p.source]}
                  </span>
                  <span className="font-mono text-[7px] text-ink-faint">
                    {p.dateFirstApplied}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <button
                  onClick={() => p.id && reinforce(p.id)}
                  className="font-mono text-[10px] font-bold text-green-ink hover:bg-green-bg px-1 py-0.5 rounded-sm transition-colors"
                  title="Reinforce this principle"
                >
                  +1
                </button>
                <span className="font-mono text-[9px] font-semibold text-ink">
                  {p.reinforcementCount}×
                </span>
                <span className="font-mono text-[7px] text-ink-faint">
                  {p.lastReinforcedAt}
                </span>
              </div>
              <button
                onClick={() => p.id && remove(p.id)}
                className="font-mono text-[9px] text-ink-faint hover:text-red-ink opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
