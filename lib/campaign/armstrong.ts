/**
 * Armstrong campaign — the twelve-month track record, and the decision at
 * the end of it.
 *
 * Two parts, because Armstrong is two different kinds of work. The RITUAL is
 * the daily desk pass: the book gets looked at, the queue gets a decision,
 * and the reasoning gets written down the day it is made. That is not a
 * deliverable, it is the discipline the record is made of, and it is the one
 * thing that cannot be caught up on later. The BLOCKS are the build ladder —
 * the instrument, the signals, the record, the close.
 *
 * ── Assumptions, stated so they can be corrected ──────────────────────────
 *
 * 1. TRACK RECORD CLOSE = 2027-03-31. Derived, not confirmed: the Abu Dhabi
 *    workshop was described as sitting roughly ten weeks before the close,
 *    and the workshop ends January 17. Change TRACK_RECORD_CLOSE below and
 *    the block dates and countdown follow.
 * 2. GO / NO-GO is treated as a dated deliverable inside the final block
 *    rather than an open question, because an undated go/no-go is how a
 *    pre-launch fund stays pre-launch. The date is the assumption; the
 *    decision is yours.
 * 3. The ladder is seeded from what the DeepOps repo actually shows as of
 *    late August 2026 — incubation Levels 0-3, the walkforward CI, the v1.5
 *    parallel-run QA register, the concurrent screener, the IBKR live feed —
 *    plus the mastery priorities in armstrong_primer.md, where finance-adapted
 *    classical ML is Tier 1 and everything else is secondary until it holds.
 * 4. Priority order within a block is deliberate: measurement before signal,
 *    signal before story, story before allocators. A track record that cannot
 *    survive an audit is not an asset regardless of its return.
 *
 * Editing rules: unit `id` values are Firestore keys — never renumber or
 * reuse one. Everything else is free to rewrite.
 */

import type { Campaign } from './types'

/** The date the twelve-month record closes. Assumption — see header note 1. */
export const TRACK_RECORD_CLOSE = '2027-03-31'

