// Brock & Hommes (1998), "Heterogeneous beliefs and routes to chaos in a simple
// asset pricing model", Journal of Economic Dynamics and Control 22, 1235–1274.
//
// Four forecasting rules compete for market share. x_t is the price deviation
// from the fundamental; R = 1 + r. Rule h forecasts E_h[x_{t+1}] = g_h x_{t-1} + b_h.
//
//   R x_t      = Σ_h n_{h,t} (g_h x_{t-1} + b_h) + ε_t              (market clearing)
//   π_{h,t}    = (x_t − R x_{t-1}) (g_h x_{t-2} + b_h − R x_{t-1})    (realised profit)
//   n_{h,t+1}  = exp(β (π_{h,t} − C_h)) / Σ_j exp(β (π_{j,t} − C_j))  (discrete choice)
//
// The four rules are the paper's own: fundamentalists (0, 0) who pay a cost C,
// trend followers (g, b), contrarian-biased trend followers (g, −b), and strong
// trend followers (g > 1, 0). β is the intensity of choice — how fast traders
// desert a rule that just lost money.

import { autocorr, diff, gauss, mean, num, rng, std, thin } from './sim'
import type { ModelSpec, Point } from './types'

interface Rule {
  g: number
  b: number
  C: number
}

function run(rules: Rule[], beta: number, R: number, sigma: number, T: number, r: () => number) {
  let x2 = 0.05 // x_{t-2}
  let x1 = 0.05 // x_{t-1}
  let n = rules.map(() => 1 / rules.length)
  const xs: number[] = []
  const shares: number[][] = []
  for (let t = 0; t < T; t++) {
    let agg = 0
    for (let h = 0; h < rules.length; h++) agg += n[h] * (rules[h].g * x1 + rules[h].b)
    let xt = agg / R + (sigma > 0 ? sigma * gauss(r) : 0)
    if (!Number.isFinite(xt) || Math.abs(xt) > 1e4) xt = Math.sign(xt || 1) * 1e4
    const U = rules.map(ru => (xt - R * x1) * (ru.g * x2 + ru.b - R * x1) - ru.C)
    const m = Math.max(...U)
    const w = U.map(u => Math.exp(beta * (u - m)))
    const s = w.reduce((a, b) => a + b, 0)
    n = w.map(v => v / s)
    xs.push(xt)
    shares.push(n)
    x2 = x1
    x1 = xt
  }
  return { xs, shares }
}

