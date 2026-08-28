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
  note: string
  /** Direct PDF that opens in the in-site reader (highlights + notes stored per user). */
  readerUrl?: string
  sources: BookSource[]
}

export interface LibraryTopic {
  id: string
  name: string
  rationale: string
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
        id: 'lib-boltanski',
        title: 'On Justification: Economies of Worth',
        author: 'Boltanski & Thévenot',
        year: '1991',
        kind: 'book',
        tier: 'reference',
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
