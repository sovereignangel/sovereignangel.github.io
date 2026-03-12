'use client'

import { useState } from 'react'

/* ────────────────────────────────────────────────────────────────
   Limit Order Optimization — Phased Roadmap
   Structured as a single-page briefing with phase gates.
   ──────────────────────────────────────────────────────────────── */

const PHASES = [
  {
    id: 1,
    title: 'Learn',
    subtitle: 'Historical Trade Analysis & Fidelity Flow',
    duration: '2–4 weeks',
    status: 'next' as const,
    thesis: 'Before building anything, understand the data. Ingest Sean\'s historical trades, overlay intraday market data, and quantify how much value a smarter limit order would have captured per stock.',
    workstreams: [
      {
        title: 'Trade Data Ingestion',
        owner: 'sean' as const,
        items: [
          'Export full trade history from Fidelity (Aug 2025 — present)',
          'Fields needed: ticker, ex-div date, dividend amount, entry price, limit order price, fill price, exit timestamp',
          'CSV or broker export — any format works',
        ],
      },
      {
        title: 'Market Data Pipeline',
        owner: 'lori' as const,
        items: [
          'Connect Alpha Vantage + Massive for intraday price data',
          'Pull 1-min candles around each historical trade window',
          'Build price context: what was available vs. what Sean got',
        ],
      },
      {
        title: 'Trade Scorecard',
        owner: 'lori' as const,
        items: [
          'Per-trade analysis: actual loss % vs. optimal achievable loss %',
          'Cluster by stock characteristics (volatility, dividend yield, sector)',
          'Identify which stocks systematically over/under-perform the flat 50% rule',
        ],
      },
      {
        title: 'Fidelity Workflow Documentation',
        owner: 'both' as const,
        items: [
          'Map Sean\'s current morning routine step-by-step',
          'Identify manual touchpoints that can be automated',
          'Document order types and constraints Fidelity supports',
        ],
      },
    ],
    gate: {
      question: 'Can we identify stocks where a different limit price would have materially improved outcome?',
      criteria: [
        'Trade scorecard shows consistent >5% improvement opportunity on subset of stocks',
        'Enough historical data (6+ months) to be statistically meaningful',
        'Clear per-stock patterns emerge (not just noise)',
      ],
      killCondition: 'If 50% flat rule is already near-optimal for most stocks, the optimization thesis is challenged — stop here and redirect effort.',
    },
  },
  {
    id: 2,
    title: 'Build & Prove',
    subtitle: 'Optimization Model + Auditable Backtest',
    duration: '4–8 weeks',
    status: 'blocked' as const,
    thesis: 'Build the per-stock dynamic threshold model. Backtest against Phase 1 data with a full audit trail. Simultaneously introduce Sean to Interactive Brokers for future API-driven execution.',
    workstreams: [
      {
        title: 'Optimization Model',
        owner: 'lori' as const,
        items: [
          'Per-stock dynamic limit price based on: historical recovery speed, dividend yield, sector volatility, market regime',
          'Output: "for TICKER X on ex-div day, set limit at Y% instead of flat 50%"',
          'Model must be explainable — Sean needs to understand why each number',
        ],
      },
      {
        title: 'Backtest Engine',
        owner: 'lori' as const,
        items: [
          'Replay every historical trade with optimized limit orders',
          'Full audit trail: date, ticker, actual fill, model fill, delta, cumulative savings',
          'Generate report: "here\'s what you did vs. what the model would have done"',
        ],
      },
      {
        title: 'Interactive Brokers Introduction',
        owner: 'sean' as const,
        items: [
          'Open IB account (paper trading first)',
          'Transfer small test allocation',
          'Learn the platform — order entry, limit order types, API concepts',
        ],
      },
      {
        title: 'Attribution Framework',
        owner: 'lori' as const,
        items: [
          'Define value created = P&L delta between flat 50% and optimized threshold',
          'Automated AB & GI revenue share computation per trade',
          'Monthly settlement summary (exportable PDF/CSV)',
        ],
      },
    ],
    gate: {
      question: 'Does the backtest show consistent, meaningful savings below the 40% loss baseline?',
      criteria: [
        'Model outperforms flat 50% on >60% of trades in backtest',
        'Cumulative savings are material (worth the operational complexity)',
        'Sean has reviewed the backtest report and believes the numbers',
        'Sean has opened an IB account with a test allocation',
      ],
      killCondition: 'If backtest shows marginal or inconsistent improvement, the model isn\'t ready. Iterate on the model or accept that flat 50% is good enough.',
    },
  },
  {
    id: 3,
    title: 'Supervised Live',
    subtitle: 'Daily Order Suggestions via Interactive Brokers',
    duration: '2–4 weeks to launch, then ongoing',
    status: 'blocked' as const,
    thesis: 'Every morning, the system generates optimized limit orders for today\'s ex-dividend stocks. Sean reviews on his phone and approves each order in IB. Full attribution tracked automatically.',
    workstreams: [
      {
        title: 'Morning Order Sheet',
        owner: 'lori' as const,
        items: [
          'Automated daily run: pull today\'s ex-div stocks from watchlist',
          'Compute optimal limit price per stock using the proven model',
          'Push mobile-friendly notification with the order sheet',
          'Sean reviews, taps approve — order placed in IB via API',
        ],
      },
      {
        title: 'Macro Kill-Switch',
        owner: 'lori' as const,
        items: [
          'Binary gate: should we trade today?',
          'Inputs: VIX level, broad market overnight moves, sector stress',
          'If kill-switch is ON, no orders generated — Sean gets a "sit today out" message',
        ],
      },
      {
        title: 'Live Attribution Tracker',
        owner: 'lori' as const,
        items: [
          'Every executed trade logged with: actual P&L, baseline P&L (flat 50%), delta',
          'Running dashboard: cumulative value added, per-month breakdown',
          'Auditable trail for AB & GI revenue share settlement',
        ],
      },
      {
        title: 'Trust & Handoff',
        owner: 'sean' as const,
        items: [
          'Review every suggested order for first 2–4 weeks (supervised mode)',
          'Flag disagreements — model learns from overrides',
          'Graduate to "approve all" once confidence is established',
        ],
      },
    ],
    gate: {
      question: 'Is Sean comfortable enough to approve orders without second-guessing each one?',
      criteria: [
        'Enough live trades (30+) with consistent results',
        'Sean\'s override rate drops below 10%',
        'Monthly attribution report shows clear, positive value creation',
      ],
      killCondition: 'If Sean overrides >50% of suggestions after 4 weeks, the model needs more work — return to Phase 2.',
    },
  },
]

