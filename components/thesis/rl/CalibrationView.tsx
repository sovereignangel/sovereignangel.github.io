'use client'

import { useMemo } from 'react'
import { useRLTransitions } from '@/hooks/useRLTransitions'
import { useRLValueFunction } from '@/hooks/useRLValueFunction'
import { computeComponentStats } from '@/lib/rl-engine'
import type { RLTransition } from '@/lib/types/rl'

// ─── CALIBRATION METRICS ─────────────────────────────────────────────

/** How well does each component discriminate good days from bad? */
function computeDiscrimination(transitions: RLTransition[]) {
  if (transitions.length < 7) return []

  const componentKeys = [
    'sleep', 'movement', 'regulation',
    'gi', 'gd', 'sigma', 'j',
    'gvc', 'kappa', 'gn', 'optionality',
  ] as const

  const medianReward = [...transitions]
    .sort((a, b) => a.reward - b.reward)[Math.floor(transitions.length / 2)].reward

  return componentKeys.map(key => {
    const goodDays = transitions.filter(t => t.reward >= medianReward)
    const badDays = transitions.filter(t => t.reward < medianReward)

    const goodMean = goodDays.length > 0
      ? goodDays.reduce((s, t) => s + (t.state[key] ?? 0), 0) / goodDays.length : 0
    const badMean = badDays.length > 0
      ? badDays.reduce((s, t) => s + (t.state[key] ?? 0), 0) / badDays.length : 0

    // Separation: how different is this component on good vs bad days?
    const separation = goodMean - badMean

    // Variance within groups (pooled)
    const goodVar = goodDays.length > 1
      ? goodDays.reduce((s, t) => s + Math.pow((t.state[key] ?? 0) - goodMean, 2), 0) / (goodDays.length - 1)
      : 0.01
    const badVar = badDays.length > 1
      ? badDays.reduce((s, t) => s + Math.pow((t.state[key] ?? 0) - badMean, 2), 0) / (badDays.length - 1)
      : 0.01

    // Cohen's d: standardized effect size
    const pooledStd = Math.sqrt((goodVar + badVar) / 2) || 0.01
    const cohensD = separation / pooledStd

    return { key, goodMean, badMean, separation, cohensD }
  }).sort((a, b) => Math.abs(b.cohensD) - Math.abs(a.cohensD))
}

/** Score-reward autocorrelation: does today's score predict tomorrow's? */
function computeAutocorrelation(transitions: RLTransition[]) {
  const pairs = transitions
    .filter(t => t.nextReward !== null)
    .map(t => ({ today: t.reward, tomorrow: t.nextReward! }))

  if (pairs.length < 5) return null

  const meanToday = pairs.reduce((s, p) => s + p.today, 0) / pairs.length
  const meanTomorrow = pairs.reduce((s, p) => s + p.tomorrow, 0) / pairs.length

  let covXY = 0, varX = 0, varY = 0
  for (const p of pairs) {
    covXY += (p.today - meanToday) * (p.tomorrow - meanTomorrow)
    varX += Math.pow(p.today - meanToday, 2)
    varY += Math.pow(p.tomorrow - meanTomorrow, 2)
  }

  if (varX === 0 || varY === 0) return 0
  return covXY / Math.sqrt(varX * varY)
}

/** Equal-weight benchmark: what would scores look like if all 11 components had equal weight?
 *  Compare to geometric mean — they ARE equal weight, so this measures whether they SHOULD be. */
