'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

// ─── Career Path Data ──────────────────────────────────────────────────

interface Milestone {
  id: string
  phase: string
  skill: string
  category: 'math' | 'code' | 'finance' | 'ml' | 'soft'
  target: string
  status: 'not_started' | 'in_progress' | 'complete'
  evidence?: string
}

const CAREER_PHASES = [
  {
    phase: 'Systematize',
    label: 'Months 1–3 · Automate What Works',
    comp: 'Current: Fund operator',
    role: 'Quant Developer → Systematic Strategist',
    description: 'You have 10x returns on 300+ positions via CQL. The job now is to turn discretionary alpha into a machine: IB paper trading, risk guardrails, audit trail. Learn by building, not by studying.',
  },
  {
    phase: 'Formalize',
    label: 'Months 3–8 · Prove It Statistically',
    comp: '$200–350k equivalent',
    role: 'Quant Researcher',
    description: 'Backfill the theory behind what already works. Compute Sharpe, decompose alpha sources, stress-test across regimes. Publish findings. The math serves the track record, not the other way around.',
  },
  {
    phase: 'Scale',
    label: 'Months 8–18 · Run Real Capital',
    comp: '$300–500k+',
    role: 'Portfolio Manager / Senior Quant',
    description: 'Go live supervised, then autonomous. Multi-strategy book across Armstrong + Blockless. Auditable track record is the credential — not a degree or cert.',
  },
]

const INITIAL_MILESTONES: Milestone[] = [
  // Phase 1: Systematize (Months 1-3)
  { id: 's-ib-paper', phase: 'Systematize', skill: 'IB Paper Trading — connect CQL signals to IB paper account', category: 'code', target: 'ib_insync Python + paper account running for 2 months', status: 'not_started' },
  { id: 's-pipeline', phase: 'Systematize', skill: 'Signal → Order pipeline — CQL output to IB order submission with risk checks', category: 'code', target: 'Automated: signal in → order out → fill logged', status: 'not_started' },
  { id: 's-risk-guard', phase: 'Systematize', skill: 'Risk guardrails — max position size, daily loss limit, correlation checks', category: 'finance', target: 'Hard limits that halt trading automatically', status: 'not_started' },
  { id: 's-audit', phase: 'Systematize', skill: 'Audit trail — every order logged with signal source, timestamp, fill quality', category: 'code', target: 'Database of every trade with full attribution', status: 'not_started' },
  { id: 's-greeks', phase: 'Systematize', skill: 'Greeks monitoring — live delta, gamma, theta, vega exposure across book', category: 'finance', target: 'Real-time portfolio Greeks dashboard', status: 'not_started' },
  { id: 's-cql-doc', phase: 'Systematize', skill: 'Document CQL strategy logic — what signals, what filters, what sizing', category: 'soft', target: 'Strategy spec that another quant could audit', status: 'in_progress' },
  { id: 's-reconcile', phase: 'Systematize', skill: 'Paper vs. live reconciliation — compare paper fills to what live would have been', category: 'code', target: '2 months of parallel tracking data', status: 'not_started' },
  { id: 's-anki-prob', phase: 'Systematize', skill: 'Anki: Probability & stochastic processes — reactivate actuarial/ME foundations', category: 'math', target: '200+ cards, 20 min/day. Focus on options-relevant: distributions, conditional expectation, martingales', status: 'not_started' },
  { id: 's-anki-la', phase: 'Systematize', skill: 'Anki: Linear algebra for portfolio math — PCA, covariance, eigendecomposition', category: 'math', target: '100+ cards. Apply directly to CQL correlation analysis', status: 'not_started' },

  // Phase 2: Formalize (Months 3-8)
  { id: 'f-sharpe', phase: 'Formalize', skill: 'Compute strategy Sharpe, Sortino, max drawdown, Calmar on historical CQL trades', category: 'math', target: 'Full tearsheet on 300+ position history', status: 'not_started' },
  { id: 'f-alpha-decomp', phase: 'Formalize', skill: 'Alpha decomposition — what % is timing, selection, sizing, vol?', category: 'math', target: 'Factor attribution (Brinson or regression-based)', status: 'not_started' },
  { id: 'f-regime', phase: 'Formalize', skill: 'Regime analysis — does CQL alpha persist in drawdowns, low vol, rate hikes?', category: 'ml', target: 'Hidden Markov or changepoint detection on strategy PnL', status: 'not_started' },
  { id: 'f-options', phase: 'Formalize', skill: 'Options Greeks deep-dive — vol surfaces, skew dynamics, term structure', category: 'finance', target: 'Natenberg + Anki deck. You know Black-Scholes — now apply to CQL spreads', status: 'not_started' },
  { id: 'f-sizing', phase: 'Formalize', skill: 'Position sizing formalization — Kelly criterion, risk parity, vol targeting', category: 'math', target: 'Replace intuitive sizing with optimal f', status: 'not_started' },
  { id: 'f-backtest', phase: 'Formalize', skill: 'Walk-forward backtest engine — out-of-sample validation, no lookahead bias', category: 'code', target: 'Prove CQL signals work out-of-sample', status: 'in_progress' },
  { id: 'f-deprado', phase: 'Formalize', skill: 'de Prado: Advances in Financial ML — triple barrier, meta-labeling, purged CV', category: 'ml', target: 'Apply 3+ techniques to CQL signal pipeline', status: 'not_started' },
  { id: 'f-anki-stoch', phase: 'Formalize', skill: 'Anki: Stochastic calculus for derivatives — Itô, Brownian motion, SDEs', category: 'math', target: 'Reactivate from actuarial foundations. 150+ cards, interview-ready', status: 'not_started' },
  { id: 'f-publish', phase: 'Formalize', skill: 'Publish 1 piece — SSRN paper, Substack deep-dive, or conference talk', category: 'soft', target: 'Written artifact with real data, not toy examples', status: 'not_started' },

  // Phase 3: Scale (Months 8-18)
  { id: 'l-supervised', phase: 'Scale', skill: 'Supervised live trading — IB live account, human approves each order for 1 month', category: 'finance', target: 'Live fills with <2% slippage vs paper', status: 'not_started' },
  { id: 'l-autonomous', phase: 'Scale', skill: 'Autonomous live trading — system runs with risk limits, human monitors only', category: 'code', target: 'Hands-off for 1+ month with alerts', status: 'not_started' },
  { id: 'l-multi', phase: 'Scale', skill: 'Multi-strategy — add 2nd strategy alongside CQL (mean reversion, momentum, vol arb)', category: 'ml', target: 'Uncorrelated alpha streams', status: 'not_started' },
  { id: 'l-track', phase: 'Scale', skill: 'Verified 12-month live track record with auditable PnL', category: 'finance', target: 'Sharpe > 1.5 on live capital', status: 'not_started' },
  { id: 'l-aum', phase: 'Scale', skill: 'Scale AUM — Armstrong + Blockless combined book > $1M', category: 'finance', target: 'Demonstrate capacity without alpha decay', status: 'not_started' },
  { id: 'l-network', phase: 'Scale', skill: 'Quant network — active in quant Twitter, QuantConnect, or local meetups', category: 'soft', target: '5+ quant relationships, 1+ collaboration', status: 'not_started' },
]