export const ARMSTRONG_CAMPAIGN: Campaign = {
  id: 'armstrong',
  name: 'Armstrong',
  lane: 'Twelve-month track record, then the go/no-go on the fund',
  destination: {
    label: 'Track record closes',
    sub: 'Twelve months of live, reconciled performance',
    date: TRACK_RECORD_CLOSE,
  },
  href: '/armstrong',
  sessionsPerDay: 1,
  ritual: {
    id: 'arm-desk',
    label: 'Desk pass',
    detail:
      'The daily loop the record is made of. Reconciliation before opinion, a decision on every queued name, and the reasoning written down the day it is made — not reconstructed later, when you already know the outcome.',
    cadence: 'weekdays',
    steps: [
      'Reconcile: IBKR snapshot — NAV, positions, margin; the Level 0-2 gates green before anything else is believed',
      'Decide: everything the screener queued gets promoted, revised, or killed — no name sits unjudged for a second day',
      'Record: one line on what the book did and why you did or did not act on it',
    ],
  },
  blocks: [
    {
      id: 'arm-instrument',
      numeral: 'A',
      name: 'The Instrument',
      start: '2026-08-28',
      end: '2026-09-30',
      aim: 'Make the book measure itself to a standard an allocator would accept. Every month spent trading without this is a month of record you cannot fully use.',
      gate: 'Independent NAV and FIFO gates green for thirty consecutive days, and a tearsheet that exists as a document rather than as a notebook cell.',
      units: [
        {
          id: 'arm-1-01',
          code: 'A.1',
          label: 'Close the open v1.5 parallel-run QA items',
          detail: 'Start with SQ-024. The parallel run is only evidence while its register is clean; an open item is an unpriced disagreement between two engines.',
          key: true,
        },
        {
          id: 'arm-1-02',
          code: 'A.2',
          label: 'Resolve the §9.1 deployment-target divergence',
          detail: 'Dave’s v1.5 policy and dcaUtils.calcDeploymentPlan differ by roughly 15x on the same book. Decide which one is Armstrong’s, in writing, with the reasoning — this is a policy choice, not a bug.',
          key: true,
        },
        {
          id: 'arm-1-03',
          code: 'A.3',
          label: 'Hold the Level 0-2 gates green for thirty consecutive days',
          detail: 'Flex statements archived verbatim, account facts derived, independent NAV and FIFO within tolerance. A failed gate withholds publication — that rule is the point.',
          sessions: 2,
          key: true,
        },
        {
          id: 'arm-1-04',
          code: 'A.4',
          label: 'Build the tearsheet on the full position history',
          detail: 'Sharpe, Sortino, max drawdown, turnover, hit rate, and net-of-cost returns across the 300+ position history. A document you can hand someone, not a number you can quote.',
          sessions: 2,
          key: true,
        },
        {
          id: 'arm-1-05',
          code: 'A.5',
          label: 'Deflated Sharpe and purged cross-validation on the LEAP signal',
          detail: 'López de Prado Tier 1, per the primer: purged and embargoed CV, deflated Sharpe. Until this runs, the backtest is a hypothesis about itself.',
          sessions: 2,
          key: true,
        },
        {
          id: 'arm-1-06',
          code: 'A.6',
          label: 'Ship the portfolio risk tab',
          detail: 'Concentration by position, sector exposure, and stock-versus-options split, against editable thresholds. LMND should surface as red without anyone going looking for it.',
        },
        {
          id: 'arm-1-07',
          code: 'A.7',
          label: 'Write the August letter as though an allocator reads it',
          detail: 'The first one written to the outside standard. What the book did, what it was supposed to do, and where those two differ.',
          key: true,
        },
      ],
    },
    {
      id: 'arm-signal',
      numeral: 'B',
      name: 'The Signal',
      start: '2026-10-01',
      end: '2026-11-15',
      aim: 'Turn the research lanes into book positions, and get the Baltic work published while the location edge is still worth something.',
      gate: 'One committed signal live in the book with a written thesis, and the second strategy at the same walkforward standard as the first.',
      units: [
        {
          id: 'arm-2-01',
          code: 'B.1',
          label: 'ENTSO-E and Open-Meteo pipeline into macro-signals; test LT-1',
          detail: 'Forecast dispersion against Lithuanian price spikes. The Palanga edge expires around September 23, so this runs on borrowed time already — commit or kill it fast.',
          sessions: 2,
          key: true,
        },
        {
          id: 'arm-2-02',
          code: 'B.2',
          label: 'Publish "The Grid After BRELL"',
          detail: 'The first Baltic power post. Trading lane and blog lane at once — and the piece that makes the desync work legible to people who were not there.',
        },
        {
          id: 'arm-2-03',
          code: 'B.3',
          label: 'Write the PJM trade memo — one page, kept outside the paper',
          detail: 'Who captures the capacity windfall: IPPs with PJM exposure, regulated utilities, hyperscalers. Deliberately separate from the research so the finding is never shaped by the position.',
          key: true,
        },
        {
          id: 'arm-2-04',
          code: 'B.4',
          label: 'Wire regime detection to position sizing',
          detail: 'The regime history already refreshes daily. Make it change behaviour rather than only appear on a chart.',
          sessions: 2,
        },
        {
          id: 'arm-2-05',
          code: 'B.5',
          label: 'Bring dividend capture to walkforward parity with the LEAP book',
          detail: 'Same CI, same enrichment from the real price store, same gates. Two strategies at one standard, or it is one strategy plus an anecdote.',
          sessions: 2,
          key: true,
        },
        {
          id: 'arm-2-06',
          code: 'B.6',
          label: 'September and October letters',
          detail: 'On time, same standard as August. The cadence is the evidence.',
        },
      ],
    },
    {
      id: 'arm-record',
      numeral: 'C',
      name: 'The Record',
      start: '2026-11-16',
      end: '2027-01-31',
      aim: 'Turn twelve months of trades into something that can be handed to a stranger and read as a case.',
      gate: 'An attribution that explains the return, and a capacity number that says what the book can hold.',
      units: [
        {
          id: 'arm-3-01',
          code: 'C.1',
          label: 'Twelve-month attribution',
          detail: 'What made money, split by strategy and by decision — signal, sizing, timing, luck. The last of those is a real column and it should be honestly filled.',
          sessions: 2,
          key: true,
        },
        {
          id: 'arm-3-02',
          code: 'C.2',
          label: 'Capacity analysis',
          detail: 'At what AUM does the LEAP book stop working — liquidity in the options, slippage against the analyst-target signal, crowding by systematic harvesters. The first question a serious allocator asks.',
          sessions: 2,
          key: true,
        },
        {
          id: 'arm-3-03',
          code: 'C.3',
          label: 'Allocator one-pager and target list',
          detail: 'What the strategy is, what it returned, what it can hold, what it costs. Plus a named list — family offices and small institutions, not a category.',
          key: true,
        },
        {
          id: 'arm-3-04',
          code: 'C.4',
          label: 'Operating documents',
          detail: 'Strategy document, risk limits, valuation policy, and the reconciliation process — written down. The things that are asked for after the first good conversation, not before.',
          sessions: 2,
        },
        {
          id: 'arm-3-05',
          code: 'C.5',
          label: 'November and December letters',
          detail: 'Written in Abu Dhabi if that is what January requires. The streak is the asset.',
        },
      ],
    },
    {
      id: 'arm-close',
      numeral: 'D',
      name: 'The Close',
      start: '2027-02-01',
      end: TRACK_RECORD_CLOSE,
      aim: 'Twelve months of live performance, closed cleanly — and a decision made on it rather than deferred past it.',
      gate: 'A written go / no-go with the reasoning recorded at decision time, not after the outcome is known.',
      units: [
        {
          id: 'arm-4-01',
          code: 'D.1',
          label: 'Audit-quality performance pack for the full twelve months',
          detail: 'Every month reconciled, every gate green, every number traceable to a Flex statement. The pack is the track record; everything else is commentary on it.',
          sessions: 3,
          key: true,
        },
        {
          id: 'arm-4-02',
          code: 'D.2',
          label: 'Ten allocator conversations',
          detail: 'Ten, not one. The purpose is to find out what the record is worth to people who allocate, which cannot be learned from a single sample.',
          sessions: 2,
          key: true,
        },
        {
          id: 'arm-4-03',
          code: 'D.3',
          label: 'Write the go / no-go',
          detail: 'The decision, the reasoning, and the conditions that would change it — recorded at decision time. A no is a real answer and frees the next year; a deferral is not.',
          key: true,
        },
        {
          id: 'arm-4-04',
          code: 'D.4',
          label: 'January and February letters',
          detail: 'Close the cadence the way it was kept.',
        },
      ],
    },
  ],
}
