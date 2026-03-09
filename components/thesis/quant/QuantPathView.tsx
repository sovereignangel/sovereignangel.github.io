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

  // Phase 2: Formalize (Months 3-8)
  { id: 'f-sharpe', phase: 'Formalize', skill: 'Compute strategy Sharpe, Sortino, max drawdown, Calmar on historical CQL trades', category: 'math', target: 'Full tearsheet on 300+ position history', status: 'not_started' },
  { id: 'f-alpha-decomp', phase: 'Formalize', skill: 'Alpha decomposition — what % is timing, selection, sizing, vol?', category: 'math', target: 'Factor attribution (Brinson or regression-based)', status: 'not_started' },
  { id: 'f-regime', phase: 'Formalize', skill: 'Regime analysis — does CQL alpha persist in drawdowns, low vol, rate hikes?', category: 'ml', target: 'Hidden Markov or changepoint detection on strategy PnL', status: 'not_started' },
  { id: 'f-options', phase: 'Formalize', skill: 'Options pricing theory — Black-Scholes, vol surfaces, skew dynamics', category: 'finance', target: 'Natenberg + apply to CQL call spread logic', status: 'not_started' },
  { id: 'f-sizing', phase: 'Formalize', skill: 'Position sizing formalization — Kelly criterion, risk parity, vol targeting', category: 'math', target: 'Replace intuitive sizing with optimal f', status: 'not_started' },
  { id: 'f-backtest', phase: 'Formalize', skill: 'Walk-forward backtest engine — out-of-sample validation, no lookahead bias', category: 'code', target: 'Prove CQL signals work out-of-sample', status: 'in_progress' },
  { id: 'f-deprado', phase: 'Formalize', skill: 'de Prado: Advances in Financial ML — triple barrier, meta-labeling, purged CV', category: 'ml', target: 'Apply 3+ techniques to CQL signal pipeline', status: 'not_started' },
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
          You have what most quants spend years chasing: <strong>10x returns on 300+ positions via CQL</strong>.
          The path isn&apos;t &ldquo;study → find alpha.&rdquo; It&apos;s <strong>&ldquo;systematize alpha → formalize the math → scale capital.&rdquo;</strong>
          Armstrong + Blockless are the lab. IB automation is the vehicle.
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="font-sans text-[10px] text-ink-muted">Overall Progress</span>
          <span className="font-mono text-[11px] font-semibold text-ink">{pct}%</span>
        </div>
        <div className="h-1.5 bg-cream rounded-sm overflow-hidden">
          <div className="h-full bg-burgundy rounded-sm transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-3 mt-1.5">
          <span className="font-mono text-[9px] text-green-ink">{complete} complete</span>
          <span className="font-mono text-[9px] text-amber-ink">{inProgress} in progress</span>
          <span className="font-mono text-[9px] text-ink-faint">{total - complete - inProgress} remaining</span>
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
            { title: 'Trading & Exchanges', author: 'Harris', tag: 'finance', phase: 'Mo 6' },
            { title: 'Convex Optimization', author: 'Boyd & Vandenberghe', tag: 'math', phase: 'Mo 6' },
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

      {/* Paper trading timeline */}
      <div className="bg-cream border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Paper → Live Timeline
        </h4>
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <span className="font-mono text-[9px] text-burgundy w-14 shrink-0">Mo 1–2</span>
            <span className="font-sans text-[9px] text-ink">Paper trading only. CQL signals → IB paper. Log every fill, compare to what manual execution got.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-mono text-[9px] text-amber-ink w-14 shrink-0">Mo 2–3</span>
            <span className="font-sans text-[9px] text-ink">Supervised live. Small size (10% of target). Human approves each order. Paper continues in parallel.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-mono text-[9px] text-green-ink w-14 shrink-0">Mo 3–4</span>
            <span className="font-sans text-[9px] text-ink">Scale up if paper-live delta is {'<'}2%. Increase to 50% size. Automated with human monitoring.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-mono text-[9px] text-green-ink w-14 shrink-0">Mo 4+</span>
            <span className="font-sans text-[9px] text-ink">Full autonomous. Risk limits enforce discipline. You focus on signal research, not execution.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
