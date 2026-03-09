'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

// ─── Strategic Priorities ──────────────────────────────────────────────

interface Activity {
  id: string
  label: string
  status: 'not_started' | 'active' | 'complete'
}

interface Priority {
  key: string
  title: string
  muscle: string
  vehicle: string
  activities: Activity[]
}

interface Venture {
  name: string
  status: 'active' | 'backlog' | 'killed'
  note: string
}

const VENTURES: Venture[] = [
  { name: 'Armstrong', status: 'active', note: 'Primary skill-building vehicle. CQL, quant research, IB automation.' },
  { name: 'Alamo Bernal', status: 'active', note: 'Close the deal. Validates fund management credibility.' },
  { name: 'Arc (consumer product)', status: 'active', note: 'Thesis Engine → consumer. arc.loricorpuz.com' },
  { name: 'Deep Tech Fund', status: 'backlog', note: 'Parked. Revisit after Armstrong + Bernal are running.' },
  { name: 'Manifold', status: 'killed', note: 'Killed. Resources redirected to Armstrong focus.' },
]

const PRIORITIES: Priority[] = [
  {
    key: 'skills-armstrong',
    title: 'Build Skills with Armstrong',
    muscle: 'Finance + Research + Code',
    vehicle: 'Armstrong Fund',
    activities: [
      { id: 'sa1', label: 'IB paper trading automation (CQL → IB pipeline)', status: 'not_started' },
      { id: 'sa2', label: 'Formalize CQL strategy documentation', status: 'active' },
      { id: 'sa3', label: 'Compute Sharpe / tearsheet on 300+ position history', status: 'not_started' },
      { id: 'sa4', label: 'Greeks monitoring dashboard for options book', status: 'not_started' },
      { id: 'sa5', label: 'Risk guardrails (position limits, daily loss, correlation)', status: 'not_started' },
    ],
  },
  {
    key: 'close-bernal',
    title: 'Close Bernal',
    muscle: 'Sales + Finance',
    vehicle: 'Alamo Bernal',
    activities: [
      { id: 'cb1', label: 'Finalize partnership terms', status: 'active' },
      { id: 'cb2', label: 'Deliver pitch deck / proposal site', status: 'active' },
      { id: 'cb3', label: 'Legal / compliance setup', status: 'not_started' },
    ],
  },
  {
    key: 'fund-sales',
    title: 'Open HF / FO Opportunities',
    muscle: 'Sales + Network',
    vehicle: 'Outbound',
    activities: [
      { id: 'fs1', label: 'Build target list: hedge funds + family offices in Bay Area', status: 'not_started' },
      { id: 'fs2', label: 'Craft outreach template (track record + CQL narrative)', status: 'not_started' },
      { id: 'fs3', label: 'Attend 2 industry events / meetups', status: 'not_started' },
      { id: 'fs4', label: 'Get 5 warm introductions via existing network', status: 'not_started' },
    ],
  },
  {
    key: 'job-apps',
    title: 'Apply to AI Eng / Product Owner (Fintech)',
    muscle: 'Career optionality',
    vehicle: 'Job market',
    activities: [
      { id: 'ja1', label: 'Polish resume: emphasize Thesis Engine + Armstrong + AI stack', status: 'not_started' },
      { id: 'ja2', label: 'Apply to 5 Applied AI Engineering roles (fintech focus)', status: 'not_started' },
      { id: 'ja3', label: 'Apply to 5 Product Owner / PM roles (fintech / AI)', status: 'not_started' },
      { id: 'ja4', label: 'Prep system design + product case interviews', status: 'not_started' },
      { id: 'ja5', label: 'Build portfolio page showcasing Thesis Engine + Armstrong', status: 'not_started' },
    ],
  },
  {
    key: 'arc-product',
    title: 'Thesis Engine → Arc Consumer Product',
    muscle: 'Product + Code',
    vehicle: 'arc.loricorpuz.com',
    activities: [
      { id: 'ap1', label: 'Define Arc MVP scope (what subset of Thesis Engine ships?)', status: 'not_started' },
      { id: 'ap2', label: 'User-facing onboarding flow', status: 'not_started' },
      { id: 'ap3', label: 'Landing page with clear value prop', status: 'active' },
      { id: 'ap4', label: 'Get 5 beta users outside yourself', status: 'not_started' },
    ],
  },
  {
    key: 'venture-builder',
    title: 'Venture Builder Muscle',
    muscle: 'Pattern recognition + Taste',
    vehicle: 'Value observation practice',
    activities: [
      { id: 'vb1', label: 'Weekly value observation log (market gaps, broken workflows)', status: 'active' },
      { id: 'vb2', label: 'Evaluate 1 opportunity/week through venture lens', status: 'not_started' },
      { id: 'vb3', label: 'Maintain venture ideas backlog with scoring', status: 'active' },
    ],
  },
  {
    key: 'research-muscle',
    title: 'Research Muscle',
    muscle: 'Intelligence + Discovery',
    vehicle: 'Armstrong + Thesis Engine',
    activities: [
      { id: 'rm1', label: 'Weekly research deep-dive (quant paper, market thesis, or tech)', status: 'active' },
      { id: 'rm2', label: 'Process intelligence feeds daily (pillar briefs, signals)', status: 'active' },
      { id: 'rm3', label: 'Maintain hypothesis ledger with conviction updates', status: 'active' },
    ],
  },
  {
    key: 'finance-muscle',
    title: 'Finance Muscle',
    muscle: 'Capital + Risk',
    vehicle: 'Armstrong + Personal',
    activities: [
      { id: 'fm1', label: 'Armstrong portfolio management (active)', status: 'active' },
      { id: 'fm2', label: 'Personal finance optimization (tax, allocation, runway)', status: 'not_started' },
      { id: 'fm3', label: 'Anki: reactivate actuarial/ME math foundations', status: 'not_started' },
    ],
  },
  {
    key: 'philosophy-taste',
    title: 'Philosophy / Business / Taste',
    muscle: 'Judgment + Coherence',
    vehicle: 'Daily journaling system',
    activities: [
      { id: 'pt1', label: 'Daily journal → beliefs → decisions → principles pipeline', status: 'active' },
      { id: 'pt2', label: 'Governance ledger: record reasoning at decision time', status: 'active' },
      { id: 'pt3', label: 'Weekly review: what did I learn, what would I do differently?', status: 'active' },
    ],
  },
  {
    key: 'distribution',
    title: 'Output for Distribution',
    muscle: 'Network + Authority',
    vehicle: 'X, Research, Saturday Pitches',
    activities: [
      { id: 'di1', label: 'Weekly X post (research insight, market take, or build update)', status: 'not_started' },
      { id: 'di2', label: 'Saturday engineering group pitch (weekly)', status: 'active' },
      { id: 'di3', label: 'Publish 1 research piece / month (Substack, SSRN, or blog)', status: 'not_started' },
      { id: 'di4', label: 'Share Armstrong learnings in quant communities', status: 'not_started' },
    ],
  },
]

