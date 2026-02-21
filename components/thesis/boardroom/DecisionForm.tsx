'use client'

import { useState } from 'react'
import type { Decision, DecisionDomain } from '@/lib/types'

interface DecisionFormProps {
  decision: Decision | null
  onSave: (data: Partial<Decision>) => Promise<void>
  onClose: () => void
}

const DOMAINS: { key: DecisionDomain; label: string }[] = [
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'product', label: 'Product' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'personal', label: 'Personal' },
  { key: 'thesis', label: 'Thesis' },
]

export default function DecisionForm({ decision, onSave, onClose }: DecisionFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const reviewDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [title, setTitle] = useState(decision?.title || '')
  const [hypothesis, setHypothesis] = useState(decision?.hypothesis || '')
  const [options, setOptions] = useState(decision?.options?.join('\n') || '')
  const [chosenOption, setChosenOption] = useState(decision?.chosenOption || '')
  const [reasoning, setReasoning] = useState(decision?.reasoning || '')
  const [confidenceLevel, setConfidenceLevel] = useState(decision?.confidenceLevel ?? 50)
  const [killCriteria, setKillCriteria] = useState(decision?.killCriteria?.join('\n') || '')
  const [premortem, setPremortem] = useState(decision?.premortem || '')
  const [domain, setDomain] = useState<DecisionDomain>(decision?.domain || 'portfolio')
  const [saving, setSaving] = useState(false)

  // For review mode
  const [outcomeScore, setOutcomeScore] = useState(decision?.outcomeScore ?? undefined)
  const [actualOutcome, setActualOutcome] = useState(decision?.actualOutcome || '')
  const [learnings, setLearnings] = useState(decision?.learnings || '')

  const isReview = decision?.status === 'pending_review' || decision?.status === 'active'

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const data: Partial<Decision> = {
        title: title.trim(),
        hypothesis: hypothesis.trim(),
        options: options.split('\n').filter(o => o.trim()),
        chosenOption: chosenOption.trim(),
        reasoning: reasoning.trim(),
        confidenceLevel,
        killCriteria: killCriteria.split('\n').filter(k => k.trim()),
        premortem: premortem.trim(),
        domain,
        linkedProjectIds: decision?.linkedProjectIds || [],
        linkedSignalIds: decision?.linkedSignalIds || [],
        decidedAt: decision?.decidedAt || today,
        reviewDate: decision?.reviewDate || reviewDate,
      }
      // Include outcome fields if reviewing
      if (outcomeScore !== undefined) {
        data.outcomeScore = outcomeScore
        data.actualOutcome = actualOutcome.trim()
        data.learnings = learnings.trim()
        data.status = 'reviewed'
      }
      await onSave(data)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy'
  const labelClass = 'font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/20" onClick={onClose} />
      <div className="relative bg-paper border border-rule rounded-sm shadow-lg w-full max-w-[520px] max-h-[85vh] overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            {decision ? 'Edit Decision' : 'New Decision'}
          </h3>
          <button onClick={onClose} className="font-mono text-[11px] text-ink-muted hover:text-ink px-1">&times;</button>
        </div>

        <div className="space-y-2">
          <div>
            <label className={labelClass}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="What are you deciding?" />
          </div>

          <div>
            <label className={labelClass}>Hypothesis</label>
            <textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} className={`${inputClass} h-14 resize-none`} placeholder="If we do X, then Y will happen because Z..." />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Domain</label>
              <div className="flex gap-0.5 flex-wrap">
                {DOMAINS.map(d => (
                  <button
                    key={d.key}
                    onClick={() => setDomain(d.key)}
                    className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                      domain === d.key
                        ? 'bg-burgundy text-paper border-burgundy'
                        : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Confidence</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min={0} max={100}
                  value={confidenceLevel}
                  onChange={e => setConfidenceLevel(parseInt(e.target.value))}
                  className="flex-1 h-1 accent-burgundy"
                />
                <span className={`font-mono text-[11px] font-bold w-8 text-right ${
                  confidenceLevel >= 70 ? 'text-green-ink' : confidenceLevel >= 40 ? 'text-amber-ink' : 'text-red-ink'
                }`}>
                  {confidenceLevel}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Options Considered (one per line)</label>
            <textarea value={options} onChange={e => setOptions(e.target.value)} className={`${inputClass} h-12 resize-none`} placeholder="Option A&#10;Option B&#10;Option C" />
          </div>

          <div>
            <label className={labelClass}>Chosen Option</label>
            <input value={chosenOption} onChange={e => setChosenOption(e.target.value)} className={inputClass} placeholder="Which option and why?" />
          </div>

          <div>
            <label className={labelClass}>Reasoning</label>
            <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} className={`${inputClass} h-14 resize-none`} placeholder="Why this option over alternatives?" />
          </div>

          <div>
            <label className={labelClass}>Kill Criteria (one per line)</label>
            <textarea value={killCriteria} onChange={e => setKillCriteria(e.target.value)} className={`${inputClass} h-12 resize-none`} placeholder="What evidence would make you reverse this decision?" />
          </div>

          <div>
            <label className={labelClass}>Pre-Mortem</label>
            <textarea value={premortem} onChange={e => setPremortem(e.target.value)} className={`${inputClass} h-12 resize-none`} placeholder="Imagine this decision failed. What went wrong?" />
          </div>

          {/* Review section — only show when editing an existing decision */}
          {decision && isReview && (
            <div className="border-t border-rule pt-2">
              <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
                90-Day Review
              </h4>
              <div>
                <label className={labelClass}>Outcome Score (0-100)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min={0} max={100}
                    value={outcomeScore ?? 50}
                    onChange={e => setOutcomeScore(parseInt(e.target.value))}
                    className="flex-1 h-1 accent-burgundy"
                  />
                  <span className="font-mono text-[11px] font-bold w-8 text-right">
                    {outcomeScore ?? '—'}%
                  </span>
                </div>
              </div>
              <div className="mt-1.5">
                <label className={labelClass}>What actually happened?</label>
                <textarea value={actualOutcome} onChange={e => setActualOutcome(e.target.value)} className={`${inputClass} h-12 resize-none`} />
              </div>
              <div className="mt-1.5">
                <label className={labelClass}>Learnings / Principles Derived</label>
                <textarea value={learnings} onChange={e => setLearnings(e.target.value)} className={`${inputClass} h-12 resize-none`} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-1.5 mt-3 pt-2 border-t border-rule">
          <button onClick={onClose} className="font-serif text-[9px] font-medium px-3 py-1 rounded-sm border border-rule text-ink-muted hover:text-ink transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="font-serif text-[9px] font-medium px-3 py-1 rounded-sm border border-burgundy bg-burgundy text-paper hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : decision ? 'Update' : 'Record Decision'}
          </button>
        </div>
      </div>
    </div>
  )
}
