/**
 * Arete Technologies — brand tokens and the mark.
 *
 * Canonical source: "Arete Technologies/arete_brand_system (1).md". The house
 * is named for ἀρετή — excellence as the realization of potential through
 * disciplined practice — and "Technologies" is meant in the sense of technē,
 * the practices and instruments that produce it.
 *
 * The type stack is already loaded globally by app/layout.tsx via next/font
 * (Crimson Pro, IBM Plex Mono, Inter), so surfaces reference the CSS variables
 * rather than importing webfonts of their own.
 */

export const ARETE = {
  cream: '#f5f1ea',
  paper: '#faf8f4',
  ink: '#2a2522',
  inkMuted: '#6b5f55',
  inkSoft: '#8a7f74',
  burgundy: '#7c2d2d',
  burgundyLight: '#9c4040',
  rule: '#d8cfc1',
  ruleSoft: '#e8e0d2',
  // Semantic, kept separate from the brand accent so a status never reads as
  // an accent and an accent never reads as a status.
  greenInk: '#2d5f3f',
  amberInk: '#8a6d2f',
  serif: 'var(--font-crimson), Georgia, serif',
  mono: 'var(--font-ibm-plex), ui-monospace, Menlo, monospace',
  sans: 'var(--font-inter), system-ui, sans-serif',
} as const

/** The house lines. Each has one home; none of them appear everywhere. */
export const ARETE_LINES = {
  house: 'Arete Technologies',
  tagline: 'The long practice.',
  motto: 'What compounds, endures.',
  inscription: 'Eadem mutata resurgo',
  glyph: 'ἀρετή',
} as const

/**
 * Bernoulli's spira mirabilis — r = a·e^(bθ). Self-similar: it grows without
 * changing shape, which is the geometric form of compounding. Parameters are
 * fixed by the brand system; the mark never varies between ventures.
 */
const SPIRAL = { a: 0.5, b: 0.205, thetaMin: -1.0, thetaMax: 8 * Math.PI, steps: 420 }

function spiralPath(cx: number, cy: number): string {
  const { a, b, thetaMin, thetaMax, steps } = SPIRAL
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const theta = thetaMin + (thetaMax - thetaMin) * (i / steps)
    const r = a * Math.exp(b * theta)
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(theta)).toFixed(2)} ${(cy + r * Math.sin(theta)).toFixed(2)} `
  }
  return d.trim()
}

/** Computed once at module load — deterministic, so it costs nothing per render. */
export const SPIRAL_PATH = spiralPath(120, 120)
