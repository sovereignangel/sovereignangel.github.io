// Farmer & Joshi (2002), "The price dynamics of common trading strategies",
// Journal of Economic Behavior & Organization 49(2), 149–171.
//
// A market maker sets the log price from net order flow; value investors and
// trend followers submit orders as changes in their desired positions.
//
//   p_{t+1} = p_t + (1/λ) Σ_i ω_i(t) + ξ_t          (market maker, λ = depth)
//   ω_i(t)  = x^i_t − x^i_{t−1}                       (an order is a change of position)
//   v_t     = v_{t−1} + η_t                           (perceived value, a random walk)
//
// Value investors are threshold traders, as in the paper: investor i goes long
// when the price sits more than T_i below value, closes when the gap narrows
// to f·T_i, and symmetrically short. A population with spread-out thresholds
// enters and exits gradually, so the gap is pushed back toward value only while
// capital is still arriving — the mean reversion is capital-limited.
// Trend followers hold a position proportional to the last θ periods' move.
//
// Value trading creates negative autocorrelation (mean reversion); trend
// trading creates positive autocorrelation and, past a point, instability.

import { ar1HalfLife, autocorr, diff, gauss, mean, num, pct, rng, std, thin } from './sim'
import type { ModelSpec, Point } from './types'

const NV = 60 // value investors, thresholds spread evenly across the band

