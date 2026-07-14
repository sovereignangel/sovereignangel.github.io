/**
 * Palanga kiteboarding wind forecast.
 *
 * Fetches hourly wind from Open-Meteo (free, no API key) for Palanga, Lithuania,
 * scores each daylight hour for kiteability, and finds the best contiguous
 * 2-3 hour session window per day.
 *
 * Palanga beach faces west (coastline runs N-S, Baltic Sea to the west):
 *   - W / SW / NW winds (200-340 deg) are onshore to side-onshore — ideal
 *   - N / S winds are cross-shore — rideable
 *   - E winds (40-140 deg) are offshore — dangerous, never ride
 */

const PALANGA_LAT = 55.9175
const PALANGA_LON = 21.0686
const TIMEZONE = 'Europe/Vilnius'

// Session-viable hours (local): daylight with rescue/foot traffic around
const DAY_START_HOUR = 8
const DAY_END_HOUR = 21

// Rideability thresholds (knots) for an intermediate twin-tip rider
const MIN_WIND_KN = 11
const MAX_WIND_KN = 30
const MAX_GUST_KN = 38

export interface HourForecast {
  time: string // ISO local time e.g. 2026-07-14T13:00
  hour: number
  speedKn: number
  gustKn: number
  directionDeg: number
}

export interface KiteWindow {
  startHour: number
  endHour: number // exclusive
  avgSpeedKn: number
  maxGustKn: number
  directionDeg: number
  directionLabel: string
}

export type DayVerdict = 'good' | 'marginal' | 'no_wind' | 'offshore'

export interface DayAnalysis {
  date: string // YYYY-MM-DD
  verdict: DayVerdict
  window: KiteWindow | null
  peakSpeedKn: number
  note: string
}

interface OpenMeteoResponse {
  hourly: {
    time: string[]
    wind_speed_10m: number[]
    wind_gusts_10m: number[]
    wind_direction_10m: number[]
  }
}

export function isOffshore(deg: number): boolean {
  return deg >= 40 && deg <= 140
}

export function directionLabel(deg: number): string {
  const labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const label = labels[Math.round(deg / 22.5) % 16]
  if (isOffshore(deg)) return `${label} offshore`
  if (deg >= 200 && deg <= 340) return `${label} onshore`
  return `${label} cross`
}

export function kiteSizeHint(avgSpeedKn: number): string {
  if (avgSpeedKn < 13) return '12m+, light-wind session'
  if (avgSpeedKn < 17) return '10-12m'
  if (avgSpeedKn < 22) return '9-10m'
  if (avgSpeedKn < 27) return '7-9m'
  return '7m or smaller — strong, be careful'
}

function isRideableHour(h: HourForecast): boolean {
  return (
    h.speedKn >= MIN_WIND_KN &&
    h.speedKn <= MAX_WIND_KN &&
    h.gustKn <= MAX_GUST_KN &&
    !isOffshore(h.directionDeg)
  )
}

/** Find the best contiguous rideable window of >= 2 hours (best = highest mean wind). */
export function findBestWindow(hours: HourForecast[]): KiteWindow | null {
  const daylight = hours.filter(h => h.hour >= DAY_START_HOUR && h.hour < DAY_END_HOUR)
  let best: KiteWindow | null = null

  let run: HourForecast[] = []
  const flush = () => {
    // Within a rideable run, evaluate every 2-4h sub-window and keep the windiest
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
            directionDeg: mid.directionDeg,
            directionLabel: directionLabel(mid.directionDeg),
          }
        }
      }
    }
    run = []
  }

  for (const h of daylight) {
    if (isRideableHour(h)) run.push(h)
    else flush()
  }
  flush()
  return best
}

