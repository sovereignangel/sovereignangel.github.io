/**
 * Wind Observe Cron — hourly station + forecast snapshot for Sventoji.
 *
 * Runs every hour via vercel.json and records one sample per daylight hour,
 * building the timeseries that /wind's climatology and the station-vs-GFS
 * bias correction are computed from.
 *
 * The JuraSpot gauges are a live scrape with no history behind them, so this
 * archive can only ever start from the moment it is switched on — every hour
 * not collected is gone. The forecast half could be backfilled from
 * Open-Meteo's archive later if we ever want to extend it backwards.
 *
 * Skips silently outside the daylight band rather than relying on a
 * DST-sensitive UTC cron window, so the local hour is always correct.
 *
 * Manual trigger: GET /api/cron/wind-observe with Authorization: Bearer CRON_SECRET
 * Dry run (no write): add ?dry=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchJuraspotLive } from '@/lib/kite/juraspot'
import { fetchSpotForecast, LITHUANIA_SPOTS } from '@/lib/kite/lithuania-spots'
import {
  localDateHour,
  recordSample,
  OBS_START_HOUR,
  OBS_END_HOUR,
  OBS_SPOT,
  type WindSample,
} from '@/lib/wind/observations'

export const runtime = 'nodejs'
export const maxDuration = 60

const r1 = (x: number) => Math.round(x * 10) / 10

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dry = request.nextUrl.searchParams.get('dry') === '1'
  const { date, hour: nowHour } = localDateHour()

  // Dry runs may probe a specific hour so the pairing can be exercised
  // outside daylight. Never available on a write path.
  const probe = dry ? Number(request.nextUrl.searchParams.get('hour')) : NaN
  const hour = Number.isInteger(probe) && probe >= 0 && probe <= 23 ? probe : nowHour

  if (hour < OBS_START_HOUR || hour > OBS_END_HOUR) {
    return NextResponse.json({ success: true, skipped: 'outside daylight band', date, hour })
  }

  const spot = LITHUANIA_SPOTS.find((s) => s.slug === OBS_SPOT)
  if (!spot) {
    return NextResponse.json({ success: false, error: `unknown spot ${OBS_SPOT}` }, { status: 500 })
  }

  try {
    // Independent sources: one failing should not cost us the other half
    const [station, forecast] = await Promise.all([
      fetchJuraspotLive().catch(() => null),
      fetchSpotForecast(spot).catch(() => null),
    ])

    const fHour = forecast?.days.find((d) => d.date === date)?.hours.find((h) => h.hour === hour) ?? null

    const sample: WindSample = {
      sKn: station ? r1(station.avgKn) : null,
      sInstKn: station ? r1(station.instKn) : null,
      sDir: station?.directionDeg != null ? Math.round(station.directionDeg) : null,
      fKn: fHour ? r1(fHour.speedKn) : null,
      fGustKn: fHour ? r1(fHour.gustKn) : null,
      fDir: fHour ? Math.round(fHour.directionDeg) : null,
    }

    // Nothing measured and nothing forecast — write nothing rather than a hole
    if (sample.sKn == null && sample.fKn == null) {
      return NextResponse.json(
        { success: false, error: 'both station and forecast unavailable', date, hour },
        { status: 502 }
      )
    }

    if (dry) {
      return NextResponse.json({ success: true, dry: true, date, hour, probed: hour !== nowHour, sample })
    }

    await recordSample(date, hour, sample)
    return NextResponse.json({ success: true, date, hour, sample })
  } catch (error) {
    console.error('[wind-observe] Cron failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
