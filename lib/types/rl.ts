import type { ActionType } from './shared'
import type { Timestamp } from './shared'

// ─── State Representation ─────────────────────────────────────────────

/** Compressed state vector: the 9 reward components + gate */
export interface RLState {
  ge: number
  gi: number
  gvc: number
  kappa: number
  optionality: number
  gd: number
  gn: number
  j: number
  sigma: number
  gate: number
}

/** Named state cluster for V(s) estimation */
export type StateClusterLabel =
  | 'high_energy_shipping'    // ge>0.7, gvc>0.7
  | 'low_energy_recovery'     // ge<0.4
  | 'intelligence_gathering'  // gi>0.7, gd>0.7
  | 'revenue_hunting'         // kappa>0.7, gn>0.5
  | 'fragmented_scattered'    // no strong pattern
  | 'spiked_gated'            // gate<1.0
  | 'balanced_steady'         // all components 0.3-0.8
  | 'peak_performance'        // all components>0.7
  | 'cold_start'              // most components<0.3

export const STATE_CLUSTER_DISPLAY: Record<StateClusterLabel, { name: string; description: string }> = {
  high_energy_shipping: { name: 'High Energy Shipping', description: 'Strong energy + active output. Your productive state.' },
  low_energy_recovery: { name: 'Low Energy Recovery', description: 'Energy depleted. Environment signals: regulate, don\'t push.' },
  intelligence_gathering: { name: 'Intelligence Gathering', description: 'Discovery mode. High signal intake + problem detection.' },
  revenue_hunting: { name: 'Revenue Hunting', description: 'Capture-focused. Active asks + network engagement.' },
  fragmented_scattered: { name: 'Fragmented / Scattered', description: 'No dominant signal. Attention spread thin.' },
  spiked_gated: { name: 'Spiked (Gated)', description: 'Nervous system activated. Gate < 1.0 reduces all output.' },
  balanced_steady: { name: 'Balanced Steady', description: 'All components moderate. Stable but not peaking.' },
  peak_performance: { name: 'Peak Performance', description: 'All systems firing. Rare and valuable state.' },
  cold_start: { name: 'Cold Start', description: 'Most components near floor. Early in data collection or reset day.' },
}

export interface StateCluster {
  label: StateClusterLabel
  dayCount: number
  dates: string[]
  centroid: RLState
  avgForwardReturn: number | null
  stdForwardReturn: number | null
  avgImmediateReward: number
}

// ─── Transition Tuples ────────────────────────────────────────────────

export interface RLTransition {
  date: string
  state: RLState
  actions: ActionType[]
  reward: number
  nextState: RLState | null
  nextReward: number | null
  tdError: number | null
  cluster: StateClusterLabel
  nextCluster: StateClusterLabel | null
}

// ─── Policy Rules ─────────────────────────────────────────────────────

export type PolicyConditionOperator = '>' | '<' | '>=' | '<='

export interface PolicyCondition {
  component: keyof RLState
  operator: PolicyConditionOperator
  value: number
}

export interface PolicyRule {
  id?: string
  name: string
  conditions: PolicyCondition[]
  action: ActionType
  reasoning: string
  matchCount: number
  followedCount: number
  avgRewardWhenFollowed: number | null
  avgRewardWhenIgnored: number | null
  linkedPrincipleId?: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Value Function ───────────────────────────────────────────────────

export interface ValueEstimate {
  cluster: StateClusterLabel
  v: number
  n: number
  confidence: number
  trajectory: number[]
}

// ─── Curriculum / Concepts ────────────────────────────────────────────

export type RLModuleId =
  | 'agent_environment'
  | 'reward_hypothesis'
  | 'mdp_markov'
  | 'value_bellman'
  | 'policy_improvement'
  | 'td_learning'
  | 'exploration_exploitation'
  | 'reward_shaping'
  | 'bandit_to_mdp'

export const RL_MODULES: { id: RLModuleId; title: string; symbol: string }[] = [
  { id: 'agent_environment', title: 'Agent-Environment Interface', symbol: '1' },
  { id: 'reward_hypothesis', title: 'The Reward Hypothesis', symbol: '2' },
  { id: 'mdp_markov', title: 'MDP & Markov Property', symbol: '3' },
  { id: 'value_bellman', title: 'Value Functions & Bellman', symbol: '4' },
  { id: 'policy_improvement', title: 'Policy & Improvement', symbol: '5' },
  { id: 'td_learning', title: 'Temporal Difference Learning', symbol: '6' },
  { id: 'exploration_exploitation', title: 'Exploration vs Exploitation', symbol: '7' },
  { id: 'reward_shaping', title: 'Reward Shaping & Ng\'s Theorem', symbol: '8' },
  { id: 'bandit_to_mdp', title: 'From Bandit to MDP', symbol: '9' },
]

export interface RLModuleProgress {
  moduleId: RLModuleId
  completed: boolean
  completedAt?: string
  exerciseCompleted: boolean
  notes?: string
}

export interface RLCurriculumProgress {
  id?: string
  modules: Partial<Record<RLModuleId, RLModuleProgress>>
  updatedAt: Timestamp
}

// ─── Weekly Audit ─────────────────────────────────────────────────────

export interface RLWeeklyAudit {
  id?: string
  weekStart: string
  weekEnd: string

  episode: {
    transitionCount: number
    avgReward: number
    rewardTrajectory: 'improving' | 'declining' | 'flat'
    actionDistribution: Partial<Record<ActionType, number>>
    dominantCluster: StateClusterLabel
    stateTransitionSummary: string
  }

  policyEvaluation: {
    rulesEvaluated: number
    rulesFollowed: number
    followRate: number
    topPerformingRule: string | null
    underperformingRules: string[]
  }

  tdErrors: Array<{
    date: string
    error: number
    explanation: string
  }>

  rewardHealth: {
    componentsAtFloor: string[]
    componentsAtCeiling: string[]
    volatileComponents: string[]
    suggestedAdjustments: string[]
  }

  policySuggestions: string[]
  weekNarrative: string

  priorWeekAvgReward: number | null
  fourWeekAvgReward: number | null

  createdAt: Timestamp
}
