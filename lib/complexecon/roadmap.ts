// The road to Abu Dhabi — /complexecon/roadmap.
// Winter school: SFI / ADIA Lab / Khalifa University, Jan 3-17, 2027.
// Phases, the four winter goals, the data-quality ranking across lanes,
// and the full reading & reproduction program.

export const WINTER = {
  name: 'Reimagining Economics Winter School',
  place: 'Abu Dhabi',
  start: '2027-01-03',
  end: '2027-01-17',
}

export interface Goal {
  id: string
  numeral: string
  name: string
  target: string
  detail: string
  cadence: string
}

export const GOALS: Goal[] = [
  {
    id: 'goal-paper',
    numeral: '1',
    name: 'The paper',
    target: 'One research paper, catchy and valuable title, in hand',
    detail:
      'Lane V unless the review overturns it: datacenter load, forecast conventions, capacity prices, household incidence by decile. Title candidates, to be settled in review: "Who Pays for Cognition" (primary), "The Price the Forecast Wrote", "The Reliability Tax". Full draft December 5, final December 20, printed before the flight.',
    cadence: 'Data through October, sections through November, prose through early December.',
  },
  {
    id: 'goal-ce',
    numeral: '2',
    name: 'Speak complexity economics',
    target: 'Read the top 30 papers · reproduce the top 10',
    detail:
      'Reading makes you conversant; reproduction makes you dangerous. The ten reproductions are chosen because their core result can be rebuilt from public data or a few hundred lines of code — each one becomes a notebook in macro-signals and a talking point in the room.',
    cadence: 'Two papers per week starting this week; one reproduction per week October through mid-December.',
  },
  {
    id: 'goal-anthro',
    numeral: '3',
    name: 'Speak anthropology & economics',
    target: 'Read the top 15 papers · reproduce 5 arguments',
    detail:
      'Anthropology is not reproduced by re-running regressions — a reproduction here means replicating the argument on a new empirical site. Two of the five (MacKenzie-Millo on performativity, Zelizer on earmarked money) replicate directly inside the Lane V paper, so goal 3 feeds goal 1.',
    cadence: 'One paper per week starting this week; the five replications land inside October-November research blocks.',
  },
  {
    id: 'goal-books',
    numeral: '4',
    name: 'The books',
    target: 'Top 3 complexity economics · top 1 anthropology',
    detail:
      'Farmer, Making Sense of Chaos (2024) — the argument of the host school. Beinhocker, The Origin of Wealth (2006) — the synthesis. Arthur, Complexity and the Economy (2015) — the foundations. Graeber, Debt: The First 5,000 Years (2011) — the anthropologists’ badge of citizenship, and the inequality frame in long form.',
    cadence: 'One book per month, September through December; Graeber travels to Abu Dhabi as the flight book.',
  },
]

export interface Phase {
  id: string
  window: string
  name: string
  detail: string
  gate: string
}

