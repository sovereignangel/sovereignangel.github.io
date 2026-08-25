/**
 * Elite skills — the trophy cabinet.
 *
 * The belt system measures breadth: four disciplines, three levels each,
 * everything eventually ticked off. This measures the opposite — the handful
 * of moves that are genuinely hard, that most riders never land, and that
 * each need a ladder of their own to reach.
 *
 * An elite ladder is built from rungs. Some rungs are milestones that already
 * live on a path (referenced by id, so a checkmark anywhere counts everywhere
 * — one `kite_progress/milestones` doc behind all of it). The rest are rungs
 * that only exist on the way to this one skill.
 *
 * Elite rungs deliberately stay OUT of `MASTERY_PATHS`. Belts are computed
 * from those level arrays, so folding eleven megaloop rungs into Big Air
 * master would quietly push purple, brown and black further away and re-lock
 * the life unlocks that hang off them. The trophy cabinet runs alongside the
 * belts, not inside them.
 *
 * Picking a skill as the target overrides the Next Up drills: instead of the
 * next rung on each path, the beach gets the next three rungs of the chosen
 * ladder. Clearing the target hands the drills back to normal progression.
 */

import type { KiteStats } from '../types/kite'
import {
  FUNDAMENTALS,
  MASTERY_PATHS,
  isMilestoneMet,
  type NextMilestone,
  type PathMilestone,
} from './paths'

// ─── Rung lookup ──────────────────────────────────────────────

const BY_ID = new Map<string, PathMilestone>()
for (const m of FUNDAMENTALS) BY_ID.set(m.id, m)
for (const p of MASTERY_PATHS) for (const l of p.levels) for (const m of l.milestones) BY_ID.set(m.id, m)

/** A rung that already lives on a path — same object, so progress is shared. */
function ref(id: string): PathMilestone {
  const m = BY_ID.get(id)
  if (!m) throw new Error(`Elite ladder references unknown milestone: ${id}`)
  return m
}

export interface EliteGate {
  name: string
  blurb: string
  rungs: PathMilestone[]
}

export interface EliteSkill {
  id: string
  name: string
  /** Which path this belongs to, for the badge */
  discipline: string
  tagline: string
  /** What landing it actually buys */
  why: string
  /** Honest time cost, so a locked ladder reads as long rather than close */
  horizon: string
  /** Badge icon id — rendered by components/wind/mastery/UnlockIcons.tsx */
  icon: string
  gates: EliteGate[]
}

