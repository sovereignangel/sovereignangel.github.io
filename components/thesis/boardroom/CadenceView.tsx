'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useCadence } from '@/hooks/useCadence'
import type { CadenceType, CadenceChecklistItem, CadenceReview } from '@/lib/types'

const CADENCE_TABS: { key: CadenceType; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
]

const DEFAULT_CHECKLISTS: Record<CadenceType, CadenceChecklistItem[]> = {
  daily: [
    { key: 'energy', label: 'Log energy inputs (sleep, training, NS state, body)', completed: false },
    { key: 'problems', label: 'Identify 3 problems worth solving', completed: false },
    { key: 'focus', label: 'Execute focus session on spine project', completed: false },
    { key: 'ship', label: 'Ship something (code, content, ask)', completed: false },
    { key: 'signal', label: 'Review 5+ external signals', completed: false },
    { key: 'revenue_ask', label: 'Make 2+ revenue asks', completed: false },
    { key: 'psycap', label: 'Log PsyCap (hope, efficacy, resilience, optimism)', completed: false },
  ],
  weekly: [
    { key: 'synthesis', label: 'Complete weekly synthesis (Dalio 5-Step)', completed: false },
    { key: 'review_decisions', label: 'Review active decisions for kill criteria triggers', completed: false },
    { key: 'principles', label: 'Reinforce or derive principles from the week', completed: false },
    { key: 'network', label: 'Touch 3+ contacts in network', completed: false },
    { key: 'capital', label: 'Update financial position', completed: false },
    { key: 'calibration', label: 'Review signal predictions vs actuals', completed: false },
  ],
  monthly: [
    { key: 'portfolio', label: 'Review project portfolio (kill/double/add)', completed: false },
    { key: 'capital_review', label: 'Full capital position review + runway update', completed: false },
    { key: 'network_audit', label: 'Network audit — tier reassignment', completed: false },
    { key: 'knowledge', label: 'Knowledge architecture review (books, papers, 10-Ks)', completed: false },
    { key: 'reward_function', label: 'Analyze reward function component trends', completed: false },
    { key: 'thesis_check', label: 'Thesis still valid? Adjust if needed', completed: false },
  ],
  quarterly: [
    { key: 'decision_review', label: '90-day decision reviews (calibration scoring)', completed: false },
    { key: 'strategy', label: 'Full strategy review — goals, problems, design', completed: false },
    { key: 'capital_projection', label: '24-month capital projection update', completed: false },
    { key: 'anti_portfolio', label: 'Review anti-portfolio (what you passed on)', completed: false },
    { key: 'principle_audit', label: 'Principle audit — retire stale, adopt new', completed: false },
    { key: 'baseball_card', label: 'Update personal baseball card (metrics, strengths, blind spots)', completed: false },
  ],
}

function getPeriodKey(type: CadenceType): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')

  switch (type) {
    case 'daily': return `${y}-${m}-${d}`
    case 'weekly': {
      const startOfYear = new Date(y, 0, 1)
      const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
      const weekNum = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7)
      return `${y}-W${String(weekNum).padStart(2, '0')}`
    }
    case 'monthly': return `${y}-${m}`
    case 'quarterly': {
      const q = Math.ceil((now.getMonth() + 1) / 3)
      return `${y}-Q${q}`
    }
  }
}

export default function CadenceView() {
  const { user } = useAuth()
  const { reviews, loading, save, getByType, averageCompletion } = useCadence(user?.uid)
  const [activeType, setActiveType] = useState<CadenceType>('daily')

  const periodKey = getPeriodKey(activeType)
  const existingReview = getByType(activeType).find(r => r.periodKey === periodKey)
  const [items, setItems] = useState<CadenceChecklistItem[]>(
    existingReview?.items || DEFAULT_CHECKLISTS[activeType]
  )
  const [notes, setNotes] = useState(existingReview?.notes || '')

  const handleTypeChange = (type: CadenceType) => {
    setActiveType(type)
    const existing = getByType(type).find(r => r.periodKey === getPeriodKey(type))
    setItems(existing?.items || DEFAULT_CHECKLISTS[type])
    setNotes(existing?.notes || '')
  }

  const toggleItem = async (key: string) => {
    const updated = items.map(item =>
      item.key === key ? { ...item, completed: !item.completed } : item
    )
    setItems(updated)
    const completedCount = updated.filter(i => i.completed).length
    const completionRate = updated.length > 0 ? completedCount / updated.length : 0
    await save({
      type: activeType,
      periodKey,
      items: updated,
      completionRate,
      notes,
    }, existingReview?.id)
  }

  const completedCount = items.filter(i => i.completed).length
  const completionPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 bg-rule-light/40 rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-3 bg-cream">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Cadence System
        </h3>
        <span className="font-mono text-[10px] text-ink-muted">
          avg {(averageCompletion * 100).toFixed(0)}%
        </span>
      </div>

      {/* Cadence Type Tabs */}
      <div className="flex gap-0.5 mb-2">
        {CADENCE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTypeChange(tab.key)}
            className={`font-serif text-[11px] font-medium px-2 py-1.5 rounded-sm border transition-colors flex-1 ${
              activeType === tab.key
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-paper text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Period + Progress */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-rule-light">
        <span className="font-mono text-[11px] text-ink-muted">{periodKey}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-24 h-2 bg-rule-light rounded-sm overflow-hidden">
            <div
              className={`h-full rounded-sm transition-all ${
                completionPct >= 80 ? 'bg-green-ink' : completionPct >= 50 ? 'bg-amber-ink' : 'bg-red-ink'
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className={`font-mono text-[11px] font-semibold ${
            completionPct >= 80 ? 'text-green-ink' : completionPct >= 50 ? 'text-amber-ink' : 'text-red-ink'
          }`}>
            {completedCount}/{items.length}
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-paper border border-rule rounded-sm p-1">
        <div className="space-y-0">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => toggleItem(item.key)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left transition-colors ${
                item.completed ? 'bg-green-bg/50' : 'hover:bg-cream'
              }`}
            >
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                item.completed ? 'bg-green-ink border-green-ink' : 'border-rule'
              }`}>
                {item.completed && (
                  <span className="text-paper text-[9px] font-bold">✓</span>
                )}
              </div>
              <span className={`font-sans text-[12px] leading-snug ${
                item.completed ? 'text-ink-faint line-through' : 'text-ink-muted'
              }`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-2 pt-2 border-t border-rule-light">
        <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={async () => {
            if (existingReview || items.some(i => i.completed)) {
              const completionRate = items.filter(i => i.completed).length / items.length
              await save({ type: activeType, periodKey, items, completionRate, notes }, existingReview?.id)
            }
          }}
          className="w-full font-sans text-[11px] text-ink-muted bg-paper border border-rule rounded-sm px-2 py-1.5 h-16 resize-none focus:outline-none focus:border-burgundy"
          placeholder="Reflections on this period..."
        />
      </div>
    </div>
  )
}
