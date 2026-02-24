/**
 * Seed data for the week of Feb 23 – Mar 1, 2026.
 * Converted from loricorpuz.jsx into WeeklyPlan format.
 * Call seedThisWeek(uid) to write to Firestore.
 */

import { saveWeeklyPlan } from './firestore'
import type { WeeklyPlan, WeeklyGoal, DailyAllocation, WeeklyScorecardMetric, WeeklyProjectAllocation } from './types'

const WEEK_START = '2026-02-23'
const WEEK_END = '2026-03-01'

const goals: WeeklyGoal[] = [
  {
    id: 'kappa',
    label: 'REVENUE (κ)',
    title: 'Close $2k+ in revenue',
    weight: 35,
    accent: '#2d5f3f',
    pillar: 'Markets',
    items: [
      { task: 'Send Manifold pitch to Uzo with clear pricing', day: 'Mon', outcome: 'Meeting booked', completed: false },
      { task: 'Send Manifold pitch to Gillian with specific use case', day: 'Mon', outcome: 'Trial started', completed: false },
      { task: "Build & send Sean's tech stack proposal with pricing", day: 'Tue–Wed', outcome: '$500-1k proposal sent', completed: false },
      { task: 'Identify 5 prospects who need custom AI tech stacks', day: 'Wed–Thu', outcome: '5 names sourced', completed: false },
      { task: 'Cold outreach to 5 new prospects', day: 'Thu–Fri', outcome: '2 responses', completed: false },
      { task: 'Follow up on ALL outstanding asks', day: 'Fri', outcome: 'Every thread touched', completed: false },
    ],
    askTarget: '21 asks minimum (3/day)',
    ruin: 'κ = 0 → log(0) = −∞. Brilliant builder, zero capture.',
  },
  {
    id: 'ship',
    label: 'SHIPPING (ΔΦᵥ)',
    title: '5 public ships from Agent Factory',
    weight: 30,
    accent: '#7c2d2d',
    pillar: 'AI',
    items: [
      { task: 'Ship Agent Factory v0 — core orchestration deployed', day: 'Mon–Tue', outcome: 'Shareable URL live', completed: false },
      { task: 'Ship Marketing Bot (use case #1)', day: 'Wed', outcome: 'Demo video posted', completed: false },
      { task: 'Ship Geneticist-in-Pocket (use case #2)', day: 'Thu', outcome: 'Prototype posted', completed: false },
      { task: "Ship Sean's clickable tech stack demo", day: 'Fri', outcome: 'Demo sent to Sean', completed: false },
      { task: 'Ship 1 embarrassment — ugly but real', day: 'Any', outcome: 'Ego survived', completed: false },
    ],
    ruin: 'Nothing public = nothing compounds. ΔΦᵥ → −∞.',
  },
  {
    id: 'narrative',
    label: 'PUBLIC NARRATIVE',
    title: '7 posts building the Agent Factory story',
    weight: 20,
    accent: '#2d4a6f',
    pillar: 'AI + Markets',
    items: [
      { task: "'Why I'm building a factory that builds AI businesses'", day: 'Mon', outcome: 'Thread posted', completed: false },
      { task: 'Build-in-public: Marketing Bot demo', day: 'Wed', outcome: 'Video posted', completed: false },
      { task: 'Agent Factory use case — Geneticist in Pocket', day: 'Thu', outcome: 'Thread posted', completed: false },
      { task: 'Revenue update (transparent, even if $0)', day: 'Fri', outcome: 'Posted publicly', completed: false },
      { task: 'Long-form: AI + Markets thesis content', day: 'Sat', outcome: 'Essay published', completed: false },
      { task: '2× engagement replies to people above your level', day: 'Daily', outcome: 'Thoughtful, not spam', completed: false },
    ],
    ruin: 'No audience = no inbound. Invisible = irrelevant.',
  },
  {
    id: 'strategy',
    label: 'STRATEGY',
    title: 'Repeatable tech stack sales playbook',
    weight: 10,
    accent: '#8a6d2f',
    pillar: 'Markets + Mind',
    items: [
      { task: 'Document: What exactly are you selling Sean?', day: 'Mon', outcome: '1-page offer doc', completed: false },
      { task: "Generalize Sean's deal → repeatable template", day: 'Wed', outcome: 'Template created', completed: false },
      { task: 'ICP research: Who buys custom AI tech stacks?', day: 'Thu', outcome: 'ICP doc written', completed: false },
      { task: 'Price anchoring: What do consultants charge?', day: 'Fri', outcome: '3 comps found', completed: false },
    ],
    ruin: "One deal to Sean, can't repeat. No compounding.",
  },
  {
    id: 'ge',
    label: 'ENERGY (GE)',
    title: 'Protect the biological machine',
    weight: 5,
    accent: '#6b5b4f',
    pillar: 'Mind',
    items: [
      { task: '7+ hours sleep every night', day: 'Daily', outcome: 'Garmin verified', completed: false },
      { task: 'Push training', day: 'Mon', outcome: 'Completed', completed: false },
      { task: 'Glutes training', day: 'Tue + Fri', outcome: 'Completed', completed: false },
      { task: 'VO2 Max intervals (4×4min @ 90% HR)', day: 'Wed + Sun', outcome: 'Completed', completed: false },
      { task: 'Pull training', day: 'Thu', outcome: 'Completed', completed: false },
      { task: 'Zone 2 run (60min)', day: 'Sat', outcome: 'Completed', completed: false },
      { task: '24-hour rule if spiked', day: 'As needed', outcome: 'Rule honored', completed: false },
    ],
    ruin: 'GE → 0. Multiplicative ruin. Everything collapses.',
  },
]