function computeWeightSensitivity(transitions: RLTransition[]) {
  if (transitions.length < 7) return []

  const componentKeys = [
    'sleep', 'movement', 'regulation',
    'gi', 'gd', 'sigma', 'j',
    'gvc', 'kappa', 'gn', 'optionality',
  ] as const

  // For each component, compute: correlation with total score
  // Components with high correlation are "driving" the score
  // Components with low correlation are dead weight
  return componentKeys.map(key => {
    const values = transitions.map(t => ({ comp: t.state[key] ?? 0, score: t.reward }))
    const meanComp = values.reduce((s, v) => s + v.comp, 0) / values.length
    const meanScore = values.reduce((s, v) => s + v.score, 0) / values.length

    let covXY = 0, varX = 0, varY = 0
    for (const v of values) {
      covXY += (v.comp - meanComp) * (v.score - meanScore)
      varX += Math.pow(v.comp - meanComp, 2)
      varY += Math.pow(v.score - meanScore, 2)
    }

    const correlation = (varX > 0 && varY > 0) ? covXY / Math.sqrt(varX * varY) : 0

    // Implied weight: if correlation is the "importance" signal,
    // what does the data say about how much each component matters?
    return { key, correlation, impliedWeight: Math.abs(correlation) }
  }).sort((a, b) => b.impliedWeight - a.impliedWeight)
}

/** Coverage: what fraction of state-action space have we visited? */
function computeCoverage(transitions: RLTransition[]) {
  const clusters = new Set(transitions.map(t => t.cluster))
  const actions = new Set(transitions.flatMap(t => t.actions))

  // State-action pairs observed
  const pairsObserved = new Set<string>()
  for (const t of transitions) {
    for (const a of t.actions) {
      pairsObserved.add(`${t.cluster}:${a}`)
    }
  }

  // Total possible: 9 clusters * 6 actions = 54
  const totalPossible = 9 * 6

  return {
    clustersVisited: clusters.size,
    totalClusters: 9,
    actionsUsed: actions.size,
    totalActions: 6,
    pairsObserved: pairsObserved.size,
    totalPairs: totalPossible,
    coverageRatio: pairsObserved.size / totalPossible,
  }
}

// ─── CONVERGENCE ESTIMATE ─────────────────────────────────────────────

/** Estimate how close we are to having enough data for inverse RL.
 *  NOT based on a fixed day count — based on actual coverage and stability. */
function computeConvergenceSignals(transitions: RLTransition[]) {
  const n = transitions.length
  const coverage = computeCoverage(transitions)

  // Signal 1: Data volume (need ~90 diverse transitions for meaningful statistics)
  const volumeScore = Math.min(n / 90, 1)

  // Signal 2: Coverage breadth (need to visit diverse state-action pairs)
  const coverageScore = coverage.coverageRatio

  // Signal 3: Temporal depth (need enough data to see multi-day patterns)
  // Approximated by: do we have enough for 7-day rolling windows?
  const windowsAvailable = Math.max(0, n - 7)
  const depthScore = Math.min(windowsAvailable / 30, 1) // 30 rolling windows = good

  // Signal 4: Weight stability — if we split data in half, do correlations agree?
  let stabilityScore = 0
  if (n >= 20) {
    const half = Math.floor(n / 2)
    const firstHalf = transitions.slice(0, half)
    const secondHalf = transitions.slice(half)
    const firstWeights = computeWeightSensitivity(firstHalf)
    const secondWeights = computeWeightSensitivity(secondHalf)

    // Compare rank orders
    let rankAgreement = 0
    const firstRank = firstWeights.map(w => w.key)
    const secondRank = secondWeights.map(w => w.key)
    for (let i = 0; i < Math.min(5, firstRank.length); i++) {
      if (secondRank.indexOf(firstRank[i]) < 5) rankAgreement++
    }
    stabilityScore = rankAgreement / 5
  }

  // Overall readiness (geometric mean — all signals matter)
  const signals = [volumeScore, coverageScore, depthScore, stabilityScore].filter(s => s > 0)
  const readiness = signals.length > 0
    ? Math.pow(signals.reduce((p, s) => p * Math.max(s, 0.01), 1), 1 / signals.length)
    : 0

  return {
    volumeScore,
    coverageScore,
    depthScore,
    stabilityScore,
    readiness,
    n,
    coverage,
  }
}

// ─── COMPONENT ────────────────────────────────────────────────────────

