/**
 * Partner configuration.
 *
 * This is the single place that names the two people the dashboard is about —
 * "you & your partner". Every component, the AI prompt, and the stored data
 * key off the two partner slots `a` and `b` defined here. Set the display
 * names per user from their settings (see setPartnerNames).
 *
 * The two colors are the visual identity of each partner throughout the
 * dashboard — partner A is burgundy, partner B is deep green. Change them
 * here if you like; nothing else needs to know.
 */

export type PartnerKey = 'a' | 'b'

export interface Partner {
  key: PartnerKey
  name: string
  color: string
}

export const PARTNER_A: Partner = {
  key: 'a',
  name: 'Partner A',
  color: '#b85c38',
}

export const PARTNER_B: Partner = {
  key: 'b',
  name: 'Partner B',
  color: '#2d5f4a',
}

export const PARTNERS: Record<PartnerKey, Partner> = {
  a: PARTNER_A,
  b: PARTNER_B,
}

/** Display name for a partner slot (or "Both" / fallback for anything else). */
export function partnerName(key: string): string {
  if (key === 'a') return PARTNER_A.name
  if (key === 'b') return PARTNER_B.name
  if (key === 'both') return 'Both'
  return key
}

/** Brand color for a partner slot, with a neutral fallback. */
export function partnerColor(key: string): string {
  if (key === 'a') return PARTNER_A.color
  if (key === 'b') return PARTNER_B.color
  return '#c4873a'
}

/** The wordmark shown on the PIN screen and header. */
export const APP_NAME = 'CONNECTION'

/**
 * Point the two slots at the signed-in user's names. Called on the client
 * once settings load, before the dashboard renders; each browser holds one
 * user, so the shared objects are safe to mutate there. Server code never
 * reads these — the extraction prompt takes names as an argument.
 */
export function setPartnerNames(a: string, b: string): void {
  PARTNER_A.name = a.trim() || 'Partner A'
  PARTNER_B.name = b.trim() || 'Partner B'
}