export const ELITE_SKILLS: EliteSkill[] = [
  // ─── Megaloop ───────────────────────────────────────────────
  {
    id: 'megaloop',
    name: 'Megaloop',
    discipline: 'Big Air',
    tagline: 'Full send, kite looped late from the top',
    why: 'The King of the Air move. A normal jump goes up and comes down; a megaloop sends the kite through a complete circle while you are at the top, so it catches you and slingshots you downwind. It is the single most consequential thing you can do on a kite, and it is what big air means at the top of the sport.',
    horizon: 'Two to four seasons past big-air advanced. The limiter is not hours on the water — it is how many genuinely strong days you can get to.',
    icon: 'loop',
    gates: [
      {
        name: 'Airframe',
        blurb: 'Nothing below this line is optional. A loop crash is an ordinary crash with the kite still pulling, so the ordinary crashes have to be rare first.',
        rungs: [
          ref('fr-adv-highwind'),
          ref('ba-adv-landed'),
          ref('ba-adv-height'),
          ref('ba-adv-backroll'),
          {
            id: 'ml-airtime4',
            label: 'Airtime 4s+',
            drill: 'Logged by Surfr. You need time in the air to place a loop — under three seconds there is simply no window to pull the bar and let the kite come round.',
            kind: 'auto',
            metric: 'bestAirtimeSec',
            threshold: 4,
            unit: 's',
          },
          {
            id: 'ml-onehand',
            label: 'One-handed bar control, either hand',
            drill: 'Fly, steer, edge and jump with each hand alone while the other hangs free. A loop is a hard pull on the back hand with your front hand off the bar, so practise it early and on both sides.',
            kind: 'manual',
          },
          {
            id: 'ml-qr',
            label: 'Quick release under load, in the water',
            drill: 'Twice a season, on purpose: get properly powered up, pull the quick release, then reset it yourself while floating. It is the one drill nobody does until the day they need it.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'The loop feel, feet on the water',
        blurb: 'A downloop is the kite steered DOWN and all the way around in a full circle, instead of turned back over the top. The bottom of the wind window — straight downwind of you, at water level — is where the kite moves fastest and pulls hardest, and that pull points forward rather than up. An uploop lifts you. A downloop tows you. Learn the tow with both feet still on the water.',
        rungs: [
          {
            id: 'ml-dl-transition',
            label: 'Downloop transitions, both directions, 10 landed',
            drill: 'At the end of a tack, instead of turning the kite back over the top, steer it down — let it dive through the bottom of the window and complete a full circle before it comes back up. It rips you out onto the new tack with real speed. First taste of the kite pulling you through a whole revolution.',
            kind: 'manual',
          },
          {
            id: 'ml-dl-landing',
            label: '20 landings softened with a downloop in one session',
            drill: 'On every normal jump, as you start coming down, downloop the kite low so it tows you out of the landing instead of dropping you into it. This exact timing — loop early enough that the kite is pulling when you touch down — is what makes a megaloop survivable.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'First loops, small kite, soft water',
        blurb: 'Start where the consequence is lowest: small kite, deep flat water, loops that finish before you land.',
        rungs: [
          {
            id: 'ml-underjump',
            label: 'Loop under the jump, 10 landed',
            drill: 'A small send, and you pull the loop while you are still low so the kite finishes the circle underneath you before you touch down. Short window of line tension, low height, nothing to go badly wrong. This is the rung everyone skips and everyone should not.',
            kind: 'manual',
          },
          ref('ba-mst-loop'),
          {
            id: 'ml-bothtacks',
            label: 'Kiteloops on both tacks, 5 in a row each',
            drill: 'Your weak side is a separate skill and it will feel like starting over. Do not move up until both sides are equally boring.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'Height and late timing',
        blurb: 'Everything above was building the reflexes. This gate is where the move actually is.',
        rungs: [
          {
            id: 'ml-spotrule',
            label: 'The megaloop spot rule, standing',
            drill: 'Deep water, at least 300m of clear runway downwind, nothing hard anywhere below you, someone on the beach who knows you are out, helmet and impact vest on, board leash off. A megaloop moves you a very long way downwind whether or not you planned it.',
            kind: 'manual',
          },
          {
            id: 'ml-thirty',
            label: 'A powered 30 kn day you enjoyed',
            drill: 'Megaloops live at 28 to 35 kn — you cannot loop underpowered, because the whole trick depends on the kite having enough pull to catch you. Ride that wind on a 7m or 8m until it feels ordinary. No loops. Just control.',
            kind: 'manual',
          },
          {
            id: 'ml-fromheight',
            label: 'Loop from height, landed',
            drill: 'Full send, and you pull the loop as you start to come down so the kite completes the circle underneath you. The bridge rung between a kiteloop and a megaloop — same move, more air, more time to think about it.',
            kind: 'manual',
          },
          ref('ba-mst-height'),
          {
            id: 'ml-megaloop',
            label: 'Megaloop landed, riding away',
            drill: 'Full send, and the loop pulled LATE — from the top, with the kite driven hard through the power zone rather than allowed to drift round. It will take you somewhere sideways and very fast. Land at speed, going downwind, still on the board.',
            kind: 'manual',
          },
          {
            id: 'ml-mega-owned',
            label: '3 megaloops in one session, both tacks',
            drill: 'The rung that turns one landed megaloop into a skill you own. Anyone can get lucky once in the right gust.',
            kind: 'manual',
          },
        ],
      },
    ],
  },

  // ─── Handle pass ────────────────────────────────────────────
  {
    id: 'handle-pass',
    name: 'Handle Pass',
    discipline: 'Freestyle',
    tagline: 'Unhooked, bar thrown behind your back and caught mid-air',
    why: 'The line that separates freestyle from everything else. Unhooked, in the air, you let go of the bar with one hand, pass it behind your back and catch it with the other while still rotating. Everything in modern freestyle is built on top of this one movement.',
    horizon: 'Two to three seasons of flat-water mileage. The limiter is unhooked reps, which means it wants a lagoon — this is what the Brazil winter is for.',
    icon: 'pass',
    gates: [
      {
        name: 'Unhooked comfort',
        blurb: 'Unhooked means the chicken loop is off the harness hook and the kite is pulling on your arms instead of your body. Until that is comfortable, nothing above it is available.',
        rungs: [
          ref('fs-int-unhooked'),
          ref('fs-int-pop'),
          {
            id: 'hp-trim',
            label: 'Bar trimmed for unhooked riding',
            drill: 'Sheet the depower in so the bar sits at its sweet spot with the chicken loop off the hook. A badly trimmed bar turns every unhooked trick into a fight with the kite, and most people fight for a year before anyone tells them.',
            kind: 'manual',
          },
          {
            id: 'hp-flatwater',
            label: '20 unhooked pops in flat water, one session',
            drill: 'Standing-depth lagoon, kite parked low at 45 degrees, hard edge, unhook, pop, land, hook back in. Repeat to boredom. Volume in flat water is the entire secret here.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'Pass mechanics, on the water',
        blurb: 'Learn the hand movement where falling costs nothing — dragging along the surface rather than three metres up.',
        rungs: [
          ref('fs-int-blind'),
          ref('fs-adv-surfacepass'),
          {
            id: 'hp-blindland',
            label: 'Ride away blind off a surface pass, 5 of 10',
            drill: 'The pass is only half the trick; riding away with your back to where you are going is the other half. Land it, hold the blind, then rotate out.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'Air, then rotation',
        blurb: 'Height and rotation get added one at a time. Never both in the same session.',
        rungs: [
          ref('fs-adv-raley'),
          ref('fs-adv-backroll'),
          {
            id: 'hp-raleyblind',
            label: 'Raley to blind landed',
            drill: 'A raley where you rotate at the end and land blind instead of straight. One step short of the pass, and the step that teaches your body the timing of it.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'The pass',
        blurb: 'Everything comes together: pop, rotation, the hand behind the back, and riding out of it.',
        rungs: [
          {
            id: 'hp-sbend',
            label: 'S-bend landed',
            drill: 'A raley that rotates through 360 in the air and lands riding forward. The frame the pass gets built into.',
            kind: 'manual',
          },
          ref('fs-mst-pass'),
          {
            id: 'hp-bothtacks',
            label: 'Handle pass on both tacks, 3 in a row each',
            drill: 'One landed pass is a story. Six is a skill.',
            kind: 'manual',
          },
        ],
      },
    ],
  },

  // ─── Down-the-line strapless ────────────────────────────────
  {
    id: 'strapless-dtl',
    name: 'Down-the-Line, Strapless',
    discipline: 'Wave',
    tagline: 'A real wave face, no straps, kite parked and quiet',
    why: 'The purest thing you can do with a kite. Strapless means a surfboard with nothing holding your feet on — you stay attached by wind pressure and footwork alone. Down-the-line means the wave is driving you, not the kite: the kite gets parked out of the way and you surf. It turns every swell on the forecast into a reason to go.',
    horizon: 'Two to three seasons, and it needs a coast with real waves. Baltic chop will not teach it; Ceara and the NYC ocean side will.',
    icon: 'dtl',
    gates: [
      {
        name: 'Board control with nothing holding your feet',
        blurb: 'The board wants to shoot out from under you at every moment. All of this is footwork.',
        rungs: [
          {
            id: 'sw-waterstart',
            label: 'Strapless waterstart, 10 in a row, both tacks',
            drill: 'The board tries to escape as the kite pulls. Step on early, weight forward over the front foot, kite low and steady rather than sent. Ten clean starts each side and the panic goes away.',
            kind: 'manual',
          },
          ref('wv-int-strapless'),
          ref('wv-int-jibe'),
        ],
      },
      {
        name: 'Reading a wave',
        blurb: 'A wave is terrain, and the point of all of this is to let it do the work.',
        rungs: [
          ref('wv-int-bottomturn'),
          {
            id: 'sw-topturn',
            label: 'Top turn off the lip',
            drill: 'Bottom turn up the face, then redirect off the top of the wave and come back down it. Bottom turn plus top turn is the whole vocabulary — everything else is a variation.',
            kind: 'manual',
          },
          {
            id: 'sw-kitepark',
            label: 'Ride a wave with the kite parked and no line tension',
            drill: 'Park the kite at the edge of the window and let the wave carry you with slack lines. This is the actual skill: the wave drives, the kite is just a way of getting back out. Most riders never stop pulling on the bar.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'Linking it',
        blurb: 'One turn is a moment. A ride is turns joined together without a pause between them.',
        rungs: [
          ref('wv-adv-tack'),
          ref('wv-adv-dtl'),
          {
            id: 'sw-fiveturn',
            label: 'Five linked turns on one wave',
            drill: 'Pick the longest wall on the sandbar and stay on it. Turns come from looking where you want to go and committing the back foot — not from the kite.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'Real surf',
        blurb: 'Bigger water, a proper break, and the confidence to leave the twintip in the bag.',
        rungs: [
          ref('wv-mst-overhead'),
          {
            id: 'sw-reef',
            label: 'A session on a proper point or reef break',
            drill: 'A wave that breaks the same way every time, over something that is not sand. It rewards line choice and punishes everything else. Go with someone who knows the break.',
            kind: 'manual',
          },
          {
            id: 'sw-owned',
            label: 'A whole trip on the wave board only',
            drill: 'No twintip in the bag at all. When the surfboard is the only option you stop treating it as a novelty and start reading conditions like a surfer.',
            kind: 'manual',
          },
        ],
      },
    ],
  },

  // ─── Foiling in 8 knots ─────────────────────────────────────
  {
    id: 'foil-eight',
    name: 'Foiling in 8 Knots',
    discipline: 'Foil',
    tagline: 'Upwind and flying on a day nobody else rigged',
    why: 'A hydrofoil is a wing on a mast under the board — above a certain speed the board lifts clear of the water and you fly on the wing alone. It cuts the wind you need roughly in half. This is the one skill on the list that does not just add moves, it adds days: half the light days currently written off as "no window" become sessions.',
    horizon: 'One focused season. Cheapest elite skill here by a distance, and the only one that pays back in water time rather than trophies.',
    icon: 'foil',
    gates: [
      {
        name: 'Armour and touchdowns',
        blurb: 'A foil is a metre of sharpened aluminium travelling with you. Every rider who has been cut by one was on the session where they decided armour was optional.',
        rungs: [
          {
            id: 'hf-armour',
            label: 'Helmet and impact vest, every foil session',
            drill: 'Not negotiable and not occasional. The mast and wings will find you when you fall, and you will fall constantly for the first ten sessions.',
            kind: 'manual',
          },
          {
            id: 'hf-taxi',
            label: 'Taxi on the surface without flying, both tacks',
            drill: 'Ride with the foil still in the water, weight forward, deliberately keeping it down. Learning to NOT fly is the thing that stops you being launched later.',
            kind: 'manual',
          },
          {
            id: 'hf-touchgo',
            label: 'Controlled touch-and-go: rise, settle, rise again',
            drill: 'Come up, put it back down on purpose, come up again. Front-foot pressure is the whole control system — every correction is smaller than you think.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'Flight',
        blurb: 'Sustained flight, then flight you can steer.',
        rungs: [
          {
            id: 'hf-fly',
            label: 'Sustained 100m flight, both tacks',
            drill: 'Eyes up and far ahead, not at the board. Height is held with tiny front-foot adjustments made early, never with big ones made late.',
            kind: 'manual',
          },
          {
            id: 'hf-upwind',
            label: 'Foil upwind and return to your launch',
            drill: 'A foil goes upwind ferociously well once you stop fighting it. Park the kite high, point higher than feels sane, and let the wing do it.',
            kind: 'manual',
          },
          {
            id: 'hf-transition',
            label: 'Foiling transition without touching down',
            drill: 'Carve through the turn with the board still flying. The moment nobody believes is possible until they do it.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'Light wind',
        blurb: 'Now take it down the wind range, a couple of knots at a time.',
        rungs: [
          {
            id: 'hf-twelve',
            label: 'A full session foiling in 12 kn',
            drill: 'The bottom of the twintip range is the top of the foil range. Same kite you would normally ride, half the effort.',
            kind: 'manual',
          },
          {
            id: 'hf-ten',
            label: 'Foil upwind in 10 kn',
            drill: 'Below ten knots technique starts mattering more than kite size. Smooth, patient kite movements — every hard steer stalls the wing.',
            kind: 'manual',
          },
          {
            id: 'hf-eight',
            label: 'Foil upwind in 8 kn',
            drill: 'Eight knots is a day the whole beach writes off. Long steady sine-waves with the kite, minimal input from the board, and you are the only person on the water.',
            kind: 'manual',
          },
        ],
      },
    ],
  },

  // ─── The long coast ─────────────────────────────────────────
  {
    id: 'jeri-atins',
    name: 'Jericoacoara to Atins',
    discipline: 'Freeride',
    tagline: 'Five days, roughly 300 km, Ceara into Maranhao',
    why: 'The great downwinder — Jeri west through Guriu, Tatajuba and Camocim, across the Piaui coast and into the Lencois Maranhenses at Atins. Days of riding with everything you need in a support truck somewhere behind you. It is not a trick; it is the endurance and self-reliance version of the same mastery, and it is the reason the Brazil leg exists.',
    horizon: 'Bookable the winter after freeride advanced. The gate here is fitness, logistics and nerve rather than technique.',
    icon: 'expedition',
    gates: [
      {
        name: 'Distance legs',
        blurb: 'Long-distance riding is a fitness skill before it is a kite skill. Hands, feet and lower back all fail before the wind does.',
        rungs: [
          ref('fr-adv-downwinder'),
          ref('fr-mst-bigdw'),
          {
            id: 'xp-threehour',
            label: 'Three hours on the water without stopping',
            drill: 'Not three hours of session with breaks — three hours continuously on the board. Find out which part of you gives up first, then train that part.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'Self-reliance',
        blurb: 'On a long coast the nearest help is a fishing village and a phone with no signal.',
        rungs: [
          ref('fr-adv-newspot'),
          {
            id: 'xp-repair',
            label: 'Repair a kite and reline a bar yourself',
            drill: 'Bladder swap, canopy patch, a full set of lines measured and evened out. Do it once at home so you can do it on a beach with a headtorch.',
            kind: 'manual',
          },
          {
            id: 'xp-nav',
            label: 'Navigate a leg by landmark alone',
            drill: 'Plan a downwinder off a map, pick the headlands and towers you will use as marks, then ride it without looking at a phone.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'The coast in stages',
        blurb: 'Ride the route in pieces before riding it end to end.',
        rungs: [
          {
            id: 'xp-jeri-camocim',
            label: 'Jeri to Camocim in a day, about 40 km',
            drill: 'The first real leg of the route: past Guriu and Tatajuba to the Coreau estuary. One buggy shuttle back, one long afternoon.',
            kind: 'manual',
          },
          {
            id: 'xp-multiday',
            label: 'Two downwinder days back to back',
            drill: 'The second day is the whole test. Ride, sleep somewhere rough, wake up stiff, rig up and do it again.',
            kind: 'manual',
          },
        ],
      },
      {
        name: 'The run',
        blurb: 'Everything above, strung together across five days and two states.',
        rungs: [
          ref('fr-mst-anyspot'),
          {
            id: 'xp-atins',
            label: 'Jericoacoara to Atins completed',
            drill: 'Five days, roughly 300 km, river mouths and open coast and the dunes at the end of it. Booked with an outfit the first time — there is no shame in a support truck on a route this long.',
            kind: 'manual',
          },
        ],
      },
    ],
  },
]

// ─── Computation ──────────────────────────────────────────────

export interface EliteGateStatus {
  gate: EliteGate
  met: number
  total: number
  complete: boolean
}

export interface EliteSkillStatus {
  skill: EliteSkill
  met: number
  total: number
  /** Every rung ticked — the skill is landed */
  earned: boolean
  gates: EliteGateStatus[]
  /** First gate still incomplete, for the summary line */
  activeGate: EliteGate | null
}

export function eliteRungs(skill: EliteSkill): PathMilestone[] {
  return skill.gates.flatMap(g => g.rungs)
}

export function computeEliteStatus(
  skill: EliteSkill,
  stats: KiteStats,
  milestones: Record<string, boolean>
): EliteSkillStatus {
  const gates: EliteGateStatus[] = skill.gates.map(gate => {
    const met = gate.rungs.filter(r => isMilestoneMet(r, stats, milestones)).length
    return { gate, met, total: gate.rungs.length, complete: met === gate.rungs.length }
  })
  const met = gates.reduce((s, g) => s + g.met, 0)
  const total = gates.reduce((s, g) => s + g.total, 0)
  return {
    skill,
    met,
    total,
    earned: met === total,
    gates,
    activeGate: gates.find(g => !g.complete)?.gate ?? null,
  }
}

/**
 * The next rungs of a chosen ladder, shaped like the normal Next Up cards.
 *
 * Gates are ordered, so this walks them in order and takes the first unmet
 * rungs it finds — which keeps the beach working on the airframe long before
 * it starts thinking about the move at the top.
 */
export function eliteNextMilestones(
  skill: EliteSkill,
  stats: KiteStats,
  milestones: Record<string, boolean>,
  n = 4
): NextMilestone[] {
  const out: NextMilestone[] = []
  for (const gate of skill.gates) {
    for (const rung of gate.rungs) {
      if (isMilestoneMet(rung, stats, milestones)) continue
      out.push({
        source: gate.name,
        pathId: 'elite',
        milestone: rung,
        queued: out.length > 0,
      })
      if (out.length >= n) return out
    }
  }
  return out
}

export function getEliteSkill(id: string): EliteSkill | null {
  return ELITE_SKILLS.find(s => s.id === id) ?? null
}
