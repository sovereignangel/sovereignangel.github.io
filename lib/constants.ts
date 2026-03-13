import type { Project, UserSettings } from './types'

export const DEFAULT_SETTINGS: UserSettings = {
  dailyReminder: '8:00 AM',
  weeklyReminder: 'Sunday 7:00 PM',
  focusHoursPerDay: 6,
  revenueAskQuotaPerDay: 2,
  sleepTarget: 7.5,
  maxProjects: 2,
  twentyFourHourRuleActive: true,
}

export const SEED_PROJECTS: Omit<Project, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'armstrong',
    name: 'Armstrong',
    description: 'Options analytics dashboard + fund',
    status: 'spine',
    timeAllocationPercent: 60,
    revenueTarget3mo: 6000,
    revenueTarget1yr: 24000,
    revenueTarget3yr: 200000,
    revenueActualYtd: 0,
    milestones: [
      { text: 'Dashboard shipped & seeking first customers', status: 'in_progress' },
      { text: 'Hit $500/mo & start fund docs', status: 'pending' },
      { text: 'Hit $1.5-2k/mo & launch fund', status: 'pending' },
    ],
    thesisAlignment: {
      ai: 'Options analytics = AI at intersection of markets',
      markets: 'Building for option traders (proven willingness to pay)',
      capital: 'This becomes a fund mgmt platform + GP role',
    },
    compoundingChain: 'Armstrong → Deep Tech Fund (GP credibility) → Personal brand as capital allocator → Better customers for Manifold → Thought leadership in AI + markets',
    customerCount: 0,
    recurringRevenue: 0,
    churnRate: 0,
    cac: 0,
    nextMilestone: 'Hit $2k/month in 3 months',
  },
  {
    id: 'manifold',
    name: 'Manifold',
    description: 'Job seeker tool ($20/$50/mo)',
    status: 'pre_launch',
    timeAllocationPercent: 15,
    revenueTarget3mo: 0,
    revenueTarget1yr: 5000,
    revenueTarget3yr: 50000,
    revenueActualYtd: 0,
    milestones: [
      { text: '50 users or $500/mo signal', status: 'pending' },
      { text: 'PMF validation', status: 'pending' },
      { text: 'Scale or kill decision', status: 'pending' },
    ],
    thesisAlignment: {
      ai: 'AI-powered job matching and resume optimization',
      markets: 'Job seekers willing to pay for speed',
      capital: 'SaaS recurring revenue if scales',
    },
    compoundingChain: 'Manifold → Public learning → Shipping muscle → Embarrassment tolerance',
    customerCount: 0,
    recurringRevenue: 0,
    churnRate: 0,
    cac: 0,
    nextMilestone: '50 users or $500/month in 3 months',
  },
  {
    id: 'deep_tech',
    name: 'Deep Tech Fund',
    description: 'GP equity in deep tech fund',
    status: 'optionality',
    timeAllocationPercent: 5,
    revenueTarget3mo: 0,
    revenueTarget1yr: 0,
    revenueTarget3yr: 400000,
    revenueActualYtd: 0,
    milestones: [
      { text: 'Attend 1 founder meeting/month', status: 'in_progress' },
      { text: 'Demonstrate value as GP', status: 'pending' },
      { text: 'Fund launch', status: 'pending' },
    ],
    thesisAlignment: {
      ai: 'Deep tech investing at AI frontier',
      markets: 'Capital allocation as leverage',
      capital: '2/20 GP equity (assuming $20M AUM = $400k/yr)',
    },
    compoundingChain: 'Deep Tech Fund → GP credibility → Deal flow → Armstrong customers',
    customerCount: 0,
    recurringRevenue: 0,
    churnRate: 0,
    cac: 0,
    nextMilestone: 'Attend 1 meeting/month',
  },
  {
    id: 'jobs',
    name: 'Jobs (Backup)',
    description: 'Product engineer roles ($200k+)',
    status: 'backup',
    timeAllocationPercent: 1,
    revenueTarget3mo: 0,
    revenueTarget1yr: 200000,
    revenueTarget3yr: 600000,
    revenueActualYtd: 0,
    milestones: [
      { text: 'Network passively', status: 'in_progress' },
      { text: 'Interview if thesis stalls at 12mo', status: 'pending' },
    ],
    thesisAlignment: {
      ai: 'Product engineering in AI companies',
      markets: 'Safety net salary',
      capital: 'Stable income if needed',
    },
    compoundingChain: 'Jobs → Safety net → Enables risk-taking on spine projects',
    customerCount: 0,
    recurringRevenue: 0,
    churnRate: 0,
    cac: 0,
    nextMilestone: 'Network passively, interview if needed',
  },
]

