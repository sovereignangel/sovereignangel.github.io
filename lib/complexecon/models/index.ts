// The registry for /complexecon/models — paper reproductions a reader can
// move the parameters of and watch. Order is the reading order: the clock
// (why 1–2 years), then who sets it (heterogeneous agents, ecology), then the
// forces that run against it (flows, herds, bubbles, crowding).

import { berkGreen } from './berk-green'
import { brockHommes } from './brock-hommes'
import { farmerJoshi } from './farmer-joshi'
import { hongStein } from './hong-stein'
import { inelasticMarkets } from './inelastic-markets'
import { kirmanAnts } from './kirman-ants'
import { lppls } from './lppls'
import { marketEcology } from './market-ecology'
import { priceValueOU } from './price-value-ou'
import { summersFads } from './summers-fads'
import type { ModelSpec } from './types'

export type * from './types'

export const MODELS: ModelSpec[] = [
  summersFads,
  priceValueOU,
  brockHommes,
  farmerJoshi,
  hongStein,
  marketEcology,
  inelasticMarkets,
  kirmanAnts,
  berkGreen,
  lppls,
]

export const MODELS_FRAMING = {
  title: 'Models',
  question: 'What do the papers say happens to a mispricing over one to two years — and which parameter decides it?',
  statement:
    'Ten papers, each reduced to the few parameters that drive its result and rebuilt as a simulation you can move. Every model answers one question about the clock a quantamental position runs on: how fast a gap between price and value closes, who closes it, what pushes against it, and what happens to the edge as capital arrives. Sliders are the paper’s own parameters where the paper has them; the fidelity chip on each model says whether you are looking at the paper’s equations or a reduced rendering of its mechanism.',
}

export function modelById(id: string): ModelSpec | undefined {
  return MODELS.find(m => m.id === id)
}

export function defaultParams(m: ModelSpec): Record<string, number> {
  const out: Record<string, number> = {}
  for (const p of m.params) out[p.key] = p.default
  return out
}
