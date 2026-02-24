import type { DailyLog, DailyAllocation, GarminMetrics, WeeklyScorecardMetric, WeeklyPlan } from './types'
import { localDateString, weekStartDate } from './date-utils'
import { TRAINING_SCHEDULE } from './constants'

// ─── Week Date Helpers ──────────────────────────────────────────────

export function getWeekDates(date: Date = new Date()): { start: string; end: string; dates: string[] } {
  const startStr = weekStartDate(date)
  const startDate = new Date(startStr + 'T12:00:00')
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    dates.push(localDateString(d))
  }
  return { start: dates[0], end: dates[6], dates }
}

export function formatWeekLabel(startDate: string, endDate: string): string {
  const s = new Date(startDate + 'T12:00:00')
  const e = new Date(endDate + 'T12:00:00')
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' })
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' })
  const sDay = s.getDate()
  const eDay = e.getDate()
  const year = e.getFullYear()
  if (sMonth === eMonth) {
    return `${sMonth} ${sDay} – ${eDay}, ${year}`
  }
  return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${year}`
}

// ─── Scorecard Auto-Population ──────────────────────────────────────

export interface WeeklyActuals {
  revenue_asks: number
  ships: number
  posts: number
  revenue: number
  vo2: number
  sleep: number
  focus_hours: number
}

export function computeWeeklyActuals(
  logs: DailyLog[],
  garminMetrics?: GarminMetrics[]
): WeeklyActuals {
  let revenueAsks = 0
  let ships = 0
  let posts = 0
  let revenue = 0
  let vo2 = 0
  let sleepDays = 0
  let focusHours = 0

  for (const log of logs) {
    revenueAsks += log.revenueAsksCount || 0
    posts += log.publicPostsCount || 0
    revenue += log.revenueThisSession || 0
    focusHours += log.focusHoursActual || 0

    // Ships: use shipsCount if available, else check whatShipped
    if (typeof log.shipsCount === 'number' && log.shipsCount > 0) {
      ships += log.shipsCount
    } else if (log.whatShipped && log.whatShipped.trim()) {
      ships += 1
    }

    // VO2: check trainingTypes array for 'vo2'
    if (log.trainingTypes && log.trainingTypes.includes('vo2')) {
      vo2 += 1
    } else if (log.trainingType === 'vo2') {
      vo2 += 1
    }

    // Sleep: check log.sleepHours >= 7
    if (log.sleepHours && log.sleepHours >= 7) {
      sleepDays += 1
    }
  }

  // If garmin data available, use sleep score as fallback
  if (garminMetrics && sleepDays === 0) {
    for (const g of garminMetrics) {
      // Garmin sleep score >= 60 is roughly 7+ hours
      if (g.sleepScore && g.sleepScore >= 60) {
        sleepDays += 1
      }
    }
  }

  return {
    revenue_asks: revenueAsks,
    ships,
    posts,
    revenue,
    vo2,
    sleep: sleepDays,
    focus_hours: focusHours,
  }
}

export function mergeActualsIntoScorecard(
  scorecard: WeeklyScorecardMetric[],
  actuals: WeeklyActuals
): WeeklyScorecardMetric[] {
  return scorecard.map(metric => ({
    ...metric,
    actual: actuals[metric.key as keyof WeeklyActuals] ?? null,
  }))
}

// ─── Default Scorecard ──────────────────────────────────────────────

export function defaultScorecard(): WeeklyScorecardMetric[] {
  return [
    { key: 'revenue_asks', label: 'Revenue Asks', target: '21', targetNumeric: 21, actual: null },
    { key: 'ships', label: 'Public Ships', target: '5', targetNumeric: 5, actual: null },
    { key: 'posts', label: 'Own', target: '7', targetNumeric: 7, actual: null },
    { key: 'revenue', label: 'Revenue', target: '$2k', targetNumeric: 2000, actual: null, unit: '$' },
    { key: 'vo2', label: 'VO2 Sessions', target: '2', targetNumeric: 2, actual: null },
    { key: 'sleep', label: 'Sleep 7+hrs', target: '7/7', targetNumeric: 7, actual: null },
  ]
}

// ─── Empty Plan Factory ─────────────────────────────────────────────

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function createEmptyWeeklyPlan(date: Date = new Date()): Omit<WeeklyPlan, 'createdAt' | 'updatedAt'> {
  const { start, end, dates } = getWeekDates(date)

  const dailyAllocations: DailyAllocation[] = dates.map((d, i) => {
    const dayName = DAY_NAMES[i]
    const training = TRAINING_SCHEDULE[dayName]
    return {
      day: dayName,
      date: d,
      theme: '',
      morningPrime: '',
      blocks: training ? [{
        time: training.time,
        task: training.label,
        category: 'GE',
        color: '#6b5b4f',
      }] : [],
      plannedAsks: 0,
      plannedShips: 0,
      plannedPosts: 0,
    }
  })

  return {
    weekStartDate: start,
    weekEndDate: end,
    weekLabel: formatWeekLabel(start, end),
    status: 'draft',
    spineResolution: '',
    spineResolutionDetail: '',
    revenueTarget: '',
    goals: [],
    dailyAllocations,
    scorecard: defaultScorecard(),
    projects: [],
    aiGenerated: false,
  }
}

/** Ensure every day in allocations has a training block from TRAINING_SCHEDULE */
export function ensureTrainingBlocks(allocations: DailyAllocation[]): DailyAllocation[] {
  return allocations.map(day => {
    const training = TRAINING_SCHEDULE[day.day]
    if (!training) return day
    const hasTraining = day.blocks.some(b => b.category === 'GE')
    if (hasTraining) return day
    return {
      ...day,
      blocks: [
        { time: training.time, task: training.label, category: 'GE', color: '#6b5b4f' },
        ...day.blocks,
      ],
    }
  })
}
