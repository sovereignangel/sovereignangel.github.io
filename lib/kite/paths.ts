/**
 * Kite mastery — the path-based belt system.
 *
 * Four discipline paths (freeride, big air, freestyle, wave), each a
 * ladder of intermediate -> advanced -> master milestones. Belts are earned
 * BJJ-style from the combination of path levels:
 *
 *   White  — fundamentals complete (independent rider)
 *   Blue   — intermediate in one path
 *   Purple — master in one path + intermediate in a second
 *   Brown  — master in two paths + intermediate in a third
 *   Black  — master in all four paths
 *
 * Milestones are 'manual' (checked off by the rider) or 'auto' (met when a
 * Surfr KPI from logged sessions crosses a threshold). Manual checkmarks are
 * stored in the same users/{uid}/kite_progress/milestones doc as the legacy
 * belt ladder; `aliases` lets old checkmarks count toward new milestones.
 */

import type { KiteStats } from '../types/kite'

export type PathId = 'freeride' | 'bigair' | 'freestyle' | 'wave' | 'foil'
export type LevelId = 'intermediate' | 'advanced' | 'master'
export type AutoMetric = 'bestHeightM' | 'bestAirtimeSec' | 'bestDistanceM'

export const LEVEL_ORDER: LevelId[] = ['intermediate', 'advanced', 'master']
export const LEVEL_SHORT: Record<LevelId, string> = {
  intermediate: 'INT',
  advanced: 'ADV',
  master: 'MST',
}

export interface PathMilestone {
  id: string
  label: string
  drill: string
  kind: 'auto' | 'manual'
  metric?: AutoMetric
  threshold?: number
  unit?: string
  aliases?: string[] // legacy belt criterion ids that count as met
}

export interface MasteryPath {
  id: PathId
  name: string
  tagline: string
  levels: { level: LevelId; milestones: PathMilestone[] }[]
}

// ─── White-belt fundamentals ──────────────────────────────────

export const FUNDAMENTALS: PathMilestone[] = [
  {
    id: 'fund-waterstart',
    label: 'Waterstart both directions',
    drill: 'Kite to 11 (or 1), dive with commitment, board across the wind — 10 clean starts each side.',
    kind: 'manual',
    aliases: ['white-waterstart'],
  },
  {
    id: 'fund-upwind',
    label: 'Hold ground upwind on both tacks',
    drill: 'Park the kite at 10-11, push the back leg, look at an upwind target — end every run where it began.',
    kind: 'manual',
    aliases: ['yellow-tacks', 'white-ride'],
  },
  {
    id: 'fund-zerowalk',
    label: '3 consecutive sessions with zero walking',
    drill: 'The return-to-towel rule: every single run ends at the launch point, all session.',
    kind: 'manual',
    aliases: ['yellow-return'],
  },
  {
    id: 'fund-relaunch',
    label: 'Relaunch the kite unassisted, every time',
    drill: 'Deliberately drop the kite mid-session and relaunch both ways until it is boring.',
    kind: 'manual',
    aliases: ['yellow-relaunch'],
  },
  {
    id: 'fund-selfrescue',
    label: 'Full self-rescue and pack-down',
    drill: 'Once in moderate wind: flag out, wrap lines, sail the kite home, pack down in the water.',
    kind: 'manual',
    aliases: ['orange-selfrescue'],
  },
]

// ─── The four paths ───────────────────────────────────────────

