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

interface BuildStep {
  id: string
  title: string
  description: string
  details: string[]
  status: 'planned' | 'in-progress' | 'shipped'
  dependency?: string
}

const PRE_WORK_ITEMS: PreWorkItem[] = [
  {
    id: 'trade-data',
    title: 'Trade Data Export',
    description: 'Sean exports historical trade log — ticker, entry price, exit price, quantity, timestamps. CSV or broker export. This is the single blocker for everything else.',
    status: 'not-started',
    owner: 'sean',
  },
  {
    id: 'api-market-data',
    title: 'Market Data API',
    description: 'Connect Alpha Vantage + Massive for intraday/daily price data around trade timestamps. Needed to compare Sean\'s fills vs. what was available.',
    status: 'not-started',
    owner: 'lori',
  },
  {
    id: 'api-vercel',
    title: 'Vercel API Routes',
    description: 'Serverless endpoints for trade ingestion, analysis runs, and serving the dashboard. Infra already exists in this repo.',
    status: 'not-started',
    owner: 'lori',
  },
]

const BUILD_STEPS: BuildStep[] = [
  {
    id: 'trade-analysis',
    title: 'Trade Analysis Engine',
    description: 'Ingest Sean\'s trades, pull market data around each trade, compute what a better entry/exit would have been.',
    details: [
      'Parse trade log (CSV/JSON) into structured format',
      'Pull intraday price data for each trade window',
      'Compare actual fill vs. optimal limit order placement',
      'Score each trade: how much was left on the table',
    ],
    status: 'planned',
    dependency: 'trade-data',
  },
  {
    id: 'suggested-orders',
    title: 'Suggested Better Orders',
    description: 'For each trade pattern, generate the limit order that would have captured more value — ideally auto-generate these going forward.',
    details: [
      'Pattern detection: recurring tickers, time-of-day, order sizes',
      'Optimal limit price calculation based on historical fills',
      'Forward-looking suggestions for active positions',
      'Mobile-friendly daily view: "here\'s what to set today"',
    ],
    status: 'planned',
    dependency: 'trade-analysis',
  },
  {
    id: 'attribution',
    title: 'Attribution Tracker',
    description: 'Every trade logs the P&L delta from optimization. Auditable split between Alamo Bernal (capital + execution) and Generative Intelligence (signal + infra).',
    details: [
      'Per-trade: actual P&L vs. optimized P&L (the delta is the value created)',
      'Running total: cumulative value added by limit order optimization',
      'AB & GI revenue share computed automatically per trade',
      'Monthly settlement export (PDF/CSV)',
    ],
    status: 'planned',
    dependency: 'suggested-orders',
  },
  {
    id: 'backtest-validation',
    title: 'Backtest & Paper Trade',
    description: 'If needed: run suggested orders against historical data to prove the optimization works before going live.',
    details: [
      'Replay historical trades with optimized limit orders',
      'Compare: actual returns vs. optimized returns',
      'Paper trade mode: run suggestions in parallel without real capital',
      'Confidence threshold before switching to live suggestions',
    ],
    status: 'planned',
    dependency: 'suggested-orders',
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
            Sean&apos;s trade data is the single blocker. Everything else follows from it.
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
            Understand his trades, suggest better ones, track the value created.
          </p>

          {/* Pipeline flow */}
          <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b border-forest-rule">
              Pipeline
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {['Trade Data', 'Analysis', 'Suggestions', 'Attribution'].map((step, i) => (
                <div key={step} className="flex items-center gap-1">
                  <span className="font-mono text-[9px] sm:text-[8px] text-forest-ink px-1.5 py-0.5 rounded-sm border border-forest-rule bg-forest-cream">
                    {step}
                  </span>
                  {i < 3 && <span className="text-[9px] text-forest-ink-faint">&rarr;</span>}
                </div>
              ))}
            </div>
          </div>

          {BUILD_STEPS.map((item, idx) => (
            <div
              key={item.id}
              className={`bg-forest-surface border rounded-sm p-3 ${
                idx === BUILD_STEPS.length - 1
                  ? 'border-dashed border-forest-rule'
                  : 'border-forest-rule'
              }`}
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
                  {idx === BUILD_STEPS.length - 1 && (
                    <span className="font-mono text-[8px] sm:text-[7px] uppercase px-1 py-px rounded-sm border shrink-0 text-forest-ink-faint bg-transparent border-forest-rule">
                      If Needed
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug mb-2">
                {item.description}
              </p>
              <div className="space-y-1">
                {item.details.map((detail, di) => (
                  <div key={di} className="flex items-start gap-1.5">
                    <span className="text-[9px] sm:text-[8px] text-forest-ink-faint mt-px shrink-0">&#x2022;</span>
                    <span className="text-[10px] sm:text-[9px] text-forest-ink-muted">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Attribution Model */}
          <div className="bg-forest-surface border-2 border-forest rounded-sm p-3">
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b border-forest-rule">
              Attribution Split
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-[9px] font-medium text-forest-ink">Alamo Bernal</span>
                <p className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug">
                  Capital, execution, risk management, trade selection
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] sm:text-[9px] font-medium text-forest-ink">Generative Intelligence</span>
                <p className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug">
                  Optimization engine, signal generation, attribution infrastructure
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-forest-rule">
              <p className="text-[9px] sm:text-[8px] text-forest-ink-faint">
                Value measured = P&amp;L delta between actual fills and optimized limit orders. Attribution computed per trade, settled monthly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
