/**
 * Complexity Economics — mastery pathway data.
 *
 * The lane: valuation conventions as distributive institutions — how the
 * accounting objects that allocate capital (analyst price targets, DCF,
 * capex-to-D&A, cost of capital) are social conventions that produce the
 * distributions they claim to measure, and what happens to that machinery
 * when cognition goes to zero marginal cost.
 *
 * Destination: SFI Reimagining Economics Winter School, ADIA Lab / Khalifa
 * University, Abu Dhabi — January 3-17, 2027.
 *
 * Five stages, each with checkable milestones (persisted to localStorage on
 * the /complexecon page). The library is separate: books and papers grouped
 * by foundational topic, tiered spine / foundation / reference.
 */

export interface PathwayMilestone {
  id: string
  label: string
  detail: string
}

export interface PathwayStage {
  id: string
  numeral: string
  name: string
  window: string
  aim: string
  milestones: PathwayMilestone[]
}

export type BookTier = 'spine' | 'foundation' | 'reference'

export type SourceKind = 'pdf' | 'borrow' | 'web' | 'buy'

export interface BookSource {
  label: string
  url: string
  kind: SourceKind
}

export interface LibraryItem {
  id: string
  title: string
  author: string
  year: string
  kind: 'book' | 'paper'
  tier: BookTier
  /**
   * The job the item is brought in to do, stated as work rather than subject.
   * The organising unit of the shelf: two items against the same job are
   * redundant however different they read, and a job with no item is the gap.
   */
  jobToBeDone: string
  note: string
  /** Direct PDF that opens in the in-site reader (highlights + notes stored per user). */
  readerUrl?: string
  sources: BookSource[]
}

/**
 * Which argument a topic serves. The shelf carries more than one lane, and
 * only the SFI lane counts toward the Abu Dhabi progress meters — an off-lane
 * shelf that inflated the denominator would make the meter lie.
 */
export type ShelfLane = 'sfi' | 'shocks' | 'horizon'

export const SHELF_LANE_LABEL: Record<ShelfLane, string> = {
  sfi: 'Lane paper · Abu Dhabi',
  shocks: 'Shock to share price',
  horizon: 'Armstrong · the 1–2 year clock',
}

export interface LibraryTopic {
  id: string
  name: string
  rationale: string
  /** Defaults to 'sfi' when absent. */
  lane?: ShelfLane
  items: LibraryItem[]
}

export const CENTRAL_QUESTION =
  'Who accumulates when cognition is free — and which measurement conventions decide that?'

export const LANE_STATEMENT =
  'Valuation conventions as distributive institutions: the study of how the accounting objects that allocate capital — analyst price targets, DCF, capex-to-D&A, cost of capital — are social conventions that produce the distributions they claim to measure, and what happens to that machinery when cognition goes to zero marginal cost.'

export const WORKSHOP = {
  name: 'Reimagining Economics Winter School',
  host: 'Santa Fe Institute · ADIA Lab · Khalifa University',
  place: 'Abu Dhabi',
  dates: 'January 3–17, 2027',
  startDate: '2027-01-03',
}

export interface LanePillar {
  id: string
  name: string
  head: string
  body: string
}

/** Why the lane holds — three arguments, one line each before they open. */
export const LANE_PILLARS: LanePillar[] = [
  {
    id: 'continuity',
    name: 'Continuity',
    head: 'The Armstrong edge thesis is already a performativity claim.',
    body: 'Analyst anchoring as a convention that partly constitutes the price it estimates. A live trading book as empirical evidence for a social-studies-of-finance argument.',
  },
  {
    id: 'legibility',
    name: 'Legibility',
    head: 'The workshop’s own lines of inquiry run straight through valuation conventions.',
    body: 'Embeddedness, value, the social structure of accumulation — exactly where capital-allocation conventions sit. This supplies the firm-level mechanism to a literature working at household scale.',
  },
  {
    id: 'occupancy',
    name: 'Occupancy',
    head: 'Essentially no one holds this ground who also trades.',
    body: 'The complexity economics of AI itself is the field’s biggest open gap, and performativity is the bridge into it.',
  },
]

// ─── The five stages ──────────────────────────────────────────

