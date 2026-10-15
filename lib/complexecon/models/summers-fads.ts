// Summers (1986), "Does the stock market rationally reflect fundamental values?",
// Journal of Finance 41(3), 591–601.
//
// Price = fundamental + a slowly decaying "fad". Monthly returns look almost
// unpredictable; multi-year returns are strongly predictable from the gap.
//
//   p_t  = p*_t + u_t
//   p*_t = p*_{t−1} + ε_t,           ε ~ N(0, σ_ε²)      (fundamental: random walk)
//   u_t  = ρ u_{t−1} + η_t,          η ~ N(0, σ_η²)      (fad: AR(1), persistence ρ)
//
// Closed forms, with Var(u) = σ_η² / (1 − ρ²) and the k-period return r_k:
//   Var(r_k)       = k σ_ε² + 2 Var(u)(1 − ρ^k)
//   Cov(r_k, u_t)  = −(1 − ρ^k) Var(u)
//   R²(k)          = (1 − ρ^k)² Var(u) / Var(r_k)            (gap predicts the k-period return)
//   ρ_k            = −(1 − ρ^k)² Var(u) / Var(r_k)           (autocorrelation of successive k-period returns)

import { gauss, num, pct, rng } from './sim'
import type { ModelSpec, Point } from './types'

export const summersFads: ModelSpec = {
  id: 'summers-fads',
  numeral: 'V',
  question: 'If prices carry a slow-moving error, why can nobody see it in monthly returns — and why does it show up at two years?',
  answer:
    'A fad that decays with a multi-year half-life leaves monthly returns looking like a random walk, because each month only a sliver of it unwinds. Over one to three years most of it unwinds, so the gap between price and value predicts the return. The horizon is not a preference; it is where the signal lives.',
  paper: {
    cite: 'Summers (1986)',
    title: 'Does the stock market rationally reflect fundamental values?',
    venue: 'Journal of Finance 41(3), 591–601',
    url: 'https://larrysummers.com/wp-content/uploads/2025/04/Summers-StockMarketRationally-1986-1.pdf',
    libraryId: 'lib-summers',
  },
  mechanism:
    'The fundamental moves as a random walk; on top of it sits an error term that decays a little each month. A regression of next month’s return on today’s gap has almost no power, because next month’s change in the error is tiny relative to the random news. Stretch the window to k months and the error’s decay accumulates while the news only adds variance linearly — so the share of the k-month return explained by today’s gap rises with k.',
  armstrong:
    'This is the arithmetic case for a 12–36 month option over a 3-month one. With the paper’s illustrative persistence (ρ ≈ 0.98 monthly, a three-year half-life) a gap between price and an anchored value explains almost none of next month’s return and a large share of the two-year return. The R² at 12 and 24 months is the number the strategy is built on; move ρ and σ_η and watch where it peaks.',
  watch: [
    'Read R² at k = 1 (nothing) against k = 24 (a lot) — this is the whole argument.',
    'Shorten the half-life (lower ρ): the predictability arrives sooner and peaks at a shorter horizon, then fades as the fad has fully unwound.',
    'Shrink the fad (lower σ_η): the gap predicts less at every horizon — the price is mostly fundamental.',
    'The autocorrelation panel stays near zero at one month even when the two-year number is large: the test that cannot see the fad.',
  ],
  fidelity: 'faithful',
  fidelityNote:
    'The paper’s model and its variance algebra, evaluated in closed form; the sample path is one draw from the same process.',
  params: [
    { key: 'rho', label: 'ρ · fad persistence (monthly)', min: 0.8, max: 0.995, step: 0.005, default: 0.98, meaning: 'Fraction of the fad that survives each month; 0.98 is a half-life of about 34 months.' },
    { key: 'sigEta', label: 'σ_η · fad shocks', min: 0, max: 0.1, step: 0.005, default: 0.05, meaning: 'Monthly volatility of new fad; sets how big the price error gets — 0.05 with ρ = 0.98 makes the price typically 25% off value.' },
    { key: 'sigEps', label: 'σ_ε · fundamental news', min: 0.01, max: 0.1, step: 0.005, default: 0.04, meaning: 'Monthly volatility of the fundamental itself.' },
  ],
  charts: [
    {
      id: 'horizon',
      title: 'How much of the k-month return the gap explains, R²(k)',
      read: 'Near zero at one month, rising through one and two years, flattening once the fad has mostly unwound.',
      kind: 'line',
      xKey: 'k',
      xLabel: 'horizon (months)',
      yLabel: 'R²',
      series: [{ key: 'r2', label: 'R²', role: 'accent' }],
      refX: [12, 24],
      xTicks: [1, 12, 24, 36, 48, 60],
    },
    {
      id: 'acf',
      title: 'Autocorrelation of successive k-month returns',
      read: 'Invisible at short horizons, clearly negative at long ones — mean reversion only shows itself when you look far enough.',
      kind: 'line',
      xKey: 'k',
      xLabel: 'horizon (months)',
      yLabel: 'ρ_k',
      series: [{ key: 'ac', label: 'autocorrelation', role: 'accent' }],
      refY: [0],
      refX: [12, 24],
      xTicks: [1, 12, 24, 36, 48, 60],
    },
    {
      id: 'path',
      title: 'One sample path — log price and log fundamental, 20 years',
      read: 'The price wanders from the fundamental for years at a time; each gap eventually closes.',
      kind: 'line',
      xKey: 't',
      xLabel: 'month',
      yLabel: 'log level',
      series: [
        { key: 'p', label: 'price', role: 'accent' },
        { key: 'f', label: 'fundamental', role: 'context' },
      ],
    },
  ],
  simulate: (p, seed) => {
    const rho = p.rho
    const varU = (p.sigEta * p.sigEta) / (1 - rho * rho)
    const varEps = p.sigEps * p.sigEps
    const horizon: Point[] = []
    const acf: Point[] = []
    let r2at = { 1: 0, 12: 0, 24: 0 } as Record<number, number>
    for (let k = 1; k <= 60; k++) {
      const decay = 1 - Math.pow(rho, k)
      const varR = k * varEps + 2 * varU * decay
      const r2 = varR > 0 ? (decay * decay * varU) / varR : 0
      const ac = varR > 0 ? -(decay * decay * varU) / varR : 0
      horizon.push({ k, r2: +r2.toFixed(4) })
      acf.push({ k, ac: +ac.toFixed(4) })
      if (k === 1 || k === 12 || k === 24) r2at = { ...r2at, [k]: r2 }
    }
    const r = rng(seed)
    const path: Point[] = []
    let f = 0
    let u = 0
    for (let t = 0; t <= 240; t++) {
      if (t > 0) {
        f += p.sigEps * gauss(r)
        u = rho * u + p.sigEta * gauss(r)
      }
      path.push({ t, p: +(f + u).toFixed(4), f: +f.toFixed(4) })
    }
    const halfLife = Math.log(0.5) / Math.log(rho)
    const monthlyShare = (2 * varU * (1 - rho)) / (varEps + 2 * varU * (1 - rho))
    const best = horizon.reduce((a, b) => (b.r2 > a.r2 ? b : a))
    const ratio = r2at[1] > 0 ? Math.round(r2at[24] / r2at[1]) : 0
    const verdict = `The gap explains ${pct(r2at[1], 1)} of next month’s return and ${pct(r2at[24], 0)} of the two-year return${ratio > 1 ? ` — ${ratio}× the monthly figure` : ''}; predictability ${best.k >= 60 ? 'is still rising at five years' : `peaks at ${best.k} months`}. A ${Math.round(halfLife)}-month half-life is invisible month to month and visible at the option’s horizon.`
    return {
      data: { horizon, acf, path },
      readouts: [
        { label: 'Fad half-life', value: `${halfLife.toFixed(0)} months`, note: 'ln 0.5 / ln ρ' },
        { label: 'Fad share of monthly variance', value: pct(monthlyShare, 0), note: 'how much of a month’s move is fad, not news' },
        { label: 'R² at 12 months', value: num(r2at[12], 2), note: 'gap → one-year return' },
        { label: 'R² at 24 months', value: num(r2at[24], 2), note: 'gap → two-year return' },
      ],
      verdict,
    }
  },
}