export const MASTERY_PATHS: MasteryPath[] = [
  {
    id: 'freeride',
    name: 'Freeride',
    tagline: 'Any spot, any wind — the sea becomes terrain',
    levels: [
      {
        level: 'intermediate',
        milestones: [
          {
            id: 'fr-int-transitions',
            label: 'Sliding transitions, 8 of 10 landed',
            drill: '20 per session: slow down, kite to 12, sink the tail, redirect, power away on the new tack.',
            kind: 'manual',
            aliases: ['orange-transitions'],
          },
          {
            id: 'fr-int-toeside',
            label: 'Toeside 50m+ both directions',
            drill: 'Weight over the front foot, hips open to the kite, eyes on where you are going — 10 runs a session.',
            kind: 'manual',
            aliases: ['orange-toeside'],
          },
          {
            id: 'fr-int-gusts',
            label: 'Hold the edge through gusts and lulls',
            drill: 'Pick a gusty day on purpose; absorb with the knees and edge, not by working the bar.',
            kind: 'manual',
          },
          {
            id: 'fr-int-carve',
            label: 'Carving transition without stopping',
            drill: 'Link heelside to toeside in one arc at speed, 10 attempts per session.',
            kind: 'manual',
          },
        ],
      },
      {
        level: 'advanced',
        milestones: [
          {
            id: 'fr-adv-highwind',
            label: 'Comfortable at 25 kn on a small kite',
            drill: 'Take the small kite out at 22-26 kn — control drills only, no jumps, until it feels calm.',
            kind: 'manual',
            aliases: ['blue-wind', 'purple-wind'],
          },
          {
            id: 'fr-adv-downwinder',
            label: '10 km downwinder completed',
            drill: 'Rescue-friendly stretch of coast, one buddy, one car shuttle — ride it end to end.',
            kind: 'manual',
          },
          {
            id: 'fr-adv-newspot',
            label: 'Ride an unfamiliar spot unassisted',
            drill: 'Assess wind, hazards and exits yourself; launch, ride and land with no local briefing.',
            kind: 'manual',
            aliases: ['brown-conditions'],
          },
          {
            id: 'fr-adv-waves',
            label: 'At speed in waves and heavy chop',
            drill: 'Ride the rough day instead of skipping it — knees soft, line choice like a skier reading moguls.',
            kind: 'manual',
          },
        ],
      },
      {
        level: 'master',
        milestones: [
          {
            id: 'fr-mst-anyspot',
            label: 'Any spot, 12-35 kn, any rideable direction',
            drill: 'A season of saying yes: new spots, strong days, light days — nothing on the forecast scares you.',
            kind: 'manual',
          },
          {
            id: 'fr-mst-bigdw',
            label: '30 km+ coastal downwinder',
            drill: 'Multi-hour point-to-point run with navigation, energy and kite choice managed alone.',
            kind: 'manual',
          },
          {
            id: 'fr-mst-coach',
            label: 'Coach someone to their first upwind leg',
            drill: 'Teaching exposes every gap — talk a friend from waterstart to holding ground.',
            kind: 'manual',
            aliases: ['black-coach'],
          },
        ],
      },
    ],
  },
  {
    id: 'bigair',
    name: 'Big Air',
    tagline: 'Height with control — the Surfr numbers path',
    levels: [
      {
        level: 'intermediate',
        milestones: [
          {
            id: 'ba-int-pop',
            label: 'Clean pop, both feet off the water',
            drill: 'Edge hard, load the lines, release — 20 board-off-water hops per session, kite parked.',
            kind: 'manual',
            aliases: ['green-pop'],
          },
          {
            id: 'ba-int-five',
            label: '5 sent jumps landed in one session',
            drill: 'Small sends: kite 11 to 12:30, edge, release, redirect back to 11 before landing. Start underpowered.',
            kind: 'manual',
            aliases: ['green-firstjump'],
          },
          {
            id: 'ba-int-airtime',
            label: 'Airtime 1.5s+',
            drill: 'Logged by Surfr — harder edge and a faster send buy time in the air.',
            kind: 'auto',
            metric: 'bestAirtimeSec',
            threshold: 1.5,
            unit: 's',
          },
          {
            id: 'ba-int-height',
            label: 'Jump height 2m+',
            drill: 'Logged by Surfr — speed on approach converts to height.',
            kind: 'auto',
            metric: 'bestHeightM',
            threshold: 2,
            unit: 'm',
          },
        ],
      },
      {
        level: 'advanced',
        milestones: [
          {
            id: 'ba-adv-height',
            label: 'Jump height 5m+',
            drill: 'Stronger wind, harder edge, later release — chase it on 18-24 kn days.',
            kind: 'auto',
            metric: 'bestHeightM',
            threshold: 5,
            unit: 'm',
          },
          {
            id: 'ba-adv-grab',
            label: 'Grab landed mid-jump',
            drill: 'Once landings are 80%: bring the board up, grab, look at the landing — grabs compact everything.',
            kind: 'manual',
            aliases: ['purple-grab'],
          },
          {
            id: 'ba-adv-backroll',
            label: 'Backroll landed consistently',
            drill: 'Send a normal jump, look hard over the leading shoulder, spot the landing — 5 in a row.',
            kind: 'manual',
            aliases: ['brown-backroll'],
          },
          {
            id: 'ba-adv-landed',
            label: '80% of jumps landed across a session',
            drill: 'Fifteen-jump sessions scored honestly: redirect before landing, tail first, downwind.',
            kind: 'manual',
            aliases: ['blue-landed'],
          },
        ],
      },
      {
        level: 'master',
        milestones: [
          {
            id: 'ba-mst-height',
            label: 'Jump height 10m+',
            drill: 'Real wind, real edge, full commitment — the double-digit club.',
            kind: 'auto',
            metric: 'bestHeightM',
            threshold: 10,
            unit: 'm',
          },
          {
            id: 'ba-mst-loop',
            label: 'Kiteloop landed',
            drill: 'Downloop-under-the-jump first, then low loops on a small kite in soft water. Respect the ladder.',
            kind: 'manual',
            aliases: ['black-rotation'],
          },
          {
            id: 'ba-mst-comp',
            label: 'Ride a judged big air heat',
            drill: 'Enter an amateur event — a heat with a horn and a scoresheet changes how you jump.',
            kind: 'manual',
          },
        ],
      },
    ],
  },
  {
    id: 'freestyle',
    name: 'Freestyle',
    tagline: 'Unhooked — tricks with the power in your hands',
    levels: [
      {
        level: 'intermediate',
        milestones: [
          {
            id: 'fs-int-unhooked',
            label: 'Unhooked riding 100m under control',
            drill: 'Trim fully, kite at 10-11, unhook, ride flat and fast, hook back in — repeat until casual.',
            kind: 'manual',
          },
          {
            id: 'fs-int-pop',
            label: 'Unhooked pop landed clean',
            drill: 'Unhook, edge away hard, pop off the tail without sending the kite, land riding.',
            kind: 'manual',
          },
          {
            id: 'fs-int-blind',
            label: 'Ride blind (hooked) 20m',
            drill: 'Slow down, shift weight to the new front foot, rotate past toeside and hold it.',
            kind: 'manual',
          },
        ],
      },
      {
        level: 'advanced',
        milestones: [
          {
            id: 'fs-adv-raley',
            label: 'Raley landed',
            drill: 'Unhooked pop, let the body swing out and up behind the bar, bring the board back under for landing.',
            kind: 'manual',
          },
          {
            id: 'fs-adv-backroll',
            label: 'Unhooked backroll landed',
            drill: 'Same rotation as hooked, but with the pop doing all the work — start small.',
            kind: 'manual',
          },
          {
            id: 'fs-adv-surfacepass',
            label: 'Surface pass landed',
            drill: 'Land blind, pass the bar behind the back on the water — the handle-pass motion at zero altitude.',
            kind: 'manual',
          },
        ],
      },
      {
        level: 'master',
        milestones: [
          {
            id: 'fs-mst-pass',
            label: 'Aerial handle pass landed',
            drill: 'Raley to blind with the pass in the air — the gateway trick to everything in the book.',
            kind: 'manual',
          },
          {
            id: 'fs-mst-blindpop',
            label: 'Land blind off a popped trick',
            drill: 'Pop to blind with speed, held for 50m — commitment plus a soft front knee.',
            kind: 'manual',
          },
          {
            id: 'fs-mst-run',
            label: 'Three-trick unhooked run, no crash',
            drill: 'A competition-legal sequence back to back on one tack — consistency is the mastery.',
            kind: 'manual',
          },
        ],
      },
    ],
  },
  {
    id: 'wave',
    name: 'Wave',
    tagline: 'Strapless surfboard — the ocean sets the line',
    levels: [
      {
        level: 'intermediate',
        milestones: [
          {
            id: 'wv-int-strapless',
            label: 'Strapless upwind both tacks',
            drill: 'Borrow or rent a directional; light-wind flat days are perfect for the first sessions.',
            kind: 'manual',
          },
          {
            id: 'wv-int-bottomturn',
            label: 'Bottom turn on a wave face',
            drill: 'Catch small waves, drop in, one drawn-out bottom turn with the kite drifting ahead.',
            kind: 'manual',
          },
          {
            id: 'wv-int-jibe',
            label: 'Strapless jibe landed 5 of 10',
            drill: 'Carve through downwind, feet swap after the arc is done, kite handles the power.',
            kind: 'manual',
          },
        ],
      },
      {
        level: 'advanced',
        milestones: [
          {
            id: 'wv-adv-tack',
            label: 'Strapless tack 8 of 10',
            drill: 'Through the eye of the wind, front foot around before the board stalls — the elegant one.',
            kind: 'manual',
          },
          {
            id: 'wv-adv-dtl',
            label: 'Down-the-line wave with 3+ turns',
            drill: 'Kite parked and drifting, ride the wave like a surfer: bottom turn, top turn, repeat.',
            kind: 'manual',
          },
          {
            id: 'wv-adv-air',
            label: 'Small strapless air landed',
            drill: 'Chop hop with the wind holding the board on your feet — front foot pressure is the glue.',
            kind: 'manual',
          },
        ],
      },
      {
        level: 'master',
        milestones: [
          {
            id: 'wv-mst-grabair',
            label: 'Strapless air with grab',
            drill: 'Grab early, grab hard — the grab is what keeps the board on at height.',
            kind: 'manual',
          },
          {
            id: 'wv-mst-overhead',
            label: 'Down-the-line riding in head-high+ surf',
            drill: 'Real waves, real consequence — timing the sets is half the skill.',
            kind: 'manual',
          },
          {
            id: 'wv-mst-360',
            label: 'Strapless 360 landed',
            drill: 'Air or surface — full rotation with the board glued by wind pressure alone.',
            kind: 'manual',
          },
        ],
      },
    ],
  },
]

