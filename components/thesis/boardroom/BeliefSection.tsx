'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useBeliefs } from '@/hooks/useBeliefs'
import { saveBelief } from '@/lib/firestore'
import type { Belief, DecisionDomain } from '@/lib/types'
import BeliefForm from './BeliefForm'

const DOMAIN_COLORS: Record<string, string> = {
  portfolio: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  product: 'text-ink bg-cream border-rule',
  revenue: 'text-green-ink bg-green-bg border-green-ink/20',
  personal: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  thesis: 'text-burgundy bg-burgundy-bg border-burgundy/20',
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'tested', label: 'Tested' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'invalidated', label: 'Invalidated' },
]

interface BeliefSectionProps {
  onActOnBelief?: (belief: Belief) => void
}

export default function BeliefSection({ onActOnBelief }: BeliefSectionProps) {
  const { user } = useAuth()
  const { beliefs, untested, stale, loading, save, remove, refresh } = useBeliefs(user?.uid)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [extendingId, setExtendingId] = useState<string | null>(null)
  const [extendReason, setExtendReason] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const filtered = filter === 'all'
    ? beliefs
    : beliefs.filter(b => b.status === filter)

  // Pin untested beliefs at top
  const sorted = [...filtered].sort((a, b) => {
    const aUntested = !a.antithesis && a.status === 'active' ? 0 : 1
    const bUntested = !b.antithesis && b.status === 'active' ? 0 : 1
    if (aUntested !== bUntested) return aUntested - bUntested
    // Then stale beliefs
    const aStale = a.attentionDate && a.attentionDate <= today && a.status === 'active' ? 0 : 1
    const bStale = b.attentionDate && b.attentionDate <= today && b.status === 'active' ? 0 : 1
    return aStale - bStale
  })

  async function handleSaveNew(data: {
    statement: string
    confidence: number
    domain: DecisionDomain
    evidenceFor: string[]
    evidenceAgainst: string[]
  }) {
    const attentionDate = new Date()
    attentionDate.setDate(attentionDate.getDate() + 21)
    const beliefId = await save({
      ...data,
      linkedDecisionIds: [],
      linkedPrincipleIds: [],
      sourceJournalDate: today,
      attentionDate: attentionDate.toISOString().split('T')[0],
    })
    setShowForm(false)
    // Trigger antithesis in background
    if (beliefId) {
      fetch('/api/beliefs/antithesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async (res) => {
        if (res.ok) {
          const { antithesis, strength } = await res.json()
          if (antithesis) {
            await save({ antithesis, antithesisStrength: strength, status: 'tested' }, beliefId)
          }
        }
      }).catch(() => {})
    }
  }

  async function handleExtend(belief: Belief) {
    if (!belief.id || !extendReason.trim()) return
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 21)
    const newAttentionDate = newDate.toISOString().split('T')[0]
    const extensions = [...(belief.extensions || []), {
      extendedAt: today,
      reason: extendReason.trim(),
      newAttentionDate,
    }]
    await save({ attentionDate: newAttentionDate, extensions }, belief.id)
    setExtendingId(null)
    setExtendReason('')
  }

  async function handleArchive(belief: Belief) {
    if (!belief.id) return
    await save({ status: 'archived' }, belief.id)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-rule-light/40 rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Filter pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              filter === f.key
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setShowForm(!showForm)}
          className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-burgundy text-burgundy hover:bg-burgundy hover:text-paper transition-colors ml-auto"
        >
          + New Belief
        </button>
      </div>

      {/* New belief form */}
      {showForm && (
        <BeliefForm
          onSave={handleSaveNew}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Belief list */}
      {sorted.length === 0 ? (
        <div className="text-center py-6">
          <p className="font-serif text-[11px] text-ink-muted">
            No beliefs yet. Journal your observations — beliefs will be extracted automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {sorted.map(belief => {
            const isExpanded = expandedId === belief.id
            const isStale = belief.attentionDate && belief.attentionDate <= today && belief.status === 'active'
            const isUntested = !belief.antithesis && belief.status === 'active'
            const domainStyle = DOMAIN_COLORS[belief.domain] || DOMAIN_COLORS.thesis

            return (
              <div
                key={belief.id}
                className={`bg-white border rounded-sm ${
                  isStale ? 'border-amber-ink/30 bg-amber-bg' : isUntested ? 'border-amber-ink/20' : 'border-rule'
                }`}
              >
                {/* Collapsed row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : (belief.id || null))}
                  className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 hover:bg-cream/50 transition-colors"
                >
                  <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainStyle}`}>
                    {belief.domain}
                  </span>
                  <span className="text-[10px] font-medium text-ink flex-1 truncate">
                    {belief.statement}
                  </span>
                  <span className={`font-mono text-[9px] font-semibold shrink-0 ${
                    belief.confidence >= 70 ? 'text-green-ink'
                      : belief.confidence >= 40 ? 'text-amber-ink'
                      : 'text-red-ink'
                  }`}>
                    {belief.confidence}%
                  </span>
                  {isUntested && (
                    <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border text-amber-ink bg-amber-bg border-amber-ink/20 shrink-0">
                      untested
                    </span>
                  )}
                  {!isUntested && belief.antithesis && (
                    <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border text-green-ink bg-green-bg border-green-ink/20 shrink-0">
                      tested
                    </span>
                  )}
                  {isStale && (
                    <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border text-amber-ink bg-amber-bg border-amber-ink/20 shrink-0">
                      stale
                    </span>
                  )}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-2 pb-2 border-t border-rule-light space-y-1.5 mt-0.5 pt-1.5">
                    {/* Evidence for */}
                    {belief.evidenceFor.length > 0 && (
                      <div>
                        <span className="font-serif text-[8px] text-green-ink uppercase">Evidence For</span>
                        <ul className="mt-0.5 space-y-0.5">
                          {belief.evidenceFor.map((e, i) => (
                            <li key={i} className="text-[9px] text-ink flex items-start gap-1">
                              <span className="text-green-ink shrink-0 mt-px">+</span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Evidence against */}
                    {belief.evidenceAgainst.length > 0 && (
                      <div>
                        <span className="font-serif text-[8px] text-red-ink uppercase">Evidence Against</span>
                        <ul className="mt-0.5 space-y-0.5">
                          {belief.evidenceAgainst.map((e, i) => (
                            <li key={i} className="text-[9px] text-ink flex items-start gap-1">
                              <span className="text-red-ink shrink-0 mt-px">-</span>
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Antithesis block */}
                    {belief.antithesis ? (
                      <div className="bg-burgundy-bg border-l-2 border-burgundy rounded-sm p-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-serif text-[8px] text-burgundy uppercase">Antithesis</span>
                          {belief.antithesisStrength != null && (
                            <span className={`font-mono text-[8px] font-semibold ${
                              belief.antithesisStrength >= 70 ? 'text-red-ink'
                                : belief.antithesisStrength >= 40 ? 'text-amber-ink'
                                : 'text-green-ink'
                            }`}>
                              {belief.antithesisStrength}% strength
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-ink leading-relaxed">{belief.antithesis}</p>
                      </div>
                    ) : (
                      <div className="bg-amber-bg border-l-2 border-amber-ink/30 rounded-sm p-1.5">
                        <span className="font-serif text-[8px] text-amber-ink uppercase">Awaiting stress test...</span>
                      </div>
                    )}

                    {/* Stale / extend */}
                    {isStale && extendingId !== belief.id && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-amber-ink">Past attention date ({belief.attentionDate})</span>
                        <button
                          onClick={() => setExtendingId(belief.id || null)}
                          className="font-serif text-[8px] text-ink-muted hover:text-burgundy transition-colors"
                        >
                          Extend
                        </button>
                      </div>
                    )}

                    {extendingId === belief.id && (
                      <div className="bg-paper border border-rule rounded-sm p-2 space-y-1">
                        <label className="font-serif text-[8px] text-ink-muted uppercase block">
                          Why extend? (required)
                        </label>
                        <textarea
                          value={extendReason}
                          onChange={e => setExtendReason(e.target.value)}
                          placeholder="Why does this belief need more time?"
                          className="w-full h-12 bg-white border border-rule rounded-sm p-1.5 text-[10px] text-ink resize-none focus:outline-none focus:border-burgundy"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleExtend(belief)}
                            disabled={!extendReason.trim()}
                            className="font-serif text-[8px] px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-40"
                          >
                            Extend +21 days
                          </button>
                          <button
                            onClick={() => { setExtendingId(null); setExtendReason('') }}
                            className="font-serif text-[8px] px-2 py-1 rounded-sm border border-rule text-ink-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Extension history */}
                    {belief.extensions && belief.extensions.length > 0 && (
                      <div>
                        <span className="font-serif text-[8px] text-ink-muted uppercase">Extensions</span>
                        <div className="mt-0.5 space-y-0.5">
                          {belief.extensions.map((ext, i) => (
                            <div key={i} className="text-[8px] text-ink-muted">
                              {ext.extendedAt}: {ext.reason} (to {ext.newAttentionDate})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-rule-light">
                      {onActOnBelief && (
                        <button
                          onClick={() => onActOnBelief(belief)}
                          className="font-serif text-[9px] font-medium text-burgundy hover:text-burgundy/70 transition-colors"
                        >
                          Act on this
                        </button>
                      )}
                      <button
                        onClick={() => handleArchive(belief)}
                        className="font-serif text-[9px] font-medium text-ink-muted hover:text-red-ink transition-colors"
                      >
                        Archive
                      </button>
                      <span className="text-[8px] text-ink-faint ml-auto">
                        {belief.sourceJournalDate}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
