import type { Timestamp } from 'firebase/firestore'

/**
 * Campaign completion state. Content — blocks, units, ritual — lives in code
 * under lib/campaign/. This is only the record of what got finished.
 *
 * One document per campaign at users/{uid}/{campaignId}_progress/main, so the
 * campaign's own page and /exec read the same truth rather than each keeping
 * a private copy.
 */

export interface CampaignUnitRecord {
  doneAt: Timestamp
  note?: string
}

export interface CampaignProgressDoc {
  units?: Record<string, CampaignUnitRecord>
  /**
   * The /complexecon pathway and library checkboxes, migrated off localStorage
   * so progress follows the user across devices. Unused by Armstrong.
   */
  milestones?: Record<string, boolean>
  migratedAt?: Timestamp
  updatedAt?: Timestamp
}

/** One day of the standing ritual, at users/{uid}/{campaignId}_days/{date}. */
export interface CampaignRitualDay {
  date: string
  done: boolean
  note?: string
  completedAt?: Timestamp
}
