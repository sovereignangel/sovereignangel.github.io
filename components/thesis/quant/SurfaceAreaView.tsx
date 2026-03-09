'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

// ─── Career Vectors ────────────────────────────────────────────────────

interface Activity {
  id: string
  label: string
  status: 'not_started' | 'active' | 'complete'
}

interface CareerVector {
  key: string
  title: string
  comp: string
  description: string
  currentLeverage: string
  activities: Activity[]
}

const VECTORS: CareerVector[] = [
  {
    key: 'quant',
    title: 'Quantitative Analyst',
    comp: '$300–500k',
    description: 'Systematic alpha generation, risk management, portfolio optimization. Highest comp ceiling in finance.',
    currentLeverage: 'Armstrong fund + Alamo Bernal — building real track record with live capital.',
    activities: [
      { id: 'q1', label: 'Formalize backtesting engine (walk-forward, cross-validation)', status: 'active' },
      { id: 'q2', label: 'Build 3 systematic signals with documented Sharpe', status: 'active' },
      { id: 'q3', label: 'Complete stochastic calculus self-study', status: 'not_started' },
      { id: 'q4', label: 'Publish 1 quantitative research piece (SSRN/arXiv/blog)', status: 'not_started' },
      { id: 'q5', label: 'Get CQF or equivalent certification', status: 'not_started' },
      { id: 'q6', label: 'Network: attend 2 quant meetups or conferences', status: 'not_started' },
    ],
  },
  {
    key: 'ai-eng',
    title: 'AI Product Engineer',
    comp: '$250–400k',
    description: 'Build AI-native products end-to-end. Combines ML engineering with product thinking.',
    currentLeverage: 'Thesis Engine is a live AI product — Gemini extraction, RL framework, NLP pipelines.',
    activities: [
      { id: 'a1', label: 'Ship a public-facing AI feature (not just internal tooling)', status: 'not_started' },
      { id: 'a2', label: 'Build RAG pipeline or agent system in production', status: 'active' },
      { id: 'a3', label: 'Contribute to open-source AI project (LangChain, LlamaIndex, etc.)', status: 'not_started' },
      { id: 'a4', label: 'Write technical blog post on AI engineering patterns', status: 'not_started' },
      { id: 'a5', label: 'Deploy model serving with latency/cost optimization', status: 'not_started' },
    ],
  },
  {
    key: 'pm',
    title: 'Product Manager',
    comp: '$200–350k',
    description: 'Strategy, prioritization, stakeholder management. Leverage domain expertise in fintech/AI.',
    currentLeverage: 'Built and operated Thesis Engine as sole PM + engineer. Arc consumer product.',
    activities: [
      { id: 'p1', label: 'Document product strategy for Armstrong/Arc (PRDs, OKRs)', status: 'active' },
      { id: 'p2', label: 'Run a structured user research sprint (5+ interviews)', status: 'not_started' },
      { id: 'p3', label: 'Build metrics dashboard with product analytics', status: 'not_started' },
      { id: 'p4', label: 'Get 1 PM certification or complete Reforge program', status: 'not_started' },
      { id: 'p5', label: 'Present product review to external stakeholder', status: 'not_started' },
    ],
  },
  {
    key: 'research-eng',
    title: 'Research Engineer',
    comp: '$250–450k',
    description: 'Implement and scale ML research. Bridge between papers and production systems.',
    currentLeverage: 'RL reward function design, inverse RL exploration, ETL pipelines for financial data.',
    activities: [
      { id: 'r1', label: 'Reimplement 2 recent ML papers from scratch', status: 'not_started' },
      { id: 'r2', label: 'Build training pipeline with experiment tracking (W&B/MLflow)', status: 'not_started' },
      { id: 'r3', label: 'Optimize model inference (quantization, distillation, batching)', status: 'not_started' },
      { id: 'r4', label: 'Publish benchmarks or ablation study', status: 'not_started' },
      { id: 'r5', label: 'Contribute to ML framework (PyTorch, JAX, HuggingFace)', status: 'not_started' },
    ],
  },
]

const STATUS_ICON: Record<string, string> = {
  not_started: '○',
  active: '◐',
  complete: '✓',
}

const STATUS_COLOR: Record<string, string> = {
  not_started: 'text-ink-faint',
  active: 'text-amber-ink',
  complete: 'text-green-ink',
}

