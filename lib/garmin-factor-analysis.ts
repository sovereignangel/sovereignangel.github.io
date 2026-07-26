import type { GarminMetrics, GarminActivity } from '@/lib/types'

// Quant-style factor analysis of nightly sleep score.
//
// Target: sleep score (0-100), nights since 2021-06-03, score > 5 (sub-5
// readings are partial/nap records, excluded as data errors).
// Factors are lagged to the prior day (t-1) so every signal was knowable
// before the night being predicted — no lookahead. Concurrent overnight
// physiology (HRV, RHR) is reported separately as diagnostic, not tradeable.
//
// Per factor: Spearman IC (rank correlation — robust to outliers and
// monotone-nonlinear effects), its t-stat, a trailing-12m IC for stability,
// a standardized univariate beta (score points per +1 sigma of factor), and
// quintile portfolio means with the Q5-Q1 spread.
// Jointly: OLS on z-scored factors (complete cases), reporting R-squared and
// per-factor t-stats so collinear factors (e.g. steps vs calories) get
// attributed rather than double-counted.

export interface FactorStat {
  key: string
  label: string
  group: 'lagged' | 'concurrent'
  n: number
  ic: number
  icT: number
  ic12m: number | null
  beta: number
  quintiles: number[]
  spread: number
}

export interface ModelCoefficient {
  key: string
  label: string
  beta: number
  t: number
}

export interface FactorModel {
  n: number
  r2: number
  adjR2: number
  coefficients: ModelCoefficient[]
}

export interface FactorAnalysis {
  universeN: number
  excludedLowScores: number
  meanScore: number
  sdScore: number
  stats: FactorStat[]
  model: FactorModel | null
}

function rank(values: number[]): number[] {
  const idx = values.map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0])
  const ranks = new Array(values.length).fill(0)
  let i = 0
  while (i < idx.length) {
    let j = i
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++
    const avgRank = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) ranks[idx[k][1]] = avgRank
    i = j + 1
  }
  return ranks
}

function pearsonXY(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return 0
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let cov = 0, vx = 0, vy = 0
  for (let i = 0; i < n; i++) {
    cov += (xs[i] - mx) * (ys[i] - my)
    vx += (xs[i] - mx) ** 2
    vy += (ys[i] - my) ** 2
  }
  return vx === 0 || vy === 0 ? 0 : cov / Math.sqrt(vx * vy)
}

function spearman(xs: number[], ys: number[]): number {
  return pearsonXY(rank(xs), rank(ys))
}

function sd(values: number[]): number {
  const m = values.reduce((s, v) => s + v, 0) / values.length
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length)
}

function quintileMeans(pairs: Array<[number, number]>): number[] {
  const sorted = [...pairs].sort((a, b) => a[0] - b[0])
  const out: number[] = []
  for (let q = 0; q < 5; q++) {
    const lo = Math.floor((q * sorted.length) / 5)
    const hi = Math.floor(((q + 1) * sorted.length) / 5)
    const bucket = sorted.slice(lo, hi)
    out.push(bucket.reduce((s, p) => s + p[1], 0) / Math.max(1, bucket.length))
  }
  return out
}

