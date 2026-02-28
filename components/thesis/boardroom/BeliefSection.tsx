'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useBeliefs } from '@/hooks/useBeliefs'
import { useDecisions } from '@/hooks/useDecisions'
import { saveBelief } from '@/lib/firestore'
import type { Belief, DecisionDomain } from '@/lib/types'
import { authFetch } from '@/lib/auth-fetch'
import BeliefForm from './BeliefForm'
import DecisionForm from './DecisionForm'

const DOMAIN_COLORS: Record<string, string> = {
  portfolio: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  product: 'text-ink-muted bg-cream border-rule',
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
  const { save: saveDecision } = useDecisions(user?.uid)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [extendingId, setExtendingId] = useState<string | null>(null)
  const [extendReason, setExtendReason] = useState('')
  const [sharpeningId, setSharpeningId] = useState<string | null>(null)
  const [sharpenResult, setSharpenResult] = useState<{ refined: string; reasoning: string } | null>(null)
  const [sharpenLoading, setSharpenLoading] = useState(false)
  const [editingStatementId, setEditingStatementId] = useState<string | null>(null)
  const [editedStatement, setEditedStatement] = useState('')
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null)
  // "Act on this" modal state
  const [actOnBelief, setActOnBelief] = useState<Belief | null>(null)

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
      authFetch('/api/beliefs/antithesis', {
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

  async function handleSharpen(belief: Belief) {
    if (!belief.id) return
    setSharpeningId(belief.id)
    setSharpenResult(null)
    setSharpenLoading(true)
    try {
      const res = await authFetch('/api/beliefs/sharpen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: belief.statement,
          confidence: belief.confidence,
          domain: belief.domain,
          evidenceFor: belief.evidenceFor,
          evidenceAgainst: belief.evidenceAgainst,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.refined) {
          setSharpenResult(data)
        }
      }
    } catch {
      // ignore
    } finally {
      setSharpenLoading(false)
    }
  }

  async function handleAcceptSharpen(belief: Belief) {
    if (!belief.id || !sharpenResult?.refined) return
    // Preserve current statement in history
    const previousStatements = [...(belief.previousStatements || []), {
      statement: belief.statement,
      sharpenedAt: today,
      reasoning: sharpenResult.reasoning,
    }]
    await save({ statement: sharpenResult.refined, previousStatements }, belief.id)
    setSharpeningId(null)
    setSharpenResult(null)
    // Enter edit mode so user can fix dates, etc.
    setEditingStatementId(belief.id)
    setEditedStatement(sharpenResult.refined)
  }

  async function handleSaveEditedStatement(belief: Belief) {
    if (!belief.id || !editedStatement.trim()) return
    await save({ statement: editedStatement.trim() }, belief.id)
    setEditingStatementId(null)
    setEditedStatement('')
  }

  async function handleActOnBelief(belief: Belief) {
    setActOnBelief(belief)
  }

  async function handleSaveDecisionFromBelief(data: Partial<import('@/lib/types').Decision>) {
    if (!actOnBelief?.id) return
    const decisionId = await saveDecision(data)
    // Link the decision back to the belief
    if (decisionId && actOnBelief.id) {
      const updatedLinked = [...(actOnBelief.linkedDecisionIds || []), decisionId]
      await save({ linkedDecisionIds: updatedLinked }, actOnBelief.id)
    }
    setActOnBelief(null)
    // Generate antithesis in background
    if (data.title && data.chosenOption) {
      authFetch('/api/decisions/antithesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          hypothesis: data.hypothesis,
          chosenOption: data.chosenOption,
          reasoning: data.reasoning,
          options: data.options,
          premortem: data.premortem,
        }),
      })
        .then(res => res.json())
        .then(result => {
          if (result.antithesis && decisionId) {
            saveDecision({ antithesis: result.antithesis, antithesisConfidence: result.confidence }, decisionId)
          }
        })
        .catch(() => {})
    }
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
        <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1">
          {sorted.map(belief => {
            const isExpanded = expandedId === belief.id
            const isStale = belief.attentionDate && belief.attentionDate <= today && belief.status === 'active'
            const isUntested = !belief.antithesis && belief.status === 'active'
            const domainStyle = DOMAIN_COLORS[belief.domain] || DOMAIN_COLORS.thesis
            const isSharpeningThis = sharpeningId === belief.id
            const isEditingThis = editingStatementId === belief.id
            const hasHistory = belief.previousStatements && belief.previousStatements.length > 0
            const showingHistory = showHistoryId === belief.id

            return (
              <div
                key={belief.id}
                className={`bg-white border rounded-sm relative group ${
                  isStale ? 'border-amber-ink/30 bg-amber-bg' : isUntested ? 'border-amber-ink/20' : 'border-rule'
                }`}
              >
                {/* Delete X — top right, visible on hover */}
                <button
                  onClick={(e) => { e.stopPropagation(); belief.id && remove(belief.id) }}
                  className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center font-mono text-[10px] text-ink-faint hover:text-red-ink opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Delete belief"
                >
                  ×
                </button>
                {/* Collapsed row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : (belief.id || null))}
                  className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 pr-6 hover:bg-cream/50 transition-colors"
                >
                  <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainStyle}`}>
                    {belief.domain}
                  </span>
                  {/* Statement: truncate when collapsed, full text when expanded */}
                  <span className={`font-serif text-[11px] text-ink flex-1 ${isExpanded ? '' : 'truncate'}`}>
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
                    {/* Editable statement (after sharpen or manual edit) */}
                    {isEditingThis ? (
                      <div className="space-y-1">
                        <label className="font-serif text-[8px] text-burgundy uppercase tracking-[0.5px]">Edit Statement</label>
                        <textarea
                          value={editedStatement}
                          onChange={e => setEditedStatement(e.target.value)}
                          className="w-full h-16 bg-white border border-burgundy rounded-sm p-1.5 font-serif text-[10px] text-ink resize-none focus:outline-none"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveEditedStatement(belief)}
                            disabled={!editedStatement.trim()}
                            className="font-serif text-[8px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-40"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingStatementId(null); setEditedStatement('') }}
                            className="font-serif text-[8px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Previous statements history (sharpen trail) */}
                    {hasHistory && (
                      <div>
                        <button
                          onClick={() => setShowHistoryId(showingHistory ? null : (belief.id || null))}
                          className="font-serif text-[8px] text-ink-muted hover:text-burgundy transition-colors"
                        >
                          {showingHistory ? '▾' : '▸'} {belief.previousStatements!.length} previous version{belief.previousStatements!.length > 1 ? 's' : ''}
                        </button>
                        {showingHistory && (
                          <div className="mt-1 space-y-1 pl-2 border-l border-rule-light">
                            {belief.previousStatements!.map((prev, i) => (
                              <div key={i} className="space-y-0.5">
                                <p className="font-serif text-[9px] text-ink-muted line-through leading-relaxed">{prev.statement}</p>
                                <p className="font-serif text-[8px] text-ink-faint italic">{prev.reasoning}</p>
                                <span className="font-mono text-[7px] text-ink-faint">Replaced {prev.sharpenedAt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Evidence for */}
                    {belief.evidenceFor.length > 0 && (
                      <div>
                        <span className="font-serif text-[8px] text-green-ink uppercase tracking-[0.5px]">Evidence For</span>
                        <ul className="mt-0.5 space-y-0.5">
                          {belief.evidenceFor.map((e, i) => (
                            <li key={i} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
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
                        <span className="font-serif text-[8px] text-red-ink uppercase tracking-[0.5px]">Evidence Against</span>
                        <ul className="mt-0.5 space-y-0.5">
                          {belief.evidenceAgainst.map((e, i) => (
                            <li key={i} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
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
                          <span className="font-serif text-[8px] text-burgundy uppercase tracking-[0.5px]">Antithesis</span>
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
                        <p className="font-serif text-[9px] text-ink-muted leading-relaxed">{belief.antithesis}</p>
                      </div>
                    ) : (
                      <div className="bg-amber-bg border-l-2 border-amber-ink/30 rounded-sm p-1.5">
                        <span className="font-serif text-[8px] text-amber-ink uppercase tracking-[0.5px]">Awaiting stress test...</span>
                      </div>
                    )}

                    {/* Sharpen suggestion */}
                    {isSharpeningThis && sharpenLoading && (
                      <div className="bg-cream border border-rule rounded-sm p-1.5">
                        <span className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px]">Sharpening...</span>
                      </div>
                    )}
                    {isSharpeningThis && sharpenResult && (
                      <div className="bg-green-bg border-l-2 border-green-ink rounded-sm p-1.5 space-y-1">
                        <span className="font-serif text-[8px] text-green-ink uppercase tracking-[0.5px]">Refined Version</span>
                        <p className="font-serif text-[10px] text-ink leading-relaxed">{sharpenResult.refined}</p>
                        <p className="font-serif text-[8px] text-ink-muted leading-tight">{sharpenResult.reasoning}</p>
                        <div className="flex gap-1 pt-0.5">
                          <button
                            onClick={() => handleAcceptSharpen(belief)}
                            className="font-serif text-[8px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors"
                          >
                            Accept & Resave
                          </button>
                          <button
                            onClick={() => { setSharpeningId(null); setSharpenResult(null) }}
                            className="font-serif text-[8px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted hover:text-ink transition-colors"
                          >
                            Keep Original
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stale / extend */}
                    {isStale && extendingId !== belief.id && (
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-[9px] text-amber-ink">Past attention date ({belief.attentionDate})</span>
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
                        <label className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px] block">
                          Why extend? (required)
                        </label>
                        <textarea
                          value={extendReason}
                          onChange={e => setExtendReason(e.target.value)}
                          placeholder="Why does this belief need more time?"
                          className="w-full h-12 bg-white border border-rule rounded-sm p-1.5 font-serif text-[10px] text-ink resize-none focus:outline-none focus:border-burgundy"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleExtend(belief)}
                            disabled={!extendReason.trim()}
                            className="font-serif text-[8px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-40"
                          >
                            Extend +21 days
                          </button>
                          <button
                            onClick={() => { setExtendingId(null); setExtendReason('') }}
                            className="font-serif text-[8px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Extension history */}
                    {belief.extensions && belief.extensions.length > 0 && (
                      <div>
                        <span className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px]">Extensions</span>
                        <div className="mt-0.5 space-y-0.5">
                          {belief.extensions.map((ext, i) => (
                            <div key={i} className="font-mono text-[8px] text-ink-muted">
                              {ext.extendedAt}: {ext.reason} (to {ext.newAttentionDate})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-rule-light">
                      <button
                        onClick={() => handleSharpen(belief)}
                        disabled={sharpenLoading && isSharpeningThis}
                        className="font-serif text-[9px] font-medium text-burgundy hover:text-burgundy/70 transition-colors"
                      >
                        {sharpenLoading && isSharpeningThis ? 'Sharpening...' : 'Sharpen'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingStatementId(belief.id || null)
                          setEditedStatement(belief.statement)
                        }}
                        className="font-serif text-[9px] font-medium text-ink-muted hover:text-burgundy transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleActOnBelief(belief)}
                        className="font-serif text-[9px] font-medium text-burgundy hover:text-burgundy/70 transition-colors"
                      >
                        Act on this
                      </button>
                      <button
                        onClick={() => handleArchive(belief)}
                        className="font-serif text-[9px] font-medium text-ink-muted hover:text-red-ink transition-colors"
                      >
                        Archive
                      </button>
                      <span className="font-mono text-[8px] text-ink-faint ml-auto">
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

      {/* "Act on this" Decision Modal */}
      {actOnBelief && (
        <DecisionForm
          decision={null}
          prefill={{
            title: `Decision: ${actOnBelief.statement.slice(0, 60)}${actOnBelief.statement.length > 60 ? '...' : ''}`,
            hypothesis: actOnBelief.statement,
            domain: actOnBelief.domain,
            confidenceLevel: actOnBelief.confidence,
            linkedBeliefIds: actOnBelief.id ? [actOnBelief.id] : [],
          }}
          onSave={handleSaveDecisionFromBelief}
          onClose={() => setActOnBelief(null)}
        />
      )}
    </div>
  )
}
