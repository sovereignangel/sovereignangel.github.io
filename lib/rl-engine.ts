import type { DailyLog, ActionType } from './types'
import type {
  RLState,
  RLTransition,
  StateClusterLabel,
  StateCluster,
  ValueEstimate,
  PolicyRule,
  STATE_CLUSTER_DISPLAY,
} from './types/rl'

// ─── STATE EXTRACTION ─────────────────────────────────────────────────

/** Extract a 10-dimensional state vector from a daily log's reward components */
export function logToState(log: Partial<DailyLog>): RLState | null {
  const c = log.rewardScore?.components
  if (!c) return null
  return {
    ge: c.ge,
    gi: c.gi,
    gvc: c.gvc,
    kappa: c.kappa,
    optionality: c.optionality,
    gd: c.gd,
    gn: c.gn,
    j: c.j,
    sigma: c.sigma,
    gate: c.gate,
  }
}

/** Extract actions from a daily log */
export function logToActions(log: Partial<DailyLog>): ActionType[] {
  if (Array.isArray(log.actionType)) return log.actionType.filter(Boolean)
  if (log.actionType) return [log.actionType]
  return []
}

// ─── STATE CLASSIFICATION ─────────────────────────────────────────────

/** Rule-based state classification. Priority order matters — checked top to bottom. */
export function classifyState(s: RLState): StateClusterLabel {
  // 1. Spiked dominates everything
  if (s.gate < 1.0) return 'spiked_gated'

  // 2. Cold start: most components near floor
  const vals = [s.ge, s.gi, s.gvc, s.kappa, s.gd, s.gn, s.j, s.sigma]
  const belowThreshold = vals.filter(v => v < 0.3).length
  if (belowThreshold >= 5) return 'cold_start'

  // 3. Low energy recovery
  if (s.ge < 0.4) return 'low_energy_recovery'

  // 4. Peak performance: all core components high
  if (vals.every(v => v > 0.7)) return 'peak_performance'

  // 5. High energy shipping
  if (s.ge > 0.7 && s.gvc > 0.7) return 'high_energy_shipping'

  // 6. Intelligence gathering
  if (s.gi > 0.7 && s.gd > 0.7) return 'intelligence_gathering'

  // 7. Revenue hunting
  if (s.kappa > 0.7 && s.gn > 0.5) return 'revenue_hunting'

  // 8. Balanced steady
  if (vals.every(v => v >= 0.3 && v <= 0.8)) return 'balanced_steady'

  // 9. Default: fragmented/scattered
  return 'fragmented_scattered'
}

// ─── TRANSITION EXTRACTION ────────────────────────────────────────────

/** Build (s, a, r, s') tuples from consecutive daily logs */
export function computeTransitions(logs: Partial<DailyLog>[]): RLTransition[] {
  // Sort ascending by date
  const sorted = [...logs]
    .filter(l => l.date && l.rewardScore)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const transitions: RLTransition[] = []

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i]
    const nextLog = i < sorted.length - 1 ? sorted[i + 1] : null

    const state = logToState(log)
    if (!state) continue

    const nextState = nextLog ? logToState(nextLog) : null

    transitions.push({
      date: log.date || '',
      state,
      actions: logToActions(log),
      reward: log.rewardScore?.score ?? 0,
      nextState,
      nextReward: nextLog?.rewardScore?.score ?? null,
      tdError: null, // enriched later by computeTDErrors
      cluster: classifyState(state),
      nextCluster: nextState ? classifyState(nextState) : null,
    })
  }

  return transitions
}

// ─── VALUE FUNCTION (MONTE CARLO) ─────────────────────────────────────

const DEFAULT_GAMMA = 0.9
const DEFAULT_HORIZON = 7

