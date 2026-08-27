/**
 * Palette shim for the Lordas Goals components.
 *
 * These names predate the Console standard and are kept so the components that
 * import them keep working, but every value now resolves to a Console token.
 * New code should import from `./design/tokens` directly — this file exists to
 * keep the old call sites correct, not to define a second palette.
 */

import { C, OWNER as OWNER_COLORS_TOKENS } from './design/tokens'
import type { LordasGoalOwner } from '@/lib/types'

export { personLabel, ownerLabel, partnerOf, CATEGORY_LABELS } from '@/lib/lordas-goals'

/** @deprecated terracotta is retired — this now resolves to the brand accent */
export const TERRACOTTA = C.accent
export const CREAM = C.ground
export const PAPER = C.panel
export const INK = C.ink
export const MUTED = C.muted
export const RULE = C.rule
export const SAGE = C.ok
export const AMBER = C.warn
export const ROSE = C.crit

export const OWNER_COLORS: Record<LordasGoalOwner, string> = {
  lori: OWNER_COLORS_TOKENS.lori,
  aidas: OWNER_COLORS_TOKENS.aidas,
  relationship: OWNER_COLORS_TOKENS.relationship,
}

/** @deprecated use OWNER_COLORS */
export const PERSON_COLORS = OWNER_COLORS
