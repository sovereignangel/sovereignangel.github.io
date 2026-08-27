/**
 * Lordas Console tokens — the single source of colour and spacing.
 *
 * See LORDAS_BRAND_STRATEGY.md. Never write a hex literal in a component;
 * import from here or use the CSS custom properties the layout defines on
 * `.lordas`, which mirror these exactly.
 */

export const C = {
  ground: '#1B120C',
  panel: '#241811',
  panelQuiet: '#2E1F16',
  panelRaise: '#3A2A20',
  rule: '#3E2C20',
  ruleSoft: '#33241A',
  ink: '#F2E8DA',
  muted: '#B39D85',
  faint: '#836F5C',
  accent: '#6FA3CE',
  accentDeep: '#4C7BA6',
  ok: '#6FB89A',
  warn: '#D9A63F',
  crit: '#DE7259',

  /**
   * Person colours. Lori is the sun — expanding what is possible; Aidas is
   * the lens — testing what is feasible.
   *
   * Sun is brass, deliberately the same value as the `warn` state. They never
   * collide in practice because they live in different registers: a person
   * colour only ever appears beside its sigil or as a named series in a
   * legend, and a state colour only ever appears as a left-edge stripe, a
   * chip, or a status value. The sun glyph is what disambiguates — if brass
   * appears without a sigil next to it, it means watch.
   */
  sun: '#D9A63F',
  lens: '#54BFC4',
} as const

/**
 * Lori is always sun, Aidas always lens — the reader should know whose number
 * they are looking at before they read a name. Relationship-owned things take
 * the brand accent.
 *
 * Person colour is never a bare status value. It always appears beside its
 * sigil or as a named series in a legend, which is what keeps sun from being
 * mistaken for the brass "watch" state.
 */
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

/** 8% wash of a semantic colour, for chip and stripe backgrounds. */
export const wash = (hex: string) => `${hex}14`
/** 33% edge of a semantic colour, for chip borders. */
export const edge = (hex: string) => `${hex}55`

export const SPORT_COLOR: Record<string, string> = {
  swim: C.accent,
  bike: C.warn,
  run: C.ok,
  brick: '#B889CE',
  strength: C.muted,
  core: C.muted,
  rest: C.faint,
}

/** Readiness and compliance bands share one vocabulary across every module. */
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
