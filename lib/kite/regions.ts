/**
 * The seasonal rotation — three home coasts, one per season, each with its
 * own spot list, timezone and local rules.
 *
 *   Lithuania  summer        Baltic coast and the Curonian Lagoon
 *   NYC        fall & spring Sandy Hook and Plumb Beach
 *   Brazil     winter        the Ceara downwinder coast, Fortaleza to Atins
 *
 * The rider's rules do not change with the region: 12-30 kn, gusts under 36,
 * onshore or cross only, a two-hour window minimum. Only the geography moves.
 */

import { fetchSpots, type KiteSpot, type SpotForecast } from './forecast'

export type RegionId = 'lithuania' | 'nyc' | 'brazil'
export type SeasonId = 'summer' | 'shoulder' | 'winter'

export interface KiteRegion {
  id: RegionId
  /** Full name for the page heading */
  name: string
  /** Short name for the tab */
  short: string
  /** Even shorter, for narrow screens */
  abbr: string
  href: string
  season: SeasonId
  seasonLabel: string
  months: string
  /** Months (1-12) this leg of the rotation is actually in season */
  activeMonths: number[]
  timezone: string
  /** Suffix shown next to the generated-at clock */
  clockLabel: string
  tagline: string
  spots: KiteSpot[]
}

// ─── Lithuania · summer ───────────────────────────────────────
// Sventoji on lighter days (a 15 minute walk), Svencele when it blows
// (waist-deep flat water), Liepaja an hour north, Nida hardest to reach.

const LITHUANIA_SPOT_LIST: KiteSpot[] = [
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
    favorWhen: { maxKn: 14, bonus: 3 },
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
    favorWhen: { minKn: 15, bonus: 3 },
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
    priority: -6,
  },
  {
    slug: 'liepaja',
    name: 'Liepaja',
    area: 'Latvia · open Baltic',
    lat: 56.5099,
    lon: 20.9986,
    water: 'baltic',
    offshoreSector: [40, 140],
    onshoreSector: [200, 340],
    idealWind: 'wind travels east (W/SW/NW westerlies)',
    tagline: 'where the wind is born',
    note: 'Wide west-facing city beach an hour north, in Latvia. Waves and chop; E wind is offshore into open sea.',
    priority: -4,
  },
]

// ─── New York · fall & spring ─────────────────────────────────
// The shoulder seasons are the season here: cold fronts behind a low give
// the strongest, cleanest wind of the whole rotation. This is where the
// big-air numbers get set.

const NYC_SPOT_LIST: KiteSpot[] = [
  {
    slug: 'plumb-beach',
    name: 'Plumb Beach',
    area: 'Brooklyn · Rockaway Inlet',
    lat: 40.5836,
    lon: -73.926,
    water: 'bay',
    // Water lies south. N/NE blows straight off Brooklyn into the open inlet.
    offshoreSector: [340, 60],
    onshoreSector: [130, 250],
    idealWind: 'wind travels north (S/SW/SE onshore)',
    tagline: '25 min from the city',
    note: 'Shallow, flat and protected on a low tide — the everyday spot, off the Belt Parkway. SW is the reliable thermal. NW is side-offshore but the Rockaway peninsula sits about 2 km downwind as a backstop: ride it with someone on the beach, never solo. Check the tide before you drive.',
    priority: 1,
    favorWhen: { maxKn: 20, bonus: 3 },
  },
  {
    slug: 'sandy-hook',
    name: 'Sandy Hook',
    area: 'New Jersey · Sandy Hook Bay',
    lat: 40.43,
    lon: -74.009,
    water: 'bay',
    // Bay side of the spit, water to the west. E winds blow off the hook.
    offshoreSector: [40, 140],
    onshoreSector: [200, 340],
    idealWind: 'wind travels east (W/SW/NW westerlies)',
    tagline: 'the front-day spot',
    note: 'Bay side at Horseshoe Cove — deep water, real room, and where the post-frontal NW days get ridden. An hour from the city. On E/NE the bay side is offshore; cross to the ocean side at Gunnison instead, which turns those days back on.',
    favorWhen: { minKn: 18, bonus: 3 },
  },
]

