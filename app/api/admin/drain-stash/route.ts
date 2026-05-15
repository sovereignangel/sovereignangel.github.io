/**
 * Admin endpoint to drain stashed inbound items.
 *
 * Drains three collections:
 *   - users/{uid}/queued_routing/         (/arm, /ab stash from Phase 2A)
 *   - users/{uid}/pending_deepops_meetings/  (Wave fanout, 4 DeepOps tags)
 *   - users/{uid}/pending_alamobernal_meetings/  (Wave fanout, alamobernal tag)
 *
 * Stash rows are written when a project ingest endpoint was unreachable
 * (e.g., before the schema migration was run, or during a transient outage).
 * Once the endpoint is healthy again, this drain replays each row.
 *
 * Auth: x-inbox-secret header must match INBOX_SHARED_SECRET env var.
 *
 * Usage:
 *   curl -X POST https://www.loricorpuz.com/api/admin/drain-stash \
 *     -H "x-inbox-secret: $INBOX_SHARED_SECRET"
 *
 *   # Dry-run mode (lists what would drain without mutating):
 *   curl -X POST 'https://www.loricorpuz.com/api/admin/drain-stash?dry=1' ...
 *
 * Idempotent — only drains rows where status='stashed' (not yet drained).
 * On success, marks status='drained' + drained_at=now. On failure, increments
 * attempts and stores last_error.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf-8')
  const b = Buffer.from(expected, 'utf-8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

const PROJECT_INBOX_URL: Record<string, string> = {
  armstrong: process.env.ARMSTRONG_INGEST_URL || 'https://armstrong.loricorpuz.com/api/inbox-ingest',
  'alamo-bernal': process.env.ALAMOBERNAL_INGEST_URL || 'https://alamobernal.loricorpuz.com/api/inbox-ingest',
}

const PROJECT_MEETINGS_URL: Record<string, string> = {
  armstrong: process.env.ARMSTRONG_MEETINGS_URL || 'https://armstrong.loricorpuz.com/api/meetings/ingest',
  'alamo-bernal': process.env.ALAMOBERNAL_MEETINGS_URL || 'https://alamobernal.loricorpuz.com/api/meetings/ingest',
}

interface DrainCounts {
  collection: string
  found: number
  drained: number
  failed: number
  skipped: number
  errors: Array<{ id: string; error: string }>
}

async function drainQueuedRouting(
  db: FirebaseFirestore.Firestore,
  uid: string,
  secret: string,
  dry: boolean,
): Promise<DrainCounts> {
  const counts: DrainCounts = { collection: 'queued_routing', found: 0, drained: 0, failed: 0, skipped: 0, errors: [] }
  const snap = await db
    .collection('users').doc(uid)
    .collection('queued_routing')
    .where('status', '==', 'stashed')
    .limit(50)
    .get()
  counts.found = snap.size

  for (const doc of snap.docs) {
    const row = doc.data()
    const source = row.source as string
    const url = PROJECT_INBOX_URL[source]
    if (!url) {
      counts.skipped++
      counts.errors.push({ id: doc.id, error: `unknown source: ${source}` })
      continue
    }

    if (dry) {
      counts.drained++  // would-be drain count
      continue
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-inbox-secret': secret },
        body: JSON.stringify({
          source,
          text: row.text,
          sender_chat_id: row.sender_chat_id ?? null,
          kind: row.kind || 'freeform',
        }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
      }
      await doc.ref.update({
        status: 'drained',
        drained_at: new Date(),
        attempts: (row.attempts || 0) + 1,
        last_error: null,
      })
      counts.drained++
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await doc.ref.update({
        attempts: (row.attempts || 0) + 1,
        last_error: errMsg.slice(0, 500),
      })
      counts.failed++
      counts.errors.push({ id: doc.id, error: errMsg.slice(0, 200) })
    }
  }

  return counts
}

async function drainPendingMeetings(
  db: FirebaseFirestore.Firestore,
  uid: string,
  collection: string,
  project: 'armstrong' | 'alamo-bernal',
  secret: string,
  dry: boolean,
): Promise<DrainCounts> {
  const counts: DrainCounts = { collection, found: 0, drained: 0, failed: 0, skipped: 0, errors: [] }
  const snap = await db
    .collection('users').doc(uid)
    .collection(collection)
    .where('drained_at', '==', null)
    .limit(50)
    .get()
  counts.found = snap.size

  const url = PROJECT_MEETINGS_URL[project]

  for (const doc of snap.docs) {
    const row = doc.data()
    if (dry) {
      counts.drained++
      continue
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-inbox-secret': secret },
        body: JSON.stringify({
          wave_session_id: row.wave_session_id,
          title: row.wave_session_title || 'Untitled',
          transcript: row.transcript_text,
          segments: row.segments || [],
          attendees: [],
          duration_seconds: row.duration_seconds || 0,
          surface: row.surface,
        }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
      }
      await doc.ref.update({
        drained_at: new Date(),
      })
      counts.drained++
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      counts.failed++
      counts.errors.push({ id: doc.id, error: errMsg.slice(0, 200) })
    }
  }

  return counts
}

export async function POST(req: NextRequest) {
  const expected = process.env.INBOX_SHARED_SECRET
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'inbox auth not configured' }, { status: 500 })
  }
  const provided = req.headers.get('x-inbox-secret') ?? ''
  if (!provided || !secretMatches(provided, expected)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const uid = process.env.TRANSCRIPT_WEBHOOK_UID
  if (!uid) {
    return NextResponse.json({ ok: false, error: 'TRANSCRIPT_WEBHOOK_UID not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const dry = url.searchParams.get('dry') === '1'

  const db = await getAdminDb()

  try {
    const results = await Promise.all([
      drainQueuedRouting(db, uid, expected, dry),
      drainPendingMeetings(db, uid, 'pending_deepops_meetings', 'armstrong', expected, dry),
      drainPendingMeetings(db, uid, 'pending_alamobernal_meetings', 'alamo-bernal', expected, dry),
    ])

    const totals = results.reduce(
      (acc, r) => ({
        found: acc.found + r.found,
        drained: acc.drained + r.drained,
        failed: acc.failed + r.failed,
        skipped: acc.skipped + r.skipped,
      }),
      { found: 0, drained: 0, failed: 0, skipped: 0 },
    )

    return NextResponse.json({
      ok: true,
      dry_run: dry,
      totals,
      results,
    })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: errMsg }, { status: 500 })
  }
}
