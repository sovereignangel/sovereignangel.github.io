'use client'

import type { RLTransition } from '@/lib/types'
import { STATE_CLUSTER_DISPLAY } from '@/lib/types/rl'

const COMPONENT_KEYS = ['ge', 'gi', 'gvc', 'kappa', 'gd', 'gn', 'j', 'sigma'] as const

function componentColor(val: number): string {
  if (val >= 0.7) return 'bg-green-ink/20'
  if (val >= 0.4) return 'bg-amber-ink/20'
  return 'bg-red-ink/20'
}

function tdErrorColor(error: number | null): string {
  if (error === null) return 'text-ink-muted'
  if (error > 0.5) return 'text-green-ink'
  if (error > 0) return 'text-green-ink/70'
  if (error > -0.5) return 'text-red-ink/70'
  return 'text-red-ink'
}

interface TransitionRowProps {
  transition: RLTransition
}

export default function TransitionRow({ transition: t }: TransitionRowProps) {
  const clusterInfo = STATE_CLUSTER_DISPLAY[t.cluster]

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 border-b border-rule-light hover:bg-cream/50 transition-colors">
      {/* Date */}
      <span className="font-mono text-[10px] text-ink-muted w-[70px] shrink-0">
        {t.date}
      </span>

      {/* State heatmap (mini) */}
      <div className="flex gap-px shrink-0">
        {COMPONENT_KEYS.map(key => (
          <div
            key={key}
            className={`w-2.5 h-2.5 rounded-sm ${componentColor(t.state[key])}`}
            title={`${key}: ${t.state[key].toFixed(2)}`}
          />
        ))}
      </div>

      {/* Cluster badge */}
      <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border border-rule bg-cream text-ink-muted shrink-0 w-[80px] truncate" title={clusterInfo.name}>
        {clusterInfo.name}
      </span>

      {/* Actions */}
      <div className="flex gap-0.5 shrink-0 w-[80px]">
        {t.actions.length > 0 ? t.actions.map(a => (
          <span key={a} className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
            {a}
          </span>
        )) : (
          <span className="font-mono text-[8px] text-ink-faint">none</span>
        )}
      </div>

      {/* Reward */}
      <span className={`font-mono text-[11px] font-semibold w-[36px] text-right shrink-0 ${
        t.reward >= 7 ? 'text-green-ink' : t.reward >= 4 ? 'text-amber-ink' : 'text-red-ink'
      }`}>
        {t.reward.toFixed(1)}
      </span>

      {/* TD Error */}
      <span className={`font-mono text-[10px] font-medium w-[44px] text-right shrink-0 ${tdErrorColor(t.tdError)}`}>
        {t.tdError !== null ? (t.tdError >= 0 ? '+' : '') + t.tdError.toFixed(2) : '\u2014'}
      </span>

      {/* Gate indicator */}
      {t.state.gate < 1.0 && (
        <span className="font-mono text-[8px] text-red-ink" title={`Gate: ${t.state.gate}`}>
          G{t.state.gate.toFixed(1)}
        </span>
      )}
    </div>
  )
}
