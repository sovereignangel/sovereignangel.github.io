// Johansen, Ledoit & Sornette (2000), "Crashes as critical points",
// International Journal of Theoretical and Applied Finance 3(2), 219–255 —
// the log-periodic power-law singularity (LPPLS) model of a bubble.
//
//   ln p(t) = A + B (t_c − t)^m + C (t_c − t)^m cos(ω ln(t_c − t) − φ)
//
// Price grows faster than exponentially into a critical time t_c (B < 0,
// 0 < m < 1), decorated by oscillations whose period shrinks as t_c nears.
// t_c is the most probable end of the bubble, not a guaranteed crash date.

import { gauss, num, rng } from './sim'
import type { ModelSpec, Point } from './types'

export const lppls: ModelSpec = {
  id: 'lppls',
  numeral: 'IX',
  question: 'What does a price look like when it is accelerating toward a critical point, and how would you tell?',
  answer:
    'Faster-than-exponential growth with oscillations that speed up as the critical time approaches. The signature is in the shape of the acceleration, not the level — and its empirical record as a crash predictor is contested, so it is one diagnostic among several, never a timer.',
  paper: {
    cite: 'Johansen, Ledoit & Sornette (2000)',
    title: 'Crashes as critical points',
    venue: 'International Journal of Theoretical and Applied Finance 3(2), 219–255',
    url: 'https://arxiv.org/abs/cond-mat/9810071',
    code: [{ label: 'lppls (Python, fits t_c · m · ω)', url: 'https://github.com/Boulder-Investment-Technologies/lppls' }],
    libraryId: 'lib-lppls',
  },
  mechanism:
    'Traders imitate their neighbours; imitation builds up until the whole market is one herd, which is the critical point. On the way there the price rises as a power law in the time remaining — each unit of time adds more than the last — and the imitation network’s hierarchy adds oscillations that compress as the end nears. A crash becomes likely at the critical time because the herd has run out of anyone to recruit.',
  armstrong:
    'A LEAP’s exit problem. A holding that has become a bubble leg is the one position where the mean-reversion models above stop helping — the gap to value is widening on purpose. This gives a shape to look for in the chart before deciding whether a winner is a thesis playing out or a herd approaching its critical time. Treat any fitted t_c as a probability, not a date.',
  watch: [
    'Lower m toward 0.1: the acceleration sharpens into a near-vertical final run.',
    'Raise ω: more oscillations, compressing faster into the end — the log-periodic signature.',
    'Set C to zero: the pure power law without oscillations; the shape is still super-exponential.',
    'Move t_c: the whole pattern rescales — the same shape stretched or compressed in time, which is why the model is fitted, not read off.',
  ],
  fidelity: 'faithful',
  fidelityNote:
    'The paper’s functional form, plotted directly with optional noise; no fitting procedure is included — the model is shown, not estimated.',
  params: [
    { key: 'tc', label: 't_c · critical time (days)', min: 60, max: 500, step: 10, default: 250, meaning: 'The most probable end of the bubble; the curve is drawn up to the day before.' },
    { key: 'm', label: 'm · acceleration exponent', min: 0.1, max: 0.9, step: 0.05, default: 0.4, meaning: 'Smaller means a sharper final acceleration.' },
    { key: 'omega', label: 'ω · log-periodic frequency', min: 3, max: 15, step: 0.5, default: 7, meaning: 'How many oscillations fit before t_c.' },
    { key: 'B', label: 'B · growth amplitude', min: -1.5, max: -0.1, step: 0.05, default: -0.6, meaning: 'Negative; larger in magnitude means more total rise into t_c.' },
    { key: 'Crel', label: 'C · oscillation amplitude', min: 0, max: 0.6, step: 0.02, default: 0.2, meaning: 'Size of the oscillations relative to the growth term.' },
    { key: 'noise', label: 'daily noise', min: 0, max: 0.03, step: 0.001, default: 0.008, meaning: 'Random daily moves added to the curve, so it looks like a price.' },
  ],
  charts: [
    {
      id: 'curve',
      title: 'Log price into the critical time',
      read: 'Super-exponential rise with oscillations that compress toward t_c; the grey line is the pure power law without them.',
      kind: 'line',
      xKey: 't',
      xLabel: 'day',
      yLabel: 'log price',
      series: [
        { key: 'p', label: 'price', role: 'accent' },
        { key: 'pl', label: 'power law only', role: 'context' },
      ],
    },
  ],
  simulate: (p, seed) => {
    const r = rng(seed)
    const tc = Math.round(p.tc)
    const C = p.Crel * Math.abs(p.B)
    const curve: Point[] = []
    let noiseAcc = 0
    for (let t = 0; t < tc; t++) {
      const tau = tc - t
      const pure = p.B * Math.pow(tau, p.m)
      const osc = C * Math.pow(tau, p.m) * Math.cos(p.omega * Math.log(tau))
      noiseAcc += p.noise * gauss(r)
      curve.push({ t, p: +(pure + osc + noiseAcc).toFixed(4), pl: +pure.toFixed(4) })
    }
    // The power-law term alone: how much of the rise lands in each half of the window.
    const start = p.B * Math.pow(tc, p.m)
    const mid = p.B * Math.pow(tc / 2, p.m)
    const half1 = mid - start
    const half2 = 0 - mid
    const oscillations = (p.omega * Math.log(tc)) / (2 * Math.PI)
    const verdict = `The second half of the window rises ${num(half2 / Math.max(1e-9, half1), 1)}× as much as the first — the super-exponential signature — with about ${oscillations.toFixed(1)} oscillations compressing into t_c.`
    return {
      data: { curve },
      readouts: [
        { label: 'Total log rise into t_c', value: num(-start, 2), note: 'from day 0 to the critical time' },
        { label: 'Second-half / first-half rise', value: `${num(half2 / Math.max(1e-9, half1), 1)}×`, note: 'above 1 is faster than exponential' },
        { label: 'Oscillations before t_c', value: oscillations.toFixed(1), note: 'ω ln t_c / 2π' },
      ],
      verdict,
    }
  },
}
