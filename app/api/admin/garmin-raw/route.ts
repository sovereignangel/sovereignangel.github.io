/**
 * Raw Garmin payload, for settling "the app says X but the dashboard says Y".
 *
 * The ETL stores a handful of fields out of a large response. When a number
 * looks wrong there are three possible culprits — Garmin's API, our field
 * mapping, or the app showing a different metric — and without the raw
 * response there is no way to tell which. This returns what Garmin actually
 * said, next to what we stored from it.
 *
 * GET /api/admin/garmin-raw?person=lori&date=2026-09-01
 * Auth: Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { athleteCredentials, athleteCollections } from '@/lib/lordas/athletes'
import { todayLocal } from '@/lib/ironman/plan'
import type { LordasPerson } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const GC = 'https://connectapi.garmin.com'

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const person = (request.nextUrl.searchParams.get('person') || 'lori') as LordasPerson
  const date = request.nextUrl.searchParams.get('date') || todayLocal()

  const creds = athleteCredentials(person)
  if (!creds) return NextResponse.json({ error: `no credentials for ${person}` }, { status: 400 })

  try {
    const { GarminConnect } = await import('garmin-connect')
    const { adminDb } = await import('@/lib/firebase-admin')
    const garmin = new GarminConnect({ username: creds.email, password: creds.password }) as any

    const tok = await adminDb.doc(creds.tokenDoc).get()
    const t = tok.exists ? (tok.data() as any) : null
    if (t?.oauth1 && t?.oauth2) garmin.loadToken(t.oauth1, t.oauth2)
    else await garmin.login()

    let sleep: any = null
    let sleepError: string | null = null
    try {
      sleep = await garmin.getSleepData(new Date(`${date}T00:00:00`))
    } catch (e) {
      sleepError = (e as Error).message
    }
    // The library helper is fragile; the raw endpoint is the fallback.
    if (!sleep) {
      try {
        const profile = await garmin.get(`${GC}/userprofile-service/socialProfile`)
        const name = profile?.displayName ?? profile?.userName ?? ''
        sleep = await garmin.get(
          `${GC}/wellness-service/wellness/dailySleepData/${name}?date=${date}&nonSleepBufferMinutes=60`
        )
      } catch (e) {
        sleepError = `${sleepError ?? ''} | raw: ${(e as Error).message}`
      }
    }

    const dto = sleep?.dailySleepDTO ?? {}
    const scores = dto.sleepScores ?? {}
    const cols = await athleteCollections(person)
    const storedSnap = await cols.metrics.doc(date).get()
    const stored = storedSnap.exists ? (storedSnap.data() as any) : null

    return NextResponse.json({
      person,
      requestedDate: date,
      garmin: {
        calendarDate: dto.calendarDate ?? null,
        overallScore: scores.overall?.value ?? null,
        overallQualifier: scores.overall?.qualifierKey ?? null,
        // Every sub-score Garmin returns, so a mismatched number can be
        // identified rather than guessed at.
        subScores: Object.fromEntries(
          Object.entries(scores).map(([k, v]: [string, any]) => [k, v?.value ?? v])
        ),
        stagesMin: {
          deep: Math.round((dto.deepSleepSeconds ?? 0) / 60),
          light: Math.round((dto.lightSleepSeconds ?? 0) / 60),
          rem: Math.round((dto.remSleepSeconds ?? 0) / 60),
          awake: Math.round((dto.awakeSleepSeconds ?? 0) / 60),
          total: Math.round((dto.sleepTimeSeconds ?? 0) / 60),
        },
        startLocal: dto.sleepStartTimestampLocal ?? null,
        endLocal: dto.sleepEndTimestampLocal ?? null,
        avgOvernightHrv: sleep?.avgOvernightHrv ?? null,
        error: sleepError,
      },
      stored: stored
        ? {
            sleepScore: stored.sleepScore ?? null,
            deepSleepMinutes: stored.deepSleepMinutes ?? null,
            lightSleepMinutes: stored.lightSleepMinutes ?? null,
            remSleepMinutes: stored.remSleepMinutes ?? null,
            awakeMinutes: stored.awakeMinutes ?? null,
            hrvRmssd: stored.hrvRmssd ?? null,
            restingHeartRate: stored.restingHeartRate ?? null,
            syncedAt: stored.syncedAt?.toDate?.()?.toISOString() ?? null,
          }
        : null,
      matches: stored ? (scores.overall?.value ?? null) === (stored.sleepScore ?? null) : null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
