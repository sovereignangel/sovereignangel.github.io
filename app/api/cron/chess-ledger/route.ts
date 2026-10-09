/**
 * Chess Ledger Cron — a line of what Chess.com said, at noon and midnight New York.
 *
 * Vercel crons run in UTC and do not follow daylight saving, so vercel.json
 * fires this at 04, 05, 16 and 17 UTC and the route keeps only the two runs
 * that land on 00:00 or 12:00 in New York. The others return `skipped`.
 *
 * Idempotent: the document id is {date}-{slot}, so a retried run overwrites
 * its own line rather than adding a second one.
 *
 * Manual trigger: GET /api/cron/chess-ledger with Authorization: Bearer CRON_SECRET
 *   ?slot=noon|midnight  write now, as that slot, regardless of the hour
 *   &dry=1               build the line without writing it
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { fetchChessCom } from '@/lib/chess/chesscom'
import { buildLedgerEntry, nyClock, slotFor } from '@/lib/chess/ledger'
import type { ChessLedgerSlot } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const uid = process.env.FIREBASE_UID
  if (!uid) return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })

  const now = new Date()
  const forced = request.nextUrl.searchParams.get('slot') as ChessLedgerSlot | null
  const target = forced === 'noon' || forced === 'midnight'
    ? { slot: forced, date: forced === 'midnight' && nyClock(now).hour < 12 ? nyClock(new Date(now.getTime() - 12 * 3_600_000)).date : nyClock(now).date }
    : slotFor(now)
  if (!target) {
    return NextResponse.json({ success: true, skipped: true, newYork: nyClock(now) })
  }

  try {
    const snapshot = await fetchChessCom(undefined, true)
    if (!snapshot) return NextResponse.json({ success: false, error: 'Chess.com unreachable' }, { status: 502 })

    const entry = buildLedgerEntry(snapshot, target.date, target.slot, now)
    if (request.nextUrl.searchParams.get('dry') === '1') {
      return NextResponse.json({ success: true, dry: true, entry })
    }

    await adminDb
      .collection('users')
      .doc(uid)
      .collection('chess_ledger')
      .doc(`${entry.date}-${entry.slot}`)
      .set(entry)

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('[chess-ledger] Cron failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
