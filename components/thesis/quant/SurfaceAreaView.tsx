'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { strategicPillars, computeMomentum, type StrategicPillar, VENTURES } from '@/lib/strategic-priorities'

// ─── Types ─────────────────────────────────────────────────────────────

const VENTURE_STYLE: Record<string, string> = {
  active: 'text-green-ink bg-green-bg border-green-ink/20',
  backlog: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  killed: 'text-ink-muted bg-cream border-rule',
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
  const [pillars, setPillars] = useState<StrategicPillar[]>(strategicPillars)
  const [expanded, setExpanded] = useState<string>('alpha')

  const storageKey = user?.uid ? `strategic-v3-${user.uid}` : null

  useEffect(() => {
    if (!storageKey) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{ id: string; status: string }>
        setPillars(strategicPillars.map(p => ({
          ...p,
          activities: p.activities.map(a => {
            const s = parsed.find(x => x.id === a.id)
            return s ? { ...a, status: s.status as 'not_started' | 'active' | 'complete' } : a
          }),
        })))
      } catch { /* ignore */ }
    }
  }, [storageKey])

  const persist = useCallback((updated: StrategicPillar[]) => {
    setPillars(updated)
    if (storageKey) {
      const flat = updated.flatMap(p => p.activities.map(a => ({ id: a.id, status: a.status })))
      localStorage.setItem(storageKey, JSON.stringify(flat))
    }
  }, [storageKey])

  const cycleStatus = (pillarKey: string, activityId: string) => {
    const order: Array<'not_started' | 'active' | 'complete'> = ['not_started', 'active', 'complete']
    const updated = pillars.map(p => {
      if (p.key !== pillarKey) return p
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

  const { score: momentum, pillarScores } = computeMomentum(pillars)

  return (
    <div className="space-y-3 py-2">
      {/* Header with momentum score */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Strategic Momentum
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[22px] font-bold text-burgundy leading-none">{momentum}</span>
            <span className="font-mono text-[9px] text-ink-muted">/ 100</span>
          </div>
        </div>
        <p className="font-sans text-[9px] text-ink-muted mt-1">
          Weighted progress across 5 strategic pillars. Simons rule: track the signal, not the noise.
        </p>
      </div>

      {/* 5-pillar summary */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <div className="space-y-1.5">
          {pillarScores.map(ps => (
            <div key={ps.key}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans text-[10px] font-medium text-ink">{ps.title}</span>
                  <span className="font-mono text-[7px] text-ink-faint">{ps.weight}%w</span>
                </div>
                <span className={`font-mono text-[10px] font-semibold ${
                  ps.score >= 50 ? 'text-green-ink' : ps.score >= 20 ? 'text-amber-ink' : 'text-ink-muted'
                }`}>{ps.score}</span>
              </div>
              <div className="h-1.5 bg-cream rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm transition-all ${
                    ps.score >= 50 ? 'bg-green-ink' : ps.score >= 20 ? 'bg-amber-ink' : 'bg-ink-faint'
                  }`}
                  style={{ width: `${Math.max(ps.score, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Venture status */}
      <div className="bg-white border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Ventures
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
              <span className="font-sans text-[8px] text-ink-muted ml-auto shrink-0 max-w-[200px] truncate">{v.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pillar cards */}
      {pillars.map(p => {
        const isExpanded = expanded === p.key
        const ps = pillarScores.find(s => s.key === p.key)

        return (
          <div key={p.key} className="bg-white border border-rule rounded-sm">
            <button
              onClick={() => setExpanded(isExpanded ? '' : p.key)}
              className="w-full p-2 text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  {p.title}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] font-semibold ${
                    (ps?.score ?? 0) >= 50 ? 'text-green-ink' : (ps?.score ?? 0) >= 20 ? 'text-amber-ink' : 'text-ink-muted'
                  }`}>{ps?.score ?? 0}</span>
                  <span className="font-sans text-[10px] text-ink-faint">{isExpanded ? '▾' : '▸'}</span>
                </div>
              </div>
              <p className="font-sans text-[9px] text-ink-muted mt-0.5">{p.description}</p>
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