// ─── Belts ────────────────────────────────────────────────────

export type BeltId = 'white' | 'blue' | 'purple' | 'brown' | 'black'

export interface MasteryBelt {
  id: BeltId
  name: string
  color: string
  requirement: string
  skills: string
  /** Rough equivalence to the official IKO kiteboarder certification ladder */
  iko: string
}

export const MASTERY_BELTS: MasteryBelt[] = [
  {
    id: 'white',
    name: 'White',
    color: '#efe9df',
    requirement: 'Where everyone starts',
    skills: 'Day one — kite control, first water sessions, learning the wind window.',
    iko: 'IKO Levels 1-2',
  },
  {
    id: 'blue',
    name: 'Blue',
    color: '#2f4f6f',
    requirement: 'All five fundamentals complete',
    skills: 'Waterstart, upwind on both tacks, relaunch, self-rescue — a fully independent rider, now drilling the paths.',
    iko: 'IKO Levels 3-4 (Independent, Advanced)',
  },
  {
    id: 'purple',
    name: 'Purple',
    color: '#5c3a6e',
    requirement: 'Master one path',
    skills: 'One discipline mastered end to end — freeride, big air, freestyle or wave is genuinely yours.',
    iko: 'IKO Level 5 (Evolution, one discipline)',
  },
  {
    id: 'brown',
    name: 'Brown',
    color: '#6b4a2f',
    requirement: 'Master two paths',
    skills: 'Two disciplines mastered — a rare rider on any beach.',
    iko: 'beyond IKO — two Evolution disciplines',
  },
  {
    id: 'black',
    name: 'Black',
    color: '#22262b',
    requirement: 'Master all four paths',
    skills: 'Freeride, big air, freestyle and wave — the complete kiteboarder. A lifetime project.',
    iko: 'beyond IKO — all four Evolution disciplines',
  },
]