export const NERVOUS_SYSTEM_TRIGGERS = [
  { value: 'ambiguous_commitment', label: 'Ambiguous commitment' },
  { value: 'unseen', label: 'Unseen' },
  { value: 'stalled_momentum', label: 'Stalled momentum' },
  { value: 'validation_drop', label: 'Validation drop' },
  { value: 'other', label: 'Other' },
]

export const TRAINING_TYPES = [
  { value: 'strength', label: 'Strength' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'vo2', label: 'VO2 Max' },
  { value: 'zone2', label: 'Zone 2' },
  { value: 'rest', label: 'Rest' },
]

export const REVENUE_STREAM_TYPES = [
  { value: 'recurring', label: 'Recurring' },
  { value: 'one_time', label: 'One-time' },
  { value: 'organic', label: 'Organic' },
]

export const MARKET_SIGNAL_TYPES = [
  { value: 'customer_complaint', label: 'Customer complaint' },
  { value: 'competitor_move', label: 'Competitor move' },
  { value: 'tech_shift', label: 'Tech shift' },
  { value: 'price_opportunity', label: 'Price opportunity' },
  { value: 'distribution', label: 'Distribution opening' },
]

export const SIGNAL_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'testing', label: 'Testing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'archived', label: 'Archived' },
]

export const PROJECT_HEALTH_OPTIONS = [
  { value: 'on_track', label: 'On track' },
  { value: 'stalled', label: 'Stalled' },
  { value: 'accelerating', label: 'Accelerating' },
]

// ─── REWARD COMPUTATION ─────────────────────────────────────────────────

export const THESIS_PILLARS = [
  { value: 'ai' as const, label: 'AI' },
  { value: 'markets' as const, label: 'Markets' },
  { value: 'mind' as const, label: 'Mind' },
]

export const NERVOUS_SYSTEM_GATE: Record<string, number> = {
  regulated: 1.0,
  slightly_spiked: 0.7,
  spiked: 0.3,
  sick: 0.2,
}

export const TRAINING_SCHEDULE: Record<string, { type: string; label: string; time: string }> = {
  Monday:    { type: 'strength', label: 'Push', time: '7–8a' },
  Tuesday:   { type: 'strength', label: 'Glutes', time: '7–8a' },
  Wednesday: { type: 'vo2',      label: 'VO2 Max intervals', time: '7–8a' },
  Thursday:  { type: 'strength', label: 'Pull', time: '7–8a' },
  Friday:    { type: 'strength', label: 'Glutes', time: '7–8a' },
  Saturday:  { type: 'zone2',    label: 'Zone 2 run (60min)', time: '9–10a' },
  Sunday:    { type: 'rest',     label: 'Rest / Social', time: '—' },
}

// Movement scoring: program > some movement > nothing
export const MOVEMENT_SCORE: Record<string, number> = {
  program: 1.0,
  movement: 0.5,
  none: 0.1,
}

export const STEPS_TARGET = 15000

export const NS_STATE_ENERGY_SCORE: Record<string, number> = {
  regulated: 1.0,
  slightly_spiked: 0.5,
  spiked: 0.1,
  sick: 0.1,
}

// Floor to avoid log(0) = -infinity (ruin avoidance)
// 0.15 ensures unfilled components penalize but don't catastrophically destroy the score
export const REWARD_FLOOR = 0.15

