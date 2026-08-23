/**
 * Climatology over the recorded wind archive.
 *
 *   GET /api/wind/climatology?from=2026-08-01&to=2026-08-31
 *
 * Defaults to the last 90 days. Returns the wind rose (station and forecast
 * side by side), the hour-of-day profile, and the measured station-vs-GFS
 * bias. Requires the cron secret — this is an inspection endpoint, not a
 * public feed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getObservationDays, flattenSamples, localDateHour } from '@/lib/wind/observations'
import { buildWindRose, buildHourProfile, buildStationBias } from '@/lib/wind/climatology'

export const runtime = 'nodejs'
export const maxDuration = 60

function shiftISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date: today } = localDateHour()
  const to = request.nextUrl.searchParams.get('to') ?? today
  const from = request.nextUrl.searchParams.get('from') ?? shiftISO(to, -90)

  try {
    const days = await getObservationDays(from, to)
    const entries = flattenSamples(days)
    const samples = entries.map((e) => e.sample)

    return NextResponse.json({
      success: true,
      range: { from, to },
      coverage: { days: days.length, samples: samples.length },
      rose: {
        station: buildWindRose(samples, 'station'),
        forecast: buildWindRose(samples, 'forecast'),
      },
      hourProfile: {
        station: buildHourProfile(entries, 'station'),
        forecast: buildHourProfile(entries, 'forecast'),
      },
      stationBias: buildStationBias(samples),
    })
  } catch (error) {
    console.error('[wind-climatology] failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
