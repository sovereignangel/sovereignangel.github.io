/**
 * Seed data for the current week — Q2 2026.
 * Reflects the daily compass architecture: journal → train → study → 1-2 themes → evening.
 * Call seedThisWeek(uid) to write to Firestore.
 */

import { saveWeeklyPlan } from './firestore'
import type { WeeklyPlan, WeeklyGoal, DailyAllocation, WeeklyScorecardMetric, WeeklyProjectAllocation } from './types'
import { getWeekDates, formatWeekLabel } from './weekly-plan-utils'

const { start: WEEK_START, end: WEEK_END, dates } = getWeekDates()

const goals: WeeklyGoal[] = [
  {
    id: 'armstrong',
    label: 'ARMSTRONG',
    title: 'Deepen conviction with Dave — specific signals and infrastructure',
    weight: 30,
    accent: '#7c2d2d',
    pillar: 'Armstrong',
    items: [
      { task: 'Deep dive sessions with Dave on fund thesis', day: 'Mon + Wed + Fri', outcome: '3 conviction signals identified, time commitment decision made', completed: false },
      { task: 'Signal pipeline / backtest development', day: 'Mon–Fri', outcome: 'At least 1 backtest running on macro signals', completed: false },
      { task: 'Quant ML study for Armstrong execution', day: 'Study blocks', outcome: 'Chapter or technique directly applied', completed: false },
    ],
    ruin: 'No fund progress → Armstrong stays a dashboard, never a vehicle.',
  },
  {
    id: 'alamo',
    label: 'ALAMO BERNAL',
    title: 'Ship next tech milestone (2 days only)',
    weight: 20,
    accent: '#2d5f3f',
    pillar: 'Alamo Bernal',
    items: [
      { task: 'Deep work: build + ship deliverable', day: 'Tue + Thu', outcome: 'Milestone delivered, 15-20hrs focused', completed: false },
      { task: 'Document and close week', day: 'Thu', outcome: 'Decision log updated, next milestone scoped', completed: false },
    ],
    ruin: 'Revenue dries up → no runway for everything else.',
  },
  {
    id: 'research',
    label: 'CECON RESEARCH',
    title: 'Advance complexity economics with Ralph',
    weight: 20,
    accent: '#2d4a6f',
    pillar: 'Complexity Econ',
    items: [
      { task: 'Making Sense of Chaos — Audible during training commute', day: 'Daily', outcome: 'Progress through book, notes captured post-commute', completed: false },
      { task: 'Research session with Michael Ralph', day: 'Wed', outcome: 'Shared artifact produced (paper notes, code, or synthesis)', completed: false },
      { task: 'CEcon research lab development (complexityecon.loricorpuz.com)', day: 'Wed', outcome: 'Platform feature shipped or content added', completed: false },
    ],
    ruin: 'No research velocity → Farmer path closes. Ralph collaboration stalls.',
  },
  {
    id: 'study',
    label: 'STUDY',
    title: 'Stanford RL + AI/ML curriculum + reading group presentations',
    weight: 25,
    accent: '#8a6d2f',
    pillar: 'RL/AI/ML',
    items: [
      { task: 'CS224r or CS231n lecture + problem set (with Aman & Dima)', day: 'Study blocks', outcome: 'Lecture completed, exercises attempted', completed: false },
      { task: 'Textbook chapter (Sutton & Barto, Goodfellow, de Prado)', day: 'Study blocks', outcome: 'Chapter read + notes', completed: false },
      { task: 'Prepare and present at reading group', day: 'Fri–Sat', outcome: 'Presented at AGI or EAIG group', completed: false },
    ],
    ruin: 'No study → intellectual stagnation. No presentations → invisible to community.',
  },
  {
    id: 'ge',
    label: 'ENERGY (GE)',
    title: 'Protect the biological machine + daily practice',
    weight: 5,
    accent: '#6b5b4f',
    pillar: 'Energy',
    items: [
      { task: '7+ hours sleep every night', day: 'Daily', outcome: 'Garmin verified', completed: false },
      { task: 'Daily training: run to gym + weights + subway home', day: 'Daily', outcome: '~2hr 15min block completed', completed: false },
      { task: 'Journal + meditate every morning', day: 'Daily', outcome: 'Pre-workout clarity ritual done', completed: false },
    ],
    ruin: 'GE → 0. Multiplicative ruin. Everything collapses.',
  },
]

