/**
 * Belgrade 70.3 — the race debrief, as data.
 *
 * Written from the FIT files and the bike computers rather than the Connect
 * summary, which is why several numbers here disagree with Garmin's own: the
 * swim timer ran 5:44 past the water, the activity load double-counts the
 * Edge recording of the same bike leg, and the calorie model is heart-rate
 * driven on two athletes who raced well below the heart rate their work rate
 * implies. Each disagreement is stated where it occurs rather than quietly
 * corrected.
 *
 * Structured as two lenses over one race. Aidas is scored against a written
 * plan (IRONMAN_PREP.md, re-cut five times in the final three weeks); Lori has
 * no written plan, so the honest baseline is her own logged sessions. They are
 * different questions and they produce different tables, which is the reason
 * the page toggles between them rather than laying them side by side.
 */

export type Lens = 'lori' | 'aidas'

export const DEBRIEF_RACE = {
  name: 'MTS Ironman 70.3 Belgrade',
  venue: 'Ada Ciganlija',
  date: '2026-09-13',
  swimKm: 1.9,
  bikeKm: 88.1,
  runKm: 21.1,
  waterC: 24,
  airFromC: 17,
  airToC: 28,
  start: 'rolling self-seeded',
} as const

export interface LegLine {
  leg: string
  aidasSec: number
  loriSec: number
}

const m = (min: number, sec = 0) => min * 60 + sec
const h = (hr: number, min: number, sec = 0) => hr * 3600 + min * 60 + sec

/** The race on one clock. Gap is Lori minus Aidas; negative is time she gained. */
export const LEGS: LegLine[] = [
  { leg: 'Swim', aidasSec: m(50, 38), loriSec: m(45, 21) },
  { leg: 'T1', aidasSec: m(9, 25), loriSec: m(7, 34) },
  { leg: 'Bike', aidasSec: h(2, 48, 26), loriSec: h(3, 25, 45) },
  { leg: 'T2', aidasSec: m(3, 54), loriSec: m(10, 38) },
  { leg: 'Run', aidasSec: h(2, 2, 3), loriSec: h(2, 22, 56) },
]

export const OFFICIAL = { aidasSec: h(5, 53, 53), loriSec: h(6, 51, 42) }
/** Official finish gap — 57:49. Leg splits sum 32–33s long against it. */
export const GAP_SEC = OFFICIAL.loriSec - OFFICIAL.aidasSec

export const ATHLETE = {
  aidas: { name: 'Aidas', kg: 100.5, finish: OFFICIAL.aidasSec },
  lori: { name: 'Lori', kg: 55.7, finish: OFFICIAL.loriSec },
} as const

// ── The two lenses ────────────────────────────────────────────────────────

export interface LensCard {
  /** The one sentence that survives if nothing else is read */
  headline: string
  /** What the finish is measured against, and how it landed */
  standard: string
  verdict: string
}

/** A scoring row: what was expected, what happened, how it landed */
export interface ScoreRow {
  leg: string
  expected: string
  stretch?: string
  actual: string
  verdict: string
  tone: 'ok' | 'warn' | 'crit' | 'none'
}

/** A place time was lost or gained, ranked by what it cost */
export interface Finding {
  tag: string
  title: string
  body: string[]
}

export interface Lever {
  lever: string
  worth: string
  cost: string
  why: string
}

export interface OpenQuestion {
  n: string
  who: Lens | 'both'
  question: string
  why: string
}

export interface LensAnalysis {
  card: LensCard
  scoreTitle: string
  scoreNote: string
  score: ScoreRow[]
  findings: Finding[]
  levers: Lever[]
  /** Deliberately absent from the levers, and why */
  notOnTheList?: string
}

