// Chart colours for the models sheet. Four categorical slots in a fixed order
// (assigned by series role, never cycled), one accent, one context gray, and a
// warm/cool diverging pair for signed bars. The slots are chromatic steps of the
// site's own hues — the brand's muted inks read as gray on a chart, so each
// slot is pushed just far enough in chroma to pass the palette checks on the
// cream surface. Validated with the dataviz palette script on #f5f1ea.

export const SURFACE = '#f5f1ea'

export const CHART = {
  accent: '#9a3b3b', // burgundy, chart step
  context: '#9a928a', // ink-muted — the gray a series is read against
  cat: ['#9a3b3b', '#b07d1c', '#2f6fb3', '#2e8b57'] as const, // burgundy · amber · blue · green — min adjacent ΔE 15.3 under CVD
  /** Diverging pair for bars above / below zero: warm burgundy, cool blue. */
  positive: '#9a3b3b',
  negative: '#2f6fb3',
  grid: '#e8e2da', // rule-light, hairline
  axis: '#d8d0c8', // rule
  reference: '#9a928a',
  band: '#9a928a',
  tick: '#9a928a',
}

import type { SeriesRole } from './types'

export function roleColor(role: SeriesRole): string {
  switch (role) {
    case 'accent':
      return CHART.accent
    case 'context':
      return CHART.context
    case 'cat1':
      return CHART.cat[0]
    case 'cat2':
      return CHART.cat[1]
    case 'cat3':
      return CHART.cat[2]
    case 'cat4':
      return CHART.cat[3]
  }
}