// ─── Life unlocks ─────────────────────────────────────────────

export type UnlockRequirement =
  | { kind: 'belt'; belt: BeltId }
  | { kind: 'path'; path: PathId; level: LevelId }
  | { kind: 'fundamentals' }
  | { kind: 'anyPath'; level: LevelId }
  // Elite ladders live in `elite.ts`, which imports this module — so the
  // earned map is handed in by the caller rather than imported back.
  | { kind: 'elite'; skill: string }

export interface LifeUnlock {
  id: string
  title: string
  detail: string
  requires: UnlockRequirement
  requiresLabel: string
  /** Badge icon id — rendered by components/wind/mastery/UnlockIcons.tsx */
  icon: string
}

export const LIFE_UNLOCKS: LifeUnlock[] = [
  {
    id: 'ul-independent',
    title: 'Ride anywhere on Earth',
    detail: 'Rent gear at any spot in the world and ride without a school — every coastal trip becomes a kite trip.',
    requires: { kind: 'belt', belt: 'blue' },
    requiresLabel: 'Blue belt',
    icon: 'globe',
  },
  {
    id: 'ul-blue-travel',
    title: 'Wind-first travel',
    detail: 'Trips get planned around forecasts now — a windy week anywhere beats a sunny week somewhere.',
    requires: { kind: 'anyPath', level: 'intermediate' },
    requiresLabel: 'Any path INT',
    icon: 'plane',
  },
  {
    id: 'ul-curonian',
    title: 'Curonian Spit downwinder',
    detail: 'Nida to Juodkrante along the dunes — the home-water classic, one shuttle car and a long afternoon.',
    requires: { kind: 'path', path: 'freeride', level: 'intermediate' },
    requiresLabel: 'Freeride INT',
    icon: 'dunes',
  },
  {
    id: 'ul-world-dw',
    title: 'World-class downwinders',
    detail: 'Cumbuco to Jericoacoara in Brazil (3 days, 200 km), Langebaan lagoon in South Africa, Dakhla in Morocco.',
    requires: { kind: 'path', path: 'freeride', level: 'advanced' },
    requiresLabel: 'Freeride ADV',
    icon: 'route',
  },
  {
    id: 'ul-winter-baltic',
    title: 'Baltic winter sessions',
    detail: 'Drysuit season: empty beaches, steady winter fronts, riding twelve months a year on home water.',
    requires: { kind: 'path', path: 'freeride', level: 'advanced' },
    requiresLabel: 'Freeride ADV',
    icon: 'snowflake',
  },
  {
    id: 'ul-expedition',
    title: 'Lead exploratory trips',
    detail: 'Madagascar, Zanzibar outer reefs, unmapped coastline — you are the one others trust to read the spot.',
    requires: { kind: 'path', path: 'freeride', level: 'master' },
    requiresLabel: 'Freeride MST',
    icon: 'summit',
  },
  {
    id: 'ul-capetown',
    title: 'Cape Town pilgrimage',
    detail: 'Kite Beach in King of the Air season (Jan-Feb) — ride the same water as the best big air riders alive.',
    requires: { kind: 'path', path: 'bigair', level: 'intermediate' },
    requiresLabel: 'Big Air INT',
    icon: 'tablemountain',
  },
  {
    id: 'ul-comp',
    title: 'Local big air competition',
    detail: 'Enter a Baltic amateur big air event — a bib, a heat, a scoreboard with your name on it.',
    requires: { kind: 'path', path: 'bigair', level: 'advanced' },
    requiresLabel: 'Big Air ADV',
    icon: 'podium',
  },
  {
    id: 'ul-kota',
    title: 'King of the Air video entry',
    detail: 'Film and submit a KOTA qualifier entry — whatever happens, you are in the conversation.',
    requires: { kind: 'elite', skill: 'megaloop' },
    requiresLabel: 'Megaloop',
    icon: 'camera',
  },
  {
    id: 'ul-lightdays',
    title: 'Half the calendar back',
    detail: 'Foiling turns 8-12 kn from a written-off day into a session — roughly half the days the planner currently greys out become rideable.',
    requires: { kind: 'elite', skill: 'foil-eight' },
    requiresLabel: 'Foiling in 8 kn',
    icon: 'foil',
  },
  {
    id: 'ul-lagoons',
    title: 'Flat-water paradise trips',
    detail: 'Lo Stagnone in Sicily, the Dakhla lagoon — butter-flat freestyle water with a trick list in your pocket.',
    requires: { kind: 'path', path: 'freestyle', level: 'intermediate' },
    requiresLabel: 'Freestyle INT',
    icon: 'lagoon',
  },
  {
    id: 'ul-fs-comp',
    title: 'Judged freestyle heat',
    detail: 'An amateur freestyle comp run — three tricks, two tacks, one horn.',
    requires: { kind: 'path', path: 'freestyle', level: 'advanced' },
    requiresLabel: 'Freestyle ADV',
    icon: 'scorecard',
  },
  {
    id: 'ul-video-part',
    title: 'A video part worth publishing',
    detail: 'Film a full unhooked edit — three minutes of riding that prove the trick list is real.',
    requires: { kind: 'path', path: 'freestyle', level: 'master' },
    requiresLabel: 'Freestyle MST',
    icon: 'clapper',
  },
  {
    id: 'ul-essaouira',
    title: 'Strapless surf trip',
    detail: 'Essaouira, Morocco — waves, tagine and a directional board strapped to the roof.',
    requires: { kind: 'path', path: 'wave', level: 'intermediate' },
    requiresLabel: 'Wave INT',
    icon: 'wavesun',
  },
  {
    id: 'ul-onEye',
    title: 'One Eye, Mauritius',
    detail: 'Le Morne and one of the best kite waves on the planet — the wall every wave rider dreams about.',
    requires: { kind: 'path', path: 'wave', level: 'advanced' },
    requiresLabel: 'Wave ADV',
    icon: 'barrel',
  },
  {
    id: 'ul-capeverde',
    title: 'Ponta Preta, Cape Verde',
    detail: 'One of the heaviest kite waves anywhere — the wave you earn, not book.',
    requires: { kind: 'path', path: 'wave', level: 'master' },
    requiresLabel: 'Wave MST',
    icon: 'reefpeak',
  },
  {
    id: 'ul-purple-crew',
    title: 'The one others follow',
    detail: 'You call the session: spot, kite size, safety plan. Friends launch when you launch.',
    requires: { kind: 'belt', belt: 'purple' },
    requiresLabel: 'Purple belt',
    icon: 'crew',
  },
  {
    id: 'ul-brown-season',
    title: 'A full season abroad',
    detail: 'A winter in Cape Town or Brazil riding at local level — not a tourist in the lineup.',
    requires: { kind: 'belt', belt: 'brown' },
    requiresLabel: 'Brown belt',
    icon: 'horizonsun',
  },
  {
    id: 'ul-black-yes',
    title: 'Any invitation, yes',
    detail: 'Crossings, filming projects, expedition invites — nothing on the table is out of reach.',
    requires: { kind: 'belt', belt: 'black' },
    requiresLabel: 'Black belt',
    icon: 'compass',
  },
]

