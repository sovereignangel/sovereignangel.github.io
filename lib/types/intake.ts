import type { Timestamp } from 'firebase/firestore'

/**
 * The daily intake — what goes in, as against what comes out.
 *
 * Three kinds, because they are three different acts and collapsing them
 * hides the one that matters. Scanning news is orientation and costs minutes.
 * A long read is an argument you follow to its end. A paper is the only one
 * with a second half: reviewing it is reading, implementing it is knowing.
 *
 * Kept separate from ExternalSignal, which belongs to the thesis discovery
 * pipeline and carries AI relevance scoring, pillars and conversion state.
 * That type answers "is this worth a signal"; this one answers "have I read
 * my three today, and what did I take from them."
 */
export type IntakeKind = 'news' | 'longread' | 'paper'

/**
 * backlog — pulled and waiting. Rolls forward daily until it is dealt with;
 *           this is the pile that means there is always something to read
 *           that is not a feed.
 * done     — consumed, with a takeaway.
 * skipped  — deliberately passed over. Distinct from backlog so a decision
 *            not to read something is a decision rather than a silence, and
 *            the pile does not grow forever with things already judged.
 */
export type IntakeStatus = 'backlog' | 'done' | 'skipped'

export interface IntakeItem {
  id?: string
  kind: IntakeKind
  title: string
  url: string
  /** Feed or archive it came from — "Stratechery", "arXiv q-fin.PM". */
  source: string
  /** Publication date as the source gave it, YYYY-MM-DD. */
  publishedAt: string
  /** The day's download that brought it in, YYYY-MM-DD. Drives backlog age. */
  addedOn: string
  status: IntakeStatus
  /** One line, written on consuming it. The reason the ledger is worth keeping. */
  takeaway?: string
  /** YYYY-MM-DD it was consumed, so a day's ledger is a query not a scan. */
  consumedOn?: string
  /** Papers only: reviewing is reading it, implementing is having built it. */
  implemented?: boolean
  /** Short abstract or excerpt, for deciding whether to open it at all. */
  blurb?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

/**
 * A day's intake standing, at users/{uid}/intake_days/{date}.
 *
 * The news scan has no artefact — there is nothing to link to and nothing to
 * mark done on an item, so it is answered here by hand. The long read and the
 * paper are answered by the items themselves, which is why they are not
 * duplicated into this document: two places to say the same thing is two
 * places to disagree.
 */
export interface IntakeDayDoc {
  date: string
  /** The scan, done by hand — the one part of the day with no artefact. */
  newsScanned?: boolean
  /** The day's own line, above and beyond any single item's takeaway. */
  note?: string
  updatedAt?: Timestamp
}
