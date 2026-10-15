// Gabaix & Koijen (2021), "In search of the origins of financial fluctuations:
// The inelastic markets hypothesis", NBER Working Paper 28967.
//
// The aggregate stock market is inelastic: a flow of 1% of market capitalisation
// into equities moves prices by about M ≈ 5%, against the textbook's ~0.01%.
// The simulation keeps the paper's headline object — the multiplier M — and
// lets flows be persistent:
//
//   f_t         = ρ_f f_{t−1} + σ_f η_t             (net flow, % of market cap, monthly)
//   log P_t     = log F_t + M Σ_{s≤t} f_s           (impact is permanent)
//   log F_t     = log F_{t−1} + σ_F ε_t             (fundamental)

import { gauss, num, pct, rng, thin, variance } from './sim'
import type { ModelSpec, Point } from './types'

export const inelasticMarkets: ModelSpec = {
  id: 'inelastic-markets',
  numeral: 'VII',
  question: 'If the market is inelastic, how much of a one-year return is flows rather than fundamentals?',
  answer:
    'With a multiplier near five, modest and persistent flows account for a large share of return variance at the one-year horizon — a position that is right about fundamentals can still lose to flows for a year or more, and a position that is wrong can be rescued by them.',
  paper: {
    cite: 'Gabaix & Koijen (2021)',
    title: 'In search of the origins of financial fluctuations: The inelastic markets hypothesis',
    venue: 'NBER Working Paper 28967',
    url: 'https://www.nber.org/system/files/working_papers/w28967/w28967.pdf',
    libraryId: 'lib-gabaix-koijen',
  },
  mechanism:
    'Most holders of equities — pension funds, index funds, insurers — hold a fixed share of their wealth in stocks regardless of price, so when a dollar wants to come in, almost nobody is willing to sell at the old price. The price has to rise until the few elastic holders are tempted. The multiplier M is how far it has to rise per unit of flow; the paper’s estimate is around five.',
  armstrong:
    'A 1–2 year hold lives inside this: the flow component of returns is the part no fundamental analysis anticipates, and at M ≈ 5 it is not small. It is the strongest argument for the longest-dated expiry and for sizing so that a year of adverse flows can be held through. It is also why the catalyst calendar matters — flows cluster around index events and rebalancing dates.',
  watch: [
    'Set M to 0.01, the textbook value: the price is the fundamental and the flow share of variance is nothing.',
    'Raise M to 5: the same flows now dominate the one-year return variance.',
    'Raise ρ_f, flow persistence: flows compound into long swings away from fundamentals — the regime in which a right thesis loses for a year.',
    'The impulse panel is the paper in one picture: 1% of market cap flows in at month 12 and the price steps up by M percent and stays there.',
  ],
  fidelity: 'simplified',
  fidelityNote:
    'The multiplier and permanent price impact are the paper’s; the flow process is a stylised AR(1) in place of the paper’s estimated flows, and the slow partial decay of impact and the cross-section of holders are not modelled.',
  params: [
    { key: 'M', label: 'M · price multiplier', min: 0.01, max: 10, step: 0.01, default: 5, meaning: 'Percent price change per 1% of market cap that flows in; the paper estimates about 5, textbooks imply about 0.01.' },
    { key: 'sigF', label: 'σ_f · monthly flow volatility', min: 0, max: 1, step: 0.02, default: 0.3, meaning: 'Typical monthly net flow, as a percent of market cap.' },
    { key: 'rhoF', label: 'ρ_f · flow persistence', min: 0, max: 0.95, step: 0.05, default: 0.5, meaning: 'How much of this month’s flow continues next month.' },
    { key: 'sigFund', label: 'σ_F · fundamental volatility (annual)', min: 0.05, max: 0.4, step: 0.01, default: 0.15, meaning: 'How much the fundamental value moves in a year.' },
  ],
  charts: [
    {
      id: 'path',
      title: 'Log price against the fundamental, ten years',
      read: 'The distance between the lines is the cumulative flow effect — large and persistent when M is large.',
      kind: 'line',
      xKey: 't',
      xLabel: 'month',
      yLabel: 'log level',
      series: [
        { key: 'p', label: 'price', role: 'accent' },
        { key: 'f', label: 'fundamental', role: 'context' },
      ],
      xTicks: [0, 24, 48, 72, 96, 120],
    },
    {
      id: 'impulse',
      title: 'Price response to a one-off inflow of 1% of market cap at month 12',
      read: 'The step is M percent and, in the paper’s baseline, it does not decay.',
      kind: 'line',
      xKey: 't',
      xLabel: 'month',
      yLabel: 'price (fundamental = 100)',
      series: [{ key: 'p', label: 'price', role: 'accent' }],
      refY: [100],
      refX: [12],
      xTicks: [0, 12, 24, 36],
    },
  ],
  simulate: (p, seed) => {
    const r = rng(seed)
    const T = 120
    const sigFm = p.sigFund / Math.sqrt(12)
    let logF = 0
    let cumFlow = 0
    let f = 0
    const path: Point[] = [{ t: 0, p: 0, f: 0 }]
    const logP: number[] = [0]
    const logFs: number[] = [0]
    for (let t = 1; t <= T; t++) {
      logF += sigFm * gauss(r)
      f = p.rhoF * f + p.sigF * gauss(r)
      cumFlow += f / 100
      const lp = logF + p.M * cumFlow
      logP.push(lp)
      logFs.push(logF)
      path.push({ t, p: +lp.toFixed(4), f: +logF.toFixed(4) })
    }
    const r12: number[] = []
    const f12: number[] = []
    for (let t = 12; t <= T; t++) {
      r12.push(logP[t] - logP[t - 12])
      f12.push(logFs[t] - logFs[t - 12])
    }
    const flow12 = r12.map((x, i) => x - f12[i])
    const varR = variance(r12)
    const flowShare = varR > 0 ? variance(flow12) / varR : 0
    const impulse: Point[] = []
    for (let t = 0; t <= 36; t++) impulse.push({ t, p: +(t >= 12 ? 100 * Math.exp((p.M * 1) / 100) : 100).toFixed(2) })
    const verdict = `At M = ${num(p.M, 2)} a 1%-of-cap inflow moves the price ${num(p.M, 1)}%; in this draw flows are ${pct(flowShare, 0)} of one-year return variance — ${flowShare > 0.5 ? 'the fundamental is the smaller part of a year’s return' : 'fundamentals still carry most of a year’s return'}.`
    return {
      data: { path: thin(path, 200), impulse },
      readouts: [
        { label: 'Impact of 1% inflow', value: pct(p.M / 100, 1), note: 'permanent, in the baseline' },
        { label: 'Flow share of 1-yr variance', value: pct(flowShare, 0), note: 'this draw; re-roll to see the spread' },
        { label: 'Max |price − fundamental|', value: num(Math.max(...logP.map((x, i) => Math.abs(x - logFs[i]))), 2), note: 'log units over ten years' },
      ],
      verdict,
    }
  },
}
