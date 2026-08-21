/**
 * Lithuanian coast kite wind forecast — Svencele, Nida, Sventoji.
 *
 * Fetches hourly wind from Open-Meteo (free, no API key) for each spot,
 * classifies every daylight hour against a progressing rider's target band
 * (12-30 kn, independent rider), and finds the best contiguous session
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

// Rider profile: independent rider — target 12-30 kn, cap gusts
const MIN_WIND_KN = 12
const MAX_WIND_KN = 30
const MAX_GUST_KN = 36
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
  /** Display datapoint: the direction the wind should TRAVEL at this spot */
  idealWind: string
  /** One-line character of the spot, shown under its name */
  tagline: string
  note: string
}

export const LITHUANIA_SPOTS: KiteSpot[] = [
  {
    slug: 'sventoji',
    name: 'Sventoji',
    area: 'Baltic coast · open sea',
    lat: 56.027,
    lon: 21.074,
    water: 'baltic',
    offshoreSector: [40, 140],
    onshoreSector: [200, 340],
    idealWind: 'wind travels east (W/SW/NW westerlies)',
    tagline: '15 min walk from home',
    note: 'Open-sea beach with waves and chop. E wind is offshore into open sea.',
  },
  {
    slug: 'svencele',
    name: 'Svencele',
    area: 'Curonian Lagoon · east shore',
    lat: 55.3236,
    lon: 21.2447,
    water: 'lagoon',
    offshoreSector: [20, 140],
    onshoreSector: [200, 320],
    idealWind: 'wind travels east (W/SW westerlies)',
    tagline: 'pro school · sponsored',
    note: 'Waist-deep flat water — safest spot for progression.',
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
    idealWind: 'wind travels west (E/SE easterlies)',
    tagline: 'the Hamptons of Lithuania',
    note: 'Lagoon beach east of town. W wind blows off the spit — never ride it.',
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
  /** Window per the ICON-based EU blend — a second opinion when models disagree */
  altWindow?: KiteWindow | null
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
  if (avgSpeedKn < 21) return '9-10m'
  if (avgSpeedKn < 26) return '7-9m'
  return '6-7m'
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
  // Include the sunset hour itself: sunset 20:59 means the 20:00-21:00 hour is ridable
  const sunsetHour = sunset ? parseInt(sunset.slice(0, 2), 10) : null
  const endHour = sunsetHour ? Math.min(MAX_END_HOUR, sunsetHour + 1) : FALLBACK_END_HOUR
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
    const peakGustKn = Math.round(Math.max(0, ...daylight.map(h => h.gustKn)))
    const note =
      peakSpeedKn > MAX_WIND_KN
        ? `above your ${MAX_WIND_KN} kn cap (peak ${peakSpeedKn} kn, gusts ${peakGustKn})`
        : `gusts above your ${MAX_GUST_KN} kn cap (wind ${peakSpeedKn} kn, gusts to ${peakGustKn})`
    return { date, verdict: 'strong', window: null, peakSpeedKn, hours: daylight, endHour, note }
  }
  if (count('light') >= 2 || count('ideal') === 1) {
    return { date, verdict: 'light', window: null, peakSpeedKn, hours: daylight, endHour, note: `no 2h window in your 12-30 kn range (peak ${peakSpeedKn} kn) — big-kite drills only` }
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

function parseHours(data: OpenMeteoResponse): Map<string, HourForecast[]> {
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
  return hoursByDate
}

export async function fetchSpotForecast(spot: KiteSpot): Promise<SpotForecast> {
  const base =
    `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}` +
    `&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m` +
    `&wind_speed_unit=kn&timezone=${encodeURIComponent(TIMEZONE)}&forecast_days=7`

  // Primary: GFS 13 km — the model Windguru's headline table runs on, so the
  // dashboard tracks what local riders see there. Secondary: Open-Meteo's
  // best-match EU blend (ICON) as a cross-check when the models disagree.
  const [gfsRes, blendRes] = await Promise.all([
    fetch(`${base}&daily=sunset&models=gfs_seamless`, { next: { revalidate: 1800 } }),
    fetch(base, { next: { revalidate: 1800 } }),
  ])
  if (!gfsRes.ok) throw new Error(`Open-Meteo request failed for ${spot.name}: ${gfsRes.status}`)
  const data: OpenMeteoResponse = await gfsRes.json()

  const hoursByDate = parseHours(data)

  const sunsetByDate = new Map<string, string>()
  data.daily.time.forEach((date, i) => {
    const sunset = data.daily.sunset[i]
    if (sunset) sunsetByDate.set(date, sunset.split('T')[1] ?? '')
  })

  const days = Array.from(hoursByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hours]) => analyzeDay(date, hours, spot, sunsetByDate.get(date) ?? null))

  // Attach the EU-blend second opinion; the page surfaces it when GFS has no window
  if (blendRes.ok) {
    try {
      const blendData: OpenMeteoResponse = await blendRes.json()
      const blendHoursByDate = parseHours(blendData)
      for (const day of days) {
        const blendHours = blendHoursByDate.get(day.date)
        day.altWindow = blendHours
          ? analyzeDay(day.date, blendHours, spot, sunsetByDate.get(day.date) ?? null).window
          : null
      }
    } catch {
      // The second model is a bonus signal — ignore failures
    }
  }

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

/**
 * Days where GFS (the primary, Windguru's model) shows no window but the EU
 * blend does — "possible" sessions worth re-checking as the day approaches.
 */
export function weekPossibles(forecasts: SpotForecast[]): SessionPick[] {
  const picks: SessionPick[] = []
  for (const f of forecasts) {
    for (const day of f.days) {
      if (!day.window && day.altWindow) picks.push({ date: day.date, spot: f.spot, window: day.altWindow })
    }
  }
  return picks.sort(bySessionPriority)
}

/** All rideable sessions this week across spots, chronological, best spot first within a day. */
export function weekSessions(forecasts: SpotForecast[]): SessionPick[] {
  const picks: SessionPick[] = []
  for (const f of forecasts) {
    for (const day of f.days) {
      if (day.window) picks.push({ date: day.date, spot: f.spot, window: day.window })
    }
  }
  return picks.sort(bySessionPriority)
}

// Within a day: prefer the spot's ideal (onshore) wind direction, then spot
// priority — Svencele on stronger days (15+ kn), Sventoji on lighter days
// (under 15 kn), Nida deprioritized (hardest to get to; wins only when it is
// the only rideable spot) — then wind nearest 16 kn.
function bySessionPriority(a: SessionPick, b: SessionPick): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date)
  const score = (p: SessionPick) => {
    let s = -Math.abs(p.window.avgSpeedKn - 16)
    if (inSector(p.window.directionDeg, p.spot.onshoreSector)) s += 4
    if (p.spot.slug === 'svencele' && p.window.avgSpeedKn >= 15) s += 3
    if (p.spot.slug === 'sventoji' && p.window.avgSpeedKn < 15) s += 3
    if (p.spot.slug === 'nida') s -= 6
    return s
  }
  return score(b) - score(a)
}
