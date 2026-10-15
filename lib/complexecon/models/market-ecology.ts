// Scholl, Calinescu & Farmer (2021), "How market ecology explains market
// malfunction", PNAS 118(26), e2015574118 — building on Farmer (2002), "Market
// force, ecology and evolution", Industrial and Corporate Change 11(5), 895–953.
//
// Three strategies ("species") hold one dividend-paying stock. Each day the
// price clears so that total demand equals the fixed supply of shares; wealth
// then moves with the price, and the strategies' market shares drift. The
// returns to each strategy depend on how much wealth the others hold — the
// density dependence that makes this an ecology rather than a race.
//
//   value investor:  fraction of wealth in the stock = b + k_V log(V_t / p_t)
//   trend follower:  fraction = b + k_T (log p_{t−1} − log p_{t−1−L})
//   noise trader:    a value investor on a noisy value, b + k_V (log(V_t / p_t) + n_t),
//                    n_t a slow mean-reverting error — as in the paper, where the
//                    noise trader anchors the price to a wandering estimate of value
//   clearing:        Σ_i W_i s_i(p) / p = S, positions sized on yesterday's wealth

import { clamp, gauss, kurtosis, mean, pct, rng, std, thin } from './sim'
import type { ModelSpec, Point } from './types'

const DAYS = 2000
const S = 50 // shares outstanding — total initial wealth is 100, half of it in the stock at p = 1

