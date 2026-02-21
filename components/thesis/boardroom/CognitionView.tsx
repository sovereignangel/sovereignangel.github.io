'use client'

import { useState } from 'react'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'

const PSYCAP_FIELDS = [
  { key: 'psyCapHope', label: 'Hope', description: 'Willpower + waypower to achieve goals' },
  { key: 'psyCapEfficacy', label: 'Efficacy', description: 'Confidence to take on challenges' },
  { key: 'psyCapResilience', label: 'Resilience', description: 'Bouncing back and beyond from adversity' },
  { key: 'psyCapOptimism', label: 'Optimism', description: 'Positive attribution about future success' },
] as const

const HERO_BRIEFING = [
  {
    dimension: 'Hope',
    letter: 'H',
    mechanism: 'Goal-directed willpower (determination) + waypower (pathfinding). High-Hope operators generate multiple routes to the objective and sustain effort when the primary path is blocked.',
    signal: 'When Hope drops below 3, you are either pursuing the wrong goal or you have stopped generating alternative paths. Audit both.',
    leverage: 'Write down 3 alternative pathways to your current primary objective. Hope is not optimism — it is the concrete belief that you can find a way.',
  },
  {
    dimension: 'Efficacy',
    letter: 'E',
    mechanism: 'Task-specific confidence derived from mastery experiences, vicarious learning, social persuasion, and physiological arousal. Bandura (1997): self-efficacy is the single strongest predictor of performance across domains.',
    signal: 'Efficacy is lagging indicator of recent wins/losses. A sustained score below 3 means you need a small win — ship something, close something, solve something today.',
    leverage: 'Stack difficulty gradually. Efficacy builds from repeated evidence of competence, not affirmation.',
  },
  {
    dimension: 'Resilience',
    letter: 'R',
    mechanism: 'Capacity to bounce back from adversity, conflict, failure, and even positive events that stretch capacity. Resilience is not grit — it is elastic recovery speed.',
    signal: 'Low resilience + high fragmentation = system overload. Cut scope before you break. Resilience is a leading indicator of burnout risk.',
    leverage: 'Nervous system regulation (gate) directly feeds resilience. If your NS gate is spiked, resilience cannot be high. Fix the body first.',
  },
  {
    dimension: 'Optimism',
    letter: 'O',
    mechanism: 'Realistic, flexible positive attribution. Seligman\'s learned optimism: attribute setbacks to temporary, specific, external causes; attribute success to permanent, pervasive, internal causes.',
    signal: 'Optimism below 3 for 3+ consecutive days is a pattern interrupt signal. You are developing a pessimistic explanatory style that will compound.',
    leverage: 'Review your last 3 wins. Did you attribute them to luck or to your own capability? Reclaim agency over your successes.',
  },
]