// ─── Glossary ─────────────────────────────────────────────────
// Beach vocabulary, shown with dotted underlines and a glossary card
// until the rider reaches brown belt — then the training wheels come off.

export interface GlossaryEntry {
  term: string
  def: string
  /** Word forms glossed inline in drill text; entries without variants appear only in the glossary card. */
  variants?: string[]
}

export const KITE_GLOSSARY: GlossaryEntry[] = [
  {
    term: 'tack',
    def: 'Your direction of travel across the wind (riding left or right); also the upwind turn where the board nose passes through the wind.',
    variants: ['tack', 'tacks'],
  },
  { term: 'tail', def: 'The back end of the board.', variants: ['tail'] },
  {
    term: 'edge',
    def: 'Digging the upwind edge of the board into the water to resist the kite — the core of upwind riding and jumping.',
    variants: ['edge', 'edging'],
  },
  {
    term: 'kite clock',
    def: 'Kite positions read as clock hours: 12 is straight overhead, 9 and 3 sit at the water; you ride with the kite around 10-11 (or 1-2).',
  },
  {
    term: 'park',
    def: 'Hold the kite still at one clock position instead of working it up and down.',
    variants: ['park', 'parked'],
  },
  {
    term: 'send',
    def: 'Steer the kite quickly toward 12 so it lifts you — the start of every jump.',
    variants: ['send', 'sends', 'sent'],
  },
  {
    term: 'pop',
    def: 'Spring off the water using board and line tension alone, without sending the kite.',
    variants: ['pop', 'pops'],
  },
  { term: 'heelside', def: 'Normal stance: weight on your heels, leaning back against the kite.', variants: ['heelside'] },
  {
    term: 'toeside',
    def: 'The other edge: weight on your toes, chest turned toward the nose of the board.',
    variants: ['toeside'],
  },
  { term: 'carve', def: 'Turn in one smooth arc on the board edge, like a snowboard turn.', variants: ['carve', 'carving'] },
  {
    term: 'unhooked',
    def: 'Riding with the chicken loop off the harness hook, taking the kite power in your arms.',
    variants: ['unhooked', 'unhook'],
  },
  { term: 'blind', def: 'Riding backwards — back facing the direction of travel.', variants: ['blind'] },
  {
    term: 'downwinder',
    def: 'A one-way trip down the coast, ending downwind of where you started, with a shuttle back.',
    variants: ['downwinder', 'downwinders'],
  },
  {
    term: 'strapless',
    def: 'Riding a surfboard with no foot straps — held on by wind pressure and footwork.',
    variants: ['strapless'],
  },
  {
    term: 'underpowered',
    def: 'Rigged with less kite power than ideal — the safe setting for learning new moves.',
    variants: ['underpowered'],
  },
  { term: 'eye of the wind', def: 'Pointing straight into the wind — the one direction you cannot ride.', variants: ['eye of the wind'] },
  {
    term: 'wind window',
    def: 'The quarter-dome of sky downwind of you that the kite can fly in. 12 is overhead at the top of it, 9 and 3 sit at the water on either side.',
    variants: ['wind window'],
  },
  {
    term: 'power zone',
    def: 'The bottom-centre of the wind window, straight downwind of you at water level. The kite moves fastest there and pulls hardest, and the pull points forward rather than up.',
    variants: ['power zone'],
  },
  {
    term: 'downloop',
    def: 'Steering the kite DOWN and all the way around in a full circle, so it dives through the power zone before coming back up. An uploop lifts you; a downloop tows you forward.',
    variants: ['downloop', 'downloops', 'downlooping', 'downlooped'],
  },
  {
    term: 'uploop',
    def: 'Turning the kite back over the top of the window instead of down through the power zone — the ordinary, low-power way to move it across.',
    variants: ['uploop', 'uploops'],
  },
  {
    term: 'kiteloop',
    def: 'A downloop performed during a jump: the kite completes a full circle in the air and catches you as it comes round.',
    variants: ['kiteloop', 'kiteloops'],
  },
  {
    term: 'megaloop',
    def: 'A kiteloop off a full send, with the loop pulled late from the top of the jump so the kite drives through the power zone and slingshots you downwind.',
    variants: ['megaloop', 'megaloops'],
  },
  {
    term: 'apex',
    def: 'The highest point of a jump — the moment everything in the air gets timed from.',
    variants: ['apex'],
  },
  {
    term: 'depower',
    def: 'The trim that changes how much the kite pulls: sheeting in adds power, letting the bar out takes it away.',
    variants: ['depower'],
  },
  {
    term: 'quick release',
    def: 'The red handle on the chicken loop that dumps the kite off your harness. The last line of defence, and the one thing worth practising while nothing is wrong.',
    variants: ['quick release'],
  },
  {
    term: 'board leash',
    def: 'A cord tying the board to you. Convenient for learning, dangerous for jumping — a released board on a leash comes back at your head.',
    variants: ['board leash'],
  },
  {
    term: 'hydrofoil',
    def: 'A wing on a mast under the board. Past a certain speed the board lifts clear of the water and you fly on the wing alone, in roughly half the wind.',
    variants: ['hydrofoil', 'foil', 'foiling'],
  },
  {
    term: 'raley',
    def: 'An unhooked trick where the board is thrown out behind you and the body goes flat, then swings back under for the landing.',
    variants: ['raley'],
  },
  {
    term: 'down-the-line',
    def: 'Riding along the face of a wave in the direction it is breaking, letting the wave drive rather than the kite.',
    variants: ['down-the-line'],
  },
]

