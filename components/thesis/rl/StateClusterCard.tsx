'use client'

import type { StateCluster, ValueEstimate } from '@/lib/types'
import { STATE_CLUSTER_DISPLAY } from '@/lib/types/rl'

const COMPONENT_LABELS: Record<string, string> = {
  ge: 'GE', gi: 'GI', gvc: 'GVC', kappa: '\u03BA', optionality: 'O',
  gd: 'GD', gn: 'GN', j: 'J', sigma: '\u03A3', gate: 'Gate',
}

function barColor(val: number): string {
  if (val >= 0.7) return 'bg-green-ink'
  if (val >= 0.4) return 'bg-amber-ink'
  return 'bg-red-ink'
}

interface StateClusterCardProps {
  cluster: StateCluster
  valueEstimate?: ValueEstimate
  rank: number
}

export default function StateClusterCard({ cluster, valueEstimate, rank }: StateClusterCardProps) {
  const display = STATE_CLUSTER_DISPLAY[cluster.label]
  const v = valueEstimate?.v
  const confidence = valueEstimate?.confidence ?? 0

  return (
    <div className="bg-white border border-rule rounded-sm p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-semibold text-ink-muted w-4">
            #{rank}
          </span>
          <span className="font-serif text-[11px] font-semibold text-ink">
            {display.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {v !== undefined && (
            <span className={`font-mono text-[12px] font-bold ${
              v >= 5 ? 'text-green-ink' : v >= 3 ? 'text-amber-ink' : 'text-red-ink'
            }`}>
              V={v.toFixed(1)}
            </span>
          )}
          <span className="font-mono text-[8px] text-ink-muted">
            n={cluster.dayCount}
          </span>
        </div>
      </div>

      <p className="font-sans text-[9px] text-ink-muted mb-1.5">{display.description}</p>

      {/* Centroid bar chart */}
      <div className="space-y-0.5">
        {(Object.entries(cluster.centroid) as [string, number][])
          .filter(([key]) => key !== 'gate')
          .map(([key, val]) => (
          <div key={key} className="flex items-center gap-1">
            <span className="font-mono text-[8px] text-ink-muted w-5 text-right">{COMPONENT_LABELS[key]}</span>
            <div className="flex-1 h-1.5 bg-cream rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm ${barColor(val)}`}
                style={{ width: `${Math.round(val * 100)}%` }}
              />
            </div>
            <span className="font-mono text-[8px] text-ink-muted w-7 text-right">{val.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Forward return + confidence */}
      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-rule-light">
        <div className="flex items-center gap-2">
          {cluster.avgForwardReturn !== null && (
            <span className="font-mono text-[9px] text-ink-muted">
              7d return: <span className="font-semibold text-ink">{cluster.avgForwardReturn.toFixed(1)}</span>
              {cluster.stdForwardReturn !== null && (
                <span className="text-ink-faint"> \u00B1{cluster.stdForwardReturn.toFixed(1)}</span>
              )}
            </span>
          )}
        </div>
        {confidence > 0 && (
          <span className={`font-mono text-[8px] ${confidence >= 0.7 ? 'text-green-ink' : confidence >= 0.4 ? 'text-amber-ink' : 'text-red-ink'}`}>
            {Math.round(confidence * 100)}% conf
          </span>
        )}
      </div>
    </div>
  )
}