// Solve (X'X) b = X'y by Gaussian elimination with partial pivoting.
function solveOLS(X: number[][], y: number[]): { beta: number[]; tStats: number[]; r2: number } | null {
  const n = X.length
  const k = X[0].length
  if (n <= k + 2) return null
  const xtx: number[][] = Array.from({ length: k }, () => new Array(k).fill(0))
  const xty: number[] = new Array(k).fill(0)
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < k; a++) {
      xty[a] += X[i][a] * y[i]
      for (let b = a; b < k; b++) xtx[a][b] += X[i][a] * X[i][b]
    }
  }
  for (let a = 0; a < k; a++) for (let b = 0; b < a; b++) xtx[a][b] = xtx[b][a]

  // Augment with identity to also obtain the inverse (needed for t-stats)
  const aug = xtx.map((row, i) => [...row, ...Array.from({ length: k }, (_, j) => (i === j ? 1 : 0))])
  for (let col = 0; col < k; col++) {
    let pivot = col
    for (let r = col + 1; r < k; r++) if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r
    if (Math.abs(aug[pivot][col]) < 1e-10) return null
    ;[aug[col], aug[pivot]] = [aug[pivot], aug[col]]
    const pv = aug[col][col]
    for (let c = 0; c < 2 * k; c++) aug[col][c] /= pv
    for (let r = 0; r < k; r++) {
      if (r === col) continue
      const f = aug[r][col]
      for (let c = 0; c < 2 * k; c++) aug[r][c] -= f * aug[col][c]
    }
  }
  const inv = aug.map(row => row.slice(k))
  const beta = inv.map(row => row.reduce((s, v, j) => s + v * xty[j], 0))

  let ssr = 0, sst = 0
  const my = y.reduce((s, v) => s + v, 0) / n
  for (let i = 0; i < n; i++) {
    const pred = X[i].reduce((s, v, j) => s + v * beta[j], 0)
    ssr += (y[i] - pred) ** 2
    sst += (y[i] - my) ** 2
  }
  const sigma2 = ssr / (n - k)
  const tStats = beta.map((b, j) => b / Math.sqrt(Math.max(1e-12, sigma2 * inv[j][j])))
  return { beta, tStats, r2: sst === 0 ? 0 : 1 - ssr / sst }
}