// ─── Computation ──────────────────────────────────────────────

export function isMilestoneMet(
  m: PathMilestone,
  stats: KiteStats,
  milestones: Record<string, boolean>
): boolean {
  if (m.kind === 'auto' && m.metric && m.threshold !== undefined) {
    return stats[m.metric] >= m.threshold
  }
  if (milestones[m.id]) return true
  return (m.aliases ?? []).some(a => milestones[a])
}

export interface LevelProgress {
  level: LevelId
  met: number
  total: number
  complete: boolean
}

export interface PathStatus {
  path: MasteryPath
  /** 0 = none, 1 = intermediate, 2 = advanced, 3 = master */
  rank: number
  levelName: 'none' | LevelId
  levels: LevelProgress[]
  nextMilestone: PathMilestone | null
}

export function computePathStatus(
  path: MasteryPath,
  stats: KiteStats,
  milestones: Record<string, boolean>
): PathStatus {
  const levels: LevelProgress[] = path.levels.map(l => {
    const met = l.milestones.filter(m => isMilestoneMet(m, stats, milestones)).length
    return { level: l.level, met, total: l.milestones.length, complete: met === l.milestones.length }
  })
  // Levels are sequential: a level counts only if every level below it is complete
  let rank = 0
  for (const l of levels) {
    if (l.complete) rank++
    else break
  }
  let nextMilestone: PathMilestone | null = null
  for (const l of path.levels) {
    const unmet = l.milestones.find(m => !isMilestoneMet(m, stats, milestones))
    if (unmet) {
      nextMilestone = unmet
      break
    }
  }
  return {
    path,
    rank,
    levelName: rank === 0 ? 'none' : LEVEL_ORDER[rank - 1],
    levels,
    nextMilestone,
  }
}

