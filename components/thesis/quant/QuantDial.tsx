'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

// ─── Quant Dial: Right sidebar for quant tab ───────────────────────────

interface WeeklyFocus {
  mathHours: number
  codeHours: number
  financeHours: number
  mlHours: number
  note: string
}

const DEFAULT_FOCUS: WeeklyFocus = {
  mathHours: 0,
  codeHours: 0,
  financeHours: 0,
  mlHours: 0,
  note: '',
}

export default function QuantDial() {
  const { user } = useAuth()
  const [focus, setFocus] = useState<WeeklyFocus>(DEFAULT_FOCUS)

  const storageKey = user?.uid ? `quant-dial-${user.uid}` : null

  useEffect(() => {
    if (!storageKey) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try { setFocus(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [storageKey])

  const update = (field: keyof WeeklyFocus, value: number | string) => {
    const next = { ...focus, [field]: value }
    setFocus(next)
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const totalHours = focus.mathHours + focus.codeHours + focus.financeHours + focus.mlHours
  const categories = [
    { key: 'mathHours' as const, label: 'Math', color: 'text-burgundy', pct: totalHours > 0 ? Math.round((focus.mathHours / totalHours) * 100) : 0 },
    { key: 'codeHours' as const, label: 'Code', color: 'text-green-ink', pct: totalHours > 0 ? Math.round((focus.codeHours / totalHours) * 100) : 0 },
    { key: 'financeHours' as const, label: 'Finance', color: 'text-amber-ink', pct: totalHours > 0 ? Math.round((focus.financeHours / totalHours) * 100) : 0 },
    { key: 'mlHours' as const, label: 'ML', color: 'text-ink', pct: totalHours > 0 ? Math.round((focus.mlHours / totalHours) * 100) : 0 },
  ]

  return (
    <div className="space-y-3 py-2">
      {/* Weekly quant study allocation */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule-light">
          Weekly Study Hours
        </h4>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-sans text-[9px] font-medium ${cat.color}`}>{cat.label}</span>
                <span className="font-mono text-[9px] text-ink-muted">{cat.pct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={focus[cat.key]}
                onChange={e => update(cat.key, parseFloat(e.target.value))}
                className="w-full h-1 appearance-none bg-cream rounded-sm accent-burgundy"
              />
              <div className="text-right font-mono text-[8px] text-ink-muted">{focus[cat.key]}h</div>
            </div>
          ))}
        </div>
        <div className="border-t border-rule-light pt-1.5 mt-1">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] text-ink-muted">Total</span>
            <span className="font-mono text-[11px] font-semibold text-ink">{totalHours}h/wk</span>
          </div>
        </div>
      </div>

      {/* Target allocation */}
      <div className="bg-cream border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Target Mix
        </h4>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[9px] text-ink-muted">Foundation phase</span>
            <span className="font-mono text-[8px] text-ink-muted">40% Math · 30% Code · 20% Finance · 10% ML</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[9px] text-ink-muted">Specialization</span>
            <span className="font-mono text-[8px] text-ink-muted">20% Math · 30% Code · 20% Finance · 30% ML</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[9px] text-ink-muted">Authority</span>
            <span className="font-mono text-[8px] text-ink-muted">10% Math · 20% Code · 40% Finance · 30% ML</span>
          </div>
        </div>
      </div>

      {/* Quick note */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          This Week&apos;s Focus
        </h4>
        <textarea
          value={focus.note}
          onChange={e => update('note', e.target.value)}
          placeholder="What are you studying this week?"
          className="w-full bg-cream border border-rule rounded-sm p-1.5 font-sans text-[10px] text-ink resize-none h-16 placeholder:text-ink-faint"
        />
      </div>

      {/* Key metrics to track */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Quant Readiness Signals
        </h4>
        <div className="space-y-1">
          {[
            { label: 'Sharpe Ratio (live or paper)', target: '> 1.5' },
            { label: 'Strategies Backtested', target: '≥ 5' },
            { label: 'Papers Read (quant/ML)', target: '≥ 30' },
            { label: 'Published Research', target: '≥ 2' },
            { label: 'Live Track Record', target: '≥ 12 months' },
            { label: 'AUM Managed', target: '> $1M' },
          ].map(m => (
            <div key={m.label} className="flex items-center justify-between">
              <span className="font-sans text-[9px] text-ink">{m.label}</span>
              <span className="font-mono text-[8px] text-ink-muted">{m.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
