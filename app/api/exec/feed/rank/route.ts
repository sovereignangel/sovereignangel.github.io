/**
 * Write a day's ranking from outside the machine that holds the secrets.
 *
 *   POST /api/exec/feed/rank
 *   Authorization: Bearer $CRON_SECRET
 *   { "day": "2026-09-20", "ranking": [{ "link": "…", "score": 78, "reason": "…" }] }
 *
 * This exists because the daily ranking is judgement work done by an agent in a
 * cloud session, and a cloud session has no .env.local — it cannot reach
 * Firestore directly. So it sends judgement over HTTP and the deployment, which
 * already holds the credentials, does the write.
 *
 * The endpoint re-fetches the candidate set itself rather than trusting the
 * caller for titles and dates: the request carries scores and reasons, the
 * feeds carry facts. That keeps a stale or malformed paste from rewriting the
 * archive, and means an unranked candidate is still filed as backlog on every
 * run — which is what makes the backlog complete rather than a list of things
 * someone remembered to add.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildCandidates, TIMEZONE_DAY } from '@/lib/exec/feed'
import { upsertEntries } from '@/lib/exec/feed-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface RankLine {
  link: string
  score: number
  reason?: string
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = process.env.TRANSCRIPT_WEBHOOK_UID || process.env.FIREBASE_UID
  if (!uid) return NextResponse.json({ error: 'UID not configured' }, { status: 500 })

  let body: { day?: string; ranking?: RankLine[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const ranking = Array.isArray(body.ranking) ? body.ranking : []
  const day = body.day || TIMEZONE_DAY()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: 'day must be YYYY-MM-DD' }, { status: 400 })
  }

  const byLink = new Map(ranking.filter((r) => r?.link).map((r) => [r.link, r]))

  try {
    const { items, unreachable } = await buildCandidates()

    // Everything held as backlog; only the ranked ones are stamped for the card.
    const ranked = items.filter((i) => byLink.has(i.link))
    const rest = items.filter((i) => !byLink.has(i.link))

    await upsertEntries(uid, rest, { surfacedOn: null })
    await upsertEntries(
      uid,
      ranked.map((i) => {
        const r = byLink.get(i.link)!
        return { ...i, score: r.score, reason: r.reason }
      }),
      { surfacedOn: day },
    )

    const missing = ranking.filter((r) => !items.some((i) => i.link === r.link)).map((r) => r.link)
    return NextResponse.json({
      ok: true,
      day,
      held: items.length,
      surfaced: ranked.length,
      missing,
      unreachable,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
