/**
 * Lithuanian coast kite wind forecast — Svencele, Nida, Sventoji.
 *
 * Fetches hourly wind from Open-Meteo (free, no API key) for each spot,
 * classifies every daylight hour against a progressing rider's target band
 * (12-20 kn, not yet independent), and finds the best contiguous session
 * window per spot per day.
 *
 * Spot geography:
 *   - Svencele: east shore of the Curonian Lagoon, water to the WEST.
 *     Shallow standing-depth flat water — the beginner spot. W/SW onshore.
 *   - Nida: lagoon side of the Curonian Spit, water to the EAST.
 *     E/SE winds blow across the lagoon onto the beach. W winds are offshore
 *     (blowing off the spit), though the lagoon's far shore is ~10 km away.
 *   - Sventoji: open Baltic beach north of Palanga, facing WEST.
 *     W/SW/NW onshore. E winds are offshore into open sea — never ride.
 */

// Rider profile: still building independence — target 12-20 kn, cap gusts
const MIN_WIND_KN = 12
const MAX_WIND_KN = 20
const MAX_GUST_KN = 26
const LIGHT_WIND_KN = 9 // below this the hour is dead calm for kiting

const TIMEZONE = 'Europe/Vilnius'
const DAY_START_HOUR = 8
const FALLBACK_END_HOUR = 20
const MAX_END_HOUR = 21

export interface KiteSpot {
  slug: string
  name: string
  area: string
  lat: number
  lon: number
  water: 'lagoon' | 'baltic'
  /** Wind FROM these bearings blows land-to-water (offshore) — do not ride */
  offshoreSector: [number, number]
  /** Wind FROM these bearings blows water-to-land (onshore / side-onshore) */
  onshoreSector: [number, number]
  note: string
}

export const LITHUANIA_SPOTS: KiteSpot[] = [
  {
    slug: 'svencele',
    name: 'Svencele',
    area: 'Curonian Lagoon · east shore',
    lat: 55.3236,
    lon: 21.2447,
    water: 'lagoon',
    offshoreSector: [20, 140],
    onshoreSector: [200, 320],
    note: 'Waist-deep flat water — safest spot for progression. Best in W/SW.',
  },
  {
    slug: 'nida',
    name: 'Nida',
    area: 'Curonian Spit · lagoon side',
    lat: 55.308,
    lon: 21.021,
    water: 'lagoon',
    offshoreSector: [230, 340],
    onshoreSector: [50, 170],
    note: 'Lagoon beach east of town. Works in E/SE; W blows off the spit.',
  },
  {
    slug: 'sventoji',
    name: 'Sventoji',
    area: 'Baltic coast · open sea',
    lat: 56.027,
    lon: 21.074,
    water: 'baltic',
    offshoreSector: [40, 140],
    onshoreSector: [200, 340],
    note: 'Open-sea beach with waves and chop. Only ride onshore W/SW/NW.',
  },
]

export interface HourForecast {
  time: string // ISO local, e.g. 2026-08-10T13:00
  hour: number
  speedKn: number
  gustKn: number
  directionDeg: number
}

export type HourCategory = 'ideal' | 'light' | 'calm' | 'strong' | 'offshore'

export interface KiteWindow {
  startHour: number
  endHour: number // exclusive
  avgSpeedKn: number
  maxGustKn: number
  directionDeg: number
  directionLabel: string
}

export type DayVerdict = 'good' | 'light' | 'calm' | 'strong' | 'offshore'

export interface DayAnalysis {
  date: string // YYYY-MM-DD
  verdict: DayVerdict
  window: KiteWindow | null
  peakSpeedKn: number
  hours: HourForecast[] // daylight hours only, in order
  endHour: number // session cutoff (sunset-capped)
  note: string
}

export interface SpotForecast {
  spot: KiteSpot
  days: DayAnalysis[]
}

function inSector(deg: number, [from, to]: [number, number]): boolean {
  const d = ((deg % 360) + 360) % 360
  return from <= to ? d >= from && d <= to : d >= from || d <= to
}

export function directionLabel(deg: number, spot: KiteSpot): string {
  const labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const label = labels[Math.round(deg / 22.5) % 16]
  if (inSector(deg, spot.offshoreSector)) return `${label} offshore`
  if (inSector(deg, spot.onshoreSector)) return `${label} onshore`
  return `${label} cross`
}

export function kiteSizeHint(avgSpeedKn: number): string {
  if (avgSpeedKn < 14) return '12m'
  if (avgSpeedKn < 17) return '10-12m'
  return '9-10m'
}

export function categorizeHour(h: HourForecast, spot: KiteSpot): HourCategory {
  const windy = h.speedKn >= LIGHT_WIND_KN
  if (windy && inSector(h.directionDeg, spot.offshoreSector)) return 'offshore'
  if (h.speedKn > MAX_WIND_KN || h.gustKn > MAX_GUST_KN) return 'strong'
  if (h.speedKn >= MIN_WIND_KN) return 'ideal'
  if (windy) return 'light'
  return 'calm'
}

