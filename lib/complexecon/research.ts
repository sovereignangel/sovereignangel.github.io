// Research lanes for the /complexecon/research working document.
// This file is the single source of truth for the climate → grid → balance sheet
// research program. The main pathway page (pathway.ts) is untouched by design —
// this document iterates independently until a lane is committed.

export type LaneStatus = 'candidate' | 'probing' | 'committed' | 'parked'

export interface ResearchHypothesis {
  id: string
  claim: string
  test: string
}

export interface DataSource {
  name: string
  url: string
  note: string
}

export interface ResearchLane {
  id: string
  numeral: string
  vector: string
  market: string
  name: string
  status: LaneStatus
  thesis: string
  whyOpen: string
  mechanism: string
  hypotheses: ResearchHypothesis[]
  data: DataSource[]
  armstrongAngle: string
  quantSkill: string
  firstProbe: string
}

export interface ScorecardRow {
  criterion: string
  note: string
  scores: Record<string, 'high' | 'med' | 'low'>
}

export interface PathStep {
  window: string
  label: string
  detail: string
  gate: string
}

export interface LogEntry {
  date: string
  version: string
  note: string
}

// Deep dive beneath a lane: the transmission chain link by link, what is already
// on the public record, how the causal claim is identified, the nearest prior
// work and what it leaves open, the dated plan, and how the lane dies.
export interface ChainLink {
  step: string
  state: string
  convention: string
}

export interface KnownFact {
  fact: string
  source: string
  asOf: string
}

export interface PriorWork {
  cite: string
  did: string
  gap: string
}

export interface OpenQuestion {
  question: string
  matters: string
}

export interface PlanStep {
  window: string
  deliverable: string
  gate: string
}

export interface LaneDeepDive {
  chain: ChainLink[]
  facts: KnownFact[]
  identification: string
  priorWork: PriorWork[]
  openQuestions: OpenQuestion[]
  plan: PlanStep[]
  failureModes: string[]
  crossLane: string
}

export const RESEARCH_FRAMING = {
  title: 'Climate, Grids, Balance Sheets',
  question:
    'How do climate signals — wind, water, heat, sea — propagate through electricity markets into the cash flows and valuations of listed companies, and where along that chain is the propagation mispriced?',
  statement:
    'Neel Somani wrote the primer on US power in the age of AI; that seat is taken. The open seat is the researcher who traces climate physics through under-covered grids into equity prices, with complexity economics as the method. Four markets, chosen for their coverage gaps in English and their distinct climate drivers: Lithuania (wind, and a once-in-history topology change), Brazil (water, and a spot price that is literally the output of a government model), and New York and California (heat and sea, where the equity expressions actually trade). Each regional lane produces a physical state variable; a fourth lane turns those state variables into Armstrong signals.',
}

export const MARKETS = [
  {
    id: 'lt',
    name: 'Lithuania · Nord Pool LT',
    driver: 'Wind',
    gap: 'Near-zero independent English-language research; Feb 2025 BRELL desynchronization unwritten-up',
  },
  {
    id: 'br',
    name: 'Brazil · ONS / CCEE',
    driver: 'Water',
    gap: 'Serious work is in Portuguese; the performativity framing of PLD is untouched anywhere',
  },
  {
    id: 'nyc',
    name: 'New York · NYISO Zone J',
    driver: 'Heat · Sea',
    gap: 'Well-covered market, thin seam: the ocean-atmosphere channel behind load and price tails',
  },
  {
    id: 'ca',
    name: 'California · CAISO',
    driver: 'Heat · Sea',
    gap: 'Most-studied grid in the world; marine-layer solar error and correlated heat domes still under-modeled',
  },
  {
    id: 'pjm',
    name: 'PJM · 13 states + DC',
    driver: 'Cognition · Load',
    gap: 'The best-covered capacity market on earth; the forecast-to-price loop and the incidence by income decile are still unwritten',
  },
]

