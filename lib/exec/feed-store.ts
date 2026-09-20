/**
 * The feed's memory — every item it has ever surfaced, and whether it was read.
 *
 * The card on /exec shows four items per subject per day. Everything else the
 * feed pulled, and everything shown but never opened, lands here rather than
 * scrolling away. That is the whole point of the backlog: a daily feed you can
 * fall behind on silently is just a slower version of the thing it replaced.
 *
 * Shape: users/{uid}/feed_items/{id}, where id is a hash of the link so the
 * same article re-appearing in a feed updates its row instead of duplicating.
 * Rows are never deleted — reading is a state change, not a removal, so the
 * archive stays searchable after the fact.
 *
 * Server-only. Uses the admin SDK with the same env UID the cron routes use,
 * because the ranking runs unattended and has no signed-in user to act as.
 */

import { adminDb } from '@/lib/firebase-admin'
import { createHash } from 'node:crypto'
import type { FeedItem, SubjectId } from './feed'

export interface FeedEntry {
  id: string
  title: string
  link: string
  source: string
  subject: SubjectId
  /** Publication date as YYYY-MM-DD, for date filtering. Empty when unknown. */
  publishedDate: string
  publishedAt: number | null
  /** 0-100 from the ranking pass, or null when the item was only ever backlog. */
  score: number | null
  reason: string | null
  /** The day this item was surfaced on the card. Null for backfilled rows. */
  surfacedOn: string | null
  read: boolean
  readAt: number | null
  /** Lowercased title + source, for substring search without an index. */
  searchText: string
  createdAt: number
}

export interface BacklogFilter {
  /** Inclusive YYYY-MM-DD bounds on publishedDate. */
  from?: string
  to?: string
  /** Space-separated terms; an entry must contain all of them. */
  q?: string
  subject?: SubjectId
  /** 'unread' is the default view — the backlog is what you have not read. */
  status?: 'unread' | 'read' | 'all'
  limit?: number
}

function entryId(link: string): string {
  return createHash('sha1').update(link).digest('hex').slice(0, 20)
}

function toDateKey(ms: number | null): string {
  if (ms === null) return ''
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function collection(uid: string) {
  return adminDb.collection('users').doc(uid).collection('feed_items')
}

/**
 * Write items without clobbering what is already known about them.
 *
 * Two rules, both of which exist because the same link arrives repeatedly by
 * different routes: a row that has been read stays read, and a row that already
 * carries a score keeps it unless this pass scored it too. Otherwise a backfill
 * run would quietly un-rank and un-read a month of rows.
 */
export async function upsertEntries(
  uid: string,
  items: FeedItem[],
  opts: { surfacedOn?: string | null } = {},
): Promise<{ written: number; skipped: number }> {
  if (!adminDb) return { written: 0, skipped: items.length }
  const surfacedOn = opts.surfacedOn ?? null
  const now = Date.now()
  let written = 0

  // Firestore caps a batch at 500 writes; chunk defensively for backfills.
  for (let i = 0; i < items.length; i += 400) {
    const chunk = items.slice(i, i + 400)
    const refs = chunk.map((item) => collection(uid).doc(entryId(item.link)))
    const existing = await adminDb.getAll(...refs)
    const batch = adminDb.batch()

    chunk.forEach((item, j) => {
      const prev = existing[j].exists ? (existing[j].data() as FeedEntry) : null
      const entry: FeedEntry = {
        id: refs[j].id,
        title: item.title,
        link: item.link,
        source: item.source,
        subject: item.subject,
        publishedDate: toDateKey(item.published),
        publishedAt: item.published,
        score: item.score ?? prev?.score ?? null,
        reason: item.reason ?? prev?.reason ?? null,
        surfacedOn: surfacedOn ?? prev?.surfacedOn ?? null,
        read: prev?.read ?? false,
        readAt: prev?.readAt ?? null,
        searchText: `${item.title} ${item.source}`.toLowerCase(),
        createdAt: prev?.createdAt ?? now,
      }
      batch.set(refs[j], entry)
      written += 1
    })
    await batch.commit()
  }
  return { written, skipped: 0 }
}

/**
 * Filtering happens in memory after a single ordered read.
 *
 * Firestore cannot combine a range on publishedDate with an arbitrary substring
 * match, and building composite indexes for every filter combination is not
 * worth it at this volume — a year of these feeds is a few thousand rows. The
 * read is capped so this stays true if that assumption ever stops holding.
 */
export async function listBacklog(uid: string, filter: BacklogFilter = {}): Promise<FeedEntry[]> {
  if (!adminDb) return []
  const { from, to, q, subject, status = 'unread', limit = 200 } = filter

  const snap = await collection(uid).orderBy('publishedAt', 'desc').limit(2000).get()
  const terms = (q || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  const out: FeedEntry[] = []
  for (const doc of snap.docs) {
    const e = doc.data() as FeedEntry
    if (status === 'unread' && e.read) continue
    if (status === 'read' && !e.read) continue
    if (subject && e.subject !== subject) continue
    if (from && (!e.publishedDate || e.publishedDate < from)) continue
    if (to && (!e.publishedDate || e.publishedDate > to)) continue
    if (terms.length && !terms.every((t) => e.searchText.includes(t))) continue
    out.push(e)
    if (out.length >= limit) break
  }
  return out
}

export async function setRead(uid: string, id: string, read: boolean): Promise<void> {
  if (!adminDb) return
  await collection(uid).doc(id).set(
    { read, readAt: read ? Date.now() : null },
    { merge: true },
  )
}

/** Counts for the backlog header — cheap enough to run on every page load. */
export async function backlogStats(uid: string): Promise<{ unread: number; read: number; total: number }> {
  if (!adminDb) return { unread: 0, read: 0, total: 0 }
  const snap = await collection(uid).select('read').get()
  let unread = 0
  snap.forEach((d) => {
    if ((d.data() as { read?: boolean }).read) return
    unread += 1
  })
  return { unread, read: snap.size - unread, total: snap.size }
}

/** Today's ranked card, as last written by the daily run. */
export async function getSurfaced(uid: string, day: string): Promise<FeedEntry[]> {
  if (!adminDb) return []
  const snap = await collection(uid).where('surfacedOn', '==', day).get()
  return snap.docs
    .map((d) => d.data() as FeedEntry)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}
