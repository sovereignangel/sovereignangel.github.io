'use client'

import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import type { ReviewableContact, ReviewableDecision, ReviewablePrinciple, ReviewableBelief, ReviewableNote, ReviewItemStatus } from '@/lib/types'

interface JournalReviewData {
  id: string
  uid: string
  date: string
  journalText: string
  contacts: ReviewableContact[]
  decisions: ReviewableDecision[]
  principles: ReviewablePrinciple[]
  beliefs: ReviewableBelief[]
  notes: ReviewableNote[]
  status: 'saved' | 'corrected'
}

function StatusBadge({ status }: { status: ReviewItemStatus }) {
  const colors: Record<ReviewItemStatus, string> = {
    saved: 'text-green-ink border-green-ink/20 bg-green-bg',
    edited: 'text-burgundy border-burgundy/20 bg-burgundy-bg',
    deleted: 'text-red-ink border-red-ink/20 bg-[#8c2d2d08]',
  }
  return (
    <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${colors[status]}`}>
      {status}
    </span>
  )
}

function ItemActions({ status, onDelete }: { status: ReviewItemStatus; onDelete: () => void }) {
  if (status === 'deleted') {
    return (
      <button
        onClick={onDelete}
        className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint"
      >
        Restore
      </button>
    )
  }
  return (
    <button
      onClick={onDelete}
      className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-red-ink border-red-ink/30 hover:bg-[#8c2d2d08]"
    >
      Delete
    </button>
  )
}

export default function JournalReviewView({ reviewId }: { reviewId: string }) {
  const [review, setReview] = useState<JournalReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const fetchReview = useCallback(async () => {
    try {
      const res = await authFetch(`/api/journal-review/${reviewId}`)
      if (!res.ok) throw new Error('Failed to load review')
      const data = await res.json()
      setReview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [reviewId])

  useEffect(() => { fetchReview() }, [fetchReview])

  const updateContact = (idx: number, updates: Partial<ReviewableContact>) => {
    if (!review) return
    const contacts = [...review.contacts]
    contacts[idx] = { ...contacts[idx], ...updates }
    if (updates.name !== undefined) contacts[idx].status = 'edited'
    setReview({ ...review, contacts })
  }

  const updateDecision = (idx: number, updates: Partial<ReviewableDecision>) => {
    if (!review) return
    const decisions = [...review.decisions]
    decisions[idx] = { ...decisions[idx], ...updates, status: 'edited' }
    setReview({ ...review, decisions })
  }

  const updatePrinciple = (idx: number, updates: Partial<ReviewablePrinciple>) => {
    if (!review) return
    const principles = [...review.principles]
    principles[idx] = { ...principles[idx], ...updates, status: 'edited' }
    setReview({ ...review, principles })
  }

  const updateBelief = (idx: number, updates: Partial<ReviewableBelief>) => {
    if (!review) return
    const beliefs = [...review.beliefs]
    beliefs[idx] = { ...beliefs[idx], ...updates, status: 'edited' }
    setReview({ ...review, beliefs })
  }

  const updateNote = (idx: number, updates: Partial<ReviewableNote>) => {
    if (!review) return
    const notes = [...review.notes]
    notes[idx] = { ...notes[idx], ...updates, status: 'edited' }
    setReview({ ...review, notes })
  }

  const toggleDelete = (
    collection: 'contacts' | 'decisions' | 'principles' | 'beliefs' | 'notes',
    idx: number
  ) => {
    if (!review) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = [...(review[collection] as any[])]
    items[idx] = { ...items[idx], status: items[idx].status === 'deleted' ? 'saved' : 'deleted' }
    setReview({ ...review, [collection]: items })
  }

  const hasChanges = () => {
    if (!review) return false
    const allItems = [
      ...review.contacts,
      ...review.decisions,
      ...review.principles,
      ...review.beliefs,
      ...review.notes,
    ]
    return allItems.some(i => i.status === 'edited' || i.status === 'deleted')
  }

  const submitCorrections = async () => {
    if (!review) return
    setSaving(true)
    try {
      const res = await authFetch(`/api/journal-review/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: review.contacts,
          decisions: review.decisions,
          principles: review.principles,
          beliefs: review.beliefs,
          notes: review.notes,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[11px] text-ink-muted">Loading review...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[11px] text-red-ink">{error}</div>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[11px] text-ink-muted">Review not found</div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white border border-rule rounded-sm p-3 text-center">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
            Corrections Applied
          </div>
          <div className="text-[11px] text-ink-muted">
            Edited items have been updated and deleted items removed.
          </div>
        </div>
      </div>
    )
  }

  if (review.status === 'corrected') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white border border-rule rounded-sm p-3 text-center">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
            Already Corrected
          </div>
          <div className="text-[11px] text-ink-muted">
            This review has already been corrected.
          </div>
        </div>
      </div>
    )
  }

  const totalItems = review.contacts.length + review.decisions.length + review.principles.length + review.beliefs.length + review.notes.length
  const editedCount = [...review.contacts, ...review.decisions, ...review.principles, ...review.beliefs, ...review.notes]
    .filter(i => i.status === 'edited').length
  const deletedCount = [...review.contacts, ...review.decisions, ...review.principles, ...review.beliefs, ...review.notes]
    .filter(i => i.status === 'deleted').length

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Review Journal Parse
          </div>
          <div className="text-[10px] text-ink-muted mt-0.5">
            {review.date} — {totalItems} items saved
            {editedCount > 0 && ` — ${editedCount} edited`}
            {deletedCount > 0 && ` — ${deletedCount} to delete`}
          </div>
        </div>
        {hasChanges() && (
          <button
            onClick={submitCorrections}
            disabled={saving}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Apply Corrections'}
          </button>
        )}
      </div>

      {/* Journal text (collapsed) */}
      <details className="mb-3">
        <summary className="text-[10px] text-ink-muted cursor-pointer hover:text-ink">
          Original journal text
        </summary>
        <div className="mt-1 bg-white border border-rule rounded-sm p-3 text-[10px] text-ink whitespace-pre-wrap">
          {review.journalText}
        </div>
      </details>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Contacts */}
        {review.contacts.length > 0 && (
          <div className="bg-white border border-rule rounded-sm p-3">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
              Contacts ({review.contacts.length})
            </div>
            <div className="space-y-2">
              {review.contacts.map((c, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 border border-rule-light rounded-sm ${c.status === 'deleted' ? 'opacity-40' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <StatusBadge status={c.status} />
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => updateContact(i, { name: e.target.value })}
                        disabled={c.status === 'deleted'}
                        className="text-[11px] font-semibold text-ink bg-transparent border-b border-dashed border-rule focus:border-burgundy outline-none flex-1 disabled:opacity-50"
                      />
                    </div>
                    <div className="text-[9px] text-ink-muted">{c.context}</div>
                  </div>
                  <ItemActions
                    status={c.status}
                    onDelete={() => toggleDelete('contacts', i)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decisions */}
        {review.decisions.length > 0 && (
          <div className="bg-white border border-rule rounded-sm p-3">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
              Decisions ({review.decisions.length})
            </div>
            <div className="space-y-2">
              {review.decisions.map((d, i) => (
                <div key={i} className={`p-2 border border-rule-light rounded-sm ${d.status === 'deleted' ? 'opacity-40' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={d.status} />
                      <input
                        type="text"
                        value={d.title}
                        onChange={(e) => updateDecision(i, { title: e.target.value })}
                        disabled={d.status === 'deleted'}
                        className="text-[11px] font-semibold text-ink bg-transparent border-b border-dashed border-rule focus:border-burgundy outline-none disabled:opacity-50"
                      />
                    </div>
                    <ItemActions status={d.status} onDelete={() => toggleDelete('decisions', i)} />
                  </div>
                  <div className="text-[9px] text-ink-muted mb-0.5">
                    <span className="font-semibold">Hypothesis:</span> {d.hypothesis}
                  </div>
                  <div className="text-[9px] text-ink-muted mb-0.5">
                    <span className="font-semibold">Chosen:</span> {d.chosenOption}
                  </div>
                  <div className="text-[9px] text-ink-muted">
                    <span className="font-semibold">Reasoning:</span> {d.reasoning}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                      {d.domain}
                    </span>
                    <span className="text-[8px] text-ink-muted">{d.confidenceLevel}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Principles */}
        {review.principles.length > 0 && (
          <div className="bg-white border border-rule rounded-sm p-3">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
              Principles ({review.principles.length})
            </div>
            <div className="space-y-2">
              {review.principles.map((p, i) => (
                <div key={i} className={`p-2 border border-rule-light rounded-sm ${p.status === 'deleted' ? 'opacity-40' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-1">
                      <StatusBadge status={p.status} />
                      <input
                        type="text"
                        value={p.shortForm}
                        onChange={(e) => updatePrinciple(i, { shortForm: e.target.value })}
                        disabled={p.status === 'deleted'}
                        className="text-[11px] font-semibold text-ink bg-transparent border-b border-dashed border-rule focus:border-burgundy outline-none flex-1 disabled:opacity-50"
                      />
                    </div>
                    <ItemActions status={p.status} onDelete={() => toggleDelete('principles', i)} />
                  </div>
                  <textarea
                    value={p.text}
                    onChange={(e) => updatePrinciple(i, { text: e.target.value })}
                    disabled={p.status === 'deleted'}
                    className="w-full text-[9px] text-ink-muted bg-transparent border border-dashed border-rule-light rounded-sm p-1 focus:border-burgundy outline-none resize-none disabled:opacity-50"
                    rows={2}
                  />
                  <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                    {p.domain}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beliefs */}
        {review.beliefs.length > 0 && (
          <div className="bg-white border border-rule rounded-sm p-3">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
              Beliefs ({review.beliefs.length})
            </div>
            <div className="space-y-2">
              {review.beliefs.map((b, i) => (
                <div key={i} className={`p-2 border border-rule-light rounded-sm ${b.status === 'deleted' ? 'opacity-40' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <StatusBadge status={b.status} />
                    <ItemActions status={b.status} onDelete={() => toggleDelete('beliefs', i)} />
                  </div>
                  <textarea
                    value={b.statement}
                    onChange={(e) => updateBelief(i, { statement: e.target.value })}
                    disabled={b.status === 'deleted'}
                    className="w-full text-[10px] text-ink bg-transparent border border-dashed border-rule-light rounded-sm p-1 focus:border-burgundy outline-none resize-none disabled:opacity-50"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-1">
                    <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                      {b.domain}
                    </span>
                    <span className="text-[8px] text-ink-muted">{b.confidence}% confidence</span>
                  </div>
                  {b.evidenceFor.length > 0 && (
                    <div className="text-[8px] text-green-ink mt-1">For: {b.evidenceFor.join('; ')}</div>
                  )}
                  {b.evidenceAgainst.length > 0 && (
                    <div className="text-[8px] text-red-ink mt-0.5">Against: {b.evidenceAgainst.join('; ')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {review.notes.length > 0 && (
          <div className="bg-white border border-rule rounded-sm p-3">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
              Notes ({review.notes.length})
            </div>
            <div className="space-y-2">
              {review.notes.map((n, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 border border-rule-light rounded-sm ${n.status === 'deleted' ? 'opacity-40' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <StatusBadge status={n.status} />
                      {n.actionRequired && (
                        <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-amber-bg text-amber-ink border-amber-ink/20">
                          action
                        </span>
                      )}
                    </div>
                    <textarea
                      value={n.text}
                      onChange={(e) => updateNote(i, { text: e.target.value })}
                      disabled={n.status === 'deleted'}
                      className="w-full text-[10px] text-ink bg-transparent border border-dashed border-rule-light rounded-sm p-1 focus:border-burgundy outline-none resize-none disabled:opacity-50"
                      rows={2}
                    />
                  </div>
                  <ItemActions status={n.status} onDelete={() => toggleDelete('notes', i)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {hasChanges() && (
        <div className="mt-3 flex items-center justify-between border-t border-rule pt-2">
          <div className="text-[9px] text-ink-muted">
            {editedCount > 0 && `${editedCount} edited`}
            {editedCount > 0 && deletedCount > 0 && ' · '}
            {deletedCount > 0 && `${deletedCount} to delete`}
          </div>
          <button
            onClick={submitCorrections}
            disabled={saving}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Apply Corrections'}
          </button>
        </div>
      )}
    </div>
  )
}