export const STAGES: PathwayStage[] = [
  {
    id: 'foundations',
    numeral: 'I',
    name: 'Formal Foundations',
    window: 'Aug – Sep 2026',
    aim: 'Hold the complexity-science toolkit cold: agent-based modeling, emergent distributions, non-ergodic dynamics. This is the half of the room that is already home turf — make it unimpeachable.',
    milestones: [
      {
        id: 'fnd-apply',
        label: 'Confirm admission status and secure the seat',
        detail:
          'Verify whether the passKey link is an invitation to apply or an admission — the program describes selection through an open call. Submit whatever is required, immediately. Everything else on this page assumes the seat.',
      },
      {
        id: 'fnd-sfi-intro',
        label: 'Complete SFI Complexity Explorer: Introduction to Complexity',
        detail:
          'Full course with exercises, not audit mode. Keep a running note of every concept that maps to markets — the note becomes vocabulary for the workshop.',
      },
      {
        id: 'fnd-sfi-abm',
        label: 'Complete SFI Complexity Explorer: Introduction to Agent-Based Modeling',
        detail:
          'NetLogo throughout. The point is fluency in the modeling idiom the room shares, not the tool itself — the real models get rebuilt in Python.',
      },
      {
        id: 'fnd-sugarscape',
        label: 'Replicate the Sugarscape wealth-distribution result',
        detail:
          'Epstein & Axtell, chapter II: identical agents, emergent Pareto tail. Own implementation, own writeup of why the skew emerges without any behavioral assumption.',
      },
      {
        id: 'fnd-ergodicity',
        label: 'Build the ergodicity-economics simulation',
        detail:
          'Multiplicative wealth dynamics: show time-average growth diverging from ensemble-average growth, and inequality emerging from non-ergodicity alone. This is the single highest-leverage tool in the lane — Peters (2019) as the source.',
      },
      {
        id: 'fnd-axtell',
        label: 'Read Axtell on firm sizes and firm formation; write the summary memo',
        detail:
          'Zipf distribution of U.S. firm sizes (Science, 2001) plus the 120-million-agent firm-formation model. Canonical inequality-generating ABM — assumed knowledge in the room.',
      },
    ],
  },
  {
    id: 'vocabulary',
    numeral: 'II',
    name: 'The Anthropological Vocabulary',
    window: 'Sep – Oct 2026',
    aim: 'Half the room will be ethnographers. Learn the language they think in — embeddedness, the gift, debt, value — well enough to be argued with, not politely tolerated.',
    milestones: [
      {
        id: 'voc-polanyi',
        label: 'Polanyi, The Great Transformation — read and memo',
        detail:
          'Embeddedness is the vocabulary everyone in the room shares. The memo states the double-movement argument and where valuation conventions sit inside it.',
      },
      {
        id: 'voc-mauss',
        label: 'Mauss, The Gift — read and memo',
        detail:
          'Short and foundational. The question to carry: what is the gift-logic residue inside modern capital allocation — reciprocity in analyst access, IPO allocations, information flow?',
      },
      {
        id: 'voc-graeber',
        label: 'Graeber, Debt — read and take a position',
        detail:
          'Contested by economists but the lingua franca of the room. The deliverable is a one-page written position: what survives scrutiny, what does not, and what the credit-before-barter claim implies for valuation conventions.',
      },
      {
        id: 'voc-ho',
        label: 'Ho, Liquidated — read and critique in detail',
        detail:
          'The ethnography of Wall Street that shows shareholder value being enacted rather than discovered. The closest existing work to the lane — the critique must identify precisely what it misses at the level of measurement machinery.',
      },
      {
        id: 'voc-synthesis',
        label: 'Write the vocabulary synthesis: valuation conventions in anthropological terms',
        detail:
          'One essay translating the lane into the room’s language: price targets as conventions, accounting objects as institutions, accumulation as reproduced hierarchy at firm level.',
      },
    ],
  },
  {
    id: 'bridge',
    numeral: 'III',
    name: 'The Bridge — Performativity',
    window: 'Oct – Nov 2026',
    aim: 'The load-bearing theory: models do not describe markets, they make them. This is where the Armstrong edge thesis becomes a social-studies-of-finance claim with a P&L attached.',
    milestones: [
      {
        id: 'brg-mackenzie',
        label: 'MacKenzie, An Engine, Not a Camera — read closely',
        detail:
          'How Black-Scholes made the world it described. The load-bearing text of the entire lane; read with a notebook, chapter by chapter.',
      },
      {
        id: 'brg-callon',
        label: 'Callon, introduction to The Laws of the Markets — read',
        detail:
          'The theoretical statement of performativity. Dense; the memo restates it in plain terms with one worked market example.',
      },
      {
        id: 'brg-beunza',
        label: 'Beunza & Stark, Tools of the Trade — read',
        detail:
          'Reflexive modeling inside a trading room — the micro-level mechanism. Directly parallel to how Armstrong actually operates.',
      },
      {
        id: 'brg-armstrong',
        label: 'Write the Armstrong performativity essay',
        detail:
          'State the fund’s edge thesis — analyst anchoring creates durable mispricings — as a performativity claim, with evidence from the live book. Almost nobody in that room trades; this document is the credential.',
      },
    ],
  },
  {
    id: 'instrument',
    numeral: 'IV',
    name: 'The Instrument',
    window: 'Nov – Dec 2026',
    aim: 'The anti-dilettante rule: the lane only counts if it produces something falsifiable. Build the empirical artifact and the model that carry the argument.',
    milestones: [
      {
        id: 'ins-capex-data',
        label: 'Capex-to-D&A empirical study of the hyperscalers',
        detail:
          'Collect the depreciation-schedule extensions (MSFT, GOOG, AMZN, META, 2020–2026), quantify the reported-earnings impact, and trace the analyst-target response. The measurement moves the world — show it in the data.',
      },
      {
        id: 'ins-abm',
        label: 'Build the performative-convention ABM',
        detail:
          'Depreciation convention feeds reported earnings, feeds analyst targets, feeds cost of capital, feeds actual capex, feeds industry capital structure. The Oxford ABM reframed in the room’s language.',
      },
      {
        id: 'ins-ergodicity-talk',
        label: 'Draft the ergodicity lightning talk',
        detail:
          'Dave’s DCA-and-hold-capital-back instinct is a time-average growth argument he lacks the vocabulary for. Five minutes, one simulation, one live-book example.',
      },
      {
        id: 'ins-hypotheses',
        label: 'Lock the hypotheses and pre-register the tests',
        detail:
          'H1 through H3 stated falsifiably, data and method fixed before results are looked at. The pre-registration document is itself an artifact for the room.',
      },
    ],
  },
  {
    id: 'room',
    numeral: 'V',
    name: 'The Room',
    window: 'Dec 2026 – Jan 2027',
    aim: 'Synthesis and delivery. Walk in with a position on every shared text, one falsifiable artifact, and a five-minute talk that no one else in the room could give.',
    milestones: [
      {
        id: 'rm-talk',
        label: 'Finish the lightning talk: capex-to-D&A as a performative convention',
        detail:
          'Slides and a five-minute script. Rehearsed, timed, ruthless. One claim, one mechanism, one chart from the empirical study.',
      },
      {
        id: 'rm-paper',
        label: 'Draft the section for the Michael Ralph paper',
        detail:
          'The workshop output lands as a section of the joint paper, not a separate track. Firm-level accumulation mechanism supplied to a literature that works at household and community scale.',
      },
      {
        id: 'rm-positions',
        label: 'Position statements ready on the shared canon',
        detail:
          'One paragraph each, held in memory: Polanyi, Mauss, Graeber, Ho, MacKenzie. The test is being able to disagree specifically at dinner.',
      },
      {
        id: 'rm-logistics',
        label: 'Sequence Oxford → Abu Dhabi and protect the Armstrong book',
        detail:
          'Oxford in December, Abu Dhabi January 3–17, roughly ten weeks before the 12-month track record closes. Plan coverage of the book for two residential weeks before committing.',
      },
    ],
  },
]

// ─── The library ──────────────────────────────────────────────

