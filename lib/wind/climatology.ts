/**
 * Climatology over the recorded wind timeseries.
 *
 * Climatology is the statistics of what the wind has already done — base
 * rates, not a forecast. Three things we can compute once the archive has
 * some depth:
 *
 *   1. A wind rose: how often the wind blows from each direction and how hard,
 *      binned to 15 degrees so it is directly comparable with the Monciskes
 *      compass a local publishes from the same station.
 *   2. An hour-of-day profile: the sea-breeze build, which is what decides
 *      whether an afternoon session is worth planning around.
 *   3. Station bias against GFS, per direction. This is the one that earns
 *      its keep — it turns "the station and the forecast disagree" into a
 *      measured correction.
 *
 * All functions are pure so they can be reasoned about without Firestore.
 */

import type { WindSample } from './observations'

export const BIN_DEGREES = 15
export const BIN_COUNT = 360 / BIN_DEGREES

const COMPASS = [
  'N', 'NNE', 'NNE', 'NE', 'ENE', 'ENE', 'E', 'ESE', 'ESE', 'SE', 'SSE', 'SSE',
  'S', 'SSW', 'SSW', 'SW', 'WSW', 'WSW', 'W', 'WNW', 'WNW', 'NW', 'NNW', 'NNW',
]

/** Bin index (0-23) for a bearing, wrapping negatives and >360. */
export function binIndex(deg: number): number {
  const d = ((deg % 360) + 360) % 360
  return Math.floor(d / BIN_DEGREES) % BIN_COUNT
}

export function binLabel(index: number): string {
  return COMPASS[index % BIN_COUNT]
}

export interface RoseBin {
  deg: number
  dir: string
  n: number
  avgKn: number
  maxKn: number
}

export type RoseSource = 'station' | 'forecast'

function speedOf(s: WindSample, source: RoseSource): number | null {
  return source === 'station' ? s.sKn : s.fKn
}

function dirOf(s: WindSample, source: RoseSource): number | null {
  return source === 'station' ? s.sDir : s.fDir
}

/** Wind rose: count, mean and peak speed per 15-degree bin. */
export function buildWindRose(samples: WindSample[], source: RoseSource): RoseBin[] {
  const bins = Array.from({ length: BIN_COUNT }, (_, i) => ({
    deg: i * BIN_DEGREES,
    dir: binLabel(i),
    n: 0,
    sum: 0,
    maxKn: 0,
  }))
  for (const s of samples) {
    const kn = speedOf(s, source)
    const deg = dirOf(s, source)
    if (kn == null || deg == null) continue
    const b = bins[binIndex(deg)]
    b.n += 1
    b.sum += kn
    if (kn > b.maxKn) b.maxKn = kn
  }
  return bins.map((b) => ({
    deg: b.deg,
    dir: b.dir,
    n: b.n,
    avgKn: b.n ? Math.round((b.sum / b.n) * 10) / 10 : 0,
    maxKn: Math.round(b.maxKn * 10) / 10,
  }))
}

export interface HourBin {
  hour: number
  n: number
  avgKn: number
  maxKn: number
}

/** Mean and peak wind by hour of day — the sea-breeze curve. */
export function buildHourProfile(
  entries: { hour: number; sample: WindSample }[],
  source: RoseSource
): HourBin[] {
  const acc = new Map<number, { n: number; sum: number; max: number }>()
  for (const { hour, sample } of entries) {
    const kn = speedOf(sample, source)
    if (kn == null) continue
    const a = acc.get(hour) ?? { n: 0, sum: 0, max: 0 }
    a.n += 1
    a.sum += kn
    if (kn > a.max) a.max = kn
    acc.set(hour, a)
  }
  return [...acc.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, a]) => ({
      hour,
      n: a.n,
      avgKn: Math.round((a.sum / a.n) * 10) / 10,
      maxKn: Math.round(a.max * 10) / 10,
    }))
}

export interface BiasBin {
  deg: number
  dir: string
  n: number
  /** Mean of (station - forecast) in knots. Positive = station reads stronger. */
  meanDeltaKn: number
  meanStationKn: number
  meanForecastKn: number
}

export interface StationBias {
  /** Paired samples where both the station and the forecast reported */
  n: number
  overallDeltaKn: number
  /** Mean absolute difference — how far apart the two numbers typically are */
  meanAbsDeltaKn: number
  bins: BiasBin[]
}

/**
 * Station minus forecast, overall and per forecast-direction bin.
 *
 * Binned on the FORECAST direction deliberately: the correction has to be
 * applied when all we have is a forecast, so it must be keyed by something
 * knowable in advance.
 */
export function buildStationBias(samples: WindSample[]): StationBias {
  const bins = Array.from({ length: BIN_COUNT }, (_, i) => ({
    deg: i * BIN_DEGREES,
    dir: binLabel(i),
    n: 0,
    dSum: 0,
    sSum: 0,
    fSum: 0,
  }))
  let n = 0
  let dSum = 0
  let absSum = 0
  for (const s of samples) {
    if (s.sKn == null || s.fKn == null || s.fDir == null) continue
    const delta = s.sKn - s.fKn
    n += 1
    dSum += delta
    absSum += Math.abs(delta)
    const b = bins[binIndex(s.fDir)]
    b.n += 1
    b.dSum += delta
    b.sSum += s.sKn
    b.fSum += s.fKn
  }
  const r1 = (x: number) => Math.round(x * 10) / 10
  return {
    n,
    overallDeltaKn: n ? r1(dSum / n) : 0,
    meanAbsDeltaKn: n ? r1(absSum / n) : 0,
    bins: bins.map((b) => ({
      deg: b.deg,
      dir: b.dir,
      n: b.n,
      meanDeltaKn: b.n ? r1(b.dSum / b.n) : 0,
      meanStationKn: b.n ? r1(b.sSum / b.n) : 0,
      meanForecastKn: b.n ? r1(b.fSum / b.n) : 0,
    })),
  }
}
