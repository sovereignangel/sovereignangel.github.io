/**
 * Seed data for the current week — strategic priorities Q2 2026.
 * Call seedThisWeek(uid) to write to Firestore.
 */

import { saveWeeklyPlan } from './firestore'
import type { WeeklyPlan, WeeklyGoal, DailyAllocation, WeeklyScorecardMetric, WeeklyProjectAllocation } from './types'
import { getWeekDates, formatWeekLabel } from './weekly-plan-utils'

const { start: WEEK_START, end: WEEK_END, dates } = getWeekDates()

const goals: WeeklyGoal[] = [
  {
    id: 'alamo',
    label: 'ALAMO BERNAL',
    title: 'Ship next tech milestone for Alamo Bernal',
    weight: 35,
    accent: '#2d5f3f',
    pillar: 'Alamo Bernal',
    items: [
      { task: 'Deep work block: build next deliverable', day: 'Mon–Tue', outcome: 'Feature shipped', completed: false },
      { task: 'Review with Alamo Bernal team', day: 'Wed', outcome: 'Feedback incorporated', completed: false },
      { task: 'Polish and deploy', day: 'Thu', outcome: 'Live in production', completed: false },
      { task: 'Document architecture decisions', day: 'Fri', outcome: 'Decision log updated', completed: false },
    ],
    ruin: 'Paid work stalls → revenue dries up → no runway for everything else.',
  },
  {
    id: 'armstrong',
    label: 'ARMSTRONG FUND',
    title: 'Advance fund infrastructure',
    weight: 20,
    accent: '#7c2d2d',
    pillar: 'Armstrong',
    items: [
      { task: 'Work on signal pipeline / backtest framework', day: 'Tue–Wed', outcome: 'Signal implemented', completed: false },
      { task: 'Study de Prado or quant ML chapter', day: 'Thu', outcome: 'Chapter completed + notes', completed: false },
      { task: 'Meeting with quant / family office / builder', day: 'Any', outcome: 'Relationship advanced', completed: false },
    ],
    ruin: 'No fund progress → Armstrong stays a dashboard, never a vehicle.',
  },
  {
    id: 'research',
    label: 'RESEARCH (CE)',
    title: 'Advance complexity economics research with Ralph',
    weight: 20,
    accent: '#2d4a6f',
    pillar: 'Complexity Econ',
    items: [
      { task: 'Read 1-2 Farmer / complexity econ papers', day: 'Mon–Tue', outcome: 'Papers annotated', completed: false },
      { task: 'Research session with Michael Ralph', day: 'Wed', outcome: 'Shared artifact produced', completed: false },
      { task: 'Work on ABM or research code', day: 'Thu–Fri', outcome: 'Code committed', completed: false },
    ],
    ruin: 'No research velocity → Farmer path closes. Ralph collaboration stalls.',
  },
  {
    id: 'study',
    label: 'STUDY (RL/AI)',
    title: 'Deep learning & RL curriculum + reading group presentations',
    weight: 20,
    accent: '#8a6d2f',
    pillar: 'RL/AI/ML',
    items: [
      { task: 'CS224r or CS231n lecture + problem set', day: 'Mon', outcome: 'Lecture completed', completed: false },
      { task: 'Sutton & Barto or Goodfellow chapter', day: 'Tue–Wed', outcome: 'Chapter + exercises done', completed: false },
      { task: 'Prepare presentation for reading group', day: 'Thu', outcome: 'Slides / demo ready', completed: false },
      { task: 'Present at AGI or Engineering AI reading group', day: 'Fri–Sat', outcome: 'Presented, feedback received', completed: false },
    ],
    ruin: 'No study → intellectual stagnation. No presentations → invisible to community.',
  },
  {
    id: 'ge',
    label: 'ENERGY (GE)',
    title: 'Protect the biological machine',
    weight: 5,
    accent: '#6b5b4f',
    pillar: 'Energy',
    items: [
      { task: '7+ hours sleep every night', day: 'Daily', outcome: 'Garmin verified', completed: false },
      { task: 'Push training', day: 'Mon', outcome: 'Completed', completed: false },
      { task: 'Glutes training', day: 'Tue + Fri', outcome: 'Completed', completed: false },
      { task: 'VO2 Max intervals', day: 'Wed + Sun', outcome: 'Completed', completed: false },
      { task: 'Pull training', day: 'Thu', outcome: 'Completed', completed: false },
      { task: 'Zone 2 run (60min)', day: 'Sat', outcome: 'Completed', completed: false },
    ],
    ruin: 'GE → 0. Multiplicative ruin. Everything collapses.',
  },
]