const dailyAllocations: DailyAllocation[] = [
  {
    day: 'Monday', date: '2026-02-23', theme: 'Launch — Revenue + Narrative',
    morningPrime: 'Agent Factory = engine. Products = revenue. Send the asks first.',
    blocks: [
      { time: '7–8a', task: 'Push training', category: 'GE', color: '#6b5b4f' },
      { time: '8–9a', task: 'Pitch Uzo (with pricing)', category: 'κ', color: '#2d5f3f' },
      { time: '9–9:30a', task: 'Pitch Gillian', category: 'κ', color: '#2d5f3f' },
      { time: '9:30–10a', task: 'Document Sean offer', category: 'Strategy', color: '#8a6d2f' },
      { time: '10a–1p', task: 'Agent Factory core — 3hr deep work', category: 'Ship', color: '#7c2d2d' },
      { time: '1–2p', task: "Thread: 'Why Agent Factory'", category: 'Narrative', color: '#2d4a6f' },
      { time: '2–5p', task: 'Agent Factory continued → deployable', category: 'Ship', color: '#7c2d2d' },
      { time: '5–5:30p', task: '1 cold outreach + follow-ups', category: 'κ', color: '#2d5f3f' },
    ],
    plannedAsks: 3, plannedShips: 0, plannedPosts: 1,
  },
  {
    day: 'Tuesday', date: '2026-02-24', theme: 'Build + Sell — AF v0 + Sean Proposal',
    morningPrime: 'Did Uzo/Gillian respond? Follow up if not.',
    blocks: [
      { time: '7–8a', task: 'Glutes training', category: 'GE', color: '#6b5b4f' },
      { time: '9a–12p', task: 'Ship Agent Factory v0 → live URL', category: 'Ship', color: '#7c2d2d' },
      { time: '12–1p', task: 'Build Sean proposal (deliverables + price)', category: 'κ', color: '#2d5f3f' },
      { time: '1–2p', task: '2× engagement replies', category: 'Narrative', color: '#2d4a6f' },
      { time: '2–5p', task: 'Build Marketing Bot on AF infra', category: 'Ship', color: '#7c2d2d' },
      { time: '5–5:30p', task: '2 cold outreach emails', category: 'κ', color: '#2d5f3f' },
    ],
    plannedAsks: 3, plannedShips: 1, plannedPosts: 0,
  },
  {
    day: 'Wednesday', date: '2026-02-25', theme: 'Ship Marketing Bot + Generalize Offer',
    morningPrime: 'Pipeline check: who responded? Who needs 2nd touch?',
    blocks: [
      { time: '7–8a', task: 'VO2 Max intervals', category: 'GE', color: '#6b5b4f' },
      { time: '9a–12p', task: 'Ship Marketing Bot — demo + video', category: 'Ship', color: '#7c2d2d' },
      { time: '12–1p', task: 'Post build-in-public: Bot demo', category: 'Narrative', color: '#2d4a6f' },
      { time: '1–2p', task: 'Generalize Sean → repeatable template', category: 'Strategy', color: '#8a6d2f' },
      { time: '2–4p', task: 'Send Sean proposal with demo attached', category: 'κ', color: '#2d5f3f' },
      { time: '4–5p', task: '2 more cold outreach', category: 'κ', color: '#2d5f3f' },
      { time: '5–5:30p', task: 'Follow up Uzo/Gillian (2nd touch)', category: 'κ', color: '#2d5f3f' },
    ],
    plannedAsks: 4, plannedShips: 1, plannedPosts: 1,
  },
  {
    day: 'Thursday', date: '2026-02-26', theme: 'Geneticist Use Case + ICP Research',
    morningPrime: 'NS check. If spiked: skip strategy, just ship.',
    blocks: [
      { time: '7–8a', task: 'Pull training', category: 'GE', color: '#6b5b4f' },
      { time: '9a–12p', task: 'Build Geneticist-in-Pocket on AF', category: 'Ship', color: '#7c2d2d' },
      { time: '12–1p', task: 'Thread: Geneticist + AF vision', category: 'Narrative', color: '#2d4a6f' },
      { time: '1–2p', task: 'ICP: Who buys AI tech stacks?', category: 'Strategy', color: '#8a6d2f' },
      { time: '2–4p', task: 'Polish Geneticist → post publicly', category: 'Ship', color: '#7c2d2d' },
      { time: '4–5p', task: '3 revenue asks', category: 'κ', color: '#2d5f3f' },
    ],
    plannedAsks: 3, plannedShips: 1, plannedPosts: 1,
  },
  {
    day: 'Friday', date: '2026-02-27', theme: 'Close Week — Revenue Push',
    morningPrime: 'Revenue audit: Where are you vs. $2k?',
    blocks: [
      { time: '7–8a', task: 'Glutes training', category: 'GE', color: '#6b5b4f' },
      { time: '9–11a', task: "Ship Sean's clickable demo", category: 'Ship', color: '#7c2d2d' },
      { time: '11a–12p', task: 'Price research: 3 consultant comps', category: 'Strategy', color: '#8a6d2f' },
      { time: '12–1p', task: 'Post revenue/progress update', category: 'Narrative', color: '#2d4a6f' },
      { time: '1–3p', task: 'Follow up EVERY open ask', category: 'κ', color: '#2d5f3f' },
      { time: '3–4p', task: '5 cold outreach for next week', category: 'κ', color: '#2d5f3f' },
      { time: '4–5p', task: 'Ship 1 embarrassment — imperfect, public', category: 'Ship', color: '#7c2d2d' },
    ],
    plannedAsks: 5, plannedShips: 2, plannedPosts: 1,
  },
  {
    day: 'Saturday', date: '2026-02-28', theme: 'Compound — Thesis + Strength',
    morningPrime: 'No asks. Create long-form content that compounds.',
    blocks: [
      { time: '9–10a', task: 'Zone 2 run (60min)', category: 'GE', color: '#6b5b4f' },
      { time: '10a–12p', task: 'Write AI + Markets thesis essay', category: 'Narrative', color: '#2d4a6f' },
      { time: '12–1p', task: 'Week review: shipped? converted? kill?', category: 'Strategy', color: '#8a6d2f' },
    ],
    plannedAsks: 0, plannedShips: 0, plannedPosts: 1,
  },
  {
    day: 'Sunday', date: '2026-03-01', theme: 'Rest + Plan',
    morningPrime: 'Synthesis. Did AI + Markets + Mind integrate?',
    blocks: [
      { time: '7–8a', task: 'VO2 Max intervals', category: 'GE', color: '#6b5b4f' },
      { time: '10–11a', task: 'Weekly synthesis', category: 'Mind', color: '#6b5b4f' },
      { time: '11a–12p', task: 'Plan next week', category: 'Strategy', color: '#8a6d2f' },
    ],
    plannedAsks: 0, plannedShips: 0, plannedPosts: 0,
  },
]

