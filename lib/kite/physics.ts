/**
 * The Physics of Kiteboarding — question log.
 *
 * Every question asked about why the wind or the kite behaves the way it does,
 * with the answer that made it click. This is the raw material for the book:
 * each entry carries the chapter it will feed, so the log can be read back
 * later as a draft outline. Newest questions go at the top.
 */

export type PhysicsBlock =
  | { kind: 'p'; heading?: string; text: string }
  | { kind: 'list'; heading?: string; items: string[] }
  | { kind: 'table'; heading?: string; head: string[]; rows: string[][] }

export interface PhysicsEntry {
  slug: string
  /** YYYY-MM-DD the question came up */
  asked: string
  question: string
  /** Book chapter this answer feeds */
  chapter: string
  /** One-line answer, read before the long one */
  short: string
  blocks: PhysicsBlock[]
}

export const PHYSICS_CHAPTERS = ['Wind & the atmosphere', 'Forecasts & models'] as const

export const PHYSICS_ENTRIES: PhysicsEntry[] = [
  {
    slug: 'stable-air-over-cool-water',
    asked: '2026-10-01',
    question: 'What does "stable air over cool water" mean?',
    chapter: 'Wind & the atmosphere',
    short:
      'It is about whether the air near the surface gets stirred up and down — and stirring is what makes gusts.',
    blocks: [
      {
        kind: 'p',
        heading: 'Where gusts come from',
        text:
          'Wind is faster higher up, because the surface slows the bottom layer through friction. A gust is a pocket of that faster air from higher up getting mixed down to the water. More up-and-down mixing means gustier wind at the surface.',
      },
      {
        kind: 'p',
        heading: 'Stable air: little mixing',
        text:
          'When the air is warmer than the water under it, the water cools the bottom layer of air. Cool air is heavier, so it stays put at the bottom and resists being stirred — like oil sitting on water. Fast air from above rarely reaches the surface, so the wind you feel is smooth with few gusts. Warm air over cool water is the textbook case.',
      },
      {
        kind: 'p',
        heading: 'Unstable air: lots of mixing',
        text:
          'The opposite case is cold air over warmer water, or over land heated by the sun. The bottom layer warms, gets lighter and rises, and faster air drops down to replace it. That churning gives punchy, gusty wind.',
      },
      {
        kind: 'table',
        heading: 'NYC in the fall',
        head: ['Situation', 'Air vs. water', 'What you feel'],
        rows: [
          ['Warm southerly day', 'Air warmer than water — stable', 'Smooth, steady, often a bit lighter at the beach than forecast'],
          ['After a cold front, NW wind', 'Cold air over warmer water — unstable', 'Strong and gusty — the post-frontal NW day, the strongest wind of the rotation'],
        ],
      },
      {
        kind: 'list',
        heading: 'On the water',
        items: [
          'Stable days: smooth and easy to ride, but the wind sometimes does not fully reach the surface. A 14 kn forecast can feel like 11 kn.',
          'Unstable days: the gust number matters more than the average. Size the kite for the gusts.',
        ],
      },
    ],
  },
  {
    slug: 'gusts-below-wind',
    asked: '2026-10-01',
    question: 'How can 14 knots of wind have gusts lower than that?',
    chapter: 'Forecasts & models',
    short:
      'It cannot. A gust is the strongest burst within the hour, so it is never below the average — a lower number is a forecast-model artifact.',
    blocks: [
      {
        kind: 'p',
        heading: 'What a gust is',
        text:
          'The wind speed in a forecast is the average over a short period; the gust is the peak burst within the hour. By definition the peak cannot sit below the average.',
      },
      {
        kind: 'p',
        heading: 'Why the model said otherwise',
        text:
          'GFS computes average wind and gusts as two separate calculations. Its gust is roughly the average wind plus an allowance for how much stirring it expects in the air. In stable air it expects almost none, so the allowance is near zero — and because the two calculations are slightly out of sync, the gust can land a little under the average. For Rockaway in the first week of October, 30 of 168 hours came back that way (13.8 kn wind, 10.3 kn gusts).',
      },
      {
        kind: 'p',
        heading: 'How to read it',
        text:
          'Gust equal to (or just under) the wind means steady air with no real gusts on top. The /wind page now floors gusts at the wind speed so the number reads honestly.',
      },
    ],
  },
]
