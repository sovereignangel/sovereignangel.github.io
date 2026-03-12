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
    phase: 'Build Portfolio',
    label: 'Months 1–3 · Research Projects + Math Foundations',
    comp: 'Target: Quant Developer roles',
    role: 'Self-directed → Quant Developer',
    description: 'Build 2–3 research projects with your APIs (Polygon, Benzinga, Alpha Vantage) that prove you can go from raw data to a validated signal. Reactivate math foundations via Anki — probability, linear algebra, stochastic processes. Your actuarial + ME background is the base.',
  },
  {
    phase: 'Formalize',
    label: 'Months 3–6 · Deepen Stats + Publish',
    comp: 'Target: Quant Analyst / Researcher roles',
    role: 'Quant Developer → Quant Researcher',
    description: 'Deepen statistics: hypothesis testing, time series, Bayesian inference. Publish 1–2 write-ups on your research findings (Substack/SSRN). Start grinding interview prep — Green Book, brainteasers, probability puzzles. The write-ups are your conversation starters.',
  },
  {
    phase: 'Get Hired',
    label: 'Months 6–12 · Interview + Network + Land Role',
    comp: 'Target: $150–300k+ total comp',
    role: 'Quant Researcher / Developer at a firm',
    description: 'Apply to mid-tier quant firms and fintech first, not Citadel/Jane Street. Lead with your research portfolio. Your full-stack engineering + actuarial math + research projects = differentiated candidate. Network via quant Twitter, QuantConnect, local meetups.',
  },
]

