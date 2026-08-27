/**
 * Palette for the Lordas exec + ironman pages.
 *
 * The lordas dashboard is terracotta on cream; the solo /exec page is teal for
 * kiting and burgundy for training. These pages sit in lordas, so terracotta
 * stays the house colour and the two athletes carry the accents — Lori
 * terracotta, Aidas sage — matching the owner colours the Goals view already
 * uses. Kite keeps a teal of its own so the weather half stays visually
 * separate from the training half.
 */

export const CREAM = '#f5f0e8'
export const PAPER = '#faf7f2'
export const INK = '#2a2420'
export const MUTED = '#8a7e72'
export const FAINT = '#b3a89b'
export const RULE = '#d8cfc4'
export const RULE_LIGHT = '#e6ded3'
export const TERRACOTTA = '#b85c38'
export const SAGE = '#2d5f4a'
export const TEAL = '#2d6b6b'
export const AMBER = '#c4873a'
export const ROSE = '#8c3d3d'

export const BAND_COLOR: Record<string, string> = {
  green: SAGE,
  amber: AMBER,
  red: ROSE,
  unknown: FAINT,
}

export const SPORT_COLOR: Record<string, string> = {
  swim: TEAL,
  bike: TERRACOTTA,
  run: SAGE,
  brick: '#6b2d52',
  strength: AMBER,
  rest: FAINT,
}

export const SPOT_STATE_COLOR: Record<string, string> = {
  rideable: TEAL,
  possible: AMBER,
  hazard: ROSE,
  flat: FAINT,
}
