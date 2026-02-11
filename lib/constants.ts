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
}

export const TRAINING_SCORE: Record<string, number> = {
  strength: 1.0,
  yoga: 0.8,
  vo2: 1.0,
  zone2: 0.9,
  rest: 0.5,
  none: 0.2,
}

export const BODY_FELT_SCORE: Record<string, number> = {
  open: 1.0,
  neutral: 0.6,
  tense: 0.2,
}

export const NS_STATE_ENERGY_SCORE: Record<string, number> = {
  regulated: 1.0,
  slightly_spiked: 0.5,
  spiked: 0.1,
}

// Floor to avoid log(0) = -infinity (ruin avoidance)
export const REWARD_FLOOR = 0.05
