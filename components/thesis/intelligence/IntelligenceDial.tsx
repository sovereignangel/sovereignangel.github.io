'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { saveSignal, getSignals } from '@/lib/firestore'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import type { Signal, SignalType, ThesisPillar } from '@/lib/types'
import { MARKET_SIGNAL_TYPES, THESIS_PILLARS } from '@/lib/constants'

const SIGNAL_TYPES: { value: SignalType; label: string }[] = [
  { value: 'arbitrage', label: 'Arb' },
  { value: 'problem', label: 'Prob' },
  { value: 'market', label: 'Mkt' },
  { value: 'research', label: 'Res' },
]

export default function IntelligenceDial() {
  const { user } = useAuth()
  const { log, updateField, saving, lastSaved } = useDailyLogContext()
  const [formType, setFormType] = useState<SignalType>('arbitrage')
  const [formData, setFormData] = useState<Partial<Signal>>({})
  const [signalSaving, setSignalSaving] = useState(false)

  const handleSaveSignal = async () => {
    if (!user || !formData.title) return
    setSignalSaving(true)
    await saveSignal(user.uid, { ...formData, signalType: formType })
    setFormData({})
    setSignalSaving(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Capture
        </h3>
        <span className="font-mono text-[9px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-3">
        {/* Add Signal Form */}
        <div className="border-b border-rule-light pb-3">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-2">
            New Signal
          </h4>
          <div className="flex gap-1 mb-2">
            {SIGNAL_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setFormType(type.value)}
                className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                  formType === type.value
                    ? 'text-navy border-navy bg-navy-bg'
                    : 'text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
              placeholder="Signal title..."
            />
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[28px] resize-y"
              placeholder="What did you notice?"
            />

            {formType === 'problem' && (
              <input
                type="text"
                value={formData.painPoint || ''}
                onChange={(e) => setFormData({ ...formData, painPoint: e.target.value })}
                className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                placeholder="Who feels the pain?"
              />
            )}

            {formType === 'market' && (
              <select
                value={formData.marketSignalType || ''}
                onChange={(e) => setFormData({ ...formData, marketSignalType: e.target.value as Signal['marketSignalType'] })}
                className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
              >
                <option value="">Signal type...</option>
                {MARKET_SIGNAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            )}

            {formType === 'arbitrage' && (
              <>
                <textarea
                  value={formData.arbitrageGap || ''}
                  onChange={(e) => setFormData({ ...formData, arbitrageGap: e.target.value })}
                  className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[28px] resize-y"
                  placeholder="Gap: hard → automated → paid"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    value={formData.timelineDays || ''}
                    onChange={(e) => setFormData({ ...formData, timelineDays: parseInt(e.target.value) || 0 })}
                    className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                    placeholder="Days"
                  />
                  <input
                    type="number"
                    min="1" max="10"
                    value={formData.revenuePotential || ''}
                    onChange={(e) => setFormData({ ...formData, revenuePotential: parseInt(e.target.value) || 0 })}
                    className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                    placeholder="Rev (1-10)"
                  />
                </div>
                <input
                  type="text"
                  value={formData.actionThisWeek || ''}
                  onChange={(e) => setFormData({ ...formData, actionThisWeek: e.target.value })}
                  className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                  placeholder="One action this week"
                />
              </>
            )}

            {formType === 'research' && (
              <>
                <select
                  value={formData.thesisConnection || ''}
                  onChange={(e) => setFormData({ ...formData, thesisConnection: e.target.value as Signal['thesisConnection'] })}
                  className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                >
                  <option value="">Thesis connection...</option>
                  <option value="ai">AI</option>
                  <option value="markets">Markets</option>
                  <option value="mind">Mind</option>
                </select>
                <input
                  type="text"
                  value={formData.testIdea || ''}
                  onChange={(e) => setFormData({ ...formData, testIdea: e.target.value })}
                  className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                  placeholder="48h test idea"
                />
              </>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">Thesis?</label>
                <button
                  onClick={() => setFormData({ ...formData, relevantToThesis: !formData.relevantToThesis })}
                  className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                    formData.relevantToThesis ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule'
                  }`}
                >
                  {formData.relevantToThesis ? 'Y' : 'N'}
                </button>
              </div>
              <button
                onClick={handleSaveSignal}
                disabled={signalSaving || !formData.title}
                className="bg-navy text-paper font-serif text-[10px] font-semibold rounded-sm px-3 py-1 hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {signalSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Value Detection */}
        <div className="border-b border-rule-light pb-3">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-2">
            Value Detection
          </h4>
          <div className="space-y-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Problem {i + 1}</label>
                <input
                  type="text"
                  value={log.problems?.[i]?.problem || ''}
                  onChange={(e) => {
                    const problems = [...(log.problems || [])]
                    if (!problems[i]) problems[i] = { problem: '', painPoint: '', solution: '', brokenWhy: '' }
                    problems[i] = { ...problems[i], problem: e.target.value }
                    updateField('problems', problems)
                  }}
                  className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                  placeholder="What's broken?"
                />
              </div>
            ))}
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Pick One for 48h Test</label>
              <input
                type="text"
                value={log.problemSelected || ''}
                onChange={(e) => updateField('problemSelected', e.target.value)}
                className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                placeholder="Which to test this week?"
              />
            </div>
          </div>
        </div>

        {/* Pillars Touched */}
        <div>
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-navy mb-1.5">
            Pillars Touched Today
          </h4>
          <div className="flex gap-1.5">
            {THESIS_PILLARS.map((pillar) => {
              const touched = ((log.pillarsTouched || []) as ThesisPillar[]).includes(pillar.value)
              return (
                <button
                  key={pillar.value}
                  onClick={() => {
                    const current = (log.pillarsTouched || []) as ThesisPillar[]
                    const next = touched ? current.filter(p => p !== pillar.value) : [...current, pillar.value]
                    updateField('pillarsTouched', next)
                  }}
                  className={`font-serif text-[10px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                    touched ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                  }`}
                >
                  {pillar.label}
                </button>
              )
            })}
          </div>
          <p className="font-serif text-[7px] italic text-ink-muted mt-1">
            det[AI, Markets, Mind] — which dimensions engaged?
          </p>
        </div>
      </div>
    </div>
  )
}