const dailyAllocations: DailyAllocation[] = [
  {
    day: 'Monday', date: dates[0], theme: 'Armstrong — deep dive with Dave',
    morningPrime: 'What specific conviction signal can you and Dave identify today?',
    blocks: [
      { time: '7:00–7:30a', task: 'Journal + meditate', category: 'GE', color: '#6b5b4f' },
      { time: '7:30–9:45a', task: 'Run to gym (Audible: Making Sense of Chaos) → Push training → Subway home', category: 'GE', color: '#6b5b4f' },
      { time: '10a–12p', task: 'Intense study: CS224r lecture or quant ML chapter', category: 'Study', color: '#8a6d2f' },
      { time: '12–5p', task: 'Armstrong — signal pipeline, backtest work, session with Dave', category: 'Armstrong', color: '#7c2d2d' },
      { time: '5–7p', task: 'Homebrew community / Aidas / wind down', category: 'Love & Play', color: '#2d5f3f' },
    ],
    plannedStudyHours: 2, plannedMeetings: 1,
  },
  {
    day: 'Tuesday', date: dates[1], theme: 'Alamo Bernal — focused delivery (1 of 2)',
    morningPrime: 'What is the single most impactful Alamo Bernal deliverable today?',
    blocks: [
      { time: '7:00–7:30a', task: 'Journal + meditate', category: 'GE', color: '#6b5b4f' },
      { time: '7:30–9:45a', task: 'Run to gym (Audible) → Glutes training → Subway home', category: 'GE', color: '#6b5b4f' },
      { time: '10a–12p', task: 'Intense study: skill needed for Alamo Bernal execution', category: 'Study', color: '#8a6d2f' },
      { time: '12–5p', task: 'Alamo Bernal — deep work block, build + ship', category: 'Alamo Bernal', color: '#2d5f3f' },
      { time: '5–7p', task: 'AI Socratic or EAIG meetup / Aidas', category: 'Community', color: '#2d4a6f' },
    ],
    plannedStudyHours: 2, plannedMeetings: 0,
  },
  {
    day: 'Wednesday', date: dates[2], theme: 'Research Day — Ralph + Armstrong',
    morningPrime: 'What artifact will you and Michael produce together today?',
    blocks: [
      { time: '7:00–7:30a', task: 'Journal + meditate', category: 'GE', color: '#6b5b4f' },
      { time: '7:30–9:45a', task: 'Run to gym (Audible) → VO2 Max intervals → Subway home', category: 'GE', color: '#6b5b4f' },
      { time: '10a–12p', task: 'Intense study: complexity economics paper or Farmer chapter', category: 'Study', color: '#8a6d2f' },
      { time: '12–2p', task: 'Research session with Michael Ralph', category: 'Research', color: '#2d4a6f' },
      { time: '2–5p', task: 'Armstrong — quant ML or CEcon research code', category: 'Armstrong', color: '#7c2d2d' },
      { time: '5–7p', task: 'Homebrew community / creative time', category: 'Love & Play', color: '#2d5f3f' },
    ],
    plannedStudyHours: 2, plannedMeetings: 1,
  },
  {
    day: 'Thursday', date: dates[3], theme: 'Alamo Bernal — focused delivery (2 of 2)',
    morningPrime: 'Close the Alamo Bernal milestone. What ships today?',
    blocks: [
      { time: '7:00–7:30a', task: 'Journal + meditate', category: 'GE', color: '#6b5b4f' },
      { time: '7:30–9:45a', task: 'Run to gym (Audible) → Pull training → Subway home', category: 'GE', color: '#6b5b4f' },
      { time: '10a–12p', task: 'Intense study: skill needed for Alamo Bernal or Armstrong', category: 'Study', color: '#8a6d2f' },
      { time: '12–5p', task: 'Alamo Bernal — polish, deploy, document, close week', category: 'Alamo Bernal', color: '#2d5f3f' },
      { time: '5–7p', task: 'AGI Reading Group (Neel) / Aidas', category: 'Community', color: '#2d4a6f' },
    ],
    plannedStudyHours: 2, plannedMeetings: 0,
  },
  {
    day: 'Friday', date: dates[4], theme: 'Armstrong — ship + present',
    morningPrime: 'What did you build this week? Present your work. Close open loops.',
    blocks: [
      { time: '7:00–7:30a', task: 'Journal + meditate', category: 'GE', color: '#6b5b4f' },
      { time: '7:30–9:45a', task: 'Run to gym (Audible) → Glutes training → Subway home', category: 'GE', color: '#6b5b4f' },
      { time: '10a–12p', task: 'Intense study: prepare reading group presentation', category: 'Study', color: '#8a6d2f' },
      { time: '12–2p', task: 'Armstrong — close the week, review with Dave', category: 'Armstrong', color: '#7c2d2d' },
      { time: '2–4p', task: 'Reading group presentation (AGI or EAIG)', category: 'Study', color: '#8a6d2f' },
      { time: '4–5p', task: 'Meetings — quants / builders / family offices', category: 'Armstrong', color: '#7c2d2d' },
      { time: '5–7p', task: 'Date night / social plans', category: 'Love & Play', color: '#2d5f3f' },
    ],
    plannedStudyHours: 2, plannedMeetings: 2,
  },
  {
    day: 'Saturday', date: dates[5], theme: 'Recharge — love, beauty, play',
    morningPrime: 'No deep work. Read, move, connect. Let the week integrate.',
    blocks: [
      { time: '6:00–6:30a', task: 'Journal + meditate', category: 'GE', color: '#6b5b4f' },
      { time: '9–10a', task: 'Zone 2 run or outdoor movement', category: 'GE', color: '#6b5b4f' },
      { time: '10a–12p', task: 'Long-form reading — textbook or book for pleasure', category: 'Study', color: '#8a6d2f' },
      { time: 'afternoon', task: 'Aidas / friends / aesthetic experience', category: 'Love & Play', color: '#2d5f3f' },
    ],
    plannedStudyHours: 2, plannedMeetings: 0,
  },
  {
    day: 'Sunday', date: dates[6], theme: 'Set the Week — synthesis + planning',
    morningPrime: 'What did you learn? What advances the roadmap next week?',
    blocks: [
      { time: '6:00–6:30a', task: 'Journal + meditate', category: 'GE', color: '#6b5b4f' },
      { time: '7–8a', task: 'VO2 Max or light movement', category: 'GE', color: '#6b5b4f' },
      { time: '10–11a', task: 'Weekly synthesis — journal + retro', category: 'Research', color: '#2d4a6f' },
      { time: '11a–12p', task: 'Plan next week from roadmap', category: 'Armstrong', color: '#7c2d2d' },
      { time: 'afternoon', task: 'Aidas / meal prep / rest', category: 'Love & Play', color: '#2d5f3f' },
    ],
    plannedStudyHours: 0, plannedMeetings: 0,
  },
]

