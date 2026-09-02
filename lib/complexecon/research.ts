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
      'Baltic power has essentially no independent English-language researcher. In February 2025 the three Baltic states desynchronized from the Russian-controlled BRELL ring and joined the Continental European grid — a once-in-history change in network topology whose market consequences (balancing costs, price coupling, frequency-reserve procurement) remain largely unwritten. Physical presence in Palanga through late September is a live edge: the wind being forecast is observable out the window.',
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
          'The Baltic offshore buildout will raise, not lower, price volatility for years — capacity is arriving faster than the transmission and storage that would absorb it, so cannibalization and negative-price hours lead the smoothing.',
        test: 'Cross-sectional check against zones further along the same curve (Denmark, northern Germany): volatility and negative-price frequency vs wind penetration, controlling for interconnection ratio.',
      },
      {
        id: 'LT-4',
        claim:
          'In hours when gas sets the uniform clearing price, wind owners collect inframarginal rents financed through the bills of households in some of the EU’s most energy-poor member states — and the post-BRELL security premium is likewise socialized onto ratepayers by convention. The rent transfer is calculable, and it lands on the inequality frame directly.',
        test: 'Reconstruct hourly inframarginal rents for LT wind from ENTSO-E prices and a merit-order proxy; join spike frequency to EU-SILC energy-poverty indicators across the Baltics; headline number is euros transferred per household per year under the clearing convention.',
      },
    ],
    data: [
      { name: 'ENTSO-E Transparency', url: 'https://transparency.entsoe.eu', note: 'free API — prices, load, generation, balancing; the workhorse' },
      { name: 'Nord Pool', url: 'https://data.nordpoolgroup.com', note: 'day-ahead and intraday for LT zone' },
      { name: 'Litgrid', url: 'https://www.litgrid.eu', note: 'TSO data — balancing, interconnectors, desync documentation' },
      { name: 'Open-Meteo', url: 'https://open-meteo.com', note: 'free GFS / ECMWF / ICON ensembles + historical forecast archive — same stack as the kite brief' },
      { name: 'Eurostat EU-SILC', url: 'https://ec.europa.eu/eurostat/web/income-and-living-conditions', note: 'energy-poverty indicators by country and year — the inequality join for LT-4' },
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
      'The facts are public and dramatic: PJM’s capacity price rose from about $29 to $270 per MW-day for 2025-26, the market monitor attributed 63% of the increase to datacenters — roughly $9.3 billion recovered from customers — and prices remain elevated in 2026. The incidence question has been raised as law and policy (Peskoe & Martin, Harvard Electricity Law Initiative, 2025) and as journalism. Nobody has written the complexity version: the reflexive forecast-to-price loop, the distribution by income decile, or the counterfactual conventions.',
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
        test: 'Decompose the 2024-25 price change into reliability-requirement changes driven by PJM load-forecast revisions vs supply-side drivers (retirements, accreditation methodology) vs realized peak load; the forecast-driven share is the estimate. Pre-register the decomposition before pulling results.',
      },
      {
        id: 'PJ-3',
        claim:
          'Counterfactual conventions: under alternative cost-allocation rules — large-load tariffs, datacenters bearing forecast risk, price collars — the same load produces materially different household burdens; the dollars shifted per household is a property of the rule, not the demand.',
        test: 'A calibrated procurement-and-allocation model (simple first, agent-based if time allows) run under the status quo and three alternative conventions already proposed in practice; output is dollars shifted per household per year under each. The Farmer-grade section: conventions as system parameters.',
      },
    ],
    data: [
      { name: 'PJM capacity market results', url: 'https://www.pjm.com/markets-and-operations/rpm', note: 'Base Residual Auction results and parameters by delivery year and zone' },
      { name: 'PJM load forecast reports', url: 'https://www.pjm.com/planning/resource-adequacy-planning/load-forecast-dev-process', note: 'annual forecasts and revisions — the performative object' },
      { name: 'Monitoring Analytics (IMM)', url: 'https://www.monitoringanalytics.com', note: 'State of the Market reports; the 63% datacenter attribution' },
      { name: 'EIA-861', url: 'https://www.eia.gov/electricity/data/eia861/', note: 'retail sales and revenue by utility and customer class' },
      { name: 'BLS Consumer Expenditure Survey', url: 'https://www.bls.gov/cex/', note: 'electricity spend by income decile — the incidence join' },
      { name: 'Peskoe & Martin 2025', url: 'http://eelp.law.harvard.edu/wp-content/uploads/2025/03/Harvard-ELI-Extracting-Profits-from-the-Public.pdf', note: 'the legal account of the cost shift — nearest prior work' },
    ],
    armstrongAngle:
      'Research capital first. A separate one-page trade memo maps the findings to who captures the capacity windfall — independent power producers with PJM exposure vs regulated utilities vs hyperscalers — without shaping the research.',
    quantSkill:
      'Incidence analysis, price decomposition, calibrated procurement modelling — and the discipline of a pre-registered decomposition on a politically charged question.',
    firstProbe:
      'Two-week data sprint before the Ironman: pull auction results, load-forecast revisions, and CEX budget shares; one chart of forecast revisions against capacity prices; the §1 incidence skeleton. Michael drafts the conventions-as-institutions theory section in parallel.',
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
      'The fruit fly, upgraded from a market to a country. Every Lithuanian firm files financial statements with Registru centras; weather over the whole territory is free (ERA5, LHMT, Open-Meteo) and partly self-collected (the Sventoji station data); the price layer is small but complete — Nasdaq Vilnius, whose listed names are conveniently weather-exposed (Ignitis, Linas Agro, the dairy processors, Novaturas, Apranga), plus the LT power zone and registry bankruptcy events. Weather to business fundamentals to asset prices, for an entire nation, on public data end to end.',
    whyOpen:
      'Country-scale firm-level complexity work exists — CSH Vienna on Hungary’s firm-to-firm VAT network, Farmer’s group on pandemic supply chains, Axtell on the US firm population — but it runs on confidential administrative data obtained through central banks, and none of it has an exogenous physical driver. A public-registry version with weather as the instrument is reproducible and causally identified, and nobody has built it. Lithuania’s data openness, small size, and one observable exchange make it the tractable site; language and local knowledge are the moat.',
    mechanism:
      'One exogenous field (weather) forcing a fully enumerated population of firms, whose responses aggregate through supply chains and sectors into filed fundamentals, credit events, and a small set of listed prices. The economy as a single observable transmission system — the ABM calibration target Lane VI needs, one level up from the power market.',
    hypotheses: [
      {
        id: 'OE-1',
        claim:
          'The weather balance sheet of a nation: firm-level registry panels reveal stable, sector-specific weather betas — revenue and margin sensitivity to growing-season, heating-season, and tourist-season anomalies — estimable across the whole firm population, not a listed sample.',
        test: 'Registry financials joined to ERA5 sector-relevant weather aggregates; panel regressions with firm and year fixed effects; pre-register the sector-season pairs before estimation.',
      },
      {
        id: 'OE-2',
        claim:
          'The Sventoji study: coastal-summer weather causally moves the filed revenues of Palanga and Sventoji hospitality and tourism firms — the cleanest small natural experiment available, run partly on self-collected station data.',
        test: 'Beach-season weather indices (own station + LHMT) against registry revenues of coastal hospitality firms vs inland matched controls; sunny-season deviation as the treatment.',
      },
      {
        id: 'OE-3',
        claim:
          'Transmission to prices: weather-driven fundamental shocks reach Nasdaq Vilnius with a lag the thin market does not arbitrage, and reach credit events (registry bankruptcies) with predictable sectoral timing.',
        test: 'Event studies on weather-exposed listed names (Ignitis, Linas Agro, Novaturas, dairy) around fundamental-relevant weather seasons; bankruptcy hazard models with weather-beta exposures; honest about illiquidity — credit and power prices carry the fast layer.',
      },
    ],
    data: [
      { name: 'Registru centras', url: 'https://www.registrucentras.lt', note: 'the company register — filed financial statements for the whole firm population' },
      { name: 'data.gov.lt / Statistics Lithuania', url: 'https://data.gov.lt', note: 'open national datasets — sector aggregates, tourism, regional statistics' },
      { name: 'LHMT', url: 'https://www.meteo.lt', note: 'Lithuanian Hydrometeorological Service — station observations, incl. the coast' },
      { name: 'ERA5 / Open-Meteo', url: 'https://open-meteo.com', note: 'gridded weather over the whole territory, decades deep — plus the self-collected Sventoji data' },
      { name: 'Nasdaq Vilnius', url: 'https://nasdaqbaltic.com', note: 'the complete listed universe — small, enumerable, weather-exposed' },
    ],
    armstrongAngle:
      'Weather-beta positions in Baltic listed names and the bankruptcy-hazard screen as a credit lens; more deeply, this is the calibration substrate that turns Lane VI’s generator from one market into an economy.',
    quantSkill:
      'Panel econometrics on administrative data, record linkage at population scale, hazard models — the applied-micro toolkit added to the program, and a data moat built with local language and local knowledge.',
    firstProbe:
      'The Sventoji study (OE-2), scoped as a blog post first: one beach season of own-station weather against the filed revenues of a dozen coastal firms, pulled from the registry with Aidas as translator and co-conspirator. Cheap, charming, causally clean — and the proof that the registry join works before the population-scale version is attempted.',
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
      body: 'The Baltics rank among the EU’s most energy-poor member states. Every hour gas sets the uniform clearing price, wind owners collect inframarginal rents financed through those households’ bills — and the post-BRELL security premium is socialized the same way. LT-4 computes the transfer.',
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
    window: 'Weeks 1-19 · parallel track',
    label: 'The Abu Dhabi paper — Who Pays for Cognition (Lane V)',
    detail:
      'Data sprint before September 26; §1 incidence drafted in October; §2 reflexivity decomposition and §3 counterfactual model in November; full draft to Lafond and the Oxford meetings in December; paper plus lightning talk in hand for January 3. Michael Ralph co-authors the theory section; Lori owns data and model.',
    gate: 'A defensible headline number by end of October or the paper narrows to §1 plus §2. The gains ledger — valuation conventions — is the second paper of the same program, not a competing one.',
  },
  {
    window: 'Weeks 1-3',
    label: 'Lane I probe — while still in Palanga',
    detail:
      'ENTSO-E + Open-Meteo pipeline into macro-signals; test LT-1; publish "The Grid After BRELL" as the first Baltic power post. The location edge expires around September 23 — this goes first.',
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