export const farmerJoshi: ModelSpec = {
  id: 'farmer-joshi',
  numeral: 'II',
  question: 'What do value investors and trend followers do to a price when they trade through the same market maker?',
  answer:
    'Value capital pulls the price back toward value — but only while investors are still entering, so the pull is capped by how much capital there is. Trend capital amplifies moves and shows up as positive autocorrelation. The ratio of the two, against the depth of the market, decides how far a gap can wander and how fast it comes back.',
  paper: {
    cite: 'Farmer & Joshi (2002)',
    title: 'The price dynamics of common trading strategies',
    venue: 'Journal of Economic Behavior & Organization 49(2), 149–171',
    url: 'https://arxiv.org/abs/cond-mat/0012419',
    code: [{ label: 'Adaptive Farmer–Joshi ABM (R)', url: 'https://github.com/IvanJericevich/Adaptive-Farmer-Joshi-Agent-Based-Model-of-Financial-Markets' }],
    libraryId: 'lib-farmer-joshi',
  },
  mechanism:
    'Nobody solves for an equilibrium. Each strategy is a rule that turns what it sees into a desired position; the change in that position is an order; the market maker moves the price in proportion to net orders, permanently. A value investor who has already entered has no further effect — only new entries and exits move the price — so the price is pulled toward value by the investors still on the sidelines, and once they are all in, the gap drifts. Trend followers buy what has risen, so their orders push the price further along.',
  armstrong:
    'An analyst-anchored LEAP is a value position with a deadline, and this model says the deadline is set by other people’s capital: the gap closes while value investors are still entering and stalls when they are all in. Raise value capital and the half-life of the gap shortens; raise trend capital and the gap overshoots on the way back. The band of thresholds is the range of prices at which the rest of the value crowd starts to agree with you.',
  watch: [
    'Start with trend capital at zero: the gap is held inside the threshold band and lag-1 autocorrelation is negative — mean reversion from entries and exits.',
    'Cut value capital toward zero: the band no longer holds and the gap wanders as a random walk — the paper’s point that mean reversion is a property of capital, not of value.',
    'Add trend capital: short-lag autocorrelation turns positive and the price overshoots value before it comes back; the half-life of the gap lengthens.',
    'Push c_T past the market maker’s depth λ and the feedback becomes explosive — the readout will say so.',
  ],
  fidelity: 'simplified',
  fidelityNote:
    'The paper’s market-maker price formation, threshold value investors with heterogeneous entry and exit levels, and linear trend followers. The paper’s other strategies, its transaction costs and its capital-allocation dynamics are not included.',
  params: [
    { key: 'cV', label: 'c_V · value capital', min: 0, max: 8, step: 0.25, default: 2, meaning: 'Total position the value crowd holds when every investor has entered; spread across sixty investors with different thresholds.' },
    { key: 'band', label: 'T · entry band (log units)', min: 0.05, max: 0.8, step: 0.05, default: 0.35, meaning: 'The widest gap at which the last value investor enters; thresholds are spread evenly from 0.02 up to this.' },
    { key: 'exit', label: 'f · exit fraction', min: 0, max: 0.9, step: 0.05, default: 0.3, meaning: 'An investor closes once the gap has narrowed to this fraction of the threshold at which they entered.' },
    { key: 'cT', label: 'c_T · trend capital', min: 0, max: 3, step: 0.05, default: 0.6, meaning: 'How large a position trend followers take per unit of recent price change.' },
    { key: 'theta', label: 'θ · trend look-back', min: 1, max: 60, step: 1, default: 10, meaning: 'How many periods back trend followers look to decide whether the price has risen.' },
    { key: 'lambda', label: 'λ · market depth', min: 1, max: 20, step: 0.5, default: 6, meaning: 'How many units of net orders it takes to move the log price by one unit; deeper markets move less.' },
    { key: 'sigV', label: 'σ_v · value news', min: 0, max: 0.1, step: 0.005, default: 0.03, meaning: 'How much the perceived fundamental value moves each period.' },
    { key: 'sigXi', label: 'σ_ξ · price noise', min: 0, max: 0.1, step: 0.005, default: 0.01, meaning: 'Random noise in the market maker’s price update.' },
  ],
  charts: [
    {
      id: 'path',
      title: 'Log price against perceived value',
      read: 'How closely the price tracks value, and whether it overshoots before turning.',
      kind: 'line',
      xKey: 't',
      xLabel: 'period',
      yLabel: 'log level',
      series: [
        { key: 'p', label: 'price', role: 'accent' },
        { key: 'v', label: 'value', role: 'context' },
      ],
    },
    {
      id: 'gap',
      title: 'The gap, price minus value, against the entry band',
      read: 'Inside the band the value crowd is still entering and pulling; outside it they are all in and the gap drifts.',
      kind: 'line',
      xKey: 't',
      xLabel: 'period',
      yLabel: 'log(p) − log(v)',
      series: [{ key: 'gap', label: 'gap', role: 'accent' }],
      refY: [0],
    },
    {
      id: 'acf',
      title: 'Return autocorrelation by lag',
      read: 'Below zero is mean reversion (value trading); above zero is momentum (trend trading).',
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
    const r = rng(seed)
    const T = 1500
    const burn = 300
    const theta = Math.max(1, Math.round(p.theta))
    const thresholds = Array.from({ length: NV }, (_, i) => 0.02 + ((p.band - 0.02) * i) / (NV - 1))
    const pos = new Array<number>(NV).fill(0)
    const prices: number[] = [0]
    const values: number[] = [0]
    let xV = 0
    let xT = 0
    let blown = false
    let committed = 0
    for (let t = 1; t <= T; t++) {
      const pPrev = prices[t - 1]
      const vPrev = values[t - 1]
      const v = vPrev + p.sigV * gauss(r)
      const m = pPrev - vPrev // the gap the investors see when they decide
      let sum = 0
      for (let i = 0; i < NV; i++) {
        const Ti = thresholds[i]
        if (pos[i] === 0) {
          if (m < -Ti) pos[i] = 1
          else if (m > Ti) pos[i] = -1
        } else if (pos[i] === 1 && m > -p.exit * Ti) pos[i] = 0
        else if (pos[i] === -1 && m < p.exit * Ti) pos[i] = 0
        sum += pos[i]
      }
      if (t > burn) committed += Math.abs(sum) / NV
      const wantV = (p.cV * sum) / NV
      const pLag = prices[Math.max(0, t - 1 - theta)]
      const wantT = p.cT * (pPrev - pLag)
      const orders = wantV - xV + (wantT - xT)
      xV = wantV
      xT = wantT
      let pNext = pPrev + orders / p.lambda + p.sigXi * gauss(r)
      if (!Number.isFinite(pNext) || Math.abs(pNext - v) > 50) {
        pNext = v + Math.sign(pNext - v || 1) * 50
        blown = true
      }
      prices.push(pNext)
      values.push(v)
    }
    const path: Point[] = []
    const gapPts: Point[] = []
    for (let t = burn; t <= T; t++) {
      path.push({ t, p: +prices[t].toFixed(4), v: +values[t].toFixed(4) })
      gapPts.push({ t, gap: +(prices[t] - values[t]).toFixed(4) })
    }
    const rets = diff(prices.slice(burn))
    const acf: Point[] = []
    for (let lag = 1; lag <= 20; lag++) acf.push({ lag, ac: +autocorr(rets, lag).toFixed(4) })
    const gap = prices.slice(burn).map((x, i) => x - values[burn + i])
    const hl = ar1HalfLife(gap)
    const ac1 = autocorr(rets, 1)
    const share = committed / (T - burn)
    const inside = mean(gap.map(g => (Math.abs(g) <= p.band ? 1 : 0)))
    const verdict = blown
      ? 'Unstable: trend orders overwhelm the market maker’s depth and the price runs away from value. Lower c_T, raise λ, or lengthen θ.'
      : inside < 0.5
        ? 'Capital-limited: the gap spends most of its time outside the entry band — the value crowd is all in and the price drifts with the noise.'
        : ac1 > 0.05
          ? 'Trend-dominated: moves persist and the price overshoots value before it turns, though the band still holds.'
          : 'Value-held: the gap stays inside the band and returns reverse period to period — entries and exits are doing the closing.'
    return {
      data: { path: thin(path, 400), gap: thin(gapPts, 400), acf },
      readouts: [
        { label: 'Autocorr, lag 1', value: num(ac1, 3), note: 'sign tells you which capital dominates' },
        { label: 'Gap half-life', value: hl ? `${hl.toFixed(0)} periods` : 'none', note: 'AR(1) fit on price − value' },
        { label: 'Std of gap', value: num(std(gap), 3), note: 'typical mispricing, log units' },
        { label: 'Value crowd committed', value: pct(share, 0), note: 'average share of investors holding a position' },
      ],
      verdict,
    }
  },
}