export const LENSES: Record<Lens, LensAnalysis> = {
  lori: {
    card: {
      headline: 'A race run off a base that had never seen the distance.',
      standard: 'Her own logged sessions — there is no written plan to score against.',
      verdict:
        'Fastest swim of the two by 5:17, then a 21.1 km run off a 9.64 km longest run. Her fastest leg and her hardest one, in that order.',
    },
    scoreTitle: 'Race day against the best comparable session',
    scoreNote:
      'Every leg was at or beyond anything she had done in the block. The multiple in the last column is race distance over training distance.',
    score: [
      {
        leg: 'Swim 1.9 km',
        expected: '2:37/100m pool, HR 138 (Sep 9)',
        actual: '45:21 — 2:23/100m, HR 162',
        verdict: 'faster than any pool pace on record',
        tone: 'ok',
      },
      {
        leg: 'Bike 90.2 km',
        expected: '96.9 km, 23.5 km/h, 89 W (Aug 26)',
        actual: '90.2 km, 26.3 km/h, 98 W',
        verdict: 'best bike of her life, +1.5 km/h at 12 bpm lower',
        tone: 'ok',
      },
      {
        leg: 'Run 21.1 km',
        expected: '9.64 km at 6:13/km (Sep 3)',
        actual: '21.1 km at 6:46/km',
        verdict: '2.2x her longest run',
        tone: 'warn',
      },
    ],
    findings: [
      {
        tag: '−33%',
        title: 'The bike opened above cycling threshold and decayed for three and a half hours',
        body: [
          'The first fifteen minutes were ridden at 118 W with heart rate at 164 bpm — above her stored cycling lactate-threshold HR of 161, and 89% of her maximum. By minute 165 she was at 79 W and 134 bpm. Power fell a third, heart rate fell 18% with it. Power and heart rate falling together is an engine that is not being fed.',
          'The opening is the actionable half. She came out of the water at HR 162 and got straight on the bike without letting it settle. Aidas has the same spike, but his decays inside twenty minutes because his opening power was closer to his sustainable one.',
        ],
      },
      {
        tag: '5:44',
        title: "Five minutes of swim were hidden inside a timer nobody stopped",
        body: [
          'On the raw files the swims look like a dead heat — 50:38 against 51:01. Her watch kept the swim running 5 minutes 44 seconds after she left the water: speed jumps 0.73 → 2.92 m/s, cadence 28 → 68, altitude appears for the first time and climbs 83 → 91 m, heart rate spikes to 174 then collapses to 85 while she stands still. 412 metres of her "swim" were run and walked.',
          'Cut at the real exit, the two files agree on the course to within 9 metres — 1,805 m for Aidas, 1,814 m for her. The 27% distance disagreement was never a disagreement; it was the run-out. Her swim was 45:21 and her T1 a normal 7:34.',
          'This is not a pacing difference. His swim averaged 154 bpm, 83% of his maximum; hers 162, 87% of hers. She covered the same 1,810 m 10% faster at 28 strokes/min against his 26. The gap is stroke economy.',
        ],
      },
      {
        tag: '−54 s/km',
        title: 'The run is the one leg that has gone backwards',
        body: [
          '6:46/km today against 5:52/km at Kotor and 6:15/km at Wilmington. Only Santurce, her first, was slower. The heart rate tells it from the other side: she ran Wilmington at 154 bpm and Kotor at 160, and ran today at 142. She was not limited by her heart or her lungs — she ran 21 minutes slower than her best while working significantly less hard.',
          'Kilometre 1 came in at 5:44/km, faster than her best standalone 10 km pace of 6:13/km. From there the leg decayed one kilometre at a time to 7:06 by km 8, and stride length fell 20% while cadence held — a runner whose muscles, not lungs, are running out. Then the last three kilometres went 6:26, 6:27, 6:03 with heart rate rising to 156.',
          'Stride collapse at held cadence is a strength-endurance signal, not an aerobic one. It is exactly what a 9.64 km longest run predicts, and it is the clearest single argument for what the next block should contain.',
        ],
      },
      {
        tag: '18:12',
        title: 'The transitions were the worst of her five races',
        body: [
          'T1 and T2 together: Haines City 12:11, Wilmington 13:04, Santurce 15:01, Kotor 17:24, Belgrade 18:12. T2 alone was 10:38 over a 507 m walk — longer than the transition that involved getting out of the lake, and nearly three times Aidas\'s.',
          'Against a field where a 70.3 T2 is typically two to four minutes, five or six minutes of that is recoverable with no fitness change at all. It is the cheapest time on either athlete\'s list.',
          'Put together: strip Belgrade\'s transitions back to her own Haines City standard and today reads 6:45:41. Give the run back the 6:15/km she held at Wilmington and it reads 6:34:00 — a personal best on an honest swim, with no change to the bike at all.',
        ],
      },
    ],
    levers: [
      {
        lever: 'Long runs — 12, 15, 18 km',
        worth: '~10–15 min',
        cost: 'a real block',
        why: 'A 20% stride collapse at held cadence, with the heart rate to finish on top, is a durability gap rather than an aerobic one. Nothing else on this list is worth as much.',
      },
      {
        lever: "Cap the bike's opening heart rate",
        worth: '~5–10 min',
        cost: 'free',
        why: 'The first 15 minutes went out above cycling threshold at HR 164. Everything downstream decayed from there.',
      },
      {
        lever: 'Bike fuelling, deliberately',
        worth: '~5 min',
        cost: 'planning',
        why: 'Power and heart rate fell together across three and a half hours — the same signature as the Aug 26 bonk, over a longer leg.',
      },
      {
        lever: 'T2 drill',
        worth: '~5 min',
        cost: 'free',
        why: '10:38 on a 507 m walk — longer than her T1, and the cheapest minutes on either list.',
      },
      {
        lever: 'Get a bike-specific FTP number',
        worth: 'enables the above',
        cost: 'one test',
        why: 'The Edge is carrying FTP 151 W and scored the race at IF 0.686 — an easy ride, which is not what a 33% power decay over 165 minutes describes.',
      },
    ],
    notOnTheList:
      'The swim, deliberately. It is already her strongest leg by five minutes, and nothing there would improve faster than the run and bike items above.',
  },
  aidas: {
    card: {
      headline: 'The plan was right about almost everything.',
      standard: 'IRONMAN_PREP.md — a race-day table re-cut five times in the final three weeks.',
      verdict:
        '12:07 inside the plan\'s measured band of 6:06–6:29, and 1:53 outside its 5:47–5:52 stretch. Swim beat the stretch target; run landed in it.',
    },
    scoreTitle: 'Race day against the written bands',
    scoreNote:
      'Two of the three legs beat a band the plan had spent six weeks fitting, and the third landed mid-band. The document\'s one systematic error was under-rating the swim, which it flagged itself.',
    score: [
      { leg: 'Swim 1.9 km', expected: '59–61', stretch: '55:00', actual: '50:38', verdict: 'beat the stretch by 4:22', tone: 'ok' },
      { leg: 'T1 — full change', expected: '8–10', actual: '9:25', verdict: 'mid-band', tone: 'none' },
      { leg: 'Bike 88.1 km', expected: '2:44–2:52', stretch: '2:40', actual: '2:48:26', verdict: 'mid-band', tone: 'none' },
      { leg: 'T2 — shoes and helmet', expected: '3:00', actual: '3:54', verdict: '+54 s', tone: 'warn' },
      { leg: 'Run 21.1 km', expected: '2:10–2:21', stretch: '2:00–2:05', actual: '2:02:03', verdict: 'inside the stretch · new HM PR', tone: 'ok' },
      { leg: 'Finish', expected: '6:06–6:29', stretch: '5:47–5:52', actual: '5:53:53', verdict: '12:07 under band', tone: 'ok' },
    ],
    findings: [
      {
        tag: 'the bike',
        title: 'He rode the number and missed the shape',
        body: [
          '216 W average, 219 NP, variability index 1.014 — on paper a flawless execution of the 215–220 W instruction. The instruction had a second half that was not executed: "Ride the first 20 km at 195–205 W, deliberately under, and let it settle to 215–220 W once the swim adrenaline is gone." The first 20 km were ridden at 231 W, 26 to 36 watts over. The last 15 km came in at 181–194 W. The average between them is exactly right and describes a race nobody rode.',
          'The fade is real, not a drifting meter. Both laps are the same 44.04 km of the same road, and the ratio of power to the cube of speed — fixed by aerodynamics, not fitness — is identical to within 1%. He produced 27 fewer watts on the second lap and lost 1.1 km/h for it.',
          'A bike ridden at a flat 216 W — the same average, just without the fast start and the fade — models at 2:45:56 on the day\'s own fitted aerodynamics, 2:30 quicker. That alone puts the finish at 5:51:23, inside the stretch band with half a minute to spare. Nothing about the swim or the run needed to change.',
        ],
      },
      {
        tag: 'fuel',
        title: 'The power trace has a 65-minute hole in it',
        body: [
          'Power falling with heart rate is an engine that is not being fed; power falling while heart rate holds is ordinary fatigue or heat. This race gives both answers in sequence. The first hour is adrenaline settling — HR 155 → 137 while power stays near 210 W. From minute 60 heart rate is flat at 137–140 and power keeps sliding. Then minute 120–135 collapses to 184 W with 8.4% coasting, well outside that trend.',
          'Scanning for sustained low-power, low-cadence windows gives three likely feeds — minutes 42, 60 and 125 — against a "first feed inside 20 minutes" rule, with a 65-minute gap between the second and third, and the power collapse landing at the end of that gap.',
          '216 W for 10,106 seconds is 2,183 kJ, which at 23% gross efficiency is roughly 2,200 kcal or 810 kcal/h — the identical burn rate measured on the Aug 26 ride. The fuelling plan was 75–80 g/h: two 60 g bottles and three gels. Three feeds is not three bottles and three gels.',
          'Caveat worth stating plainly: these feeds are inferred from the power trace, not measured. A bottle taken at 32 km/h without dropping cadence leaves no signature at all, so the real count may be higher. The 65-minute gap is a hypothesis the trace supports, not a fact.',
        ],
      },
      {
        tag: 'the run',
        title: 'A half-marathon PB, set off a 90 km bike, in 28 °C',
        body: [
          '2:02:03 at 5:47/km. Thirty-one days earlier, fresh and on a flat course, the standalone half took 2:11:42. The plan\'s central bet — that a man who had run six times in a year could be brought to 21.1 km off the bike — gave its 2:00–2:05 stretch 40–50% odds. He ran 9 minutes 39 seconds faster than his standalone half a month earlier, with 90 km of riding already in his legs.',
          'Nothing broke, and that is the finding. Cadence opened at 174 spm and settled at 163–167 for twenty kilometres, never touching the 163 floor. Stride length went 1,111 → 1,055 mm, a 5% loss. Speed-to-heart-rate decoupling over the leg was −1.0%, the flattest of any run in the block including the standalone ones. Ground contact crept 278 → 296 ms, the only marker that moved at all.',
          'He almost certainly left time out there. Average heart rate on the run was 149 bpm — 80% of max, the floor of Z3 — against a plan that explicitly permitted Z3\'s full 147–156 from km 5. The final kilometre was run at 5:31 with heart rate at 155, the highest reading of the leg after five and a half hours of racing. Across the whole race only 2.5% of samples sat above Z3.',
        ],
      },
      {
        tag: '301 W',
        title: 'The watch changed his FTP six days before the race',
        body: [
          'IRONMAN_PREP.md audited the 288 W setting on 26 August and instructed in writing: "Leave it alone through the race — every pacing number in this document is expressed against 288." The 12 September shakedown auto-updated it to 301.',
          'This is not cosmetic, because the zone display moves with it. The Z2 endurance band was 161–216 W at FTP 288. At 301 it becomes 169–226 W — and the 231 W actually ridden for the first 20 km reads as IF 0.77, mid-Z2, on the device, where against 288 it would have read 0.80 and sat in Z3. The head unit was quietly telling him the hot start was an endurance-pace effort.',
          'Nothing in the record supports 301. It implies about 316 W for twenty minutes; the best twenty minutes on record is 242.8 W, set on 7 September. Set it back to 288 and turn auto-detect off.',
        ],
      },
    ],
    levers: [
      { lever: 'Feed the bike on a timer', worth: '~2–4 min', cost: 'one Edge setting', why: 'A 15-minute repeating alert. The trace implies three feeds against a plan of two bottles and three gels.' },
      { lever: 'Ride the prescribed opening', worth: '~2–3 min', cost: 'discipline only', why: '231 W for the first 20 km against a 195–205 instruction. A flat 216 W models at 2:45:56.' },
      { lever: 'Let the run reach Z3', worth: '~2–5 min', cost: "risk, if the fuel isn't fixed", why: 'HR 149 average against a permitted 156, a negative split, and the fastest finish of the leg.' },
      { lever: 'Declare the swim honestly', worth: 'seeding, not time', cost: 'free', why: 'Declared 60, swam 50:38, crossed the mat 31 minutes after the gun and spent the leg overtaking. Declare 52–55.' },
      { lever: 'T2 drill', worth: '~1 min', cost: 'free', why: '3:54 against a 3:00 band for a shoes-and-helmet transition.' },
      { lever: 'Swim technique', worth: 'real, but slow', cost: 'high', why: 'Still the slowest leg by rank. Lori covered the same water 10% faster at the same fraction of max HR — stroke economy is a long project.' },
    ],
  },
}