const dailyAllocations: DailyAllocation[] = [
  {
    day: 'Monday', date: dates[0], theme: 'Deep Work — Alamo Bernal + RL/AI Study',
    morningPrime: 'What is the single most important Alamo Bernal deliverable this week?',
    blocks: [
      { time: '7–8a', task: 'Push training', category: 'GE', color: '#6b5b4f' },
      { time: '8–9a', task: 'CS224r lecture', category: 'Study', color: '#8a6d2f' },
      { time: '9a–12p', task: 'Alamo Bernal — deep work block', category: 'Alamo Bernal', color: '#2d5f3f' },
      { time: '1–2p', task: 'Complexity econ paper reading', category: 'Research', color: '#2d4a6f' },
      { time: '2–5p', task: 'Alamo Bernal continued', category: 'Alamo Bernal', color: '#2d5f3f' },
    ],
    plannedStudyHours: 2, plannedMeetings: 0,
  },
  {
    day: 'Tuesday', date: dates[1], theme: 'Build + Study — Armstrong + Textbooks',
    morningPrime: 'What signal or backtest can you advance for Armstrong today?',
    blocks: [
      { time: '7–8a', task: 'Glutes training', category: 'GE', color: '#6b5b4f' },
      { time: '8–9:30a', task: 'Sutton & Barto / Goodfellow chapter', category: 'Study', color: '#8a6d2f' },
      { time: '9:30a–12p', task: 'Armstrong — signal pipeline / backtest', category: 'Armstrong', color: '#7c2d2d' },
      { time: '1–3p', task: 'Alamo Bernal — deliverables', category: 'Alamo Bernal', color: '#2d5f3f' },
      { time: '3–5p', task: 'Complexity econ paper + notes', category: 'Research', color: '#2d4a6f' },
    ],
    plannedStudyHours: 3.5, plannedMeetings: 0,
  },
  {
    day: 'Wednesday', date: dates[2], theme: 'Research Day — Ralph + Armstrong',
    morningPrime: 'Research session with Ralph today. What artifact will you produce together?',
    blocks: [
      { time: '7–8a', task: 'VO2 Max intervals', category: 'GE', color: '#6b5b4f' },
      { time: '9–11a', task: 'Research session with Michael Ralph', category: 'Research', color: '#2d4a6f' },
      { time: '11a–12p', task: 'Process research notes → code or write-up', category: 'Research', color: '#2d4a6f' },
      { time: '1–3p', task: 'Alamo Bernal — review + incorporate feedback', category: 'Alamo Bernal', color: '#2d5f3f' },
      { time: '3–5p', task: 'Armstrong — quant ML study', category: 'Armstrong', color: '#7c2d2d' },
    ],
    plannedStudyHours: 2, plannedMeetings: 1,
  },
  {
    day: 'Thursday', date: dates[3], theme: 'Deep Work — Alamo Bernal + Presentation Prep',
    morningPrime: 'Polish Alamo Bernal deliverable. Prepare your reading group presentation.',
    blocks: [
      { time: '7–8a', task: 'Pull training', category: 'GE', color: '#6b5b4f' },
      { time: '8–9a', task: 'de Prado / quant chapter', category: 'Study', color: '#8a6d2f' },
      { time: '9a–12p', task: 'Alamo Bernal — polish + deploy', category: 'Alamo Bernal', color: '#2d5f3f' },
      { time: '1–3p', task: 'Prepare reading group presentation', category: 'Present', color: '#8a6d2f' },
      { time: '3–5p', task: 'Armstrong — backtest or signal work', category: 'Armstrong', color: '#7c2d2d' },
    ],
    plannedStudyHours: 3, plannedMeetings: 0,
  },
  {
    day: 'Friday', date: dates[4], theme: 'Ship + Present — Close the Week',
    morningPrime: 'What did you ship this week? Present your work. Close open loops.',
    blocks: [
      { time: '7–8a', task: 'Glutes training', category: 'GE', color: '#6b5b4f' },
      { time: '9–11a', task: 'Alamo Bernal — document + close week', category: 'Alamo Bernal', color: '#2d5f3f' },
      { time: '11a–12p', task: 'Reading group presentation', category: 'Present', color: '#8a6d2f' },
      { time: '1–3p', task: 'Meetings — quants / builders / family offices', category: 'Armstrong', color: '#7c2d2d' },
      { time: '3–5p', task: 'Research code — ABM or complexity project', category: 'Research', color: '#2d4a6f' },
    ],
    plannedStudyHours: 0, plannedMeetings: 2,
  },
  {
    day: 'Saturday', date: dates[5], theme: 'Recharge — Long-form Reading',
    morningPrime: 'No deep work. Read, run, recharge. Let the week integrate.',
    blocks: [
      { time: '9–10a', task: 'Zone 2 run (60min)', category: 'GE', color: '#6b5b4f' },
      { time: '10a–12p', task: 'Book reading — textbook of the week', category: 'Study', color: '#8a6d2f' },
    ],
    plannedStudyHours: 2, plannedMeetings: 0,
  },
  {
    day: 'Sunday', date: dates[6], theme: 'Set the Week — Synthesis + Planning',
    morningPrime: 'What did you learn? What advances the roadmap next week?',
    blocks: [
      { time: '7–8a', task: 'VO2 Max intervals', category: 'GE', color: '#6b5b4f' },
      { time: '10–11a', task: 'Weekly synthesis — journal + retro', category: 'Research', color: '#2d4a6f' },
      { time: '11a–12p', task: 'Plan next week from roadmap', category: 'Armstrong', color: '#7c2d2d' },
    ],
    plannedStudyHours: 0, plannedMeetings: 0,
  },
]

