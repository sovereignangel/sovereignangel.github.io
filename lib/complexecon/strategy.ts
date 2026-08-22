// Research strategy for the /complexecon/strategy tab — the competitive map of
// complexity economics: who studies it and how, which subset runs money, and
// where the gaps in their produced research sit. Editorial layer on top of the
// CEcon lab scaffolding (76 researchers, 5,300+ papers, Semantic Scholar graph).

export interface School {
  id: string
  name: string
  where: string
  people: string
  method: string
  owns: string
}

export interface Practitioner {
  id: string
  name: string
  vehicle: string
  produced: string
  moat: string
}

export interface StrategyGap {
  id: string
  name: string
  gap: string
  nearest: string
  claim: string
}

export interface Quadrant {
  id: string
  title: string
  occupants: string
  verdict: string
  highlight: boolean
}

export const STRATEGY_FRAMING = {
  question:
    'Who already holds which ground in complexity economics — and where is the intersection nobody occupies?',
  statement:
    'A research strategy is a map of occupied territory. Complexity economics is studied in roughly eight schools across a dozen institutions; a small subset of its people have actually run money, and what that subset produced clusters tightly around liquid-market microstructure. The gaps are not in the methods — they are in where the methods have been pointed. This page is the editorial layer over the CEcon lab landscape (76 researchers, 5,300+ papers ingested via Semantic Scholar); the lanes on the Research tab are positioned inside the white space mapped here.',
}

export const SCHOOLS: School[] = [
  {
    id: 'santa-fe',
    name: 'The Santa Fe School',
    where: 'Santa Fe Institute, New Mexico',
    people: 'Arthur, Krakauer, Bowles, West, Miller, Page',
    method: 'Foundational theory and toy models — complex adaptive systems as the frame for the economy',
    owns: 'The founding ideas: increasing returns, path dependence, El Farol, the artificial stock market, the pedagogy the whole field learned from. Prestige center, not an empirical machine.',
  },
  {
    id: 'oxford',
    name: 'Oxford / INET',
    where: 'Institute for New Economic Thinking, Oxford',
    people: 'Farmer, Beinhocker, Mealy, Lafond, Way, Pangallo, Pichler, Moran',
    method: 'Empirically calibrated ABM at policy scale; econometrics of technological change',
    owns: 'Technology forecasting via Wright’s law, the energy-transition cost result (Way et al. 2022), housing ABMs, supply-chain contagion. The field’s most productive applied group — and the target collaborator.',
  },
  {
    id: 'continental-abm',
    name: 'Continental ABM Macro',
    where: 'Sant’Anna Pisa · Milan · Bielefeld · Genoa · Kiel · Paris',
    people: 'Dosi, Roventini, Fagiolo, Lamperti, Delli Gatti, Caiani, Dawid, Lux, Gualdi, Mandel',
    method: 'Large agent-based macroeconomic models (K+S, EURACE, Mark-0) with climate modules',
    owns: 'Agent-based macro for policy experiments — fiscal rules, green transition, financial fragility. Deep on model architecture; thin on live-market data and further from prices than any other school.',
  },
  {
    id: 'econophysics',
    name: 'Econophysics',
    where: 'Paris (CFM) · Palermo · Boston · Zurich · Oxford',
    people: 'Bouchaud, Mantegna, Stanley, Sornette, Cont',
    method: 'Statistical physics on tick data — power laws, scaling, market impact, endogenous crises',
    owns: 'Microstructure: the square-root impact law, order-flow dynamics, bubble diagnostics (LPPLS). The school closest to trading — and therefore the most thoroughly picked-over ground in the field.',
  },
  {
    id: 'networks',
    name: 'Networks & Systemic Risk',
    where: 'CSH Vienna · Zurich · Yale · Bank of England · OFR',
    people: 'Thurner, Battiston, Schweitzer, Geanakoplos, Haldane, Turrell, Bookstaber',
    method: 'Network science on regulatory and interbank data; stress tests; leverage cycles',
    owns: 'DebtRank, financial contagion, climate-finance stress testing, the leverage cycle. Their moat is data access — supervisory datasets outsiders never see — which also caps what outsiders can contribute.',
  },
  {
    id: 'economic-complexity',
    name: 'Economic Complexity & Development',
    where: 'Harvard Growth Lab · Toulouse · Rome',
    people: 'Hausmann, Hidalgo, Pietronero, Tacchella',
    method: 'Data science on trade networks — capabilities, product space, fitness',
    owns: 'ECI and the Atlas of Economic Complexity: predicting growth from what countries know how to make. Country-scale and slow-moving; almost never joined to asset prices.',
  },
  {
    id: 'heterogeneous-agents',
    name: 'Heterogeneous Agents & Behavioral',
    where: 'Amsterdam (CeNDEF) · Brandeis',
    people: 'Hommes, LeBaron, Kirman',
    method: 'Small heterogeneous-agent models; learning-to-forecast lab experiments',
    owns: 'The demonstration that simple switching and herding rules reproduce the stylized facts of financial data — bridge between behavioral economics and ABM finance.',
  },
  {
    id: 'tails-ergodicity',
    name: 'Tails, Ergodicity, Adaptation',
    where: 'NYU · London Mathematical Laboratory · MIT',
    people: 'Taleb, Peters, Lo',
    method: 'Probability theory plus polemic — fat tails, time-average vs ensemble-average, evolutionary efficiency',
    owns: 'The practitioner-facing critique: tail risk (Taleb), ergodicity economics (Peters), adaptive markets (Lo). Enormous gravity with traders, thin institutional base, and — for ergodicity especially — almost no empirical asset-market tests.',
  },
  {
    id: 'adia',
    name: 'The New Gulf Hub',
    where: 'ADIA Lab, Abu Dhabi · Khalifa University',
    people: 'López de Prado; SFI winter-school orbit',
    method: 'Financial machine learning meeting complexity science, sovereign-wealth funded',
    owns: 'Not yet a school — a well-capitalized convening ground. The January winter school is its inequality-focused edge, and the direct route into this map.',
  },
]