// ── Energy budget ─────────────────────────────────────────────────────────

export interface EnergyRow {
  leg: string
  aidas: string
  aidasRate: string
  lori: string
  loriRate: string
  method: string
}

/**
 * Rebuilt from published equations rather than Garmin's heart-rate model —
 * power and gross efficiency on the bike, the ACSM running equation on the
 * run, compendium METs in the water. Garmin is short by roughly a quarter for
 * both athletes, consistently, because both raced at heart rates well below
 * what their actual work rate implies.
 */
export const ENERGY: EnergyRow[] = [
  { leg: 'Swim', aidas: '800–890', aidasRate: '950–1,055/h', lori: '420–465', loriRate: '555–615/h', method: 'Compendium METs for crawl (9–10.5). The softest leg.' },
  { leg: 'T1', aidas: '87', aidasRate: '—', lori: '30', loriRate: '—', method: 'Jog distance at resting metabolic rate.' },
  { leg: 'Bike', aidas: '2,170–2,370', aidasRate: '775–845/h', lori: '1,210–1,320', loriRate: '350–385/h', method: 'The solid one — measured work (2,183 kJ) over gross efficiency of 22–24%.' },
  { leg: 'T2', aidas: '32', aidasRate: '—', lori: '39', loriRate: '—', method: 'As T1.' },
  { leg: 'Run', aidas: '2,330', aidasRate: '1,145/h', lori: '1,315', loriRate: '550/h', method: 'ACSM level-running equation, 0.2 x speed + 3.5.' },
]

