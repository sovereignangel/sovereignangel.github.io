'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

// ─── Research Project Tracker ────────────────────────────────────────
// Each project = a portfolio piece for quant firm interviews.
// Built with: Polygon (stocks/options), Benzinga (analyst ratings), Alpha Vantage (fundamentals/macro).

interface ResearchProject {
  id: string
  title: string
  description: string
  apis: string[]
  skills: string[]
  hiringSignal: string
  phases: ProjectPhase[]
  findings: string
}

interface ProjectPhase {
  id: string
  label: string
  status: 'not_started' | 'in_progress' | 'complete'
}

const CATEGORY_STYLE: Record<string, string> = {
  'polygon': 'text-burgundy bg-burgundy-bg border-burgundy/20',
  'benzinga': 'text-green-ink bg-green-bg border-green-ink/20',
  'alpha-vantage': 'text-amber-ink bg-amber-bg border-amber-ink/20',
  'computed': 'text-ink bg-cream border-rule',
}

const SKILL_STYLE: Record<string, string> = {
  'event-study': 'text-burgundy bg-burgundy-bg border-burgundy/20',
  'statistics': 'text-burgundy bg-burgundy-bg border-burgundy/20',
  'options': 'text-amber-ink bg-amber-bg border-amber-ink/20',
  'derivatives': 'text-amber-ink bg-amber-bg border-amber-ink/20',
  'microstructure': 'text-green-ink bg-green-bg border-green-ink/20',
  'ml': 'text-ink bg-cream border-rule',
  'time-series': 'text-ink bg-cream border-rule',
  'systems': 'text-green-ink bg-green-bg border-green-ink/20',
  'visualization': 'text-ink-muted bg-cream border-rule',
  'factor-models': 'text-burgundy bg-burgundy-bg border-burgundy/20',
  'regime-detection': 'text-amber-ink bg-amber-bg border-amber-ink/20',
}

const STATUS_ICON: Record<string, string> = {
  not_started: '○',
  in_progress: '◐',
  complete: '✓',
}

const STATUS_COLOR: Record<string, string> = {
  not_started: 'text-ink-faint',
  in_progress: 'text-amber-ink',
  complete: 'text-green-ink',
}

