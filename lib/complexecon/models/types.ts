// Shared types for the /complexecon/models sheet — the paper reproductions.
//
// A model is a paper reduced to the handful of parameters that drive its result,
// a pure `simulate` function, and the charts that make the result visible. The
// sheet owns the sliders and the rendering; the model files own the equations.

export interface ModelParam {
  key: string
  label: string
  min: number
  max: number
  step: number
  default: number
  /** Plain-English meaning, one line — the jargon is defined on the page. */
  meaning: string
  /** Display formatter for the slider value; defaults to a short number. */
  fmt?: (v: number) => string
}

/**
 * Series colour by job, never by index: `accent` is the series the story is
 * about, `context` is the gray it is read against, `cat1..cat4` are the fixed
 * categorical slots for charts whose series are the subject.
 */
export type SeriesRole = 'accent' | 'context' | 'cat1' | 'cat2' | 'cat3' | 'cat4'

export interface SeriesSpec {
  key: string
  label: string
  role: SeriesRole
}

export interface ChartSpec {
  id: string
  title: string
  /** What the eye should find — one line under the title. */
  read: string
  kind: 'line' | 'bars' | 'dots'
  xKey: string
  xLabel: string
  yLabel: string
  series: SeriesSpec[]
  /** Horizontal reference lines, e.g. the fundamental at 0. */
  refY?: number[]
  /** A shaded band between two y values, e.g. Black's factor-2 band. */
  band?: [number, number]
  /** Vertical reference lines, e.g. the shock date or t_c. */
  refX?: number[]
  /** For bars: colour above/below zero as a diverging pair. */
  signed?: boolean
  /** Fix the y range instead of fitting the data. */
  yDomain?: [number, number]
  /** Explicit x ticks for line charts, e.g. the months that mean something. */
  xTicks?: number[]
}

export interface Readout {
  label: string
  value: string
  note?: string
}

export type Point = Record<string, number>

export interface SimResult {
  data: Record<string, Point[]>
  readouts: Readout[]
  /** One line the simulation writes about the current parameters. */
  verdict?: string
}

/**
 * `faithful` — the paper's own equations, parameterised as published.
 * `simplified` — the mechanism in a reduced form; `fidelityNote` says what was
 * left out, so a reader never mistakes the toy for the paper.
 */
export type Fidelity = 'faithful' | 'simplified'

export interface PaperRef {
  /** Short cite, e.g. "Brock & Hommes (1998)". */
  cite: string
  title: string
  venue: string
  /** Open-access PDF or DOI; absent when none was verified. */
  url?: string
  /** Implementations that already exist online — found, not written here. */
  code?: { label: string; url: string }[]
  /** `id` in lib/complexecon/roadmap.ts CE_PAPERS when the paper is on the top-30. */
  roadmapId?: string
  /** `id` in lib/complexecon/pathway.ts LIBRARY when the paper is shelved. */
  libraryId?: string
}

export interface ModelSpec {
  id: string
  numeral: string
  /** The question the model answers — the title. */
  question: string
  /** The takeaway in plain English — the subtitle. */
  answer: string
  paper: PaperRef
  /** The mechanism, in plain English. */
  mechanism: string
  /** Why it matters for a 1–2 year, analyst-anchored LEAP book. */
  armstrong: string
  /** What to look for while moving the sliders. */
  watch: string[]
  fidelity: Fidelity
  fidelityNote: string
  params: ModelParam[]
  charts: ChartSpec[]
  simulate: (p: Record<string, number>, seed: number) => SimResult
}