const STATUS_STYLES = {
  next: { label: 'Next Up', color: 'text-forest bg-forest-bg border-forest/20' },
  active: { label: 'Active', color: 'text-green-ink bg-green-bg border-green-ink/20' },
  blocked: { label: 'Blocked', color: 'text-forest-ink-faint bg-forest-cream border-forest-rule' },
  complete: { label: 'Complete', color: 'text-green-ink bg-green-bg border-green-ink/20' },
}

export default function LimitOrderOptimization() {
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([1]))

  function togglePhase(id: number) {
    setOpenPhases((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {/* ── Briefing Header ── */}
      <div className="bg-forest-surface border-2 border-forest rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-1">
          Limit Order Optimization
        </div>
        <p className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug mb-2">
          Phased approach to replacing Sean&apos;s flat 50% limit order rule with per-stock dynamic thresholds.
          Each phase has a gate — we don&apos;t advance until the evidence supports it.
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          {PHASES.map((phase, i) => (
            <div key={phase.id} className="flex items-center gap-1">
              <span className={`font-mono text-[9px] sm:text-[8px] px-1.5 py-0.5 rounded-sm border ${STATUS_STYLES[phase.status].color}`}>
                Phase {phase.id}: {phase.title}
              </span>
              {i < PHASES.length - 1 && <span className="text-[9px] text-forest-ink-faint">&rarr;</span>}
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-forest-rule flex flex-wrap gap-3">
          <div>
            <span className="text-[9px] text-forest-ink-faint uppercase tracking-wide">Est. Total</span>
            <span className="text-[10px] font-medium text-forest-ink ml-1.5">2–4 months</span>
          </div>
          <div>
            <span className="text-[9px] text-forest-ink-faint uppercase tracking-wide">First Blocker</span>
            <span className="text-[10px] font-medium text-forest-ink ml-1.5">Sean&apos;s trade data export</span>
          </div>
        </div>
      </div>

      {/* ── Phases ── */}
      {PHASES.map((phase) => {
        const isOpen = openPhases.has(phase.id)
        return (
          <div key={phase.id} className="space-y-2">
            {/* Phase Header (clickable) */}
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full text-left bg-forest-surface border border-forest-rule rounded-sm p-3 hover:bg-forest-cream/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-forest-ink-muted">{isOpen ? '\u25BC' : '\u25B6'}</span>
                  <span className="font-mono text-[10px] sm:text-[9px] font-semibold text-forest">
                    Phase {phase.id}
                  </span>
                  <span className="font-serif text-[12px] sm:text-[11px] font-semibold text-forest-ink">
                    {phase.title}
                  </span>
                  <span className={`font-mono text-[8px] sm:text-[7px] uppercase px-1 py-px rounded-sm border shrink-0 ${STATUS_STYLES[phase.status].color}`}>
                    {STATUS_STYLES[phase.status].label}
                  </span>
                </div>
                <span className="font-mono text-[9px] sm:text-[8px] text-forest-ink-faint shrink-0">
                  {phase.duration}
                </span>
              </div>
              <p className="text-[9px] text-forest-ink-faint uppercase tracking-wide mt-1.5 ml-5">{phase.subtitle}</p>
              {!isOpen && (
                <p className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug mt-1 ml-5 line-clamp-2">
                  {phase.thesis}
                </p>
              )}
            </button>

            {isOpen && (
              <>
                {/* Thesis */}
                <div className="ml-5">
                  <p className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug">
                    {phase.thesis}
                  </p>
                </div>

                {/* Workstreams */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {phase.workstreams.map((ws) => (
                    <div key={ws.title} className="bg-white border border-forest-rule rounded-sm p-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-forest-rule">
                        <span className="font-serif text-[11px] sm:text-[10px] font-semibold text-forest-ink">
                          {ws.title}
                        </span>
                        <span className={`font-mono text-[8px] sm:text-[7px] uppercase px-1 py-px rounded-sm border shrink-0 ${
                          ws.owner === 'sean'
                            ? 'text-amber-ink bg-amber-bg border-amber-ink/20'
                            : ws.owner === 'both'
                              ? 'text-forest bg-forest-bg border-forest/20'
                              : 'text-forest-ink-muted bg-forest-cream border-forest-rule'
                        }`}>
                          {ws.owner === 'both' ? 'Both' : ws.owner === 'sean' ? 'Sean' : 'Lori'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {ws.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-[8px] text-forest-ink-faint mt-0.5 shrink-0">&#x2022;</span>
                            <span className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Phase Gate */}
                <div className="bg-forest-cream border border-forest rounded-sm p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-[9px] sm:text-[8px] font-semibold text-forest uppercase tracking-wide">
                      Gate {phase.id}
                    </span>
                    <span className="text-[10px] sm:text-[9px] font-medium text-forest-ink">
                      {phase.gate.question}
                    </span>
                  </div>
                  <div className="space-y-1 mb-2">
                    {phase.gate.criteria.map((c, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-[9px] sm:text-[8px] text-forest mt-0.5 shrink-0">&#x25A2;</span>
                        <span className="text-[10px] sm:text-[9px] text-forest-ink-muted leading-snug">{c}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-1.5 border-t border-forest-rule">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[9px] sm:text-[8px] text-red-ink mt-0.5 shrink-0">&#x2715;</span>
                      <span className="text-[10px] sm:text-[9px] text-red-ink leading-snug">{phase.gate.killCondition}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* ── Attribution Model ── */}
      <div className="bg-forest-surface border-2 border-forest rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b border-forest-rule">
          Attribution Model
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
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
        <div className="pt-2 border-t border-forest-rule">
          <p className="text-[9px] sm:text-[8px] text-forest-ink-faint leading-snug">
            Value = P&amp;L delta between flat 50% baseline and optimized limit orders. Computed per trade, auditable end-to-end, settled monthly. Performance-based comp: half of savings below 40% loss baseline.
          </p>
        </div>
      </div>
    </div>
  )
}
