/**
 * Chess campaign — 900 to 2000 Chess.com rapid, the bar set for the
 * Williamsburg A Team (picked on a rating floor).
 *
 * Two horizons in one ladder. Block I is a fifteen-day sprint to the October
 * 24 tournament, where the rating will barely move and the performance can:
 * at 900 the points are in not hanging pieces, and that is trainable in two
 * weeks. The 900 is self-estimated from Chess.com play, so unit 1.1 turns it
 * into a real rapid rating first. Blocks II–V are dated to the 10-hours-a-week line of the model in
 * lib/chess/model.ts — the fast end of the 5–10 hour range, so a block that
 * runs behind is an honest read that the week is closer to five.
 *
 * The daily ritual is the floor: twenty minutes of tactics, calculated to the
 * end, every day. Everything else in the week is the ladder.
 *
 * Editing rules: unit `id` values are Firestore keys — never renumber or
 * reuse one. Everything else is free to rewrite.
 */

import type { Campaign } from './types'

export const CHESS_CAMPAIGN: Campaign = {
  id: 'chess',
  name: 'Chess',
  lane: '900 to 2000 Chess.com rapid — the Williamsburg A Team bar, one blunder check at a time',
  destination: {
    label: '2000 rapid · A Team bar (10h/wk line)',
    sub: 'Williamsburg A Team — rating floor, 2000 on Chess.com rapid',
    date: '2030-07-20',
  },
  href: '/chess',
  sessionsPerDay: 1,
  ritual: {
    id: 'chess-tactics',
    label: 'Tactics floor',
    detail: 'Twenty minutes, every day. Untimed, and every line calculated to the end before the first move is made — speed comes later and on its own.',
    cadence: 'daily',
    steps: [
      '20 min of puzzles — calculate the whole line before moving',
      'Every miss: write the motif you did not see',
      'Before any game today: say checks, captures, threats — out loud',
    ],
  },
  blocks: [
    {
      id: 'ch-sprint',
      numeral: 'I',
      name: 'Tournament Sprint',
      start: '2026-10-09',
      end: '2026-10-24',
      aim: 'Walk into Williamsburg playing to your real strength: no free pieces, a repertoire you can play from memory, and the clock and scoresheet already familiar.',
      gate: 'Every round played and every game recorded; no piece hung in one move in at least half the games.',
      units: [
        {
          id: 'ch-1-01',
          code: '1.1',
          label: 'Turn the self-estimated 900 into a real Chess.com rapid rating',
          detail: 'Ten rated rapid games at 15+10 or longer, blunder check on every move, then log the number on /chess as Chess.com rapid. Everything on this ladder is measured from that number, not the estimate.',
          sessions: 3,
          key: true,
        },
        {
          id: 'ch-1-02',
          code: '1.2',
          label: 'Register for October 24',
          detail: 'Entry confirmed, section chosen, and whatever membership the event requires (often USCF for a rated tournament). Done when the confirmation is in your inbox.',
          key: true,
        },
        {
          id: 'ch-1-03',
          code: '1.3',
          label: 'Tag your last 20 losses by cause',
          detail: 'For each: hung piece, missed tactic, time, or no plan — one word per game, no engine until the tag is written. The tally decides where the next two weeks go.',
        },
        {
          id: 'ch-1-04',
          code: '1.4',
          label: 'Install the blunder check — five 15+10 games, said out loud',
          detail: 'Before every move: what does their last move attack, and what does mine leave undefended? Done when five games are played with the check on every move, win or lose.',
          sessions: 2,
          key: true,
        },
        {
          id: 'ch-1-05',
          code: '1.5',
          label: 'One-page repertoire: a White first move and two Black replies',
          detail: 'One opening as White, one reply to 1.e4, one to 1.d4 — first six moves and the plan after them, on one sheet. Simple and sound beats sharp and half-known.',
          sessions: 2,
        },
        {
          id: 'ch-1-06',
          code: '1.6',
          label: 'Endgame minimum: K+Q and K+R mates, and the opposition',
          detail: 'Both mates against a computer inside the move limit, three times each, and king-and-pawn opposition positions solved without hesitation.',
          key: true,
        },
        {
          id: 'ch-1-07',
          code: '1.7',
          label: 'Three long games at the tournament time control',
          detail: 'Played on a physical board if you can, with a clock and a scoresheet. Analyse each one yourself before the engine — the engine only checks your notes.',
          sessions: 3,
        },
        {
          id: 'ch-1-08',
          code: '1.8',
          label: 'Taper and pack — Oct 22–23 light puzzles only',
          detail: 'No new openings in the last 48 hours. Bag: scoresheet, two pens, clock if the event asks for one, water, food for between rounds. Sleep is preparation.',
        },
        {
          id: 'ch-1-09',
          code: '1.9',
          label: 'Play Williamsburg — record every move of every round',
          detail: 'The result is the tournament\'s business. Yours is the blunder check on every move and a complete scoresheet for every game.',
          key: true,
        },
      ],
    },
    {
      id: 'ch-blunder',
      numeral: 'II',
      name: 'Blunder-Proof',
      start: '2026-10-25',
      end: '2027-03-07',
      aim: '900 to 1200 rapid. The points at this level come from not giving them away: one-move safety, instant basic tactics, the basic endgames.',
      gate: 'Ten consecutive long games with no piece hung in one move, and Chess.com rapid at or above 1200.',
      units: [
        {
          id: 'ch-2-01',
          code: '2.1',
          label: 'Annotate every Williamsburg game within 48 hours',
          detail: 'Your thoughts first, then the engine. For each loss, the single move that lost it and why you played it.',
          key: true,
        },
        {
          id: 'ch-2-02',
          code: '2.2',
          label: 'Find a coach and book a first lesson',
          detail: 'A coach who will look at your games, not teach you openings. Monthly is enough at this stage; the first lesson is the review of Williamsburg.',
          key: true,
        },
        {
          id: 'ch-2-03',
          code: '2.3',
          label: 'Chess Steps 2 workbook, cover to cover',
          detail: 'Every exercise, written answers, misses re-done a week later.',
          sessions: 8,
        },
        {
          id: 'ch-2-04',
          code: '2.4',
          label: 'Silman Class E and D endgames',
          detail: 'Every position set up on a board and played out against the engine until it is converted twice.',
          sessions: 6,
        },
        {
          id: 'ch-2-05',
          code: '2.5',
          label: 'Logical Chess Move by Move — one game a week',
          detail: 'Play through on a board, guess each move before reading the note. Twelve games.',
          sessions: 12,
        },
        {
          id: 'ch-2-06',
          code: '2.6',
          label: 'Four over-the-board events',
          detail: 'The bar is measured online, but the A Team plays across a board. One OTB event a month through March keeps the clock, the scoresheet and the nerves familiar.',
          sessions: 4,
          key: true,
        },
        {
          id: 'ch-2-07',
          code: '2.7',
          label: 'Chess Steps 3 workbook',
          detail: 'Same standard as Steps 2.',
          sessions: 8,
        },
      ],
    },
    {
      id: 'ch-pattern',
      numeral: 'III',
      name: 'Pattern Library',
      start: '2027-03-08',
      end: '2027-11-30',
      aim: '1200 to 1500 rapid. The Woodpecker method makes the common combinations instant; Yusupov starts the understanding underneath them.',
      gate: 'Woodpecker intermediate set solved twice at under half the first-pass time, and Chess.com rapid at or above 1500.',
      units: [
        {
          id: 'ch-3-01',
          code: '3.1',
          label: 'Woodpecker easy set — first full cycle',
          detail: 'Every puzzle solved and timed. The time is the benchmark the next cycles beat.',
          sessions: 10,
          key: true,
        },
        {
          id: 'ch-3-02',
          code: '3.2',
          label: 'Build Up Your Chess 1 (Yusupov)',
          detail: 'One chapter a week, test positions scored. Re-do any chapter scored under half.',
          sessions: 24,
          key: true,
        },
        {
          id: 'ch-3-03',
          code: '3.3',
          label: 'Woodpecker intermediate — two cycles',
          detail: 'Second cycle in under half the time of the first.',
          sessions: 16,
        },
        {
          id: 'ch-3-04',
          code: '3.4',
          label: 'Repertoire into plans — one page per opening',
          detail: 'For each line you play: the typical structure, the plan for both sides, one model game.',
          sessions: 4,
        },
        {
          id: 'ch-3-05',
          code: '3.5',
          label: 'Silman Class C — rook endings',
          detail: 'Lucena and Philidor from memory, set up and played out against the engine.',
          sessions: 6,
        },
        {
          id: 'ch-3-06',
          code: '3.6',
          label: 'Sixty rated rapid games at 15+10 or longer',
          detail: 'Long games only — blitz builds speed on top of habits, not the habits. Every one reviewed before the engine. OTB when the calendar offers it.',
          sessions: 30,
          key: true,
        },
      ],
    },
    {
      id: 'ch-plans',
      numeral: 'IV',
      name: 'Plans and Structures',
      start: '2027-12-01',
      end: '2029-03-10',
      aim: '1500 to 1800 rapid. Quiet positions stop being a mystery: pawn structures carry plans, and calculation gets written down.',
      gate: 'Losses come from calculation, not strategy — and Chess.com rapid at or above 1800.',
      units: [
        {
          id: 'ch-4-01',
          code: '4.1',
          label: 'Build Up Your Chess 2 (Yusupov)',
          detail: 'Same standard as book 1.',
          sessions: 24,
          key: true,
        },
        {
          id: 'ch-4-02',
          code: '4.2',
          label: 'Pawn Structure Chess (Soltis)',
          detail: 'Each structure your openings reach: the plans for both sides, written into the repertoire file.',
          sessions: 12,
        },
        {
          id: 'ch-4-03',
          code: '4.3',
          label: 'Calculation drills — Aagaard, Calculation',
          detail: 'Candidate moves listed, the tree written out, then checked. Never moved in your head alone.',
          sessions: 20,
          key: true,
        },
        {
          id: 'ch-4-04',
          code: '4.4',
          label: 'Coach every two weeks; one long tournament a month',
          detail: 'Sixteen months of it. Check off when the habit has held for the whole block.',
          sessions: 16,
        },
      ],
    },
    {
      id: 'ch-expert',
      numeral: 'V',
      name: 'Class A to the A Team',
      start: '2029-03-11',
      end: '2030-07-20',
      aim: '1800 to 2000 rapid. Precision at the critical moment, technical endgames converted, and a repertoire deep where opponents actually go.',
      gate: '2000 Chess.com rapid, held for a month — not touched once.',
      units: [
        {
          id: 'ch-5-01',
          code: '5.1',
          label: 'Build Up Your Chess 3 (Yusupov)',
          detail: 'Same standard as books 1 and 2.',
          sessions: 24,
          key: true,
        },
        {
          id: 'ch-5-02',
          code: '5.2',
          label: "Dvoretsky's Endgame Manual — the highlighted material",
          detail: 'The bold positions, known cold.',
          sessions: 20,
        },
        {
          id: 'ch-5-03',
          code: '5.3',
          label: 'Play up — 2000+ opponents, online and over the board',
          detail: 'Seek out stronger players at long time controls. Every game against a 2000 is a lesson in what the number actually means.',
          sessions: 12,
          key: true,
        },
        {
          id: 'ch-5-04',
          code: '5.4',
          label: 'Try out for the A Team',
          detail: 'The destination.',
          key: true,
        },
      ],
    },
  ],
}