export const PHASES: Phase[] = [
  {
    id: 'p0',
    window: 'Sep 3 – Sep 10',
    name: 'Harvest',
    detail:
      'One compressed week. Distill Lanes I-VIII into five one-page briefs worth a researcher’s time. Start the PJM data sprint (auction results, load-forecast revisions, CEX shares) and the Klaipeda AIS archiver. Send the Jonas weather-data spec and the RC bulk-financials price inquiry with Aidas.',
    gate: 'Five briefs written; the two data asks sent; the archiver running.',
  },
  {
    id: 'p1',
    window: 'Sep 11 – Sep 21',
    name: 'Review',
    detail:
      'Top-3 review with Michael Ralph plus two or three researchers — the Lafond introduction email carries the strategy map and briefs; Bilawal and the CEcon orbit round out the panel. Belgrade rehearsal race Sep 13 sits inside this window; the review is conversations, not building.',
    gate: 'The paper locked by Sep 21 — Lane V confirmed or overturned — and a title shortlist of three.',
  },
  {
    id: 'race',
    window: 'Sep 22 – Sep 28',
    name: 'Race week',
    detail: 'NYC Ironman, September 26. Protected. Reading only — no research, no building.',
    gate: 'Cross the line.',
  },
  {
    id: 'p2',
    window: 'Sep 29 – Nov 15',
    name: 'Research',
    detail:
      'The data period. October: section 1 (incidence — the headline number). November: section 2 (the reflexivity decomposition) and section 3 (the counterfactual-conventions model). Reproductions run one per week alongside; Michael drafts the theory section in parallel.',
    gate: 'A defensible headline number by October 31 — or the paper narrows to sections 1 and 2 without shame.',
  },
  {
    id: 'p3',
    window: 'Nov 16 – Dec 13',
    name: 'Write',
    detail:
      'Full draft by December 5; to Michael and Lafond for reading. The Oxford trip presents the draft in person — supervisor meetings double as the toughest review the paper will get before the room. Title finalized.',
    gate: 'A complete draft has left the building and come back with comments.',
  },
  {
    id: 'p4',
    window: 'Dec 14 – Jan 2',
    name: 'Stage',
    detail:
      'The deck: a lightning talk and a 15-minute version of the paper, rehearsed out loud. Final paper December 20; printed copies; reading program closed out; Graeber packed for the flight.',
    gate: 'Paper, deck, and talk all exist in final form before travel — nothing is finished on the plane.',
  },
  {
    id: 'room',
    window: 'Jan 3 – Jan 17',
    name: 'The Room',
    detail: 'SFI · ADIA Lab · Khalifa University, Abu Dhabi. Two residential weeks. The four goals walk in the door with you.',
    gate: 'Leave with collaborators, not just contacts.',
  },
]

export interface DataQualityRow {
  rank: number
  lane: string
  name: string
  score: number
  strength: string
  weakness: string
}

export const DATA_QUALITY: DataQualityRow[] = [
  {
    rank: 1, lane: 'V', name: 'Who Pays for Cognition (PJM)', score: 9.0,
    strength: 'Everything public, English, rich: auction results, load forecasts, IMM attribution, CEX budget shares — insight-ready today',
    weakness: 'The topic is crowded; the data edge is framing, not access',
  },
  {
    rank: 2, lane: 'I', name: 'Wind / Lithuania power', score: 8.5,
    strength: 'ENTSO-E API is excellent and free; Open-Meteo forecast archive covers the performative object (what agents believed)',
    weakness: 'The inequality join (EU-SILC) is annual and national — thin for incidence claims',
  },
  {
    rank: 3, lane: 'VIII', name: 'The Aquarium (AIS)', score: 8.0,
    strength: 'The only market where every agent broadcasts state by law; free live streams plus Global Fishing Watch backfill',
    weakness: 'FFA and Baltic Exchange price data is licensed; the own-archive starts at zero and compounds only with time',
  },
  {
    rank: 4, lane: 'VI', name: 'The Generator (ABM)', score: 7.5,
    strength: 'Calibration inputs are superb — ENTSO-E generation by unit plus ERA5 forcing, all free',
    weakness: 'Nordic futures for the asset-pricing test are partially paid; the build is long',
  },
  {
    rank: 5, lane: 'VII', name: 'The Observable Economy', score: 7.0,
    strength: 'Sodra’s free monthly per-employer wages and headcounts are world-class — almost no country publishes this',
    weakness: 'Bulk registry financials are paid and annual; the 100/day search channel caps manual work at probe scale',
  },
  {
    rank: 6, lane: 'II', name: 'Water / Brazil', score: 6.5,
    strength: 'ONS reservoirs and CCEE prices are deep, free, and physically rich; the performativity story is unmatched',
    weakness: 'Portuguese regulatory documents and POF microdata make every step slower',
  },
  {
    rank: 7, lane: 'III', name: 'Heat & Sea / US coasts', score: 6.0,
    strength: 'gridstatus makes CAISO and NYISO trivially accessible',
    weakness: 'Forecast-vs-actual archives are patchy where it matters, and this is the most-mined ground of the eight',
  },
  {
    rank: 8, lane: 'IV', name: 'The Ledger (equities)', score: 5.0,
    strength: 'Price data is trivial',
    weakness: 'No unique data at all — the lane’s value is entirely downstream of the physical lanes feeding it',
  },
]

