// Numerical helpers shared by the model files: a seeded generator (so a slider
// move is the only thing that changes a chart), summary statistics, thinning.

/** mulberry32 — small, fast, deterministic. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard normal draw by Box–Muller. */
export function gauss(r: () => number): number {
  let u = 0
  let v = 0
  while (u === 0) u = r()
  while (v === 0) v = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  let s = 0
  for (const x of xs) s += x
  return s / xs.length
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  let s = 0
  for (const x of xs) s += (x - m) * (x - m)
  return s / (xs.length - 1)
}

export const std = (xs: number[]) => Math.sqrt(variance(xs))

/** Sample autocorrelation at `lag`. */
export function autocorr(xs: number[], lag: number): number {
  const n = xs.length
  if (lag <= 0 || lag >= n - 1) return 0
  const m = mean(xs)
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) den += (xs[i] - m) * (xs[i] - m)
  for (let i = lag; i < n; i++) num += (xs[i] - m) * (xs[i - lag] - m)
  return den > 0 ? num / den : 0
}

/** Excess kurtosis — 0 for a normal, positive for fat tails. */
export function kurtosis(xs: number[]): number {
  const n = xs.length
  if (n < 4) return 0
  const m = mean(xs)
  let m2 = 0
  let m4 = 0
  for (const x of xs) {
    const d = x - m
    m2 += d * d
    m4 += d * d * d * d
  }
  m2 /= n
  m4 /= n
  return m2 > 0 ? m4 / (m2 * m2) - 3 : 0
}

/** Diffs of a series. */
export function diff(xs: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < xs.length; i++) out.push(xs[i] - xs[i - 1])
  return out
}

/** Half-life of an AR(1) fitted to the series, in steps; null when not mean-reverting. */
export function ar1HalfLife(xs: number[]): number | null {
  const phi = autocorr(xs, 1)
  if (!(phi > 0) || phi >= 1) return null
  return Math.log(0.5) / Math.log(phi)
}

/** Keep at most `max` points, evenly spaced, always keeping the last one. */
export function thin<T>(xs: T[], max: number): T[] {
  if (xs.length <= max) return xs
  const step = xs.length / max
  const out: T[] = []
  for (let i = 0; i < max; i++) out.push(xs[Math.floor(i * step)])
  out[out.length - 1] = xs[xs.length - 1]
  return out
}

export function histogram(xs: number[], bins: number, lo: number, hi: number): { x: number; count: number }[] {
  const counts = new Array<number>(bins).fill(0)
  const w = (hi - lo) / bins
  for (const x of xs) {
    let b = Math.floor((x - lo) / w)
    if (b < 0) b = 0
    if (b >= bins) b = bins - 1
    counts[b] += 1
  }
  return counts.map((count, i) => ({ x: +(lo + (i + 0.5) * w).toFixed(4), count }))
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26, |error| < 1.5e-7). */
export function normCdf(z: number): number {
  const sign = z < 0 ? -1 : 1
  const x = Math.abs(z) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * x)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x)
  return 0.5 * (1 + sign * y)
}

export const pct = (x: number, d = 1) => `${(100 * x).toFixed(d)}%`
export const num = (x: number, d = 2) => x.toFixed(d)
export const signed = (x: number, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`
