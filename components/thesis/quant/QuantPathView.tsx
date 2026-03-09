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
    phase: 'Foundation',
    label: 'Year 0–1 · Build the Toolkit',
    comp: '$150–200k',
    role: 'Junior Quant Analyst / Quant Developer',
    description: 'Master the core quantitative toolkit. You already have fund experience — formalize the math and systems.',
  },
  {
    phase: 'Specialization',
    label: 'Year 1–2 · Deepen & Ship',
    comp: '$200–350k',
    role: 'Quant Researcher / Systematic Strategist',
    description: 'Develop proprietary signals and backtest infrastructure. Publish results. Build a track record.',
  },
  {
    phase: 'Authority',
    label: 'Year 2–4 · Compound',
    comp: '$300–500k+',
    role: 'Senior Quant / Portfolio Manager',
    description: 'Run capital. Manage risk at scale. Your alpha generation has a verified track record.',
  },
]

const INITIAL_MILESTONES: Milestone[] = [
  // Foundation — Math
  { id: 'f-prob', phase: 'Foundation', skill: 'Probability & Statistics (measure theory, distributions, hypothesis testing)', category: 'math', target: 'MIT OCW 18.650 or equivalent', status: 'not_started' },
  { id: 'f-la', phase: 'Foundation', skill: 'Linear Algebra (PCA, eigendecomposition, matrix calculus)', category: 'math', target: 'Applied to portfolio optimization', status: 'not_started' },
  { id: 'f-stoch', phase: 'Foundation', skill: 'Stochastic Calculus (Itô, Brownian motion, SDEs)', category: 'math', target: 'Shreve Vol I & II or self-study equivalent', status: 'not_started' },
  { id: 'f-opt', phase: 'Foundation', skill: 'Optimization (convex, LP, QP, gradient descent)', category: 'math', target: 'Boyd & Vandenberghe + portfolio applications', status: 'not_started' },

  // Foundation — Code
  { id: 'f-py', phase: 'Foundation', skill: 'Python (NumPy, pandas, scipy, statsmodels)', category: 'code', target: 'Build a backtesting engine from scratch', status: 'in_progress' },
  { id: 'f-sql', phase: 'Foundation', skill: 'SQL (time-series queries, window functions)', category: 'code', target: 'Query tick/OHLCV data fluently', status: 'not_started' },
  { id: 'f-cpp', phase: 'Foundation', skill: 'C++ basics (for latency-sensitive systems)', category: 'code', target: 'LeetCode medium + basic order book simulator', status: 'not_started' },

  // Foundation — Finance
  { id: 'f-deriv', phase: 'Foundation', skill: 'Derivatives & Pricing (Black-Scholes, Greeks, vol surfaces)', category: 'finance', target: 'Hull Ch 1-20 or Natenberg', status: 'not_started' },
  { id: 'f-micro', phase: 'Foundation', skill: 'Market Microstructure (order flow, spread, impact)', category: 'finance', target: "Harris 'Trading & Exchanges'", status: 'not_started' },
  { id: 'f-risk', phase: 'Foundation', skill: 'Risk Management (VaR, CVaR, drawdown, Kelly criterion)', category: 'finance', target: 'Applied to real portfolio', status: 'in_progress' },

  // Specialization — ML
  { id: 's-ts', phase: 'Specialization', skill: 'Time Series Models (ARIMA, GARCH, state-space, regime detection)', category: 'ml', target: 'Backtest 3+ signal models', status: 'not_started' },
  { id: 's-ml', phase: 'Specialization', skill: 'ML for Finance (random forests, gradient boosting, neural nets for alpha)', category: 'ml', target: 'de Prado "Advances in Financial ML"', status: 'not_started' },
  { id: 's-bay', phase: 'Specialization', skill: 'Bayesian Methods (MCMC, variational inference, priors as conviction)', category: 'ml', target: 'Apply to position sizing', status: 'not_started' },
  { id: 's-rl', phase: 'Specialization', skill: 'Reinforcement Learning for Trading (policy gradient, execution optimization)', category: 'ml', target: 'Paper + working prototype', status: 'in_progress' },

  // Specialization — Systems
  { id: 's-bt', phase: 'Specialization', skill: 'Backtesting Infrastructure (event-driven, walk-forward, cross-validation)', category: 'code', target: 'Production-grade engine with slippage/fees', status: 'in_progress' },
  { id: 's-data', phase: 'Specialization', skill: 'Alternative Data (NLP on filings, satellite, sentiment, flow)', category: 'code', target: 'Build 2+ alternative data pipelines', status: 'not_started' },
  { id: 's-exec', phase: 'Specialization', skill: 'Execution Systems (smart order routing, TWAP/VWAP, latency)', category: 'code', target: 'Live execution with broker API', status: 'not_started' },

  // Authority
  { id: 'a-pm', phase: 'Authority', skill: 'Portfolio Construction (mean-variance, risk parity, factor tilts)', category: 'finance', target: 'Manage real multi-strategy book', status: 'not_started' },
  { id: 'a-track', phase: 'Authority', skill: 'Verified Track Record (Sharpe > 1.5, 2+ year live or audited paper)', category: 'finance', target: 'Auditable PnL with attribution', status: 'not_started' },
  { id: 'a-pub', phase: 'Authority', skill: 'Published Research (arXiv, SSRN, or industry talks)', category: 'soft', target: '2+ papers or conference presentations', status: 'not_started' },
  { id: 'a-net', phase: 'Authority', skill: 'Network (fund managers, allocators, quant community)', category: 'soft', target: 'Active in QuantConnect / Quantopian alumni / Twitter quant', status: 'not_started' },
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
          Quant Career Path · $300–500k/yr
        </h3>
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          Systematic path from current fund work (Armstrong & Alamo Bernal) to senior quant roles.
          Three phases: <strong>Foundation</strong> (toolkit), <strong>Specialization</strong> (alpha + infrastructure),
          <strong>Authority</strong> (track record + capital).
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
          Core Reading List
        </h4>
        <div className="space-y-1">
          {[
            { title: 'Advances in Financial Machine Learning', author: 'de Prado', tag: 'ml' },
            { title: 'Stochastic Calculus for Finance II', author: 'Shreve', tag: 'math' },
            { title: 'Convex Optimization', author: 'Boyd & Vandenberghe', tag: 'math' },
            { title: 'Trading & Exchanges', author: 'Harris', tag: 'finance' },
            { title: 'Quantitative Trading', author: 'Chan', tag: 'code' },
            { title: 'Active Portfolio Management', author: 'Grinold & Kahn', tag: 'finance' },
          ].map(book => (
            <div key={book.title} className="flex items-center gap-1.5">
              <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${CATEGORY_STYLE[book.tag]}`}>
                {book.tag}
              </span>
              <span className="font-sans text-[9px] text-ink">{book.title}</span>
              <span className="font-sans text-[8px] text-ink-muted">— {book.author}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