export interface MasteryState {
  fundamentalsMet: number
  fundamentalsTotal: number
  whiteEarned: boolean
  pathStatuses: PathStatus[]
  beltsEarned: Record<BeltId, boolean>
  /** -1 = unranked, else index into MASTERY_BELTS */
  currentBeltIndex: number
  targetBeltIndex: number
}

export function computeMasteryState(
  stats: KiteStats,
  milestones: Record<string, boolean>
): MasteryState {
  const fundamentalsMet = FUNDAMENTALS.filter(m => isMilestoneMet(m, stats, milestones)).length
  const whiteEarned = fundamentalsMet === FUNDAMENTALS.length
  const pathStatuses = MASTERY_PATHS.map(p => computePathStatus(p, stats, milestones))

  const masters = pathStatuses.filter(p => p.rank >= 3).length

  // White is the starting belt — worn from day one, not earned.
  // Fundamentals earn blue; belts after that count mastered paths.
  const beltsEarned: Record<BeltId, boolean> = {
    white: true,
    blue: whiteEarned,
    purple: whiteEarned && masters >= 1,
    brown: whiteEarned && masters >= 2,
    black: whiteEarned && masters >= MASTERY_PATHS.length,
  }

  let currentBeltIndex = -1
  for (let i = 0; i < MASTERY_BELTS.length; i++) {
    if (beltsEarned[MASTERY_BELTS[i].id]) currentBeltIndex = i
    else break
  }
  const targetBeltIndex = Math.min(currentBeltIndex + 1, MASTERY_BELTS.length - 1)

  return {
    fundamentalsMet,
    fundamentalsTotal: FUNDAMENTALS.length,
    whiteEarned,
    pathStatuses,
    beltsEarned,
    currentBeltIndex,
    targetBeltIndex,
  }
}

// ─── Path gating ──────────────────────────────────────────────
// The near-term focus is freeride + big air; freestyle and wave open up
// once real intermediate skill exists on one of the first two paths.

export const PATH_GATES: Partial<Record<PathId, { requiresAnyOf: PathId[]; level: LevelId; label: string }>> = {
  freestyle: {
    requiresAnyOf: ['freeride', 'bigair'],
    level: 'intermediate',
    label: 'Unlocks at Freeride or Big Air intermediate',
  },
  wave: {
    requiresAnyOf: ['freeride', 'bigair'],
    level: 'intermediate',
    label: 'Unlocks at Freeride or Big Air intermediate',
  },
}