const RESEARCH_PROJECTS: ResearchProject[] = [
  {
    id: 'analyst-alpha',
    title: 'Analyst Alpha Decay Study',
    description: 'Track every Benzinga analyst rating change, measure forward returns at 1d/5d/30d/90d. Event study methodology with proper out-of-sample testing.',
    apis: ['benzinga', 'polygon'],
    skills: ['event-study', 'statistics'],
    hiringSignal: 'Shows you understand statistical rigor, event studies, and can go from raw data to a validated signal. This is what research interviews probe for.',
    phases: [
      { id: 'aa-ingest', label: 'Ingest Benzinga ratings → local DB', status: 'not_started' },
      { id: 'aa-prices', label: 'Pull forward returns from Polygon for each event', status: 'not_started' },
      { id: 'aa-event', label: 'Event study: compute CAR (cumulative abnormal return) windows', status: 'not_started' },
      { id: 'aa-analyst', label: 'Rank analysts by hit rate, information coefficient', status: 'not_started' },
      { id: 'aa-oos', label: 'Out-of-sample validation: train/test split by date', status: 'not_started' },
      { id: 'aa-decay', label: 'Alpha decay curve: how fast does the signal fade?', status: 'not_started' },
      { id: 'aa-writeup', label: 'Write-up with charts, methodology, and conclusions', status: 'not_started' },
    ],
    findings: '',
  },
  {
    id: 'vol-surface',
    title: 'Options Volatility Surface Explorer',
    description: 'Pull full options chains from Polygon, compute implied vol across strikes/expirations, visualize the surface. Study skew dynamics and term structure.',
    apis: ['polygon'],
    skills: ['options', 'derivatives', 'visualization'],
    hiringSignal: 'Derivatives desks care about vol surfaces more than anything. Building your own is how traders learn — and it shows you understand options beyond Black-Scholes.',
    phases: [
      { id: 'vs-chain', label: 'Fetch live options chains from Polygon', status: 'not_started' },
      { id: 'vs-iv', label: 'Compute implied vol via Newton-Raphson on BSM', status: 'not_started' },
      { id: 'vs-surface', label: 'Build 3D vol surface (strike × expiry × IV)', status: 'not_started' },
      { id: 'vs-skew', label: 'Analyze skew: why is OTM put vol higher?', status: 'not_started' },
      { id: 'vs-term', label: 'Term structure: how does vol change across expirations?', status: 'not_started' },
      { id: 'vs-historical', label: 'Historical comparison: current surface vs. 30d/90d ago', status: 'not_started' },
      { id: 'vs-anomaly', label: 'Flag mispricings: IV vs realized vol divergence', status: 'not_started' },
    ],
    findings: '',
  },
  {
    id: 'microstructure',
    title: 'Order Flow Imbalance Signal',
    description: 'Use Polygon tick data to classify trades as buyer/seller-initiated (Lee-Ready), compute imbalance metrics, test if it predicts short-term returns.',
    apis: ['polygon'],
    skills: ['microstructure', 'systems', 'statistics'],
    hiringSignal: 'This is literally what market-making desks do. Understanding order flow is the foundation of HFT and systematic MM — shows you can think at the microstructure level.',
    phases: [
      { id: 'ms-tick', label: 'Stream tick-level trade data from Polygon', status: 'not_started' },
      { id: 'ms-classify', label: 'Implement Lee-Ready trade classification', status: 'not_started' },
      { id: 'ms-ofi', label: 'Compute Order Flow Imbalance (OFI) metric', status: 'not_started' },
      { id: 'ms-vpin', label: 'Implement VPIN (Volume-Synchronized PIN)', status: 'not_started' },
      { id: 'ms-predict', label: 'Test: does OFI predict 1-min/5-min returns?', status: 'not_started' },
      { id: 'ms-regime', label: 'Does signal strength vary by vol regime?', status: 'not_started' },
      { id: 'ms-writeup', label: 'Write-up with statistical tests and findings', status: 'not_started' },
    ],
    findings: '',
  },
  {
    id: 'macro-regime',
    title: 'Macro Regime Detector',
    description: 'Ingest economic indicators from Alpha Vantage (yield curve, CPI, PMI), classify market regimes, backtest regime-aware strategies against Polygon price data.',
    apis: ['alpha-vantage', 'polygon'],
    skills: ['regime-detection', 'ml', 'time-series', 'factor-models'],
    hiringSignal: 'Multi-asset quant funds care deeply about regime awareness. Shows you can combine macro data with price data and think about conditional strategies.',
    phases: [
      { id: 'mr-macro', label: 'Ingest macro indicators from Alpha Vantage', status: 'not_started' },
      { id: 'mr-features', label: 'Feature engineering: yield curve slope, PMI momentum, etc.', status: 'not_started' },
      { id: 'mr-cluster', label: 'Regime detection: HMM or k-means on macro features', status: 'not_started' },
      { id: 'mr-label', label: 'Label historical regimes and validate against known periods', status: 'not_started' },
      { id: 'mr-backtest', label: 'Backtest: regime-conditional strategy vs. buy-and-hold', status: 'not_started' },
      { id: 'mr-factor', label: 'Factor analysis: which macro variables drive regime shifts?', status: 'not_started' },
      { id: 'mr-writeup', label: 'Write-up with regime timeline and strategy comparison', status: 'not_started' },
    ],
    findings: '',
  },
]

