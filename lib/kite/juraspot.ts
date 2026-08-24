/**
 * Live wind readings from the JuraSpot station (Monciskes, next to Sventoji).
 *
 * juraspot.lt has no data API — its Davis WeatherLink station publishes
 * fixed-layout 192x192 gauge GIFs rendered server-side. This module parses
 * them geometrically:
 *
 *   - Speed gauges (WindSpeed, 10MinAvgWindSpeed) draw a blue wedge on a
 *     180-degree dial anchored at pivot (96,107): 0 at the left horizontal,
 *     full scale at the right. The wedge's leading-edge angle maps linearly
 *     to the value. Calibrated against known readings (8.5 and 7.6 m/s);
 *     error is within ~0.06 m/s.
 *   - The dial auto-scales. The top-of-dial label is "5" (one glyph, ~6 px
 *     wide) on the 0-10 m/s scale and a two-digit label when rescaled; we
 *     detect the label width and assume 0-20 for two digits. Readings that
 *     would exceed 25 m/s are discarded as parse errors.
 *   - WindDirection draws a red needle from center (96,96); the farthest
 *     red pixel gives the bearing (N up).
 */

import { GifReader } from 'omggif'

const BASE = 'https://juraspot.lt/images'
const SIZE = 192
const PIVOT_X = 96
const PIVOT_Y = 107
const DIR_CX = 96
const DIR_CY = 96
const MS_TO_KN = 1.9438
// Leading-edge pixels sit ~half a pixel inside the true angle
const EDGE_CORRECTION_MS = 0.055

export interface JuraspotLive {
  /** Instantaneous wind, m/s (the "Wind Speed" gauge) */
  instMs: number
  /** 10-minute average wind, m/s */
  avgMs: number
  instKn: number
  avgKn: number
  /** Bearing the wind comes FROM, degrees (N = 0), null if needle not found */
  directionDeg: number | null
}

async function fetchGaugeRgba(name: string, fresh = false): Promise<Uint8Array | null> {
  try {
    const res = await fetch(
      `${BASE}/${name}.php`,
      fresh ? { cache: 'no-store' } : { next: { revalidate: 300 } }
    )
    if (!res.ok) return null
    const buf = new Uint8Array(await res.arrayBuffer())
    const gif = new GifReader(buf)
    if (gif.width !== SIZE || gif.height !== SIZE) return null
    const px = new Uint8Array(SIZE * SIZE * 4)
    gif.decodeAndBlitFrameRGBA(0, px)
    return px
  } catch {
    return null
  }
}

function at(px: Uint8Array, x: number, y: number): [number, number, number] {
  const i = (y * SIZE + x) * 4
  return [px[i], px[i + 1], px[i + 2]]
}

/** Dial full-scale value: "5" top label = 0-10 scale; a wider label = rescaled dial. */
function detectScale(px: Uint8Array): number {
  let minX = Infinity
  let maxX = -Infinity
  for (let y = 28; y <= 45; y++) {
    for (let x = 80; x <= 115; x++) {
      const [r, g, b] = at(px, x, y)
      if (r + g + b < 200) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
  }
  if (minX === Infinity) return 10
  return maxX - minX + 1 <= 8 ? 10 : 20
}

function wedgeValueMs(px: Uint8Array): number | null {
  let minAngle = Infinity
  let count = 0
  for (let y = 0; y < PIVOT_Y; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [r, g, b] = at(px, x, y)
      if (b > 150 && r < 100 && g < 100) {
        const dx = x - PIVOT_X
        const dy = PIVOT_Y - y
        if (Math.hypot(dx, dy) > 25) {
          count++
          const a = (Math.atan2(dy, dx) * 180) / Math.PI
          if (a < minAngle) minAngle = a
        }
      }
    }
  }
  if (count < 10) return 0 // no wedge drawn — calm
  const scale = detectScale(px)
  const value = ((180 - minAngle) / 180) * scale + EDGE_CORRECTION_MS * (scale / 10)
  if (value < 0 || value > 25) return null
  return Math.min(scale, value)
}

function needleBearing(px: Uint8Array): number | null {
  let bestDist = 0
  let bearing: number | null = null
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [r, g, b] = at(px, x, y)
      if (r > 150 && g < 90 && b < 90) {
        const dx = x - DIR_CX
        const dy = DIR_CY - y
        const d = Math.hypot(dx, dy)
        if (d > bestDist) {
          bestDist = d
          bearing = (90 - (Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
        }
      }
    }
  }
  return bestDist > 25 ? bearing : null
}

/**
 * @param fresh bypass the page-level 5-minute cache. The archive samples
 * hourly, so a cached gauge would record the wrong hour's wind; pages should
 * leave this off and keep the cache.
 */
export async function fetchJuraspotLive(fresh = false): Promise<JuraspotLive | null> {
  const [inst, avg, dir] = await Promise.all([
    fetchGaugeRgba('WindSpeed', fresh),
    fetchGaugeRgba('10MinAvgWindSpeed', fresh),
    fetchGaugeRgba('WindDirection', fresh),
  ])
  const instMs = inst ? wedgeValueMs(inst) : null
  const avgMs = avg ? wedgeValueMs(avg) : null
  if (instMs === null || avgMs === null) return null
  return {
    instMs: Math.round(instMs * 10) / 10,
    avgMs: Math.round(avgMs * 10) / 10,
    instKn: Math.round(instMs * MS_TO_KN * 10) / 10,
    avgKn: Math.round(avgMs * MS_TO_KN * 10) / 10,
    directionDeg: dir ? needleBearing(dir) : null,
  }
}
