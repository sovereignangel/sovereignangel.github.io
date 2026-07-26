import type { GarminMetrics } from '@/lib/types'

export interface SleepNight {
  date: string
  sleepScore: number | null
  deepSleepMinutes: number | null
  lightSleepMinutes: number | null
  remSleepMinutes: number | null
  awakeMinutes: number | null
  hrvRmssd: number | null
  restingHeartRate: number | null
  respirationRate: number | null
}

export interface DriverCorrelation {
  key: string
  label: string
  r: number
  n: number
}

export interface DriverGroup {
  title: string
  note: string
  drivers: DriverCorrelation[]
}

export function pearson(pairs: Array<[number, number]>): { r: number; n: number } {
  const n = pairs.length
  if (n < 3) return { r: 0, n }
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n
  const my = pairs.reduce((s, p) => s + p[1], 0) / n
  let cov = 0, vx = 0, vy = 0
  for (const [x, y] of pairs) {
    cov += (x - mx) * (y - my)
    vx += (x - mx) ** 2
    vy += (y - my) ** 2
  }
  if (vx === 0 || vy === 0) return { r: 0, n }
  return { r: cov / Math.sqrt(vx * vy), n }
}

export function rollingMean(
  values: Array<number | null | undefined>,
  window: number
): Array<number | null> {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter(
      (v): v is number => v != null
    )
    return slice.length >= Math.min(3, window) ? slice.reduce((s, v) => s + v, 0) / slice.length : null
  })
}

export function mean(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v !== null && v !== undefined)
  return nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : null
}

function correlate(
  metrics: GarminMetrics[],
  outcome: (d: GarminMetrics) => number | null | undefined,
  factor: (d: GarminMetrics) => number | null | undefined,
  lag: number // 0 = same doc, 1 = factor from previous day's doc
): { r: number; n: number } {
  const pairs: Array<[number, number]> = []
  for (let i = lag; i < metrics.length; i++) {
    const y = outcome(metrics[i])
    const x = factor(metrics[i - lag])
    if (x !== null && x !== undefined && y !== null && y !== undefined) {
      pairs.push([x, y])
    }
  }
  return pearson(pairs)
}

// Sleep score on doc date D describes the night ending the morning of D.
// Prior-day drivers therefore come from doc D-1; next-day outcomes from doc D.
export function computeSleepDrivers(metrics: GarminMetrics[]): DriverGroup[] {
  const score = (d: GarminMetrics) => d.sleepScore

  const groupA: Array<[string, string, (d: GarminMetrics) => number | null | undefined, number]> = [
    ['prevSteps', 'Steps', d => d.steps, 1],
    ['prevCalories', 'Active calories', d => d.activeCalories, 1],
    ['prevStress', 'Avg stress', d => d.stressLevel, 1],
    ['prevDrained', 'Body battery drained', d => d.bodyBatteryDrained, 1],
    ['prevSleep', 'Previous night sleep score', d => d.sleepScore, 1],
  ]
  const groupB: Array<[string, string, (d: GarminMetrics) => number | null | undefined, number]> = [
    ['hrv', 'Overnight HRV', d => d.hrvRmssd, 0],
    ['rhr', 'Resting heart rate', d => d.restingHeartRate, 0],
    ['resp', 'Respiration rate', d => d.respirationRate, 0],
  ]
  const groupC: Array<[string, string, (d: GarminMetrics) => number | null | undefined, number]> = [
    ['charged', 'Body battery charged', d => d.bodyBatteryCharged, 0],
    ['nextStress', 'Avg stress that day', d => d.stressLevel, 0],
    ['nextSteps', 'Steps that day', d => d.steps, 0],
  ]

  const build = (
    defs: Array<[string, string, (d: GarminMetrics) => number | null | undefined, number]>
  ): DriverCorrelation[] =>
    defs
      .map(([key, label, factor, lag]) => {
        const { r, n } = correlate(metrics, score, factor, lag)
        return { key, label, r, n }
      })
      .filter(d => d.n >= 30)
      .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))

  return [
    {
      title: 'Previous Day — What Drives Tonight',
      note: 'Prior-day behavior vs. that night’s sleep score',
      drivers: build(groupA),
    },
    {
      title: 'Same Night — Co-Signals',
      note: 'Overnight physiology recorded alongside the score',
      drivers: build(groupB),
    },
    {
      title: 'Next Day — What Sleep Predicts',
      note: 'That night’s sleep score vs. the following day',
      drivers: build(groupC),
    },
  ]
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export interface WeekdayStat {
  label: string
  avg: number | null
  n: number
}

export function weekdaySleepPattern(metrics: GarminMetrics[]): WeekdayStat[] {
  const buckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const d of metrics) {
    if (d.sleepScore === null || d.sleepScore === undefined) continue
    // date is YYYY-MM-DD; parse as local, getDay(): 0=Sun
    const day = new Date(d.date + 'T12:00:00').getDay()
    const mondayIndexed = (day + 6) % 7
    buckets[mondayIndexed].push(d.sleepScore)
  }
  return buckets.map((vals, i) => ({
    label: WEEKDAY_LABELS[i],
    avg: vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null,
    n: vals.length,
  }))
}