export default function QuantLabView() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ResearchProject[]>(RESEARCH_PROJECTS)
  const [expanded, setExpanded] = useState<string>('analyst-alpha')
  const [editingFindings, setEditingFindings] = useState<string>('')

  const storageKey = user?.uid ? `quant-lab-${user.uid}` : null

  useEffect(() => {
    if (!storageKey) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{ id: string; phases: Array<{ id: string; status: string }>; findings: string }>
        setProjects(RESEARCH_PROJECTS.map(p => {
          const s = parsed.find(x => x.id === p.id)
          if (!s) return p
          return {
            ...p,
            findings: s.findings || '',
            phases: p.phases.map(ph => {
              const sph = s.phases.find(x => x.id === ph.id)
              return sph ? { ...ph, status: sph.status as ProjectPhase['status'] } : ph
            }),
          }
        }))
      } catch { /* ignore */ }
    }
  }, [storageKey])

  const persist = useCallback((updated: ResearchProject[]) => {
    setProjects(updated)
    if (storageKey) {
      const flat = updated.map(p => ({
        id: p.id,
        findings: p.findings,
        phases: p.phases.map(ph => ({ id: ph.id, status: ph.status })),
      }))
      localStorage.setItem(storageKey, JSON.stringify(flat))
    }
  }, [storageKey])

  const cyclePhaseStatus = (projectId: string, phaseId: string) => {
    const order: ProjectPhase['status'][] = ['not_started', 'in_progress', 'complete']
    const updated = projects.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        phases: p.phases.map(ph => {
          if (ph.id !== phaseId) return ph
          const next = order[(order.indexOf(ph.status) + 1) % order.length]
          return { ...ph, status: next }
        }),
      }
    })
    persist(updated)
  }

  const updateFindings = (projectId: string, findings: string) => {
    const updated = projects.map(p => p.id === projectId ? { ...p, findings } : p)
    persist(updated)
  }

  // Overall stats
  const totalPhases = projects.reduce((acc, p) => acc + p.phases.length, 0)
  const completePhases = projects.reduce((acc, p) => acc + p.phases.filter(ph => ph.status === 'complete').length, 0)
  const activeProjects = projects.filter(p => p.phases.some(ph => ph.status === 'in_progress')).length

  return (
    <div className="space-y-3 py-2">
      {/* Header */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Research Lab · Portfolio Pieces
        </h3>
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          Each project is a <strong>hiring signal</strong> — proof you can go from raw market data to a validated signal with rigorous methodology.
          Build → write up findings → bring to interviews.
        </p>
        <div className="flex gap-3 mt-1.5">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[11px] font-semibold text-burgundy">{activeProjects}</span>
            <span className="font-mono text-[8px] text-ink-muted">active</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[11px] font-semibold text-green-ink">{completePhases}</span>
            <span className="font-mono text-[8px] text-ink-muted">/ {totalPhases} phases done</span>
          </div>
        </div>
      </div>

      {/* API inventory */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          API Arsenal
        </h4>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { name: 'Polygon', tier: 'Stocks + Options Starter', tag: 'polygon', capabilities: 'OHLCV, options chains, tick data, websockets' },
            { name: 'Benzinga', tier: 'Analyst Ratings', tag: 'benzinga', capabilities: 'Upgrades, downgrades, price targets, consensus' },
            { name: 'Alpha Vantage', tier: 'Pro', tag: 'alpha-vantage', capabilities: 'Fundamentals, technicals, economic indicators' },
          ].map(api => (
            <div key={api.name} className="border border-rule rounded-sm p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${CATEGORY_STYLE[api.tag]}`}>
                  {api.name}
                </span>
              </div>
              <div className="font-sans text-[8px] text-ink-muted">{api.tier}</div>
              <div className="font-mono text-[7px] text-ink-faint mt-0.5">{api.capabilities}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Project cards */}
      {projects.map((project, idx) => {
        const isExpanded = expanded === project.id
        const done = project.phases.filter(ph => ph.status === 'complete').length
        const active = project.phases.filter(ph => ph.status === 'in_progress').length
        const total = project.phases.length
        const pct = Math.round((done / total) * 100)
        const isFirst = idx === 0

        return (
          <div key={project.id} className={`bg-white border rounded-sm ${isFirst && done === 0 && active === 0 ? 'border-burgundy/30' : 'border-rule'}`}>
            <button
              onClick={() => setExpanded(isExpanded ? '' : project.id)}
              className="w-full p-2 text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {isFirst && done === 0 && active === 0 && (
                    <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm bg-burgundy text-paper">
                      start here
                    </span>
                  )}
                  <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    {project.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-ink-muted">{done}/{total}</span>
                  <span className="font-sans text-[10px] text-ink-faint">{isExpanded ? '▾' : '▸'}</span>
                </div>
              </div>

              <p className="font-sans text-[9px] text-ink-muted leading-relaxed">{project.description}</p>

              {/* Tags row */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {project.apis.map(api => (
                  <span key={api} className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${CATEGORY_STYLE[api]}`}>
                    {api}
                  </span>
                ))}
                <span className="text-ink-faint mx-0.5">·</span>
                {project.skills.map(skill => (
                  <span key={skill} className={`font-mono text-[7px] px-1 py-0.5 rounded-sm border ${SKILL_STYLE[skill] || 'text-ink-muted bg-cream border-rule'}`}>
                    {skill}
                  </span>
                ))}
              </div>

              {/* Progress bar */}
              {(done > 0 || active > 0) && (
                <div className="mt-1.5">
                  <div className="h-1 bg-cream rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-burgundy rounded-sm transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-rule-light px-2 pb-2">
                {/* Hiring signal callout */}
                <div className="bg-cream rounded-sm p-1.5 my-1.5">
                  <span className="font-serif text-[8px] font-semibold uppercase tracking-[0.3px] text-burgundy">Interview signal: </span>
                  <span className="font-sans text-[9px] text-ink leading-relaxed">{project.hiringSignal}</span>
                </div>

                {/* Phase checklist */}
                {project.phases.map(phase => (
                  <button
                    key={phase.id}
                    onClick={() => cyclePhaseStatus(project.id, phase.id)}
                    className="w-full flex items-start gap-2 py-1.5 border-b border-rule-light last:border-0 text-left"
                  >
                    <span className={`font-mono text-[10px] mt-0.5 ${STATUS_COLOR[phase.status]}`}>
                      {STATUS_ICON[phase.status]}
                    </span>
                    <span className="font-sans text-[10px] text-ink leading-tight">{phase.label}</span>
                  </button>
                ))}

                {/* Findings / notes */}
                <div className="mt-2">
                  <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[0.3px] text-burgundy mb-1">
                    Findings & Notes
                  </h5>
                  {editingFindings === project.id ? (
                    <div>
                      <textarea
                        value={project.findings}
                        onChange={e => {
                          const updated = projects.map(p => p.id === project.id ? { ...p, findings: e.target.value } : p)
                          setProjects(updated)
                        }}
                        onBlur={() => {
                          updateFindings(project.id, project.findings)
                          setEditingFindings('')
                        }}
                        autoFocus
                        placeholder="Document what you found, methodology notes, key numbers..."
                        className="w-full bg-cream border border-rule rounded-sm p-1.5 font-sans text-[10px] text-ink resize-none h-20 placeholder:text-ink-faint"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingFindings(project.id)}
                      className="w-full text-left"
                    >
                      {project.findings ? (
                        <p className="font-sans text-[10px] text-ink leading-relaxed whitespace-pre-wrap">{project.findings}</p>
                      ) : (
                        <p className="font-sans text-[10px] text-ink-faint italic">Click to add findings...</p>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Priority recommendation */}
      <div className="bg-cream border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Recommended Order
        </h4>
        <div className="space-y-1">
          {[
            { num: '1', project: 'Analyst Alpha Decay', reason: 'Fastest to complete, uses 2 APIs, teaches event study methodology — the bread and butter of signal research.' },
            { num: '2', project: 'Vol Surface Explorer', reason: 'Most technically impressive for derivatives roles. Shows you understand options beyond theory.' },
            { num: '3', project: 'Order Flow Imbalance', reason: 'Directly relevant to market-making desks. Hardest to build, highest signal for HFT/MM roles.' },
            { num: '4', project: 'Macro Regime Detector', reason: 'Best for multi-asset/macro quant roles. Requires the most ML knowledge.' },
          ].map(r => (
            <div key={r.num} className="flex items-start gap-1.5">
              <span className="font-mono text-[10px] font-bold text-burgundy w-3 shrink-0">{r.num}</span>
              <div>
                <span className="font-sans text-[10px] font-medium text-ink">{r.project}</span>
                <span className="font-sans text-[9px] text-ink-muted"> — {r.reason}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