const scorecard: WeeklyScorecardMetric[] = [
  { key: 'revenue_asks', label: 'Revenue Asks', target: '21', targetNumeric: 21, actual: null },
  { key: 'ships', label: 'Public Ships', target: '5', targetNumeric: 5, actual: null },
  { key: 'posts', label: 'Own', target: '7', targetNumeric: 7, actual: null },
  { key: 'revenue', label: 'Revenue', target: '$2k', targetNumeric: 2000, actual: null, unit: '$' },
  { key: 'vo2', label: 'VO2 Sessions', target: '2', targetNumeric: 2, actual: null },
  { key: 'sleep', label: 'Sleep 7+hrs', target: '7/7', targetNumeric: 7, actual: null },
]

const projects: WeeklyProjectAllocation[] = [
  { projectName: 'Agent Factory', role: 'Spine', description: 'The machine that builds AI businesses', color: '#7c2d2d' },
  { projectName: 'Armstrong', role: 'Channel', description: 'Options analytics · AI × Markets', color: '#2d5f3f' },
  { projectName: 'Manifold', role: 'Channel', description: 'AI career matching', color: '#2d4a6f' },
  { projectName: 'Tech Stack Sales', role: 'Channel', description: 'Custom AI stacks for founders', color: '#8a6d2f' },
]

/** Returns the seed data without writing to Firestore */
export function getThisWeekPlanData(): Partial<WeeklyPlan> {
  return {
    weekStartDate: WEEK_START,
    weekEndDate: WEEK_END,
    weekLabel: 'Feb 23 – Mar 1, 2026',
    status: 'active',
    spineResolution: 'Agent Factory is the spine. Everything else is a revenue channel.',
    spineResolutionDetail: 'Infrastructure > any single product. Revenue comes from use cases — Sean\'s tech stack, Manifold to Uzo & Gillian, cold outreach to founders. You sell cars, not engines.',
    revenueTarget: '$2,000+',
    goals,
    dailyAllocations,
    scorecard,
    projects,
    aiGenerated: false,
  }
}

export async function seedThisWeek(uid: string): Promise<void> {
  await saveWeeklyPlan(uid, WEEK_START, getThisWeekPlanData())
}