export const PRACTITIONERS: Practitioner[] = [
  {
    id: 'bouchaud',
    name: 'Jean-Philippe Bouchaud',
    vehicle: 'Capital Fund Management — chairman, still publishing',
    produced: 'The gold standard of trade-and-publish: square-root market impact, order-flow microstructure, endogenous crisis dynamics. Proof the dual role works.',
    moat: 'Decades of proprietary tick data. His ground — liquid-market microstructure — is effectively closed to newcomers without it.',
  },
  {
    id: 'farmer-packard',
    name: 'Farmer & Packard',
    vehicle: 'Prediction Company (1991, sold to UBS)',
    produced: 'Nonlinear-dynamics statistical arbitrage — the founding proof that complexity methods trade. The edge was absorbed into mainstream quant; Farmer returned to academia with market-ecology theory that still has no public empirical implementation.',
    moat: 'Historical. The open residue is market ecology empirics — a theory waiting for a market transparent enough to observe.',
  },
  {
    id: 'sornette',
    name: 'Didier Sornette',
    vehicle: 'Financial Crisis Observatory, ETH Zurich',
    produced: 'LPPLS bubble diagnostics with real-money forecasting experiments. Contested empirical record; the diagnostics survive as one input among many on vol desks.',
    moat: 'Brand ownership of "predictable crashes" — a claim strong enough that few academics will risk standing next to it.',
  },
  {
    id: 'lo',
    name: 'Andrew Lo',
    vehicle: 'AlphaSimplex (founder); MIT LFE',
    produced: 'The Adaptive Markets Hypothesis — evolution replacing efficiency — plus liquid-alt funds built on it. Framework influential, fund results mixed.',
    moat: 'The academic-legitimacy franchise for evolutionary finance inside mainstream economics.',
  },
  {
    id: 'taleb',
    name: 'Taleb & Universa',
    vehicle: 'Empirica, then Universa (advisor to Spitznagel)',
    produced: 'Tail-risk hedging productized; fat-tail probability theory with a public track record in convexity. The one complexity-adjacent strategy retail investors have heard of.',
    moat: 'Persona and asymmetric-payoff specialization. Tail hedging is now a category; the intellectual ground is fully claimed.',
  },
  {
    id: 'geanakoplos',
    name: 'John Geanakoplos',
    vehicle: 'Ellington Management — partner; Yale',
    produced: 'The leverage cycle — collateral rates as the hidden variable of booms and busts, learned on an MBS desk and formalized at Yale.',
    moat: 'Credit-market structure knowledge; the theory is public but the trading application stayed private.',
  },
  {
    id: 'mauboussin-miller',
    name: 'Mauboussin & Miller',
    vehicle: 'Counterpoint Global · Miller Value; both SFI chairs',
    produced: 'Complexity translated for fundamental equity investing — base rates, expectations investing, power-law thinking about outcomes. The channel through which SFI reached Wall Street reading lists.',
    moat: 'Synthesis and distribution, not original research — which means their ground is framing, and it is shareable.',
  },
  {
    id: 'bookstaber',
    name: 'Rick Bookstaber',
    vehicle: 'Salomon, Morgan Stanley, Bridgewater risk; then US Treasury OFR',
    produced: '"The End of Theory" — agent-based models for risk management rather than alpha; regulatory ABM at the Office of Financial Research.',
    moat: 'The risk-manager’s seat: complexity as defense, a lane orthogonal to signal generation.',
  },
  {
    id: 'lopez-de-prado',
    name: 'Marcos López de Prado',
    vehicle: 'AQR, Abu Dhabi Investment Authority; ADIA Lab',
    produced: 'Financial machine learning canon (backtest overfitting, meta-labeling). Adjacent to complexity proper — and the institutional bridge to the Abu Dhabi winter school.',
    moat: 'Sovereign-wealth scale and the ML-for-finance curriculum.',
  },
  {
    id: 'desks',
    name: 'The Silent Occupants',
    vehicle: 'Citadel, DE Shaw, Jane Street commodity and power desks',
    produced: 'The best applied work on physically driven markets — weather models, grid constraints, flow forecasting — and essentially zero public research. Somani’s Power 2026 primer is the exception that proves the rule: the knowledge leaks out only when someone leaves.',
    moat: 'Capital, data, and silence. They occupy the physical-markets quadrant privately — which is exactly why the public-research seat there is empty.',
  },
]