export const ENERGY_TOTAL = {
  aidas: '5,430–5,710',
  aidasRate: '945/h',
  lori: '3,010–3,170',
  loriRate: '450/h',
  note: 'Garmin says 4,146 and 2,268 — short by 26% and 27%.',
}

export const CARB_BUDGET = [
  { source: 'Muscle + liver glycogen', planned: '~670 g', actual: '~670 g', note: '~15 g per kg of muscle on ~38 kg. Generous rather than conservative.' },
  { source: 'Breakfast, 3 h out', planned: '~100 g', actual: '~100 g', note: 'Per the plan\'s "normal breakfast".' },
  { source: 'Bike', planned: '195 g', actual: '120–150 g', note: 'Two 60 g bottles + three gels, versus what the trace suggests went down.' },
  { source: 'Run aid stations', planned: '~100 g', actual: '~100 g', note: 'Every station, per rule 4.' },
  { source: 'Available', planned: '~1,065 g', actual: '~890–920 g', note: 'Against a requirement of ~905 g.' },
]

// ── Training load ─────────────────────────────────────────────────────────

export interface TrimpRow {
  leg: string
  aidas: number
  aidasPerHour: number
  aidasHrr: string
  lori: number
  loriPerHour: number
  loriHrr: string
}

/**
 * Banister's TRIMP from each athlete's own resting and maximum heart rate.
 * Garmin's own scores for this race either saturate — Aerobic Training Effect
 * tops out at 5.0, which Lori reached in the water 45 minutes into a 6:52
 * race — or double-count, since the multisport activity and the Edge recording
 * of the same bike leg are both logged.
 */