export const LIBRARY: LibraryTopic[] = [
  {
    id: 'complexity',
    name: 'Complexity Economics Foundations',
    rationale:
      'The formal toolkit and its founding arguments. Mostly held already — the additions close the gaps the room will assume.',
    items: [
      {
        id: 'lib-arthur',
        title: 'Complexity and the Economy',
        author: 'W. Brian Arthur',
        year: '2014',
        kind: 'book',
        tier: 'foundation',
        jobToBeDone: 'Speak the room’s dialect',
        note: 'The founding statement: increasing returns, non-equilibrium, the El Farol problem. Arthur is SFI royalty — his framing is the house dialect.',
        readerUrl: 'https://sites.santafe.edu/~wbarthur/Papers/Comp.Econ.SFI.pdf',
        sources: [
          {
            label: 'Framework chapter, author-hosted',
            url: 'https://sites.santafe.edu/~wbarthur/Papers/Comp.Econ.SFI.pdf',
            kind: 'pdf',
          },
          {
            label: 'Oxford UP',
            url: 'https://global.oup.com/academic/product/complexity-and-the-economy-9780199334292',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-farmer',
        title: 'Making Sense of Chaos',
        author: 'J. Doyne Farmer',
        year: '2024',
        kind: 'book',
        tier: 'foundation',
        jobToBeDone: 'State the programme as prediction',
        note: 'The current statement of complexity economics as a predictive program. Farmer is the bridge to the Oxford work and the CEcon collaboration.',
        sources: [
          {
            label: 'Yale UP',
            url: 'https://yalebooks.yale.edu/book/9780300273771/making-sense-of-chaos/',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-beinhocker',
        title: 'The Origin of Wealth',
        author: 'Eric Beinhocker',
        year: '2006',
        kind: 'book',
        tier: 'reference',
        jobToBeDone: 'Map the field quickly',
        note: 'The accessible synthesis. Skim for the map of the field; the primary sources above carry the weight.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/originofwealthra0000bein',
            kind: 'borrow',
          },
        ],
      },
      {
        id: 'lib-epstein-axtell',
        title: 'Growing Artificial Societies',
        author: 'Epstein & Axtell',
        year: '1996',
        kind: 'book',
        tier: 'spine',
        jobToBeDone: 'Build the agent model',
        note: 'Sugarscape: emergent wealth distributions from identical agents. The replication in Stage I comes from chapter II.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/growingartificia00epst',
            kind: 'borrow',
          },
          {
            label: 'MIT Press',
            url: 'https://mitpress.mit.edu/9780262550253/growing-artificial-societies/',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-mitchell',
        title: 'Complexity: A Guided Tour',
        author: 'Melanie Mitchell',
        year: '2009',
        kind: 'book',
        tier: 'reference',
        jobToBeDone: 'Patch the complexity-science gaps',
        note: 'General complexity-science grounding — information, computation, evolution. Read where the SFI coursework feels thin.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/complexityguided0000mitc',
            kind: 'borrow',
          },
        ],
      },
    ],
  },
  {
    id: 'anthropology',
    name: 'Anthropology of Value',
    rationale:
      'The vocabulary half the room thinks in. Non-negotiable, new territory — this is Stage II.',
    items: [
      {
        id: 'lib-polanyi',
        title: 'The Great Transformation',
        author: 'Karl Polanyi',
        year: '1944',
        kind: 'book',
        tier: 'spine',
        jobToBeDone: 'Ground markets as instituted',
        note: 'Embeddedness — the shared vocabulary of the entire workshop. Markets as instituted processes, not natural facts.',
        readerUrl:
          'https://archive.org/download/the-great-transformation_202605/The%20great%20transformation.pdf',
        sources: [
          {
            label: 'Full PDF on archive.org',
            url: 'https://archive.org/details/the-great-transformation_202605',
            kind: 'pdf',
          },
        ],
      },
      {
        id: 'lib-mauss',
        title: 'The Gift',
        author: 'Marcel Mauss',
        year: '1925',
        kind: 'book',
        tier: 'spine',
        jobToBeDone: 'Find the obligation inside a price',
        note: 'Short, foundational. Exchange as social obligation — the deep background to every claim about what a transaction is.',
        readerUrl: 'https://archive.org/download/the-gift-marcel-mauss/The%20Gift%20-%20Marcel%20Mauss.pdf',
        sources: [
          {
            label: 'Full PDF on archive.org',
            url: 'https://archive.org/details/the-gift-marcel-mauss',
            kind: 'pdf',
          },
        ],
      },
      {
        id: 'lib-graeber',
        title: 'Debt: The First 5,000 Years',
        author: 'David Graeber',
        year: '2011',
        kind: 'book',
        tier: 'spine',
        jobToBeDone: 'Trace credit back before money',
        note: 'Contested by economists, but the lingua franca. A position on it will be expected — agreement optional, engagement mandatory.',
        readerUrl:
          'https://archive.org/download/debt-the-first-5000-years/Debt-The_First_5000_Years.pdf',
        sources: [
          {
            label: 'Full PDF on archive.org',
            url: 'https://archive.org/details/debt-the-first-5000-years',
            kind: 'pdf',
          },
        ],
      },
      {
        id: 'lib-ho',
        title: 'Liquidated: An Ethnography of Wall Street',
        author: 'Karen Ho',
        year: '2009',
        kind: 'book',
        tier: 'spine',
        jobToBeDone: 'See the desk as a culture',
        note: 'Shareholder value enacted rather than discovered. The closest existing work to the lane — the one to critique in detail.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/liquidatedethnog0000hoka',
            kind: 'borrow',
          },
          {
            label: 'Duke UP',
            url: 'https://www.dukeupress.edu/liquidated',
            kind: 'buy',
          },
        ],
      },
    ],
  },
  {
    id: 'performativity',
    name: 'Social Studies of Finance',
    rationale:
      'The bridge between the two halves of the room: models make the markets they claim to describe. Stage III lives here.',
    items: [
      {
        id: 'lib-mackenzie',
        title: 'An Engine, Not a Camera',
        author: 'Donald MacKenzie',
        year: '2006',
        kind: 'book',
        tier: 'spine',
        jobToBeDone: 'Prove the model makes the market',
        note: 'How Black-Scholes made the world it described. The load-bearing text of the lane.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/enginenotcamerah00mack_0',
            kind: 'borrow',
          },
          {
            label: 'MIT Press',
            url: 'https://mitpress.mit.edu/9780262633673/an-engine-not-a-camera/',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-callon',
        title: 'The Laws of the Markets (introduction)',
        author: 'Michel Callon',
        year: '1998',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Name performativity precisely',
        note: 'The theoretical statement of performativity — economics performs the economy.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/lawsofmarkets0000unse',
            kind: 'borrow',
          },
        ],
      },
      {
        id: 'lib-beunza-stark',
        title: 'Tools of the Trade',
        author: 'Beunza & Stark',
        year: '2004',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Watch arbitrage being made',
        note: 'Reflexive modeling inside a trading room. The micro-mechanism, observed ethnographically.',
        sources: [
          {
            label: 'Industrial & Corporate Change, DOI',
            url: 'https://doi.org/10.1093/icc/dth015',
            kind: 'web',
          },
        ],
      },
      {
        id: 'lib-muniesa',
        title: 'The Provoked Economy',
        author: 'Fabian Muniesa',
        year: '2014',
        kind: 'book',
        tier: 'reference',
        jobToBeDone: 'Treat valuation as an act',
        note: 'Valuation as performance across settings — a second pass at the lane once the spine is absorbed.',
        sources: [
          {
            label: 'Routledge',
            url: 'https://www.routledge.com/The-Provoked-Economy-Economic-Reality-and-the-Performative-Turn/Muniesa/p/book/9780415855280',
            kind: 'buy',
          },
        ],
      },
    ],
  },
  {
    id: 'inequality',
    name: 'Inequality, Ergodicity & Distribution',
    rationale:
      'The workshop’s focal application is inequality. These supply the generating mechanisms — no behavioral assumptions required.',
    items: [
      {
        id: 'lib-peters',
        title: 'The ergodicity problem in economics',
        author: 'Ole Peters',
        year: '2019',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Fix the averaging error',
        note: 'Nature Physics. Time averages diverge from ensemble averages under multiplicative dynamics — inequality without psychology. The highest-leverage single tool in the lane.',
        sources: [
          {
            label: 'Nature Physics, free to read',
            url: 'https://www.nature.com/articles/s41567-019-0732-0',
            kind: 'web',
          },
          {
            label: 'Ergodicity economics lecture notes',
            url: 'https://ergodicityeconomics.com/lecture-notes/',
            kind: 'web',
          },
        ],
      },
      {
        id: 'lib-axtell-zipf',
        title: 'Zipf Distribution of U.S. Firm Sizes',
        author: 'Robert Axtell',
        year: '2001',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Get the empirical target',
        note: 'Science. The canonical firm-level distribution fact, plus the ABM program that generates it. Assumed knowledge in the room.',
        readerUrl: 'https://www.brookings.edu/wp-content/uploads/2016/06/firms.pdf',
        sources: [
          {
            label: 'Companion working paper, Brookings',
            url: 'https://www.brookings.edu/wp-content/uploads/2016/06/firms.pdf',
            kind: 'pdf',
          },
          {
            label: 'Science 2001, DOI',
            url: 'https://doi.org/10.1126/science.1062081',
            kind: 'web',
          },
        ],
      },
      {
        id: 'lib-piketty',
        title: 'Capital in the Twenty-First Century',
        author: 'Thomas Piketty',
        year: '2013',
        kind: 'book',
        tier: 'reference',
        jobToBeDone: 'Anchor the distribution claim',
        note: 'The empirical backdrop every inequality conversation assumes. Know r > g, the data, and the standard critiques.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/capitalintwentyf0000pike',
            kind: 'borrow',
          },
        ],
      },
      {
        id: 'lib-scheidel',
        title: 'The Great Leveler',
        author: 'Walter Scheidel',
        year: '2017',
        kind: 'book',
        tier: 'reference',
        jobToBeDone: 'Test what actually levels',
        note: 'The long-run history: what has actually compressed inequality. Useful counterweight to purely generative accounts.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/greatlevelerviol0000sche',
            kind: 'borrow',
          },
        ],
      },
    ],
  },
  {
    id: 'valuation',
    name: 'Valuation & Conventions Theory',
    rationale:
      'The lane’s own shelf: value as convention, expectations as fictions, worth as an order. Where the original contribution will sit.',
    items: [
      {
        id: 'lib-orlean',
        title: 'The Empire of Value',
        author: 'André Orléan',
        year: '2011',
        kind: 'book',
        tier: 'foundation',
        jobToBeDone: 'Make value a convention',
        note: 'The French conventions school, directly on point: value is not measured by markets but constituted by them.',
        sources: [
          {
            label: 'MIT Press',
            url: 'https://mitpress.mit.edu/9780262026970/the-empire-of-value/',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-beckert',
        title: 'Imagined Futures',
        author: 'Jens Beckert',
        year: '2016',
        kind: 'book',
        tier: 'foundation',
        jobToBeDone: 'Price the imagined future',
        note: 'Fictional expectations as the engine of capitalist dynamics — DCF as an instrument of imagination. Very close to the lane.',
        sources: [
          {
            label: 'Harvard UP',
            url: 'https://www.hup.harvard.edu/books/9780674088825',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-grinold-kahn',
        title: 'Advances in Active Portfolio Management',
        author: 'Richard C. Grinold & Ronald N. Kahn',
        year: '2019',
        kind: 'book',
        tier: 'foundation',
        jobToBeDone: 'State the edge in checkable machinery',
        note: 'The fundamental law, the transfer coefficient, and fees as a convention that distributes. The credential nobody else in the room has \u2014 almost none of them trade. Read against Orlean: the same claim in machinery a practitioner can check.',
        sources: [
          {
            label: 'McGraw Hill',
            url: 'https://www.mhprofessional.com/advances-in-active-portfolio-management-new-developments-in-quantitative-investing-9781260453713-usa',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-boltanski',
        title: 'On Justification: Economies of Worth',
        author: 'Boltanski & Thévenot',
        year: '1991',
        kind: 'book',
        tier: 'reference',
        jobToBeDone: 'Adjudicate rival worths',
        note: 'Orders of worth — the theoretical deep end of conventions theory. Enter only if the room pulls the conversation there.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/onjustificatione0000bolt',
            kind: 'borrow',
          },
        ],
      },
    ],
  },
  {
    id: 'shocks',
    name: 'Shock to Share Price',
    lane: 'shocks',
    rationale:
      'A second lane, deliberately kept off the Abu Dhabi meters. The job is turning an event into a position: mechanism, then structure, then sourcing, then valuation, then instrument. Mauboussin first because he reframes the rest — once you are forecasting the revision to expectations rather than the fundamental, every book below is read for what it says about revisions. Doganis last, because sector substrate is only worth loading once you know which variable you are solving for.',
    items: [
      {
        id: 'lib-mauboussin-expectations',
        title: 'Expectations Investing',
        author: 'Michael Mauboussin & Alfred Rappaport',
        year: '2021',
        kind: 'book',
        tier: 'spine',
        jobToBeDone: 'Link a shock to a share price',
        note: 'Reverse-engineers what the price already implies, so you forecast the revision, not the fundamental. The direct answer to the question, and the reason it sits first.',
        sources: [
          {
            label: 'Columbia UP',
            url: 'https://cup.columbia.edu/book/expectations-investing/9780231203043',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-sonkin-johnson',
        title: 'Pitch the Perfect Investment',
        author: 'Paul Sonkin & Paul Johnson',
        year: '2017',
        kind: 'book',
        tier: 'foundation',
        jobToBeDone: 'Build and structure the thesis',
        note: 'The variant-perception framework: why your view differs from the price-implied consensus, and why the market will come to it. Pairs with Mauboussin — he supplies the gap, this supplies the argument for closing it.',
        sources: [
          {
            label: 'Wiley',
            url: 'https://www.wiley.com/en-us/Pitch+the+Perfect+Investment-p-9781119051787',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-blas-farchy',
        title: 'The World for Sale',
        author: 'Javier Blas & Jack Farchy',
        year: '2021',
        kind: 'book',
        tier: 'foundation',
        jobToBeDone: 'Find the shocks early',
        note: 'Physical commodity flows and chokepoints; how traders read tanker routes before equities move. The sourcing half — useless without a mechanism, and the mechanism is slow without it.',
        sources: [
          {
            label: 'Oxford UP',
            url: 'https://global.oup.com/academic/product/the-world-for-sale-9780197651537',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-damodaran-dark-side',
        title: 'The Dark Side of Valuation',
        author: 'Aswath Damodaran',
        year: '2018',
        kind: 'book',
        tier: 'spine',
        jobToBeDone: 'Value the damaged company',
        note: 'Cyclicals, distress, negative earnings — exactly the airBaltic situation. The one book on this lane whose author posts the spreadsheets free.',
        sources: [
          {
            label: 'Author page, NYU Stern',
            url: 'https://pages.stern.nyu.edu/~adamodar/',
            kind: 'web',
          },
          {
            label: 'Pearson',
            url: 'https://www.pearson.com/en-us/subject-catalog/p/dark-side-of-valuation-the/P200000009470',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-moyer-distressed',
        title: 'Distressed Debt Analysis',
        author: 'Stephen Moyer',
        year: '2004',
        kind: 'book',
        tier: 'spine',
        jobToBeDone: 'Trade the Chapter 11',
        note: 'Capital structure, who gets wiped, where the asymmetry sits. The airBaltic trade is in the debt, not the equity — this is the book that says why.',
        sources: [
          {
            label: 'J. Ross Publishing',
            url: 'https://www.jrosspub.com/distressed-debt-analysis.html',
            kind: 'buy',
          },
        ],
      },
      {
        id: 'lib-greenblatt',
        title: 'You Can Be a Stock Market Genius',
        author: 'Joel Greenblatt',
        year: '1997',
        kind: 'book',
        tier: 'foundation',
        jobToBeDone: 'Special situations scouting',
        note: 'Spinoffs, bankruptcies, restructurings — the original alpha-scouting text despite the awful title.',
        sources: [
          {
            label: 'Borrow on archive.org',
            url: 'https://archive.org/details/youcanbestockmar0000gree',
            kind: 'borrow',
          },
        ],
      },
      {
        id: 'lib-doganis',
        title: 'Flying Off Course',
        author: 'Rigas Doganis',
        year: '2019',
        kind: 'book',
        tier: 'reference',
        jobToBeDone: 'Sector substrate',
        note: 'Airline economics: fuel hedging, load factors, lessor structures. Boring, necessary, and read last on purpose — substrate without a question is trivia.',
        sources: [
          {
            label: 'Routledge',
            url: 'https://www.routledge.com/Flying-Off-Course-Airline-Economics-and-Marketing/Doganis/p/book/9781138224254',
            kind: 'buy',
          },
        ],
      },
    ],
  },
  // ─── The horizon lane: the papers behind the Models tab (/complexecon/models).
  // Off the Abu Dhabi meters by design; "Model N" in a note points at the
  // reproduction that moves the paper's parameters.
  {
    id: 'horizon-clock',
    name: 'The Clock — Price, Value & Horizon',
    lane: 'horizon',
    rationale:
      'Why the holding period is one to two years and not one quarter: the papers that locate predictability at the horizon where a slow error unwinds.',
    items: [
      {
        id: 'lib-summers',
        title: 'Does the stock market rationally reflect fundamental values?',
        author: 'Lawrence Summers',
        year: '1986',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Put the horizon where the signal is',
        note: 'Price = value + a slowly decaying fad: invisible in monthly returns, decisive over two years. The arithmetic case for the LEAP horizon; Model V.',
        readerUrl: 'https://larrysummers.com/wp-content/uploads/2025/04/Summers-StockMarketRationally-1986-1.pdf',
        sources: [
          { label: 'Author-hosted scan', url: 'https://larrysummers.com/wp-content/uploads/2025/04/Summers-StockMarketRationally-1986-1.pdf', kind: 'pdf' },
          { label: 'Journal of Finance, DOI', url: 'https://doi.org/10.1111/j.1540-6261.1986.tb04519.x', kind: 'web' },
        ],
      },
      {
        id: 'lib-black-was-right',
        title: 'Black was right: Price is within a factor 2 of Value',
        author: 'Bouchaud, Ciliberti, Lempérière, Majewski, Seager & Sin Ronia',
        year: '2017',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Size and time the closing',
        note: 'Black’s 1986 conjecture tested on long histories: the price-to-value ratio mean-reverts over years inside a band of about a factor of two. Sets a realistic closure speed; Model VI.',
        readerUrl: 'https://arxiv.org/pdf/1711.04717',
        sources: [
          { label: 'arXiv 1711.04717', url: 'https://arxiv.org/abs/1711.04717', kind: 'pdf' },
        ],
      },
      {
        id: 'lib-campbell-shiller',
        title: 'Stock prices, earnings, and expected dividends',
        author: 'John Campbell & Robert Shiller',
        year: '1988',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Show ratios predict years, not months',
        note: 'Dividend- and earnings-price ratios forecast multi-year returns and almost nothing at one month — the statistical ground under the holding period.',
        readerUrl: 'https://www.nber.org/system/files/working_papers/w2511/w2511.pdf',
        sources: [
          { label: 'NBER working paper 2511', url: 'https://www.nber.org/system/files/working_papers/w2511/w2511.pdf', kind: 'pdf' },
          { label: 'Journal of Finance, DOI', url: 'https://doi.org/10.1111/j.1540-6261.1988.tb04598.x', kind: 'web' },
        ],
      },
      {
        id: 'lib-debondt-thaler',
        title: 'Does the stock market overreact?',
        author: 'Werner De Bondt & Richard Thaler',
        year: '1985',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Anchor the reversal horizon',
        note: 'Three-year losers beat three-year winners over the next three years. The empirical reversal clock, which coincides with LEAP maturities.',
        readerUrl: 'https://breesefine7110.tulane.edu/wp-content/uploads/sites/16/2015/10/Debondt-and-Thaler.pdf',
        sources: [
          { label: 'Course-hosted scan, Tulane', url: 'https://breesefine7110.tulane.edu/wp-content/uploads/sites/16/2015/10/Debondt-and-Thaler.pdf', kind: 'pdf' },
          { label: 'Journal of Finance, DOI', url: 'https://doi.org/10.1111/j.1540-6261.1985.tb05004.x', kind: 'web' },
        ],
      },
      {
        id: 'lib-dew-becker',
        title: 'The price of variance risk',
        author: 'Dew-Becker, Giglio, Le & Rodriguez',
        year: '2017',
        kind: 'paper',
        tier: 'reference',
        jobToBeDone: 'Price the volatility a LEAP buys',
        note: 'Variance claims beyond one month carried little premium on average over 1996–2013; the volatility-premium drag on a 12–36-month call is small next to a one-month one. Read before pricing entries.',
        readerUrl: 'https://www.nber.org/papers/w21182.pdf',
        sources: [
          { label: 'NBER working paper 21182', url: 'https://www.nber.org/papers/w21182.pdf', kind: 'pdf' },
        ],
      },
    ],
  },
  {
    id: 'horizon-agents',
    name: 'Who Closes the Gap — Heterogeneous Agents',
    lane: 'horizon',
    rationale:
      'The mechanisms that make a mispricing persist and then close on a clock: rule switching, slow diffusion, herding. Models I, II, IV and VIII.',
    items: [
      {
        id: 'lib-brock-hommes',
        title: 'Heterogeneous beliefs and routes to chaos in a simple asset pricing model',
        author: 'William Brock & Cars Hommes',
        year: '1998',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Make the price cycle around value',
        note: 'Four forecasting rules competing for market share; past a threshold intensity of choice the price never rests on value. Model I carries the bifurcation diagram the roadmap asks for. Paywalled; two open implementations exist.',
        sources: [
          { label: 'JEDC, DOI (paywalled)', url: 'https://doi.org/10.1016/S0165-1889(98)00011-6', kind: 'web' },
          { label: 'Code · gui-market-agent-model (C++)', url: 'https://github.com/m-koska/gui-market-agent-model', kind: 'web' },
          { label: 'Code · ABM_callibration (Python)', url: 'https://github.com/admivsn/ABM_callibration', kind: 'web' },
        ],
      },
      {
        id: 'lib-hommes-veld',
        title: 'Booms, busts and behavioural heterogeneity in stock prices',
        author: 'Cars Hommes & Daan in ’t Veld',
        year: '2017',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Estimate the switching on the S&P',
        note: 'Brock–Hommes fitted to price-earnings data: switching between mean reversion and extrapolation reproduces the multi-year booms and busts of the 1990s and 2000s.',
        readerUrl: 'https://pure.uva.nl/ws/files/19123525/Booms_busts_and_behavioural_heterogeneity.pdf',
        sources: [
          { label: 'UvA repository, published version', url: 'https://pure.uva.nl/ws/files/19123525/Booms_busts_and_behavioural_heterogeneity.pdf', kind: 'pdf' },
          { label: 'JEDC, DOI', url: 'https://doi.org/10.1016/j.jedc.2017.05.006', kind: 'web' },
        ],
      },
      {
        id: 'lib-farmer-joshi',
        title: 'The price dynamics of common trading strategies',
        author: 'J. Doyne Farmer & Shareen Joshi',
        year: '2002',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Add value and trend capital through one market maker',
        note: 'Value trading makes mean reversion, trend trading makes momentum, and their ratio sets the half-life of a gap. Model II.',
        readerUrl: 'https://arxiv.org/pdf/cond-mat/0012419',
        sources: [
          { label: 'arXiv cond-mat/0012419', url: 'https://arxiv.org/abs/cond-mat/0012419', kind: 'pdf' },
          { label: 'Code · adaptive Farmer–Joshi ABM (R)', url: 'https://github.com/IvanJericevich/Adaptive-Farmer-Joshi-Agent-Based-Model-of-Financial-Markets', kind: 'web' },
        ],
      },
      {
        id: 'lib-hong-stein',
        title: 'A unified theory of underreaction, momentum trading, and overreaction in asset markets',
        author: 'Harrison Hong & Jeremy Stein',
        year: '1999',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Get under- and overreaction from one mechanism',
        note: 'News diffuses slowly; momentum traders chase the drift past the fundamental; the overshoot reverses. The return path after an upgrade cluster; Model IV.',
        readerUrl: 'https://www.nber.org/system/files/working_papers/w6324/w6324.pdf',
        sources: [
          { label: 'NBER working paper 6324', url: 'https://www.nber.org/system/files/working_papers/w6324/w6324.pdf', kind: 'pdf' },
        ],
      },
      {
        id: 'lib-bsv',
        title: 'A model of investor sentiment',
        author: 'Barberis, Shleifer & Vishny',
        year: '1998',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Model the investor who sees regimes',
        note: 'Investors believe earnings switch between a mean-reverting and a trending regime; a streak of beats flips them into trending mode and the price overreacts. The ceiling on a two-year call.',
        readerUrl: 'https://www.nber.org/system/files/working_papers/w5926/w5926.pdf',
        sources: [
          { label: 'NBER working paper 5926', url: 'https://www.nber.org/system/files/working_papers/w5926/w5926.pdf', kind: 'pdf' },
        ],
      },
      {
        id: 'lib-xcapm',
        title: 'X-CAPM: An extrapolative capital asset pricing model',
        author: 'Barberis, Greenwood, Jin & Shleifer',
        year: '2015',
        kind: 'paper',
        tier: 'reference',
        jobToBeDone: 'Calibrate extrapolation against rational capital',
        note: 'Extrapolators and rational traders in one asset-pricing model: excess volatility and predictable multi-year reversals from two parameters.',
        readerUrl: 'https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/e/10495/files/2023/01/BGJS-JFE.pdf',
        sources: [
          { label: 'Author-hosted, Cornell', url: 'https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/e/10495/files/2023/01/BGJS-JFE.pdf', kind: 'pdf' },
          { label: 'JFE, DOI', url: 'https://doi.org/10.1016/j.jfineco.2014.08.007', kind: 'web' },
        ],
      },
      {
        id: 'lib-kirman',
        title: 'Ants, rationality, and recruitment',
        author: 'Alan Kirman',
        year: '1993',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Hold the herding kernel',
        note: 'Ants recruiting each other to identical food sources: a crowd near unanimity that flips. The kernel inside Lux–Marchesi and the reading of a ratings cluster; Model VIII. Paywalled; an interactive version exists.',
        sources: [
          { label: 'QJE, DOI (paywalled)', url: 'https://doi.org/10.2307/2118498', kind: 'web' },
          { label: 'Interactive model, physrisk', url: 'https://rf.mokslasplius.lt/kirman-ants/', kind: 'web' },
        ],
      },
      {
        id: 'lib-lux-marchesi',
        title: 'Scaling and criticality in a stochastic multi-agent model of a financial market',
        author: 'Thomas Lux & Michele Marchesi',
        year: '1999',
        kind: 'paper',
        tier: 'reference',
        jobToBeDone: 'See fat tails come from herding',
        note: 'Chartists and fundamentalists switching by herding and profit: volatility clustering and fat tails without any news. On the roadmap top-30 as a reproduction; two Python implementations exist.',
        sources: [
          { label: 'Nature, DOI (paywalled)', url: 'https://doi.org/10.1038/17290', kind: 'web' },
          { label: 'Code · Lux-Marchesi-ABM (Python)', url: 'https://github.com/marckiller/Lux-Marchesi-ABM', kind: 'web' },
          { label: 'Code · LuxMarchesiModel (Python)', url: 'https://github.com/paololapo/LuxMarchesiModel', kind: 'web' },
        ],
      },
      {
        id: 'lib-sfi-asm',
        title: 'Asset pricing under endogenous expectations in an artificial stock market',
        author: 'Arthur, Holland, LeBaron, Palmer & Tayler',
        year: '1997',
        kind: 'paper',
        tier: 'reference',
        jobToBeDone: 'Know the original artificial market',
        note: 'The first learning-agent stock market: slow learning gives rational pricing, fast learning gives technical-trading regimes. No open copy of the chapter; Tesfatsion’s overview and the Swarm/Java code are the way in.',
        readerUrl: 'https://www2.econ.iastate.edu/tesfatsi/SFIStockMarketModel.LTOverview.pdf',
        sources: [
          { label: 'Tesfatsion overview, Iowa State', url: 'https://www2.econ.iastate.edu/tesfatsi/SFIStockMarketModel.LTOverview.pdf', kind: 'pdf' },
          { label: 'Code · artstkmkt (Objective-C / Java)', url: 'https://artstkmkt.sourceforge.net/', kind: 'web' },
        ],
      },
    ],
  },
  {
    id: 'horizon-ecology',
    name: 'Ecology, Flows & Capacity — What Runs Against It',
    lane: 'horizon',
    rationale:
      'The forces a one-to-two-year position holds through, and the reason an edge shrinks as capital finds it. Models III, VII, IX and X.',
    items: [
      {
        id: 'lib-farmer-ecology',
        title: 'Market force, ecology and evolution',
        author: 'J. Doyne Farmer',
        year: '2002',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'State the ecology',
        note: 'Strategies as species whose returns depend on the capital already pursuing them — the theory Lanes VI and VIII make empirical. The 66-page SFI working paper is the full statement.',
        readerUrl: 'https://arxiv.org/pdf/adap-org/9812005',
        sources: [
          { label: 'arXiv adap-org/9812005 (SFI WP 98-12-117)', url: 'https://arxiv.org/abs/adap-org/9812005', kind: 'pdf' },
          { label: 'Industrial and Corporate Change, DOI', url: 'https://doi.org/10.1093/icc/11.5.895', kind: 'web' },
        ],
      },
      {
        id: 'lib-scholl',
        title: 'How market ecology explains market malfunction',
        author: 'Scholl, Calinescu & Farmer',
        year: '2021',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Watch the ecology malfunction',
        note: 'Value, trend and noise capital in one simulated market: density-dependent returns, and malfunction when trend capital outgrows value capital. Code published with the paper; Model III.',
        readerUrl: 'https://arxiv.org/pdf/2009.09454',
        sources: [
          { label: 'arXiv 2009.09454', url: 'https://arxiv.org/abs/2009.09454', kind: 'pdf' },
          { label: 'PNAS, DOI', url: 'https://doi.org/10.1073/pnas.2015574118', kind: 'web' },
          { label: 'Code · INET-Complexity/market-ecology', url: 'https://github.com/INET-Complexity/market-ecology', kind: 'web' },
        ],
      },
      {
        id: 'lib-gabaix-koijen',
        title: 'In search of the origins of financial fluctuations: The inelastic markets hypothesis',
        author: 'Xavier Gabaix & Ralph Koijen',
        year: '2021',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Measure how much of a year is flows',
        note: 'A dollar of flow moves the market by about five: the inelastic markets hypothesis. The part of a one-year return no fundamental analysis anticipates; Model VII.',
        readerUrl: 'https://www.nber.org/system/files/working_papers/w28967/w28967.pdf',
        sources: [
          { label: 'NBER working paper 28967', url: 'https://www.nber.org/system/files/working_papers/w28967/w28967.pdf', kind: 'pdf' },
        ],
      },
      {
        id: 'lib-berk-green',
        title: 'Mutual fund flows and performance in rational markets',
        author: 'Jonathan Berk & Richard Green',
        year: '2004',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Watch an edge get absorbed by capital',
        note: 'Skill is real and flows chase it until the costs of size eat the alpha — the investor’s-chair statement of alpha decay; Model X.',
        readerUrl: 'https://www.johnhcochrane.com/s/berk_green_jpe.pdf',
        sources: [
          { label: 'JPE version, Cochrane-hosted', url: 'https://www.johnhcochrane.com/s/berk_green_jpe.pdf', kind: 'pdf' },
          { label: 'NBER working paper 9275', url: 'https://www.nber.org/system/files/working_papers/w9275/w9275.pdf', kind: 'pdf' },
        ],
      },
      {
        id: 'lib-mclean-pontiff',
        title: 'Does academic research destroy stock return predictability?',
        author: 'David McLean & Jeffrey Pontiff',
        year: '2016',
        kind: 'paper',
        tier: 'reference',
        jobToBeDone: 'Put a number on publication decay',
        note: 'Ninety-seven published anomalies: returns 26% lower out of sample and 58% lower after publication. The measured rate at which a documented edge is competed away.',
        readerUrl: 'https://www.gwern.net/doc/economics/2016-mclean.pdf',
        sources: [
          { label: 'Mirror, gwern.net', url: 'https://www.gwern.net/doc/economics/2016-mclean.pdf', kind: 'pdf' },
          { label: 'Journal of Finance, DOI', url: 'https://doi.org/10.1111/jofi.12365', kind: 'web' },
        ],
      },
      {
        id: 'lib-lppls',
        title: 'Crashes as critical points',
        author: 'Johansen, Ledoit & Sornette',
        year: '2000',
        kind: 'paper',
        tier: 'reference',
        jobToBeDone: 'Recognise a bubble’s shape',
        note: 'Faster-than-exponential growth with log-periodic oscillations into a critical time; a contested crash diagnostic, useful as a shape to look for on the exit side; Model IX.',
        readerUrl: 'https://arxiv.org/pdf/cond-mat/9810071',
        sources: [
          { label: 'arXiv cond-mat/9810071', url: 'https://arxiv.org/abs/cond-mat/9810071', kind: 'pdf' },
          { label: 'Code · lppls (Python)', url: 'https://github.com/Boulder-Investment-Technologies/lppls', kind: 'web' },
        ],
      },
    ],
  },
  {
    id: 'horizon-analysts',
    name: 'Analysts, Anchors & Expectations',
    lane: 'horizon',
    rationale:
      'The strategy’s own object — what a target price is worth, where analysts anchor, and how their forecasts over- and underreact on a one-to-three-year clock.',
    items: [
      {
        id: 'lib-brav-lehavy',
        title: 'An empirical analysis of analysts’ target prices: Short-term informativeness and long-term dynamics',
        author: 'Alon Brav & Reuven Lehavy',
        year: '2003',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Know what a target price is worth',
        note: 'Targets are informative on revision and co-move with prices in the long run; the average target sits 28% above price and the gap closes only partially. The founding study of the anchor; paywalled.',
        sources: [{ label: 'Journal of Finance, DOI (paywalled)', url: 'https://doi.org/10.1111/1540-6261.00593', kind: 'web' }],
      },
      {
        id: 'lib-cen-hilary-wei',
        title: 'The role of anchoring bias in the equity market: Evidence from analysts’ earnings forecasts and stock returns',
        author: 'Cen, Hilary & Wei',
        year: '2013',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Find the anchor analysts use',
        note: 'Analysts anchor forecasts on the industry median; firms whose forecasts sit far above it earn abnormal returns as the anchor unwinds. A screen for targets above peer anchors.',
        sources: [{ label: 'JFQA, DOI (paywalled)', url: 'https://doi.org/10.1017/S0022109012000609', kind: 'web' }],
      },
      {
        id: 'lib-diagnostic',
        title: 'Diagnostic expectations and stock returns',
        author: 'Bordalo, Gennaioli, La Porta & Shleifer',
        year: '2019',
        kind: 'paper',
        tier: 'spine',
        jobToBeDone: 'Model analysts who overreact',
        note: 'Long-term growth forecasts overreact to news and reverse over one to three years — the most direct account of why an analyst-anchored entry can be late. An unaffiliated Python replication exists.',
        readerUrl: 'https://www.nber.org/system/files/working_papers/w23863/w23863.pdf',
        sources: [
          { label: 'NBER working paper 23863', url: 'https://www.nber.org/system/files/working_papers/w23863/w23863.pdf', kind: 'pdf' },
          { label: 'Journal of Finance, DOI', url: 'https://doi.org/10.1111/jofi.12833', kind: 'web' },
          { label: 'Code · replication (Python, unaffiliated)', url: 'https://github.com/Lloyd-wang/Claude-Code-Replication-Diagnostic-Expectations-and-Stock-Returns', kind: 'web' },
        ],
      },
      {
        id: 'lib-sticky',
        title: 'Sticky expectations and the profitability anomaly',
        author: 'Bouchaud, Krüger, Landier & Thesmar',
        year: '2019',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Model analysts who underreact',
        note: 'A share of forecasters fails to update each period, so past profitability predicts twelve-month returns. The underreaction twin — the case for entering before the revision cluster completes.',
        readerUrl: 'https://conference.nber.org/conf_papers/f88004/f88004.pdf',
        sources: [
          { label: 'NBER conference draft', url: 'https://conference.nber.org/conf_papers/f88004/f88004.pdf', kind: 'pdf' },
          { label: 'Journal of Finance, DOI', url: 'https://doi.org/10.1111/jofi.12734', kind: 'web' },
          { label: 'Code · replication (Python, unaffiliated)', url: 'https://github.com/Lloyd-wang/Claude-Code-Replication-Sticky-Expectations-and-the-Profitability-Anomaly', kind: 'web' },
        ],
      },
    ],
  },
  {
    id: 'horizon-lineage',
    name: 'The Practitioner Lineage — From Chaos to Rules',
    lane: 'horizon',
    rationale:
      'The documented chain from Farmer’s nonlinear forecasting to Dhar’s rule discovery at Morgan Stanley runs through Norman Packard — no direct link exists in the record. Four papers in reading order; the memo “The Morgan Stanley Thread” is the guide.',
    items: [
      {
        id: 'lib-farmer-sidorowich',
        title: 'Predicting chaotic time series',
        author: 'J. Doyne Farmer & John Sidorowich',
        year: '1987',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Forecast without a model',
        note: 'Local approximation in a reconstructed state space: the founding nonlinear-forecasting paper and the method behind Prediction Company. The honest test of structure at any horizon is how fast its prediction error grows.',
        readerUrl: 'https://oms-inet.files.svdcdn.com/production/files/predictingchaotic.pdf?dm=1553075489',
        sources: [
          { label: 'INET Oxford scan', url: 'https://oms-inet.files.svdcdn.com/production/files/predictingchaotic.pdf?dm=1553075489', kind: 'pdf' },
          { label: 'Physical Review Letters, DOI', url: 'https://doi.org/10.1103/PhysRevLett.59.845', kind: 'web' },
          { label: 'Code · TISEAN local predictors', url: 'https://www.pks.mpg.de/tisean/Tisean_3.0.1/docs/contents.html', kind: 'web' },
          { label: 'Code · pyEDM (simplex / S-map)', url: 'https://github.com/SugiharaLab/pyEDM', kind: 'web' },
        ],
      },
      {
        id: 'lib-packard',
        title: 'A genetic learning algorithm for the analysis of complex data',
        author: 'Norman Packard',
        year: '1990',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Cross the bridge',
        note: 'Evolutionary search for the regions of a system’s state space in which the future is predictable. Cites Farmer & Sidorowich and credits Farmer and the SFI Economics Program; the “Packard (1989)” that Dhar’s Morgan Stanley papers cite for their method.',
        readerUrl: 'https://content.wolfram.com/sites/13/2018/02/04-5-4.pdf',
        sources: [
          { label: 'Complex Systems 4(5), Wolfram archive', url: 'https://content.wolfram.com/sites/13/2018/02/04-5-4.pdf', kind: 'pdf' },
        ],
      },
      {
        id: 'lib-glower',
        title: 'Discovering interesting patterns for investment decision making with GLOWER',
        author: 'Vasant Dhar, Dashin Chou & Foster Provost',
        year: '2000',
        kind: 'paper',
        tier: 'foundation',
        jobToBeDone: 'Mine rules from earnings surprises',
        note: 'A genetic learner overlaid with entropy reduction, built in Morgan Stanley’s Data Mining Group to find patterns ahead of earnings surprises — the event that moves analyst targets.',
        readerUrl: 'https://archive.nyu.edu/bitstream/2451/14171/1/IS-00-02.pdf',
        sources: [
          { label: 'NYU Stern working paper IS-00-02', url: 'https://archive.nyu.edu/bitstream/2451/14171/1/IS-00-02.pdf', kind: 'pdf' },
          { label: 'Data Mining and Knowledge Discovery, DOI', url: 'https://doi.org/10.1023/A:1009848126475', kind: 'web' },
        ],
      },
      {
        id: 'lib-dhar-disjuncts',
        title: 'Prediction in financial markets: The case for small disjuncts',
        author: 'Vasant Dhar',
        year: '2011',
        kind: 'paper',
        tier: 'reference',
        jobToBeDone: 'Learn why found patterns die',
        note: 'The retrospective: tradable patterns found by learners are rare, local and non-stationary. The reason the policy backtest program pre-registers and deflates before it believes anything.',
        readerUrl: 'https://archive.nyu.edu/bitstream/2451/28304/2/Dhar%20Prediction%20April%202011.pdf',
        sources: [
          { label: 'NYU Faculty Digital Archive', url: 'https://archive.nyu.edu/bitstream/2451/28304/2/Dhar%20Prediction%20April%202011.pdf', kind: 'pdf' },
        ],
      },
    ],
  },
]

// ─── Hypotheses ───────────────────────────────────────────────

export const HYPOTHESES = [
  {
    id: 'H1',
    claim:
      'Hyperscaler depreciation-schedule extensions (2020–2026) shifted analyst price targets beyond what contemporaneous fundamentals explain.',
    test: 'Event study on schedule-change disclosures: target revisions and earnings-estimate dispersion around each extension, controlling for guidance and macro. Falsified if targets track cash economics rather than reported earnings.',
  },
  {
    id: 'H2',
    claim:
      'Analyst anchoring conventions create durable mispricings — the convention partly constitutes the price it purports to estimate.',
    test: 'Armstrong live book as the evidence base: persistence of anchoring-driven dislocations against a null of rapid convergence. Falsified if dislocations close at the speed an information-only model predicts.',
  },
  {
    id: 'H3',
    claim:
      'Non-ergodic multiplicative dynamics are sufficient to generate observed firm-level accumulation patterns — no behavioral assumptions required.',
    test: 'ABM calibrated to the Axtell firm-size facts with convention-mediated capital costs; compare generated distributions to Compustat tails. Falsified if the fit requires heterogeneous behavioral parameters.',
  },
]

// ─── Artifacts ────────────────────────────────────────────────

export const ARTIFACTS = [
  {
    id: 'art-talk',
    name: 'The Lightning Talk',
    detail:
      'Capex-to-D&A as a performative convention: extending depreciation schedules changes reported earnings, changes analyst targets, changes cost of capital, changes actual capex, changes industry capital structure. The measurement moves the world. Five minutes, one chart.',
  },
  {
    id: 'art-study',
    name: 'The Empirical Study',
    detail:
      'Hyperscaler depreciation extensions 2020–2026: quantified earnings impact and traced analyst response. The falsifiable core of H1.',
  },
  {
    id: 'art-abm',
    name: 'The Model',
    detail:
      'An agent-based model in which the accounting convention is an agent-visible institution: convention → earnings → targets → cost of capital → capex. The Oxford ABM, reframed for this room.',
  },
  {
    id: 'art-paper',
    name: 'The Paper Section',
    detail:
      'A section of the Michael Ralph collaboration: the firm-level accumulation mechanism supplied to an inequality literature that works at household and community scale.',
  },
]
