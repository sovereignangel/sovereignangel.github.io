// Berk & Green (2004), "Mutual fund flows and performance in rational markets",
// Journal of Political Economy 112(6), 1269–1295.
//
// A manager has real skill α but faces decreasing returns to scale: net alpha
// at size q is α − a q. Investors learn α from realised returns and move money
// until expected net alpha is zero. The result: skill is real, flows chase it,
// and the alpha investors actually receive converges to zero — with no change
// in the manager's ability.
//
//   r_t     = α − a q_t + σ ε_t                      (net return to investors)
//   belief  = Bayesian update of α from r_t + a q_t   (gross alpha is observable)
//   q_{t+1} = max(0, belief_t / a)                   (flows set size so expected net alpha = 0)

import { gauss, num, pct, rng } from './sim'
import type { ModelSpec, Point } from './types'

export const berkGreen: ModelSpec = {
  id: 'berk-green',
  numeral: 'X',
  question: 'If a strategy has real skill, why does the alpha its investors receive still go to zero?',
  answer:
    'Capital chases evidence of skill until the strategy is large enough that its costs eat the edge. The skill persists; the net alpha does not. How fast it goes depends on how noisy returns are — the noisier the track record, the longer the edge survives.',
  paper: {
    cite: 'Berk & Green (2004)',
    title: 'Mutual fund flows and performance in rational markets',
    venue: 'Journal of Political Economy 112(6), 1269–1295',
    url: 'https://www.johnhcochrane.com/s/berk_green_jpe.pdf',
    libraryId: 'lib-berk-green',
  },
  mechanism:
    'Investors cannot see skill, only returns, so they estimate it and update each year. They put money in whenever the estimate says net alpha is positive and take it out when it is negative; with costs rising in fund size, money flows in until expected net alpha is exactly zero. A lucky year raises the estimate, draws flows and lowers future net returns; an unlucky year does the reverse. Over time the estimate converges to the truth and the fund settles at the size where its edge is fully absorbed by its costs.',
  armstrong:
    'The capacity question for a boutique book, and the other half of the market-ecology argument (GEN-4): Farmer says alpha decays because capital crowds the species; Berk and Green say the same thing from the investor’s chair. The strategy’s edge is a function of its size, and the fundraising plan is also a decision about how much of the edge to keep. The noise slider is the honest part — a long-horizon strategy with few independent bets per year is slow to be learned, which protects it.',
  watch: [
    'Set return noise to zero: investors learn α in one year and the net alpha is gone immediately.',
    'Raise the noise: the estimate wanders for years, the fund over- and under-shoots its right size, and the net alpha lingers — in both signs.',
    'Raise the cost slope a: the equilibrium size shrinks and the edge is absorbed sooner.',
    'The fund-size panel is the fundraising curve: it rises to α/a and stops, however good the manager is.',
  ],
  fidelity: 'faithful',
  fidelityNote:
    'The paper’s mechanism with a linear cost of scale and normal–normal Bayesian learning about α; the paper’s continuous-time and fee details are not included.',
  params: [
    { key: 'alpha', label: 'α · true gross alpha (% / yr)', min: 0, max: 8, step: 0.25, default: 4, meaning: 'The manager’s real edge before the costs of size.' },
    { key: 'a', label: 'a · cost of scale', min: 0.5, max: 8, step: 0.25, default: 2, meaning: 'Percentage points of alpha lost per unit of fund size.' },
    { key: 'sigma', label: 'σ · return noise (% / yr)', min: 0, max: 20, step: 0.5, default: 8, meaning: 'How noisy a year’s return is as evidence about skill.' },
    { key: 'prior', label: 'prior uncertainty about α (%)', min: 0.5, max: 10, step: 0.5, default: 4, meaning: 'How unsure investors start out; they start believing the manager has no skill.' },
  ],
  charts: [
    {
      id: 'alpha',
      title: 'Net alpha received by investors, by year',
      read: 'Starts at the manager’s full edge and converges to zero as flows arrive; the noisier the returns, the slower the convergence.',
      kind: 'line',
      xKey: 'year',
      xLabel: 'year',
      yLabel: 'net alpha (% / yr)',
      series: [
        { key: 'net', label: 'expected net alpha', role: 'accent' },
        { key: 'belief', label: 'investors’ estimate of α', role: 'context' },
      ],
      refY: [0],
      xTicks: [0, 5, 10, 15, 20, 25, 30],
    },
    {
      id: 'size',
      title: 'Fund size, by year',
      read: 'Capital arrives until the edge is absorbed; the plateau is α / a, the size at which net alpha is zero.',
      kind: 'line',
      xKey: 'year',
      xLabel: 'year',
      yLabel: 'size (units)',
      series: [{ key: 'q', label: 'fund size', role: 'accent' }],
      refY: [0],
      xTicks: [0, 5, 10, 15, 20, 25, 30],
    },
  ],
  simulate: (p, seed) => {
    const r = rng(seed)
    const years = 30
    let belief = 0
    let beliefVar = p.prior * p.prior
    let q = 0
    const alpha: Point[] = []
    const size: Point[] = []
    let yearsToTenth: number | null = null
    for (let y = 0; y <= years; y++) {
      const net = p.alpha - p.a * q
      alpha.push({ year: y, net: +net.toFixed(3), belief: +belief.toFixed(3) })
      size.push({ year: y, q: +q.toFixed(3) })
      if (yearsToTenth === null && y > 0 && Math.abs(net) < 0.1 * Math.max(p.alpha, 1e-9)) yearsToTenth = y
      // One year of returns, then the Bayesian update on gross alpha = r + a q.
      const observedGross = p.alpha + p.sigma * gauss(r)
      const noiseVar = p.sigma * p.sigma
      const K = noiseVar > 0 ? beliefVar / (beliefVar + noiseVar) : 1
      belief = belief + K * (observedGross - belief)
      beliefVar = (1 - K) * beliefVar
      q = Math.max(0, belief / p.a)
    }
    const eq = p.alpha / p.a
    const verdict =
      p.alpha === 0
        ? 'No skill: any flows that arrive are chasing noise, and the net alpha they receive is negative on average.'
        : yearsToTenth !== null
          ? `Investors learn the edge within ${yearsToTenth} year${yearsToTenth === 1 ? '' : 's'}; the fund settles near ${num(eq, 2)} units and the net alpha they receive is gone — the skill is still there.`
          : 'Thirty years in, the returns are still too noisy for investors to pin the edge down — the net alpha survives on ambiguity.'
    return {
      data: { alpha, size },
      readouts: [
        { label: 'Equilibrium size', value: num(eq, 2), note: 'α / a — where net alpha is zero' },
        { label: 'Years to lose 90% of the edge', value: yearsToTenth !== null ? `${yearsToTenth}` : '> 30', note: 'net alpha within 10% of zero' },
        { label: 'Final belief about α', value: pct(alpha[years].belief / 100, 2), note: `true value ${pct(p.alpha / 100, 2)}` },
      ],
      verdict,
    }
  },
}
