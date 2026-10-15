// Hong & Stein (1999), "A unified theory of underreaction, momentum trading,
// and overreaction in asset markets", Journal of Finance 54(6), 2143–2184.
//
// Two kinds of boundedly rational traders. Newswatchers each see a slice of
// the news, so a piece of information diffuses into the price over z periods
// (underreaction). Momentum traders condition only on the last price change
// and hold for j periods; by chasing the slow diffusion they push the price
// past the fundamental (overreaction), which later reverses.
//
//   newswatcher price:  P^N_t = D_0 + Σ_s ε_s · min(1, (t − s + 1)/z)
//   momentum demand:    M_t   = φ (P_{t−1} − P_{t−1−j})     (j overlapping cohorts)
//   price:              P_t   = P^N_t + M_t

import { autocorr, diff, gauss, num, rng, signed } from './sim'
import type { ModelSpec, Point } from './types'

function newsPrice(eps: number[], t: number, z: number): number {
  let p = 0
  for (let s = 0; s <= t; s++) p += eps[s] * Math.min(1, (t - s + 1) / z)
  return p
}

function run(eps: number[], z: number, j: number, phi: number): number[] {
  const P: number[] = []
  for (let t = 0; t < eps.length; t++) {
    const pn = newsPrice(eps, t, z)
    const back = t - 1 - j
    const m = t >= 1 ? phi * (P[t - 1] - (back >= 0 ? P[back] : 0)) : 0
    P.push(pn + m)
  }
  return P
}

export const hongStein: ModelSpec = {
  id: 'hong-stein',
  numeral: 'IV',
  question: 'Why does a price first underreact to news and then overreact to it?',
  answer:
    'News spreads slowly, so the price drifts for months after it arrives; momentum traders chase the drift and carry the price past the fundamental; the overshoot then reverses. Underreaction and overreaction are the same mechanism seen at two horizons.',
  paper: {
    cite: 'Hong & Stein (1999)',
    title: 'A unified theory of underreaction, momentum trading, and overreaction in asset markets',
    venue: 'Journal of Finance 54(6), 2143–2184',
    url: 'https://www.nber.org/system/files/working_papers/w6324/w6324.pdf',
    libraryId: 'lib-hong-stein',
  },
  mechanism:
    'Newswatchers forecast from fundamentals but each sees only part of the news, so a given piece of information takes z periods to be fully in the price. That slow drift is a pattern, and momentum traders — who look only at the last price change — trade on it, holding for j periods. Early momentum cohorts are paid by later ones; the late cohorts buy after the news is already fully priced and lose when the overshoot unwinds.',
  armstrong:
    'An analyst upgrade is news that diffuses: the strategy rule — three or more ratings inside ninety days — is a diffusion detector. This model says what the return path after such news looks like: a drift of roughly z periods (the time to enter), then an overshoot that momentum capital adds (the time to exit), then a reversal that a 1–2 year option must not be caught holding through. z and j are the two clocks the book is implicitly betting on.',
  watch: [
    'Set φ to zero: the impulse response is pure underreaction — the price climbs to the fundamental over z periods and stops there.',
    'Raise φ: an overshoot appears after the drift and a reversal follows; the peak is the exit the strategy would want.',
    'Lengthen j, the momentum holding period: the overshoot arrives later and lasts longer.',
    'In the autocorrelation panel, momentum shows as positive short-lag bars and reversal as negative long-lag bars — the same pattern the empirical literature finds.',
  ],
  fidelity: 'simplified',
  fidelityNote:
    'The diffusion and overlapping-cohort momentum structure follow the paper; the momentum traders’ aggressiveness φ is set by a slider rather than solved from their risk tolerance as an equilibrium, and newswatchers’ risk aversion is normalised into φ.',
  params: [
    { key: 'z', label: 'z · diffusion time', min: 1, max: 24, step: 1, default: 12, meaning: 'Periods it takes a piece of news to be fully reflected in the newswatchers’ price.' },
    { key: 'j', label: 'j · momentum holding period', min: 1, max: 24, step: 1, default: 12, meaning: 'How long each momentum cohort holds before unwinding.' },
    { key: 'phi', label: 'φ · momentum aggressiveness', min: 0, max: 0.6, step: 0.01, default: 0.15, meaning: 'Position each momentum cohort takes per unit of last period’s price change.' },
    { key: 'sigma', label: 'σ · news volatility', min: 0.2, max: 2, step: 0.1, default: 1, meaning: 'Size of the random news in the autocorrelation experiment.' },
  ],
  charts: [
    {
      id: 'impulse',
      title: 'Price response to one unit of news at period 5',
      read: 'The drift up to the fundamental is underreaction; anything above the line is the overshoot; the fall back is the reversal.',
      kind: 'line',
      xKey: 't',
      xLabel: 'period',
      yLabel: 'price',
      series: [{ key: 'P', label: 'price', role: 'accent' }],
      refY: [1],
      refX: [5],
      xTicks: [0, 20, 40, 60, 80],
    },
    {
      id: 'acf',
      title: 'Return autocorrelation by horizon, random news',
      read: 'Positive at short lags is momentum; negative at long lags is reversal — both from one mechanism.',
      kind: 'bars',
      xKey: 'lag',
      xLabel: 'lag (periods)',
      yLabel: 'autocorrelation',
      series: [{ key: 'ac', label: 'autocorrelation', role: 'accent' }],
      refY: [0],
      signed: true,
    },
  ],
  simulate: (p, seed) => {
    const z = Math.max(1, Math.round(p.z))
    const j = Math.max(1, Math.round(p.j))
    const T = 80
    const eps = new Array<number>(T).fill(0)
    eps[5] = 1
    const P = run(eps, z, j, p.phi)
    const impulse: Point[] = P.map((v, t) => ({ t, P: +v.toFixed(4) }))
    let peak = 0
    let peakT = 0
    for (let t = 0; t < T; t++) if (P[t] > peak) {
      peak = P[t]
      peakT = t
    }
    const r = rng(seed)
    const N = 2500
    const noise = new Array<number>(N).fill(0).map(() => p.sigma * gauss(r))
    const PR = run(noise, z, j, p.phi)
    const rets = diff(PR.slice(200))
    const acf: Point[] = []
    for (let lag = 1; lag <= 36; lag++) acf.push({ lag, ac: +autocorr(rets, lag).toFixed(4) })
    const trough = acf.reduce((a, b) => (b.ac < a.ac ? b : a))
    const blown = !PR.every(Number.isFinite) || Math.max(...PR.map(Math.abs)) > 1e6
    const verdict = blown
      ? 'Unstable: momentum demand feeds on itself faster than the news can anchor it. Lower φ or shorten j.'
      : peak <= 1.001
        ? 'Pure underreaction: the price drifts to the fundamental over z periods and stays — there is no momentum capital to overshoot.'
        : `Overshoot of ${signed(100 * (peak - 1), 0)}% at period ${peakT}: the drift invites momentum, momentum carries the price past the news, and the excess unwinds.`
    return {
      data: { impulse, acf },
      readouts: [
        { label: 'Peak price', value: num(peak, 3), note: 'fundamental is 1.000' },
        { label: 'Periods to peak', value: `${peakT - 5}`, note: 'after the news' },
        { label: 'Autocorr, lag 1', value: num(acf[0].ac, 3), note: 'momentum if positive' },
        { label: 'Deepest reversal', value: `${num(trough.ac, 3)} at lag ${trough.lag}`, note: 'the most negative autocorrelation' },
      ],
      verdict,
    }
  },
}