export const GAPS: StrategyGap[] = [
  {
    id: 'gap-physical',
    name: 'Physical states → market prices',
    gap: 'No school traces climate and physical-system state variables (wind fields, reservoir levels, heat domes) through electricity markets into asset prices as public research. The methods exist; they have never been pointed here.',
    nearest: 'Farmer’s group does energy-transition cost forecasting (policy-facing, not price-facing); Tesfatsion built ABMs of electricity market design (academic, US-centric); Battiston does climate-finance stress tests (regulatory). Power desks do it privately and publish nothing.',
    claim: 'Research Lanes I–III. The entire climate-grids-balance-sheets program sits in this gap.',
  },
  {
    id: 'gap-small-markets',
    name: 'Small and under-covered markets',
    gap: 'Practitioner complexity research clusters on liquid US and EU markets because that is where the tick data and the capacity are. Small zones — the Baltics, Brazil in English — have no independent researcher at all.',
    nearest: 'Econophysics needs deep tick data; ABM macro works on stylized economies. Neither has an incentive to cover a market too small for a large fund to trade.',
    claim: 'Lanes I and II. Small is the feature: a market small enough to be fully observable is a laboratory, not a limitation.',
  },
  {
    id: 'gap-performativity',
    name: 'Model performativity with market data',
    gap: 'MacKenzie-style social studies of finance — models constituting the prices they claim to measure — is written by sociologists who do not trade, about traders who do not write. Nobody holds both sides.',
    nearest: 'MacKenzie, Callon, Muniesa (sociology, no book); Bouchaud writes on reflexivity and instability but not on conventions as institutions.',
    claim: 'BR-3 (PLD as a price literally written by a model) plus the existing valuation-conventions lane. One program, two empirical sites.',
  },
  {
    id: 'gap-incidence',
    name: 'Conventions → household incidence',
    gap: 'Complexity economics studies inequality (Sethi, Bowles) and market design separately. Nobody joins pricing conventions to distributive incidence using live market data — who pays for weather is an unclaimed empirical question.',
    nearest: 'Energy-poverty literature (no market microdata); ABM inequality work (no real markets); the winter school’s own framing (needs exactly this mechanism).',
    claim: 'LT-4 and BR-4 — the Inequality Bridge. This is the Abu Dhabi paper.',
  },
  {
    id: 'gap-ecology',
    name: 'Market ecology empirics',
    gap: 'Farmer’s market-ecology theory — strategies as species, markets as ecosystems — has almost no public empirical implementation, because liquid markets never reveal who holds what.',
    nearest: 'Farmer’s own theory papers; regulatory studies with confidential data that cannot be reproduced.',
    claim: 'A small transparent power market (Nord Pool LT publishes near-complete data) is the fruit-fly organism this theory has been waiting for. Future lane; flagged, not yet opened.',
  },
  {
    id: 'gap-ergodicity',
    name: 'Ergodicity economics, tested',
    gap: 'Peters’ time-average critique has enormous practitioner resonance and almost no empirical asset-market tests. An open niche — but off the climate lane.',
    nearest: 'London Mathematical Laboratory (theory and simulation); Taleb (endorsement, not tests).',
    claim: 'Parked. Noted so the map is honest about white space deliberately not claimed.',
  },
]

