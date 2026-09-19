/**
 * The owner's kite logbook, read-only and unauthenticated.
 *
 * The mastery tab used to be gated purely because the logbook lives at
 * `users/{uid}/...`, and a browser reading a user-scoped path has to be that
 * user. That made checking your own belts on a phone a sign-in, which is a
 * silly price for looking at your own hours.
 *
 * So reading moves to the server, where the Admin SDK holds the credentials
 * and the rider is fixed in config: anyone may look, nobody may edit. Every
 * write stays on the client SDK behind the same gate as before, so the only
 * thing this endpoint can do is tell you what the logbook already says.
 */

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { GARMIN_KITE_TYPES, mapGarminKiteDocs } from '@/lib/kite/garmin-sessions'
import type { KiteSession } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** The rider whose logbook this page shows. */
function ownerUid(): string | undefined {
  return process.env.FIREBASE_UID || process.env.TRANSCRIPT_WEBHOOK_UID
}

export async function GET() {
  const uid = ownerUid()
  if (!adminDb || !uid) {
    return NextResponse.json({ error: 'logbook not configured' }, { status: 503 })
  }

  try {
    const base = adminDb.collection('users').doc(uid)

    // Garmin is a bonus signal: if that read fails the logbook still stands on
    // its manual sessions, exactly as it does for a signed-in rider.
    const [sessionSnap, garminSnap, progressSnap] = await Promise.all([
      base.collection('kite_sessions').orderBy('date', 'asc').get(),
      base
        .collection('garmin_activities')
        .where('type', 'in', GARMIN_KITE_TYPES)
        .get()
        .catch(() => null),
      base.collection('kite_progress').doc('milestones').get(),
    ])

    const sessions = sessionSnap.docs.map(d => ({ ...(d.data() as Omit<KiteSession, 'id'>), id: d.id }))
    const garminSessions = garminSnap
      ? mapGarminKiteDocs(garminSnap.docs.map(d => ({ id: d.id, data: d.data() as Record<string, unknown> })))
      : []
    const progress = progressSnap.exists ? (progressSnap.data() as Record<string, unknown>) : {}

    return NextResponse.json({
      sessions,
      garminSessions,
      milestones: (progress.milestones as Record<string, boolean>) || {},
      targetSkill: (progress.targetSkill as string | null) ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'logbook read failed' }, { status: 500 })
  }
}
