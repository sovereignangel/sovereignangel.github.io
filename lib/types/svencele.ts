import type { Timestamp } from 'firebase/firestore'

/**
 * The Svencele block's ticks — one document at users/{uid}/trips/svencele.
 *
 * Keys are `${date}:${itemId}` for a scheduled item and `trip:${itemId}` for
 * the two Dave sessions, which are not tied to a date. Unticking deletes the
 * key rather than storing false: the block is five days long and the document
 * should not outlive it by carrying a record of everything ever unticked.
 */
export interface TripProgressDoc {
  items?: Record<string, true>
  updatedAt?: Timestamp
}