export interface ReadingItem {
  id: string
  title: string
  authors: string
  year: number
  note: string
  reproduce?: string
}

export const CE_PAPERS: ReadingItem[] = [
  { id: 'ce-schelling', title: 'Dynamic Models of Segregation', authors: 'Schelling', year: 1971, note: 'The founding ABM: micro-tolerance, macro-segregation.', reproduce: 'Rebuild the grid model; reproduce the tipping diagram.' },
  { id: 'ce-elfarol', title: 'Inductive Reasoning and Bounded Rationality (El Farol)', authors: 'Arthur', year: 1994, note: 'Prediction as ecology — the bar problem.', reproduce: 'Implement predictor ecologies; reproduce attendance convergence to capacity.' },
  { id: 'ce-sfi-asm', title: 'Asset Pricing Under Endogenous Expectations (SFI Artificial Stock Market)', authors: 'Arthur, Holland, LeBaron, Palmer, Tayler', year: 1997, note: 'The first artificial market: regimes from learning.', reproduce: 'Simplified ASM; reproduce the rational vs complex regime transition.' },
  { id: 'ce-brock-hommes', title: 'Heterogeneous Beliefs and Routes to Chaos', authors: 'Brock & Hommes', year: 1998, note: 'Switching between predictors generates the zoo of dynamics.', reproduce: 'Reproduce the bifurcation diagram from the four-type model.' },
  { id: 'ce-lux-marchesi', title: 'Scaling and Criticality in a Stochastic Multi-Agent Model', authors: 'Lux & Marchesi', year: 1999, note: 'Herding produces volatility clustering and fat tails.', reproduce: 'Reproduce clustered volatility and excess kurtosis from the herding model.' },
  { id: 'ce-cont', title: 'Empirical Properties of Asset Returns: Stylized Facts', authors: 'Cont', year: 2001, note: 'The checklist every market model must pass.', reproduce: 'Reproduce all eleven stylized facts from free daily and intraday data.' },
  { id: 'ce-hidalgo', title: 'The Building Blocks of Economic Complexity', authors: 'Hidalgo & Hausmann', year: 2009, note: 'Capabilities from trade data; the ECI.', reproduce: 'Compute ECI from UN Comtrade; reproduce the growth-prediction regression.' },
  { id: 'ce-debtrank', title: 'DebtRank: Too Central to Fail', authors: 'Battiston, Puliga, Kaushik, Tasca, Caldarelli', year: 2012, note: 'Systemic importance as network centrality.', reproduce: 'Implement DebtRank; reproduce the ranking on the published FED-exposure network.' },
  { id: 'ce-mark0', title: 'Tipping Points in Macroeconomic Agent-Based Models (Mark-0)', authors: 'Gualdi, Tarzia, Zamponi, Bouchaud', year: 2015, note: 'A minimal macro ABM with phase diagrams.', reproduce: 'Implement Mark-0; reproduce the inflation/deflation phase diagram.' },
  { id: 'ce-way', title: 'Empirically Grounded Technology Forecasts and the Energy Transition', authors: 'Way, Ives, Mealy, Farmer', year: 2022, note: 'Wright’s law says fast transition is cheaper — the host school’s flagship.', reproduce: 'Reproduce the headline cost-forecast figure from the public data and code.' },
  { id: 'ce-anderson', title: 'More Is Different', authors: 'Anderson', year: 1972, note: 'The founding creed: emergence over reduction.' },
  { id: 'ce-arthur-lockin', title: 'Competing Technologies, Increasing Returns, and Lock-In', authors: 'Arthur', year: 1989, note: 'Path dependence formalized.' },
  { id: 'ce-arthur-found', title: 'Foundations of Complexity Economics', authors: 'Arthur', year: 2021, note: 'The field’s own statement of itself.' },
  { id: 'ce-farmer-foley', title: 'The Economy Needs Agent-Based Modelling', authors: 'Farmer & Foley', year: 2009, note: 'The Nature manifesto.' },
  { id: 'ce-farmer-ecology', title: 'Market Force, Ecology and Evolution', authors: 'Farmer', year: 2002, note: 'Market ecology stated — the theory Lanes VI and VIII make empirical.' },
  { id: 'ce-scholl', title: 'How Market Ecology Explains Market Malfunction', authors: 'Scholl, Calinescu, Farmer', year: 2021, note: 'Ecology dynamics in a simulated market — PNAS.' },
  { id: 'ce-virtues', title: 'The Virtues and Vices of Equilibrium', authors: 'Farmer & Geanakoplos', year: 2009, note: 'When equilibrium thinking helps and when it blinds.' },
  { id: 'ce-axtell', title: 'Zipf Distribution of U.S. Firm Sizes', authors: 'Axtell', year: 2001, note: 'One page in Science; the power law Lane VII will meet in the registry.' },
  { id: 'ce-gabaix', title: 'Power Laws in Economics and Finance', authors: 'Gabaix', year: 2009, note: 'The survey that organizes the tails.' },
  { id: 'ce-haldane-may', title: 'Systemic Risk in Banking Ecosystems', authors: 'Haldane & May', year: 2011, note: 'Ecology applied to finance from the policy chair.' },
  { id: 'ce-leverage', title: 'The Leverage Cycle', authors: 'Geanakoplos', year: 2010, note: 'Collateral as the hidden state variable.' },
  { id: 'ce-climate-stress', title: 'A Climate Stress-Test of the Financial System', authors: 'Battiston, Mandel, Monasterolo, Schütze, Visentin', year: 2017, note: 'Climate meets financial networks.' },
  { id: 'ce-ks', title: 'Schumpeter Meeting Keynes (the K+S model)', authors: 'Dosi, Fagiolo, Roventini', year: 2010, note: 'The continental ABM-macro benchmark.' },
  { id: 'ce-acemoglu', title: 'The Network Origins of Aggregate Fluctuations', authors: 'Acemoglu, Carvalho, Ozdaglar, Tahbaz-Salehi', year: 2012, note: 'Micro shocks, macro consequences — through the network.' },
  { id: 'ce-barrot', title: 'Input Specificity and the Propagation of Idiosyncratic Shocks', authors: 'Barrot & Sauvagnat', year: 2016, note: 'Disasters travel supply chains — the precedent OE-3 makes continuous.' },
  { id: 'ce-diem', title: 'Quantifying Firm-Level Economic Systemic Risk (Hungary)', authors: 'Diem, Borsos, Reisch, Kertész, Thurner', year: 2022, note: 'The country-scale firm network, done — confidentially.' },
  { id: 'ce-pichler', title: 'Production Networks and Epidemic Spreading (UK)', authors: 'Pichler, Pangallo, del Rio-Chanona, Lafond, Farmer', year: 2022, note: 'The Oxford group’s calibrated shock propagation.' },
  { id: 'ce-bouchaud-rev', title: 'Economics Needs a Scientific Revolution', authors: 'Bouchaud', year: 2008, note: 'The practitioner’s indictment, in Nature.' },
  { id: 'ce-peters', title: 'The Ergodicity Problem in Economics', authors: 'Peters', year: 2019, note: 'Time averages vs ensemble averages — the parked gap, understood.' },
  { id: 'ce-deflated', title: 'The Deflated Sharpe Ratio', authors: 'Bailey & López de Prado', year: 2014, note: 'The other host’s epistemology: most backtests are false.' },
]

