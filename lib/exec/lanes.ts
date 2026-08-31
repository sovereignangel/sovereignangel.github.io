/**
 * The five lanes of the day, and the one accent each of them wears.
 *
 * Colours are explicit hex rather than Tailwind classes because the today
 * band renders every lane through the same component — the same reason
 * SportChip and probColor already work this way in the exec tree. All five
 * sit in the warm paper palette the rest of the site uses: no lane is louder
 * than another, and none of them is the alert colour.
 */

export type LaneId = 'tantra' | 'kite' | 'ironman' | 'complexecon' | 'armstrong'

export interface Lane {
  id: LaneId
  /** Band label — short enough to survive a phone. */
  label: string
  /** Where the full surface lives. */
  href: string
  color: string
  /** Faint wash behind a live lane. */
  bg: string
  /** Border for a live lane. */
  border: string
}

const wash = (hex: string, alpha: string) => hex + alpha

export const LANES: Lane[] = [
  { id: 'tantra',      label: 'Tantra',    href: '/tantra',               color: '#6b4a72', bg: wash('#6b4a72', '0d'), border: wash('#6b4a72', '40') },
  { id: 'kite',        label: 'Kite',      href: '/wind',                 color: '#1a8a8f', bg: wash('#1a8a8f', '0d'), border: wash('#1a8a8f', '40') },
  { id: 'ironman',     label: 'Ironman',   href: '/ironman',              color: '#8f2d33', bg: wash('#8f2d33', '0d'), border: wash('#8f2d33', '40') },
  { id: 'complexecon', label: 'CEcon',     href: '/complexecon/research', color: '#2d4a6f', bg: wash('#2d4a6f', '0d'), border: wash('#2d4a6f', '40') },
  { id: 'armstrong',   label: 'Armstrong', href: '/armstrong',            color: '#7a5a2e', bg: wash('#7a5a2e', '0d'), border: wash('#7a5a2e', '40') },
]

export const LANE_BY_ID: Record<LaneId, Lane> = LANES.reduce(
  (acc, lane) => ({ ...acc, [lane.id]: lane }),
  {} as Record<LaneId, Lane>
)

/** Neutral ink shared by every lane, so only the accent changes between them. */
export const LANE_INK = {
  ink: '#2b3a3f',
  muted: '#7d8a86',
  faint: '#b8c2bc',
  rule: '#e4dccb',
  ruleLight: '#ede6d6',
  card: '#fffdf7',
  good: '#2d6b4a',
  warn: '#8a6420',
  alert: '#c94f35',
} as const
