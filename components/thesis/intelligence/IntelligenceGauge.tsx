'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getSignals, saveSignal, deleteSignal } from '@/lib/firestore'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import type { Signal, SignalStatus } from '@/lib/types'
import { SIGNAL_STATUS_OPTIONS } from '@/lib/constants'

const SIGNAL_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'testing', label: 'Test' },
  { value: 'shipped', label: 'Ship' },
  { value: 'archived', label: 'Arch' },
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

export default function IntelligenceGauge({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth()
  const { log } = useDailyLogContext()
  const [signals, setSignals] = useState<Signal[]>([])
  const [filter, setFilter] = useState('all')
  const [showSourceGuide, setShowSourceGuide] = useState(false)

  useEffect(() => {
    if (!user) return
    getSignals(user.uid, filter).then(setSignals)
  }, [user, filter, refreshKey])

  const handleStatusChange = async (signalId: string, status: SignalStatus) => {
    if (!user) return
    await saveSignal(user.uid, { status }, signalId)
    getSignals(user.uid, filter).then(setSignals)
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    await deleteSignal(user.uid, id)
    getSignals(user.uid, filter).then(setSignals)
  }

  const giScore = log.rewardScore?.components?.gi

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
            Signal Library
          </h3>
          <button
            onClick={() => setShowSourceGuide(true)}
            className="w-[15px] h-[15px] rounded-full border border-ink-faint text-ink-muted hover:border-navy hover:text-navy flex items-center justify-center transition-colors"
            title="Signal source guide"
          >
            <span className="font-serif text-[9px] italic leading-none">i</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-ink-muted">ĠI</span>
          <span className={`font-mono text-[14px] font-bold ${
            giScore != null ? (giScore >= 0.7 ? 'text-green-ink' : giScore >= 0.4 ? 'text-amber-ink' : 'text-red-ink') : 'text-ink-muted'
          }`}>
            {giScore != null ? (giScore * 100).toFixed(0) : '—'}
          </span>
          <span className="font-mono text-[11px] text-ink-faint">{signals.length} signals</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-2 shrink-0">
        {SIGNAL_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`font-serif text-[11px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              filter === f.value
                ? 'text-navy border-navy bg-navy-bg'
                : 'text-ink-light border-rule hover:border-ink-faint'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Scrollable signal list */}
      <div className="flex-1 overflow-y-auto space-y-2 bg-paper border border-rule rounded-sm p-2">
        {signals.length === 0 && (
          <p className="font-serif text-[13px] italic text-ink-muted text-center py-4">
            No signals yet. Capture what you notice.
          </p>
        )}
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`border rounded-sm p-2.5 ${
              signal.signalType === 'arbitrage' ? 'border-gold/30' : 'border-rule-light'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {signal.signalType === 'arbitrage' && signal.revenuePotential > 0 && (
                    <span className="font-mono text-[12px] font-semibold text-gold">{signal.revenuePotential}/10</span>
                  )}
                  <span className="font-serif text-[10px] uppercase tracking-wide text-ink-muted">{signal.signalType}</span>
                </div>
                <h4 className="font-sans text-[13px] font-medium text-ink leading-snug">{signal.title}</h4>
                {signal.actionThisWeek && (
                  <p className="font-sans text-[12px] text-navy mt-0.5">Action: {signal.actionThisWeek}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <select
                  value={signal.status}
                  onChange={(e) => handleStatusChange(signal.id!, e.target.value as SignalStatus)}
                  className="font-sans text-[11px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-navy"
                >
                  {SIGNAL_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleDelete(signal.id!)}
                  className="font-sans text-[12px] text-ink-muted hover:text-red-ink transition-colors px-0.5"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Signal Source Guide Modal */}
      {showSourceGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setShowSourceGuide(false)} />
          <div className="relative bg-paper border border-rule rounded-sm w-full max-w-[540px] max-h-[85vh] overflow-y-auto shadow-lg">
            <div className="sticky top-0 bg-paper px-5 py-4 border-b border-rule-light flex items-start justify-between z-10">
              <div>
                <p className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
                  What Signals Move &#x3A6;<sub>I</sub>?
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
    </div>
  )
}