// ─── PILLAR FRAMEWORK (Body / Brain / Build) ─────────────────────────

export type PillarKey = 'body' | 'brain' | 'build'

export const REWARD_PILLARS = [
  {
    key: 'body' as PillarKey,
    label: 'Body',
    question: 'Can I perform?',
    weight: 'foundation',
    color: 'text-green-ink',
    bgColor: 'bg-green-bg',
    barColor: 'bg-green-ink',
    borderColor: 'border-green-ink/20',
    components: ['sleep', 'movement', 'regulation'] as const,
  },
  {
    key: 'brain' as PillarKey,
    label: 'Brain',
    question: 'Am I getting smarter?',
    weight: 'amplifier',
    color: 'text-navy',
    bgColor: 'bg-navy-bg',
    barColor: 'bg-navy',
    borderColor: 'border-navy/20',
    components: ['gi', 'gd', 'sigma', 'j'] as const,
  },
  {
    key: 'build' as PillarKey,
    label: 'Build',
    question: 'Am I creating & capturing?',
    weight: 'output',
    color: 'text-burgundy',
    bgColor: 'bg-burgundy-bg',
    barColor: 'bg-burgundy',
    borderColor: 'border-burgundy/20',
    components: ['gvc', 'kappa', 'gn', 'optionality'] as const,
  },
] as const

export const REWARD_COMPONENT_META: Record<string, {
  symbol: string
  label: string
  pillar: PillarKey
  barColor: string
}> = {
  sleep:       { symbol: 'S', label: 'Sleep', pillar: 'body', barColor: 'bg-green-ink' },
  movement:    { symbol: 'M', label: 'Movement', pillar: 'body', barColor: 'bg-green-ink/70' },
  regulation:  { symbol: 'R', label: 'Regulation', pillar: 'body', barColor: 'bg-green-ink/40' },
  gi:          { symbol: 'GI', label: 'Intelligence Growth', pillar: 'brain', barColor: 'bg-navy' },
  gd:          { symbol: 'GD', label: 'Discovery', pillar: 'brain', barColor: 'bg-navy/80' },
  sigma:       { symbol: 'Σ', label: 'Skill Building', pillar: 'brain', barColor: 'bg-navy/60' },
  j:           { symbol: 'J', label: 'Judgment', pillar: 'brain', barColor: 'bg-navy/40' },
  gvc:         { symbol: 'GVC', label: 'Value Creation', pillar: 'build', barColor: 'bg-burgundy' },
  kappa:       { symbol: 'κ', label: 'Capture Ratio', pillar: 'build', barColor: 'bg-burgundy/80' },
  gn:          { symbol: 'GN', label: 'Network Capital', pillar: 'build', barColor: 'bg-burgundy/60' },
  optionality: { symbol: '𝒪', label: 'Optionality', pillar: 'build', barColor: 'bg-burgundy/40' },
}

// ─── SALES MASTERY ────────────────────────────────────────────────────

export const CONTACT_TIERS = [
  { value: 'decision_maker' as const, label: 'Decision-Maker', target: 10 },
  { value: 'connector' as const, label: 'Connector', target: 10 },
  { value: 'peer_operator' as const, label: 'Peer Operator', target: 10 },
]

export const BELT_COLORS: Record<string, string> = {
  white: 'text-ink-muted',
  blue: 'text-navy',
  purple: 'text-burgundy',
  brown: 'text-amber-ink',
  black: 'text-ink',
}

export const BELT_BG_COLORS: Record<string, string> = {
  white: 'bg-cream',
  blue: 'bg-navy-bg',
  purple: 'bg-burgundy-bg',
  brown: 'bg-amber-bg',
  black: 'bg-ink/5',
}

// Levelsio muscle targets (weekly)
export const MUSCLE_TARGETS = {
  shipsPerWeek: 5,
  asksPerDay: 3,
  asksPerWeek: 15,
  postsPerWeek: 7,
  papersPerDay: 1,
  papersPerWeek: 7,
}