/** Compute V(s) per state cluster using Monte Carlo first-visit estimation */
export function computeValueEstimates(
  transitions: RLTransition[],
  gamma: number = DEFAULT_GAMMA,
  horizon: number = DEFAULT_HORIZON
): ValueEstimate[] {
  // Group transitions by cluster
  const clusterReturns: Record<string, number[]> = {}

  for (let i = 0; i < transitions.length; i++) {
    const cluster = transitions[i].cluster

    // Compute discounted forward return: G_t = sum(gamma^k * r_{t+k})
    let G = 0
    const maxK = Math.min(horizon, transitions.length - i)
    for (let k = 0; k < maxK; k++) {
      G += Math.pow(gamma, k) * transitions[i + k].reward
    }

    if (!clusterReturns[cluster]) clusterReturns[cluster] = []
    clusterReturns[cluster].push(G)
  }

  // Compute estimates per cluster
  const estimates: ValueEstimate[] = []

  for (const [cluster, returns] of Object.entries(clusterReturns)) {
    const n = returns.length
    const v = returns.reduce((s, r) => s + r, 0) / n
    const confidence = Math.min(n / 10, 1.0)

    estimates.push({
      cluster: cluster as StateClusterLabel,
      v,
      n,
      confidence,
      trajectory: [], // computed separately if needed
    })
  }

  // Sort by V(s) descending
  estimates.sort((a, b) => b.v - a.v)

  return estimates
}

/** Compute state clusters with centroid and forward return statistics */
export function computeStateClusters(transitions: RLTransition[]): StateCluster[] {
  const groups: Record<string, { transitions: RLTransition[]; forwardReturns: number[] }> = {}

  for (let i = 0; i < transitions.length; i++) {
    const t = transitions[i]
    if (!groups[t.cluster]) groups[t.cluster] = { transitions: [], forwardReturns: [] }
    groups[t.cluster].transitions.push(t)

    // 7-day forward return
    let G = 0
    const maxK = Math.min(DEFAULT_HORIZON, transitions.length - i)
    for (let k = 0; k < maxK; k++) {
      G += Math.pow(DEFAULT_GAMMA, k) * transitions[i + k].reward
    }
    if (maxK >= 3) { // Only count if we have at least 3 days of forward data
      groups[t.cluster].forwardReturns.push(G)
    }
  }

  const clusters: StateCluster[] = []

  for (const [label, group] of Object.entries(groups)) {
    const { transitions: ts, forwardReturns } = group

    // Compute centroid (average state)
    const centroid: RLState = { ge: 0, gi: 0, gvc: 0, kappa: 0, optionality: 0, gd: 0, gn: 0, j: 0, sigma: 0, gate: 0 }
    for (const t of ts) {
      for (const key of Object.keys(centroid) as (keyof RLState)[]) {
        centroid[key] += t.state[key]
      }
    }
    for (const key of Object.keys(centroid) as (keyof RLState)[]) {
      centroid[key] /= ts.length
    }

    const avgForward = forwardReturns.length > 0
      ? forwardReturns.reduce((s, v) => s + v, 0) / forwardReturns.length
      : null
    const stdForward = forwardReturns.length > 1
      ? Math.sqrt(forwardReturns.reduce((s, v) => s + Math.pow(v - (avgForward || 0), 2), 0) / (forwardReturns.length - 1))
      : null

    clusters.push({
      label: label as StateClusterLabel,
      dayCount: ts.length,
      dates: ts.map(t => t.date),
      centroid,
      avgForwardReturn: avgForward,
      stdForwardReturn: stdForward,
      avgImmediateReward: ts.reduce((s, t) => s + t.reward, 0) / ts.length,
    })
  }

  // Sort by avgForwardReturn descending
  clusters.sort((a, b) => (b.avgForwardReturn ?? 0) - (a.avgForwardReturn ?? 0))

  return clusters
}

// ─── TD ERRORS ────────────────────────────────────────────────────────

/** Enrich transitions with TD errors: delta = r + gamma * V(s') - V(s) */
export function computeTDErrors(
  transitions: RLTransition[],
  valueEstimates: ValueEstimate[],
  gamma: number = DEFAULT_GAMMA
): RLTransition[] {
  const valueMap = new Map<string, number>()
  for (const ve of valueEstimates) {
    valueMap.set(ve.cluster, ve.v)
  }

  return transitions.map(t => {
    if (!t.nextCluster) return { ...t, tdError: null }

    const vCurrent = valueMap.get(t.cluster) ?? 0
    const vNext = valueMap.get(t.nextCluster) ?? 0
    const tdError = Math.round((t.reward + gamma * vNext - vCurrent) * 100) / 100

    return { ...t, tdError }
  })
}

// ─── POLICY EVALUATION ────────────────────────────────────────────────

/** Check if a policy rule's conditions are met for a given state */
function ruleMatchesState(rule: PolicyRule, state: RLState): boolean {
  return rule.conditions.every(cond => {
    const val = state[cond.component]
    switch (cond.operator) {
      case '>': return val > cond.value
      case '<': return val < cond.value
      case '>=': return val >= cond.value
      case '<=': return val <= cond.value
      default: return false
    }
  })
}

