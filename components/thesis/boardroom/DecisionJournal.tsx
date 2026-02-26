'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDecisions } from '@/hooks/useDecisions'
import DecisionForm from './DecisionForm'
import type { Decision, DecisionDomain } from '@/lib/types'
import { authFetch } from '@/lib/auth-fetch'

const DOMAIN_LABELS: Record<DecisionDomain, string> = {
  portfolio: 'Portfolio',
  product: 'Product',
  revenue: 'Revenue',
  personal: 'Personal',
  thesis: 'Thesis',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-ink bg-green-bg border-green-ink/20',
  pending_review: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  reviewed: 'text-ink-muted bg-cream border-rule',
  superseded: 'text-ink-faint bg-cream border-rule-light',
}

export default function DecisionJournal() {
  const { user } = useAuth()
  const { decisions, loading, save, remove, pendingReview } = useDecisions(user?.uid)
  const [showForm, setShowForm] = useState(false)
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-rule-light/40 rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Decision Journal
        </h3>
        <button
          onClick={() => { setEditingDecision(null); setShowForm(true) }}
          className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-burgundy text-burgundy hover:bg-burgundy hover:text-paper transition-colors"
        >
          + New Decision
        </button>
      </div>

      {/* Pending Review Alert */}
      {pendingReview.length > 0 && (
        <div className="mb-2 p-2 bg-amber-bg border border-amber-ink/20 rounded-sm">
          <span className="font-serif text-[10px] font-medium text-amber-ink">
            {pendingReview.length} decision{pendingReview.length > 1 ? 's' : ''} pending 90-day review
          </span>
        </div>
      )}

      {/* Decision Form Modal */}
      {showForm && (
        <DecisionForm
          decision={editingDecision}
          onSave={async (data) => {
            const decisionId = await save(data, editingDecision?.id)
            setShowForm(false)
            setEditingDecision(null)
            // Generate antithesis in background for new decisions
            if (!editingDecision && data.title && data.chosenOption) {
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
                    save({ antithesis: result.antithesis, antithesisConfidence: result.confidence }, decisionId)
                  }
                })
                .catch(() => {})
            }
          }}
          onClose={() => { setShowForm(false); setEditingDecision(null) }}
        />
      )}

      {/* Decision List */}
      {decisions.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-serif text-[11px] text-ink-muted">No decisions recorded yet.</p>
          <p className="font-serif text-[9px] text-ink-faint mt-1">
            Every decision is a hypothesis. Track confidence, set kill criteria, review in 90 days.
          </p>
        </div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
          {decisions.map((d) => {
            const isExpanded = expandedId === d.id
            return (
              <div key={d.id} className="border border-rule rounded-sm bg-white">
                {/* Compact Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : d.id!)}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-cream/50 transition-colors"
                >
                  <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${STATUS_COLORS[d.status]}`}>
                    {d.status.replace('_', ' ')}
                  </span>
                  <span className="font-serif text-[11px] font-medium text-ink flex-1 truncate">
                    {d.title}
                  </span>
                  <span className="font-mono text-[8px] text-ink-faint uppercase">
                    {DOMAIN_LABELS[d.domain]}
                  </span>
                  <span className={`font-mono text-[10px] font-semibold ${
                    d.confidenceLevel >= 70 ? 'text-green-ink' : d.confidenceLevel >= 40 ? 'text-amber-ink' : 'text-red-ink'
                  }`}>
                    {d.confidenceLevel}%
                  </span>
                  <span className="font-mono text-[8px] text-ink-faint">
                    {d.decidedAt}
                  </span>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-rule-light p-2 space-y-1.5">
                    <div>
                      <span className="font-serif text-[9px] text-ink-muted uppercase">Hypothesis</span>
                      <p className="font-serif text-[10px] text-ink mt-0.5">{d.hypothesis}</p>
                    </div>
                    <div>
                      <span className="font-serif text-[9px] text-ink-muted uppercase">Chosen</span>
                      <p className="font-serif text-[10px] text-ink mt-0.5">{d.chosenOption}</p>
                    </div>
                    <div>
                      <span className="font-serif text-[9px] text-ink-muted uppercase">Reasoning</span>
                      <p className="font-serif text-[10px] text-ink mt-0.5">{d.reasoning}</p>
                    </div>
                    {d.killCriteria.length > 0 && (
                      <div>
                        <span className="font-serif text-[9px] text-ink-muted uppercase">Kill Criteria</span>
                        <ul className="mt-0.5">
                          {d.killCriteria.map((k, i) => (
                            <li key={i} className="font-serif text-[10px] text-red-ink">• {k}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {d.premortem && (
                      <div>
                        <span className="font-serif text-[9px] text-ink-muted uppercase">Pre-Mortem</span>
                        <p className="font-serif text-[10px] text-ink mt-0.5">{d.premortem}</p>
                      </div>
                    )}
                    {d.antithesis && (
                      <div className="bg-burgundy-bg border border-burgundy/20 rounded-sm p-2">
                        <span className="font-serif text-[9px] text-burgundy uppercase">Antithesis</span>
                        <p className="font-serif text-[10px] text-ink mt-0.5">{d.antithesis}</p>
                        {d.antithesisConfidence != null && (
                          <span className="font-mono text-[8px] text-ink-muted mt-0.5 block">
                            Counter-argument strength: {d.antithesisConfidence}%
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-rule-light">
                      <span className="font-mono text-[8px] text-ink-faint">
                        Review: {d.reviewDate}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingDecision(d); setShowForm(true) }}
                          className="font-serif text-[8px] px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-burgundy hover:border-burgundy transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => d.id && remove(d.id)}
                          className="font-serif text-[8px] px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-red-ink hover:border-red-ink transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {/* Outcome section for reviewed decisions */}
                    {d.outcomeScore !== undefined && (
                      <div className="pt-1 border-t border-rule-light">
                        <span className="font-serif text-[9px] text-ink-muted uppercase">Outcome</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`font-mono text-[11px] font-bold ${
                            d.outcomeScore >= 70 ? 'text-green-ink' : d.outcomeScore >= 40 ? 'text-amber-ink' : 'text-red-ink'
                          }`}>
                            {d.outcomeScore}%
                          </span>
                          <span className="font-mono text-[9px] text-ink-muted">
                            calibration: {Math.abs(d.confidenceLevel - d.outcomeScore)}pt gap
                          </span>
                        </div>
                        {d.actualOutcome && (
                          <p className="font-serif text-[10px] text-ink mt-0.5">{d.actualOutcome}</p>
                        )}
                        {d.learnings && (
                          <p className="font-serif text-[10px] text-ink-muted italic mt-0.5">{d.learnings}</p>
                        )}
                      </div>
                    )}
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
