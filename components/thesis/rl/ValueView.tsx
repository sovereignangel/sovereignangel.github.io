'use client'

import { useRLTransitions } from '@/hooks/useRLTransitions'
import { useRLValueFunction } from '@/hooks/useRLValueFunction'
import StateClusterCard from './StateClusterCard'

export default function ValueView() {
  const { transitions, loading } = useRLTransitions(90)
  const { valueEstimates, clusters } = useRLValueFunction(transitions)

  if (loading) {
    return <div className="flex items-center justify-center h-32 text-[10px] text-ink-muted font-sans">Loading value estimates...</div>
  }

  if (transitions.length === 0) {
    return (
      <div className="text-center py-6 text-[11px] text-ink-muted font-sans">
        Not enough transition data yet. Continue logging daily to build V(s) estimates.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Explanation */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          <strong>V(s)</strong> = &ldquo;How good is it to BE in this state?&rdquo; Computed via Monte Carlo: for each state cluster,
          average the 7-day discounted forward return G_t = {'\u03A3'}(k=0..6) 0.9^k {'\u00B7'} r_{'t+k'}.
          Higher V means better long-term prospects from that state. Confidence increases with sample size (n {'\u2265'} 10 for full confidence).
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-rule rounded-sm p-2 text-center">
          <div className="font-mono text-[14px] font-bold text-ink">{clusters.length}</div>
          <div className="font-sans text-[9px] text-ink-muted">State Clusters</div>
        </div>
        <div className="bg-white border border-rule rounded-sm p-2 text-center">
          <div className="font-mono text-[14px] font-bold text-green-ink">
            {valueEstimates.length > 0 ? valueEstimates[0].v.toFixed(1) : '\u2014'}
          </div>
          <div className="font-sans text-[9px] text-ink-muted">Best V(s)</div>
        </div>
        <div className="bg-white border border-rule rounded-sm p-2 text-center">
          <div className="font-mono text-[14px] font-bold text-red-ink">
            {valueEstimates.length > 0 ? valueEstimates[valueEstimates.length - 1].v.toFixed(1) : '\u2014'}
          </div>
          <div className="font-sans text-[9px] text-ink-muted">Worst V(s)</div>
        </div>
      </div>

      {/* Cluster ranking */}
      <div>
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          State Clusters Ranked by V(s)
        </h4>
        <div className="space-y-2">
          {clusters.map((cluster, idx) => {
            const ve = valueEstimates.find(v => v.cluster === cluster.label)
            return (
              <StateClusterCard
                key={cluster.label}
                cluster={cluster}
                valueEstimate={ve}
                rank={idx + 1}
              />
            )
          })}
        </div>
      </div>

      {/* Bellman insight */}
      <div className="bg-cream border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Bellman Insight
        </h4>
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          The Bellman equation says V(s) = r + {'\u03B3'} {'\u00B7'} V(s&apos;). If the best cluster has V=
          {valueEstimates.length > 0 ? valueEstimates[0].v.toFixed(1) : '?'} and the worst has V=
          {valueEstimates.length > 0 ? valueEstimates[valueEstimates.length - 1].v.toFixed(1) : '?'},
          then <strong>the state you&apos;re in matters as much as what you do today</strong>. Optimizing
          your <em>state transitions</em> (getting to high-value states) may be more important than
          optimizing today&apos;s action.
        </p>
      </div>
    </div>
  )
}