export const ANTHRO_PAPERS: ReadingItem[] = [
  { id: 'an-mackenzie', title: 'Constructing a Market, Performing Theory', authors: 'MacKenzie & Millo', year: 2003, note: 'Black-Scholes made itself true — the performativity flagship.', reproduce: 'Replicate the argument on PLD / PJM load forecasts — this is the Lane V theory section.' },
  { id: 'an-granovetter', title: 'Economic Action and Social Structure: Embeddedness', authors: 'Granovetter', year: 1985, note: 'The most-cited paper in economic sociology.', reproduce: 'Replicate embeddedness empirically on the Lithuanian registry ownership network.' },
  { id: 'an-bohannan', title: 'The Impact of Money on an African Subsistence Economy', authors: 'Bohannan', year: 1959, note: 'Spheres of exchange — money is not one thing.', reproduce: 'Replicate the spheres argument on a modern segmented-money case (loyalty points, energy credits, in-game currencies).' },
  { id: 'an-zelizer', title: 'The Social Meaning of Money: Special Monies', authors: 'Zelizer', year: 1989, note: 'Earmarking — households refuse fungibility.', reproduce: 'Replicate earmarking on household energy budgets — the tariff-flag incidence gets its anthropology here.' },
  { id: 'an-geertz', title: 'The Bazaar Economy', authors: 'Geertz', year: 1978, note: 'Information asymmetry, in the AER, from an anthropologist.', reproduce: 'Replicate the search-and-clientelization result on a marketplace dataset (Vinted is Lithuanian).' },
  { id: 'an-polanyi', title: 'The Economy as Instituted Process', authors: 'Polanyi', year: 1957, note: 'The essay-form of The Great Transformation; the school’s shared canon.' },
  { id: 'an-mauss', title: 'The Gift', authors: 'Mauss', year: 1925, note: 'Obligation, reciprocity, and the pre-history of every market.' },
  { id: 'an-sahlins', title: 'The Original Affluent Society', authors: 'Sahlins', year: 1972, note: 'Scarcity as institution, not condition.' },
  { id: 'an-hart', title: 'Heads or Tails? Two Sides of the Coin', authors: 'Hart', year: 1986, note: 'Money as state and market at once.' },
  { id: 'an-callon', title: 'Introduction: The Embeddedness of Economic Markets in Economics', authors: 'Callon', year: 1998, note: 'The Laws of the Markets — economics formats economies.' },
  { id: 'an-ho', title: 'Situating Global Capitalisms', authors: 'Ho', year: 2005, note: 'Wall Street ethnography — how liquidation gets moralized.' },
  { id: 'an-guyer', title: 'Marginal Gains (selections)', authors: 'Guyer', year: 2004, note: 'Conversions and thresholds in Atlantic Africa — value across registers.' },
  { id: 'an-beckert', title: 'Imagined Futures: Fictional Expectations', authors: 'Beckert', year: 2013, note: 'Expectations as fictions that coordinate capitalism.' },
  { id: 'an-graeber-value', title: 'Toward an Anthropological Theory of Value (ch. 1)', authors: 'Graeber', year: 2001, note: 'The value question stated before Debt answered it.' },
  { id: 'an-appadurai', title: 'Commodities and the Politics of Value', authors: 'Appadurai', year: 1986, note: 'Things have social lives; value has politics.' },
]

export const BOOKS: ReadingItem[] = [
  { id: 'bk-farmer', title: 'Making Sense of Chaos', authors: 'Farmer', year: 2024, note: 'September. The argument of the host school, from its central figure.' },
  { id: 'bk-beinhocker', title: 'The Origin of Wealth', authors: 'Beinhocker', year: 2006, note: 'October. The synthesis — read fast, for shape.' },
  { id: 'bk-arthur', title: 'Complexity and the Economy', authors: 'Arthur', year: 2015, note: 'November. The foundations, from the founder.' },
  { id: 'bk-graeber', title: 'Debt: The First 5,000 Years', authors: 'Graeber', year: 2011, note: 'December. The anthropologists’ badge of citizenship; travels to Abu Dhabi.' },
]
