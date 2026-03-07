import type { ActionType } from './shared'
import type { Timestamp } from './shared'

// ─── State Representation ─────────────────────────────────────────────

/** Compressed state vector: the 11 reward components + gate */
export interface RLState {
  sleep: number
  movement: number
  regulation: number
  gi: number
  gd: number
  sigma: number
  j: number
  gvc: number
  kappa: number
  gn: number
  optionality: number
  gate: number
}

/** Named state cluster for V(s) estimation */
export type StateClusterLabel =
  | 'high_energy_shipping'    // body pillar>0.7, gvc>0.7
  | 'low_energy_recovery'     // body pillar<0.4
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
  lastReviewedAt?: string       // YYYY-MM-DD — for spaced repetition
  reviewInterval?: number       // days until next review
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
  lastReviewedAt?: string       // YYYY-MM-DD — for spaced repetition
  reviewInterval?: number       // days until next review
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

// ─── Role Lab ────────────────────────────────────────────────────────

export type RoleLabAlgorithmId =
  | 'multi_armed_bandit'
  | 'q_learning'
  | 'dqn'
  | 'reinforce'
  | 'ppo'

export type RoleLabAlgorithmStatus = 'not_started' | 'in_progress' | 'completed'

export type RoleLabEnvironmentId = 'thesis_engine_mdp' | 'options_multistrategy' | 'eeg_neurofeedback'

export type RoleLabDeliverableStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export type RoleLabDeliverableType = 'code' | 'blog' | 'video'

export interface RoleLabAlgorithm {
  id: RoleLabAlgorithmId
  status: RoleLabAlgorithmStatus
  repoUrl?: string
  notes?: string
  completedAt?: string
}

export interface RoleLabEnvironment {
  id: RoleLabEnvironmentId
  name: string
  stateDescription: string
  actionDescription: string
  rewardDescription: string
  milestones: string[]
  currentMilestoneIndex: number
  repoUrl?: string
  notes?: string
}

export interface RoleLabDeliverable {
  week: number
  type: RoleLabDeliverableType
  title: string
  status: RoleLabDeliverableStatus
  url?: string
  completedAt?: string
}

export interface RoleLabMilestone {
  week: number
  title: string
  description: string
  isComplete: boolean
}

export interface RoleLabData {
  id?: string
  sprintStartDate: string
  milestones: RoleLabMilestone[]
  environments: RoleLabEnvironment[]
  deliverables: RoleLabDeliverable[]
  algorithms: RoleLabAlgorithm[]
  notes?: string
  updatedAt: Timestamp
}

export const ROLE_LAB_ALGORITHMS: { id: RoleLabAlgorithmId; name: string; description: string }[] = [
  { id: 'multi_armed_bandit', name: 'Multi-Armed Bandit', description: 'Epsilon-greedy, UCB, Thompson Sampling' },
  { id: 'q_learning', name: 'Q-Learning', description: 'Tabular Q-learning with epsilon-greedy exploration' },
  { id: 'dqn', name: 'DQN', description: 'Deep Q-Network with experience replay & target network' },
  { id: 'reinforce', name: 'REINFORCE', description: 'Monte Carlo policy gradient with baseline' },
  { id: 'ppo', name: 'PPO', description: 'Proximal Policy Optimization — clip objective' },
]

export const DEFAULT_ROLE_LAB_MILESTONES: RoleLabMilestone[] = [
  { week: 1, title: 'Foundation', description: 'Gymnasium API, bandit implementations, Thesis Engine env wrapper started', isComplete: false },
  { week: 2, title: 'Tabular Methods', description: 'Q-learning on Thesis Engine MDP, first blog post published', isComplete: false },
  { week: 3, title: 'Deep Q-Learning', description: 'DQN on CartPole + Thesis Engine, video walkthrough', isComplete: false },
  { week: 4, title: 'Policy Gradients', description: 'REINFORCE implementation, options env prototype started', isComplete: false },
  { week: 5, title: 'PPO + Options', description: 'PPO on Thesis Engine, options/multi-strategy env prototype, mid-sprint video', isComplete: false },
  { week: 6, title: 'Options Agent', description: 'Train RL agent on options & multi-strategy env, blog on custom envs', isComplete: false },
  { week: 7, title: 'Integration', description: 'End-to-end pipeline, comparison of algorithms across envs', isComplete: false },
  { week: 8, title: 'Ship', description: 'Final video, all repos public, capstone blog post', isComplete: false },
]

export const DEFAULT_ROLE_LAB_ENVIRONMENTS: RoleLabEnvironment[] = [
  {
    id: 'thesis_engine_mdp',
    name: 'Thesis Engine MDP',
    stateDescription: '10-dim RLState (GE, GI, GVC, kappa, O, GD, GN, J, sigma, gate)',
    actionDescription: '6 actions: ship, ask, signal, regulate, explore, compound',
    rewardDescription: 'g* in [0, 10] from computeReward()',
    milestones: [
      'Export daily logs to CSV',
      'Gymnasium env wrapper in Python',
      'Run tabular Q-learning',
      'Run DQN',
      'Run PPO',
      'Compare algorithm performance',
    ],
    currentMilestoneIndex: 0,
  },
  {
    id: 'options_multistrategy',
    name: 'Options & Multi-Strategy',
    stateDescription: 'Market features (IV, Greeks, price, volume) + portfolio state (positions, P&L, margin)',
    actionDescription: 'Trade options (buy/sell/exercise), rebalance strategies, capture dividends, hedge',
    rewardDescription: 'Risk-adjusted returns (Sharpe), dividend yield, drawdown penalty',
    milestones: [
      'Define state space & data pipeline',
      'Build Gymnasium env with historical data',
      'Implement dividend capture logic',
      'Train DQN agent on single-strategy',
      'Multi-strategy allocation agent (PPO)',
      'Backtest & publish results',
    ],
    currentMilestoneIndex: 0,
  },
  {
    id: 'eeg_neurofeedback',
    name: 'EEG Neurofeedback (TBD)',
    stateDescription: 'Brainwave PSD: alpha, beta, theta, delta, gamma power',
    actionDescription: 'Interventions: breathwork, focus music, break, meditation',
    rewardDescription: 'Cumulative time in desired brain state (e.g., high alpha/theta ratio)',
    milestones: [
      'Acquire consumer EEG device',
      'Stream raw EEG data to Python',
      'Build Gymnasium env',
      'Train baseline agent',
    ],
    currentMilestoneIndex: 0,
  },
]
