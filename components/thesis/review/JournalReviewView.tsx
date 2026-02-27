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
  status: 'pending' | 'confirmed' | 'rejected'
}

function StatusBadge({ status }: { status: ReviewItemStatus }) {
  const colors: Record<ReviewItemStatus, string> = {
    pending: 'text-amber-ink border-amber-ink/20 bg-amber-bg',
    confirmed: 'text-green-ink border-green-ink/20 bg-green-bg',
    edited: 'text-burgundy border-burgundy/20 bg-burgundy-bg',
    rejected: 'text-red-ink border-red-ink/20 bg-[#8c2d2d08]',
  }
  return (
    <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${colors[status]}`}>
      {status}
    </span>
  )
}

function ItemActions({ status, onConfirm, onReject }: { status: ReviewItemStatus; onConfirm: () => void; onReject: () => void }) {
  return (
    <div className="flex gap-1">
      <button
        onClick={onConfirm}
        className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border ${
          status === 'confirmed' || status === 'edited'
            ? 'bg-burgundy text-paper border-burgundy'
            : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
        }`}
      >
        {status === 'confirmed' || status === 'edited' ? 'Confirmed' : 'Confirm'}
      </button>
      <button
        onClick={onReject}
        className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border ${
          status === 'rejected'
            ? 'bg-red-ink text-paper border-red-ink'
            : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
        }`}
      >
        {status === 'rejected' ? 'Rejected' : 'Reject'}
      </button>
    </div>
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
    // If name was edited, mark as edited
    if (updates.name && updates.name !== review.contacts[idx].name) {
      contacts[idx].status = 'edited'
    }
    setReview({ ...review, contacts })
  }

  const updateDecision = (idx: number, updates: Partial<ReviewableDecision>) => {
    if (!review) return
    const decisions = [...review.decisions]
    decisions[idx] = { ...decisions[idx], ...updates }
    setReview({ ...review, decisions })
  }

  const updatePrinciple = (idx: number, updates: Partial<ReviewablePrinciple>) => {
    if (!review) return
    const principles = [...review.principles]
    principles[idx] = { ...principles[idx], ...updates }
    setReview({ ...review, principles })
  }

  const updateBelief = (idx: number, updates: Partial<ReviewableBelief>) => {
    if (!review) return
    const beliefs = [...review.beliefs]
    beliefs[idx] = { ...beliefs[idx], ...updates }
    setReview({ ...review, beliefs })
  }

  const updateNote = (idx: number, updates: Partial<ReviewableNote>) => {
    if (!review) return
    const notes = [...review.notes]
    notes[idx] = { ...notes[idx], ...updates }
    setReview({ ...review, notes })
  }

  const setItemStatus = (
    collection: 'contacts' | 'decisions' | 'principles' | 'beliefs' | 'notes',
    idx: number,
    status: ReviewItemStatus
  ) => {
    if (!review) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = [...(review[collection] as any[])]
    items[idx] = { ...items[idx], status }
    setReview({ ...review, [collection]: items })
  }

  const confirmAll = () => {
    if (!review) return
    setReview({
      ...review,
      contacts: review.contacts.map(c => ({ ...c, status: c.status === 'rejected' ? 'rejected' as const : c.status === 'edited' ? 'edited' as const : 'confirmed' as const })),
      decisions: review.decisions.map(d => ({ ...d, status: d.status === 'rejected' ? 'rejected' as const : 'confirmed' as const })),
      principles: review.principles.map(p => ({ ...p, status: p.status === 'rejected' ? 'rejected' as const : 'confirmed' as const })),
      beliefs: review.beliefs.map(b => ({ ...b, status: b.status === 'rejected' ? 'rejected' as const : 'confirmed' as const })),
      notes: review.notes.map(n => ({ ...n, status: n.status === 'rejected' ? 'rejected' as const : 'confirmed' as const })),
    })
  }

  const submitReview = async () => {
    if (!review) return
    setSaving(true)
    try {
      const res = await authFetch(`/api/journal-review/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
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

  const rejectAll = async () => {
    if (!review) return
    setSaving(true)
    try {
      const res = await authFetch(`/api/journal-review/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (!res.ok) throw new Error('Failed to reject')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
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

  if (done || review.status !== 'pending') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white border border-rule rounded-sm p-3 text-center">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
            Review {done ? 'Submitted' : review.status}
          </div>
          <div className="text-[11px] text-ink-muted">
            {review.status === 'confirmed' ? 'All confirmed items have been saved.' : 'No items were saved.'}
          </div>
        </div>
      </div>
    )
  }

  const totalItems = review.contacts.length + review.decisions.length + review.principles.length + review.beliefs.length + review.notes.length
  const confirmedItems = [
    ...review.contacts.filter(c => c.status === 'confirmed' || c.status === 'edited'),
    ...review.decisions.filter(d => d.status === 'confirmed'),
    ...review.principles.filter(p => p.status === 'confirmed'),
    ...review.beliefs.filter(b => b.status === 'confirmed'),
    ...review.notes.filter(n => n.status === 'confirmed'),
  ].length

  return (
    <div className="h-full overflow-y-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Journal Review
          </div>
          <div className="text-[10px] text-ink-muted mt-0.5">
            {review.date} — {totalItems} items extracted — {confirmedItems} confirmed
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={confirmAll}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint"
          >
            Confirm Remaining
          </button>
          <button
            onClick={submitReview}
            disabled={saving}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Submit Review'}
          </button>
          <button
            onClick={rejectAll}
            disabled={saving}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-red-ink border-red-ink/30 hover:bg-[#8c2d2d08] disabled:opacity-50"
          >
            Reject All
          </button>
        </div>
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
                <div key={i} className="flex items-start gap-2 p-2 border border-rule-light rounded-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <StatusBadge status={c.status} />
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => updateContact(i, { name: e.target.value, status: 'edited' })}
                        className="text-[11px] font-semibold text-ink bg-transparent border-b border-dashed border-rule focus:border-burgundy outline-none flex-1"
                      />
                    </div>
                    <div className="text-[9px] text-ink-muted">{c.context}</div>
                  </div>
                  <ItemActions
                    status={c.status}
                    onConfirm={() => setItemStatus('contacts', i, c.status === 'edited' ? 'edited' : 'confirmed')}
                    onReject={() => setItemStatus('contacts', i, 'rejected')}
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
                <div key={i} className="p-2 border border-rule-light rounded-sm">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={d.status} />
                      <input
                        type="text"
                        value={d.title}
                        onChange={(e) => updateDecision(i, { title: e.target.value, status: 'edited' as ReviewItemStatus })}
                        className="text-[11px] font-semibold text-ink bg-transparent border-b border-dashed border-rule focus:border-burgundy outline-none"
                      />
                    </div>
                    <ItemActions
                      status={d.status}
                      onConfirm={() => setItemStatus('decisions', i, 'confirmed')}
                      onReject={() => setItemStatus('decisions', i, 'rejected')}
                    />
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
                    <span className="text-[8px] text-ink-muted">
                      {d.confidenceLevel}% confidence
                    </span>
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
                <div key={i} className="p-2 border border-rule-light rounded-sm">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-1">
                      <StatusBadge status={p.status} />
                      <input
                        type="text"
                        value={p.shortForm}
                        onChange={(e) => updatePrinciple(i, { shortForm: e.target.value, status: 'edited' as ReviewItemStatus })}
                        className="text-[11px] font-semibold text-ink bg-transparent border-b border-dashed border-rule focus:border-burgundy outline-none flex-1"
                      />
                    </div>
                    <ItemActions
                      status={p.status}
                      onConfirm={() => setItemStatus('principles', i, 'confirmed')}
                      onReject={() => setItemStatus('principles', i, 'rejected')}
                    />
                  </div>
                  <textarea
                    value={p.text}
                    onChange={(e) => updatePrinciple(i, { text: e.target.value, status: 'edited' as ReviewItemStatus })}
                    className="w-full text-[9px] text-ink-muted bg-transparent border border-dashed border-rule-light rounded-sm p-1 focus:border-burgundy outline-none resize-none"
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
                <div key={i} className="p-2 border border-rule-light rounded-sm">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-1">
                      <StatusBadge status={b.status} />
                    </div>
                    <ItemActions
                      status={b.status}
                      onConfirm={() => setItemStatus('beliefs', i, 'confirmed')}
                      onReject={() => setItemStatus('beliefs', i, 'rejected')}
                    />
                  </div>
                  <textarea
                    value={b.statement}
                    onChange={(e) => updateBelief(i, { statement: e.target.value, status: 'edited' as ReviewItemStatus })}
                    className="w-full text-[10px] text-ink bg-transparent border border-dashed border-rule-light rounded-sm p-1 focus:border-burgundy outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-1">
                    <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                      {b.domain}
                    </span>
                    <span className="text-[8px] text-ink-muted">
                      {b.confidence}% confidence
                    </span>
                  </div>
                  {b.evidenceFor.length > 0 && (
                    <div className="text-[8px] text-green-ink mt-1">
                      For: {b.evidenceFor.join('; ')}
                    </div>
                  )}
                  {b.evidenceAgainst.length > 0 && (
                    <div className="text-[8px] text-red-ink mt-0.5">
                      Against: {b.evidenceAgainst.join('; ')}
                    </div>
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
                <div key={i} className="flex items-start gap-2 p-2 border border-rule-light rounded-sm">
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
                      onChange={(e) => updateNote(i, { text: e.target.value, status: 'edited' as ReviewItemStatus })}
                      className="w-full text-[10px] text-ink bg-transparent border border-dashed border-rule-light rounded-sm p-1 focus:border-burgundy outline-none resize-none"
                      rows={2}
                    />
                  </div>
                  <ItemActions
                    status={n.status}
                    onConfirm={() => setItemStatus('notes', i, 'confirmed')}
                    onReject={() => setItemStatus('notes', i, 'rejected')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="mt-3 flex items-center justify-between border-t border-rule pt-2">
        <div className="text-[9px] text-ink-muted">
          {confirmedItems}/{totalItems} items confirmed
        </div>
        <div className="flex gap-1">
          <button
            onClick={rejectAll}
            disabled={saving}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-red-ink border-red-ink/30 hover:bg-[#8c2d2d08] disabled:opacity-50"
          >
            Reject All
          </button>
          <button
            onClick={submitReview}
            disabled={saving}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