// ─── Brazil · winter ──────────────────────────────────────────
// The Ceara coast runs east to west with the ocean to the north, so the
// E/ESE trades blow side-onshore down the whole length of it. Roughly 450 km
// of coastline from Fortaleza to Atins, ridden as day spots or as one long
// downwinder. Season runs strong from August into January.

function brazilSpot(
  s: Omit<KiteSpot, 'water' | 'offshoreSector' | 'onshoreSector' | 'idealWind'> &
    Partial<Pick<KiteSpot, 'water' | 'offshoreSector' | 'onshoreSector' | 'idealWind'>>
): KiteSpot {
  return {
    water: 'ocean',
    // North-facing coast: S/SW blows off the land, the E/ESE trades come in
    // side-onshore and run west down the beach.
    offshoreSector: [150, 230],
    onshoreSector: [20, 130],
    idealWind: 'wind travels west (E/ESE trades)',
    ...s,
  }
}

const BRAZIL_SPOT_LIST: KiteSpot[] = [
  brazilSpot({
    slug: 'fortaleza',
    name: 'Fortaleza',
    area: 'Ceara · Praia do Futuro',
    lat: -3.748,
    lon: -38.456,
    tagline: 'the city beach',
    note: 'Where you land. Choppy city water with barracas down the sand — fine for a first-day shakeout, not worth a day once you are up the coast.',
    priority: -2,
  }),
  brazilSpot({
    slug: 'cumbuco',
    name: 'Cumbuco',
    area: 'Ceara · 40 min from the airport',
    lat: -3.6167,
    lon: -38.7333,
    tagline: 'the first hub',
    note: 'Big beach, dependable trades, a lagoon behind the dunes for flat water. Busy and commercial, and the easiest possible landing after a flight.',
    priority: 1,
  }),
  brazilSpot({
    slug: 'taiba',
    name: 'Taiba',
    area: 'Ceara · 1h west of Cumbuco',
    lat: -3.5167,
    lon: -38.9167,
    tagline: 'quieter, windier',
    note: 'Cumbuco without the crowd, with a flat lagoon and an ocean beach that picks up a bit more wind. The first place the coast starts feeling like the real thing.',
  }),
  brazilSpot({
    slug: 'patos',
    name: 'Lago de Patos',
    area: 'Ceara · Itarema',
    lat: -2.9,
    lon: -39.8,
    water: 'lagoon',
    tagline: 'standing-depth flat',
    note: 'Fishing-village lagoon a few km east of Guajiru — waist-deep, butter flat, almost nobody on it. The single best water on the coast for drilling a new move.',
    priority: 1,
    favorWhen: { maxKn: 18, bonus: 3 },
  }),
  brazilSpot({
    slug: 'guajiru',
    name: 'Ilha do Guajiru',
    area: 'Ceara · Itarema',
    lat: -2.9333,
    lon: -39.75,
    water: 'lagoon',
    tagline: 'the flat-water name',
    note: 'A tidal lagoon that goes glass-flat and knee-deep, with an ocean beach on the far side. Freestyle water of a quality that barely exists anywhere else.',
    priority: 1,
    favorWhen: { maxKn: 18, bonus: 3 },
  }),
  brazilSpot({
    slug: 'prea',
    name: 'Prea',
    area: 'Ceara · 20 min east of Jeri',
    lat: -2.8333,
    lon: -40.45,
    tagline: 'the windiest of the lot',
    note: 'Long open beach that reliably reads a couple of knots above Jeri, with flat water inside the sandbar at low tide and rideable swell outside. The strong-day pick.',
    priority: 2,
    favorWhen: { minKn: 20, bonus: 3 },
  }),
  brazilSpot({
    slug: 'jeri',
    name: 'Jericoacoara',
    area: 'Ceara · the hub',
    lat: -2.7961,
    lon: -40.5136,
    tagline: 'sand streets, no cars',
    note: 'The base for everything west of Itarema. Waves off the main beach, flat water in the lagoons behind the dunes, and every downwinder shuttle leaves from here.',
    priority: 2,
    favorWhen: { minKn: 20, bonus: 3 },
  }),
  brazilSpot({
    slug: 'guriu',
    name: 'Guriu',
    area: 'Ceara · 12 km west of Jeri',
    lat: -2.8,
    lon: -40.6167,
    water: 'river',
    tagline: 'mangrove river mouth',
    note: 'A river through the mangroves that goes dead flat on the tide, reached by buggy or boat from Jeri. First stop on the classic downwinder west.',
    priority: -1,
  }),
  brazilSpot({
    slug: 'tatajuba',
    name: 'Tatajuba',
    area: 'Ceara · past Guriu',
    lat: -2.8333,
    lon: -40.7333,
    water: 'lagoon',
    tagline: 'dunes and a lagoon',
    note: 'A freshwater lagoon behind enormous dunes, an hour of buggy from Jeri. Usually ridden as the middle leg of a downwinder rather than a day trip.',
    priority: -2,
  }),
  brazilSpot({
    slug: 'camocim',
    name: 'Camocim',
    area: 'Ceara · Coreau estuary',
    lat: -2.902,
    lon: -40.841,
    water: 'river',
    tagline: 'the last town in Ceara',
    note: 'Wide river estuary with flat water on the sandbanks and a working fishing port behind it. The end of the Ceara coast and the staging point for the run into Piaui.',
    priority: -2,
  }),
  brazilSpot({
    slug: 'atins',
    name: 'Atins',
    area: 'Maranhao · Lencois Maranhenses',
    lat: -2.5833,
    lon: -42.7833,
    tagline: 'the far end',
    note: 'Village at the mouth of the Rio Preguicas on the edge of the Lencois dunes — river flat water, empty ocean beach, and 500 km of coast between it and Fortaleza. A destination, not a day trip.',
    priority: -4,
  }),
]