export const TRIMP: TrimpRow[] = [
  { leg: 'Swim', aidas: 122, aidasPerHour: 145, aidasHrr: '80%', lori: 130, loriPerHour: 172, loriHrr: '83%' },
  { leg: 'T1', aidas: 18, aidasPerHour: 112, aidasHrr: '72%', lori: 17, loriPerHour: 134, loriHrr: '75%' },
  { leg: 'Bike', aidas: 299, aidasPerHour: 107, aidasHrr: '71%', lori: 433, loriPerHour: 126, loriHrr: '73%' },
  { leg: 'T2', aidas: 4, aidasPerHour: 61, aidasHrr: '55%', lori: 15, loriPerHour: 86, loriHrr: '61%' },
  { leg: 'Run', aidas: 262, aidasPerHour: 129, aidasHrr: '77%', lori: 269, loriPerHour: 113, loriHrr: '69%' },
]

export const TRIMP_TOTAL = { aidas: 705, aidasPerHour: 119, lori: 863, loriPerHour: 125 }

export const TRAINING_STATUS = [
  { who: 'Aidas', acuteBefore: 692, acuteAfter: 1055, chronic: '903 → 966', form: '+211 → −89', read: 'A well-tapered athlete who has just done a very large day. Acute load up 52%.' },
  { who: 'Lori', acuteBefore: 498, acuteAfter: 1011, chronic: '619 → 713', form: '+121 → −298', read: 'Acute load more than doubled in one day. The race is a far larger outlier against her training history, and the recovery cost is correspondingly larger.' },
]