const INITIAL_MILESTONES: Milestone[] = [
  // Phase 1: Build Portfolio (Months 1-3)
  { id: 'bp-analyst', phase: 'Build Portfolio', skill: 'Analyst Alpha Decay Study — event study on Benzinga ratings + Polygon returns', category: 'code', target: 'Complete write-up with CAR analysis, analyst rankings, out-of-sample validation', status: 'not_started' },
  { id: 'bp-vol', phase: 'Build Portfolio', skill: 'Options Vol Surface Explorer — implied vol computation, 3D surface, skew analysis', category: 'finance', target: 'Working tool that pulls live chains, computes IV, visualizes surface', status: 'not_started' },
  { id: 'bp-micro', phase: 'Build Portfolio', skill: 'Order Flow Imbalance Signal — Lee-Ready classification, OFI, return prediction', category: 'code', target: 'Statistical test of OFI predictive power on short-term returns', status: 'not_started' },
  { id: 'bp-anki-prob', phase: 'Build Portfolio', skill: 'Anki: Probability — reactivate actuarial foundations (distributions, conditional expectation, martingales)', category: 'math', target: '200+ cards, 20 min/day', status: 'not_started' },
  { id: 'bp-anki-la', phase: 'Build Portfolio', skill: 'Anki: Linear algebra — PCA, covariance matrices, eigendecomposition', category: 'math', target: '100+ cards. Apply to portfolio correlation analysis', status: 'not_started' },
  { id: 'bp-python', phase: 'Build Portfolio', skill: 'Python proficiency — pandas, numpy, scipy, statsmodels at speed', category: 'code', target: 'Can wrangle financial data + run statistical tests fluently', status: 'not_started' },
  { id: 'bp-chan', phase: 'Build Portfolio', skill: 'Read: Quantitative Trading (Chan) — practical quant methodology', category: 'finance', target: 'Complete book, implement 2+ concepts in research projects', status: 'not_started' },

  // Phase 2: Formalize (Months 3-6)
  { id: 'f-stats', phase: 'Formalize', skill: 'Deep statistics — hypothesis testing, time series, regression, Bayesian inference', category: 'math', target: 'Work through DeGroot & Schervish or Casella & Berger', status: 'not_started' },
  { id: 'f-stoch', phase: 'Formalize', skill: 'Stochastic calculus — Itô, Brownian motion, SDEs (reactivate from actuarial)', category: 'math', target: 'Anki deck, 150+ cards. Interview-ready on derivatives math', status: 'not_started' },
  { id: 'f-natenberg', phase: 'Formalize', skill: 'Options deep-dive — Natenberg: vol surfaces, skew dynamics, Greeks sensitivities', category: 'finance', target: 'Can discuss vol trading strategies fluently', status: 'not_started' },
  { id: 'f-deprado', phase: 'Formalize', skill: 'de Prado: Advances in Financial ML — triple barrier, meta-labeling, purged CV', category: 'ml', target: 'Apply 3+ techniques to your research projects', status: 'not_started' },
  { id: 'f-publish-1', phase: 'Formalize', skill: 'Publish research write-up #1 — analyst alpha study on Substack or SSRN', category: 'soft', target: 'Written artifact with real data, charts, methodology', status: 'not_started' },
  { id: 'f-publish-2', phase: 'Formalize', skill: 'Publish research write-up #2 — vol surface or microstructure findings', category: 'soft', target: 'Second published piece showing depth', status: 'not_started' },
  { id: 'f-brainteasers', phase: 'Formalize', skill: 'Interview prep: Green Book + Heard on the Street + 50 Challenging Problems', category: 'math', target: 'Can solve probability brainteasers under time pressure', status: 'not_started' },
  { id: 'f-leetcode', phase: 'Formalize', skill: 'Coding interviews: LeetCode mediums + quant-flavored problems', category: 'code', target: '100+ problems solved, comfortable with timed coding', status: 'not_started' },

  // Phase 3: Get Hired (Months 6-12)
  { id: 'h-resume', phase: 'Get Hired', skill: 'Quant-optimized resume — lead with research projects, math background, engineering', category: 'soft', target: 'Resume reviewed by 2+ people in quant/finance', status: 'not_started' },
  { id: 'h-network', phase: 'Get Hired', skill: 'Quant network — active on quant Twitter, QuantConnect forums, local meetups', category: 'soft', target: '5+ quant relationships, 1+ warm intro to a firm', status: 'not_started' },
  { id: 'h-apply-mid', phase: 'Get Hired', skill: 'Apply to mid-tier quant firms and fintech (not Citadel/JS first)', category: 'soft', target: '20+ targeted applications with custom cover letters', status: 'not_started' },
  { id: 'h-mock', phase: 'Get Hired', skill: 'Mock interviews — probability, coding, and "walk me through your research"', category: 'soft', target: '5+ mock interviews with feedback', status: 'not_started' },
  { id: 'h-offer', phase: 'Get Hired', skill: 'Land a quant developer or quant analyst role', category: 'finance', target: 'Signed offer at a quant firm or fintech with quant team', status: 'not_started' },
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
          Quant Path · Get Hired
        </h3>
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          <strong>Background:</strong> 1 year actuarial science (WPI) + management engineering. Diff eq, calc sequence, probability, linear algebra.
          <strong> Assets:</strong> Polygon (stocks + options), Benzinga analyst ratings, Alpha Vantage Pro.
          <strong> Path:</strong> Build research portfolio → deepen math/stats → get hired as quant dev/analyst.
          Full-stack engineering + actuarial math + published research = <strong>differentiated candidate</strong>.
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

        {/* Hiring roadmap */}
        <div className="border-t border-rule-light pt-2">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
            Hiring Roadmap
          </h4>
          <div className="flex gap-0.5">
            {[
              { label: 'Build', months: 'Mo 1–3', color: 'bg-burgundy-bg border-burgundy/20 text-burgundy', width: '25%' },
              { label: 'Publish', months: 'Mo 3–5', color: 'bg-amber-bg border-amber-ink/20 text-amber-ink', width: '25%' },
              { label: 'Interview', months: 'Mo 5–8', color: 'bg-green-bg border-green-ink/20 text-green-ink', width: '25%' },
              { label: 'Hired', months: 'Mo 8–12', color: 'bg-green-bg border-green-ink/20 text-green-ink', width: '25%' },
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
            <p className="font-sans text-[7px] text-ink-muted leading-tight px-0.5">API research projects. Anki math.</p>
            <p className="font-sans text-[7px] text-ink-muted leading-tight px-0.5">Write-ups on findings. Deep stats.</p>
            <p className="font-sans text-[7px] text-ink-muted leading-tight px-0.5">Prep + apply to mid-tier firms.</p>
            <p className="font-sans text-[7px] text-ink-muted leading-tight px-0.5">Land quant dev/analyst role.</p>
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
            { title: 'Quantitative Trading', author: 'Chan', tag: 'code', phase: 'Now' },
            { title: 'Option Volatility & Pricing', author: 'Natenberg', tag: 'finance', phase: 'Now' },
            { title: 'Heard on the Street', author: 'Crack', tag: 'math', phase: 'Mo 2' },
            { title: '50 Challenging Problems in Probability', author: 'Mosteller', tag: 'math', phase: 'Mo 2' },
            { title: 'Advances in Financial Machine Learning', author: 'de Prado', tag: 'ml', phase: 'Mo 3' },
            { title: 'Probability & Statistics', author: 'DeGroot & Schervish', tag: 'math', phase: 'Mo 3' },
            { title: 'Stochastic Calculus for Finance II', author: 'Shreve', tag: 'math', phase: 'Mo 4' },
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
