'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { strategicPillars, computeMomentum, type StrategicPillar, VENTURES } from '@/lib/strategic-priorities'

// ─── Luck Surface Area Analysis ────────────────────────────────────────
// The "area" of the radar polygon = your luck surface area.
// Marginal luck gain = how much the polygon area grows if you push one pillar up.
// Prioritize the pillar with the highest marginal gain per effort.

function computeRadarArea(scores: number[]): number {
  // Area of a polygon inscribed in a circle with vertices at angles 2πi/n and radii r_i
  // A = 0.5 * Σ r_i * r_{i+1} * sin(2π/n)
  const n = scores.length
  if (n < 3) return 0
  const angle = (2 * Math.PI) / n
  let area = 0
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    area += scores[i] * scores[next] * Math.sin(angle)
  }
  return Math.abs(area) / 2
}

function computeMarginalGains(scores: number[], weights: number[]): Array<{ key: string; gain: number; effort: number; roi: number }> {
  const currentArea = computeRadarArea(scores)
  const maxArea = computeRadarArea(scores.map(() => 100)) // perfect pentagon

  return scores.map((score, i) => {
    // What if this pillar went up by 20 points?
    const bumped = [...scores]
    bumped[i] = Math.min(100, score + 20)
    const newArea = computeRadarArea(bumped)
    const gain = newArea - currentArea

    // Effort inversely proportional to current score (harder to improve what's already high)
    const effort = Math.max(1, score / 20)

    // ROI = gain per unit effort, weighted by strategic importance
    const roi = (gain / effort) * (weights[i] / 100)

    return { key: strategicPillars[i].key, gain, effort, roi }
  })
}

// ─── Status helpers ────────────────────────────────────────────────────

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

// ─── Custom Radar Tooltip ──────────────────────────────────────────────

interface RadarTooltipPayload {
  pillar: string
  score: number
  fullMark: number
  description: string
  weight: number
  complete: number
  active: number
  notStarted: number
  total: number
  activities: Array<{ label: string; status: string }>
}

function RadarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RadarTooltipPayload }> }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload

  return (
    <div className="bg-white border border-rule rounded-sm p-2 shadow-sm max-w-[220px] pointer-events-none">
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
        {d.pillar} <span className="font-mono text-[9px] text-ink-muted normal-case">({d.weight}% weight)</span>
      </div>
      <p className="font-sans text-[9px] text-ink-muted leading-relaxed mb-1.5">{d.description}</p>

      {/* Score breakdown */}
      <div className="font-mono text-[9px] text-ink mb-1.5 bg-cream rounded-sm px-1.5 py-1">
        <span className="font-semibold">{d.score}</span>/100 =
        ({d.complete} done × 1.0 + {d.active} active × 0.3) / {d.total} total
      </div>

      {/* Activity list */}
      <div className="space-y-0.5">
        {d.activities.map(a => (
          <div key={a.label} className="flex items-start gap-1">
            <span className={`font-mono text-[9px] mt-px shrink-0 ${
              a.status === 'complete' ? 'text-green-ink' : a.status === 'active' ? 'text-amber-ink' : 'text-ink-faint'
            }`}>
              {a.status === 'complete' ? '✓' : a.status === 'active' ? '◐' : '○'}
            </span>
            <span className="font-sans text-[8px] text-ink leading-tight">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────

export default function SurfaceAreaView() {
  const { user } = useAuth()
  const [pillars, setPillars] = useState<StrategicPillar[]>(strategicPillars)
  const [expanded, setExpanded] = useState<string>('')

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

  // Radar data (enriched for tooltip)
  const radarData = pillarScores.map(ps => {
    const p = pillars.find(x => x.key === ps.key)!
    return {
      pillar: ps.title.split(' ')[0],
      score: ps.score,
      fullMark: 100,
      description: p.description,
      weight: ps.weight,
      complete: ps.complete,
      active: ps.active,
      notStarted: ps.total - ps.complete - ps.active,
      total: ps.total,
      activities: p.activities.map(a => ({ label: a.label, status: a.status })),
    }
  })

  // Luck analysis
  const scores = pillarScores.map(ps => ps.score)
  const weights = pillarScores.map(ps => ps.weight)
  const currentArea = computeRadarArea(scores)
  const maxArea = computeRadarArea(scores.map(() => 100))
  const coveragePct = maxArea > 0 ? Math.round((currentArea / maxArea) * 100) : 0

  const marginalGains = useMemo(
    () => computeMarginalGains(scores, weights).sort((a, b) => b.roi - a.roi),
    [scores, weights]
  )

  // Top priority recommendation
  const topPriority = marginalGains[0]
  const topPillar = pillars.find(p => p.key === topPriority?.key)

  return (
    <div className="space-y-3 py-2">
      {/* Radar + Momentum */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Luck Surface Area
          </h3>
          <div className="flex items-baseline gap-2">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[9px] text-ink-muted">Coverage</span>
              <span className={`font-mono text-[14px] font-bold leading-none ${
                coveragePct >= 40 ? 'text-green-ink' : coveragePct >= 15 ? 'text-amber-ink' : 'text-red-ink'
              }`}>{coveragePct}%</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[9px] text-ink-muted">Momentum</span>
              <span className="font-mono text-[14px] font-bold text-burgundy leading-none">{momentum}</span>
            </div>
          </div>
        </div>

        {/* Radar chart */}
        <div className="h-[200px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="#d8d0c8" strokeWidth={0.5} />
              <PolarAngleAxis
                dataKey="pillar"
                tick={{ fontSize: 9, fill: '#9a928a', fontFamily: 'var(--font-sans)' }}
              />
              <Tooltip content={<RadarTooltip />} wrapperStyle={{ zIndex: 10 }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#7c2d2d"
                fill="#7c2d2d"
                fillOpacity={0.15}
                strokeWidth={1.5}
                activeDot={{ r: 4, stroke: '#7c2d2d', strokeWidth: 1.5, fill: '#faf8f4' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Pillar scores inline */}
        <div className="flex justify-between mt-1 px-1">
          {pillarScores.map(ps => (
            <div key={ps.key} className="text-center">
              <span className={`font-mono text-[11px] font-semibold ${
                ps.score >= 50 ? 'text-green-ink' : ps.score >= 20 ? 'text-amber-ink' : 'text-ink-faint'
              }`}>{ps.score}</span>
              <div className="font-mono text-[7px] text-ink-muted">{ps.weight}%w</div>
            </div>
          ))}
        </div>
      </div>

      {/* Marginal Luck Analysis */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Highest Marginal Luck Gain
        </h4>
        <p className="font-sans text-[10px] text-ink leading-relaxed mb-2">
          Push <strong>{topPillar?.title}</strong> next — it has the best ROI on luck surface area expansion
          given its current score and strategic weight.
        </p>
        <div className="space-y-1">
          {marginalGains.map((mg, i) => {
            const pillar = pillars.find(p => p.key === mg.key)
            const ps = pillarScores.find(s => s.key === mg.key)
            const isTop = i === 0
            return (
              <div key={mg.key} className={`flex items-center gap-2 px-1.5 py-1 rounded-sm ${
                isTop ? 'bg-white border border-burgundy/20' : ''
              }`}>
                <span className={`font-mono text-[10px] font-bold w-4 ${isTop ? 'text-burgundy' : 'text-ink-muted'}`}>
                  {i + 1}
                </span>
                <span className="font-sans text-[10px] text-ink flex-1">{pillar?.title}</span>
                <span className="font-mono text-[8px] text-ink-muted">score {ps?.score}</span>
                <div className="w-12 h-1 bg-cream rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${isTop ? 'bg-burgundy' : 'bg-ink-faint'}`}
                    style={{ width: `${Math.min(100, (mg.roi / (marginalGains[0]?.roi || 1)) * 100)}%` }}
                  />
                </div>
                <span className={`font-mono text-[8px] font-semibold w-6 text-right ${isTop ? 'text-burgundy' : 'text-ink-muted'}`}>
                  {mg.roi > 0 ? mg.roi.toFixed(0) : '0'}
                </span>
              </div>
            )
          })}
        </div>
        <p className="font-sans text-[8px] text-ink-muted mt-1.5 italic">
          ROI = (area gain from +20pts) / (effort at current level) × strategic weight.
          Low score + high weight = highest marginal return.
        </p>
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
            </div>
          ))}
        </div>
      </div>

      {/* Pillar drill-down cards */}
      {pillars.map(p => {
        const isExpanded = expanded === p.key
        const ps = pillarScores.find(s => s.key === p.key)
        const mg = marginalGains.find(m => m.key === p.key)
        const rank = marginalGains.findIndex(m => m.key === p.key) + 1

        return (
          <div key={p.key} className={`bg-white border rounded-sm ${rank === 1 ? 'border-burgundy/30' : 'border-rule'}`}>
            <button
              onClick={() => setExpanded(isExpanded ? '' : p.key)}
              className="w-full p-2 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {rank === 1 && (
                    <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm bg-burgundy text-paper">
                      priority
                    </span>
                  )}
                  <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    {p.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] font-semibold ${
                    (ps?.score ?? 0) >= 50 ? 'text-green-ink' : (ps?.score ?? 0) >= 20 ? 'text-amber-ink' : 'text-ink-faint'
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