export const brockHommes: ModelSpec = {
  id: 'brock-hommes',
  numeral: 'I',
  question: 'When traders switch between forecasting rules, when does the price stop settling on fundamental value?',
  answer:
    'Below a threshold intensity of choice the price sits on the fundamental; above it the fundamentalists are starved out whenever they are right, and the price cycles or turns chaotic around value without ever resting on it.',
  paper: {
    cite: 'Brock & Hommes (1998)',
    title: 'Heterogeneous beliefs and routes to chaos in a simple asset pricing model',
    venue: 'Journal of Economic Dynamics and Control 22(8–9), 1235–1274',
    url: 'https://doi.org/10.1016/S0165-1889(98)00011-6',
    code: [
      { label: 'gui-market-agent-model (C++)', url: 'https://github.com/m-koska/gui-market-agent-model' },
      { label: 'ABM_callibration (Python)', url: 'https://github.com/admivsn/ABM_callibration' },
    ],
    roadmapId: 'ce-brock-hommes',
    libraryId: 'lib-brock-hommes',
  },
  mechanism:
    'Everyone forecasts next period’s price with a simple rule and switches toward whichever rule just paid. Fundamentalists are right on average but pay to know the fundamental; when the price sits on value they earn nothing net of that cost, so their share collapses, trend rules take over, the price leaves value, the fundamentalists get paid again — and the cycle repeats. The intensity of choice β sets how violently the herd switches.',
  armstrong:
    'The book buys the gap between price and an analyst-anchored value and needs it to close inside the option’s life. This model is the simplest account of why the gap exists and why it closes on a clock rather than instantly: the closing is done by fundamentalists whose share of the market rises only after the mispricing has already paid them. Slow switching (low β) means a slow, orderly close — the regime the strategy wants.',
  watch: [
    'Raise β from 0. Nothing happens for a while, then the steady state loses stability and the deviation starts to oscillate — that is the bifurcation the roadmap asks you to reproduce.',
    'With any positive cost C the fundamentalist share rounds to zero: at the steady state they earn nothing net of the cost, and in the swings their edge never covers it — the paper’s point that paid-for information loses to free rules.',
    'Lower C to zero: fundamentalists keep a quarter of the market at the steady state, the first bifurcation moves out to a higher β, and once the price does leave value you can see them take share back in the fractions panel.',
    'Push the strong-trend rule above R: trend following that extrapolates faster than the interest rate is the engine of the explosive branches.',
  ],
  fidelity: 'faithful',
  fidelityNote:
    'The four-rule example of §6 with the paper’s discrete-choice switching and realised-profit fitness; no memory in fitness (w = 0) and risk-aversion-times-variance normalised to 1, as in the paper’s figures.',
  params: [
    { key: 'beta', label: 'β · intensity of choice', min: 0, max: 120, step: 1, default: 90, meaning: 'How sharply traders move toward the rule that just paid; 0 = nobody switches, large = everyone piles into last period’s winner.' },
    { key: 'R', label: 'R · gross interest rate', min: 1.0, max: 1.2, step: 0.01, default: 1.1, meaning: '1 + the risk-free rate per period; the hurdle a forecast must beat to be worth a position.' },
    { key: 'C', label: 'C · cost of the fundamental', min: 0, max: 2, step: 0.05, default: 1, meaning: 'What fundamentalists pay each period to know the fundamental value; the other rules are free.' },
    { key: 'g', label: 'g · trend extrapolation', min: 0, max: 1.2, step: 0.01, default: 0.9, meaning: 'How much of last period’s deviation the trend rules expect to persist.' },
    { key: 'b', label: 'b · bias', min: 0, max: 0.5, step: 0.01, default: 0.2, meaning: 'The fixed optimism (and, for the mirror rule, pessimism) added to the trend forecast.' },
    { key: 'gStrong', label: 'g⁺ · strong trend', min: 0.9, max: 1.2, step: 0.01, default: 1.01, meaning: 'The fourth rule’s extrapolation — above R it bets the deviation grows faster than the interest rate.' },
    { key: 'sigma', label: 'σ · noise', min: 0, max: 0.1, step: 0.005, default: 0, meaning: 'Random supply shocks added to each period’s price; 0 reproduces the paper’s deterministic dynamics.' },
  ],
  charts: [
    {
      id: 'deviation',
      title: 'Price deviation from fundamental, x_t',
      read: 'A flat line is the fundamental steady state; cycles and irregular swings are the market never settling.',
      kind: 'line',
      xKey: 't',
      xLabel: 'period',
      yLabel: 'x_t',
      series: [{ key: 'x', label: 'deviation', role: 'accent' }],
      refY: [0],
    },
    {
      id: 'fractions',
      title: 'Who is forecasting — market share of each rule',
      read: 'Fundamentalists are fed by mispricing and starved by its absence; the trend rules take over in between.',
      kind: 'line',
      xKey: 't',
      xLabel: 'period',
      yLabel: 'share',
      series: [
        { key: 'fund', label: 'fundamentalists', role: 'cat1' },
        { key: 'trend', label: 'trend (+b)', role: 'cat2' },
        { key: 'bias', label: 'trend (−b)', role: 'cat3' },
        { key: 'strong', label: 'strong trend', role: 'cat4' },
      ],
      yDomain: [0, 1],
    },
    {
      id: 'bifurcation',
      title: 'Bifurcation diagram — the long-run deviation at every β',
      read: 'One dot per β means a resting price; a spread of dots means cycles or chaos. The current β is the vertical line.',
      kind: 'dots',
      xKey: 'beta',
      xLabel: 'β',
      yLabel: 'x',
      series: [{ key: 'x', label: 'long-run deviation', role: 'accent' }],
      refY: [0],
    },
  ],
  simulate: (p, seed) => {
    const rules: Rule[] = [
      { g: 0, b: 0, C: p.C },
      { g: p.g, b: p.b, C: 0 },
      { g: p.g, b: -p.b, C: 0 },
      { g: p.gStrong, b: 0, C: 0 },
    ]
    const r = rng(seed)
    const T = 400
    const burn = 100
    const { xs, shares } = run(rules, p.beta, p.R, p.sigma, T, r)
    const tail = xs.slice(burn)
    const tailShares = shares.slice(burn)
    const deviation: Point[] = tail.map((x, i) => ({ t: burn + i, x: +x.toFixed(5) }))
    const fractions: Point[] = tailShares.map((n, i) => ({
      t: burn + i,
      fund: +n[0].toFixed(4),
      trend: +n[1].toFixed(4),
      bias: +n[2].toFixed(4),
      strong: +n[3].toFixed(4),
    }))

    // The sweep: deterministic, 90 values of β, the last 50 of 400 periods each.
    const bifurcation: Point[] = []
    const betaMax = 120
    const steps = 90
    for (let i = 0; i <= steps; i++) {
      const beta = (betaMax * i) / steps
      const sweep = run(rules, beta, p.R, 0, 400, () => 0.5)
      const last = sweep.xs.slice(-50)
      for (const x of last) bifurcation.push({ beta: +beta.toFixed(2), x: +Math.max(-3, Math.min(3, x)).toFixed(4) })
    }

    const sd = std(tail)
    const fundShare = mean(tailShares.map(n => n[0]))
    const fundPeak = Math.max(...tailShares.map(n => n[0]))
    const ac1 = autocorr(diff(tail), 1)
    const blown = tail.some(x => Math.abs(x) >= 1e4)
    // Regular cycle or not: how much the local peaks vary from one to the next.
    const peaks: number[] = []
    for (let i = 1; i < tail.length - 1; i++) if (tail[i] > tail[i - 1] && tail[i] >= tail[i + 1] && tail[i] > 0) peaks.push(tail[i])
    const peakCv = peaks.length > 3 ? std(peaks) / Math.max(1e-9, mean(peaks)) : 0
    const verdict = blown
      ? 'The deviation explodes: the strong-trend rule extrapolates faster than the interest rate and nothing pulls the price back. Lower g⁺ or raise R.'
      : sd < 1e-3
        ? 'Stable fundamental steady state: switching is too gentle to dislodge the fundamentalists, and the price rests on value.'
        : peakCv < 0.05
          ? `Regular cycle: the price orbits value with peaks near ${num(mean(peaks), 2)} — the steady state has lost stability but the swings repeat.`
          : 'Irregular dynamics: aperiodic swings of varying size around value — the chaotic regime the paper is named for.'
    return {
      data: { deviation, fractions: thin(fractions, 300), bifurcation },
      readouts: [
        { label: 'Std of deviation', value: num(sd, 3), note: 'zero means the price rests on value' },
        { label: 'Fundamentalist share', value: `${(100 * fundShare).toFixed(fundShare < 0.01 ? 2 : 1)}%`, note: 'average over the shown periods' },
        { label: 'Fundamentalist peak', value: `${(100 * fundPeak).toFixed(fundPeak < 0.01 ? 2 : 0)}%`, note: 'their share at the best moment' },
        { label: 'Autocorr of Δx, lag 1', value: num(ac1, 2), note: 'negative = overshoot and correction' },
      ],
      verdict,
    }
  },
}