export const marketEcology: ModelSpec = {
  id: 'market-ecology',
  numeral: 'III',
  question: 'When value, trend and noise capital share one market, which mix keeps the price near value — and which makes it malfunction?',
  answer:
    'Each strategy earns most when it is rare and the others are common; a market with too much trend capital overshoots and crashes, one with enough value capital anchors. The wealth shares drift toward a mix that no strategy chose — the ecology, not any trader, sets how far price wanders from value.',
  paper: {
    cite: 'Scholl, Calinescu & Farmer (2021)',
    title: 'How market ecology explains market malfunction',
    venue: 'PNAS 118(26), e2015574118',
    url: 'https://arxiv.org/abs/2009.09454',
    code: [
      { label: 'INET-Complexity/market-ecology (C++ · Python)', url: 'https://github.com/INET-Complexity/market-ecology' },
      { label: 'INET-Complexity/ESL', url: 'https://github.com/INET-Complexity/ESL' },
    ],
    roadmapId: 'ce-scholl',
    libraryId: 'lib-scholl',
  },
  mechanism:
    'Think of strategies as species and capital as population. Value investors eat mispricing — they are paid when the price has wandered from value, which only happens when other species are pushing it. Trend followers eat momentum, which value investors damp. Noise traders feed both. Wealth flows to whichever species is being fed, which changes the mix, which changes who gets fed. The malfunction result: when trend capital grows large relative to value capital, the price can leave value for long stretches and come back violently.',
  armstrong:
    'This is the model behind “alpha decay by crowding” (research Lane VI, GEN-4). A fundamental, analyst-anchored strategy is a value species; its expected return over a 1–2 year hold depends on how much trend and noise capital is pushing prices around and how much value capital is already closing the gaps. The slider for value share is the slider for your own crowding.',
  watch: [
    'Start trend-heavy: watch the gap panel. Long excursions from value, then sharp corrections — the malfunction regime.',
    'Shift wealth to value investors: the gap tightens and volatility falls, but the value share then stops growing — it has eaten its own food.',
    'Raise the trend look-back L: slower, wider cycles; lower it: faster chop.',
    'Raise leverage: every species grows its bets, the clearing price swings more, and the crash risk rises with no change in anyone’s rule.',
  ],
  fidelity: 'simplified',
  fidelityNote:
    'The three species, daily clearing against fixed supply, dividends and wealth-driven share dynamics are kept; the paper’s margin and leverage constraints, bankruptcy and re-entry, dividend-process calibration and the full parameterisation are not. Use it for the mechanism, not for the paper’s numbers.',
  params: [
    { key: 'wV', label: 'value share at start', min: 0.05, max: 0.9, step: 0.05, default: 0.3, meaning: 'Share of total wealth held by value investors on day one; the three shares are normalised to sum to one.' },
    { key: 'wT', label: 'trend share at start', min: 0.05, max: 0.9, step: 0.05, default: 0.4, meaning: 'Share of total wealth held by trend followers on day one.' },
    { key: 'wN', label: 'noise share at start', min: 0.05, max: 0.9, step: 0.05, default: 0.3, meaning: 'Share of total wealth held by noise traders on day one.' },
    { key: 'L', label: 'leverage cap', min: 1, max: 2, step: 0.1, default: 1, meaning: 'Maximum fraction of wealth any species may hold in the stock; above 1 means borrowing to buy.' },
    { key: 'kV', label: 'k_V · value aggressiveness', min: 0.5, max: 10, step: 0.5, default: 4, meaning: 'How hard value investors (and the noise traders, on their noisy value) lean into a gap between value and price.' },
    { key: 'kT', label: 'k_T · trend aggressiveness', min: 0.25, max: 5, step: 0.25, default: 1, meaning: 'How hard trend followers lean into a recent price move.' },
    { key: 'look', label: 'trend look-back (days)', min: 5, max: 120, step: 5, default: 40, meaning: 'How far back trend followers compare the price.' },
    { key: 'nVol', label: 'noise-trader error', min: 0, max: 0.1, step: 0.005, default: 0.03, meaning: 'How fast the noise traders’ estimate of value wanders away from the true one.' },
  ],
  charts: [
    {
      id: 'shares',
      title: 'Wealth share of each species',
      read: 'The mix drifts toward whatever the market is currently feeding; no share goes to one, because each species starves on its own success.',
      kind: 'line',
      xKey: 't',
      xLabel: 'day',
      yLabel: 'share of wealth',
      series: [
        { key: 'value', label: 'value investors', role: 'cat1' },
        { key: 'trend', label: 'trend followers', role: 'cat2' },
        { key: 'noise', label: 'noise traders', role: 'cat3' },
      ],
      yDomain: [0, 1],
    },
    {
      id: 'gap',
      title: 'Log price minus log value',
      read: 'Long excursions and sharp returns are the malfunction; a tight band around zero is a well-anchored market.',
      kind: 'line',
      xKey: 't',
      xLabel: 'day',
      yLabel: 'log(p / V)',
      series: [{ key: 'gap', label: 'mispricing', role: 'accent' }],
      refY: [0],
    },
  ],
  simulate: (p, seed) => {
    const r = rng(seed)
    const total = p.wV + p.wT + p.wN
    let W = [100 * (p.wV / total), 100 * (p.wT / total), 100 * (p.wN / total)]
    const b = 0.5
    const look = Math.max(1, Math.round(p.look))
    const dailyVol = 0.2 / Math.sqrt(252) // value process: 20% annual
    const divYield = 0.02 / 252
    const rf = 0.02 / 252
    let V = 1
    let price = 1
    const logP: number[] = [0]
    let H = [0, 0, 0] // shares held after the last clearing
    let n = 0 // noise-trader mood
    const shares: Point[] = []
    const gaps: Point[] = []
    const rets: number[] = []
    const gapSeries: number[] = []
    for (let t = 1; t <= DAYS; t++) {
      V *= Math.exp(dailyVol * gauss(r))
      const D = V * divYield
      n += 0.01 * (0 - n) + p.nVol * gauss(r)
      const lp1 = logP[logP.length - 1]
      const lpL = logP[Math.max(0, logP.length - 1 - look)]
      const sT = clamp(b + p.kT * (lp1 - lpL), 0, p.L)
      const prev = price
      // Positions are sized on yesterday's wealth, so total share demand falls
      // in the price and a clearing price always exists; bisection on log price.
      const sNoise = (q: number) => clamp(b + p.kV * (Math.log(V / q) + n), 0, p.L)
      const excess = (q: number) => {
        const sV = clamp(b + p.kV * Math.log(V / q), 0, p.L)
        return (W[0] * sV + W[1] * sT + W[2] * sNoise(q)) / q - S
      }
      // The bracket bounds a day's move to a factor of e and the mispricing to
      // a factor of e³ — when one species owns the whole market the clearing
      // price is indeterminate, and the bound is what keeps the arithmetic finite.
      let lo = Math.max(Math.log(prev) - 1, Math.log(V) - 3)
      let hi = Math.min(Math.log(prev) + 1, Math.log(V) + 3)
      if (!(lo < hi)) {
        lo = Math.log(V) - 3
        hi = Math.log(V) + 3
      }
      for (let k = 0; k < 60; k++) {
        const mid = 0.5 * (lo + hi)
        if (excess(Math.exp(mid)) > 0) lo = mid
        else hi = mid
      }
      const q = Math.exp(0.5 * (lo + hi))
      // Mark yesterday's holdings at the clearing price, pay the dividend and
      // interest on cash, then take today's positions out of the new wealth.
      const w = W.map((wi, i) => Math.min(1e9, Math.max(0.01, wi + H[i] * (q - prev + D) + (wi - H[i] * prev) * rf)))
      const sV = clamp(b + p.kV * Math.log(V / q), 0, p.L)
      H = [(w[0] * sV) / q, (w[1] * sT) / q, (w[2] * sNoise(q)) / q]
      W = w
      price = q
      logP.push(Math.log(q))
      rets.push(Math.log(q / prev))
      const tot = w[0] + w[1] + w[2]
      const gap = Math.log(q / V)
      gapSeries.push(gap)
      shares.push({ t, value: +(w[0] / tot).toFixed(4), trend: +(w[1] / tot).toFixed(4), noise: +(w[2] / tot).toFixed(4) })
      gaps.push({ t, gap: +gap.toFixed(4) })
    }
    const last = shares[shares.length - 1]
    const annVol = std(rets) * Math.sqrt(252)
    const absGap = mean(gapSeries.map(Math.abs))
    const kurt = kurtosis(rets)
    const runaway = Math.max(...gapSeries.map(Math.abs)) > 2.9
    const verdict = runaway
      ? 'Runaway: one species has taken the whole market and the price has nothing to clear against — the mispricing is pinned at the model’s bound. Give value capital a larger start or calm the trend followers.'
      : absGap > 0.25
        ? 'Malfunction: the price lives far from value for long stretches — trend and noise capital are feeding each other faster than value capital can close the gap.'
        : absGap > 0.1
          ? 'Loosely anchored: mispricings are common and persistent but bounded; value investors are earning their keep without dominating.'
          : 'Well anchored: value capital closes gaps quickly, volatility is low, and the trend species finds little to eat.'
    return {
      data: { shares: thin(shares, 300), gap: thin(gaps, 300) },
      readouts: [
        { label: 'Final shares V / T / N', value: `${pct(last.value, 0)} · ${pct(last.trend, 0)} · ${pct(last.noise, 0)}`, note: 'value · trend · noise' },
        { label: 'Annualised volatility', value: pct(annVol, 0), note: 'of daily log returns' },
        { label: 'Mean |mispricing|', value: absGap.toFixed(3), note: 'log units; 0.69 is a factor of two' },
        { label: 'Excess kurtosis', value: kurt.toFixed(1), note: 'fat tails from the ecology, not from the news' },
      ],
      verdict,
    }
  },
}