export function analyzeDay(date: string, hours: HourForecast[]): DayAnalysis {
  const daylight = hours.filter(h => h.hour >= DAY_START_HOUR && h.hour < DAY_END_HOUR)
  const peakSpeedKn = Math.round(Math.max(0, ...daylight.map(h => h.speedKn)))
  const window = findBestWindow(hours)

  if (window) {
    const verdict: DayVerdict = window.avgSpeedKn >= 14 ? 'good' : 'marginal'
    const note = verdict === 'good' ? 'solid session' : 'light — big kite, work upwind drills'
    return { date, verdict, window, peakSpeedKn, note }
  }

  // No window — figure out why
  const windyHours = daylight.filter(h => h.speedKn >= MIN_WIND_KN)
  const offshoreWindy = windyHours.filter(h => isOffshore(h.directionDeg))
  if (windyHours.length > 0 && offshoreWindy.length >= windyHours.length / 2) {
    return { date, verdict: 'offshore', window: null, peakSpeedKn, note: 'offshore E wind — do not ride' }
  }
  if (windyHours.some(h => h.speedKn > MAX_WIND_KN || h.gustKn > MAX_GUST_KN)) {
    return { date, verdict: 'no_wind', window: null, peakSpeedKn, note: 'too strong / gusty — stay on the beach' }
  }
  return { date, verdict: 'no_wind', window: null, peakSpeedKn, note: `light (peak ${peakSpeedKn} kn) — kite-flying or land drills` }
}

export async function fetchPalangaForecast(): Promise<Map<string, HourForecast[]>> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${PALANGA_LAT}&longitude=${PALANGA_LON}` +
    `&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m` +
    `&wind_speed_unit=kn&timezone=${encodeURIComponent(TIMEZONE)}&forecast_days=8`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`)
  const data: OpenMeteoResponse = await res.json()

  const byDate = new Map<string, HourForecast[]>()
  data.hourly.time.forEach((time, i) => {
    const [date, clock] = time.split('T')
    const hour = parseInt(clock.slice(0, 2), 10)
    const entry: HourForecast = {
      time,
      hour,
      speedKn: data.hourly.wind_speed_10m[i],
      gustKn: data.hourly.wind_gusts_10m[i],
      directionDeg: data.hourly.wind_direction_10m[i],
    }
    const list = byDate.get(date) ?? []
    list.push(entry)
    byDate.set(date, list)
  })
  return byDate
}

export async function analyzePalangaWeek(): Promise<DayAnalysis[]> {
  const byDate = await fetchPalangaForecast()
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hours]) => analyzeDay(date, hours))
}

function fmtDay(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TIMEZONE })
}

function fmtWindow(w: KiteWindow): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(w.startHour)}:00-${pad(w.endHour)}:00`
}

const VERDICT_TAG: Record<DayVerdict, string> = {
  good: 'GOOD',
  marginal: 'MARGINAL',
  no_wind: 'NO WIND',
  offshore: 'OFFSHORE',
}

/** Telegram-ready Markdown message: today's verdict + week outlook. */
export function formatKiteMessage(days: DayAnalysis[]): string {
  const [today, ...rest] = days
  const lines: string[] = []

  lines.push(`*Kite Wind — Palanga* · ${fmtDay(today.date)}`)
  lines.push('')

  if (today.window) {
    lines.push(`*Today: ${VERDICT_TAG[today.verdict]}* — ride ${fmtWindow(today.window)}`)
    lines.push(`${today.window.avgSpeedKn} kn avg · gusts ${today.window.maxGustKn} kn · ${today.window.directionLabel}`)
    lines.push(`Kite: ${kiteSizeHint(today.window.avgSpeedKn)}`)
  } else {
    lines.push(`*Today: ${VERDICT_TAG[today.verdict]}* — ${today.note}`)
  }

  lines.push('')
  lines.push('*Week ahead:*')
  for (const day of rest) {
    if (day.window) {
      lines.push(`${fmtDay(day.date)} · ${VERDICT_TAG[day.verdict]} · ${fmtWindow(day.window)} · ${day.window.avgSpeedKn} kn ${day.window.directionLabel}`)
    } else {
      lines.push(`${fmtDay(day.date)} · ${VERDICT_TAG[day.verdict]} · ${day.note}`)
    }
  }

  const goodDays = days.filter(d => d.verdict === 'good').length
  lines.push('')
  lines.push(`${goodDays}/${days.length} good days this week. Log every session in Surfr.`)

  return lines.join('\n')
}