/** Null if the path is open; otherwise the human-readable unlock condition. */
export function lockedPathLabel(
  pathId: PathId,
  stats: KiteStats,
  milestones: Record<string, boolean>
): string | null {
  const gate = PATH_GATES[pathId]
  if (!gate) return null
  const needed = LEVEL_ORDER.indexOf(gate.level) + 1
  const met = gate.requiresAnyOf.some(pid => {
    const path = MASTERY_PATHS.find(p => p.id === pid)
    return path ? computePathStatus(path, stats, milestones).rank >= needed : false
  })
  return met ? null : gate.label
}

// ─── Official IKO ladder (for side-by-side reference) ─────────

export interface IkoLevel {
  level: number
  name: string
  desc: string
}

export const IKO_LEVELS: IkoLevel[] = [
  {
    level: 1,
    name: 'Discovery',
    desc: 'On land: wind window, gear setup, kite control, safety systems.',
  },
  {
    level: 2,
    name: 'Intermediate',
    desc: 'In the water: body drags, water relaunch, first waterstarts.',
  },
  {
    level: 3,
    name: 'Independent',
    desc: 'Ride both tacks, hold ground upwind, self-rescue — certified to rent gear worldwide.',
  },
  {
    level: 4,
    name: 'Advanced',
    desc: 'Transitions, toeside, first jumps, riding in varied conditions.',
  },
  {
    level: 5,
    name: 'Evolution',
    desc: 'Discipline specialization: freeride, freestyle, hydrofoil or wave.',
  },
]

/** Rough current IKO position implied by the mastery state. */
export function currentIkoLevel(state: MasteryState): number {
  if (state.beltsEarned.purple) return 5 // a path mastered = Evolution territory
  if (state.pathStatuses.some(p => p.rank >= 1)) return 4 // intermediate skill = Advanced
  if (state.whiteEarned) return 3 // fundamentals = Independent
  return state.fundamentalsMet > 0 ? 2 : 1
}

export interface NextMilestone {
  source: string // 'Foundation' or path name
  pathId: PathId | 'foundation' | 'elite'
  milestone: PathMilestone
  /** Not yet the current drill — shown as what comes after it */
  queued?: boolean
}

/**
 * The next 3 things to work on: the first unmet fundamental (if any), then
 * each path's next unmet milestone in path order — three options from
 * different tracks, so there is always a choice on the beach.
 */
export function nextMilestones(
  stats: KiteStats,
  milestones: Record<string, boolean>,
  n = 4
): NextMilestone[] {
  const out: NextMilestone[] = []
  const fund = FUNDAMENTALS.find(m => !isMilestoneMet(m, stats, milestones))
  if (fund) out.push({ source: 'Foundation', pathId: 'foundation', milestone: fund })
  for (const path of MASTERY_PATHS) {
    if (lockedPathLabel(path.id, stats, milestones)) continue
    const status = computePathStatus(path, stats, milestones)
    if (status.nextMilestone) {
      out.push({ source: path.name, pathId: path.id, milestone: status.nextMilestone })
    }
  }
  // Variety: queue up the freeride drill that follows the current one, so
  // there is always a second freeride option to rotate onto mid-session.
  const freeride = MASTERY_PATHS.find(p => p.id === 'freeride')
  if (freeride && !lockedPathLabel('freeride', stats, milestones)) {
    const unmet = freeride.levels
      .flatMap(l => l.milestones)
      .filter(m => !isMilestoneMet(m, stats, milestones))
    if (unmet.length > 1) {
      out.push({ source: 'Freeride', pathId: 'freeride', milestone: unmet[1], queued: true })
    }
  }
  return out.slice(0, n)
}

export function isUnlockMet(
  u: LifeUnlock,
  state: MasteryState,
  eliteEarned: Record<string, boolean> = {}
): boolean {
  const req = u.requires
  if (req.kind === 'elite') return eliteEarned[req.skill] === true
  if (req.kind === 'belt') return state.beltsEarned[req.belt]
  if (req.kind === 'fundamentals') return state.whiteEarned
  if (req.kind === 'anyPath') {
    const needed = LEVEL_ORDER.indexOf(req.level) + 1
    return state.pathStatuses.some(p => p.rank >= needed)
  }
  const status = state.pathStatuses.find(p => p.path.id === req.path)
  if (!status) return false
  const needed = LEVEL_ORDER.indexOf(req.level) + 1
  return status.rank >= needed
}

/** Progress text for an auto milestone, e.g. "best 1.2s of 1.5s". */
export function autoProgressLabel(m: PathMilestone, stats: KiteStats): string | null {
  if (m.kind !== 'auto' || !m.metric || m.threshold === undefined) return null
  const current = stats[m.metric]
  const fmt = (v: number) => (v % 1 === 0 ? `${v}` : v.toFixed(1))
  return `best ${fmt(current)}${m.unit ?? ''} of ${fmt(m.threshold)}${m.unit ?? ''}`
}
