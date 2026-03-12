'use client'

import { useState } from 'react'

type Phase = 'pre-work' | 'build-plan'

interface PreWorkItem {
  id: string
  title: string
  description: string
  status: 'not-started' | 'in-progress' | 'done'
  owner: 'lori' | 'sean' | 'both'
}

interface BuildItem {
  id: string
  title: string
  description: string
  features: string[]
  status: 'planned' | 'in-progress' | 'shipped'
}

const PRE_WORK_ITEMS: PreWorkItem[] = [
  {
    id: 'trade-data',
    title: 'Trade Data',
    description: 'Historical trade execution data — entries, exits, fill prices, slippage. Foundation for all signal & attribution work.',
    status: 'not-started',
    owner: 'sean',
  },
  {
    id: 'api-feed-massive',
    title: 'API Feed — Massive',
    description: 'Connect Massive data feed for real-time market data ingestion.',
    status: 'not-started',
    owner: 'lori',
  },
  {
    id: 'api-feed-alpha-vantage',
    title: 'API Feed — Alpha Vantage',
    description: 'Alpha Vantage integration for intraday quotes, technicals, and fundamental data.',
    status: 'not-started',
    owner: 'lori',
  },
  {
    id: 'api-feed-vercel',
    title: 'API Feed — Vercel',
    description: 'Serverless API routes on Vercel for signal processing, cron jobs, and webhook endpoints.',
    status: 'not-started',
    owner: 'lori',
  },
]

const BUILD_ITEMS: BuildItem[] = [
  {
    id: 'live-signals',
    title: 'Live Intraday Signals',
    description: 'Real-time signal generation engine that processes market data and outputs actionable limit order levels.',
    features: [
      'Intraday price feed ingestion',
      'Signal computation pipeline',
      'Alert delivery (dashboard + mobile push)',
      'Confidence scoring per signal',
    ],
    status: 'planned',
  },
  {
    id: 'daily-dashboard',
    title: 'Daily, Mobile-Friendly Dashboard',
    description: 'At-a-glance view of today\'s signals, open orders, P&L, and market regime — optimized for phone.',
    features: [
      'Today\'s signal queue with entry/exit levels',
      'Open position tracker',
      'Daily P&L summary',
      'Market regime indicator (risk-on / risk-off)',
    ],
    status: 'planned',
  },
  {
    id: 'macro-kill-switch',
    title: 'Macro Kill-Switch',
    description: 'Binary gate: should we trade today? Aggregates macro signals (VIX, yield curve, news sentiment) into a go/no-go decision.',
    features: [
      'VIX threshold monitor',
      'Yield curve inversion flag',
      'News sentiment aggregator',
      'Manual override toggle',
    ],
    status: 'planned',
  },
  {
    id: 'attribution-tracker',
    title: 'Attribution Tracker',
    description: 'Baked-in revenue attribution — every trade logs the Alamo Bernal & Generative Intelligence cut automatically.',
    features: [
      'Per-trade P&L attribution',
      'Alamo Bernal revenue share calculation',
      'Generative Intelligence (tech) cut tracking',
      'Monthly settlement summary',
    ],
    status: 'planned',
  },
]

const STATUS_COLORS: Record<string, string> = {
  'not-started': 'text-forest-ink-muted bg-forest-cream border-forest-rule',
  'in-progress': 'text-amber-ink bg-amber-bg border-amber-ink/20',
  'done': 'text-green-ink bg-green-bg border-green-ink/20',
  'planned': 'text-forest-ink-muted bg-forest-cream border-forest-rule',
  'shipped': 'text-green-ink bg-green-bg border-green-ink/20',
}

const STATUS_LABELS: Record<string, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'done': 'Done',
  'planned': 'Planned',
  'shipped': 'Shipped',
}

export default function LimitOrderOptimization() {
  const [activePhase, setActivePhase] = useState<Phase>('pre-work')

  return (
    <div className="space-y-3">
      {/* Phase Toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setActivePhase('pre-work')}
          className={`flex-1 font-serif text-[12px] sm:text-[11px] font-medium px-3 py-2 sm:py-1.5 rounded-sm border transition-colors ${
            activePhase === 'pre-work'
              ? 'bg-forest text-paper border-forest'
              : 'bg-transparent text-forest-ink-muted border-forest-rule hover:border-forest-ink-faint'
          }`}
        >
          Pre-Work Needed
        </button>
        <button
          onClick={() => setActivePhase('build-plan')}
          className={`flex-1 font-serif text-[12px] sm:text-[11px] font-medium px-3 py-2 sm:py-1.5 rounded-sm border transition-colors ${
            activePhase === 'build-plan'
              ? 'bg-forest text-paper border-forest'
              : 'bg-transparent text-forest-ink-muted border-forest-rule hover:border-forest-ink-faint'
          }`}
        >
          Plan to Build
        </button>
      </div>

      {/* ── Pre-Work ── */}
      {activePhase === 'pre-work' && (
        <div className="space-y-2">
          <p className="text-[11px] sm:text-[10px] text-forest-ink-muted">
            Data and API infrastructure required before signal development can begin.
          </p>
          {PRE_WORK_ITEMS.map((item) => (
            <div
              key={item.id}
              className="bg-forest-surface border border-forest-rule rounded-sm p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] sm:text-[11px] font-medium text-forest-ink">
                      {item.title}
                    </span>
                    <span className={`font-mono text-[8px] sm:text-[7px] uppercase px-1 py-px rounded-sm border shrink-0 ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug mt-1">
                    {item.description}
                  </p>
                </div>
                <span className="font-mono text-[9px] sm:text-[8px] text-forest-ink-faint uppercase shrink-0">
                  {item.owner === 'both' ? 'Both' : item.owner}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Build Plan ── */}
      {activePhase === 'build-plan' && (
        <div className="space-y-2">
          <p className="text-[11px] sm:text-[10px] text-forest-ink-muted">
            Four deliverables that compose the limit order optimization system.
          </p>
          {BUILD_ITEMS.map((item, idx) => (
            <div
              key={item.id}
              className="bg-forest-surface border border-forest-rule rounded-sm p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[9px] sm:text-[8px] text-forest-ink-faint">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[12px] sm:text-[11px] font-medium text-forest-ink">
                    {item.title}
                  </span>
                  <span className={`font-mono text-[8px] sm:text-[7px] uppercase px-1 py-px rounded-sm border shrink-0 ${STATUS_COLORS[item.status]}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
              </div>
              <p className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug mb-2">
                {item.description}
              </p>
              <div className="space-y-1">
                {item.features.map((feature, fi) => (
                  <div key={fi} className="flex items-start gap-1.5">
                    <span className="text-[9px] sm:text-[8px] text-forest-ink-faint mt-px shrink-0">&#x2022;</span>
                    <span className="text-[10px] sm:text-[9px] text-forest-ink-muted">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Attribution Summary */}
          <div className="bg-forest-surface border-2 border-forest rounded-sm p-3">
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b border-forest-rule">
              Revenue Attribution Model
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-[9px] text-forest-ink-muted">Alamo Bernal</span>
                <p className="text-[10px] sm:text-[9px] text-forest-ink leading-snug">
                  Capital allocation, trade execution, risk management
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] sm:text-[9px] text-forest-ink-muted">Generative Intelligence</span>
                <p className="text-[10px] sm:text-[9px] text-forest-ink leading-snug">
                  Signal engine, dashboard, optimization infrastructure
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
