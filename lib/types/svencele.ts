import type { Timestamp } from 'firebase/firestore'
import type { SlotState } from '../exec/svencele'

/**
 * The Svencele block's state — one document at users/{uid}/trips/svencele.
 *
 * `items` holds the plain ticks (kite hours, the evening run, the two Dave
 * sessions), keyed `${date}:${itemId}` or `trip:${itemId}`. `slots` holds the
 * four exchangeable desk blocks per day, keyed `${date}:${slotId}` — each one
 * carrying the lane it was traded into, the goal and KPI written before it
 * started, and what actually came out of it.
 *
 * Unticking deletes the key rather than storing false: the block is four days
 * long and the document should not outlive it carrying a record of everything
 * ever unticked.
 */
export interface TripProgressDoc {
  items?: Record<string, true>
  slots?: Record<string, SlotState>
  /** date → the end-of-day note, in your own words. */
  debriefs?: Record<string, string>
  updatedAt?: Timestamp
}