export const LANES: ResearchLane[] = [
  {
    id: 'lane-wind-lt',
    numeral: 'I',
    vector: 'Wind',
    market: 'Lithuania · Baltics',
    name: 'Forecast Error as the Price of Wind',
    status: 'probing',
    thesis:
      'In a small, wind-heavy, newly resynchronized bidding zone, wind forecast error is the dominant driver of intraday and imbalance price spikes — and forecast disagreement between models (GFS vs ECMWF ensemble spread) is a measurable early-warning state variable for tail events. The kite wind brief already computes the front half of this signal.',
    whyOpen:
      'Baltic power has essentially no independent English-language researcher. On 8 February 2025 the three Baltic states desynchronized from the Russian-controlled BRELL ring, and on 9 February synchronized with the Continental European grid — a once-in-history change in network topology whose market consequences (balancing costs, price coupling, frequency-reserve procurement) remain largely unwritten. Physical presence in Palanga through late September is a live edge: the wind being forecast is observable out the window.',
    mechanism:
      'A grid topology change is literal network rewiring — the cleanest natural experiment in network economics available anywhere right now. Imbalance prices are an emergent property of correlated forecast errors across a small zone: when every producer misses in the same direction, the system state jumps rather than averages out. Fat tails from synchronized error, not from any single actor.',
    hypotheses: [
      {
        id: 'LT-1',
        claim:
          'Days with high GFS-ECMWF ensemble disagreement over the Baltic coast show significantly fatter intraday-minus-day-ahead spread tails in the LT zone. Forecast dispersion, not the forecast itself, is the tradable state variable.',
        test: 'Eighteen months of ENTSO-E LT day-ahead and imbalance prices against archived Open-Meteo multi-model wind forecasts; quantile regression of spread tails on dispersion; fix the spike threshold before looking.',
      },
      {
        id: 'LT-2',
        claim:
          'The February 2025 synchronization to Continental Europe produced a structural break in LT balancing costs and in LT price coupling with SE4 and Poland — detectable, datable, and attributable.',
        test: 'Regime-switching model and event study across the desync date on coupling coefficients and balancing-energy volumes; falsified if no break survives controls for fuel prices and interconnector outages.',
      },
      {
        id: 'LT-3',
        claim:
          'The Lithuanian buildout raises price volatility before it lowers it — and the driver is onshore wind and solar, not offshore. Wind and solar passed 6 GW in early 2026 against a peak load near 2 GW, offshore has slipped toward 2030 after two failed tenders, and 3.7 GW of batteries sit in letters of intent: negative-price hours and cannibalization lead, and the smoothing arrives with storage, datable from the battery commissioning schedule.',
        test: 'Negative-price frequency and intraday-minus-day-ahead volatility in LT by month against wind-plus-solar capacity and cumulative batteries commissioned; cross-sectional check against Denmark and northern Germany at matched penetration, controlling for interconnection ratio; falsified if volatility falls with penetration before storage arrives.',
      },
      {
        id: 'LT-4',
        claim:
          'In hours when gas sets the uniform clearing price, wind owners collect inframarginal rents financed through the bills of households in some of the EU’s most energy-poor member states — and the post-BRELL security premium is likewise socialized onto ratepayers by convention. The rent transfer is calculable, and it lands on the inequality frame directly.',
        test: 'Reconstruct hourly inframarginal rents for LT wind from ENTSO-E prices and a merit-order proxy; join spike frequency to EU-SILC energy-poverty indicators across the Baltics; headline number is euros transferred per household per year under the clearing convention.',
      },
      {
        id: 'LT-5',
        claim:
          'Who pays for wind forecast error is a convention. The 15-minute single imbalance price, the balance-responsibility exemptions, and the historical treatment of supported producers’ balancing as a public-service cost decide whether the error lands on the wind owner, the balance responsible party, or every consumer through the VIAP levy and the transmission tariff — and each rule change since the Baltic balancing market opened in February 2025 is a datable break in who paid.',
        test: 'Reconstruct the imbalance cost of LT wind by settlement period — imbalance volume times imbalance-minus-day-ahead price — from ENTSO-E and the Baltic transparency dashboard; split by balance-responsibility regime and by PSO coverage; join to household counts. Headline: euros per household per year of forecast error socialized under each regime.',
      },
    ],
    data: [
      { name: 'ENTSO-E Transparency', url: 'https://transparency.entsoe.eu', note: 'free API — prices, load, generation, balancing; the workhorse' },
      { name: 'Nord Pool', url: 'https://data.nordpoolgroup.com', note: 'day-ahead and intraday for LT zone' },
      { name: 'Litgrid', url: 'https://www.litgrid.eu', note: 'TSO data — balancing, interconnectors, desync documentation' },
      { name: 'Open-Meteo', url: 'https://open-meteo.com', note: 'free GFS / ECMWF / ICON ensembles + historical forecast archive — same stack as the kite brief' },
      { name: 'Eurostat EU-SILC', url: 'https://ec.europa.eu/eurostat/web/income-and-living-conditions', note: 'energy-poverty indicators by country and year — the inequality join for LT-4' },
      { name: 'Baltic Transparency Dashboard', url: 'https://baltic.transparency-dashboard.eu', note: 'the three Baltic TSOs’ joint publication — imbalance prices, aFRR and mFRR balancing energy prices and activations for EE, LV, LT; the LT-5 source if ENTSO-E imbalance data is thin' },
      { name: 'Open-Meteo Historical Forecast API', url: 'https://open-meteo.com/en/docs/historical-forecast-api', note: 'archived deterministic runs — IFS since 2017, GFS since 2021, ICON since 2022 — at 100 m hub height; ensemble spread is not archived, so the daily logger starts now' },
    ],
    armstrongAngle:
      'A paper-traded day-ahead vs intraday spread signal conditioned on forecast dispersion. Even without market access, a timestamped forecast-and-outcome log is a track-record artifact — the Armstrong pattern of a live book as empirical evidence, applied to power.',
    quantSkill:
      'Extreme value theory, ensemble meteorology, regime-switching and structural-break econometrics — the tail-risk toolkit, learned on data with genuinely fat tails.',
    firstProbe:
      'Two weeks: pull 18 months of ENTSO-E LT prices plus the Open-Meteo forecast archive into macro-signals; one notebook answering "does model disagreement predict spike days?"; publish as the first post of a Baltic power series — "The Grid After BRELL."',
  },
  {
    id: 'lane-water-br',
    numeral: 'II',
    vector: 'Water',
    market: 'Brazil · ONS / CCEE',
    name: 'The Price That a Model Writes',
    status: 'candidate',
    thesis:
      'Brazil’s spot price (PLD) is not discovered by an auction — it is computed by a government-run stochastic optimization model (NEWAVE / DECOMP / DESSEM) fed by reservoir levels and inflow forecasts. It is the purest performativity case in world electricity: the model does not estimate the price, it is the price. The climate chain is long and legible: ENSO state, rainfall over the Southeast and Center-West basins, reservoir inflows, model output, contract settlement, utility earnings.',
    whyOpen:
      'Nearly all serious research lives in Portuguese; English coverage of the world’s largest hydro-dominated market is remarkably thin. And nobody anywhere has written the MacKenzie-style study of PLD as a performative convention — an engine, not a camera, in the most literal sense available. This is the lane that fuses the new climate program with the existing valuation-conventions lane rather than competing with it.',
    mechanism:
      'A slow state variable (stored water) coupled to a fast one (price) through an explicit model whose conventions — the CVaR risk-aversion parameter, price caps and floors, inflow scenario trees — redistribute billions between generators and consumers. Model assumptions as distributive institutions: the exact claim of the Abu Dhabi lane, with a balance sheet attached.',
    hypotheses: [
      {
        id: 'BR-1',
        claim:
          'ENSO indices lead PLD regime shifts by one to two quarters through the inflow channel; a parsimonious reservoir-state model beats naive persistence in forecasting PLD regime, and the lead is long enough to act on.',
        test: 'NOAA ONI vs ONS reservoir levels vs monthly PLD, 2001-2026; Markov regime model with ENSO as exogenous driver; falsified if ENSO adds nothing beyond current reservoir level.',
      },
      {
        id: 'BR-2',
        claim:
          'Listed Brazilian generators and utilities underreact to reservoir-state changes — the physical state variable leads earnings revisions and returns, because the hydrological balance sheet updates faster than the analyst one.',
        test: 'Event study on ADRs (Eletrobras EBR, Cemig CIG, Copel ELP, Sabesp SBS) around large reservoir-state moves; long-short conditioned on hydrology vs sector benchmark; pre-registered horizon.',
      },
      {
        id: 'BR-3',
        claim:
          'PLD deviates from a physically grounded shadow price in systematic, directional ways attributable to the model’s own conventions — and each convention change (the 2013 CVaR introduction, the 2021 move to hourly PLD) measurably redistributed money between market segments.',
        test: 'Reconstruct a simple physical benchmark price from reservoir and load data; regress the PLD-benchmark gap on convention-change dates; the redistribution estimate is the paper’s headline number.',
      },
      {
        id: 'BR-4',
        claim:
          'The 2021 drought’s costs were distributed by convention, not by weather: tariff flags — including the special water-scarcity flag — moved scarcity costs onto household bills, regressively, since electricity is a far larger budget share for poor households, while the CVaR convention cushioned generator margins. The incidence of ENSO is an institutional choice.',
        test: 'ANEEL tariff-flag history joined to IBGE POF electricity budget shares by income decile; compute the 2021-22 scarcity burden as a share of income per decile against a counterfactual where generators bear the hydrological risk.',
      },
    ],
    data: [
      { name: 'ONS open data', url: 'https://dados.ons.org.br', note: 'reservoir levels, inflows, generation by source — free and deep' },
      { name: 'CCEE', url: 'https://www.ccee.org.br', note: 'PLD history, market rules, settlement' },
      { name: 'NOAA ONI', url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php', note: 'canonical ENSO index, 1950-present' },
      { name: 'B3 / ADRs', url: 'https://www.b3.com.br', note: 'equity expressions; ADRs trade in New York' },
      { name: 'ANEEL', url: 'https://www.gov.br/aneel', note: 'tariff-flag history and rate structures — the distributive instrument for BR-4' },
      { name: 'IBGE POF', url: 'https://www.ibge.gov.br/estatisticas/sociais/populacao/24786-pesquisa-de-orcamentos-familiares-2.html', note: 'household budget survey — electricity spend by income decile' },
    ],
    armstrongAngle:
      'The most directly tradable lane: US-listed ADRs mean the hydro-conditioned long-short runs in an ordinary brokerage account inside the Armstrong book. Sabesp adds a pure water-scarcity leg beyond electricity.',
    quantSkill:
      'Stochastic dynamic programming intuition, climate teleconnections, cross-asset event studies — plus the discipline of working a market in a second language, which is itself the moat.',
    firstProbe:
      'Two weeks: one chart worth a thousand words — 25 years of Southeast reservoir level, ONI, and PLD on a shared timeline; a memo titled "The Price That a Model Writes" framing BR-3 for the CEcon paper with Michael.',
  },
  {
    id: 'lane-heat-us',
    numeral: 'III',
    vector: 'Heat · Sea',
    market: 'New York · California',
    name: 'The Sea Sets the Tail',
    status: 'candidate',
    thesis:
      'In coastal load centers the ocean, not the thermometer, sets the tail. California’s marine layer decides whether ten gigawatts of solar show up; New York’s sea breeze decides whether Zone J peaks or coasts. Multi-day heat domes are correlated events that capacity constructs price as roughly independent — the Dunkelflaute error, translated into heat.',
    whyOpen:
      'These are the most-studied grids on earth, so the gap is a seam, not a field: quant desks overwhelmingly proxy weather with raw temperature, and the specific ocean-atmosphere mechanisms — coastal inversion strength, sea-breeze onset timing — sit in meteorology journals, not market models. Narrower edge than Lanes I-II, but this is where the tradable US equity expressions live.',
    mechanism:
      'Correlation structure as the mispriced object. Scarcity pricing and resource adequacy treat event-days as draws; heat domes are regimes — persistent, spatially correlated, demand-and-supply-coupled (heat lifts load while derating plants and lines). The same class of error as CDO correlation in 2007: right marginals, wrong copula.',
    hypotheses: [
      {
        id: 'US-1',
        claim:
          'CAISO solar and net-load forecast error is conditionally predictable from marine-layer indicators, and spike-day probability with it — the grid inherits the forecast skill ceiling of coastal stratus.',
        test: 'CAISO forecast-vs-actual archives against coastal inversion and cloud-cover data; does a marine-layer index improve spike-day classification over temperature alone?',
      },
      {
        id: 'US-2',
        claim:
          'Scarcity events cluster in multi-day heat-dome regimes; capacity and RA constructs underprice that clustering, so the realized distribution of consecutive-day scarcity beats the independence assumption by a measurable factor.',
        test: 'Historical CAISO / NYISO scarcity hours fitted as a regime process vs independent draws; the likelihood ratio is the underpricing estimate.',
      },
      {
        id: 'US-3',
        claim:
          'NYISO Zone J price separation is predictable on sea-breeze-failure days — when the marine cooling that the load forecast implicitly assumes does not arrive.',
        test: 'Zone J vs rest-of-state spreads conditioned on sea-breeze onset from coastal station data; effect must survive controlling for raw temperature.',
      },
    ],
    data: [
      { name: 'gridstatus', url: 'https://github.com/gridstatus/gridstatus', note: 'open-source Python access to CAISO / NYISO / ERCOT — prices, load, forecasts' },
      { name: 'CAISO OASIS', url: 'http://oasis.caiso.com', note: 'the raw source — LMPs, forecasts, outages' },
      { name: 'NOAA / HRRR', url: 'https://rapidrefresh.noaa.gov/hrrr/', note: 'high-resolution mesoscale model; marine layer and sea breeze live here' },
      { name: 'EIA API', url: 'https://www.eia.gov/opendata/', note: 'generation, capacity, fuel — free' },
    ],
    armstrongAngle:
      'Expression through listed merchants and utilities — Vistra, Constellation, NRG on scarcity states; and the standing insurance screen: PG&E’s wildfire liabilities were the actual MBIA trade of 2018-19, and California utility wildfire exposure remains the template for finding the next one.',
    quantSkill:
      'Mesoscale meteorology, spatial statistics, scarcity-pricing mechanics — and fluency in the two markets every US interviewer knows, which makes the whole program legible to Bridgewater and to desks.',
    firstProbe:
      'Two weeks, after Lanes I-II probes: gridstatus pipeline for CAISO forecast error; one test of US-1 on summer 2020-2025; short memo on whether the seam is real or already arbitraged.',
  },
  {
    id: 'lane-transmission',
    numeral: 'IV',
    vector: 'All vectors',
    market: 'Cross-market · equities',
    name: 'The Climate-to-Balance-Sheet Ledger',
    status: 'candidate',
    thesis:
      'Physical climate anomalies transmit to listed-company cash flows through power prices with lags and nonlinearities the equity market misprices — because merchant generators, regulated utilities, insurers, and power-hungry data centers sit on different clocks between anomaly and earnings. This is the integrating lane: each regional lane produces a physical state variable; this one turns state variables into Armstrong positions.',
    whyOpen:
      'Climate-equity work mostly means ESG scores and disclosure studies — slow, annual, narrative. Almost nobody maps high-frequency physical grid states to the earnings mechanics of specific balance sheets. The regional lanes supply exactly the state variables that make this tractable.',
    mechanism:
      'Heterogeneous agents on heterogeneous clocks: a merchant generator reprices with the spot market in hours, a regulated utility through rate cases in years, an insurer at renewal, a data center through PPA renegotiation. The lag structure between the same shock hitting different balance sheets is the alpha — and a genuinely complexity-economic object: one signal, many response functions.',
    hypotheses: [
      {
        id: 'TX-1',
        claim:
          'A portfolio long merchant generators, short regulated utilities, conditioned on regional scarcity state, outperforms — the market prices the sector, not the clock-speed difference within it.',
        test: 'Backtest on US names with CAISO / ERCOT scarcity states; then out-of-sample structurally in Brazil with the hydro state; pre-registered rules, walk-forward only.',
      },
      {
        id: 'TX-2',
        claim:
          'Insurers and utilities with concentrated exposure to correlated climate tails — wildfire, drought, heat-dome outage clusters — systematically underprice them until an event forces repricing. There is a screenable "next MBIA" in the intersection of Lane II’s drought states and Lane III’s correlation error.',
        test: 'Build the exposure screen from regulatory filings and physical state data; the falsifiable form is that screened names show asymmetric drawdown behavior around climate events versus unscreened peers.',
      },
    ],
    data: [
      { name: 'SEC EDGAR', url: 'https://www.sec.gov/cgi-bin/browse-edgar', note: 'utility and insurer exposure from 10-Ks — segment data, wildfire and weather disclosures' },
      { name: 'yfinance / broker data', url: 'https://github.com/ranaroussi/yfinance', note: 'equity prices for event studies and backtests' },
    ],
    armstrongAngle:
      'This lane is Armstrong: it is the strategy layer that consumes the other three lanes’ research. Every regional probe that survives its gate feeds a signal here; the 12-month track record is built from these positions.',
    quantSkill:
      'Event-study methodology, factor construction, fundamental data pipelines, portfolio construction — the complete quant-equity toolkit, assembled around an original signal family instead of a textbook one.',
    firstProbe:
      'Runs continuously rather than as a sprint: as each regional probe closes, write the one-page transmission memo — which listed balance sheets feel this state variable, on what clock, and what is the cleanest expression.',
  },
  {
    id: 'lane-cognition-pjm',
    numeral: 'V',
    vector: 'Cognition · Load',
    market: 'PJM · United States',
    name: 'Who Pays for Cognition',
    status: 'probing',
    thesis:
      'The Abu Dhabi paper. AI datacenter load does not distribute its own costs — the conventions of capacity procurement do. Utilities’ load forecasts set PJM’s reliability requirement, the requirement sets the capacity price, and the price lands on household bills through tariff design. The forecast is a performative convention: the model writes the price, again. This is the cost ledger of the original SFI lane — “who accumulates when cognition is free” was the gains ledger; this is who pays.',
    whyOpen:
      'The facts are public and dramatic. PJM’s capacity price went from $28.92 to $269.92 per MW-day for 2025/26, and the market monitor attributed 63% of the increase — about $9.3 billion — to data centers. The next three auctions all cleared at the cap: $329.17 for 2026/27, $333.44 for 2027/28 (6,623 MW short of the reliability requirement), and the cap again in July 2026 for 2028/29. Four auctions, $63.6 billion, of which the monitor attributes $29.4 billion (46%) to data centers. The incidence question has been raised as law (Peskoe & Martin, Harvard Electricity Law Initiative, 2025), as advocacy (Synapse for the DC People’s Counsel, Maryland OPC, Union of Concerned Scientists), and as policy — the White House and thirteen governors’ principles of January 2026, PJM’s board letter a day later, FERC’s June 2026 show-cause orders to every RTO. Nobody has written the complexity version: the reflexive forecast-to-price loop, the distribution by income decile, or the conventions compared as parameters.',
    mechanism:
      'A feedback loop with a convention at its center. Speculative interconnection requests and utility pipeline counting inflate load forecasts; forecasts raise the procurement target; the auction clears higher; bills rise; the rise is socialized across a customer class whose budget shares differ by decile. Change the convention — who bears forecast risk, how large loads are tariffed — and the same electrons produce a different distribution. Conventions as parameters of a system that generates inequality.',
    hypotheses: [
      {
        id: 'PJ-1',
        claim:
          'Incidence: the datacenter-attributable share of 2025-26 capacity costs, passed through to residential bills, is regressive in income share — the bottom quintile bears a multiple of the top quintile’s burden as a fraction of income.',
        test: 'PJM auction results by zone and utility pass-through (rate filings, EIA-861) allocate the attributable cost to residential customers; BLS Consumer Expenditure Survey electricity budget shares by income decile convert it to burden. Headline: dollars per household per year and percent of income, by decile.',
      },
      {
        id: 'PJ-2',
        claim:
          'Reflexivity: a measurable share of the capacity-price increase was written by load-forecast revisions rather than by realized load — the forecast convention, not the electrons, moved the price.',
        test: 'Decompose the 2024/25-to-2028/29 changes in reliability requirement and clearing outcome across PJM load-forecast revisions, accreditation methodology, retirements and RMR exclusion, and realized peak. Two constraints fixed in advance: the price is censored at the cap in three of four auctions, so the decomposition runs in megawatts of shortfall and unconstrained shadow price, not dollars per MW-day; and the IMM’s partial counterfactuals interact — its 2025/26 attributions sum to roughly $18 billion against a $12.5 billion increase — so the method is an order-averaged Shapley decomposition, with the forecast-written share as the Shapley value of the forecast revision. Pre-register before pulling results.',
      },
      {
        id: 'PJ-3',
        claim:
          'Counterfactual conventions: under alternative cost-allocation rules — large-load tariffs, datacenters bearing forecast risk, price collars — the same load produces materially different household burdens; the dollars shifted per household is a property of the rule, not the demand.',
        test: 'A calibrated procurement-and-allocation model (simple first, agent-based if time allows) run under the status quo and three conventions now being adopted in practice — minimum-demand large-load tariffs, causation-based allocation to the LSEs whose data centers are uncommitted, and bring-your-own-generation with curtailment; output is dollars shifted per household per year under each. The Farmer-grade section: conventions as system parameters.',
      },
      {
        id: 'PJ-4',
        claim:
          'Conventions move forecasts. Utilities in states that adopted minimum-demand large-load tariffs — AEP Ohio in 2025, Dominion’s GS-5 approved November 2025 — revise their large-load adjustments down more in the 2026 and 2027 forecast vintages than utilities in states without one; the vetting rule, not realized demand, changes the number that sets the price.',
        test: 'Panel of utility-level large-load adjustments from PJM’s per-utility forecast documentation across the 2024-2027 vintages, joined to tariff adoption dates from the E3/Halcyon catalogue; difference-in-differences on the revision; the January 2027 vintage is the out-of-sample test and lands during the winter school.',
      },
    ],
    data: [
      { name: 'PJM capacity market results', url: 'https://www.pjm.com/markets-and-operations/rpm', note: 'Base Residual Auction results, planning parameters (reliability requirement, reserve margin, forecast peak, demand curve) and aggregate supply curves by delivery year and zone — the Shapley inputs' },
      { name: 'PJM load forecast reports', url: 'https://www.pjm.com/planning/resource-adequacy-planning/load-forecast-dev-process', note: 'annual forecasts and revisions — the performative object' },
      { name: 'Monitoring Analytics (IMM)', url: 'https://www.monitoringanalytics.com', note: 'State of the Market reports; the 63% datacenter attribution' },
      { name: 'EIA-861', url: 'https://www.eia.gov/electricity/data/eia861/', note: 'retail sales and revenue by utility and customer class' },
      { name: 'BLS Consumer Expenditure Survey', url: 'https://www.bls.gov/cex/', note: 'electricity spend by income decile — the incidence join' },
      { name: 'Peskoe & Martin 2025', url: 'http://eelp.law.harvard.edu/wp-content/uploads/2025/03/Harvard-ELI-Extracting-Profits-from-the-Public.pdf', note: 'the legal account of the cost shift — nearest prior work' },
      { name: 'Who Pays for Data Centers', url: 'https://whopaysfordatacenters.com', note: 'independent tracker of auction results, IMM attributions, state bills and tariffs, every claim linked to a primary source' },
      { name: 'Synapse for DC OPC 2025', url: 'https://opc-dc.gov/wp-content/uploads/2025/05/PJM-Capacity-Market-Report-FINAL-OPC-Synapse.pdf', note: 'drivers with IMM magnitudes and a worked LDA-to-bill method — the §1 template' },
      { name: 'UCS transmission brief', url: 'https://www.ucs.org/sites/default/files/2025-09/PJM%20Data%20Center%20Issue%20Brief%20-%20Sep%202025.pdf', note: 'the second ledger — $4.36 billion of 2024 data-center transmission socialized across seven states' },
      { name: 'E3 / Halcyon large-load tariffs', url: 'https://www.ethree.com/wp-content/uploads/2026/05/E3_Large-Load-Tariff-Whitepaper-1.pdf', note: '23 states’ tariffs and terms as of May 2026 — the treatment dates for PJ-4' },
      { name: 'FERC RM26-4', url: 'https://www.ferc.gov/rm26-4', note: 'large-load interconnection docket; the June 2026 show-cause orders to all six RTOs' },
    ],
    armstrongAngle:
      'Research capital first. A separate one-page trade memo maps the findings to who captures the capacity windfall — independent power producers with PJM exposure vs regulated utilities vs hyperscalers — without shaping the research.',
    quantSkill:
      'Incidence analysis, price decomposition, calibrated procurement modelling — and the discipline of a pre-registered decomposition on a politically charged question.',
    firstProbe:
      'Two-week data sprint between the two races (September 14-25): auction results and planning parameters back to 2020/21, the IMM analyses, load-forecast vintages 2022-2026, EIA-861 and CEX budget shares; one chart of forecast vintages against capacity prices; the §1 incidence skeleton. Michael drafts the conventions-as-institutions theory section in parallel.',
  },
  {
    id: 'lane-generator',
    numeral: 'VI',
    vector: 'Weather · ABM',
    market: 'Nord Pool LT · Nordic futures',
    name: 'The Generator: Weather to ABM to Asset Pricing',
    status: 'candidate',
    thesis:
      'The Farmer-Lopez de Prado intersection, built as one object: an agent-based model of a small transparent power market, driven by real weather data, that prices assets. Farmer needs an ABM that predicts rather than illustrates and a market transparent enough to observe its ecology; Lopez de Prado needs synthetic data with true causal structure to defeat backtest overfitting. A merit-order ABM of the LT zone under measured weather is both at once — the causal market generator.',
    whyOpen:
      'Market generators exist as GANs, which learn correlations with no causal content — failing Lopez de Prado’s own standard. Farmer’s market ecology has no public empirical implementation because liquid markets never reveal who holds what. Electricity markets dissolve both obstacles: supply is near-mechanical merit order, demand is inelastic, participation is observable, and the exogenous driver is measured by satellites. Nobody has assembled the pieces.',
    mechanism:
      'Weather paths (reanalysis and forecast archives) drive generation and load; heterogeneous agents — wind, gas, hydro generators, retailers, hedgers, speculators — bid into a uniform-price auction; prices, spikes, and forward premia emerge. The asset-pricing claim is market ecology made testable: the electricity forward risk premium (Bessembinder-Lemmon 2002, Longstaff-Wang 2004) as an emergent property of participant composition under weather-driven fundamentals.',
    hypotheses: [
      {
        id: 'GEN-1',
        claim:
          'Validation, at Farmer’s bar: a merit-order ABM of the LT zone calibrated only on public data reproduces the spike distribution, negative-price frequency, and forecast-error response out of sample — an ABM that predicts, not illustrates.',
        test: 'Calibrate on 2023-2024 ENTSO-E and weather data; validate stylized facts and conditional distributions on 2025-2026 held out; pre-register the validation metrics.',
      },
      {
        id: 'GEN-2',
        claim:
          'Asset pricing: weather-state-conditional forward risk premia in Nordic power beat the Bessembinder-Lemmon equilibrium benchmark, and vary with hedger/speculator composition as market ecology predicts.',
        test: 'ABM-predicted premia by weather state against realized Nordic/German power futures premia; the ecology term must add explanatory power over the hedging-pressure benchmark.',
      },
      {
        id: 'GEN-3',
        claim:
          'The Lopez de Prado result: strategies trained on the ABM’s causal synthetic paths generalize to real out-of-sample data better than strategies trained on historical bootstraps — simulation with causal structure as the cure for backtest overfitting.',
        test: 'Identical strategy-search protocols on (a) historical bootstrap and (b) ABM-generated paths; compare out-of-sample decay. The deflated-Sharpe framework scores both; presentable at an ADIA Lab symposium.',
      },
      {
        id: 'GEN-4',
        claim:
          'The alpha-decay duel: Lopez de Prado says strategies decay because they were overfit artifacts; Farmer says they decay because capital crowds the species and competition eats the alpha. In equities the theories are indistinguishable — in observable markets they are not. Where participant behavior is broadcast, decay follows measurable crowding dynamics, not just discovery events.',
        test: 'Track strategy-species capital (from AIS behavior clusters or power-market participation) against the decay curves of the associated signals; the ecological model must explain decay timing that the overfitting model attributes to chance. Adjudicating between the two professors’ theories is the paper.',
      },
      {
        id: 'GEN-5',
        claim:
          'Structural breaks are endogenous: ADIA Lab’s own challenge treats breaks as statistical events to be detected; Farmer’s endogenous-dynamics program says they are produced by slow observable variables. In the LT zone and the tanker market, breaks in price dynamics are preceded by measurable shifts in participant composition — and a composition-aware detector beats purely statistical ones.',
        test: 'Benchmark statistical break detectors against composition-augmented ones on archived power and AIS data; pre-register the composition variables. The mechanism handed to the detection problem.',
      },
      {
        id: 'GEN-6',
        claim:
          'The causal ground-truth benchmark: causal-discovery algorithms cannot be validated on financial data because no market’s true causal graph is known — except electricity, where the DAG is substantially physics plus published auction rules. Power markets can serve as the first ground-truth scorecard for causal discovery in market data.',
        test: 'Run PC, LiNGAM, and Granger-family algorithms on LT-zone data; score recovered graphs against the known physical-institutional DAG; publish the benchmark as an open dataset. Infrastructure for Lopez de Prado’s causal program, built from Farmer’s fruit fly.',
      },
      {
        id: 'GEN-7',
        claim:
          'Species diversification beats correlation diversification: HRP clusters return correlations, but correlations spike precisely when crowded strategy species deleverage together — the moment HRP’s clusters betray it. Portfolios diversified across behaviorally inferred species carry lower crowding-crash exposure.',
        test: 'Build species clusters from observed behavior (AQ-1 machinery) and compare drawdown profiles of species-diversified vs HRP portfolios through crowding episodes; a friendly amendment to the field’s most-used construction tool.',
      },
    ],
    data: [
      { name: 'ENTSO-E Transparency', url: 'https://transparency.entsoe.eu', note: 'generation by unit and source, load, prices — the calibration set' },
      { name: 'ERA5 / Copernicus', url: 'https://cds.climate.copernicus.eu', note: 'weather reanalysis — the exogenous driver, decades deep' },
      { name: 'Open-Meteo forecast archive', url: 'https://open-meteo.com', note: 'what agents believed, not just what happened — needed for forecast-response calibration' },
      { name: 'Nasdaq Commodities / EEX', url: 'https://www.nasdaq.com/solutions/european-commodities', note: 'Nordic and German power futures — the asset-pricing test set' },
    ],
    armstrongAngle:
      'The generator is Armstrong’s research engine: every signal the book trades in power markets gets stress-tested on causal synthetic paths before capital touches it — the discipline itself becomes the edge.',
    quantSkill:
      'ABM engineering and calibration, equilibrium asset-pricing benchmarks, synthetic-data experimental design — the complete Farmer toolkit and the complete Lopez de Prado toolkit, forced to work together.',
    firstProbe:
      'Not before January — this is the 12-24 month methods spine and DPhil paper three. Its embryo already exists as PJ-3, the Abu Dhabi paper’s calibrated procurement model; the winter school is where the design goes in front of both audiences at once. First real milestone after Abu Dhabi: GEN-1 validation on the LT zone.',
  },
  {
    id: 'lane-observable-economy',
    numeral: 'VII',
    vector: 'Weather · Firms',
    market: 'Lithuania · Registry + Nasdaq Vilnius',
    name: 'The Observable Economy',
    status: 'candidate',
    thesis:
      'The fruit-fly country, structured as serious research. The naive version — five years of one beach station mapped to listed prices — would be elementary, and it is not the design. The weather panel is ERA5 back to 1940 plus LHMT stations; the Sventoji series is the calibration key that bias-corrects the gridded product at the shoreline, not the sample. The outcome panel is the full registry firm population, so identification comes from cross-sectional exposure differences at national scale — thousands of firms — not from one short time series. The headline claim: weather risk lives below the listing threshold.',
    whyOpen:
      'The design resolves a published puzzle. Addoum, Ng and Ortiz-Bobea find temperature barely moves listed US firms’ earnings; Barrot and Sauvagnat needed hurricanes to detect network propagation. The likely reason is selection — listed firms are large, diversified and adapted, so weather risk concentrates in small private firms no US dataset can see. Lithuania’s registry makes the entire firm-size distribution observable, so the hypothesis becomes testable for the first time. CSH Vienna’s Hungary work proved country-scale firm data supports complexity analysis — but on confidential VAT data, with no physical driver; this version is public and causally identified.',
    mechanism:
      'One exogenous field forcing an enumerated firm population, with three levels of response the design estimates separately: direct exposure (the weather beta), propagation (through input-output structure and ownership links — the network level), and capitalization (thin equities, credit hazards, firm exit). Adaptation makes betas time-varying; extremes make them nonlinear; a single correlation would measure none of this.',
    hypotheses: [
      {
        id: 'OE-1',
        claim:
          'Weather risk lives below the listing threshold: betas on revenue and margins are large for small, undiversified, locally bound firms and decay with size, diversification and geographic spread — which is why the US listed-firm literature finds almost nothing.',
        test: 'Registry panel joined to ERA5 sector-season exposure fields; betas estimated within sector-year with firm fixed effects; the size-decay profile is the pre-registered headline exhibit.',
      },
      {
        id: 'OE-2',
        claim:
          'The coastal identification: summer weather quality causally moves coastal tourism and hospitality revenues — a difference-in-differences against matched inland firms, with the five-year Sventoji station bias-correcting ERA5 at the shoreline rather than serving as the sample.',
        test: 'Beach-season indices from corrected ERA5 (1990s-present) as treatment; coastal hospitality firms vs matched inland controls; the Jonas series validates the grid and contributes sea-breeze variables it cannot see.',
      },
      {
        id: 'OE-3',
        claim:
          'Propagation: weather shocks to exposed firms travel to their suppliers and customers with a lag — the weather beta as a network object, and the complexity result. Barrot-Sauvagnat’s disaster finding, made continuous.',
        test: 'Statistics Lithuania input-output tables plus registry ownership links as the network proxy; partners of shocked firms vs matched non-partners in following years; falsified if propagation is indistinguishable from sector-common shocks.',
      },
      {
        id: 'OE-4',
        claim:
          'Capitalization: the thin price layer prices weather risk slowly or not at all — Nasdaq Vilnius names underreact to fundamental weather states, and registry bankruptcy hazards carry weather-beta exposure credit never priced.',
        test: 'Event studies on the listed weather-exposed set (Ignitis, Linas Agro, Novaturas, dairy); hazard models with OE-1 betas as exposures; the claim is mispricing and credit, honestly not high-frequency alpha.',
      },
    ],
    data: [
      { name: 'JAR open data (Spinta API)', url: 'https://data.gov.lt', note: 'AUDITED free: ~538k entities (226k active) — name, code, legal form, NACE sector, registered address, status, dates; daily updates, ~5k req/hr. Address + NACE = the exposure join. No financials here.' },
      { name: 'Sodra open data', url: 'https://atvira.sodra.lt/imones/rinkiniai/index.html', note: 'AUDITED free, the find: bulk CSV/JSON per employer, MONTHLY average wage and insured employee count. Frequency matches weather seasons — the high-frequency outcome panel the annual filings cannot be.' },
      { name: 'Registru centras financial statements', url: 'https://www.registrucentras.lt/p/fa-rinkiniai', note: 'AUDITED caveat: filed sets are viewable per company, but bulk machine-readable financials are a paid product or via resellers (Okredo, Rekvizitai, Scorify) — price quote is an open task, deferred until the free-data probe works.' },
      { name: 'State-owned enterprise financials', url: 'https://data.gov.lt/datasets/2839/', note: 'free and detailed (full P&L and balance sheet, 2019+) — includes the Ignitis family; supplementary panel.' },
      { name: 'ERA5 / Copernicus', url: 'https://cds.climate.copernicus.eu', note: 'hourly gridded weather back to 1940 — the actual weather panel; Sventoji bias-corrects it at the coast' },
      { name: 'LHMT', url: 'https://www.meteo.lt', note: 'Lithuanian met service stations — the second validation layer' },
      { name: 'Statistics Lithuania / data.gov.lt', url: 'https://data.gov.lt', note: 'input-output tables and sector aggregates — the network proxy for OE-3 (portal search UI flaky; use direct dataset URLs)' },
      { name: 'Nasdaq Vilnius', url: 'https://nasdaqbaltic.com', note: 'the complete listed universe for OE-4' },
      { name: 'Addoum, Ng & Ortiz-Bobea', url: 'https://scholar.google.com/scholar?q=Temperature+Shocks+and+Establishment+Sales', note: 'the listed-firm null result OE-1 explains' },
      { name: 'Barrot & Sauvagnat 2016', url: 'https://scholar.google.com/scholar?q=Barrot+Sauvagnat+Input+Specificity+and+the+Propagation+of+Idiosyncratic+Shocks', note: 'disaster propagation through production networks — the discrete precedent OE-3 makes continuous' },
      { name: 'CSH Vienna Hungary network papers', url: 'https://scholar.google.com/scholar?q=Diem+Borsos+Thurner+Hungary+firm+level+production+network', note: 'country-scale firm-network complexity — confidential data, no physical driver' },
    ],
    armstrongAngle:
      'Weather-beta positions in Baltic listed names and a weather-conditioned bankruptcy screen as a credit lens; structurally, the calibrated firm population is the substrate that scales Lane VI’s generator from a market to an economy.',
    quantSkill:
      'Panel econometrics on administrative data, bias-correction of reanalysis against station records, network identification, hazard models — the applied-micro toolkit added to the program, with a moat built from local language and local knowledge.',
    firstProbe:
      'Stage zero partially complete (2026-08-22): JAR attributes are free via API with address and NACE (the exposure join); bulk registry financials are paid — deferred; Sodra publishes free MONTHLY per-employer wages and headcounts, which upgrades the whole design. The probe is now free end to end: geolocate coastal hospitality firms from JAR, take monthly Sodra employment and wages as the outcome, corrected-ERA5 beach-season quality as treatment, inland matched controls. Remaining asks: the Jonas spec (native-resolution wind, temperature, precipitation, pressure, plus station metadata and calibration history) and an RC price quote for bulk financials, with Aidas on the Lithuanian paperwork.',
  },
  {
    id: 'lane-aquarium',
    numeral: 'VIII',
    vector: 'Weather · Ships',
    market: 'Global shipping · Baltic FFAs',
    name: 'The Aquarium: Market Ecology Under Maritime Law',
    status: 'candidate',
    thesis:
      'AIS is the only dataset on earth where every agent in a global market is legally required to broadcast its state — position, heading, speed, draught (loaded or empty). Market ecology’s observability problem, the thing that has kept Farmer’s theory unimplemented for fifteen years, is solved by international maritime law. If the power market is the fruit fly, the tanker market is the aquarium: a global market with glass walls. The ABM: vessels and operators as agents with routing and fixture rules, weather as the exogenous forcing, port congestion and effective tonnage supply as emergent states — priced directly into freight rates, the Baltic indices and Forward Freight Agreements.',
    whyOpen:
      'The nowcasting literature (IMF, Global Fishing Watch era) uses AIS for trade statistics — counting, not behavior. Freight economists model rates with supply-demand reduced forms. Nobody has built the behavioral ABM calibrated agent-by-agent from broadcast positions and priced it against the FFA curve. The observability that makes it possible is public and mandatory; the gap exists because the people who model behavior and the people who watch ships are different people. Origin: Bilawal Sidhu’s gods-eye-view repo — the ingestion scaffold for the feeds.',
    mechanism:
      'Heterogeneous operators choose routes, speeds, ballast legs and fixtures; storms, wind and fog perturb voyage times and close ports; congestion queues form; effective tonnage supply in each basin emerges from thousands of individual decisions and prices into spot and forward freight. Strategy crowding is directly visible — who ballasts speculatively toward a region, who waits — so ecology dynamics (entry, exit, crowding, regime shift) can be measured per agent rather than inferred. Weather is the causal instrument; the draught field even reveals cargo state by law.',
    hypotheses: [
      {
        id: 'AQ-1',
        claim:
          'Ecology, observed: tanker operators cluster into a small number of persistent behavioral strategies (spot-chasers, contract sailors, speculative ballasters) identifiable from AIS trajectories alone — and the population mix shifts with the freight cycle as market ecology predicts.',
        test: 'Cluster voyage-level behavior from archived AIS (routes, speeds, ballast patterns, port-wait tolerance); strategies must be stable within operator and predictive of the operator’s next fixture behavior out of sample.',
      },
      {
        id: 'AQ-2',
        claim:
          'Weather to freight: basin-level weather states (storm tracks, seasonal wind fields) causally move effective tonnage supply through rerouting and congestion, and freight rates respond with a measurable lag — the exogenous-instrument result, at sea.',
        test: 'ERA5 marine weather joined to archived AIS congestion and voyage-time states; freight-rate response estimated against Baltic indices; pre-registered basins and seasons.',
      },
      {
        id: 'AQ-3',
        claim:
          'The generator, afloat: an ABM whose agents carry AQ-1’s empirical strategies, forced by real weather, reproduces freight-rate dynamics out of sample and prices FFAs better than reduced-form supply-demand benchmarks.',
        test: 'Calibrate on archived AIS plus ERA5; validate on held-out periods; benchmark against standard freight-rate models; the Lane VI protocol with hulls instead of megawatts.',
      },
      {
        id: 'AQ-4',
        claim:
          'The Klaipeda pulse (the immediate probe): daily AIS port calls at Klaipeda form a free, daily index of Lithuanian trade that leads the monthly Sodra employment panel and complements Lane VII — and coastal weather measurably moves port throughput.',
        test: 'One archiver running from macro-signals from today; port-call index vs Sodra monthly aggregates and Statistics Lithuania trade data; weather sensitivity of daily throughput.',
      },
    ],
    data: [
      { name: 'gods-eye-view', url: 'https://github.com/bilawalsidhu/gods-eye-view', note: 'Bilawal’s OSINT globe — the ingestion scaffold; live feeds, not an archive, so collection starts now' },
      { name: 'AIS streams', url: 'https://aisstream.io', note: 'free live AIS websocket; archive from today — flows data compounds only if collected before needed' },
      { name: 'Global Fishing Watch', url: 'https://globalfishingwatch.org/datasets-and-code/', note: 'historical processed AIS — the deep backfill for AQ-1/AQ-2' },
      { name: 'ERA5 marine fields', url: 'https://cds.climate.copernicus.eu', note: 'wind, waves, storm tracks over the basins — the forcing' },
      { name: 'Baltic Exchange indices', url: 'https://www.balticexchange.com', note: 'BDI and route assessments — the price layer; FFA curves via brokers' },
      { name: 'OpenSky Network', url: 'https://opensky-network.org', note: 'aircraft feed if the air layer ever earns its place — value concentrates in AIS' },
    ],
    armstrongAngle:
      'Freight is tradable — FFAs directly, or listed shipping equities (tanker and dry-bulk owners) as the accessible expression; AQ-2’s weather-to-rates lag is a signal candidate, and the ecology mix from AQ-1 is a crowding indicator no desk publishes.',
    quantSkill:
      'Trajectory data engineering at scale, behavioral clustering, marine meteorology, freight-market mechanics — plus the discipline of running a live archiver, the first dataset the program collects rather than downloads.',
    firstProbe:
      'AQ-4, this month: an afternoon to stand up the Klaipeda AIS archiver in macro-signals and let it run. The full aquarium is a sibling design to Lane VI, sequenced after Abu Dhabi — the archive quietly accumulating in the meantime is the point.',
  },
]

export const INEQUALITY_BRIDGE = {
  oneLiner: 'Weather is random; who pays for weather is a convention.',
  statement:
    'The SFI winter school’s focal application is inequality, and the established lane there is valuation conventions as distributive institutions. The climate lanes are not a separate program — they are the same claim at a new empirical site. A drought or a wind lull does not distribute its own costs; the market design does, and every link is a convention someone chose: the uniform clearing price, the tariff flag, the CVaR parameter, the zonal boundary. Where the valuation lane studies analyst price targets distributing wealth, this bridge studies grid pricing rules distributing drought. The join is always the same three-step chain: physical state variable → pricing convention → household incidence.',
  cards: [
    {
      title: 'Brazil · The Tariff Flag',
      body: 'The 2021 drought’s costs were routed to households through an explicit instrument — tariff flags, including a special water-scarcity flag — while the model’s risk-aversion convention cushioned generators. ENSO → reservoirs → model → flag → incidence by income decile, every step in public data. This is BR-4, and it is the Abu Dhabi paper candidate.',
    },
    {
      title: 'Lithuania · The Marginal Price',
      body: 'The Baltics rank among the EU’s most energy-poor member states. Every hour gas sets the uniform clearing price, wind owners collect inframarginal rents financed through those households’ bills — and the post-BRELL security premium is socialized the same way. LT-4 computes the transfer; LT-5 adds the imbalance channel — who pays when the wind forecast is wrong.',
    },
    {
      title: 'The Forecast',
      body: 'Lanes I and V are one claim in two grids. A forecast inside a market rule is a distributive institution: in Lithuania the wind forecast error becomes a 15-minute imbalance and the balancing convention decides who pays it; in PJM the load forecast becomes a reliability requirement and the allocation convention decides who pays for the megawatts — $63.6 billion across four capped auctions, 46% attributed to data centers. LT-5 and PJ-2 are the same measurement.',
    },
    {
      title: 'The Join',
      body: 'Wind and water metrics overlap with inequality metrics through the price channel: ENTSO-E and ONS supply the physical and price states; EU-SILC energy-poverty indicators and IBGE POF budget shares supply the incidence. The convention in the middle is the object of study — an engine, not a camera, deciding who pays.',
    },
  ],
}

export const SCORECARD_LANES = ['I · Wind LT', 'II · Water BR', 'III · Heat US', 'IV · Ledger']

export const SCORECARD: ScorecardRow[] = [
  {
    criterion: 'Coverage gap in English',
    note: 'Is the seat actually empty?',
    scores: { 'I · Wind LT': 'high', 'II · Water BR': 'high', 'III · Heat US': 'low', 'IV · Ledger': 'med' },
  },
  {
    criterion: 'Data openness',
    note: 'Free, deep, machine-readable',
    scores: { 'I · Wind LT': 'high', 'II · Water BR': 'high', 'III · Heat US': 'high', 'IV · Ledger': 'med' },
  },
  {
    criterion: 'Climate signal strength',
    note: 'How tightly physics drives price',
    scores: { 'I · Wind LT': 'high', 'II · Water BR': 'high', 'III · Heat US': 'med', 'IV · Ledger': 'med' },
  },
  {
    criterion: 'Armstrong tradability',
    note: 'Can it become a position?',
    scores: { 'I · Wind LT': 'low', 'II · Water BR': 'high', 'III · Heat US': 'high', 'IV · Ledger': 'high' },
  },
  {
    criterion: 'SFI / Farmer legibility',
    note: 'Publishable as complexity econ',
    scores: { 'I · Wind LT': 'high', 'II · Water BR': 'high', 'III · Heat US': 'med', 'IV · Ledger': 'med' },
  },
  {
    criterion: 'Personal edge today',
    note: 'Location, tooling, existing lanes',
    scores: { 'I · Wind LT': 'high', 'II · Water BR': 'med', 'III · Heat US': 'low', 'IV · Ledger': 'med' },
  },
  {
    criterion: 'Skill compounding',
    note: 'Builds quant intelligence that transfers',
    scores: { 'I · Wind LT': 'high', 'II · Water BR': 'high', 'III · Heat US': 'high', 'IV · Ledger': 'high' },
  },
]

export const PROPOSED_PATH: PathStep[] = [
  {
    window: 'Sep 14 → Jan 3 · parallel track',
    label: 'The Abu Dhabi paper — Who Pays for Cognition (Lane V)',
    detail:
      'Data sprint between the two races (September 14-25); §1 incidence in October; §2 Shapley decomposition and §3 conventions model in November, with PJ-4 on the 2026 vintage; full draft to Lafond and the Oxford meetings in December; paper plus lightning talk in hand for January 3, and PJM’s 2027 forecast vintage on January 14 as the promised out-of-sample update. Michael Ralph co-authors the theory section; Lori owns data and model. Dated plan in the Lane V deep dive.',
    gate: 'A defensible headline number by end of October or the paper narrows to §1 plus §2. The gains ledger — valuation conventions — is the second paper of the same program, not a competing one.',
  },
  {
    window: 'Sep 3-22 · before leaving Palanga',
    label: 'Lane I probe — while still in Palanga',
    detail:
      'ENTSO-E + Open-Meteo pipeline into macro-signals; pre-registered LT-1; LT-2 with LV and EE as comparisons; the LT-5 imbalance ledger; publish "The Grid After BRELL" before the flight out on the 23rd. The location edge expires with the flight — this goes first. Dated plan in the Lane I deep dive.',
    gate: 'Commit if forecast dispersion measurably predicts spike days; park if the LT zone is too coupled to neighbors for a local signal to exist.',
  },
  {
    window: 'Weeks 4-7',
    label: 'Lane II probe — the performativity fusion',
    detail:
      'ONS + ONI + PLD on one timeline; test BR-1; write "The Price That a Model Writes" and put BR-3 in front of Michael as a candidate section of the CEcon paper.',
    gate: 'Commit if ENSO leads PLD beyond current reservoir level; the performativity study (BR-3) proceeds on its own merits regardless — it is a paper, not a trade.',
  },
  {
    window: 'Weeks 8-10',
    label: 'Lane III probe — the crowded seam',
    detail: 'gridstatus pipeline; test US-1 on CAISO summers. Deliberately last: smallest coverage gap, and Lanes I-II teach the meteorology it needs.',
    gate: 'Commit only if the marine-layer index beats temperature-only baselines; otherwise park and keep Lane III as market-fluency reading, not research.',
  },
  {
    window: 'Weeks 11-12',
    label: 'Synthesis — choose the flagship',
    detail:
      'Write the framing paper: "Climate, Grids, Balance Sheets — the transmission of physical states through under-covered electricity markets into equity prices." One flagship lane, one supporting lane, the rest parked. This is the document Oxford in December and Abu Dhabi in January get pointed at.',
    gate: 'The path exists when one lane has a committed signal in the Armstrong book and one lane has a paper section Michael co-signs. Both by mid-November, before the Oxford trip.',
  },
]

export const ITERATION_LOG: LogEntry[] = [
  {
    date: '2026-09-04',
    version: 'v11',
    note: 'Lane VI deepened for the two-professor alignment (Farmer x Lopez de Prado): GEN-4 the alpha-decay duel (overfitting vs crowding, adjudicated in observable markets), GEN-5 endogenous structural breaks (a mechanism for ADIA’s own detection challenge), GEN-6 the causal ground-truth benchmark (electricity as the only market with a known DAG — an open validation scorecard for causal discovery), GEN-7 species diversification vs HRP. The design principle: find where the two professors give competing explanations of the same phenomenon, or where one’s program needs an instrument only the other’s can supply.',
  },
  {
    date: '2026-09-03',
    version: 'v11',
    note: 'Deep dives added beneath Lanes I and V — the chain link by link, what is already on the record, identification, nearest prior work, open questions, dated plans, failure modes. Facts verified against primary sources: four PJM auctions at or near the cap ($63.6 billion, 46% attributed to data centers by the IMM), the 28 April 2026 collar extension, the January 2026 White House-governors principles and PJM board letter, FERC’s June 2026 show-cause orders, 23 states with large-load tariffs; Baltic desync 8-9 February 2025, balancing capacity market 4 February, PICASSO 15 April, Lithuania at 2.3 GW wind and 2.8 GW solar, two failed offshore tenders, energy poverty 18.0% against 9.2% EU. Consequences: LT-3 rewritten from offshore to onshore-plus-storage; LT-5 added (who pays for wind forecast error); PJ-2 rewritten for censoring at the cap and non-additive IMM counterfactuals (Shapley); PJ-4 added (conventions move forecasts, difference-in-differences on tariff adoption); PJM added to the markets; “The Forecast” card joins the bridge — Lanes I and V are one claim in two grids.',
  },
  {
    date: '2026-08-22',
    version: 'v10',
    note: 'Lane VIII added — The Aquarium, from Bilawal Sidhu’s gods-eye-view: AIS as the only market where every agent broadcasts state by law, solving market ecology’s observability problem. AQ-1 behavioral strategies from trajectories, AQ-2 weather-to-freight instrument, AQ-3 the generator afloat (Lane VI protocol on FFAs), AQ-4 the Klaipeda daily port-call pulse feeding Lane VII. Candidate, sequenced after Abu Dhabi; the immediate action is the archiver — flows data compounds only if collected before needed.',
  },
  {
    date: '2026-08-22',
    version: 'v9',
    note: 'Stage-zero registry audit run. Findings: JAR open data is free via the Spinta API (~538k entities, ~226k active) but carries attributes only — name, code, legal form, NACE, address, status — no financials; bulk machine-readable financial statements are a paid RC product or via resellers, price quote deferred. The find: Sodra open data publishes free bulk MONTHLY per-employer average wages and insured headcounts — a high-frequency firm-population outcome panel that matches weather frequency and rescues OE-2 from the annual-filing lag. State-owned enterprise financials (incl. Ignitis) free and detailed from 2019. The Sventoji probe is now free end to end; registry purchase decision gated on the free-data probe working.',
  },
  {
    date: '2026-08-22',
    version: 'v8',
    note: 'Lane VII restructured from elementary to serious after the five-years-of-data concern: the Sventoji series is recast as the calibration key that bias-corrects ERA5 at the coast (the weather panel is ERA5 back to 1940), identification comes from cross-sectional breadth of the registry firm population rather than time depth, and the headline claim is now “weather risk lives below the listing threshold” — an explanation of the Addoum-Ng-Ortiz-Bobea listed-firm null result, testable only where private financials are public. Hypotheses rebuilt as a ladder (OE-1 size decay, OE-2 coastal DiD, OE-3 network propagation, OE-4 capitalization) with literature anchors; first probe is a stage-zero data audit including the fully specified Jonas ask.',
  },
  {
    date: '2026-08-22',
    version: 'v7',
    note: 'Lane VII added — The Observable Economy, from Aidas’s observation that every business files financials: Lithuania as a fruit-fly country, not just a fruit-fly market. Registry financials (Registru centras) + free and self-collected weather (ERA5, LHMT, Sventoji station) + a complete small price layer (Nasdaq Vilnius, LT power zone, bankruptcy events). OE-1 national weather betas, OE-2 the Sventoji coastal-tourism natural experiment, OE-3 transmission to thin prices and credit. Precedent: CSH Vienna Hungary VAT network, Farmer pandemic supply chains, Axtell US firms — all on confidential data with no physical driver; this version is public and causally identified.',
  },
  {
    date: '2026-08-22',
    version: 'v6',
    note: 'Lane VI added — The Generator, the Farmer x Lopez de Prado intersection: weather data driving a calibrated ABM of the LT power zone, priced against Nordic futures. GEN-1 out-of-sample validation, GEN-2 forward risk premia as emergent ecology (vs Bessembinder-Lemmon), GEN-3 causal synthetic data beating historical bootstraps on backtest-overfitting decay. Status candidate: the 12-24 month methods spine and DPhil paper three, seeded by PJ-3; design presented at the winter school, built after.',
  },
  {
    date: '2026-08-22',
    version: 'v5',
    note: 'Abu Dhabi paper decided by structured questioning: audience is Farmer and the SFI complexity crowd; scope is a full empirical paper with a headline number; data untouched, so English public data wins. Lane V added — “Who Pays for Cognition”: PJM datacenter load, load-forecast conventions, capacity prices, household incidence by income decile, in three sections (PJ-1 incidence, PJ-2 reflexivity, PJ-3 counterfactual conventions). Valuation conventions resolved as the gains ledger of the same program, not a second path. Brazil parked for the DPhil; Baltic stays the trading and blog lane. Solo with Michael Ralph on theory; trade memo alongside, not inside.',
  },
  {
    date: '2026-08-22',
    version: 'v4',
    note: 'Strategy tab upgraded with the interactive discipline landscape: seventeen sub-disciplines scored on value-to-trading vs practitioner occupancy, hover/tap for schools and institutions, table view beneath. Four burgundy dots mark the claimed white space (climate transmission, market ecology, performativity, distributive incidence); the coarse four-quadrant read retained below the map.',
  },
  {
    date: '2026-08-22',
    version: 'v3',
    note: 'Strategy tab added at /complexecon/strategy: the competitive map — eight schools plus the ADIA hub, the ten practitioner seats and their moats, six gaps with nearest occupants, and the four-quadrant read (runs-a-book × physical-systems is the open seat). Editorial layer over the CEcon landscape at complexity-economics.org (76 researchers, 5,300+ papers). Each gap names which research lane claims it; ergodicity gap deliberately parked.',
  },
  {
    date: '2026-08-21',
    version: 'v2',
    note: 'Inequality bridge added after the SFI-frame question: distributive incidence of climate volatility as the unifying claim — "weather is random; who pays for weather is a convention." New hypotheses LT-4 (inframarginal rents vs Baltic energy poverty via EU-SILC) and BR-4 (2021 drought tariff-flag incidence by income decile via ANEEL + IBGE POF). BR-4 flagged as the Abu Dhabi paper candidate; the climate lanes and the valuation-conventions lane are now one program, not two.',
  },
  {
    date: '2026-08-21',
    version: 'v1',
    note: 'Initial four lanes drafted from the Power 2026 conversation: wind/Lithuania, water/Brazil, heat-and-sea/NYC+California, and the cross-market transmission ledger. Lane I set to probing on location edge; scorecard and 12-week path proposed. Open question: whether Lane III earns research status or stays market-fluency reading.',
  },
]

// Deep dives, keyed by lane id. Only the probing lanes carry one — a lane earns
// its deep dive when it is being worked, not when it is being imagined.
export const DEEP_DIVES: Record<string, LaneDeepDive> = {
  'lane-wind-lt': {
    chain: [
      {
        step: 'Wind field',
        state:
          '100 m wind over the Baltic coast and the Zemaitija ridge, where most of Lithuania’s 2.3 GW of onshore turbines stand; observed by LHMT stations, ERA5, and the Sventoji series out the window.',
        convention: 'None. This is the only link with no rule in it.',
      },
      {
        step: 'Forecast',
        state:
          'GFS, ICON and ECMWF IFS 100 m wind, archived deterministically since 2017-2022; the day-ahead nomination every producer and balance responsible party submits is a bet on one of them.',
        convention:
          'Which model, which run, which hedge — the nomination rule is a private convention, and dispersion between the public models is the observable proxy for how uncertain those bets were.',
      },
      {
        step: 'Day-ahead price',
        state:
          'Nord Pool LT zone, cleared in the single day-ahead coupling; 15-minute products since 1 October 2025, hourly before.',
        convention:
          'Uniform marginal pricing: when gas sets the price, every inframarginal wind megawatt-hour collects the gas price. LT-4 lives here.',
      },
      {
        step: 'Forecast error → imbalance',
        state:
          'Realized minus nominated wind per 15-minute imbalance settlement period, priced at the Baltic imbalance price — since 2025 derived from MARI (mFRR, joined October 2024) and PICASSO (aFRR, joined 15 April 2025) activations.',
        convention:
          'Who is balance responsible, single versus dual imbalance pricing, and who is exempt: renewable energy communities carry no balancing responsibility, and supported producers’ balancing has historically been a public-service cost. LT-5 lives here.',
      },
      {
        step: 'Reserves',
        state:
          'FCR, aFRR and mFRR capacity bought daily on the Baltic Balancing Capacity Market since 4 February 2025 — the reserves the Baltics used to borrow from the BRELL ring.',
        convention:
          'Recovered through the transmission tariff on every consumer; Litgrid’s own estimate was under 12 euros per household per year. The security premium is socialized by design.',
      },
      {
        step: 'Household bill',
        state:
          'Energy plus network tariff plus the VIAP public-service levy — set to zero for households in 2024, but a live policy dial.',
        convention:
          'Incidence: 18.0% of Lithuanians could not keep their home adequately warm in 2024, third-worst in the EU behind Bulgaria and Greece at 19.0%, against 3.6% in Estonia and 9.2% EU-wide. The same wind lands on very different budgets.',
      },
    ],
    facts: [
      {
        fact: 'Baltic desynchronization from BRELL: disconnected 8 February 2025, synchronized with Continental Europe 9 February 2025; the isolated-operation test in between restricted commercial trade with Sweden and Poland.',
        source: 'Litgrid; FREE Network policy brief',
        asOf: '2025-03',
      },
      {
        fact: 'Average daily LT wholesale quotes rose 49.9% in the days after 9 February 2025 — confounded by the trade restrictions and the Estlink 2 outage running since 25 December 2024. LT-2 must not confuse the week with the regime.',
        source: 'FREE Network, 2025-03-03',
        asOf: '2025-03',
      },
      {
        fact: 'Baltic Balancing Capacity Market live 4 February 2025 with FCR and mFRR; aFRR added 15 April 2025 when Elering connected to PICASSO; Baltic TSOs on MARI since October 2024; imbalance settlement period 15 minutes.',
        source: 'Elering, AST, Litgrid balancing roadmap',
        asOf: '2025-04',
      },
      {
        fact: 'Lithuania ended 2025 with 2,343 MW of wind and 2,786 MW of solar; wind and solar passed 6 GW in early 2026 against a peak load near 2 GW. Renewables were 68% of domestic generation in 2025.',
        source: 'Litgrid via CEEnergyNews',
        asOf: '2026-01',
      },
      {
        fact: 'Letters of intent on the grid: 3.2 GW more onshore wind, 3.8 GW solar, 3.7 GW batteries. Storage is arriving in the same wave as the generation, not after it.',
        source: 'Litgrid',
        asOf: '2026-01',
      },
      {
        fact: 'Offshore has slipped: the first 700 MW (Ignitis, after buying out Ocean Winds’ 49%) targets about 2030; the second 700 MW tender failed in 2024 and again in late 2025 after a single bid.',
        source: 'Maritime Executive; Renewables Now',
        asOf: '2025-12',
      },
      {
        fact: 'Open-Meteo’s historical forecast archive holds deterministic runs only — ECMWF IFS since 2017, GFS since March 2021, ICON since November 2022 — at 100 m hub height. Ensemble spread is not archived; it has to be logged from today.',
        source: 'Open-Meteo Historical Forecast API docs',
        asOf: '2026-09',
      },
      {
        fact: 'Energy poverty, 2024: Lithuania 18.0% unable to keep home adequately warm, Estonia 3.6%, EU 9.2%; Bulgaria and Greece 19.0%.',
        source: 'Eurostat EU-SILC release, 2026-02-02',
        asOf: '2026-02',
      },
    ],
    identification:
      'LT-1 is a conditional-tails claim, so the test is quantile regression of the intraday-minus-day-ahead spread (and of the imbalance-minus-day-ahead spread) on multi-model dispersion, with the spike threshold fixed at the 95th percentile before any regression runs. Controls: load, TTF gas, hour and season, and interconnector availability — NordBalt, LitPol and Estlink 2 outages are exogenous shifts in how coupled the zone is. The threat is that dispersion proxies for frontal weather regimes that spike prices on their own; dispersion has to add explanatory power beyond forecast level and a regime dummy. LT-2 is an event study whose event is dirty: the balancing market opened 4 February, the desync ran 8-9 February, and Estlink 2 was already out. The clean move is to use LV and EE as within-Baltic comparisons for the coupling coefficients and to date the break by regime-switching rather than by assumption. LT-5 is accounting, not inference: imbalance volume times imbalance-minus-day-ahead price, summed by settlement period and split by who was balance responsible under each rule set.',
    priorWork: [
      {
        cite: 'Hirth & Ziegenhagen (2015), Balancing power and variable renewables: three links',
        did: 'Showed German balancing reserve needs fell as wind grew, because forecasts, market design and pooling improved together.',
        gap: 'Germany, hourly, pre-15-minute; nothing on a small zone whose topology changed.',
      },
      {
        cite: 'Kiesel & Paraschiv (2017), Econometric analysis of 15-minute intraday electricity prices',
        did: 'Wind and solar forecast errors move German intraday prices asymmetrically and nonlinearly.',
        gap: 'Forecast error, not forecast disagreement; the dispersion state variable is untested anywhere.',
      },
      {
        cite: 'Koch & Hirth (2019), Short-term electricity trading for system balancing',
        did: 'Intraday trading absorbs most German forecast error before it reaches imbalance.',
        gap: 'Whether a thin Baltic intraday market absorbs error the same way is exactly the open question.',
      },
      {
        cite: 'Gianfreda, Parisio & Pelagatti (2018), A review of balancing costs in Italy before and after RES introduction',
        did: 'Quantified balancing costs per zone as renewables entered — the nearest cost-ledger precedent.',
        gap: 'No distributive incidence; who paid is never asked.',
      },
      {
        cite: 'FREE Network policy brief (March 2025), Energy security at a cost',
        did: 'The only English write-up of the post-BRELL price jump so far.',
        gap: 'Descriptive, a few weeks of data, no identification.',
      },
    ],
    openQuestions: [
      {
        question: 'Which model do Baltic balance responsible parties actually forecast with?',
        matters: 'Dispersion is only a proxy for private uncertainty if the public models are the ones being used; a conversation with Ignitis Renewables or a Lithuanian aggregator settles it.',
      },
      {
        question: 'Is the LT imbalance price complete at 15-minute resolution on ENTSO-E, or only on the Baltic dashboard?',
        matters: 'Decides whether LT-5 runs on the workhorse API or needs a second scraper; check on day one.',
      },
      {
        question: 'What share of Lithuanian wind sits under PSO-covered balancing versus self-balanced portfolios, by year?',
        matters: 'This is the split LT-5 measures; without it the imbalance cost cannot be assigned to a payer.',
      },
      {
        question: 'Does a local LT signal exist at all, or does coupling with LV, EE and SE4 wash it out?',
        matters: 'The park gate for the whole lane; the interconnector-outage days are the natural test.',
      },
      {
        question: 'Does the 1 October 2025 move to 15-minute day-ahead products break the spread series?',
        matters: 'Spreads must be computed at consistent granularity — aggregate to hourly across the break, or split the sample.',
      },
    ],
    plan: [
      {
        window: 'Sep 3-7',
        deliverable:
          'A power module in macro-signals: entsoe-py pull of LT day-ahead, load, wind generation and imbalance prices from January 2023; Nord Pool intraday; Open-Meteo historical GFS, ICON and IFS 100 m wind at four coastal grid points. Start the daily ensemble-spread logger.',
        gate: 'Every series lands with a row count and a gap map before any analysis runs.',
      },
      {
        window: 'Sep 8-12',
        deliverable: 'Pre-registration note, dated and committed: spike threshold, regression spec, controls. Then the LT-1 notebook.',
        gate: 'Does model disagreement predict spike days beyond forecast level and regime?',
      },
      {
        window: 'Sep 14-20',
        deliverable: 'LT-2 event study with LV and EE comparisons; LT-5 imbalance-cost ledger by settlement period and rule regime.',
        gate: 'A datable break that survives controls, or an honest null.',
      },
      {
        window: 'Sep 20-22',
        deliverable: '“The Grid After BRELL” — the first Baltic power post, published before the flight out of Palanga on the 23rd.',
        gate: 'One chart, one number, one falsifiable claim.',
      },
      {
        window: 'Oct onward',
        deliverable:
          'Lane I becomes a maintained paper-trade log — the dispersion-conditioned spread signal, timestamped daily — while Lane V takes the writing time.',
        gate: 'Commit when the log has 60 days; the location edge is gone, the data edge stays.',
      },
    ],
    failureModes: [
      'The zone is too coupled: on normal days the LT price is a Nordic-Baltic price and the local wind signal is noise. The interconnector-outage days tell us quickly.',
      'Coastal wind is too fine for 25 km GFS: dispersion between models is a resolution artifact, not uncertainty. Mitigation is IFS at 9 km and the LHMT stations as truth.',
      'The desync week is unidentifiable: three interventions in six days. Then LT-2 becomes descriptive and the lane leans on LT-1 and LT-5.',
      'Imbalance data has holes across the February 2025 transition, and LT-5 loses exactly the months it needs.',
    ],
    crossLane:
      'Wind and cognition are the same paper in two grids. A forecast sits inside a market rule in both: in Lithuania the wind forecast becomes an imbalance and the balancing convention decides who pays for the error; in PJM the load forecast becomes a reliability requirement and the allocation convention decides who pays for the megawatts. Lane V is the paper; Lane I is where the same claim is watched every fifteen minutes.',
  },
  'lane-cognition-pjm': {
    chain: [
      {
        step: 'Cognition demand',
        state:
          'Hyperscaler capex arriving as interconnection requests to utilities — speculative, duplicated across candidate sites, and until 2026 requiring no financial commitment to be counted.',
        convention:
          'What counts as load. PJM’s 16 January 2026 board letter defines a large-load addition as 50 MW or more at one point of interconnection and orders third-party verification and state review; the White House and governors’ principles ask for an executed service agreement or collateral before a megawatt enters the forecast.',
      },
      {
        step: 'Load forecast',
        state:
          'Utility large-load adjustments folded into PJM’s Long-Term Load Forecast. The January 2026 vintage: large loads add 35.1 GW between 2026 and 2031 against 34.6 GW total growth — more than all of it — and 78% of growth through 2046; summer peak from 160 GW in 2025 to 253 GW in 2046.',
        convention:
          'The forecast method itself. Stricter vetting in the 2026 cycle cut the summer 2028 peak by 4.4 GW (2.6%) with no change in the electrons; the number is a property of the vetting rule.',
      },
      {
        step: 'Reliability requirement',
        state:
          'Forecast peak times the installed reserve margin, adjusted by ELCC accreditation, drawn as the demand curve the auction clears against. The 2028/29 forecast peak was about 2,000 MW above the 2027/28 one.',
        convention:
          'Accreditation and curve shape. The move to marginal ELCC cut gas combined-cycle ratings from 96% to 80% and fixed-tilt solar from 30% to 9% between 2024/25 and 2025/26 — the IMM put that alone at $4.4 billion of revenue.',
      },
      {
        step: 'Auction price',
        state:
          'Uniform clearing price per locational deliverability area, paid to every cleared megawatt including plants built decades ago. Four consecutive results: $269.92, $329.17, $333.44, and the cap again in July 2026; total costs $14.7, $16.1, $16.4 and $16.4 billion.',
        convention:
          'Uniform pricing and the collar. The $175-$325 collar, extended by FERC on 28 April 2026 through the 2029/30 auction, is a political convention on what the price may say. Three of four auctions are censored at the cap — the price has stopped carrying information and the shortfall in megawatts carries it instead (6,623 MW short in 2027/28).',
      },
      {
        step: 'Allocation to load',
        state:
          'Capacity cost billed to load-serving entities by peak-load contribution, then to retail through default-service auctions in restructured states (PA, MD, NJ, OH, IL, DE, DC) and through riders in vertically integrated ones (VA, WV, KY) — different clocks for the same shock.',
        convention:
          'Peak-load contribution, not causation. The January 2026 principles propose assigning costs to LSEs with new data centers that have neither self-procured capacity nor agreed to be curtailable — a causation rule that does not yet exist in the tariff. A parallel ledger runs through transmission: $4.36 billion of 2024 local projects for data centers in seven states, 95% rolled into general rates.',
      },
      {
        step: 'Household bill',
        state:
          'Pepco DC residential bills up $10 a month (9%) from June 2025 on the 2025/26 result alone; Maryland zones up 10% (Pepco) to 24% (Allegheny); PPL up $6.48 a month; the BGE and Dominion zones cleared at $466.35 and $444.26 in 2025/26.',
        convention:
          'Incidence by decile. The capacity charge is per kilowatt-hour, and electricity is a far larger budget share at the bottom of the distribution; the BLS Consumer Expenditure Survey converts dollars per household into percent of income by decile — the number nobody has published.',
      },
    ],
    facts: [
      {
        fact: '2025/26 BRA (July 2024): $269.92/MW-day RTO from $28.92; $14.7 billion total from $2.2 billion; BGE $466.35 and Dominion $444.26. IMM: data centers 63%, about $9.3 billion.',
        source: 'PJM BRA report; Monitoring Analytics',
        asOf: '2024-09',
      },
      {
        fact: 'The IMM’s partial counterfactuals for 2025/26 do not add up — ELCC accreditation +$4.4 billion (+49.1%), RMR exclusion of Brandon Shores and Wagner +$4.3 billion (+41.2%), data centers +$9.3 billion — roughly $18 billion of causes for a $12.5 billion increase. The attribution problem is a nonlinear interaction on a steep supply curve.',
        source: 'Synapse for DC OPC, 2025-04-25, citing IMM Part A',
        asOf: '2025-04',
      },
      {
        fact: '2026/27 BRA (July 2025): cleared at the cap, $329.17/MW-day, $16.1 billion.',
        source: 'PJM',
        asOf: '2025-07',
      },
      {
        fact: '2027/28 BRA (17 December 2025): $333.44/MW-day, $16.4 billion, 134,479 MW procured, 6,623 MW short of the reliability requirement. IMM: $6.5 billion (40%) from data centers, $6.2 billion of it from data centers not yet built; three-auction cumulative $21.3 billion of $47.2 billion (45%).',
        source: 'PJM; Monitoring Analytics via Utility Dive',
        asOf: '2026-02',
      },
      {
        fact: '2028/29 BRA (July 2026): at the cap for the third consecutive time, about $16.4 billion. IMM: about $6.3 billion (38%); four-auction cumulative $29.4 billion of $63.6 billion (46%) — which implies upward revisions to earlier auctions that must be reconciled from the IMM reports directly.',
        source: 'Sierra Club; Who Pays for Data Centers tracker',
        asOf: '2026-07',
      },
      {
        fact: 'FERC approved the collar extension on 28 April 2026: cap about $325/MW-day, floor $175, for the auctions closing 7 July 2026 and 15 December 2026. The collar was estimated to have cut costs by $13.1 billion across its first two auctions.',
        source: 'FERC; PJM; APPA',
        asOf: '2026-04',
      },
      {
        fact: 'White House and governors’ statement of principles, 15 January 2026: extend the collar; a backstop procurement starting by September 2026 with 15-year price certainty; allocate its costs to LSEs with new data centers that have not self-procured or agreed to curtail; verifiable financial commitment before load enters the forecast.',
        source: 'Latham & Watkins summary',
        asOf: '2026-01',
      },
      {
        fact: 'PJM board decisional letter, 16 January 2026: 50 MW large-load definition; an Expedited Interconnection Track for bring-your-own-generation by August 2026; connect-and-manage with curtailment ahead of pre-emergency demand response by end-2026; cost allocation to LSEs short from load growth; backstop acceleration.',
        source: 'PJM',
        asOf: '2026-01',
      },
      {
        fact: 'FERC show-cause orders to all six RTOs and ISOs, 18 June 2026 (RM26-4): justify or rewrite large-load interconnection rules within 60 days. The DOE directive of October 2025 defined large loads at 20 MW.',
        source: 'FERC',
        asOf: '2026-06',
      },
      {
        fact: '23 states had approved at least one large-load tariff by May 2026, seven more pending. AEP Ohio (PUCO, 2025): 85% minimum demand charge, 12-year terms, 25 MW threshold. Dominion GS-5 (Virginia SCC, November 2025, effective January 2027): minimum demand, 14-year terms, four-year ramp.',
        source: 'E3/Halcyon whitepaper, 2026-05; EEI list, 2026-08',
        asOf: '2026-08',
      },
      {
        fact: 'Ratepayers in seven PJM states paid about $4.36 billion in 2024 for 130 local transmission projects serving data centers; only six were paid by the requesting customer. Virginia just under $2 billion, Ohio $1.3 billion, Pennsylvania $492 million.',
        source: 'Union of Concerned Scientists, 2025-09',
        asOf: '2025-09',
      },
      {
        fact: '2026 load forecast (14 January 2026): summer peak growth 3.6% a year to about 222 GW by 2036; a near-term cut of 4.4 GW for summer 2028 after stricter data-center vetting, 0.7 points of it from large loads. Jefferies read the cut as delays, not weakness.',
        source: 'PJM 2026 Load Forecast Report; Utility Dive',
        asOf: '2026-01',
      },
    ],
    identification:
      '§1 (PJ-1) is accounting with a pre-registered chain: attributable dollars by LDA from the IMM counterfactuals, residential share from EIA-861 sales, pass-through timing from default-service and rider filings in three zones (Dominion, BGE, Pepco DC) rather than the whole RTO, then budget shares by income decile from the CEX. Report a range across the IMM’s low and high attributions, never a point. §2 (PJ-2) has to respect two facts: the price is censored at the cap in three of four auctions, so the decomposition runs in megawatts of shortfall and unconstrained shadow price, not dollars per MW-day; and the IMM’s partial counterfactuals interact, so the method is a Shapley (order-averaged) decomposition over forecast revision, accreditation, retirements and RMR exclusion, using PJM’s published planning parameters and aggregate supply curves. The forecast-written share is the Shapley value of the forecast revision. §3 (PJ-3) is a calibrated model, but the conventions are no longer hypothetical: minimum-demand tariffs, causation-based allocation and bring-your-own-generation are being adopted on different dates in different states, so PJ-4 tests the model’s first-order prediction — that the vetting rule moves the forecast — on the 2026 and 2027 vintages.',
    priorWork: [
      {
        cite: 'Peskoe & Martin (Harvard ELI, March 2025), Extracting Profits from the Public',
        did: 'The legal account: how utility ratemaking and PJM cost allocation let data-center costs flow to captive customers.',
        gap: 'No dollars by decile, no forecast loop — the law without the ledger.',
      },
      {
        cite: 'Monitoring Analytics, analyses of each BRA (2024-2026)',
        did: 'The counterfactual attributions — 63%, 40%, 38% — by re-clearing the auction without forecasted data-center load.',
        gap: 'Partial counterfactuals that do not sum; RTO-level; stops at the wholesale bill.',
      },
      {
        cite: 'Synapse for DC OPC (25 April 2025), Drivers of PJM’s Capacity Market Price Surge',
        did: 'Four named drivers with IMM magnitudes and a worked residential bill impact for one LDA — the nearest method precedent for §1.',
        gap: 'One jurisdiction, the average customer, no distribution.',
      },
      {
        cite: 'Maryland OPC (14 August 2024), Bill and Rate Impacts',
        did: 'Zone-by-zone Maryland bill impacts of 2025/26 — 10% to 24%.',
        gap: 'The average customer again; the incidence question is not asked.',
      },
      {
        cite: 'Union of Concerned Scientists (September 2025), Connection Costs Loophole',
        did: 'Tallied $4.36 billion of 2024 data-center transmission rolled into general rates across seven states.',
        gap: 'A second ledger the capacity work has never joined to the first.',
      },
      {
        cite: 'E3 / Halcyon (May 2026), Large Load Tariff Whitepaper',
        did: 'Catalogued 23 states’ large-load tariffs and their terms.',
        gap: 'The cross-state variation exists as a table, not as an identification strategy.',
      },
      {
        cite: 'MacKenzie (2006), An Engine, Not a Camera',
        did: 'The performativity thesis: models make the prices they claim to describe.',
        gap: 'Never applied to a load forecast that sets a procurement target.',
      },
    ],
    openQuestions: [
      {
        question: 'Can the IMM’s per-auction attributions be reconciled with its cumulative figures?',
        matters: 'The 2027/28 and 2028/29 numbers imply upward revisions to earlier auctions; §1 needs one consistent series before anything is divided by a household.',
      },
      {
        question: 'How much of the price is information once three auctions clear at the cap?',
        matters: 'If the answer is none, §2 lives in megawatts and shadow prices, and the paper says so on page one.',
      },
      {
        question: 'What is the pass-through lag by state and supply type — default service, rider, competitive supplier?',
        matters: 'Decides which delivery year of costs lands in which bill year; get it wrong and the incidence is off by a year.',
      },
      {
        question: 'Does the ledger include transmission?',
        matters: 'Adding the $4.4 billion a year roughly doubles the per-household number in Virginia; show both and say which is the headline.',
      },
      {
        question: 'How much forecast load is still speculative after the 2026 vetting rule?',
        matters: 'PJ-2’s upper bound; the 2027 vintage lands on 14 January 2027, mid-winter-school, and can be promised as the update.',
      },
      {
        question: 'Who captures the windfall — independent power producers, regulated utilities, or hyperscalers through co-location?',
        matters: 'Kept in the separate trade memo; it must not steer the incidence section.',
      },
    ],
    plan: [
      {
        window: 'Sep 14-25 · between the races',
        deliverable:
          'Data sprint: BRA reports and planning parameters 2020/21-2028/29; every IMM auction analysis; load-forecast vintages 2022-2026 as a panel; EIA-861 2019-2024; CEX 2023-2024 decile tables; the four bill-impact reports; the E3 tariff catalogue. One chart: forecast vintages against clearing prices.',
        gate: 'The IMM series reconciles, or the discrepancy is documented as the first footnote.',
      },
      {
        window: 'Oct 1-31',
        deliverable: '§1 incidence for three zones and the RTO: dollars per household per year and percent of income by decile, as a range.',
        gate: 'A defensible headline number by 31 October, or the paper narrows to §1 plus §2.',
      },
      {
        window: 'Nov 1-15',
        deliverable: '§2 reflexivity: Shapley decomposition in megawatts across forecast revision, accreditation, retirements, RMR; the forecast-written share with bounds.',
        gate: 'The forecast term is distinguishable from accreditation; if not, report the joint term honestly.',
      },
      {
        window: 'Nov 15-30',
        deliverable:
          '§3 calibrated procurement-and-allocation model under the status quo, minimum-demand tariffs, causation allocation and bring-your-own-generation; PJ-4 first pass on the 2026 vintage by state tariff status.',
        gate: 'Dollars shifted per household per year under each rule, with each rule dated to where it is already law.',
      },
      {
        window: 'Dec',
        deliverable: 'Full draft to Lafond and the Oxford meetings; Michael’s conventions-as-institutions section merged; lightning talk cut.',
        gate: 'Paper in hand for 3 January.',
      },
      {
        window: 'Jan 14, 2027',
        deliverable: 'PJM’s 2027 load forecast lands during the winter school — the out-of-sample test of PJ-4, promised in the talk.',
        gate: 'Update the paper before it goes to a journal.',
      },
    ],
    failureModes: [
      'Derivative: the IMM has already attributed, and the paper reads as a summary. Answer: decile incidence and dated convention counterfactuals are new, the Shapley reconciliation is new — say what is new on page one.',
      'Censoring kills §2: at the cap, forecast and accreditation are jointly unidentified in price. The answer is megawatts, and if that fails, §2 becomes a bound.',
      'Pass-through heterogeneity swamps the signal at RTO level. Three zones done properly beat thirteen states done badly.',
      'Political heat: every number will be read as taking a side. Pre-registration, ranges, and the trade memo kept outside the paper.',
      'The forecast is right: the data centers get built and the speculative load was real. Then the forecast-written share is small and the paper says the conventions, not the forecast error, did the distributing — which is still the thesis.',
    ],
    crossLane:
      'The mirror of Lane I. In PJM the object is a load forecast that becomes a procurement target; in Lithuania it is a wind forecast whose error becomes an imbalance. Both are forecasts inside market rules, and in both the rule — not the weather, not the chips — decides who pays. This is the sentence the Abu Dhabi talk opens with, and Lane I is its live exhibit.',
  },
}