// ── Her five half-irons ───────────────────────────────────────────────────

export interface HistoryRow {
  race: string
  date: string
  swim: string
  swimPace: string
  t1: string
  bike: string
  bikeSpeed: string
  t2: string
  run: string
  runPace: string
  total: string
  note?: string
}

/**
 * Device-derived splits across all five, so they compare on one basis. Swim
 * paces are computed on the official 1,900 m for every race, so the watches'
 * varying distances do not distort the comparison; bike speeds use each
 * watch's own recorded distance.
 */
export const HISTORY: HistoryRow[] = [
  { race: 'Santurce, Puerto Rico', date: '2022-03-20', swim: '49:05', swimPace: '2:35/100m', t1: '7:16', bike: '3:47:44', bikeSpeed: '23.1 km/h', t2: '7:45', run: '2:43:34', runPace: '7:51/km', total: '7:35:22' },
  { race: 'Wilmington, North Carolina', date: '2022-10-15', swim: '37:02', swimPace: '1:57/100m', t1: '8:03', bike: '3:40:08', bikeSpeed: '24.8 km/h', t2: '5:01', run: '2:11:26', runPace: '6:15/km', total: '6:41:40', note: 'tidal swim' },
  { race: 'Haines City, Florida', date: '2022-12-11', swim: '59:26', swimPace: '3:08/100m', t1: '5:59', bike: '3:45:11', bikeSpeed: '24.0 km/h', t2: '6:12', run: '2:24:53', runPace: '7:00/km', total: '7:21:41' },
  { race: 'Kotor, Montenegro', date: '2023-05-14', swim: 'not recorded', swimPace: '—', t1: '10:01', bike: '3:39:58', bikeSpeed: '24.3 km/h', t2: '7:23', run: '2:01:33', runPace: '5:52/km', total: '5:59:04', note: 'no swim in it' },
  { race: 'Belgrade', date: '2026-09-13', swim: '45:21', swimPace: '2:23/100m', t1: '7:34', bike: '3:25:45', bikeSpeed: '26.3 km/h', t2: '10:38', run: '2:22:56', runPace: '6:46/km', total: '6:51:42' },
]

