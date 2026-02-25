'use client'

import { useState } from 'react'
import type { DecisionDomain } from '@/lib/types'

interface BeliefFormProps {
  onSave: (data: {
    statement: string
    confidence: number
    domain: DecisionDomain
    evidenceFor: string[]
    evidenceAgainst: string[]
  }) => Promise<void>
  onCancel: () => void
}

const DOMAINS: { key: DecisionDomain; label: string }[] = [
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'product', label: 'Product' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'personal', label: 'Personal' },
  { key: 'thesis', label: 'Thesis' },
]

export default function BeliefForm({ onSave, onCancel }: BeliefFormProps) {
  const [statement, setStatement] = useState('')
  const [confidence, setConfidence] = useState(60)
  const [domain, setDomain] = useState<DecisionDomain>('thesis')
  const [evidenceFor, setEvidenceFor] = useState('')
  const [evidenceAgainst, setEvidenceAgainst] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!statement.trim()) return
    setSaving(true)
    try {
      await onSave({
        statement: statement.trim(),
        confidence,
        domain,
        evidenceFor: evidenceFor.split('\n').map(s => s.trim()).filter(Boolean),
        evidenceAgainst: evidenceAgainst.split('\n').map(s => s.trim()).filter(Boolean),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-paper border border-rule rounded-sm p-3 space-y-2">
      <div>
        <label className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-0.5">
          I believe that...
        </label>
        <textarea
          value={statement}
          onChange={e => setStatement(e.target.value)}
          placeholder="State a testable belief — something that could be proven right or wrong"
          className="w-full h-16 bg-white border border-rule rounded-sm p-2 font-sans text-[11px] text-ink-muted resize-y focus:outline-none focus:border-burgundy"
          autoFocus
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-0.5">
            Confidence {confidence}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={confidence}
            onChange={e => setConfidence(Number(e.target.value))}
            className="w-full h-1 accent-burgundy"
          />
        </div>
        <div>
          <label className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-0.5">
            Domain
          </label>
          <select
            value={domain}
            onChange={e => setDomain(e.target.value as DecisionDomain)}
            className="bg-white border border-rule rounded-sm px-1.5 py-1 font-sans text-[10px] text-ink-muted focus:outline-none focus:border-burgundy"
          >
            {DOMAINS.map(d => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-0.5">
          Evidence for (one per line)
        </label>
        <textarea
          value={evidenceFor}
          onChange={e => setEvidenceFor(e.target.value)}
          placeholder="Supporting evidence..."
          className="w-full h-12 bg-white border border-rule rounded-sm p-2 font-sans text-[10px] text-ink-muted resize-y focus:outline-none focus:border-burgundy"
        />
      </div>

      <div>
        <label className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-0.5">
          Evidence against (one per line)
        </label>
        <textarea
          value={evidenceAgainst}
          onChange={e => setEvidenceAgainst(e.target.value)}
          placeholder="Counter-evidence..."
          className="w-full h-12 bg-white border border-rule rounded-sm p-2 font-sans text-[10px] text-ink-muted resize-y focus:outline-none focus:border-burgundy"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !statement.trim()}
          className={`font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border transition-colors ${
            saving || !statement.trim()
              ? 'bg-paper text-ink-muted border-rule cursor-not-allowed'
              : 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
          }`}
        >
          {saving ? 'Saving...' : 'Save Belief'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border border-rule text-ink-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
