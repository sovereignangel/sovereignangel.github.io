// Kirman (1993), "Ants, rationality, and recruitment", Quarterly Journal of
// Economics 108(1), 137–156.
//
// N ants choose between two identical food sources. Each step one ant is
// drawn; with probability ε it switches on its own, otherwise it meets another
// ant and with probability δ is recruited to that ant's source. With small ε
// the colony herds — most ants on one source, with occasional mass switches —
// even though the sources are identical and no ant prefers either.
//
// The same recruitment process is the herding kernel inside Lux–Marchesi and
// Alfarano–Lux–Wagner, where the two "sources" are optimistic and pessimistic
// views of a stock.

import { histogram, mean, pct, rng, thin } from './sim'
import type { ModelSpec, Point } from './types'

export const kirmanAnts: ModelSpec = {
  id: 'kirman-ants',
  numeral: 'VIII',
  question: 'Why does a crowd with no reason to prefer either view end up almost all on one side — and then switch?',
  answer:
    'Recruitment does it. When being persuaded by a neighbour is far more likely than changing your mind alone, the majority view recruits faster than it loses members, so the crowd sits near unanimity and flips rarely and completely. Raise independent switching and the crowd settles back near fifty-fifty.',
  paper: {
    cite: 'Kirman (1993)',
    title: 'Ants, rationality, and recruitment',
    venue: 'Quarterly Journal of Economics 108(1), 137–156',
    url: 'https://doi.org/10.2307/2118498',
    code: [{ label: 'Kirman ants, interactive (JS)', url: 'https://rf.mokslasplius.lt/kirman-ants/' }],
    libraryId: 'lib-kirman',
  },
  mechanism:
    'Two forces act on the fraction of ants at the first source. Recruitment pulls toward whichever source already has more ants — the more ants there, the more encounters recruit toward it. Spontaneous switching pushes toward one half. When recruitment dominates, the fraction spends most of its time near zero or one and crosses the middle quickly; when spontaneous switching dominates, it hovers around a half.',
  armstrong:
    'Sell-side ratings are a recruitment process: analysts move toward the prevailing view, and a cluster of upgrades is often one recruitment wave rather than three independent judgments. The “three ratings in ninety days” rule is a herd detector; this model says when such a herd is informative (high ε — each analyst switching on their own evidence) and when it is a single mood (low ε — recruitment doing the work).',
  watch: [
    'Start with ε small: the histogram is U-shaped and the time series sits near 0 or 1 with sudden flips — herding.',
    'Raise ε: the histogram turns hump-shaped around a half — independent opinion.',
    'Raise N with ε fixed: the flips get rarer and the herds longer; the crowd’s size, not its reasons, sets the persistence.',
    'Lower δ (recruitment) toward zero: with nobody persuading anybody, the crowd is a coin toss.',
  ],
  fidelity: 'faithful',
  fidelityNote:
    'The paper’s two-source recruitment process, simulated one encounter at a time; the histogram is the empirical long-run distribution of the fraction at source one.',
  params: [
    { key: 'N', label: 'N · ants', min: 10, max: 300, step: 10, default: 100, meaning: 'Colony size; in the market reading, the number of participants forming a view.' },
    { key: 'eps', label: 'ε · spontaneous switching', min: 0.001, max: 0.1, step: 0.001, default: 0.004, meaning: 'Chance a drawn ant changes source on its own, without meeting anyone.' },
    { key: 'delta', label: 'δ · recruitment', min: 0.05, max: 1, step: 0.05, default: 0.6, meaning: 'Chance a drawn ant adopts the source of the ant it meets.' },
  ],
  charts: [
    {
      id: 'series',
      title: 'Fraction of the colony at source one',
      read: 'Long stays near the edges with sudden crossings are herding; hovering around a half is independence.',
      kind: 'line',
      xKey: 't',
      xLabel: 'encounters (thousands)',
      yLabel: 'fraction',
      series: [{ key: 'k', label: 'fraction at source one', role: 'accent' }],
      refY: [0.5],
      yDomain: [0, 1],
    },
    {
      id: 'hist',
      title: 'Long-run distribution of the fraction',
      read: 'U-shaped is a herd; hump-shaped is a crowd of independent minds.',
      kind: 'bars',
      xKey: 'x',
      xLabel: 'fraction at source one',
      yLabel: 'time spent',
      series: [{ key: 'count', label: 'time spent', role: 'accent' }],
    },
  ],
  simulate: (p, seed) => {
    const r = rng(seed)
    const N = Math.max(2, Math.round(p.N))
    let k = Math.round(N / 2)
    const steps = 60000
    const burn = 10000
    const samples: number[] = []
    const series: Point[] = []
    for (let s = 0; s < steps; s++) {
      const i = r() < k / N ? 1 : 0 // the drawn ant's source: 1 with prob k/N
      if (r() < p.eps) {
        k += i === 1 ? -1 : 1
      } else {
        // Meet another ant; its source is drawn from the rest of the colony.
        const others = N - 1
        const sameSource = i === 1 ? (k - 1) / others : (N - k - 1) / others
        if (r() >= sameSource && r() < p.delta) k += i === 1 ? -1 : 1
      }
      if (k < 0) k = 0
      if (k > N) k = N
      if (s >= burn && s % 10 === 0) {
        samples.push(k / N)
        series.push({ t: +(s / 1000).toFixed(2), k: +(k / N).toFixed(3) })
      }
    }
    const hist = histogram(samples, 20, 0, 1)
    const edges = mean(samples.map(x => (x < 0.2 || x > 0.8 ? 1 : 0)))
    const middle = mean(samples.map(x => (x > 0.4 && x < 0.6 ? 1 : 0)))
    const verdict =
      edges > middle
        ? `Herding: the colony spends ${pct(edges, 0)} of its time with more than 80% on one source and only ${pct(middle, 0)} near even — recruitment outruns independent switching.`
        : `Independent opinion: the colony spends ${pct(middle, 0)} of its time near even and only ${pct(edges, 0)} in a herd — spontaneous switching outruns recruitment.`
    return {
      data: { series: thin(series, 400), hist },
      readouts: [
        { label: 'Time in a herd', value: pct(edges, 0), note: 'fraction below 0.2 or above 0.8' },
        { label: 'Time near even', value: pct(middle, 0), note: 'fraction between 0.4 and 0.6' },
        { label: 'ε vs δ/(N−1)', value: `${p.eps.toFixed(3)} vs ${(p.delta / (N - 1)).toFixed(3)}`, note: 'herding when the first is the smaller' },
      ],
      verdict,
    }
  },
}
