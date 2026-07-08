/**
 * Shared palette + owner accents for the Lordas Goals components.
 */

import type { LordasGoalOwner } from '@/lib/types'

export { personLabel, ownerLabel, partnerOf, CATEGORY_LABELS } from '@/lib/lordas-goals'

export const TERRACOTTA = '#b85c38'
export const CREAM = '#f5f0e8'
export const PAPER = '#faf7f2'
export const INK = '#2a2420'
export const MUTED = '#8a7e72'
export const RULE = '#d8cfc4'
export const SAGE = '#2d5f4a'
export const AMBER = '#c4873a'
export const ROSE = '#8c3d3d'

export const OWNER_COLORS: Record<LordasGoalOwner, string> = {
  lori: TERRACOTTA,
  aidas: SAGE,
  relationship: AMBER,
}

/** @deprecated use OWNER_COLORS */
export const PERSON_COLORS = OWNER_COLORS
