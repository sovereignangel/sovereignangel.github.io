// Bouchaud, Ciliberti, Lempérière, Majewski, Seager & Sin Ronia (2017), "Black
// was right: Price is within a factor 2 of Value" — Fischer Black's 1986 "Noise"
// conjecture, tested: the log ratio of price to a value proxy behaves like a
// slowly mean-reverting process whose typical size is of order ln 2.
//
// The model: m_t = log(P_t / V_t) is an Ornstein–Uhlenbeck process,
//   dm = −κ m dt + σ dW,      κ = ln 2 / half-life
//   E[m_h | m_0] = m_0 e^{−κh},   Var[m_h | m_0] = σ² (1 − e^{−2κh}) / (2κ)
//
// Given a starting mispricing m_0 (price below value is m_0 < 0) and a horizon h:
//   expected excess return over value growth ≈ exp(E[m_h] − m_0 + Var/2) − 1
//   P(at least half the gap closed) = P(m_h ≥ m_0 / 2)        for m_0 < 0
//   P(gap fully closed)             = P(m_h ≥ 0)

import { normCdf, pct } from './sim'
import type { ModelSpec, Point } from './types'

const LN2 = Math.log(2)

export const priceValueOU: ModelSpec = {
  id: 'price-value-ou',
  numeral: 'VI',
  question: 'If price is only ever within a factor of two of value and drifts back slowly, what does a given mispricing pay over one and two years?',
  answer:
    'Mean reversion with a multi-year half-life pays a fraction of the gap per year — enough to matter, slow enough that a one-year option often expires before half the gap has closed. The expected return is set by the half-life; the odds of being paid inside the option’s life are set by the half-life against the noise.',
  paper: {
    cite: 'Bouchaud et al. (2017)',
    title: 'Black was right: Price is within a factor 2 of Value',
    venue: 'arXiv:1711.04717; CFM working paper',
    url: 'https://arxiv.org/abs/1711.04717',
    libraryId: 'lib-black-was-right',
  },
  mechanism:
    'Treat the log ratio of price to value as a single number that is pulled toward zero at a fixed rate and kicked around by noise. The pull is slow — a half-life measured in years, not months — and the noise is large, so at any moment the ratio sits somewhere inside a band of roughly a factor of two. Black said this in 1986 as a conjecture; the CFM study fits the pull and the band on long histories across markets.',
  armstrong:
    'Put the analyst-target gap in as m_0: a price 25% below the anchored value is m_0 ≈ −0.29. The chart then says what a 12- and a 24-month LEAP is actually buying — the expected closure over the option’s life and the probability that at least half the gap has closed before expiry. A half-life longer than the option is the structural reason most of these positions need the longest-dated expiry available.',
  watch: [
    'Set the half-life to the option’s life (one or two years): half the gap is expected to close by expiry — that is the break-even geometry of the strategy.',
    'Lengthen the half-life to five years: the expected one-year return from closure shrinks toward a quarter of the gap, and the odds of being paid inside a year fall below a coin flip.',
    'Raise σ: the band widens, the probability of closure barely moves, and the chance of the gap widening first rises — the path risk a long option absorbs.',
    'The grey band is Black’s factor of two: a starting mispricing outside it is rarer than the model expects.',
  ],
  fidelity: 'faithful',
  fidelityNote:
    'A one-factor Ornstein–Uhlenbeck model of log(price/value) in closed form. The defaults are round illustrative values, not the paper’s fitted estimates; read the paper for the fitted half-life and band and set the sliders to them.',
  params: [
    { key: 'half', label: 'half-life of the gap (years)', min: 0.5, max: 10, step: 0.25, default: 3, meaning: 'Time for half of a mispricing to close, absent new noise.' },
    { key: 'sigma', label: 'σ · gap volatility (annual)', min: 0.05, max: 0.6, step: 0.01, default: 0.25, meaning: 'How much the price-to-value ratio is kicked around each year by things other than closure.' },
    { key: 'm0', label: 'm₀ · starting mispricing, log(P/V)', min: -0.8, max: 0.8, step: 0.01, default: -0.29, meaning: 'Negative means the price is below value; −0.29 is a price 25% below.' },
    { key: 'horizon', label: 'option horizon (years)', min: 0.5, max: 3, step: 0.25, default: 1.5, meaning: 'The expiry you are buying — the readouts are evaluated here.' },
  ],
  charts: [
    {
      id: 'path',
      title: 'Expected log mispricing from m₀, with a one-sigma range',
      read: 'The centre line is the closure you are paid for; the width is the noise you hold through; the grey band is Black’s factor of two.',
      kind: 'line',
      xKey: 'm',
      xLabel: 'months ahead',
      yLabel: 'log(P / V)',
      series: [
        { key: 'exp', label: 'expected', role: 'accent' },
        { key: 'hi', label: '+1σ', role: 'context' },
        { key: 'lo', label: '−1σ', role: 'context' },
      ],
      refY: [0],
      band: [-LN2, LN2],
      refX: [12, 24],
      xTicks: [0, 12, 24, 36, 48, 60],
    },
    {
      id: 'payoff',
      title: 'Expected excess return from closure, by horizon',
      read: 'What the gap pays on top of value growth if you hold to each month; the vertical lines mark one- and two-year expiries.',
      kind: 'line',
      xKey: 'm',
      xLabel: 'months ahead',
      yLabel: 'expected excess return',
      series: [{ key: 'ret', label: 'expected excess return', role: 'accent' }],
      refY: [0],
      refX: [12, 24],
      xTicks: [0, 12, 24, 36, 48, 60],
    },
    {
      id: 'odds',
      title: 'Probability the gap has at least half closed, by horizon',
      read: 'The odds of being paid before a given expiry; compare with the horizon slider.',
      kind: 'line',
      xKey: 'm',
      xLabel: 'months ahead',
      yLabel: 'probability',
      series: [{ key: 'pHalf', label: 'P(half closed)', role: 'accent' }],
      refX: [12, 24],
      xTicks: [0, 12, 24, 36, 48, 60],
      yDomain: [0, 1],
    },
  ],
  simulate: p => {
    const kappa = LN2 / p.half
    const m0 = p.m0
    const path: Point[] = []
    const payoff: Point[] = []
    const odds: Point[] = []
    const stats = (h: number) => {
      const mu = m0 * Math.exp(-kappa * h)
      const v = ((p.sigma * p.sigma) * (1 - Math.exp(-2 * kappa * h))) / (2 * kappa)
      const sd = Math.sqrt(v)
      const ret = Math.exp(mu - m0 + v / 2) - 1
      // "Half closed" means m has moved at least halfway from m0 toward 0.
      const target = m0 / 2
      const pHalf = sd > 0 ? (m0 < 0 ? 1 - normCdf((target - mu) / sd) : normCdf((target - mu) / sd)) : m0 === 0 ? 1 : 0
      const pFull = sd > 0 ? (m0 < 0 ? 1 - normCdf((0 - mu) / sd) : normCdf((0 - mu) / sd)) : m0 === 0 ? 1 : 0
      return { mu, sd, ret, pHalf, pFull }
    }
    for (let m = 0; m <= 60; m++) {
      const h = m / 12
      const s = stats(h)
      path.push({ m, exp: +s.mu.toFixed(4), hi: +(s.mu + s.sd).toFixed(4), lo: +(s.mu - s.sd).toFixed(4) })
      payoff.push({ m, ret: +s.ret.toFixed(4) })
      odds.push({ m, pHalf: +s.pHalf.toFixed(4) })
    }
    const at = stats(p.horizon)
    const gapPct = Math.exp(-m0) - 1
    const verdict =
      m0 === 0
        ? 'No mispricing: there is nothing for the option to collect except value growth and noise.'
        : `A price ${pct(Math.abs(1 - Math.exp(m0)), 0)} ${m0 < 0 ? 'below' : 'above'} value with a ${p.half}-year half-life is expected to pay ${pct(at.ret, 1)} over ${p.horizon} years from closure alone, with a ${pct(at.pHalf, 0)} chance that at least half the gap has closed by then.`
    return {
      data: { path, payoff, odds },
      readouts: [
        { label: 'Gap to value', value: pct(gapPct, 0), note: 'value / price − 1' },
        { label: 'Expected excess return', value: pct(at.ret, 1), note: `over ${p.horizon} years, from closure` },
        { label: 'P(half closed)', value: pct(at.pHalf, 0), note: `by ${p.horizon} years` },
        { label: 'P(fully closed)', value: pct(at.pFull, 0), note: `by ${p.horizon} years` },
      ],
      verdict,
    }
  },
}