export default function CalibrationView() {
  const { transitions, loading } = useRLTransitions(90)
  const { enrichedTransitions } = useRLValueFunction(transitions)

  const discrimination = useMemo(() => computeDiscrimination(enrichedTransitions), [enrichedTransitions])
  const autocorrelation = useMemo(() => computeAutocorrelation(enrichedTransitions), [enrichedTransitions])
  const weightSensitivity = useMemo(() => computeWeightSensitivity(enrichedTransitions), [enrichedTransitions])
  const convergence = useMemo(() => computeConvergenceSignals(enrichedTransitions), [enrichedTransitions])
  const componentStats = useMemo(() => computeComponentStats(enrichedTransitions), [enrichedTransitions])

  if (loading) {
    return <div className="flex items-center justify-center h-32 text-[10px] text-ink-muted font-sans">Loading calibration data...</div>
  }

  if (enrichedTransitions.length < 5) {
    return (
      <div className="text-center py-6">
        <p className="text-[11px] text-ink-muted font-sans">
          Need at least 5 days of transition data to compute calibration metrics.
        </p>
        <p className="text-[10px] text-ink-faint font-sans mt-1">
          Current: {enrichedTransitions.length} transitions
        </p>
      </div>
    )
  }

  const readinessColor = convergence.readiness >= 0.7 ? 'text-green-ink' : convergence.readiness >= 0.4 ? 'text-amber-ink' : 'text-red-ink'
  const readinessBarColor = convergence.readiness >= 0.7 ? 'bg-green-ink' : convergence.readiness >= 0.4 ? 'bg-amber-ink' : 'bg-red-ink'

  // Normalize implied weights for display
  const totalImplied = weightSensitivity.reduce((s, w) => s + w.impliedWeight, 0) || 1
  const equalWeight = 1 / 11 // what each component "should" be under equal weighting

  return (
    <div className="space-y-2">
      {/* Convergence / Readiness */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Inverse RL Readiness
        </h4>
        <p className="font-sans text-[9px] text-ink-muted mb-2">
          How close are we to having enough data to recover the &ldquo;true&rdquo; reward weights? Based on four signals: data volume, state-action coverage, temporal depth, and weight stability across data splits.
        </p>

        {/* Main readiness gauge */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`font-mono text-[28px] font-bold ${readinessColor}`}>
            {(convergence.readiness * 100).toFixed(0)}%
          </div>
          <div className="flex-1">
            <div className="h-2 bg-cream rounded-sm overflow-hidden">
              <div className={`h-full rounded-sm transition-all ${readinessBarColor}`} style={{ width: `${convergence.readiness * 100}%` }} />
            </div>
            <div className="font-mono text-[8px] text-ink-muted mt-0.5">
              {convergence.n} transitions collected
            </div>
          </div>
        </div>

        {/* Sub-signals */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Volume', value: convergence.volumeScore, detail: `${convergence.n}/90 transitions` },
            { label: 'Coverage', value: convergence.coverageScore, detail: `${convergence.coverage.pairsObserved}/${convergence.coverage.totalPairs} state-action pairs` },
            { label: 'Depth', value: convergence.depthScore, detail: `${Math.max(0, convergence.n - 7)} rolling windows` },
            { label: 'Stability', value: convergence.stabilityScore, detail: convergence.n >= 20 ? 'Split-half rank agreement' : 'Need 20+ days' },
          ].map(sig => (
            <div key={sig.label} className="text-center">
              <div className={`font-mono text-[14px] font-bold ${sig.value >= 0.7 ? 'text-green-ink' : sig.value >= 0.4 ? 'text-amber-ink' : 'text-red-ink'}`}>
                {(sig.value * 100).toFixed(0)}%
              </div>
              <div className="font-sans text-[9px] font-medium text-ink">{sig.label}</div>
              <div className="font-mono text-[7px] text-ink-faint">{sig.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Implied vs Equal Weights */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-1.5 border-b-2 border-rule">
          Implied Weights vs Equal
        </h4>
        <p className="font-sans text-[9px] text-ink-muted mb-2">
          The geometric mean gives each component equal weight (1/11 = {(equalWeight * 100).toFixed(1)}%). The data implies different weights based on score correlation. Large divergence = the function may be mis-weighted.
        </p>

        <div className="space-y-1">
          {weightSensitivity.map(w => {
            const impliedPct = (w.impliedWeight / totalImplied) * 100
            const equalPct = equalWeight * 100
            const divergence = impliedPct - equalPct
            const divergenceColor = Math.abs(divergence) > 5 ? 'text-amber-ink' : 'text-ink-muted'

            return (
              <div key={w.key} className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase text-ink w-[80px]">{w.key}</span>
                <div className="flex-1 h-1.5 bg-cream rounded-sm overflow-hidden relative">
                  {/* Equal weight marker */}
                  <div className="absolute h-full w-px bg-ink-faint" style={{ left: `${equalPct * 100 / 20}%` }} />
                  {/* Implied weight bar */}
                  <div
                    className={`h-full rounded-sm ${divergence > 3 ? 'bg-amber-ink' : divergence < -3 ? 'bg-ink-faint' : 'bg-green-ink'}`}
                    style={{ width: `${Math.min(impliedPct * 100 / 20, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[8px] text-ink w-[30px] text-right">{impliedPct.toFixed(1)}%</span>
                <span className={`font-mono text-[8px] w-[35px] text-right ${divergenceColor}`}>
                  {divergence >= 0 ? '+' : ''}{divergence.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-2 pt-1.5 border-t border-rule-light">
          <p className="font-sans text-[9px] text-ink-muted">
            <strong>Reading this:</strong> Components with high implied weight drive your score variation the most.
            If a component has low implied weight, it&apos;s not distinguishing your days &mdash; either it&apos;s always the same value,
            or it varies independently of overall performance.
          </p>
        </div>
      </div>

      {/* Discrimination: good days vs bad days */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-1.5 border-b-2 border-rule">
          Component Discrimination
        </h4>
        <p className="font-sans text-[9px] text-ink-muted mb-2">
          Cohen&apos;s d: how different is each component on above-median vs below-median reward days?
          |d| &gt; 0.8 = strong discrimination, |d| &lt; 0.2 = component isn&apos;t separating good from bad days.
        </p>

        <div className="space-y-1">
          {discrimination.map(d => {
            const strength = Math.abs(d.cohensD) >= 0.8 ? 'Strong' : Math.abs(d.cohensD) >= 0.5 ? 'Medium' : Math.abs(d.cohensD) >= 0.2 ? 'Weak' : 'None'
            const strengthColor = strength === 'Strong' ? 'text-green-ink' : strength === 'Medium' ? 'text-amber-ink' : 'text-red-ink'

            return (
              <div key={d.key} className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase text-ink w-[80px]">{d.key}</span>
                <div className="flex items-center gap-1 flex-1">
                  <span className="font-mono text-[8px] text-red-ink w-[28px] text-right">{d.badMean.toFixed(2)}</span>
                  <div className="flex-1 h-1 bg-cream rounded-sm relative">
                    <div
                      className="absolute h-full bg-red-ink/30 rounded-sm"
                      style={{ width: `${d.badMean * 100}%` }}
                    />
                    <div
                      className="absolute h-full bg-green-ink/30 rounded-sm"
                      style={{ left: `${d.badMean * 100}%`, width: `${Math.max(0, (d.goodMean - d.badMean)) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[8px] text-green-ink w-[28px]">{d.goodMean.toFixed(2)}</span>
                </div>
                <span className={`font-mono text-[8px] font-semibold w-[24px] text-right ${strengthColor}`}>
                  {d.cohensD.toFixed(1)}
                </span>
                <span className={`font-mono text-[7px] w-[36px] ${strengthColor}`}>{strength}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Score Autocorrelation */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-1.5 border-b-2 border-rule">
          Score Persistence
        </h4>
        <p className="font-sans text-[9px] text-ink-muted mb-2">
          Autocorrelation: how much does today&apos;s score predict tomorrow&apos;s?
          High (&gt;0.7) = scores are sticky (slow-moving state). Low (&lt;0.3) = scores are noisy (measurement error or volatile behavior).
        </p>

        {autocorrelation !== null ? (
          <div className="flex items-center gap-3">
            <div className={`font-mono text-[20px] font-bold ${
              autocorrelation >= 0.7 ? 'text-green-ink' :
              autocorrelation >= 0.3 ? 'text-amber-ink' : 'text-red-ink'
            }`}>
              {autocorrelation.toFixed(2)}
            </div>
            <div className="flex-1">
              <div className="h-2 bg-cream rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm ${
                    autocorrelation >= 0.7 ? 'bg-green-ink' :
                    autocorrelation >= 0.3 ? 'bg-amber-ink' : 'bg-red-ink'
                  }`}
                  style={{ width: `${Math.max(0, autocorrelation) * 100}%` }}
                />
              </div>
              <div className="font-sans text-[9px] text-ink-muted mt-0.5">
                {autocorrelation >= 0.7
                  ? 'Scores are persistent. State matters more than daily noise.'
                  : autocorrelation >= 0.3
                  ? 'Moderate persistence. Mix of state and daily variation.'
                  : 'Low persistence. High daily variance — function may be too noisy or behavior is genuinely volatile.'
                }
              </div>
            </div>
          </div>
        ) : (
          <p className="font-sans text-[10px] text-ink-faint">Need more consecutive-day data to compute.</p>
        )}
      </div>

      {/* State-Action Coverage Map */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-1.5 border-b-2 border-rule">
          Exploration Coverage
        </h4>
        <p className="font-sans text-[9px] text-ink-muted mb-2">
          To learn which actions work in which states, you need to visit diverse state-action combinations.
          Gaps = blind spots where the model can&apos;t make recommendations.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center">
            <div className="font-mono text-[14px] font-bold text-ink">
              {convergence.coverage.clustersVisited}/{convergence.coverage.totalClusters}
            </div>
            <div className="font-sans text-[9px] text-ink-muted">States Visited</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[14px] font-bold text-ink">
              {convergence.coverage.actionsUsed}/{convergence.coverage.totalActions}
            </div>
            <div className="font-sans text-[9px] text-ink-muted">Actions Used</div>
          </div>
          <div className="text-center">
            <div className={`font-mono text-[14px] font-bold ${convergence.coverage.coverageRatio >= 0.5 ? 'text-green-ink' : 'text-amber-ink'}`}>
              {(convergence.coverage.coverageRatio * 100).toFixed(0)}%
            </div>
            <div className="font-sans text-[9px] text-ink-muted">Pair Coverage</div>
          </div>
        </div>
      </div>

      {/* Component Health (at floor/ceiling) */}
      {componentStats.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-1.5 border-b-2 border-rule">
            Scoring Curve Health
          </h4>
          <p className="font-sans text-[9px] text-ink-muted mb-2">
            Components stuck at floor or ceiling aren&apos;t informative. They need threshold recalibration.
          </p>

          {componentStats.filter(c => c.atFloor || c.atCeiling).length > 0 ? (
            <div className="space-y-1">
              {componentStats.filter(c => c.atFloor || c.atCeiling).map(c => (
                <div key={c.component} className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase text-ink w-[80px]">{c.component}</span>
                  <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded-sm border ${
                    c.atFloor ? 'text-red-ink bg-red-ink/5 border-red-ink/10' : 'text-amber-ink bg-amber-bg border-amber-ink/10'
                  }`}>
                    {c.atFloor ? 'FLOOR' : 'CEILING'} &mdash; mean {c.mean.toFixed(2)}, {c.atFloor ? 'not discriminating' : 'gaming risk'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-[10px] text-green-ink">All components in healthy scoring range.</p>
          )}
        </div>
      )}
    </div>
  )
}