const scorecard: WeeklyScorecardMetric[] = [
  { key: 'focus_hours', label: 'Focus Hours', target: '30', targetNumeric: 30, actual: null, unit: 'hrs' },
  { key: 'study_hours', label: 'Study Hours', target: '10', targetNumeric: 10, actual: null, unit: 'hrs' },
  { key: 'meetings', label: 'Meetings', target: '5', targetNumeric: 5, actual: null },
  { key: 'papers_read', label: 'Papers Read', target: '2', targetNumeric: 2, actual: null },
  { key: 'book_hours', label: 'Book Hours', target: '5', targetNumeric: 5, actual: null, unit: 'hrs' },
  { key: 'presentations', label: 'Presentations', target: '1', targetNumeric: 1, actual: null },
  { key: 'vo2', label: 'VO2 Sessions', target: '2', targetNumeric: 2, actual: null },
  { key: 'sleep', label: 'Sleep 7+hrs', target: '7/7', targetNumeric: 7, actual: null },
]

const projects: WeeklyProjectAllocation[] = [
  { projectName: 'Alamo Bernal', role: 'Spine', description: 'Paid tech work — investment platform', color: '#2d5f3f' },
  { projectName: 'Armstrong Fund', role: 'Channel', description: 'Quantitative fund infrastructure', color: '#7c2d2d' },
  { projectName: 'Complexity Econ Research', role: 'Channel', description: 'Research with Michael Ralph → Doyne Farmer', color: '#2d4a6f' },
  { projectName: 'RL/AI Study', role: 'Channel', description: 'Deep learning + RL curriculum, reading group presentations', color: '#8a6d2f' },
]

/** Returns the seed data without writing to Firestore */
export function getThisWeekPlanData(): Partial<WeeklyPlan> {
  return {
    weekStartDate: WEEK_START,
    weekEndDate: WEEK_END,
    weekLabel: formatWeekLabel(WEEK_START, WEEK_END),
    status: 'active',
    spineResolution: 'Alamo Bernal is the revenue spine. Armstrong, research, and study advance the roadmap.',
    spineResolutionDetail: 'Paid work funds everything. Armstrong fund builds the quant vehicle. Complexity econ research with Ralph builds the path to Farmer. RL/AI study group + reading group presentations build the intellectual base and public reputation.',
    revenueTarget: 'AB milestone delivered',
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
