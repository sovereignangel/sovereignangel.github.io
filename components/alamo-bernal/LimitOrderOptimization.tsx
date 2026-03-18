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
        title: 'Pre-Work',
        owner: 'sean' as const,
        items: [
          'Lori creates Alpha Vantage + Massive accounts and shares credentials',
          'Sean logs in and adds payment method / subscribes',
          'Accounts active before Session 1 so we can pull live data together',
          'Sean creates a lori@alamobernal.com account to open a paper trading account with Interactive Brokers — used to test the optimization engine before any real capital is at risk',
          'Sean exports trade history from Fidelity (CSV or broker report) — entry/exit prices, dates, tickers, dividend amounts',
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

/* ────────────────────────────────────────────────────────────────
   6-Month Trial Economics — Visual ROI analysis
   ──────────────────────────────────────────────────────────────── */

const BASELINE = {
  avgMonthlyDividends: 75467,
  currentLossRate: 50.8,
  compThreshold: 40,
  flatFee: 1000,
  revenueShare: 0.5,
  buildHours: 90,
  maintenanceHoursPerMonth: 5,
}

const SCENARIOS = [
  { label: 'Flat fee only', lossRate: 42, color: 'bg-forest-ink-faint', barColor: 'bg-forest-ink-faint' },
  { label: 'Conservative', lossRate: 38, color: 'bg-amber-ink', barColor: 'bg-amber-ink' },
  { label: 'Moderate', lossRate: 35, color: 'bg-forest', barColor: 'bg-forest' },
  { label: 'Optimistic', lossRate: 30, color: 'bg-green-ink', barColor: 'bg-green-ink' },
  { label: 'Best case', lossRate: 25, color: 'bg-green-ink', barColor: 'bg-green-ink' },
]

// Sean's actual monthly performance data
const HISTORICAL_MONTHS = [
  { month: 'Dec', dividends: 83200, lossPercent: 59.7, lost: 49670, kept: 33530 },
  { month: 'Jan', dividends: 66500, lossPercent: 45.0, lost: 29925, kept: 36575 },
  { month: 'Feb', dividends: 76700, lossPercent: 47.6, lost: 36511, kept: 40189 },
]

function computeMonthScenario(dividends: number, targetLossRate: number) {
  const { compThreshold, flatFee, revenueShare } = BASELINE
  const savingsVsThreshold = Math.max(0, (compThreshold - targetLossRate) / 100 * dividends)
  const performanceCut = savingsVsThreshold * revenueShare
  return flatFee + performanceCut
}

const TIMELINE = [
  { week: '1–2', label: 'Data backfill + baseline audit', phase: 'Build' },
  { week: '3–4', label: 'Backtester + paper account mirror', phase: 'Build' },
  { week: '5–8', label: 'Strategy tournament + paper test top 3', phase: 'Test' },
  { week: '9–10', label: 'Winning strategy on paper + dashboard', phase: 'Test' },
  { week: '11–12', label: 'Full validation + audit report', phase: 'Prove' },
  { week: '13–16', label: 'Live supervised trading + refinement', phase: 'Live' },
  { week: '17–20', label: 'Steady-state operation + monthly reporting', phase: 'Live' },
  { week: '21–24', label: 'Performance review + engagement decision', phase: 'Review' },
]

function computeScenario(lossRate: number) {
  const { avgMonthlyDividends, compThreshold, flatFee, revenueShare } = BASELINE
  const savingsVsThreshold = Math.max(0, (compThreshold - lossRate) / 100 * avgMonthlyDividends)
  const performanceCut = savingsVsThreshold * revenueShare
  const monthly = flatFee + performanceCut
  const sixMonthTotal = monthly * 6
  const totalHours = BASELINE.buildHours + (BASELINE.maintenanceHoursPerMonth * 3) // 3 months maintenance after 3 months build
  const effectiveHourly = sixMonthTotal / totalHours
  return { savingsVsThreshold, performanceCut, monthly, sixMonthTotal, effectiveHourly }
}

export function TrialEconomics() {
  // Compute max bar value across all months & scenarios for consistent scale
  const allMonthScenarioValues = HISTORICAL_MONTHS.flatMap((m) =>
    SCENARIOS.map((s) => computeMonthScenario(m.dividends, s.lossRate))
  )
  const maxBar = Math.max(...allMonthScenarioValues)

  // 6-month projections using average
  const avgDiv = HISTORICAL_MONTHS.reduce((sum, m) => sum + m.dividends, 0) / HISTORICAL_MONTHS.length

  return (
    <div className="space-y-3">
      <div className="bg-forest-surface border-2 border-forest rounded-sm p-3 space-y-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-1">
          6-Month Engagement Economics
        </div>

        {/* ── Gotta Believes ── */}
        <div className="bg-forest-cream border border-forest rounded-sm p-2">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-1.5">
            Gotta Believes
          </div>
          <p className="text-[10px] text-forest-ink-muted leading-snug mb-1.5">
            For this engagement to generate meaningful performance comp, two things must be true:
          </p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-forest font-semibold shrink-0 mt-px">1.</span>
              <div>
                <span className="text-[10px] font-medium text-forest-ink">Execution slippage is &gt;10% of the total loss.</span>
                <p className="text-[10px] text-forest-ink-muted leading-snug mt-0.5">
                  Stocks drop ~85–100% of the dividend on ex-div day (structural, unavoidable). If Sean&apos;s ~50% loss is mostly structural, the optimizable window is tiny. But if 10–15% is execution slippage — bad fills, wrong order types, poor timing — that&apos;s our target.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-forest font-semibold shrink-0 mt-px">2.</span>
              <div>
                <span className="text-[10px] font-medium text-forest-ink">We can systematically reduce that slippage with better limit order structures.</span>
                <p className="text-[10px] text-forest-ink-muted leading-snug mt-0.5">
                  Different order types (pegged, adaptive, VWAP), better entry/exit timing, and per-stock configs must produce measurably better fills than flat 50% limits across enough trades to matter.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-forest-rule">
            <span className="text-[10px] font-medium text-forest-ink">How we find out:</span>
            <span className="text-[10px] text-forest-ink-muted"> Month 1 learning sprint — 1 IB paper account + local backtester. Answers both questions before any real commitment.</span>
          </div>
        </div>

        {/* ── Month 1 — Execution Audit ── */}
        <div className="bg-white border border-forest-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-1.5 pb-1 border-b border-forest-rule">
            Month 1 — Execution Audit
          </div>
          <p className="text-[10px] text-forest-ink-muted leading-snug mb-2">
            Before building optimization infrastructure, we audit Sean&apos;s actual execution to quantify how much loss is structural (market mechanics)
            vs execution slippage (order type, timing, fill quality). This research has standalone value — Sean gets a detailed breakdown of where his money goes,
            regardless of whether we proceed to optimization.
          </p>

          {/* ── Two Pricing Options ── */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-forest-surface border-2 border-forest rounded-sm p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-semibold text-forest uppercase">Option A</span>
                <span className="font-mono text-[12px] font-semibold text-forest-ink">$2K</span>
              </div>
              <div className="text-[10px] font-medium text-forest-ink mb-1">Audit + Tech Build</div>
              <div className="space-y-0.5">
                {[
                  'Full execution audit (structural vs slippage)',
                  'Backtester built + 500+ strategy permutations',
                  'IB paper account running top 3 strategies',
                  'Detailed report with per-trade evidence',
                  'Optimization tooling ready for Month 2 if go',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[8px] text-forest mt-0.5 shrink-0">&#x2022;</span>
                    <span className="text-[10px] text-forest-ink-muted leading-snug">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-forest-rule">
                <span className="text-[10px] text-forest-ink-muted">Faster path to live optimization — tech is ready on day 30</span>
              </div>
            </div>
            <div className="bg-forest-surface border border-forest-rule rounded-sm p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-semibold text-forest-ink-muted uppercase">Option B</span>
                <span className="font-mono text-[12px] font-semibold text-forest-ink">$1K</span>
              </div>
              <div className="text-[10px] font-medium text-forest-ink mb-1">Feasibility Audit Only</div>
              <div className="space-y-0.5">
                {[
                  'Full execution audit (structural vs slippage)',
                  'Analysis of Sean\'s trade history + intraday data',
                  'Report: where the money goes, what\'s optimizable',
                  'Go/no-go recommendation with evidence',
                  'If go: tech build starts Month 2 (adds 1 month)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[8px] text-forest-ink-faint mt-0.5 shrink-0">&#x2022;</span>
                    <span className="text-[10px] text-forest-ink-muted leading-snug">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-forest-rule">
                <span className="text-[10px] text-forest-ink-muted">Lower risk — Sean pays for the research either way, gets value regardless</span>
              </div>
            </div>
          </div>

          {/* ── What the Audit Covers ── */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-forest-surface border border-forest-rule rounded-sm p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-mono text-[9px] font-semibold text-forest uppercase">Backtester</span>
                <span className="text-[9px] text-forest-ink-muted">(where the volume is)</span>
              </div>
              <div className="space-y-0.5">
                {[
                  'Pull 1-min bars around 200+ historical ex-div dates',
                  'Simulate fills: LMT at mid vs REL vs ADAPTIVE vs VWAP',
                  'Compute actual vs optimal fill price per trade',
                  'Answer: how much slippage is structural vs execution?',
                  'Run 500+ strategy permutations overnight',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[8px] text-forest-ink-faint mt-0.5 shrink-0">&#x2022;</span>
                    <span className="text-[10px] text-forest-ink-muted leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-forest-surface border border-forest-rule rounded-sm p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-mono text-[9px] font-semibold text-forest uppercase">IB Paper Account</span>
                <span className="text-[9px] text-forest-ink-muted">(validates reality)</span>
              </div>
              <div className="space-y-0.5">
                {[
                  '~20–30 live ex-div events in one month',
                  'Mirror Sean\'s current approach first (baseline)',
                  'Then run top 3 strategies from backtest',
                  'Compare: does paper match backtest predictions?',
                  'Log every fill, NBBO, slippage, time-to-fill',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[8px] text-forest-ink-faint mt-0.5 shrink-0">&#x2022;</span>
                    <span className="text-[10px] text-forest-ink-muted leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Month 1 Deliverable ── */}
          <div className="bg-forest-cream border border-forest rounded-sm p-2">
            <div className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-forest mb-1">
              Month 1 Deliverable
            </div>
            <p className="text-[10px] text-forest-ink-muted leading-snug">
              &ldquo;Sean&apos;s current strategy captures X% of dividends. Y% of the loss is structural (stock drop), Z% is execution slippage.
              Our best strategy recovered W% of that slippage in backtests and V% on paper. Here&apos;s the evidence across N trades.&rdquo;
            </p>
            <div className="flex gap-3 mt-1.5 pt-1.5 border-t border-forest-rule">
              <div>
                <span className="text-[10px] font-medium text-forest-ink uppercase tracking-wide">If slippage &gt;10%</span>
                <span className="text-[10px] font-medium text-green-ink ml-1.5">Proceed to optimization</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-forest-ink uppercase tracking-wide">If slippage &lt;5%</span>
                <span className="text-[10px] font-medium text-red-ink ml-1.5">Stop — audit was still worth it</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Historical Baseline ── */}
        <div>
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1 border-b border-forest-rule">
            Sean&apos;s Actual Performance (Last 3 Months)
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {HISTORICAL_MONTHS.map((m) => (
              <div key={m.month} className="bg-white border border-forest-rule rounded-sm p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-serif text-[11px] font-semibold text-forest-ink">{m.month}</span>
                  <span className="font-mono text-[9px] text-red-ink font-medium">{m.lossPercent}% lost</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-forest-ink-muted">Dividends</span>
                    <span className="font-mono text-[10px] text-forest-ink">${(m.dividends / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-forest-ink-muted">Lost on sales</span>
                    <span className="font-mono text-[10px] text-red-ink">-${(m.lost / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex justify-between pt-0.5 border-t border-forest-rule">
                    <span className="text-[10px] text-forest-ink-muted">Kept</span>
                    <span className="font-mono text-[10px] font-medium text-green-ink">${(m.kept / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-forest-rule rounded-sm p-2 text-center">
              <div className="font-mono text-[14px] font-semibold text-forest-ink">
                ${(avgDiv / 1000).toFixed(0)}K
              </div>
              <div className="text-[10px] text-forest-ink-muted uppercase tracking-wide">Avg Monthly Div</div>
            </div>
            <div className="bg-white border border-forest-rule rounded-sm p-2 text-center">
              <div className="font-mono text-[14px] font-semibold text-red-ink">
                {BASELINE.currentLossRate}%
              </div>
              <div className="text-[10px] text-forest-ink-muted uppercase tracking-wide">Avg Loss Rate</div>
            </div>
            <div className="bg-white border border-forest-rule rounded-sm p-2 text-center">
              <div className="font-mono text-[14px] font-semibold text-forest">
                {BASELINE.compThreshold}%
              </div>
              <div className="text-[10px] text-forest-ink-muted uppercase tracking-wide">Comp Threshold</div>
            </div>
          </div>
        </div>

        {/* ── Month-by-Month Scenario Comparison ── */}
        <div>
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1 border-b border-forest-rule">
            What I Would Have Earned — By Month
          </div>
          <p className="text-[10px] text-forest-ink-muted leading-snug mb-2">
            Applied to Sean&apos;s actual dividend volume per month. Comp = $1K flat + 50% of savings below {BASELINE.compThreshold}% loss.
          </p>

          {HISTORICAL_MONTHS.map((m) => (
            <div key={m.month} className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-serif text-[11px] font-semibold text-forest-ink">{m.month}</span>
                <span className="font-mono text-[9px] text-forest-ink-muted">
                  ${(m.dividends / 1000).toFixed(1)}K div &middot; {m.lossPercent}% actual loss
                </span>
              </div>
              <div className="space-y-1">
                {SCENARIOS.map((s) => {
                  const income = computeMonthScenario(m.dividends, s.lossRate)
                  const barWidth = Math.max(8, (income / maxBar) * 100)
                  const isBelowThreshold = s.lossRate < BASELINE.compThreshold
                  return (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className="w-[44px] shrink-0 text-right">
                        <span className="font-mono text-[10px] font-medium text-forest-ink">{s.lossRate}%</span>
                      </div>
                      <div className="flex-1 relative h-[16px] bg-forest-cream rounded-sm overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 ${isBelowThreshold ? s.barColor : 'bg-forest-ink-faint'} opacity-70`}
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="absolute inset-0 flex items-center px-1.5">
                          <span className="font-mono text-[9px] font-semibold text-white drop-shadow-sm">
                            ${income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                      <div className="w-[72px] shrink-0">
                        <span className="text-[9px] text-forest-ink-muted">{s.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-forest-ink-faint opacity-70 rounded-sm" />
              <span className="text-[8px] text-forest-ink-faint">Flat fee only (above {BASELINE.compThreshold}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-forest opacity-70 rounded-sm" />
              <span className="text-[8px] text-forest-ink-faint">Flat + performance comp (below {BASELINE.compThreshold}%)</span>
            </div>
          </div>
        </div>

        {/* ── 6-Month Projections ── */}
        <div>
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1 border-b border-forest-rule">
            6-Month Projected Totals
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {SCENARIOS.map((s) => {
              const { sixMonthTotal, effectiveHourly } = computeScenario(s.lossRate)
              return (
                <div key={s.label} className="bg-white border border-forest-rule rounded-sm p-2 text-center">
                  <div className="font-mono text-[12px] font-semibold text-forest-ink">
                    ${(sixMonthTotal / 1000).toFixed(1)}K
                  </div>
                  <div className="text-[8px] text-forest-ink-faint uppercase tracking-wide mb-1">{s.label}</div>
                  <div className="text-[9px] text-forest-ink-muted">
                    ~${Math.round(effectiveHourly)}/hr
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Hourly Rate Comparison ── */}
        <div>
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1 border-b border-forest-rule">
            Effective Hourly Rate by Phase
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-forest-rule rounded-sm p-2">
              <div className="text-[9px] text-forest-ink-faint uppercase tracking-wide mb-1">Build (Mo 1–3)</div>
              <div className="text-[10px] text-forest-ink-muted leading-snug">~{BASELINE.buildHours} hrs total</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono text-[12px] font-semibold text-forest-ink">$11–74</span>
                <span className="text-[9px] text-forest-ink-faint">/hr</span>
              </div>
            </div>
            <div className="bg-white border border-forest-rule rounded-sm p-2">
              <div className="text-[9px] text-forest-ink-faint uppercase tracking-wide mb-1">Maintenance (Mo 4–6)</div>
              <div className="text-[10px] text-forest-ink-muted leading-snug">~{BASELINE.maintenanceHoursPerMonth} hrs/mo</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono text-[12px] font-semibold text-amber-ink">$200–1,325</span>
                <span className="text-[9px] text-forest-ink-faint">/hr</span>
              </div>
            </div>
            <div className="bg-white border border-forest-rule rounded-sm p-2">
              <div className="text-[9px] text-forest-ink-faint uppercase tracking-wide mb-1">Blended (6 Mo)</div>
              <div className="text-[10px] text-forest-ink-muted leading-snug">~{BASELINE.buildHours + BASELINE.maintenanceHoursPerMonth * 3} hrs total</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-mono text-[12px] font-semibold text-green-ink">$57–379</span>
                <span className="text-[9px] text-forest-ink-faint">/hr</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 24-Week Timeline ── */}
      <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1 border-b border-forest-rule">
          24-Week Engagement Timeline
        </div>
        <div className="relative">
          {TIMELINE.map((t, i) => {
            const phaseColor = t.phase === 'Build'
              ? 'bg-forest-ink-faint text-forest-ink'
              : t.phase === 'Test'
                ? 'bg-amber-ink/15 text-amber-ink'
                : t.phase === 'Live'
                  ? 'bg-green-ink/15 text-green-ink'
                  : 'bg-forest/15 text-forest'
            return (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center w-3 shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-0.5 ${
                    t.phase === 'Build' ? 'bg-forest-ink-faint'
                      : t.phase === 'Test' ? 'bg-amber-ink'
                        : t.phase === 'Live' ? 'bg-green-ink'
                          : 'bg-forest'
                  }`} />
                  {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-forest-rule mt-0.5" />}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-mono text-[10px] font-medium text-forest-ink w-[40px] shrink-0">W{t.week}</span>
                  <span className="text-[10px] text-forest-ink-muted leading-snug flex-1">{t.label}</span>
                  <span className={`font-mono text-[8px] uppercase px-1 py-px rounded-sm shrink-0 ${phaseColor}`}>
                    {t.phase}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-3 mt-2 pt-1.5 border-t border-forest-rule">
          {['Build', 'Test', 'Live', 'Review'].map((phase) => {
            const dotColor = phase === 'Build' ? 'bg-forest-ink-faint'
              : phase === 'Test' ? 'bg-amber-ink'
                : phase === 'Live' ? 'bg-green-ink'
                  : 'bg-forest'
            return (
              <div key={phase} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                <span className="text-[8px] text-forest-ink-faint">{phase}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Pre-Commit Checklist ── */}
      <div className="bg-forest-cream border border-forest rounded-sm p-2">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest mb-1">
          Before Committing Build Time
        </div>
        <div className="space-y-1">
          {[
            '6-month minimum commitment from Sean',
            'Access to last 12 months of trade data (entry/exit fills)',
            'Baseline audit (5–10 hrs) to estimate structural floor before agreeing to 40% threshold',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[9px] text-forest mt-0.5 shrink-0">&#x25A2;</span>
              <span className="text-[10px] text-forest-ink-muted leading-snug">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-forest-ink-muted leading-snug mt-1.5 pt-1.5 border-t border-forest-rule">
          <span className="font-medium text-forest-ink">Critical insight:</span> If the structural loss floor is ~38%, the performance comp is nearly worthless. If it&apos;s ~30%, this is a high-value engagement. The baseline audit answers this question before any infrastructure is built.
        </p>
      </div>
    </div>
  )
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