/** Evaluate policy rules against historical transitions. Returns updated rules with evidence. */
export function evaluatePolicyRules(
  rules: PolicyRule[],
  transitions: RLTransition[]
): PolicyRule[] {
  return rules.map(rule => {
    let matchCount = 0
    let followedCount = 0
    const followedRewards: number[] = []
    const ignoredRewards: number[] = []

    for (const t of transitions) {
      if (!ruleMatchesState(rule, t.state)) continue
      matchCount++

      if (t.actions.includes(rule.action)) {
        followedCount++
        followedRewards.push(t.reward)
      } else {
        ignoredRewards.push(t.reward)
      }
    }

    return {
      ...rule,
      matchCount,
      followedCount,
      avgRewardWhenFollowed: followedRewards.length > 0
        ? Math.round(followedRewards.reduce((s, v) => s + v, 0) / followedRewards.length * 100) / 100
        : null,
      avgRewardWhenIgnored: ignoredRewards.length > 0
        ? Math.round(ignoredRewards.reduce((s, v) => s + v, 0) / ignoredRewards.length * 100) / 100
        : null,
    }
  })
}

/** Suggest an action for the current state based on active policy rules */
export function suggestActionForState(
  state: RLState,
  rules: PolicyRule[]
): { action: ActionType; ruleName: string } | null {
  // Find all matching rules, prefer the one with highest evidence
  const matches = rules
    .filter(r => r.isActive && ruleMatchesState(r, state))
    .sort((a, b) => {
      // Sort by avgRewardWhenFollowed descending, then by matchCount
      const aReward = a.avgRewardWhenFollowed ?? 0
      const bReward = b.avgRewardWhenFollowed ?? 0
      if (bReward !== aReward) return bReward - aReward
      return b.matchCount - a.matchCount
    })

  if (matches.length === 0) return null
  return { action: matches[0].action, ruleName: matches[0].name }
}

// ─── ACTION STATISTICS ────────────────────────────────────────────────

/** Compute summary statistics per action type */
export function computeActionStats(
  transitions: RLTransition[]
): Record<ActionType, { count: number; avgReward: number }> {
  const stats: Record<string, { total: number; count: number }> = {}
  const allActions: ActionType[] = ['ship', 'ask', 'signal', 'regulate', 'explore', 'compound']

  for (const a of allActions) {
    stats[a] = { total: 0, count: 0 }
  }

  for (const t of transitions) {
    for (const a of t.actions) {
      if (stats[a]) {
        stats[a].count++
        stats[a].total += t.reward
      }
    }
  }

  const result: Record<string, { count: number; avgReward: number }> = {}
  for (const a of allActions) {
    result[a] = {
      count: stats[a].count,
      avgReward: stats[a].count > 0 ? Math.round(stats[a].total / stats[a].count * 100) / 100 : 0,
    }
  }

  return result as Record<ActionType, { count: number; avgReward: number }>
}

/** Compute exploration ratio: days with 'explore' action / total days */
export function computeExplorationRatio(transitions: RLTransition[]): number {
  if (transitions.length === 0) return 0
  const exploreDays = transitions.filter(t => t.actions.includes('explore')).length
  return Math.round(exploreDays / transitions.length * 100) / 100
}

// ─── REWARD COMPONENT STATISTICS ──────────────────────────────────────

export interface ComponentStats {
  component: string
  mean: number
  min: number
  max: number
  std: number
  atFloor: boolean  // mean < 0.15
  atCeiling: boolean  // mean > 0.85
  volatile: boolean  // std > 0.25
}

/** Compute per-component statistics across transitions */
export function computeComponentStats(transitions: RLTransition[]): ComponentStats[] {
  if (transitions.length === 0) return []

  const components: (keyof RLState)[] = ['ge', 'gi', 'gvc', 'kappa', 'optionality', 'gd', 'gn', 'j', 'sigma']

  return components.map(comp => {
    const values = transitions.map(t => t.state[comp])
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length)

    return {
      component: comp,
      mean: Math.round(mean * 1000) / 1000,
      min: Math.round(min * 1000) / 1000,
      max: Math.round(max * 1000) / 1000,
      std: Math.round(std * 1000) / 1000,
      atFloor: mean < 0.15,
      atCeiling: mean > 0.85,
      volatile: std > 0.25,
    }
  })
}
