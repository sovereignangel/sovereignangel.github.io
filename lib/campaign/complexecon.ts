/**
 * Complexity Economics campaign — the Abu Dhabi paper.
 *
 * Lane V, "Who Pays for Cognition" (see lib/complexecon/research.ts): PJM
 * datacenter load → utility load-forecast conventions → capacity prices →
 * household bills by income decile. Three sections: PJ-1 incidence, PJ-2
 * reflexivity, PJ-3 counterfactual conventions.
 *
 * The block dates are the timeline decided on 2026-08-22: data sprint before
 * the Ironman on September 26, §1 through October, §2 and §3 through November,
 * full draft to Lafond plus the Oxford meetings in December, paper and
 * lightning talk in hand for January 3.
 *
 * Lori owns data and model; Michael Ralph co-authors the theory section.
 *
 * Editing rules: unit `id` values are Firestore keys — never renumber or
 * reuse one. Everything else is free to rewrite.
 */

import type { Campaign } from './types'

export const COMPLEXECON_CAMPAIGN: Campaign = {
  id: 'complexecon',
  name: 'Complexity Economics',
  lane: 'Who Pays for Cognition — PJM load forecasts as a distributive convention',
  destination: {
    label: 'Reimagining Economics Winter School',
    sub: 'SFI · ADIA Lab · Khalifa University, Abu Dhabi',
    date: '2027-01-03',
  },
  href: '/complexecon/research',
  sessionsPerDay: 1,
  blocks: [
    {
      id: 'ce-sprint',
      numeral: 'I',
      name: 'Data Sprint',
      start: '2026-08-28',
      end: '2026-09-25',
      aim: 'Every series on disk and joinable, one chart that shows the loop, and the §1 skeleton — all of it before the Ironman on September 26 takes the last week of the month.',
      gate: 'The forecast-revision series and the capacity-price series sit on one timeline, and the pre-registration for PJ-2 is written before any result exists.',
      units: [
        {
          id: 'ce-1-01',
          code: '1.1',
          label: 'Settle the passKey — invitation to apply, or admission?',
          detail: 'The program describes selection through an open call. Find out which one the link is and submit whatever it needs. Everything downstream assumes the seat; this is the only unit that can invalidate the campaign.',
          key: true,
        },
        {
          id: 'ce-1-02',
          code: '1.2',
          label: 'Pull PJM Base Residual Auction results by zone, 2020-21 through 2027-28',
          detail: 'Clearing prices, reliability requirement, and auction parameters per delivery year and zone, cached as parquet in macro-signals. Done when a reload needs no network.',
          key: true,
        },
        {
          id: 'ce-1-03',
          code: '1.3',
          label: 'Pull PJM load-forecast reports and their revisions',
          detail: 'One row per (report year, forecast year, zone). The revision — not the level — is the performative object, so the panel has to preserve which vintage said what.',
          key: true,
        },
        {
          id: 'ce-1-04',
          code: '1.4',
          label: 'Extract the IMM datacenter attribution and its method',
          detail: 'Monitoring Analytics puts 63% of the increase — roughly $9.3bn — on datacenters. Write down exactly what that number claims and what it does not, because the paper leans on it.',
        },
        {
          id: 'ce-1-05',
          code: '1.5',
          label: 'Build the zone → utility → residential-customers crosswalk',
          detail: 'EIA-861 retail sales and revenue by utility and customer class, mapped onto PJM zones. This is the join that turns an auction price into a household.',
          sessions: 2,
          key: true,
        },
        {
          id: 'ce-1-06',
          code: '1.6',
          label: 'Pull BLS CEX electricity budget shares by income decile',
          detail: 'The incidence join. Decile shares plus mean income, on the years the auctions cover.',
        },
        {
          id: 'ce-1-07',
          code: '1.7',
          label: 'First chart: forecast revisions against capacity prices',
          detail: 'One panel per delivery year. This is the picture that either shows the loop or kills the reflexivity section — draw it before writing another word.',
          key: true,
        },
        {
          id: 'ce-1-08',
          code: '1.8',
          label: 'Read Peskoe & Martin end to end, then write the one page that separates you from it',
          detail: 'Harvard ELI 2025 is the nearest prior work and it is legal, not complexity. One page: which claim is theirs, which claim is unclaimed, and why the complexity version is a different paper.',
        },
        {
          id: 'ce-1-09',
          code: '1.9',
          label: 'Pre-register the PJ-2 decomposition',
          detail: 'Forecast-driven vs supply-side vs realized load, with the estimator and the sample fixed in writing before results exist. On a politically charged question this is the whole credibility of §2.',
          key: true,
        },
        {
          id: 'ce-1-10',
          code: '1.10',
          label: 'Draft the §1 skeleton',
          detail: 'Headings, empty table shells, and the literal sentence the headline number will land in. Writing the sentence first is what keeps the analysis pointed at a claim.',
        },
        {
          id: 'ce-1-11',
          code: '1.11',
          label: 'Brief Michael on the theory section',
          detail: 'Conventions as institutions, and how the load forecast sits in that frame. He drafts in parallel through October — hand it off before the sprint ends, not after.',
        },
      ],
    },
    {
      id: 'ce-incidence',
      numeral: 'II',
      name: '§1 Incidence',
      start: '2026-09-27',
      end: '2026-10-31',
      aim: 'A defensible headline number: dollars per household per year and percent of income, by decile, from the datacenter-attributable share of 2025-26 capacity costs.',
      gate: 'A defensible headline by the end of October — or the paper narrows to §1 plus §2 and the iteration log says so.',
      units: [
        {
          id: 'ce-2-01',
          code: '2.1',
          label: 'Allocate the attributable capacity cost to the residential class by zone',
          detail: 'Auction cost × datacenter-attributable share × residential pass-through, using rate filings and EIA-861. Every step of the allocation written down as an assumption you can be argued out of.',
          sessions: 2,
          key: true,
        },
        {
          id: 'ce-2-02',
          code: '2.2',
          label: 'Convert to dollars per household per year, by zone',
          detail: 'Divide by residential customer counts. Sanity-check against reported bill increases in at least two zones before going further.',
        },
        {
          id: 'ce-2-03',
          code: '2.3',
          label: 'Join CEX decile budget shares to get burden as a share of income',
          detail: 'The regressivity test. Output is a decile table: dollars, share of income, and the ratio that becomes the headline.',
          key: true,
        },
        {
          id: 'ce-2-04',
          code: '2.4',
          label: 'Fix the headline number',
          detail: 'Bottom-quintile burden as a multiple of top-quintile burden, as a fraction of income. One number, stated once, defended everywhere else.',
          key: true,
        },
        {
          id: 'ce-2-05',
          code: '2.5',
          label: 'Run three alternative specifications',
          detail: 'Pass-through lag, zone-to-utility mapping, and class allocation. If the headline flips sign under any of them, the paper reports that rather than the point estimate.',
          sessions: 2,
        },
        {
          id: 'ce-2-06',
          code: '2.6',
          label: 'Build Exhibit 1 — incidence by decile',
          detail: 'The chart the talk is built around. Legible at a glance from the back of a room in Abu Dhabi.',
        },
        {
          id: 'ce-2-07',
          code: '2.7',
          label: 'Write §1 to draft quality',
          detail: 'Not notes. Prose a co-author can edit, with the tables in place and the caveats named.',
          sessions: 2,
          key: true,
        },
        {
          id: 'ce-2-08',
          code: '2.8',
          label: 'Run the October gate, in writing',
          detail: 'Is the headline defensible? If yes, §2 and §3 go ahead. If no, narrow to §1 plus §2 and record the decision in the research iteration log the same day.',
          key: true,
        },
      ],
    },
    {
      id: 'ce-mechanism',
      numeral: 'III',
      name: '§2 Reflexivity · §3 Counterfactuals',
      start: '2026-11-01',
      end: '2026-11-30',
      aim: 'The two sections that make it complexity economics rather than policy journalism: how much of the price rise the forecast wrote, and what the same electrons cost under different conventions.',
      gate: 'One committed signal in the Armstrong book and one paper section Michael co-signs, both before the December Oxford trip.',
      units: [
        {
          id: 'ce-3-01',
          code: '3.1',
          label: 'Build the reliability-requirement series and its forecast-revision driver',
          detail: 'The mechanical chain from a revised forecast to a changed procurement target, reconstructed from PJM parameters.',
          sessions: 2,
          key: true,
        },
        {
          id: 'ce-3-02',
          code: '3.2',
          label: 'Run the pre-registered decomposition of the 2024-25 price change',
          detail: 'Forecast revisions vs supply-side drivers — retirements, accreditation methodology — vs realized peak load. Exactly the estimator registered in 1.9, no adjustments after seeing the result.',
          sessions: 2,
          key: true,
        },
        {
          id: 'ce-3-03',
          code: '3.3',
          label: 'State the reflexivity number',
          detail: 'The share of the capacity-price rise written by forecast revisions rather than electrons. The sentence the Farmer crowd will remember.',
          key: true,
        },
        {
          id: 'ce-3-04',
          code: '3.4',
          label: 'Write §2',
          detail: 'Draft quality, with the pre-registration reproduced in an appendix so the discipline is visible.',
          sessions: 2,
        },
        {
          id: 'ce-3-05',
          code: '3.5',
          label: 'Calibrate the procurement-and-allocation model to the status quo',
          detail: 'Simple first. It has to reproduce the observed clearing and the observed household burden before any counterfactual is worth running.',
          sessions: 2,
          key: true,
        },
        {
          id: 'ce-3-06',
          code: '3.6',
          label: 'Run three alternative conventions',
          detail: 'Large-load tariffs, datacenters bearing forecast risk, and price collars — all three already proposed in practice, so none of them is a straw man.',
          sessions: 2,
        },
        {
          id: 'ce-3-07',
          code: '3.7',
          label: 'Produce the §3 table — dollars shifted per household under each rule',
          detail: 'Conventions as system parameters, with a number attached to each. This is the section that earns the room.',
          key: true,
        },
        { id: 'ce-3-08', code: '3.8', label: 'Write §3', detail: 'Draft quality, with the model documented well enough to replicate.', sessions: 2 },
        {
          id: 'ce-3-09',
          code: '3.9',
          label: 'Merge Michael’s theory section and do a single-voice pass',
          detail: 'Two authors, one register. Read the whole thing aloud once.',
        },
      ],
    },
    {
      id: 'ce-draft',
      numeral: 'IV',
      name: 'Full Draft · Oxford',
      start: '2026-12-01',
      end: '2026-12-31',
      aim: 'A complete draft in Lafond’s hands before the Oxford meetings, and those meetings used for the DPhil conversation rather than only the paper.',
      units: [
        {
          id: 'ce-4-01',
          code: '4.1',
          label: 'Assemble the full draft',
          detail: 'Abstract with the headline number inside the first two sentences. If a reader stops after the abstract they should still have the finding.',
          sessions: 2,
          key: true,
        },
        {
          id: 'ce-4-02',
          code: '4.2',
          label: 'Build the replication packet',
          detail: 'Code plus a data manifest, so the number survives a hostile reader. On this question there will be one.',
          key: true,
        },
        {
          id: 'ce-4-03',
          code: '4.3',
          label: 'Send the draft to Lafond ahead of the meetings',
          detail: 'Far enough ahead that he has read it when you sit down — that is the difference between a meeting and an introduction.',
          key: true,
        },
        {
          id: 'ce-4-04',
          code: '4.4',
          label: 'Write the supervisor emails',
          detail: 'Lafond primary; Fankhauser or Hepburn on justice economics; Bailey on ABM; Hall on infrastructure risk. Sent in September or October, so December is meetings rather than first contact.',
        },
        {
          id: 'ce-4-05',
          code: '4.5',
          label: 'Run the Oxford meetings',
          detail: 'The DPhil conversation — Economy, Society: Transformations and Justice — not just the paper. Leave with a supervisor’s position on taking you.',
          key: true,
        },
        {
          id: 'ce-4-06',
          code: '4.6',
          label: 'Revise on Lafond’s read',
          detail: 'Before January, while the notes are still warm.',
          sessions: 2,
        },
      ],
    },
    {
      id: 'ce-room',
      numeral: 'V',
      name: 'Abu Dhabi',
      start: '2027-01-01',
      end: '2027-01-17',
      aim: 'Paper and lightning talk in hand on January 3, and the two weeks spent on the room rather than on the deck.',
      units: [
        {
          id: 'ce-5-01',
          code: '5.1',
          label: 'Build the lightning talk — five slides',
          detail: 'The loop, the headline, the decomposition, the counterfactual table, the claim. Rehearsed to time before flying.',
          key: true,
        },
        {
          id: 'ce-5-02',
          code: '5.2',
          label: 'Paper finished and in hand for January 3',
          detail: 'Circulated, not promised.',
          key: true,
        },
        {
          id: 'ce-5-03',
          code: '5.3',
          label: 'Three named conversations',
          detail: 'Farmer and two others chosen in advance, each with a specific ask. A room is not a network until someone knows what you want.',
        },
        {
          id: 'ce-5-04',
          code: '5.4',
          label: 'Scope the second paper with Michael',
          detail: 'The gains ledger — valuation conventions — as the sequel of the same program. Scoped while the first one is fresh.',
        },
      ],
    },
  ],
}
