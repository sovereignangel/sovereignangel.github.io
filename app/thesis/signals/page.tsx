'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getSignals, saveSignal, deleteSignal } from '@/lib/firestore'
import type { Signal, SignalType, SignalStatus } from '@/lib/types'
import { MARKET_SIGNAL_TYPES, SIGNAL_STATUS_OPTIONS } from '@/lib/constants'
import StatusIndicator from '@/components/thesis/StatusIndicator'

const SIGNAL_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'testing', label: 'Testing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'archived', label: 'Archived' },
]

const SIGNAL_TYPES: { value: SignalType; label: string }[] = [
  { value: 'arbitrage', label: 'Arbitrage' },
  { value: 'problem', label: 'Problem' },
  { value: 'market', label: 'Market' },
  { value: 'research', label: 'Research' },
]

const SIGNAL_SOURCES = [
  {
    tier: 'Tier 1',
    label: 'Action-Proximate',
    desc: 'Directly reduces uncertainty about what to build or sell next',
    color: 'text-green-ink',
    bg: 'bg-green-bg',
    sources: [
      { name: 'Customer conversations & support tickets', why: 'Ground truth on pain — unfiltered', ruin: 'None — always signal' },
      { name: 'Competitor changelogs & pricing moves', why: 'Reveals what the market actually pays for', ruin: 'Obsessing over competitors instead of shipping' },
      { name: 'Revenue data (yours + public comps)', why: 'Calibrates willingness-to-pay', ruin: 'Vanity metrics vs. actual conversion' },
      { name: 'Distribution channel analytics', why: 'Where attention actually flows', ruin: 'Chasing platforms instead of building' },
    ],
  },
  {
    tier: 'Tier 2',
    label: 'Model-Sharpening',
    desc: 'Improves the slope of your world model — you see further',
    color: 'text-navy',
    bg: 'bg-navy-bg',
    sources: [
      { name: 'Blog posts from calibrated thinkers', why: 'Borrow calibrated world models', ruin: 'Consumption disguised as learning' },
      { name: 'Research summaries (not full papers)', why: 'Frontier signal at low time cost', ruin: 'Rabbit holes with no test attached' },
      { name: 'Macro & market data (rates, flows, vol)', why: 'Context for Armstrong + fund thesis', ruin: 'Analysis paralysis' },
      { name: 'Tech trend reports (not hype cycles)', why: 'Spot picks-and-shovels opportunities', ruin: 'Trend-chasing without conviction' },
    ],
  },
  {
    tier: 'Tier 3',
    label: 'Optionality-Expanding',
    desc: 'Creates cheap call options on future moves',
    color: 'text-gold',
    bg: 'bg-gold-bg',
    sources: [
      { name: 'Job market signals (who hires for what, at what price)', why: 'Calibrates your market value + spots gaps', ruin: 'Distraction from building' },
      { name: 'Funding & deal flow signals', why: 'Deep Tech Fund context', ruin: 'Premature fund-brain' },
      { name: 'Community & network signals (who builds what)', why: 'Collaboration and distribution opportunities', ruin: 'Social media as proxy for work' },
    ],
  },
]