export const QUADRANTS: Quadrant[] = [
  {
    id: 'q-book-micro',
    title: 'Runs a book · Financial microstructure',
    occupants: 'Bouchaud/CFM, Prediction Company’s heirs, every systematic desk',
    verdict: 'Crowded, data-moated, mature. Do not compete here.',
    highlight: false,
  },
  {
    id: 'q-nobook-micro',
    title: 'Publishes only · Financial microstructure',
    occupants: 'Academic econophysics, ABM finance, heterogeneous agents',
    verdict: 'Picked over; the stylized facts are catalogued. Read it, cite it, move on.',
    highlight: false,
  },
  {
    id: 'q-nobook-physical',
    title: 'Publishes only · Physical-economic systems',
    occupants: 'Farmer’s energy group, Tesfatsion, climate-finance networks',
    verdict: 'Policy-facing, not price-facing. The methods live here; the market question is never asked.',
    highlight: false,
  },
  {
    id: 'q-book-physical',
    title: 'Runs a book · Physical-economic systems',
    occupants: 'Commodity and power desks — privately, publishing nothing',
    verdict: 'The open seat: occupy this quadrant in public. Bouchaud’s trade-and-publish model, transplanted from microstructure to physical transmission, in markets small enough to observe completely.',
    highlight: true,
  },
]

export const POSITION_STATEMENT =
  'Everyone who trades studies liquid-market microstructure; everyone who studies physical systems does not trade. The strategy is the unoccupied intersection: physically driven, fully observable small markets — traded in the Armstrong book, published through CEcon, framed by conventions and incidence for SFI and Abu Dhabi. Not a new method; the field’s existing methods, pointed somewhere they have never been pointed, by someone holding both the book and the pen.'

export const SCAFFOLDING_NOTE = {
  text: 'The underlying dataset — 76 researchers tiered core/adjacent/peripheral with Semantic Scholar graphs, 5,300+ papers tagged across eleven domains, temporal and cross-domain gap annotations — lives in the CEcon platform built with Michael Ralph at complexity-economics.org. This page is the strategy read on top of that scaffolding; the landscape and researcher graphs there are the evidence base for the map here.',
  url: 'https://www.complexity-economics.org/landscape',
  label: 'complexity-economics.org / landscape',
}
