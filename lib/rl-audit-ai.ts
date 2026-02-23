import { callLLM } from './llm'
import type { DailyLog, PolicyRule, ActionType } from './types'
import type { RLTransition, RLWeeklyAudit, ValueEstimate } from './types/rl'
import { computeTransitions, computeValueEstimates, computeTDErrors, computeComponentStats, computeActionStats, type ComponentStats } from './rl-engine'
import { STATE_CLUSTER_DISPLAY } from './types/rl'

interface AuditInput {
  weekLogs: Partial<DailyLog>[]
  allLogs: Partial<DailyLog>[] // 30+ days for context
  policyRules: PolicyRule[]
  weekStart: string
  weekEnd: string
}

export async function generateRLAudit(input: AuditInput): Promise<Partial<RLWeeklyAudit>> {
  const { weekLogs, allLogs, policyRules, weekStart, weekEnd } = input

  // Compute transitions and values
  const allTransitions = computeTransitions(allLogs)
  const valueEstimates = computeValueEstimates(allTransitions)
  const enriched = computeTDErrors(allTransitions, valueEstimates)

  // This week's data
  const weekTransitions = enriched.filter(t => t.date >= weekStart && t.date <= weekEnd)
  const actionStats = computeActionStats(weekTransitions)
  const componentStats = computeComponentStats(weekTransitions)

  // Episode metrics
  const avgReward = weekTransitions.length > 0
    ? weekTransitions.reduce((s, t) => s + t.reward, 0) / weekTransitions.length
    : 0

  // Prior week
  const priorStart = new Date(weekStart)
  priorStart.setDate(priorStart.getDate() - 7)
  const priorStr = priorStart.toISOString().split('T')[0]
  const priorTransitions = enriched.filter(t => t.date >= priorStr && t.date < weekStart)
  const priorAvg = priorTransitions.length > 0
    ? priorTransitions.reduce((s, t) => s + t.reward, 0) / priorTransitions.length
    : null

  // 4-week average
  const fourWeekStart = new Date(weekStart)
  fourWeekStart.setDate(fourWeekStart.getDate() - 28)
  const fourWeekStr = fourWeekStart.toISOString().split('T')[0]
  const fourWeekTransitions = enriched.filter(t => t.date >= fourWeekStr && t.date < weekStart)
  const fourWeekAvg = fourWeekTransitions.length > 0
    ? fourWeekTransitions.reduce((s, t) => s + t.reward, 0) / fourWeekTransitions.length
    : null

  const trajectory: 'improving' | 'declining' | 'flat' = priorAvg === null ? 'flat'
    : avgReward > priorAvg + 0.3 ? 'improving'
    : avgReward < priorAvg - 0.3 ? 'declining'
    : 'flat'

  // Action distribution
  const actionDistribution: Partial<Record<ActionType, number>> = {}
  for (const t of weekTransitions) {
    for (const a of t.actions) {
      actionDistribution[a] = (actionDistribution[a] || 0) + 1
    }
  }

  // Dominant cluster
  const clusterCounts: Record<string, number> = {}
  for (const t of weekTransitions) {
    clusterCounts[t.cluster] = (clusterCounts[t.cluster] || 0) + 1
  }
  const dominantCluster = Object.entries(clusterCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'balanced_steady'

  // TD errors this week
  const tdErrors = weekTransitions
    .filter(t => t.tdError !== null)
    .map(t => ({ date: t.date, error: t.tdError!, explanation: '' }))

  // Reward health
  const atFloor = componentStats.filter(c => c.atFloor).map(c => c.component)
  const atCeiling = componentStats.filter(c => c.atCeiling).map(c => c.component)
  const volatile = componentStats.filter(c => c.volatile).map(c => c.component)

  // Build AI prompt
  const dailySummaries = weekTransitions.map(t => {
    const stateStr = `GE=${t.state.ge.toFixed(2)} GI=${t.state.gi.toFixed(2)} GVC=${t.state.gvc.toFixed(2)} K=${t.state.kappa.toFixed(2)} GD=${t.state.gd.toFixed(2)} GN=${t.state.gn.toFixed(2)} J=${t.state.j.toFixed(2)} S=${t.state.sigma.toFixed(2)} Gate=${t.state.gate}`
    const cluster = STATE_CLUSTER_DISPLAY[t.cluster]?.name || t.cluster
    return `${t.date}: r=${t.reward.toFixed(1)} | ${cluster} | actions=[${t.actions.join(',')}] | state=[${stateStr}] | td=${t.tdError?.toFixed(2) || 'N/A'}`
  }).join('\n')

  const rulesSummary = policyRules.map(r => {
    const conds = r.conditions.map(c => `${c.component}${c.operator}${c.value}`).join(' AND ')
    return `"${r.name}": When ${conds} -> ${r.action} | matched=${r.matchCount} followed=${r.followedCount} avg_when_followed=${r.avgRewardWhenFollowed?.toFixed(1) || 'N/A'}`
  }).join('\n')

  const prompt = `You are an RL policy auditor for a human agent optimizing a personal reward function.

REWARD FUNCTION: g* = Gate x (GE x GI x GVC x kappa x O x GD x GN x J x Sigma)^(1/9) - Fragmentation*0.3
- 9 components, geometric mean, nervous system gate [0.3-1.0]
- Score range: 0-10

THIS WEEK (${weekStart} to ${weekEnd}):
${dailySummaries}

EPISODE STATS:
- Avg reward: ${avgReward.toFixed(2)}
- Prior week avg: ${priorAvg?.toFixed(2) || 'N/A'}
- 4-week avg: ${fourWeekAvg?.toFixed(2) || 'N/A'}
- Trajectory: ${trajectory}
- Dominant state: ${STATE_CLUSTER_DISPLAY[dominantCluster as keyof typeof STATE_CLUSTER_DISPLAY]?.name || dominantCluster}

POLICY RULES (${policyRules.length}):
${rulesSummary || 'No rules defined yet.'}

REWARD HEALTH:
- At floor (<0.15): ${atFloor.join(', ') || 'none'}
- At ceiling (>0.85): ${atCeiling.join(', ') || 'none'}
- Volatile (std>0.25): ${volatile.join(', ') || 'none'}

Generate JSON with these fields:
{
  "tdErrorExplanations": [{"date": "YYYY-MM-DD", "explanation": "Why this day was surprisingly good/bad"}],
  "policySuggestions": ["3-5 specific policy improvement recommendations based on the data"],
  "weekNarrative": "2-paragraph honest narrative of this week as an RL episode. Reference specific days and metrics. Be direct about what worked and what didn't.",
  "rewardHealthSuggestions": ["suggestions for reward function adjustments if any components are problematic"]
}

Be specific, reference actual numbers, and be brutally honest. This is for self-improvement, not ego protection.`

  try {
    const response = await callLLM(prompt, { temperature: 0.4, maxTokens: 4000 })
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Merge TD error explanations
    const enrichedTDErrors = tdErrors.map(td => {
      const aiExplanation = parsed.tdErrorExplanations?.find((e: { date: string }) => e.date === td.date)
      return { ...td, explanation: aiExplanation?.explanation || '' }
    })

    return {
      weekStart,
      weekEnd,
      episode: {
        transitionCount: weekTransitions.length,
        avgReward,
        rewardTrajectory: trajectory,
        actionDistribution,
        dominantCluster: dominantCluster as RLWeeklyAudit['episode']['dominantCluster'],
        stateTransitionSummary: weekTransitions.length >= 2
          ? `${STATE_CLUSTER_DISPLAY[weekTransitions[0].cluster]?.name} -> ${STATE_CLUSTER_DISPLAY[weekTransitions[weekTransitions.length - 1].cluster]?.name}`
          : 'Insufficient data',
      },
      policyEvaluation: {
        rulesEvaluated: policyRules.length,
        rulesFollowed: policyRules.filter(r => r.followedCount > 0).length,
        followRate: policyRules.length > 0
          ? policyRules.reduce((s, r) => s + (r.matchCount > 0 ? r.followedCount / r.matchCount : 0), 0) / policyRules.length
          : 0,
        topPerformingRule: policyRules.sort((a, b) => (b.avgRewardWhenFollowed ?? 0) - (a.avgRewardWhenFollowed ?? 0))[0]?.name || null,
        underperformingRules: policyRules
          .filter(r => r.avgRewardWhenFollowed !== null && r.avgRewardWhenIgnored !== null && r.avgRewardWhenFollowed < r.avgRewardWhenIgnored)
          .map(r => r.name),
      },
      tdErrors: enrichedTDErrors,
      rewardHealth: {
        componentsAtFloor: atFloor,
        componentsAtCeiling: atCeiling,
        volatileComponents: volatile,
        suggestedAdjustments: parsed.rewardHealthSuggestions || [],
      },
      policySuggestions: parsed.policySuggestions || [],
      weekNarrative: parsed.weekNarrative || '',
      priorWeekAvgReward: priorAvg,
      fourWeekAvgReward: fourWeekAvg,
    }
  } catch (error) {
    console.error('[RL Audit AI] Failed to generate audit:', error)

    // Return data-only audit without AI synthesis
    return {
      weekStart,
      weekEnd,
      episode: {
        transitionCount: weekTransitions.length,
        avgReward,
        rewardTrajectory: trajectory,
        actionDistribution,
        dominantCluster: dominantCluster as RLWeeklyAudit['episode']['dominantCluster'],
        stateTransitionSummary: '',
      },
      policyEvaluation: {
        rulesEvaluated: policyRules.length,
        rulesFollowed: 0,
        followRate: 0,
        topPerformingRule: null,
        underperformingRules: [],
      },
      tdErrors,
      rewardHealth: {
        componentsAtFloor: atFloor,
        componentsAtCeiling: atCeiling,
        volatileComponents: volatile,
        suggestedAdjustments: [],
      },
      policySuggestions: [],
      weekNarrative: 'AI synthesis failed. Data metrics are still computed above.',
      priorWeekAvgReward: priorAvg,
      fourWeekAvgReward: fourWeekAvg,
    }
  }
}