export default function CognitionView() {
  const { log, updateField, recentLogs } = useDailyLogContext()
  const [showBriefing, setShowBriefing] = useState(false)

  // Compute PsyCap composite
  const getPsyCapValue = (obj: Record<string, unknown>, key: string): number | undefined => {
    const v = obj[key]
    return typeof v === 'number' ? v : undefined
  }
  const psyCapValues = PSYCAP_FIELDS.map(f => getPsyCapValue(log as unknown as Record<string, unknown>, f.key))
  const filledValues = psyCapValues.filter((v): v is number => v !== undefined && v > 0)
  const psyCapAvg = filledValues.length > 0
    ? filledValues.reduce((s, v) => s + v, 0) / filledValues.length
    : null

  // 7-day trend
  const recentPsyCap = recentLogs.map(l => {
    const vals = PSYCAP_FIELDS.map(f => getPsyCapValue(l as unknown as Record<string, unknown>, f.key)).filter((v): v is number => v !== undefined && v > 0)
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }).filter((v): v is number => v !== null)

  const weekAvg = recentPsyCap.length > 0
    ? recentPsyCap.reduce((s, v) => s + v, 0) / recentPsyCap.length
    : null

  const scoreColor = (val: number | null) => {
    if (val === null) return 'text-ink-muted'
    if (val >= 4) return 'text-green-ink'
    if (val >= 3) return 'text-amber-ink'
    return 'text-red-ink'
  }

  return (
    <div className="p-3 bg-cream">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
        <div className="flex items-center gap-1.5">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            PsyCap
          </h3>
          <button
            onClick={() => setShowBriefing(!showBriefing)}
            className="w-4 h-4 rounded-sm border border-rule flex items-center justify-center hover:border-burgundy hover:text-burgundy transition-colors"
            title="HERO Framework Briefing"
          >
            <span className="font-serif text-[9px] font-semibold text-ink-muted">i</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-muted">HERO</span>
          <span className={`font-mono text-[14px] font-bold ${scoreColor(psyCapAvg)}`}>
            {psyCapAvg !== null ? psyCapAvg.toFixed(1) : '—'}
          </span>
          {weekAvg !== null && (
            <span className="font-mono text-[10px] text-ink-muted">
              7d: {weekAvg.toFixed(1)}
            </span>
          )}
          {/* Inline sparkline */}
          {recentPsyCap.length > 0 && (
            <div className="flex items-end gap-px h-4 ml-1">
              {recentPsyCap.map((v, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-t-sm ${
                    v >= 4 ? 'bg-green-ink' : v >= 3 ? 'bg-amber-ink' : 'bg-red-ink'
                  }`}
                  style={{ height: `${(v / 5) * 100}%` }}
                  title={v.toFixed(1)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* HERO Briefing Panel */}
      {showBriefing && (
        <div className="mb-3 bg-paper border border-rule rounded-sm overflow-hidden">
          <div className="px-2.5 py-1.5 border-b border-rule-light">
            <div className="flex items-center justify-between">
              <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                HERO Framework — Luthans PsyCap (2007)
              </span>
              <button onClick={() => setShowBriefing(false)} className="text-ink-muted hover:text-burgundy text-[11px]">
                &times;
              </button>
            </div>
            <p className="font-sans text-[10px] text-ink-muted mt-0.5 leading-relaxed">
              State-like psychological resources that are measurable, developable, and causally linked to performance.
              Unlike trait personality, PsyCap moves — and you can move it deliberately.
            </p>
          </div>
          <div className="divide-y divide-rule-light">
            {HERO_BRIEFING.map((item) => (
              <div key={item.letter} className="px-2.5 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-mono text-[10px] font-bold text-burgundy bg-burgundy-bg px-1 py-0.5 rounded-sm">
                    {item.letter}
                  </span>
                  <span className="font-serif text-[11px] font-semibold text-burgundy">{item.dimension}</span>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="font-mono text-[8px] uppercase text-ink-muted tracking-wide">Mechanism</span>
                    <p className="font-sans text-[10px] text-ink-muted leading-relaxed">{item.mechanism}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[8px] uppercase text-amber-ink tracking-wide">Signal</span>
                    <p className="font-sans text-[10px] text-ink-muted leading-relaxed">{item.signal}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[8px] uppercase text-green-ink tracking-wide">Leverage</span>
                    <p className="font-sans text-[10px] text-ink-muted leading-relaxed">{item.leverage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PsyCap Inputs — 2x2 grid */}
      <div className="grid grid-cols-2 gap-2">
        {PSYCAP_FIELDS.map((field) => {
          const value = getPsyCapValue(log as unknown as Record<string, unknown>, field.key) ?? 0
          return (
            <div key={field.key} className="p-2 bg-paper border border-rule rounded-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif text-[11px] font-semibold text-burgundy">{field.label}</span>
                <span className={`font-mono text-[12px] font-bold ${scoreColor(value || null)}`}>
                  {value > 0 ? value : '—'}
                </span>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => updateField(field.key as keyof typeof log, n)}
                    className={`flex-1 font-mono text-[10px] py-1 rounded-sm border transition-colors ${
                      value === n
                        ? n >= 4 ? 'bg-green-ink text-paper border-green-ink'
                          : n >= 3 ? 'bg-amber-ink text-paper border-amber-ink'
                          : 'bg-red-ink text-paper border-red-ink'
                        : 'bg-paper text-ink-muted border-rule hover:border-ink-faint'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cognitive Load — inline row */}
      <div className="mt-2 pt-2 border-t border-rule-light flex items-center gap-3">
        <span className="font-serif text-[10px] text-ink-muted uppercase tracking-wide shrink-0">Load</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-ink-muted">Frag</span>
          <span className={`font-mono text-[12px] font-bold ${
            (log.rewardScore?.components?.fragmentation ?? 0) <= 0.2 ? 'text-green-ink'
              : (log.rewardScore?.components?.fragmentation ?? 0) <= 0.5 ? 'text-amber-ink'
              : 'text-red-ink'
          }`}>
            {log.rewardScore?.components?.fragmentation !== undefined
              ? (log.rewardScore.components.fragmentation * 100).toFixed(0) + '%'
              : '—'}
          </span>
        </div>
        <div className="w-px h-3 bg-rule" />
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-ink-muted">Focus</span>
          <span className={`font-mono text-[12px] font-bold ${
            (log.focusHoursActual || 0) >= (log.focusHoursTarget || 6) * 0.8 ? 'text-green-ink'
              : (log.focusHoursActual || 0) >= (log.focusHoursTarget || 6) * 0.5 ? 'text-amber-ink'
              : 'text-red-ink'
          }`}>
            {log.focusHoursActual || 0}/{log.focusHoursTarget || 6}h
          </span>
        </div>
      </div>
    </div>
  )
}
