/**
 * Copenhagen kiteboarding wind forecast for a fixed trip window (Aug 7-10).
 *
 * Fetches hourly wind from Open-Meteo (free, no API key) for Amager Strandpark —
 * the central, most-consistent spot among Copenhagen's kite beaches — and scores
 * each daylight hour for kiteability. Open-Meteo only opens ~16 days out, so the
 * trip dates may not be in range yet; callers should handle a null day gracefully.
 */

const SPOT_LAT = 55.66
const SPOT_LON = 12.624
const TIMEZONE = 'Europe/Copenhagen'

export const TRIP_DATES = ['2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10'] as const

const DAY_START_HOUR = 7
const DAY_END_HOUR = 21

const MIN_RIDEABLE_KN = 12
const MIN_GOOD_KN = 16

export interface HourForecast {
  time: string
  hour: number
  speedKn: number
  gustKn: number
  directionDeg: number
}

export interface KiteWindow {
  startHour: number
  endHour: number
  avgSpeedKn: number
  maxGustKn: number
  directionLabel: string
}

export type DayVerdict = 'good' | 'marginal' | 'light' | 'unavailable'

export interface DayAnalysis {
  date: string
  verdict: DayVerdict
  window: KiteWindow | null
  peakSpeedKn: number
  avgSpeedKn: number
  hours: HourForecast[]
}

interface OpenMeteoResponse {
  hourly: {
    time: string[]
    wind_speed_10m: number[]
    wind_gusts_10m: number[]
    wind_direction_10m: number[]
  }
}

export function directionLabel(deg: number): string {
  const labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return labels[Math.round(deg / 22.5) % 16]
}

function findBestWindow(hours: HourForecast[]): KiteWindow | null {
  const rideable = hours.filter(h => h.speedKn >= MIN_RIDEABLE_KN)
  if (rideable.length === 0) return null

  let best: KiteWindow | null = null
  let run: HourForecast[] = []
  const flush = () => {
    for (let len = Math.min(4, run.length); len >= 2; len--) {
      for (let i = 0; i + len <= run.length; i++) {
        const slice = run.slice(i, i + len)
        const avg = slice.reduce((s, h) => s + h.speedKn, 0) / slice.length
        if (!best || avg > best.avgSpeedKn) {
          const mid = slice[Math.floor(slice.length / 2)]
          best = {
            startHour: slice[0].hour,
            endHour: slice[slice.length - 1].hour + 1,
            avgSpeedKn: Math.round(avg),
            maxGustKn: Math.round(Math.max(...slice.map(h => h.gustKn))),
            directionLabel: directionLabel(mid.directionDeg),
          }
        }
      }
    }
    run = []
  }
  for (const h of hours) {
    if (h.speedKn >= MIN_RIDEABLE_KN) run.push(h)
    else flush()
  }
  flush()
  return best
}

export async function fetchCopenhagenWind(): Promise<Map<string, HourForecast[]>> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${SPOT_LAT}&longitude=${SPOT_LON}` +
    `&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m` +
    `&wind_speed_unit=kn&timezone=${encodeURIComponent(TIMEZONE)}&forecast_days=16`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`)
  const data: OpenMeteoResponse = await res.json()

  const hoursByDate = new Map<string, HourForecast[]>()
  data.hourly.time.forEach((time, i) => {
    const [date, clock] = time.split('T')
    const hour = parseInt(clock.slice(0, 2), 10)
    const list = hoursByDate.get(date) ?? []
    list.push({
      time,
      hour,
      speedKn: data.hourly.wind_speed_10m[i],
      gustKn: data.hourly.wind_gusts_10m[i],
      directionDeg: data.hourly.wind_direction_10m[i],
    })
    hoursByDate.set(date, list)
  })
  return hoursByDate
}

export async function analyzeTripDates(): Promise<DayAnalysis[]> {
  const hoursByDate = await fetchCopenhagenWind()
  return TRIP_DATES.map((date) => {
    const allHours = hoursByDate.get(date)
    // Open-Meteo pads its nominal forecast_days window with null values once the
    // underlying model runs out of real data, so a present date key isn't enough —
    // require actual finite readings before treating the day as forecasted.
    const daylight = (allHours ?? []).filter(
      h => h.hour >= DAY_START_HOUR && h.hour <= DAY_END_HOUR && Number.isFinite(h.speedKn)
    )
    if (daylight.length === 0) {
      return { date, verdict: 'unavailable', window: null, peakSpeedKn: 0, avgSpeedKn: 0, hours: [] }
    }
    const peakSpeedKn = Math.round(Math.max(0, ...daylight.map(h => h.speedKn)))
    const avgSpeedKn = Math.round(daylight.reduce((s, h) => s + h.speedKn, 0) / daylight.length)
    const window = findBestWindow(daylight)
    const verdict: DayVerdict = !window ? 'light' : window.avgSpeedKn >= MIN_GOOD_KN ? 'good' : 'marginal'
    return { date, verdict, window, peakSpeedKn, avgSpeedKn, hours: daylight }
  })
}