export default function SurfaceAreaView() {
  const { user } = useAuth()
  const [vectors, setVectors] = useState<CareerVector[]>(VECTORS)
  const [expanded, setExpanded] = useState<string>('quant')

  const storageKey = user?.uid ? `surface-area-${user.uid}` : null

  useEffect(() => {
    if (!storageKey) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{ id: string; status: string }>
        setVectors(VECTORS.map(v => ({
          ...v,
          activities: v.activities.map(a => {
            const s = parsed.find(p => p.id === a.id)
            return s ? { ...a, status: s.status as Activity['status'] } : a
          }),
        })))
      } catch { /* ignore */ }
    }
  }, [storageKey])

  const persist = useCallback((updated: CareerVector[]) => {
    setVectors(updated)
    if (storageKey) {
      const flat = updated.flatMap(v => v.activities.map(a => ({ id: a.id, status: a.status })))
      localStorage.setItem(storageKey, JSON.stringify(flat))
    }
  }, [storageKey])

  const cycleStatus = (vectorKey: string, activityId: string) => {
    const order: Activity['status'][] = ['not_started', 'active', 'complete']
    const updated = vectors.map(v => {
      if (v.key !== vectorKey) return v
      return {
        ...v,
        activities: v.activities.map(a => {
          if (a.id !== activityId) return a
          const next = order[(order.indexOf(a.status) + 1) % order.length]
          return { ...a, status: next }
        }),
      }
    })
    persist(updated)
  }

  // Compute surface area scores
  const vectorScores = vectors.map(v => {
    const total = v.activities.length
    const complete = v.activities.filter(a => a.status === 'complete').length
    const active = v.activities.filter(a => a.status === 'active').length
    const score = Math.round(((complete + active * 0.3) / total) * 100)
    return { key: v.key, title: v.title, score, complete, active, total }
  })

  const avgScore = Math.round(vectorScores.reduce((s, v) => s + v.score, 0) / vectorScores.length)

  return (
    <div className="space-y-3 py-2">
      {/* Header */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Career Surface Area
        </h3>
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          Maximize optionality across four high-leverage career vectors. Primary track: <strong>Quant</strong> (via Armstrong + Alamo Bernal).
          Each vector compounds independently — surface area = probability of breakthrough.
        </p>
      </div>

      {/* Radar summary */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">Coverage Map</span>
          <span className="font-mono text-[10px] text-ink-muted">Avg: {avgScore}%</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {vectorScores.map(v => (
            <div key={v.key} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-sans text-[9px] text-ink">{v.title}</span>
                  <span className="font-mono text-[9px] text-ink-muted">{v.score}%</span>
                </div>
                <div className="h-1 bg-cream rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm transition-all ${v.score >= 50 ? 'bg-green-ink' : v.score >= 20 ? 'bg-amber-ink' : 'bg-ink-faint'}`}
                    style={{ width: `${v.score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vector cards */}
      {vectors.map(v => {
        const isExpanded = expanded === v.key
        const score = vectorScores.find(s => s.key === v.key)

        return (
          <div key={v.key} className="bg-white border border-rule rounded-sm">
            <button
              onClick={() => setExpanded(isExpanded ? '' : v.key)}
              className="w-full p-2 text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    {v.title}
                  </h4>
                  <p className="font-sans text-[9px] text-ink-muted mt-0.5">{v.comp}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-ink-muted">
                    {score?.complete}/{score?.total}
                  </span>
                  <span className="font-sans text-[10px] text-ink-faint">{isExpanded ? '▾' : '▸'}</span>
                </div>
              </div>
              <p className="font-sans text-[9px] text-ink-muted mt-1 leading-relaxed">{v.description}</p>
              <p className="font-sans text-[9px] text-green-ink mt-0.5 leading-relaxed">
                <strong>Current leverage:</strong> {v.currentLeverage}
              </p>
            </button>

            {isExpanded && (
              <div className="border-t border-rule-light px-2 pb-2">
                {v.activities.map(a => (
                  <button
                    key={a.id}
                    onClick={() => cycleStatus(v.key, a.id)}
                    className="w-full flex items-start gap-2 py-1.5 border-b border-rule-light last:border-0 text-left"
                  >
                    <span className={`font-mono text-[10px] mt-0.5 ${STATUS_COLOR[a.status]}`}>
                      {STATUS_ICON[a.status]}
                    </span>
                    <span className="font-sans text-[10px] text-ink leading-tight">{a.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Strategy note */}
      <div className="bg-cream border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Surface Area Strategy
        </h4>
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          <strong>Primary axis:</strong> Quant (highest comp, direct path via fund work).
          <strong> Secondary:</strong> AI Product Eng (compounds with quant — ML + systems).
          <strong> Tertiary:</strong> Research Eng + PM maintain optionality.
          Activities in each vector should produce <em>artifacts</em> (papers, code, products, track records)
          that compound across vectors. A published backtest is quant cred AND research eng cred.
        </p>
      </div>
    </div>
  )
}