export const KITE_REGIONS: KiteRegion[] = [
  {
    id: 'lithuania',
    name: 'Baltic Coast',
    short: 'Lithuania',
    abbr: 'LT',
    href: '/wind',
    season: 'summer',
    seasonLabel: 'summer',
    months: 'Jun – Sep',
    activeMonths: [6, 7, 8, 9],
    timezone: 'Europe/Vilnius',
    clockLabel: 'LT',
    tagline: '12–30 kn · gusts under 36 · onshore or cross only',
    spots: LITHUANIA_SPOT_LIST,
  },
  {
    id: 'nyc',
    name: 'New York',
    short: 'NYC',
    abbr: 'NYC',
    href: '/wind/nyc',
    season: 'shoulder',
    seasonLabel: 'fall & spring',
    months: 'Oct – Nov · Mar – May',
    activeMonths: [3, 4, 5, 10, 11],
    timezone: 'America/New_York',
    clockLabel: 'ET',
    tagline: 'post-frontal NW · the strongest wind of the rotation',
    spots: NYC_SPOT_LIST,
  },
  {
    id: 'brazil',
    name: 'Ceara Coast',
    short: 'Brazil',
    abbr: 'BR',
    href: '/wind/brazil',
    season: 'winter',
    seasonLabel: 'winter',
    months: 'Dec – Feb',
    activeMonths: [12, 1, 2],
    timezone: 'America/Fortaleza',
    clockLabel: 'BRT',
    tagline: 'E/ESE trades every day · 450 km of downwind coast',
    spots: BRAZIL_SPOT_LIST,
  },
]

export function getRegion(id: RegionId): KiteRegion {
  const region = KITE_REGIONS.find(r => r.id === id)
  if (!region) throw new Error(`Unknown kite region: ${id}`)
  return region
}

export function fetchRegionForecast(region: KiteRegion): Promise<SpotForecast[]> {
  return fetchSpots(region.spots, region.timezone)
}

export { LITHUANIA_SPOT_LIST, NYC_SPOT_LIST, BRAZIL_SPOT_LIST }