const CATEGORY_STYLE: Record<string, string> = {
  math: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  code: 'text-green-ink bg-green-bg border-green-ink/20',
  finance: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  ml: 'text-ink bg-cream border-rule',
  soft: 'text-ink-muted bg-cream border-rule',
}

const STATUS_STYLE: Record<string, string> = {
  not_started: 'text-ink-faint',
  in_progress: 'text-amber-ink',
  complete: 'text-green-ink',
}

export default function QuantPathView() {
  const { user } = useAuth()
  const [milestones, setMilestones] = useState<Milestone[]>(INITIAL_MILESTONES)
  const [expandedPhase, setExpandedPhase] = useState<string>('Foundation')

  // Persist to localStorage keyed by uid
  const storageKey = user?.uid ? `quant-milestones-${user.uid}` : null

  useEffect(() => {
    if (!storageKey) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Milestone[]
        // Merge saved status with current milestone definitions
        setMilestones(INITIAL_MILESTONES.map(m => {
          const s = parsed.find(p => p.id === m.id)
          return s ? { ...m, status: s.status, evidence: s.evidence } : m
        }))
      } catch { /* ignore corrupt data */ }
    }
  }, [storageKey])

  const persist = useCallback((updated: Milestone[]) => {
    setMilestones(updated)
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(updated.map(m => ({ id: m.id, status: m.status, evidence: m.evidence }))))
    }
  }, [storageKey])

  const cycleStatus = (id: string) => {
    const order: Milestone['status'][] = ['not_started', 'in_progress', 'complete']
    const updated = milestones.map(m => {
      if (m.id !== id) return m
      const next = order[(order.indexOf(m.status) + 1) % order.length]
      return { ...m, status: next }
    })
    persist(updated)
  }

  // Stats
  const total = milestones.length
  const complete = milestones.filter(m => m.status === 'complete').length
  const inProgress = milestones.filter(m => m.status === 'in_progress').length
  const pct = Math.round((complete / total) * 100)

  return (
    <div className="space-y-3 py-2">
      {/* Header */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Quant Path · Alpha-First Training
        </h3>
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          <strong>Background:</strong> Actuarial science + management engineering + CFA L1. Math foundations are there — reactivate via Anki, don&apos;t re-learn.
          <strong> Edge:</strong> 10x returns on 300+ positions via CQL. The path isn&apos;t &ldquo;study → find alpha.&rdquo;
          It&apos;s <strong>&ldquo;systematize alpha → formalize the math → scale capital.&rdquo;</strong>
          Armstrong + Blockless are the lab. IB automation is the vehicle. Anki is the accelerant.
        </p>
      </div>

      {/* Visual Timeline */}
      <div className="bg-white border border-rule rounded-sm p-3">
        {/* Phase timeline bar */}
        <div className="relative mb-3">
          <div className="flex items-center">
            {CAREER_PHASES.map((phase, i) => {
              const pm = milestones.filter(m => m.phase === phase.phase)
              const done = pm.filter(m => m.status === 'complete').length
              const prog = pm.filter(m => m.status === 'in_progress').length
              const phasePct = pm.length > 0 ? Math.round(((done + prog * 0.3) / pm.length) * 100) : 0
              const isActive = phasePct > 0 && phasePct < 100
              const isDone = phasePct === 100

              return (
                <div key={phase.phase} className="flex-1 flex flex-col items-center relative">
                  {/* Connector line */}
                  {i > 0 && (
                    <div className={`absolute top-3 right-1/2 w-full h-px ${
                      isDone || isActive ? 'bg-burgundy' : 'bg-rule'
                    }`} />
                  )}
                  {/* Node */}
                  <div className={`relative z-10 w-6 h-6 rounded-sm flex items-center justify-center text-[9px] font-mono font-semibold border ${
                    isDone
                      ? 'bg-green-ink text-paper border-green-ink'
                      : isActive
                        ? 'bg-burgundy text-paper border-burgundy'
                        : 'bg-cream text-ink-muted border-rule'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  {/* Label */}
                  <span className={`font-serif text-[8px] uppercase tracking-[0.3px] mt-1 text-center leading-tight ${
                    isActive ? 'text-burgundy font-semibold' : 'text-ink-muted'
                  }`}>
                    {phase.phase}
                  </span>
                  <span className="font-mono text-[7px] text-ink-faint mt-0.5">
                    {phase.label.split('·')[0].trim()}
                  </span>
                  {/* Phase progress */}
                  <div className="w-full mt-1.5 px-2">
                    <div className="h-1 bg-cream rounded-sm overflow-hidden">
                      <div
                        className={`h-full rounded-sm transition-all ${isDone ? 'bg-green-ink' : 'bg-burgundy'}`}
                        style={{ width: `${phasePct}%` }}
                      />
                    </div>
                    <div className="text-center font-mono text-[7px] text-ink-muted mt-0.5">
                      {done}/{pm.length}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Paper → Live roadmap */}
        <div className="border-t border-rule-light pt-2">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
            Paper → Live Roadmap
          </h4>
          <div className="flex gap-0.5">
            {[
              { label: 'Paper Only', months: 'Mo 1–2', color: 'bg-burgundy-bg border-burgundy/20 text-burgundy', width: '25%' },
              { label: 'Supervised', months: 'Mo 2–3', color: 'bg-amber-bg border-amber-ink/20 text-amber-ink', width: '25%' },
              { label: 'Scale Up', months: 'Mo 3–4', color: 'bg-green-bg border-green-ink/20 text-green-ink', width: '25%' },
              { label: 'Autonomous', months: 'Mo 4+', color: 'bg-green-bg border-green-ink/20 text-green-ink', width: '25%' },
            ].map(stage => (
              <div
                key={stage.label}
                className={`border rounded-sm px-1.5 py-1 text-center ${stage.color}`}
                style={{ width: stage.width }}
              >
                <div className="font-mono text-[8px] font-semibold">{stage.label}</div>
                <div className="font-mono text-[7px] opacity-70">{stage.months}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-0.5 mt-1">
            <p className="font-sans text-[7px] text-ink-muted leading-tight px-0.5">CQL → IB paper. Log fills.</p>
            <p className="font-sans text-[7px] text-ink-muted leading-tight px-0.5">10% size. Human approves.</p>
            <p className="font-sans text-[7px] text-ink-muted leading-tight px-0.5">50% if delta {'<'}2%.</p>
            <p className="font-sans text-[7px] text-ink-muted leading-tight px-0.5">Risk limits enforce.</p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="border-t border-rule-light pt-2 mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="font-sans text-[9px] text-ink-muted">Overall Milestone Progress</span>
            <span className="font-mono text-[10px] font-semibold text-ink">{pct}%</span>
          </div>
          <div className="h-1 bg-cream rounded-sm overflow-hidden">
            <div className="h-full bg-burgundy rounded-sm transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 mt-1">
            <span className="font-mono text-[8px] text-green-ink">{complete} complete</span>
            <span className="font-mono text-[8px] text-amber-ink">{inProgress} in progress</span>
            <span className="font-mono text-[8px] text-ink-faint">{total - complete - inProgress} remaining</span>
          </div>
        </div>
      </div>

      {/* Phase cards */}
      {CAREER_PHASES.map(phase => {
        const phaseMilestones = milestones.filter(m => m.phase === phase.phase)
        const phaseComplete = phaseMilestones.filter(m => m.status === 'complete').length
        const isExpanded = expandedPhase === phase.phase

        return (
          <div key={phase.phase} className="bg-white border border-rule rounded-sm">
            <button
              onClick={() => setExpandedPhase(isExpanded ? '' : phase.phase)}
              className="w-full p-2 text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    {phase.label}
                  </h4>
                  <p className="font-sans text-[9px] text-ink-muted mt-0.5">{phase.role} · {phase.comp}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-ink-muted">
                    {phaseComplete}/{phaseMilestones.length}
                  </span>
                  <span className="font-sans text-[10px] text-ink-faint">{isExpanded ? '▾' : '▸'}</span>
                </div>
              </div>
              <p className="font-sans text-[9px] text-ink-muted mt-1 leading-relaxed">{phase.description}</p>
            </button>

            {isExpanded && (
              <div className="border-t border-rule-light px-2 pb-2">
                {phaseMilestones.map(m => (
                  <button
                    key={m.id}
                    onClick={() => cycleStatus(m.id)}
                    className="w-full flex items-start gap-2 py-1.5 border-b border-rule-light last:border-0 text-left"
                  >
                    <span className={`font-mono text-[10px] mt-0.5 ${STATUS_STYLE[m.status]}`}>
                      {m.status === 'complete' ? '✓' : m.status === 'in_progress' ? '◐' : '○'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-sans text-[10px] text-ink leading-tight">{m.skill}</span>
                        <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${CATEGORY_STYLE[m.category]}`}>
                          {m.category}
                        </span>
                      </div>
                      <p className="font-sans text-[8px] text-ink-muted mt-0.5">{m.target}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Key resources */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Reading List — Ordered by When You Need It
        </h4>
        <div className="space-y-1">
          {[
            { title: 'Option Volatility & Pricing', author: 'Natenberg', tag: 'finance', phase: 'Now' },
            { title: 'Quantitative Trading', author: 'Chan', tag: 'code', phase: 'Now' },
            { title: 'Advances in Financial Machine Learning', author: 'de Prado', tag: 'ml', phase: 'Mo 3' },
            { title: 'Active Portfolio Management', author: 'Grinold & Kahn', tag: 'finance', phase: 'Mo 3' },
            { title: 'Dynamic Hedging', author: 'Taleb', tag: 'finance', phase: 'Mo 4' },
            { title: 'Stochastic Calculus for Finance II', author: 'Shreve', tag: 'math', phase: 'Mo 5' },
          ].map(book => (
            <div key={book.title} className="flex items-center gap-1.5">
              <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${CATEGORY_STYLE[book.tag]}`}>
                {book.tag}
              </span>
              <span className="font-sans text-[9px] text-ink">{book.title}</span>
              <span className="font-sans text-[8px] text-ink-muted">— {book.author}</span>
              <span className="font-mono text-[7px] text-ink-faint ml-auto">{book.phase}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
