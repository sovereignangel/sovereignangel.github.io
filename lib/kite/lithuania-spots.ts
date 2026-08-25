/**
 * Baltic coast kite wind — Sventoji, Svencele, Nida, Liepaja (LV).
 *
 * The forecast engine moved to `forecast.ts` and the spot lists to
 * `regions.ts` when the planner grew a second and third coast. This module
 * stays as the Lithuania-shaped door onto both, so the callers written when
 * Lithuania was the only region (/exec, the wind-observe cron, HourStrip)
 * keep working unchanged.
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

import {
  fetchSpots,
  fetchSpotForecast as fetchSpotForecastTz,
  fetchSpotHourly as fetchSpotHourlyTz,
  type HourForecast,
  type KiteSpot,
  type SpotForecast,
} from './forecast'
import { getRegion } from './regions'

export * from './forecast'

const LITHUANIA = getRegion('lithuania')

export const LITHUANIA_SPOTS: KiteSpot[] = LITHUANIA.spots

export function fetchSpotHourly(spot: KiteSpot): Promise<Map<string, HourForecast[]>> {
  return fetchSpotHourlyTz(spot, LITHUANIA.timezone)
}

export function fetchSpotForecast(spot: KiteSpot): Promise<SpotForecast> {
  return fetchSpotForecastTz(spot, LITHUANIA.timezone)
}

export function fetchAllSpots(): Promise<SpotForecast[]> {
  return fetchSpots(LITHUANIA.spots, LITHUANIA.timezone)
}