const addDays = (date: string, days: number): string => {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

interface FactorDef {
  key: string
  label: string
  group: 'lagged' | 'concurrent'
  inModel: boolean
  // null = data missing (row dropped for this factor); number = usable value
  value: (row: Row) => number | null
}

interface Row {
  date: string
  score: number
  prev: GarminMetrics | undefined
  cur: GarminMetrics
  trainLoad1d: number
  trainMin1d: number
  evening1d: number
  trainLoad3d: number
  weekendNight: number
}

const nv = (v: number | null | undefined): number | null => (v == null ? null : v)

const FACTORS: FactorDef[] = [
  { key: 'trainLoad1d', label: 'Training load (t-1)', group: 'lagged', inModel: true, value: r => r.trainLoad1d },
  { key: 'trainMin1d', label: 'Training minutes (t-1)', group: 'lagged', inModel: true, value: r => r.trainMin1d },
  { key: 'evening1d', label: 'Evening workout after 18:00 (t-1)', group: 'lagged', inModel: true, value: r => r.evening1d },
  { key: 'trainLoad3d', label: 'Training load (t-3..t-1)', group: 'lagged', inModel: false, value: r => r.trainLoad3d },
  { key: 'steps1d', label: 'Steps (t-1)', group: 'lagged', inModel: true, value: r => nv(r.prev?.steps) },
  { key: 'stress1d', label: 'Avg stress (t-1)', group: 'lagged', inModel: true, value: r => nv(r.prev?.stressLevel) },
  { key: 'drained1d', label: 'Body battery drained (t-1)', group: 'lagged', inModel: true, value: r => nv(r.prev?.bodyBatteryDrained) },
  { key: 'intensity1d', label: 'Intensity minutes (t-1)', group: 'lagged', inModel: false, value: r => nv(r.prev?.intensityMinutes) },
  { key: 'prevScore', label: 'Sleep score (t-1)', group: 'lagged', inModel: true, value: r => nv(r.prev?.sleepScore) },
  { key: 'prevDur', label: 'Sleep duration hrs (t-1)', group: 'lagged', inModel: true, value: r => (r.prev?.sleepDurationMinutes == null ? null : r.prev.sleepDurationMinutes / 60) },
  { key: 'weekendNight', label: 'Fri or Sat night', group: 'lagged', inModel: true, value: r => r.weekendNight },
  { key: 'hrv', label: 'Overnight HRV (same night)', group: 'concurrent', inModel: false, value: r => nv(r.cur.hrvRmssd) },
  { key: 'rhr', label: 'Resting HR (same night)', group: 'concurrent', inModel: false, value: r => nv(r.cur.restingHeartRate) },
]

export function computeFactorAnalysis(
  metrics: GarminMetrics[],
  activities: GarminActivity[]
): FactorAnalysis {
  const byDate = new Map(metrics.map(m => [m.date, m]))

  const actByDate = new Map<string, { load: number; minutes: number; evening: boolean }>()
  for (const a of activities) {
    if (!a.date) continue
    const e = actByDate.get(a.date) ?? { load: 0, minutes: 0, evening: false }
    e.load += a.trainingLoad ?? 0
    e.minutes += (a.durationSeconds ?? 0) / 60
    const hour = Number(a.startTimeLocal?.slice(11, 13) ?? 0)
    if (hour >= 18) e.evening = true
    actByDate.set(a.date, e)
  }

  let excludedLowScores = 0
  const rows: Row[] = []
  for (const m of metrics) {
    if (m.date < '2021-06-03' || m.sleepScore == null) continue
    if (m.sleepScore <= 5) { excludedLowScores++; continue }
    const prevDate = addDays(m.date, -1)
    const act1 = actByDate.get(prevDate)
    let load3 = 0
    for (let d = 1; d <= 3; d++) load3 += actByDate.get(addDays(m.date, -d))?.load ?? 0
    const dow = new Date(m.date + 'T12:00:00').getDay() // wake morning: 0=Sun, 6=Sat
    rows.push({
      date: m.date,
      score: m.sleepScore,
      prev: byDate.get(prevDate),
      cur: m,
      trainLoad1d: act1?.load ?? 0,
      trainMin1d: act1?.minutes ?? 0,
      evening1d: act1?.evening ? 1 : 0,
      trainLoad3d: load3,
      weekendNight: dow === 0 || dow === 6 ? 1 : 0,
    })
  }

  const scores = rows.map(r => r.score)
  const sdY = sd(scores)
  const last = rows.length > 0 ? rows[rows.length - 1].date : '2026-01-01'
  const cutoff12m = addDays(last, -365)

  const stats: FactorStat[] = []
  for (const f of FACTORS) {
    const pairs: Array<[number, number]> = []
    const pairs12: Array<[number, number]> = []
    for (const r of rows) {
      const v = f.value(r)
      if (v == null) continue
      pairs.push([v, r.score])
      if (r.date >= cutoff12m) pairs12.push([v, r.score])
    }
    if (pairs.length < 60) continue
    const xs = pairs.map(p => p[0])
    const ys = pairs.map(p => p[1])
    const ic = spearman(xs, ys)
    const n = pairs.length
    const icT = ic * Math.sqrt((n - 2) / Math.max(1e-9, 1 - ic * ic))
    const ic12m = pairs12.length >= 60 ? spearman(pairs12.map(p => p[0]), pairs12.map(p => p[1])) : null
    const beta = pearsonXY(xs, ys) * sd(ys) // score points per +1 sigma of factor
    const quintiles = quintileMeans(pairs)
    stats.push({
      key: f.key, label: f.label, group: f.group, n, ic, icT, ic12m, beta,
      quintiles, spread: quintiles[4] - quintiles[0],
    })
  }
  stats.sort((a, b) => Math.abs(b.ic) - Math.abs(a.ic))

  // Multivariate: z-scored complete cases across model factors
  const modelDefs = FACTORS.filter(f => f.inModel)
  const complete = rows.filter(r => modelDefs.every(f => f.value(r) != null))
  let model: FactorModel | null = null
  if (complete.length > modelDefs.length * 10) {
    const cols = modelDefs.map(f => complete.map(r => f.value(r) as number))
    const zCols = cols.map(col => {
      const m = col.reduce((s, v) => s + v, 0) / col.length
      const s0 = sd(col) || 1
      return col.map(v => (v - m) / s0)
    })
    const X = complete.map((_, i) => [1, ...zCols.map(col => col[i])])
    const y = complete.map(r => r.score)
    const fit = solveOLS(X, y)
    if (fit) {
      model = {
        n: complete.length,
        r2: fit.r2,
        adjR2: 1 - (1 - fit.r2) * ((complete.length - 1) / (complete.length - X[0].length)),
        coefficients: modelDefs
          .map((f, j) => ({ key: f.key, label: f.label, beta: fit.beta[j + 1], t: fit.tStats[j + 1] }))
          .sort((a, b) => Math.abs(b.t) - Math.abs(a.t)),
      }
    }
  }

  return {
    universeN: rows.length,
    excludedLowScores,
    meanScore: scores.reduce((s, v) => s + v, 0) / Math.max(1, scores.length),
    sdScore: sdY,
    stats,
    model,
  }
}
