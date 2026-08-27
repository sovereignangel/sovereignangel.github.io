/**
 * Last-good forecast store.
 *
 * Eleven Brazilian spots mean twenty-two Open-Meteo requests per revalidate,
 * and the page used to be all-or-nothing about them: one timeout or one rate
 * limit anywhere in that fan-out took the whole region down to an apology.
 * Worse, the apology rendered as a perfectly successful page, so ISR cached
 * it and the coast stayed unreachable for the full revalidate window even
 * after the upstream recovered.
 *
 * So: every spot is fetched independently, and any that fail fall back to the
 * last reading we successfully took for that spot. A spot keeps its own
 * savedAt, which means stale data is dated honestly rather than being
 * refreshed by its neighbours succeeding — and a spot that has been failing
 * for two days says two days, not two minutes.
 *
 * The snapshot lives in the root `wind_forecasts` collection, one document
 * per region, payload held as a JSON string. Firestore is optional here: with
 * no service account the store quietly does nothing and the page behaves
 * exactly as it did before.
 */

import { adminDb } from '../firebase-admin'
import { fetchSpotForecast, type SpotForecast } from './forecast'
import type { KiteRegion, RegionId } from './regions'

const COLLECTION = 'wind_forecasts'

/** One spot's last successful reading, with the time it was taken. */
interface StoredSpot {
  savedAt: string // ISO
  data: SpotForecast
}

type StoredSpots = Record<string, StoredSpot>

export interface ResolvedForecast {
  forecasts: SpotForecast[]
  /** Slugs served from the store because their live fetch failed */
  staleSlugs: string[]
  /** Oldest savedAt among the stale spots, ISO — null when everything is live */
  staleSince: string | null
}

async function readStore(regionId: RegionId): Promise<StoredSpots> {
  if (!adminDb) return {}
  try {
    const snap = await adminDb.collection(COLLECTION).doc(regionId).get()
    if (!snap.exists) return {}
    const json = snap.data()?.spots
    return typeof json === 'string' ? (JSON.parse(json) as StoredSpots) : {}
  } catch {
    // A cold store is a missing optimisation, never a broken page
    return {}
  }
}

async function writeStore(regionId: RegionId, spots: StoredSpots): Promise<void> {
  if (!adminDb) return
  try {
    await adminDb
      .collection(COLLECTION)
      .doc(regionId)
      .set({ spots: JSON.stringify(spots), updatedAt: new Date().toISOString() })
  } catch {
    // Losing a write costs the next outage its fallback, nothing more
  }
}

export async function resolveRegionForecast(region: KiteRegion): Promise<ResolvedForecast> {
  const settled = await Promise.allSettled(
    region.spots.map(spot => fetchSpotForecast(spot, region.timezone))
  )

  const live = new Map<string, SpotForecast>()
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') live.set(region.spots[i].slug, result.value)
  })

  const anyMissing = live.size < region.spots.length
  const stored = anyMissing ? await readStore(region.id) : {}

  const now = new Date().toISOString()
  const next: StoredSpots = {}
  const forecasts: SpotForecast[] = []
  const staleSlugs: string[] = []
  let staleSince: string | null = null

  for (const spot of region.spots) {
    const fresh = live.get(spot.slug)
    if (fresh) {
      forecasts.push(fresh)
      next[spot.slug] = { savedAt: now, data: fresh }
      continue
    }
    // Live fetch failed for this spot — keep showing what we last saw, and
    // carry its original timestamp forward so the age stays truthful.
    const kept = stored[spot.slug]
    if (!kept) continue
    forecasts.push(kept.data)
    next[spot.slug] = kept
    staleSlugs.push(spot.slug)
    if (!staleSince || kept.savedAt < staleSince) staleSince = kept.savedAt
  }

  if (live.size > 0) await writeStore(region.id, next)

  return { forecasts, staleSlugs, staleSince }
}