export const KOTOR_CAVEAT =
  'Kotor is not a 5:59 half-iron, and the file says so plainly: its swim session is nine seconds and sixteen metres, at heart rate 95, moving at a dead-constant 1.55 m/s — a walk, not a swim. The record stream then runs unbroken to the finish, so the watch was simply started in transition. Its bike and run are real and excellent; the total is a duathlon and should never be quoted as a personal best.'

// ── What the files can't say ──────────────────────────────────────────────

export const OPEN_QUESTIONS: OpenQuestion[] = [
  { n: '01', who: 'both', question: 'What were the official per-leg splits?', why: 'The finishes are settled. The legs are reconstructed — her swim/T1 boundary from the exit ramp in the trace, her bike/T2 boundary from the Edge. The chip\'s five splits would confirm all of it, and settle whether the swim course really is the ~1,810 m both watches measured rather than 1,900.' },
  { n: '02', who: 'aidas', question: 'Where is the race-day Edge file?', why: 'Only the watch\'s multisport reached Connect; the Edge 530 has no 13 September activity. Worth syncing, though it will not move much: on every paired ride, watch and Edge agree to within one watt.' },
  { n: '03', who: 'aidas', question: 'What did you actually eat on the bike, and when?', why: 'The trace shows three likely feeds, at minutes 42, 60 and 125. If that is real it is the biggest single finding of the race. If you were sipping every fifteen minutes without dropping cadence, the fade has a different cause and the whole fuelling section is wrong.' },
  { n: '04', who: 'aidas', question: 'On the run, could you have gone harder from km 5?', why: 'Heart rate averaged 149 against a permitted ceiling of 156, and the last kilometre was the second-fastest of the leg. Deliberate hold, or was 5:47/km simply what the legs would give?' },
  { n: '05', who: 'both', question: 'Was there GI trouble, cramping or chafing?', why: 'Three race-week decisions hang on it: the thinner chamois run in for 21.1 km, the 80 g/h target never rehearsed above 65, and a T2 running 54 seconds long.' },
  { n: '06', who: 'lori', question: 'What took ten and a half minutes in T2?', why: 'T1 was a clean 7:34. T2 was 10:38 over 507 m — longer than the transition that involved getting out of the water. Five or six minutes is sitting there for free.' },
  { n: '07', who: 'lori', question: 'Did you draft on the swim, and do you know the pool lengths you train in?', why: '2:23/100m is fourteen seconds per hundred faster than your best recorded pool pace. Either the swim was exceptional, the course is short, or the pool distances are inflated — this repo already flags phantom wall counts on your profile.' },
  { n: '08', who: 'lori', question: 'What happened at km 13 of the run?', why: 'A 2:41 stop, heart rate down to 129, then a strong finish. Aid station, toilet, cramp, or a genuine low?' },
  { n: '09', who: 'lori', question: 'What did you eat and drink on the bike?', why: 'Power fell 33% with heart rate falling 18% alongside it — the same signature as the Aug 26 bonk, spread over three and a half hours.' },
  { n: '10', who: 'aidas', question: 'How was the swim itself?', why: 'Drafting, getting swum over, sighting, any switches to breaststroke. You beat the stretch target by four and a half minutes and the file cannot say why.' },
  { n: '11', who: 'both', question: 'Did the bike course measure two laps of 44 km on your computers?', why: 'You recorded 90.75 km and Lori 90.22 against an advertised 88.1 — both over by the same 2.4%, probably GPS, but worth confirming.' },
]
