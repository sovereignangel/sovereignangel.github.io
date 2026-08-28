/**
 * Lordas tokens — Field.
 *
 * The arms are navy, antique gold and parchment; the interface was warm
 * espresso with a teal accent that had no source in them. Field settles that
 * by dividing the page the way a shield divides rather than picking one
 * temperature: navy carries evidence, warm carries action, and a cool neutral
 * ground holds both.
 *
 * See LORDAS_BRAND_STRATEGY.md. Never write a hex literal in a component.
 */

export const C = {
  /** The mediating ground — cool, but not the shield's own navy */
  ground: '#171B26',

  /** Action surfaces: today, the session, anything asking you to do something */
  action: '#241811',
  actionQuiet: '#2E1F16',

  /** Evidence surfaces: tables, forecasts, the block, anything asking you to read */
  evidence: '#141C30',
  evidenceQuiet: '#1A2440',

  rule: '#33344A',
  ruleSoft: '#262A3A',
  raise: '#2A3040',

  ink: '#EFE9DE',
  muted: '#A9A69E',
  faint: '#7A7670',

  /** Antique gold, off the device on the shield */
  accent: '#C89646',
  accentDeep: '#A07030',

  ok: '#6E9E7F',
  warn: '#D9A441',
  crit: '#C0552E',
  /** The banner's ember, dark enough for stripes and washes but not for text */
  critDeep: '#8C3214',

  /** The banner itself — used sparingly, for the one thing that is a record */
  parchment: '#E6D2A0',

  /**
   * Person colours, both taken from the arms. Lori is the sun that crowns
   * them; Aidas is the lens on the shield, which samples as pewter — the
   * teal it used to be had no source in the artwork at all.
   */
  sun: '#C89646',
  lens: '#9AAEB8',

  /** Backwards-compatible aliases for the surfaces most components still name */
  panel: '#141C30',
  panelQuiet: '#1A2440',
  panelRaise: '#2A3040',
} as const

/**
 * Which field a surface belongs to. `action` is warm and asks you to do
 * something; `evidence` is navy and asks you to read. A card that cannot say
 * which it is usually wants to be two cards.
 */
export type Field = 'action' | 'evidence'

export const OWNER: Record<string, string> = {
  lori: C.sun,
  aidas: C.lens,
  relationship: C.accent,
}

export const TONE = {
  ok: C.ok,
  warn: C.warn,
  crit: C.crit,
  accent: C.accent,
  none: 'transparent',
} as const

export type Tone = keyof typeof TONE

export const V = {
  ground: 'var(--lordas-ground)',
  panel: 'var(--lordas-panel)',
  panelQuiet: 'var(--lordas-panel-quiet)',
  action: 'var(--lordas-action)',
  evidence: 'var(--lordas-evidence)',
  rule: 'var(--lordas-rule)',
  ruleSoft: 'var(--lordas-rule-soft)',
  ink: 'var(--lordas-ink)',
  muted: 'var(--lordas-muted)',
  faint: 'var(--lordas-faint)',
  accent: 'var(--lordas-accent)',
  ok: 'var(--lordas-ok)',
  warn: 'var(--lordas-warn)',
  crit: 'var(--lordas-crit)',
} as const

export const wash = (hex: string) => `${hex}1A`
export const edge = (hex: string) => `${hex}5C`

export const SPORT_COLOR: Record<string, string> = {
  swim: C.lens,
  bike: C.accent,
  run: C.ok,
  brick: '#A88BC0',
  strength: C.muted,
  core: C.muted,
  rest: C.faint,
}

export function bandColor(band: string | null | undefined): string {
  if (band === 'green' || band === 'ok' || band === 'done') return C.ok
  if (band === 'amber' || band === 'warn' || band === 'partial') return C.warn
  if (band === 'red' || band === 'crit' || band === 'missed') return C.crit
  return C.faint
}

export const FONT = {
  display: 'var(--lordas-display)',
  body: 'var(--lordas-body)',
  mono: 'var(--lordas-mono)',
} as const

/** The wordmark line, kept here so the primitives import nothing lordas-specific. */
export const LORDAS_MOTTO = 'Source then Aim.'
