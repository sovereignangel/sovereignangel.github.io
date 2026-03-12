'use client'

import { useState } from 'react'

/* ────────────────────────────────────────────────────────────────
   Limit Order Optimization — Phased Roadmap
   Structured as a single-page briefing with phase gates.
   ──────────────────────────────────────────────────────────────── */

const PHASES = [
  {
    id: 0,
    title: 'Discovery',
    subtitle: 'Feasibility Assessment — 2 Sessions, 1 Sprint',
    duration: '1 sprint',
    status: 'active' as const,
    thesis: 'Before committing to a multi-month build, we determine whether limit order optimization is even possible. Two working sessions with Sean, independent research between sessions, and a go/no-go decision at the end. This runs under the existing retainer — no new pricing.',
    workstreams: [
      {
        title: 'Account Setup',
        owner: 'sean' as const,
        items: [
          'Lori creates Alpha Vantage + Massive accounts and shares credentials',
          'Sean logs in and adds payment method / subscribes',
          'Accounts active before Session 1 so we can pull live data together',
        ],
      },
      {
        title: 'Session 1 — Trade Mechanics Deep Dive',
        owner: 'both' as const,
        items: [
          'Walk through 5–10 actual trades together: what happened, why, what Sean was thinking',
          'Map the morning routine end-to-end: screening → order entry → monitoring → exit',
          'Identify: when a stock drops past 50%, how often does it recover same day?',
          'Are there stocks where Sean knows 50% is wrong but sets it anyway?',
          'Sean exports trade history from Fidelity (CSV or broker report) during or after session',
        ],
      },
      {
        title: 'Independent Research (Between Sessions)',
        owner: 'lori' as const,
        items: [
          'Pull intraday data for 10–15 of Sean\'s most-traded tickers around ex-div dates',
          'Quick analysis: was there a better limit price that would have been obvious in hindsight?',
          'Check loss distribution: bimodal (hits 50% or barely moves) vs. continuous spread?',
          'Estimated effort: 5–8 hours',
        ],
      },
      {
        title: 'Session 2 — Findings & Go/No-Go',
        owner: 'both' as const,
        items: [
          'Present research: "here\'s what we found looking at your trades"',
          'Show specific examples: stocks where a different threshold would have saved money',
          'Go/no-go decision: is the signal strong enough to justify building?',
          'If go: agree on Phase 1 scope, timeline, and the performance-based comp structure',
          'If no-go: redirect effort to screening & recordkeeping automation (already on retainer)',
        ],
      },
    ],
    gate: {
      question: 'Is there enough signal in the data to justify building an optimization engine?',
      criteria: [
        'At least some stocks show clear, repeatable improvement opportunity vs. flat 50%',
        'The improvement is large enough to matter (not just noise)',
        'Sean agrees the findings are credible and wants to proceed',
      ],
      killCondition: 'If analysis shows the 50% rule is already near-optimal (market efficiency), we stop here and redirect all effort to screening & automation under the existing retainer. No time wasted.',
    },
  },
  {
    id: 1,
    title: 'Learn & Build',
    subtitle: 'Historical Analysis + Optimization Model',
    duration: '',
    status: 'blocked' as const,
    thesis: 'With feasibility confirmed, we ingest the full trade history, build the market data pipeline, and develop the per-stock dynamic threshold model. Backtest everything with a full audit trail.',
    workstreams: [
      {
        title: 'Trade Data Pipeline',
        owner: 'lori' as const,
        items: [
          'Full trade history parsed into structured format',
          'Alpha Vantage + Massive pulling 1-min candles around each trade window',
          'Per-trade scorecard: actual loss % vs. optimal achievable loss %',
        ],
      },
      {
        title: 'Optimization Model',
        owner: 'lori' as const,
        items: [
          'Per-stock dynamic limit price based on: recovery speed, dividend yield, sector volatility, market regime',
          'Output: "for TICKER X on ex-div day, set limit at Y% instead of flat 50%"',
          'Every recommendation explainable — clear reasoning behind each number',
        ],
      },
      {
        title: 'Backtest & Audit Trail',
        owner: 'lori' as const,
        items: [
          'Every historical trade replayed with optimized limit orders',
          'Full audit trail: date, ticker, actual fill, model fill, delta, cumulative savings',
          'Side-by-side report: what happened vs. what the model would have done',
        ],
      },
      {
        title: 'Attribution Framework',
        owner: 'lori' as const,
        items: [
          'Value created = P&L delta between flat 50% and optimized threshold',
          'AB & GI revenue share computed automatically per trade',
          'Monthly settlement summary exportable (PDF/CSV)',
        ],
      },
    ],
    gate: {
      question: 'Does the backtest show consistent, meaningful savings below the 40% loss baseline?',
      criteria: [
        'Model outperforms flat 50% on >60% of trades in backtest',
        'Cumulative savings are material (worth the operational complexity)',
        'Backtest report reviewed and numbers validated',
      ],
      killCondition: 'If backtest shows marginal or inconsistent improvement, the model isn\'t ready — we iterate or accept that flat 50% is good enough.',
    },
  },
  {
    id: 2,
    title: 'Supervised Live',
    subtitle: 'Daily Order Suggestions via Interactive Brokers',
    duration: '',
    status: 'blocked' as const,
    thesis: 'Every morning, the system generates optimized limit orders for today\'s ex-dividend stocks. Review on phone, tap approve, order placed in IB via API. Full attribution tracked automatically.',
    workstreams: [
      {
        title: 'Interactive Brokers Setup',
        owner: 'sean' as const,
        items: [
          'IB account opened (paper trading first)',
          'Small test allocation transferred',
          'Platform familiarization — order entry, limit order types, API concepts',
        ],
      },
      {
        title: 'Morning Order Sheet',
        owner: 'lori' as const,
        items: [
          'Daily automated run pulls today\'s ex-div stocks from watchlist',
          'Optimal limit price computed per stock using the proven model',
          'Mobile-friendly notification pushed with the order sheet',
          'One-tap approve — order placed in IB via API',
        ],
      },
      {
        title: 'Macro Kill-Switch',
        owner: 'lori' as const,
        items: [
          'Binary gate: should we trade today?',
          'Inputs: VIX level, broad market overnight moves, sector stress',
          'If kill-switch is ON, no orders generated — "sit today out" message sent',
        ],
      },
      {
        title: 'Trust & Graduation',
        owner: 'both' as const,
        items: [
          'Every suggested order reviewed for first 2–4 weeks (supervised mode)',
          'Disagreements flagged — model learns from overrides',
          'Graduate to "approve all" once confidence established',
        ],
      },
    ],
    gate: {
      question: 'Are we comfortable approving orders without second-guessing each one?',
      criteria: [
        'Enough live trades (30+) with consistent results',
        'Override rate drops below 10%',
        'Monthly attribution report shows clear, positive value creation',
      ],
      killCondition: 'If override rate stays >50% after 4 weeks, the model needs more work — we return to Phase 1.',
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
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([0]))

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
          First: determine if limit order optimization is even feasible. Two sessions, one sprint. If the data supports it,
          we build. If not, we redirect to screening &amp; automation. Each phase has a gate — we don&apos;t advance until the evidence supports it.
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
            <span className="text-[10px] font-medium text-forest-ink ml-1.5">Feasibility assessment (2 sessions)</span>
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
                {phase.duration && (
                  <span className="font-mono text-[9px] sm:text-[8px] text-forest-ink-faint shrink-0">
                    {phase.duration}
                  </span>
                )}
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
          <p className="text-[11px] sm:text-[10px] text-forest-ink-muted leading-snug">
            Value = P&amp;L delta between flat 50% baseline and optimized limit orders. Computed per trade, auditable end-to-end, settled monthly. Performance-based comp: half of savings below 40% loss baseline.
          </p>
        </div>
      </div>

      {/* ── SOW Note ── */}
      <div className="bg-forest-cream border border-forest rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-1.5">
          Scope of Work — Compensation Note
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] text-forest-ink-muted leading-snug">
            <span className="font-medium text-forest-ink">Validation phase:</span> 1 sprint (two weeks), 2 sessions with Sean. Covered under the existing retainer — no additional pricing. Purpose: determine whether limit order optimization is feasible before committing to a multi-month build.
          </p>
          <p className="text-[10px] text-forest-ink-muted leading-snug">
            <span className="font-medium text-forest-ink">After feasibility is confirmed:</span> screener automation and limit order optimization proceed in parallel on separate compensation structures. Screener work continues under the retainer; optimization work transitions to the performance-based attribution model described above.
          </p>
        </div>
      </div>
    </div>
  )
}
