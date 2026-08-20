import type { Timestamp } from 'firebase/firestore'

// Per-book memo on the /complexecon pathway page.
// Stored at users/{uid}/complexecon_notes/{itemId} — itemId is the
// LibraryItem id from lib/complexecon/pathway.ts.
export interface ComplexEconNote {
  id?: string
  text: string
  updatedAt?: Timestamp
}