const scorecard: WeeklyScorecardMetric[] = [
  { key: 'focus_hours', label: 'Focus Hours', target: '30', targetNumeric: 30, actual: null, unit: 'hrs' },
  { key: 'study_hours', label: 'Study Hours', target: '10', targetNumeric: 10, actual: null, unit: 'hrs' },
  { key: 'meetings', label: 'Meetings', target: '5', targetNumeric: 5, actual: null },
  { key: 'papers_read', label: 'Papers Read', target: '2', targetNumeric: 2, actual: null },
  { key: 'book_hours', label: 'Book Hours (incl. Audible)', target: '10', targetNumeric: 10, actual: null, unit: 'hrs' },
  { key: 'presentations', label: 'Presentations', target: '1', targetNumeric: 1, actual: null },
  { key: 'vo2', label: 'Cardio Sessions', target: '5', targetNumeric: 5, actual: null },
  { key: 'sleep', label: 'Sleep 7+hrs', target: '7/7', targetNumeric: 7, actual: null },
]

const projects: WeeklyProjectAllocation[] = [
  { projectName: 'Armstrong', role: 'Spine', description: 'Prospective hedge fund R&D lab with Dave — ML/AI/Agents/Markets', color: '#7c2d2d' },
  { projectName: 'Alamo Bernal', role: 'Channel', description: 'Paid tech work — profit protection ($2.5k/mo + perf). 2 days/week.', color: '#2d5f3f' },
  { projectName: 'CEcon Research', role: 'Channel', description: 'Complexity economics with Michael Ralph → Doyne Farmer', color: '#2d4a6f' },
  { projectName: 'Study (RL/AI)', role: 'Channel', description: 'Stanford RL, AI/ML curriculum, reading group presentations', color: '#8a6d2f' },
  { projectName: 'Homebrew', role: 'Channel', description: 'AI Frontier community — social learning + network', color: '#6b5b4f' },
]

/** Returns the seed data without writing to Firestore */
export function getThisWeekPlanData(): Partial<WeeklyPlan> {
  return {
    weekStartDate: WEEK_START,
    weekEndDate: WEEK_END,
    weekLabel: formatWeekLabel(WEEK_START, WEEK_END),
    status: 'active',
    spineResolution: 'Armstrong conviction-building with Dave is the primary thread. Alamo Bernal delivers revenue in 2 concentrated days. Study and research advance the intellectual roadmap daily.',
    spineResolutionDetail: 'The week centers on deepening Armstrong conviction through direct work with Dave — identifying specific signals, running backtests, and making a decision on time commitment. Alamo Bernal ships its milestone in 2 focused days (Tue + Thu). Daily 2hr study blocks advance Stanford RL and complexity economics. Evenings are protected for love, community, and play.',
    revenueTarget: 'AB milestone delivered + Armstrong conviction decision',
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