/** Best contiguous run of >= 2 'ideal' hours; best = mean wind closest to 16 kn. */
function findBestWindow(daylight: HourForecast[], spot: KiteSpot): KiteWindow | null {
  const SWEET_SPOT_KN = 16
  let best: KiteWindow | null = null
  let bestScore = -Infinity

  let run: HourForecast[] = []
  const flush = () => {
    for (let len = Math.min(4, run.length); len >= 2; len--) {
      for (let i = 0; i + len <= run.length; i++) {
        const slice = run.slice(i, i + len)
        const avg = slice.reduce((s, h) => s + h.speedKn, 0) / slice.length
        // Prefer longer windows, then wind nearest the sweet spot
        const score = len * 10 - Math.abs(avg - SWEET_SPOT_KN)
        if (score > bestScore) {
          bestScore = score
          const mid = slice[Math.floor(slice.length / 2)]
          best = {
            startHour: slice[0].hour,
            endHour: slice[slice.length - 1].hour + 1,
            avgSpeedKn: Math.round(avg),
            maxGustKn: Math.round(Math.max(...slice.map(h => h.gustKn))),
            directionDeg: mid.directionDeg,
            directionLabel: directionLabel(mid.directionDeg, spot),
          }
        }
      }
    }
    run = []
  }

  for (const h of daylight) {
    if (categorizeHour(h, spot) === 'ideal') run.push(h)
    else flush()
  }
  flush()
  return best
}

export function analyzeDay(
  date: string,
  allHours: HourForecast[],
  spot: KiteSpot,
  sunset: string | null
): DayAnalysis {
  const sunsetHour = sunset ? parseInt(sunset.slice(0, 2), 10) : null
  const endHour = sunsetHour ? Math.min(MAX_END_HOUR, sunsetHour) : FALLBACK_END_HOUR
  const daylight = allHours.filter(h => h.hour >= DAY_START_HOUR && h.hour < endHour)
  const peakSpeedKn = Math.round(Math.max(0, ...daylight.map(h => h.speedKn)))
  const window = findBestWindow(daylight, spot)

  if (window) {
    return {
      date,
      verdict: 'good',
      window,
      peakSpeedKn,
      hours: daylight,
      endHour,
      note: `${window.avgSpeedKn} kn ${window.directionLabel} — kite ${kiteSizeHint(window.avgSpeedKn)}`,
    }
  }

  const categories = daylight.map(h => categorizeHour(h, spot))
  const count = (c: HourCategory) => categories.filter(x => x === c).length

  if (count('offshore') >= 2 && count('offshore') >= count('strong')) {
    return { date, verdict: 'offshore', window: null, peakSpeedKn, hours: daylight, endHour, note: 'offshore wind — do not ride here' }
  }
  if (count('strong') >= 2) {
    return { date, verdict: 'strong', window: null, peakSpeedKn, hours: daylight, endHour, note: `above your 20 kn cap (peak ${peakSpeedKn} kn)` }
  }
  if (count('light') >= 2 || count('ideal') === 1) {
    return { date, verdict: 'light', window: null, peakSpeedKn, hours: daylight, endHour, note: `no 2h window in your 12-20 kn range (peak ${peakSpeedKn} kn) — big-kite drills only` }
  }
  return { date, verdict: 'calm', window: null, peakSpeedKn, hours: daylight, endHour, note: `no wind (peak ${peakSpeedKn} kn)` }
}

interface OpenMeteoResponse {
  hourly: {
    time: string[]
    wind_speed_10m: number[]
    wind_gusts_10m: number[]
    wind_direction_10m: number[]
  }
  daily: {
    time: string[]
    sunset: string[]
  }
}

export async function fetchSpotForecast(spot: KiteSpot): Promise<SpotForecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}` +
    `&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m&daily=sunset` +
    `&wind_speed_unit=kn&timezone=${encodeURIComponent(TIMEZONE)}&forecast_days=7`

  const res = await fetch(url, { next: { revalidate: 1800 } })
  if (!res.ok) throw new Error(`Open-Meteo request failed for ${spot.name}: ${res.status}`)
  const data: OpenMeteoResponse = await res.json()

  const hoursByDate = new Map<string, HourForecast[]>()
  data.hourly.time.forEach((time, i) => {
    const [date, clock] = time.split('T')
    const entry: HourForecast = {
      time,
      hour: parseInt(clock.slice(0, 2), 10),
      speedKn: data.hourly.wind_speed_10m[i],
      gustKn: data.hourly.wind_gusts_10m[i],
      directionDeg: data.hourly.wind_direction_10m[i],
    }
    const list = hoursByDate.get(date) ?? []
    list.push(entry)
    hoursByDate.set(date, list)
  })

  const sunsetByDate = new Map<string, string>()
  data.daily.time.forEach((date, i) => {
    const sunset = data.daily.sunset[i]
    if (sunset) sunsetByDate.set(date, sunset.split('T')[1] ?? '')
  })

  const days = Array.from(hoursByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hours]) => analyzeDay(date, hours, spot, sunsetByDate.get(date) ?? null))

  return { spot, days }
}

export async function fetchAllSpots(): Promise<SpotForecast[]> {
  return Promise.all(LITHUANIA_SPOTS.map(fetchSpotForecast))
}

export interface SessionPick {
  date: string
  spot: KiteSpot
  window: KiteWindow
}

/** All rideable sessions this week across spots, chronological, best spot first within a day. */
export function weekSessions(forecasts: SpotForecast[]): SessionPick[] {
  const picks: SessionPick[] = []
  for (const f of forecasts) {
    for (const day of f.days) {
      if (day.window) picks.push({ date: day.date, spot: f.spot, window: day.window })
    }
  }
  return picks.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    // Within a day, prefer the window nearest 16 kn; lagoon flat water breaks ties
    const score = (p: SessionPick) =>
      -Math.abs(p.window.avgSpeedKn - 16) + (p.spot.water === 'lagoon' ? 0.5 : 0)
    return score(b) - score(a)
  })
}