const VENTURE_STYLE: Record<string, string> = {
  active: 'text-green-ink bg-green-bg border-green-ink/20',
  backlog: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  killed: 'text-ink-muted bg-cream border-rule line-through',
}

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
  const [priorities, setPriorities] = useState<Priority[]>(PRIORITIES)
  const [expanded, setExpanded] = useState<string>('skills-armstrong')

  const storageKey = user?.uid ? `surface-area-v2-${user.uid}` : null

  useEffect(() => {
    if (!storageKey) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{ id: string; status: string }>
        setPriorities(PRIORITIES.map(p => ({
          ...p,
          activities: p.activities.map(a => {
            const s = parsed.find(x => x.id === a.id)
            return s ? { ...a, status: s.status as Activity['status'] } : a
          }),
        })))
      } catch { /* ignore */ }
    }
  }, [storageKey])

  const persist = useCallback((updated: Priority[]) => {
    setPriorities(updated)
    if (storageKey) {
      const flat = updated.flatMap(p => p.activities.map(a => ({ id: a.id, status: a.status })))
      localStorage.setItem(storageKey, JSON.stringify(flat))
    }
  }, [storageKey])

  const cycleStatus = (priorityKey: string, activityId: string) => {
    const order: Activity['status'][] = ['not_started', 'active', 'complete']
    const updated = priorities.map(p => {
      if (p.key !== priorityKey) return p
      return {
        ...p,
        activities: p.activities.map(a => {
          if (a.id !== activityId) return a
          const next = order[(order.indexOf(a.status) + 1) % order.length]
          return { ...a, status: next }
        }),
      }
    })
    persist(updated)
  }

  // Compute scores
  const priorityScores = priorities.map(p => {
    const total = p.activities.length
    const complete = p.activities.filter(a => a.status === 'complete').length
    const active = p.activities.filter(a => a.status === 'active').length
    const score = Math.round(((complete + active * 0.3) / total) * 100)
    return { key: p.key, title: p.title, score, complete, active, total }
  })

  return (
    <div className="space-y-3 py-2">
      {/* Header */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Strategic Surface Area
        </h3>
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          Every activity either builds a <strong>muscle</strong> or advances a <strong>vehicle</strong>.
          Muscles compound across vehicles. The goal: maximize the probability surface for $300–500k outcomes
          across quant, AI eng, product, and fund management.
        </p>
      </div>

      {/* Venture status map */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Venture Status
        </h4>
        <div className="space-y-1">
          {VENTURES.map(v => (
            <div key={v.name} className="flex items-center gap-2">
              <span className={`font-mono text-[7px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${VENTURE_STYLE[v.status]}`}>
                {v.status}
              </span>
              <span className={`font-sans text-[10px] font-medium ${v.status === 'killed' ? 'text-ink-muted line-through' : 'text-ink'}`}>
                {v.name}
              </span>
              <span className="font-sans text-[8px] text-ink-muted ml-auto shrink-0">{v.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority coverage */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Priority Coverage
        </h4>
        <div className="space-y-1.5">
          {priorityScores.map(p => (
            <div key={p.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-sans text-[9px] text-ink">{p.title}</span>
                <span className="font-mono text-[8px] text-ink-muted">{p.complete}/{p.total}</span>
              </div>
              <div className="h-1 bg-cream rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm transition-all ${p.score >= 50 ? 'bg-green-ink' : p.score >= 20 ? 'bg-amber-ink' : 'bg-ink-faint'}`}
                  style={{ width: `${Math.max(p.score, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority cards */}
      {priorities.map(p => {
        const isExpanded = expanded === p.key
        const score = priorityScores.find(s => s.key === p.key)

        return (
          <div key={p.key} className="bg-white border border-rule rounded-sm">
            <button
              onClick={() => setExpanded(isExpanded ? '' : p.key)}
              className="w-full p-2 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    {p.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-ink-muted">
                    {score?.complete}/{score?.total}
                  </span>
                  <span className="font-sans text-[10px] text-ink-faint">{isExpanded ? '▾' : '▸'}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-0.5">
                <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border text-burgundy bg-burgundy-bg border-burgundy/20">
                  {p.muscle}
                </span>
                <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border text-ink-muted bg-cream border-rule">
                  {p.vehicle}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-rule-light px-2 pb-2">
                {p.activities.map(a => (
                  <button
                    key={a.id}
                    onClick={() => cycleStatus(p.key, a.id)}
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
    </div>
  )
}