export default function SignalsPage() {
  const { user } = useAuth()
  const [signals, setSignals] = useState<Signal[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showSourceGuide, setShowSourceGuide] = useState(false)
  const [formType, setFormType] = useState<SignalType>('arbitrage')
  const [formData, setFormData] = useState<Partial<Signal>>({})

  useEffect(() => {
    if (!user) return
    loadSignals()
  }, [user, filter])

  const loadSignals = async () => {
    if (!user) return
    const data = await getSignals(user.uid, filter)
    setSignals(data)
  }

  const handleSave = async () => {
    if (!user) return
    await saveSignal(user.uid, { ...formData, signalType: formType })
    setFormData({})
    setShowForm(false)
    loadSignals()
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    await deleteSignal(user.uid, id)
    loadSignals()
  }

  const handleStatusChange = async (signalId: string, status: SignalStatus) => {
    if (!user) return
    await saveSignal(user.uid, { status }, signalId)
    loadSignals()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="font-serif text-[20px] font-bold text-ink tracking-tight">Signals</h2>
            <button
              onClick={() => setShowSourceGuide(true)}
              className="w-[15px] h-[15px] rounded-full border border-ink-faint text-ink-muted hover:border-navy hover:text-navy flex items-center justify-center transition-colors"
              title="Signal source guide"
            >
              <span className="font-serif text-[9px] italic leading-none">i</span>
            </button>
          </div>
          <p className="font-serif text-[12px] italic text-ink-muted mt-1">
            {signals.length} captured
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-paper font-serif text-[13px] font-semibold rounded-sm px-4 py-2 hover:bg-navy-light transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Signal'}
        </button>
      </div>

      {/* Signal Source Guide Modal */}
      {showSourceGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setShowSourceGuide(false)} />
          <div className="relative bg-paper border border-rule rounded-sm w-full max-w-[540px] max-h-[85vh] overflow-y-auto shadow-lg">
            <div className="sticky top-0 bg-paper px-5 py-4 border-b border-rule-light flex items-start justify-between z-10">
              <div>
                <p className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
                  What Signals Move &Phi;<sub>I</sub>?
                </p>
                <p className="font-serif text-[11px] italic text-ink-muted mt-1 leading-relaxed">
                  A signal only increases Generative Intelligence if it passes one filter:
                  <span className="font-semibold text-ink"> &ldquo;Does this change what I build or who I ask this week?&rdquo;</span>
                  {' '}If no &mdash; it&apos;s consumption, not signal capture.
                </p>
              </div>
              <button
                onClick={() => setShowSourceGuide(false)}
                className="text-ink-muted hover:text-ink transition-colors ml-3 mt-0.5 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {SIGNAL_SOURCES.map((tier) => (
                <div key={tier.tier}>
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <span className={`font-mono text-[11px] font-semibold ${tier.color}`}>{tier.tier}</span>
                    <span className="font-serif text-[12px] font-semibold text-ink">{tier.label}</span>
                    <span className="font-serif text-[10px] italic text-ink-muted">&mdash; {tier.desc}</span>
                  </div>
                  <div className="space-y-1.5">
                    {tier.sources.map((src) => (
                      <div key={src.name} className={`${tier.bg} border border-rule-light/60 rounded-sm px-3.5 py-2.5 flex items-start gap-3`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-[12px] font-medium text-ink leading-snug">{src.name}</p>
                          <p className="font-sans text-[10px] text-ink-muted mt-0.5">{src.why}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="font-serif text-[9px] italic uppercase tracking-wide text-red-ink/70">Ruin mode</p>
                          <p className="font-sans text-[10px] text-ink-light leading-snug">{src.ruin}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-rule-light bg-cream/40">
              <p className="font-serif text-[10px] italic text-ink-muted leading-relaxed">
                <span className="font-semibold text-ink">Cadence:</span>{' '}
                Daily (&lt;5 min) &mdash; your own analytics + 1-2 curated feeds.{' '}
                Weekly (30 min) &mdash; research digest, competitor scan, macro check.{' '}
                Real-time &mdash; customer quotes, market anomalies, &ldquo;that&apos;s broken&rdquo; moments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signal Form */}
      {showForm && (
        <div className="bg-paper border border-rule rounded-sm p-5 mb-6">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Add Signal
          </h3>

          {/* Type selector */}
          <div className="flex gap-2 mb-4">
            {SIGNAL_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setFormType(type.value)}
                className={`font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-colors ${
                  formType === type.value
                    ? 'text-navy border-navy bg-navy-bg'
                    : 'text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                placeholder="Signal title..."
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[60px] resize-y"
                placeholder="What did you notice?"
              />
            </div>

            {formType === 'problem' && (
              <>
                <div>
                  <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Who feels the pain?</label>
                  <input type="text" value={formData.painPoint || ''} onChange={(e) => setFormData({ ...formData, painPoint: e.target.value })} className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy" />
                </div>
                <div>
                  <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Why broken?</label>
                  <textarea value={formData.whyBroken || ''} onChange={(e) => setFormData({ ...formData, whyBroken: e.target.value })} className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[40px] resize-y" />
                </div>
              </>
            )}

            {formType === 'market' && (
              <div>
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Signal Type</label>
                <select value={formData.marketSignalType || ''} onChange={(e) => setFormData({ ...formData, marketSignalType: e.target.value as Signal['marketSignalType'] })} className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy">
                  <option value="">Select type...</option>
                  {MARKET_SIGNAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            )}

            {formType === 'research' && (
              <>
                <div>
                  <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Thesis Connection</label>
                  <select value={formData.thesisConnection || ''} onChange={(e) => setFormData({ ...formData, thesisConnection: e.target.value as Signal['thesisConnection'] })} className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy">
                    <option value="">Select...</option>
                    <option value="ai">AI</option>
                    <option value="markets">Markets</option>
                    <option value="mind">Mind</option>
                  </select>
                </div>
                <div>
                  <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">48h Test Idea</label>
                  <textarea value={formData.testIdea || ''} onChange={(e) => setFormData({ ...formData, testIdea: e.target.value })} className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[40px] resize-y" />
                </div>
              </>
            )}

            {formType === 'arbitrage' && (
              <>
                <div>
                  <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Gap</label>
                  <textarea value={formData.arbitrageGap || ''} onChange={(e) => setFormData({ ...formData, arbitrageGap: e.target.value })} className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[40px] resize-y" placeholder="What's hard | What could be automated | What people pay for" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Timeline (days)</label>
                    <input type="number" value={formData.timelineDays || ''} onChange={(e) => setFormData({ ...formData, timelineDays: parseInt(e.target.value) || 0 })} className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy" />
                  </div>
                  <div>
                    <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Revenue Potential (1-10)</label>
                    <input type="number" min="1" max="10" value={formData.revenuePotential || ''} onChange={(e) => setFormData({ ...formData, revenuePotential: parseInt(e.target.value) || 0 })} className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy" />
                  </div>
                </div>
                <div>
                  <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">One Action This Week</label>
                  <input type="text" value={formData.actionThisWeek || ''} onChange={(e) => setFormData({ ...formData, actionThisWeek: e.target.value })} className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy" />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">Relevant to thesis?</label>
              <button
                onClick={() => setFormData({ ...formData, relevantToThesis: !formData.relevantToThesis })}
                className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                  formData.relevantToThesis ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {formData.relevantToThesis ? 'Yes' : 'No'}
              </button>
            </div>

            <button
              onClick={handleSave}
              className="bg-navy text-paper font-serif text-[13px] font-semibold rounded-sm px-5 py-2.5 hover:bg-navy-light transition-colors"
            >
              Save Signal
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {SIGNAL_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-colors ${
              filter === f.value
                ? 'text-navy border-navy bg-navy-bg'
                : 'text-ink-light border-rule hover:border-ink-faint'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Signal Library */}
      <div className="space-y-3">
        {signals.length === 0 && (
          <div className="bg-paper border border-rule rounded-sm p-8 text-center">
            <p className="font-serif text-[14px] italic text-ink-muted">No signals yet. Start capturing what you notice.</p>
          </div>
        )}
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`bg-paper border rounded-sm p-4 ${
              signal.signalType === 'arbitrage' ? 'border-gold/30' : 'border-rule'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {signal.signalType === 'arbitrage' && signal.revenuePotential > 0 && (
                    <span className="font-mono text-[13px] font-semibold text-gold">
                      {signal.revenuePotential}/10
                    </span>
                  )}
                  <span className="font-serif text-[10px] uppercase tracking-wide text-ink-muted">
                    {signal.signalType}
                  </span>
                </div>
                <h4 className="font-sans text-[14px] font-medium text-ink mb-1">{signal.title}</h4>
                {signal.description && (
                  <p className="font-sans text-[12px] text-ink-light">{signal.description}</p>
                )}
                {signal.actionThisWeek && (
                  <p className="font-sans text-[11px] text-navy mt-1">Action: {signal.actionThisWeek}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={signal.status}
                  onChange={(e) => handleStatusChange(signal.id!, e.target.value as SignalStatus)}
                  className="font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                >
                  {SIGNAL_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleDelete(signal.id!)}
                  className="font-sans text-[11px] text-ink-muted hover:text-red-ink transition-colors px-1"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
