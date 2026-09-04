// Auto-scoped HTML body of the OFR dossier memo. Rendered via dangerouslySetInnerHTML
// on /complexecon/memos/ofr-dossier only — kept out of shared bundles on purpose.
export const OFR_DOSSIER_HTML = `
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=Public+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  .memo-doc {
    --paper: #f4f4ef;
    --surface: #fbfbf8;
    --ink: #16222e;
    --ink-soft: #3d4c5a;
    --muted: #5c6a76;
    --faint: #9aa6b0;
    --rule: #d4d6cd;
    --navy: #1d4f7c;
    --navy-deep: #163a5c;
    --red: #9e2f23;
    --red-bg: rgba(158, 47, 35, 0.06);
    --navy-bg: rgba(29, 79, 124, 0.06);
    --serif: "Source Serif 4", Georgia, "Times New Roman", serif;
    --sans: "Public Sans", "Helvetica Neue", Arial, sans-serif;
    --mono: "IBM Plex Mono", "SF Mono", Menlo, monospace;
  }
  .memo-doc, .memo-doc * { box-sizing: border-box; }
  .memo-doc {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--serif);
    font-size: 17px;
    line-height: 1.65;
  }
  .memo-doc .wrap { max-width: 800px; margin: 0 auto; padding: 24px 8px 40px; }
  .memo-doc .eyebrow {
    font-family: var(--sans); font-size: 12px; font-weight: 700;
    letter-spacing: 2.5px; text-transform: uppercase; color: var(--muted);
  }
  .memo-doc h1 {
    font-family: var(--serif); font-size: clamp(34px, 6vw, 48px);
    font-weight: 700; line-height: 1.1; margin: 10px 0 6px; text-wrap: balance;
  }
  .memo-doc .subtitle { font-style: italic; color: var(--ink-soft); font-size: 19px; margin: 0 0 22px; }
  .memo-doc .statgrid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    border: 1px solid var(--rule); background: var(--surface); margin: 26px 0 0;
  }
  .memo-doc .stat { padding: 12px 14px; border-right: 1px solid var(--rule); }
  .memo-doc .stat:last-child { border-right: none; }
  .memo-doc .stat .v { font-family: var(--mono); font-size: 20px; font-weight: 500; color: var(--navy); font-variant-numeric: tabular-nums; }
  .memo-doc .stat .v.bad { color: var(--red); }
  .memo-doc .stat .l { font-family: var(--sans); font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: var(--muted); margin-top: 2px; }
  .memo-doc h2 {
    font-family: var(--sans); font-size: 15px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase; color: var(--navy);
    border-bottom: 2px solid var(--rule); padding-bottom: 8px; margin: 52px 0 18px;
  }
  .memo-doc h3 { font-family: var(--serif); font-size: 21px; font-weight: 700; margin: 26px 0 6px; }
  .memo-doc p { margin: 0 0 14px; max-width: 70ch; }
  .memo-doc .lede { font-size: 19px; line-height: 1.6; color: var(--ink-soft); }
  .memo-doc strong { font-weight: 600; color: var(--ink); }
  .memo-doc .cite { font-family: var(--mono); font-size: 13.5px; color: var(--navy); }
  .memo-doc a { color: var(--navy); text-decoration-color: var(--rule); text-underline-offset: 3px; }
  .memo-doc a:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }

  /* Timeline */
  .memo-doc .tl { border-left: 2px solid var(--rule); margin: 20px 0 8px 6px; padding-left: 0; list-style: none; }
  .memo-doc .tl li { position: relative; padding: 0 0 22px 24px; }
  .memo-doc .tl li::before {
    content: ""; position: absolute; left: -6px; top: 7px;
    width: 10px; height: 10px; background: var(--navy); border-radius: 50%;
  }
  .memo-doc .tl li.crisis::before { background: var(--red); }
  .memo-doc .tl .yr { font-family: var(--mono); font-size: 13px; font-weight: 500; color: var(--muted); letter-spacing: 0.5px; }
  .memo-doc .tl .hd { font-family: var(--sans); font-weight: 700; font-size: 16px; margin: 1px 0 4px; }
  .memo-doc .tl p { font-size: 16px; margin-bottom: 0; }

  /* Reason blocks */
  .memo-doc .reason { border-left: 3px solid var(--navy); background: var(--navy-bg); padding: 12px 16px; margin: 0 0 12px; }
  .memo-doc .reason.hot { border-left-color: var(--red); background: var(--red-bg); }
  .memo-doc .reason .hd { font-family: var(--sans); font-weight: 700; font-size: 15px; margin-bottom: 4px; }
  .memo-doc .reason p { font-size: 16px; margin: 0; }

  /* Dossier cards */
  .memo-doc .person { border: 1px solid var(--rule); background: var(--surface); margin: 0 0 22px; }
  .memo-doc .person header { padding: 14px 18px 10px; border-bottom: 1px solid var(--rule); display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; }
  .memo-doc .person header h3 { margin: 0; font-size: 22px; }
  .memo-doc .person .role { font-family: var(--sans); font-size: 12.5px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); }
  .memo-doc .person .body { padding: 14px 18px 16px; }
  .memo-doc .kv { display: grid; grid-template-columns: 118px 1fr; gap: 4px 14px; font-size: 15.5px; margin-bottom: 12px; }
  .memo-doc .kv dt { font-family: var(--sans); font-size: 11.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); padding-top: 3px; }
  .memo-doc .kv dd { margin: 0; color: var(--ink-soft); }
  .memo-doc .kv dd.cx { color: var(--ink); }
  .memo-doc .works { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--rule); }
  .memo-doc .works li { padding: 10px 0 10px; border-bottom: 1px solid var(--rule); font-size: 15.5px; }
  .memo-doc .works li:last-child { border-bottom: none; padding-bottom: 2px; }
  .memo-doc .works .t { font-weight: 600; }
  .memo-doc .works .m { font-family: var(--mono); font-size: 12.5px; color: var(--muted); }
  .memo-doc .works .take { display: block; color: var(--ink-soft); margin-top: 2px; }
  .memo-doc .works .take b { font-family: var(--sans); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--navy); }

  /* Chart */
  .memo-doc figure { margin: 20px 0 6px; }
  .memo-doc figcaption { font-family: var(--sans); font-size: 12.5px; color: var(--muted); margin-top: 6px; }
  .memo-doc .note { font-size: 14.5px; color: var(--muted); font-style: italic; }
  .memo-doc footer { margin-top: 56px; border-top: 2px solid var(--rule); padding-top: 14px; }
  .memo-doc footer p { font-size: 13.5px; color: var(--muted); }
  @media (max-width: 560px) { .memo-doc .kv { grid-template-columns: 1fr; gap: 0 0; } .memo-doc .kv dt { padding-top: 8px; } }
</style>

<div class="memo-doc"><div class="wrap">
  <header>
    <div class="eyebrow">A Primer · Prepared for the Complexity Economics Program · September 2026</div>
    <h1>The OFR Dossier</h1>
    <p class="subtitle">The Office of Financial Research: the United States&rsquo; experiment in seeing its own financial system &mdash; how it was conceived, who built it, and why it sits unused.</p>
    <div class="statgrid">
      <div class="stat"><div class="v">2010</div><div class="l">Created &middot; Dodd-Frank Title I</div></div>
      <div class="stat"><div class="v bad">196 &rarr; 70</div><div class="l">Staff, 2024 &rarr; planned 2026</div></div>
      <div class="stat"><div class="v bad">4+ yrs</div><div class="l">No confirmed director</div></div>
      <div class="stat"><div class="v">0</div><div class="l">Subpoenas ever issued</div></div>
    </div>
  </header>

  <h2>I &middot; What It Is</h2>
  <p class="lede">The OFR is a bureau inside the US Treasury, created by <span class="cite">Dodd-Frank Act &sect;&sect;151&ndash;156</span> in July 2010, with two statutory jobs: give the Financial Stability Oversight Council the <strong>data</strong> to see the whole financial system, and the <strong>research</strong> to understand it. It holds powers no other financial agency has &mdash; the authority to standardize financial data across every regulator, and a subpoena power to compel data from any financial company. It is funded not by Congress but by assessments on large banks, which was meant to insulate it from politics and instead made it politically friendless.</p>
  <p>It is also the closest any government has come to institutionalizing complexity economics: an agency whose founding premise was that the financial system is a network of contracts and obligations that no equilibrium model can summarize, and that must therefore be <em>mapped, measured, and simulated</em>.</p>

  <h2>II &middot; The Events That Created It</h2>
  <ul class="tl">
    <li class="crisis">
      <span class="yr">SEP 2008</span>
      <div class="hd">The weekend nobody could see</div>
      <p>As Lehman Brothers failed, neither the Fed, the Treasury, nor the SEC could answer the operative question: <em>who is exposed to whom, and for how much?</em> Counterparty webs across derivatives, repo, and securities lending were invisible &mdash; not secret, just never collected in any common format. The bailout decisions of that autumn were made substantially blind.</p>
    </li>
    <li>
      <span class="yr">2009</span>
      <div class="hd">The CE-NIF &mdash; a National Institute of Finance</div>
      <p>Allan Mendelowitz and John Liechty convene the <strong>Committee to Establish the National Institute of Finance</strong>: a volunteer campaign of economists, statisticians, and quants (with public support from Harry Markowitz, among others) proposing a standalone agency &mdash; an NIH for finance &mdash; with a data center and a research arm. Mendelowitz described the intended role as &ldquo;like a biblical prophet &mdash; speaking truth to power.&rdquo;</p>
    </li>
    <li>
      <span class="yr">JUL 2010</span>
      <div class="hd">Dodd-Frank compromise: an office, not an institute</div>
      <p>Senator Jack Reed carries the proposal into Dodd-Frank. It survives &mdash; but as an <em>office inside Treasury</em> rather than an independent institute, with a Senate-confirmed director. Both compromises will matter: the first makes it subordinate to each administration&rsquo;s Treasury, the second makes it decapitable by simple inaction.</p>
    </li>
    <li>
      <span class="yr">2013&ndash;2017</span>
      <div class="hd">The buildout under Richard Berner</div>
      <p>First confirmed director Richard Berner builds the research corps and delivers the OFR&rsquo;s most durable win: global adoption of the <strong>Legal Entity Identifier</strong> &mdash; a 20-character code (<span class="cite">e.g. 5493&hellip;</span>) giving every counterparty on earth a unique name, the addressing system a financial-network map requires. The working-paper series becomes a genuine home for network contagion, agent-based, and stress-testing research.</p>
    </li>
    <li class="crisis">
      <span class="yr">2017&ndash;2019</span>
      <div class="hd">First dismantling</div>
      <p>The first Trump Treasury cuts staff by roughly a third and shrinks the budget; the director departs; the mission is narrowed to &ldquo;support&rdquo; functions. The lesson: an agency created to ask uncomfortable questions has no natural constituency when nothing is on fire.</p>
    </li>
    <li>
      <span class="yr">2020&ndash;2024</span>
      <div class="hd">Vindication without restoration</div>
      <p>March 2020&rsquo;s Treasury-market seizure, Archegos in 2021, and the regional-bank runs of 2023 were each, precisely, failures to see leverage and exposure concentrations &mdash; the OFR&rsquo;s founding problem. A partial rebuild follows: a hedge-fund monitor, and in 2024 the office&rsquo;s first major mandatory data collection, covering <strong>non-centrally-cleared bilateral repo</strong> &mdash; the dark corner where the basis trade lives. No permanent director is confirmed after February 2022.</p>
    </li>
    <li class="crisis">
      <span class="yr">2025&ndash;2026</span>
      <div class="hd">Second dismantling</div>
      <p>Staff falls from 196 to roughly 100 during 2025; the FY2026 plan cuts to ~70 &mdash; a 60%+ reduction &mdash; with the $110M budget cut by nearly a quarter. The office runs under an acting director. Legislation to protect it (Rep. Bill Foster, a physicist) is introduced with little prospect. The smoke detector is being unplugged while private credit, stablecoins, and the Treasury basis trade grow in exactly its blind spots.</p>
    </li>
  </ul>

  <figure>
    <svg viewBox="0 0 640 180" role="img" aria-label="OFR full-time staff: 196 in 2024, about 100 in 2025, 70 planned for 2026">
      <line x1="60" y1="150" x2="620" y2="150" stroke="var(--rule)" stroke-width="1.5"/>
      <rect x="100" y="32" width="120" height="118" fill="var(--navy)"/>
      <rect x="280" y="90" width="120" height="60" fill="var(--red)" opacity="0.75"/>
      <rect x="460" y="108" width="120" height="42" fill="var(--red)"/>
      <text x="160" y="24" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="15" fill="var(--ink)">196</text>
      <text x="340" y="82" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="15" fill="var(--ink)">~100</text>
      <text x="520" y="100" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="15" fill="var(--ink)">70</text>
      <text x="160" y="168" text-anchor="middle" font-family="Public Sans, sans-serif" font-size="12" fill="var(--muted)">2024</text>
      <text x="340" y="168" text-anchor="middle" font-family="Public Sans, sans-serif" font-size="12" fill="var(--muted)">2025</text>
      <text x="520" y="168" text-anchor="middle" font-family="Public Sans, sans-serif" font-size="12" fill="var(--muted)">2026 (planned)</text>
    </svg>
    <figcaption>OFR full-time staff. The office is funded by bank assessments, not appropriations &mdash; the cuts are policy, not budget arithmetic.</figcaption>
  </figure>

  <h2>III &middot; Why It Is Not Leveraged Today</h2>
  <div class="reason">
    <div class="hd">1. It was born compromised</div>
    <p>The independent institute became an office inside Treasury &mdash; so its ambition resets with every administration, and a hostile one can hollow it without repealing anything. The Senate-confirmed directorship became a kill switch: leave it vacant (as it has been since 2022) and the office cannot fight for itself.</p>
  </div>
  <div class="reason">
    <div class="hd">2. Its strongest powers were never exercised</div>
    <p>The subpoena authority has never once been used; data has been gathered by negotiation with the regulators who own it &mdash; regulators who view the OFR as a rival. An unused power protects no one and offends everyone.</p>
  </div>
  <div class="reason">
    <div class="hd">3. Turf, everywhere</div>
    <p>The Fed sees monetary-adjacent research as its own; the SEC and CFTC own their data; banks resented paying assessments for their own surveillance. Every institutional neighbor had a reason to want the OFR small.</p>
  </div>
  <div class="reason hot">
    <div class="hd">4. The smoke-detector problem</div>
    <p>A monitoring agency&rsquo;s success is an absence &mdash; the crisis that didn&rsquo;t happen. In calm years it looks like overhead; after a crisis it looks like failure. There is no political moment at which it looks like a bargain, which is why it has now been cut in both directions of the cycle.</p>
  </div>
  <div class="reason hot">
    <div class="hd">5. A complexity organ inside an equilibrium body</div>
    <p>The deepest reason: the OFR was built on the premise that the financial system must be mapped and simulated as a network of heterogeneous agents &mdash; while the institutions it serves think in equilibrium models where such maps are a curiosity. It was asked to answer questions its principals were never required to ask. The gap between its epistemology and its masters&rsquo; is the same gap between complexity economics and the mainstream, made institutional.</p>
  </div>

  <h2>IV &middot; The People</h2>
  <p class="note">Eight figures, chosen because together they are the map from the OFR to complexity theory. Affiliations as of their OFR-era work; current seats noted where they matter.</p>

  <article class="person">
    <header><h3>Allan Mendelowitz</h3><span class="role">Instigator &middot; CE-NIF co-founder</span></header>
    <div class="body">
      <dl class="kv">
        <dt>Training</dt><dd>Economist (PhD, economics); career at GAO, the Export-Import Bank, and as chairman of the Federal Housing Finance Board</dd>
        <dt>Life&rsquo;s work</dt><dd>Making government capable of measurement &mdash; from trade statistics to housing finance to the NIF campaign; now president of the ACTUS Financial Research Foundation</dd>
        <dt>Complexity link</dt><dd class="cx">ACTUS &mdash; a standard that renders every financial contract as executable, machine-readable logic &mdash; is the substrate a full-economy simulation requires. He has spent fifteen years building the data layer for the model Farmer wants to run.</dd>
      </dl>
      <ol class="works">
        <li><span class="t">The CE-NIF white papers &amp; Senate testimony</span> <span class="m">2009&ndash;10</span><span class="take"><b>Takeaway &middot;</b> The founding argument: the crisis was a data failure before it was a policy failure; the fix is an institution, not a rule.</span></li>
        <li><span class="t">The case for a smart financial contract standard</span> <span class="m">with Brammertz &middot; J. Risk Finance 2018</span><span class="take"><b>Takeaway &middot;</b> If contracts are algorithms, the financial system is computable &mdash; risk aggregation becomes running the code, not surveying the holders.</span></li>
        <li><span class="t">ACTUS taxonomy &amp; specification</span> <span class="m">actusfrf.org &middot; ongoing</span><span class="take"><b>Takeaway &middot;</b> Thirty-odd contract types cover nearly all finance; a state-machine per type turns balance sheets into simulable objects &mdash; the missing piece between Lane VII&rsquo;s registry and Lane VI&rsquo;s generator.</span></li>
      </ol>
    </div>
  </article>

  <article class="person">
    <header><h3>John Liechty</h3><span class="role">Instigator &middot; CE-NIF co-founder</span></header>
    <div class="body">
      <dl class="kv">
        <dt>Training</dt><dd>PhD statistics, Cambridge; professor of marketing and statistics, Penn State (Smeal)</dd>
        <dt>Life&rsquo;s work</dt><dd>Bayesian computation (MCMC) applied wherever high-dimensional behavior hides &mdash; consumer attention, portfolio choice, systemic risk</dd>
        <dt>Complexity link</dt><dd class="cx">The computational-statistics case for the OFR: systemic risk is a high-dimensional inference problem, and the state needs the compute and the priors to run it.</dd>
      </dl>
      <ol class="works">
        <li><span class="t">Portfolio selection with higher moments</span> <span class="m">with Harvey, Liechty &amp; M&uuml;ller &middot; Quantitative Finance 2010</span><span class="take"><b>Takeaway &middot;</b> Once skew and kurtosis matter &mdash; and in crises they are all that matters &mdash; Bayesian machinery replaces mean-variance; tails are a first-class object.</span></li>
        <li><span class="t">The NIF proposal &amp; congressional testimony</span> <span class="m">2009&ndash;10</span><span class="take"><b>Takeaway &middot;</b> The technical blueprint: a reference data facility plus an analytic center &mdash; the two halves the OFR statute then codified.</span></li>
        <li><span class="t">Bayesian models of attention from eye-tracking</span> <span class="m">with Pieters &amp; Wedel &middot; Psychometrika 2003</span><span class="take"><b>Takeaway &middot;</b> The method travels: latent behavioral states inferred from noisy traces &mdash; the same inference shape as reading strategy from AIS trajectories in Lane VIII.</span></li>
      </ol>
    </div>
  </article>

  <article class="person">
    <header><h3>Richard Berner</h3><span class="role">First director, 2013&ndash;2017</span></header>
    <div class="body">
      <dl class="kv">
        <dt>Training</dt><dd>PhD economics (Pennsylvania); Fed staff, then chief US economist at Morgan Stanley; now co-director, NYU Stern Volatility and Risk Institute (with Robert Engle)</dd>
        <dt>Life&rsquo;s work</dt><dd>Converting Wall Street macro-forecasting discipline into official financial-stability monitoring</dd>
        <dt>Complexity link</dt><dd class="cx">Institutionalized the monitoring view &mdash; dashboards over forecasts, vulnerabilities over point predictions &mdash; and won the LEI fight that gave the financial network its node labels.</dd>
      </dl>
      <ol class="works">
        <li><span class="t">The OFR Financial Stability Reports &amp; Monitor framework</span> <span class="m">OFR 2013&ndash;17</span><span class="take"><b>Takeaway &middot;</b> Stability is tracked as a vector of vulnerabilities (leverage, liquidity, funding, contagion), not a single risk number &mdash; the state adopting a systems view.</span></li>
        <li><span class="t">Stress testing networks: the case of central counterparties</span> <span class="m">with Cecchetti &amp; Schoenholtz &middot; NBER 2019</span><span class="take"><b>Takeaway &middot;</b> CCPs concentrated risk rather than removing it; a stress test of a node is meaningless without the network around it.</span></li>
        <li><span class="t">CRISK: measuring the climate risk exposure of the financial system</span> <span class="m">with Jung &amp; Engle &middot; 2023&ndash;25</span><span class="take"><b>Takeaway &middot;</b> Climate beta estimated from market data, marked to a stress scenario &mdash; the nearest official-sector cousin to the climate-transmission lanes.</span></li>
      </ol>
    </div>
  </article>

  <article class="person">
    <header><h3>Richard Bookstaber</h3><span class="role">Research principal &middot; the ABM champion</span></header>
    <div class="body">
      <dl class="kv">
        <dt>Training</dt><dd>PhD economics, MIT; risk chief at Morgan Stanley, Salomon, Moore Capital, Bridgewater; later CRO of the University of California</dd>
        <dt>Life&rsquo;s work</dt><dd>Arguing &mdash; from inside the machine &mdash; that crises are made by tight coupling and complexity, and must be modeled agent by agent</dd>
        <dt>Complexity link</dt><dd class="cx">The purest complexity economist ever employed by the US government; brought Minsky, fire sales, and agent-based modeling into official stress thinking.</dd>
      </dl>
      <ol class="works">
        <li><span class="t">A Demon of Our Own Design</span> <span class="m">book &middot; 2007</span><span class="take"><b>Takeaway &middot;</b> Written before the crisis it describes: innovation adds coupling, coupling turns local failures into cascades &mdash; complexity itself, not any instrument, is the risk.</span></li>
        <li><span class="t">An agent-based model for financial vulnerability</span> <span class="m">with Paddrik &amp; Tivnan &middot; OFR WP, J. Econ. Interaction &amp; Coordination 2018</span><span class="take"><b>Takeaway &middot;</b> Banks, dealers, and funds as three agent classes reproduce fire-sale amplification; a stress test becomes a simulation, not a balance-sheet arithmetic.</span></li>
        <li><span class="t">The End of Theory</span> <span class="m">book &middot; 2017</span><span class="take"><b>Takeaway &middot;</b> Under radical uncertainty, deductive equilibrium theory fails in principle; agent-based simulation is not an approximation to theory but its replacement for crises.</span></li>
      </ol>
    </div>
  </article>

  <article class="person">
    <header><h3>Mark Flood</h3><span class="role">Research principal &middot; the data architect</span></header>
    <div class="body">
      <dl class="kv">
        <dt>Training</dt><dd>PhD economics (North Carolina); earlier research posts at the St. Louis Fed and FDIC</dd>
        <dt>Life&rsquo;s work</dt><dd>Financial data as public infrastructure &mdash; standards, ontologies, and the formal representation of contracts</dd>
        <dt>Complexity link</dt><dd class="cx">The bridge between data engineering and theory: if the system is a network of contracts, then contract representation <em>is</em> systemic-risk methodology.</dd>
      </dl>
      <ol class="works">
        <li><span class="t">Monitoring financial stability in a complex world</span> <span class="m">with Mendelowitz &amp; Treacy &middot; 2012</span><span class="take"><b>Takeaway &middot;</b> The monitoring problem stated as computer science: scale, standards, and latency &mdash; not more economists &mdash; are the binding constraints.</span></li>
        <li><span class="t">Handbook of Financial Data and Risk Information</span> <span class="m">ed., Cambridge &middot; 2014</span><span class="take"><b>Takeaway &middot;</b> The field manual for the data layer &mdash; what exists, who holds it, what it can and cannot say about risk.</span></li>
        <li><span class="t">Contract as automaton</span> <span class="m">with Goodenough &middot; OFR WP, J. Financial Market Infrastructures</span><span class="take"><b>Takeaway &middot;</b> A financial agreement is formally a state machine; law becomes computable, and the economy becomes, in principle, executable &mdash; ACTUS&rsquo;s theoretical twin.</span></li>
      </ol>
    </div>
  </article>

  <article class="person">
    <header><h3>Paul Glasserman</h3><span class="role">Research fellow &middot; the rigorist</span></header>
    <div class="body">
      <dl class="kv">
        <dt>Training</dt><dd>PhD applied mathematics, Harvard; Jack R. Anderson Professor, Columbia Business School</dd>
        <dt>Life&rsquo;s work</dt><dd>Computational probability for finance &mdash; Monte Carlo methods, and later the mathematics of contagion and stress</dd>
        <dt>Complexity link</dt><dd class="cx">The discipline inside the network literature: his results say when contagion claims are and are not justified &mdash; the L&oacute;pez de Prado role, played inside the Farmer subject matter.</dd>
      </dl>
      <ol class="works">
        <li><span class="t">Monte Carlo Methods in Financial Engineering</span> <span class="m">book &middot; 2003</span><span class="take"><b>Takeaway &middot;</b> The canon of simulation-based pricing and risk &mdash; the numerical spine under every modern stress engine.</span></li>
        <li><span class="t">How likely is contagion in financial networks?</span> <span class="m">with Young &middot; OFR WP 2014, J. Banking &amp; Finance 2015</span><span class="take"><b>Takeaway &middot;</b> The sobering bound: direct default cascades alone are surprisingly hard to generate; real amplification needs fire sales, funding runs, confidence &mdash; a constraint every network paper must now answer.</span></li>
        <li><span class="t">Contagion in financial networks</span> <span class="m">with Young &middot; J. Economic Literature 2016</span><span class="take"><b>Takeaway &middot;</b> The field, organized: which mechanisms are established, which are speculation &mdash; the map of what remains provable.</span></li>
      </ol>
    </div>
  </article>

  <article class="person">
    <header><h3>H. Peyton Young</h3><span class="role">Collaborating theorist</span></header>
    <div class="body">
      <dl class="kv">
        <dt>Training</dt><dd>PhD mathematics, Michigan; Oxford (emeritus), LSE, Johns Hopkins</dd>
        <dt>Life&rsquo;s work</dt><dd>Evolutionary game theory and stochastic stability &mdash; how conventions, norms, and institutions emerge and shift</dd>
        <dt>Complexity link</dt><dd class="cx">The direct bridge to the conventions research lane: his mathematics is <em>the</em> formal theory of how a convention (a pricing rule, a tariff design, an accounting norm) becomes locked in and how it tips.</dd>
      </dl>
      <ol class="works">
        <li><span class="t">The evolution of conventions</span> <span class="m">Econometrica 1993</span><span class="take"><b>Takeaway &middot;</b> Conventions are stochastically stable equilibria &mdash; which convention a society lands on is predictable from the perturbation structure, not from efficiency. The theory under &ldquo;who pays for weather is a convention.&rdquo;</span></li>
        <li><span class="t">How likely is contagion in financial networks?</span> <span class="m">with Glasserman &middot; 2015</span><span class="take"><b>Takeaway &middot;</b> (As above) &mdash; the theorist&rsquo;s half of the OFR&rsquo;s most-cited result.</span></li>
        <li><span class="t">How safe are central counterparties in credit default swap markets?</span> <span class="m">with Paddrik &middot; OFR WP, Mathematics &amp; Financial Economics 2021</span><span class="take"><b>Takeaway &middot;</b> Using actual supervisory CDS data: a CCP&rsquo;s safety depends on the network of its members&rsquo; other obligations &mdash; the node is only as safe as the graph.</span></li>
      </ol>
    </div>
  </article>

  <article class="person">
    <header><h3>Mark Paddrik</h3><span class="role">Research principal &middot; the simulator</span></header>
    <div class="body">
      <dl class="kv">
        <dt>Training</dt><dd>PhD systems &amp; information engineering, Virginia</dd>
        <dt>Life&rsquo;s work</dt><dd>Micro-level simulation of market infrastructure &mdash; order books, margin systems, clearing networks &mdash; against real supervisory data</dd>
        <dt>Complexity link</dt><dd class="cx">The proof that calibrated, policy-grade ABM is possible inside government when the data access exists &mdash; the working demonstration of what the OFR was for.</dd>
      </dl>
      <ol class="works">
        <li><span class="t">An agent-based model of the E-Mini S&amp;P 500 and the Flash Crash</span> <span class="m">with Hayes, Todd, Yang, Beling &amp; Scherer &middot; 2012</span><span class="take"><b>Takeaway &middot;</b> A simulated limit-order book with realistic agent classes reproduces May 6, 2010 &mdash; microstructure crises are emergent and rehearsable.</span></li>
        <li><span class="t">An agent-based model for financial vulnerability</span> <span class="m">with Bookstaber &amp; Tivnan &middot; 2018</span><span class="take"><b>Takeaway &middot;</b> (As above) &mdash; the fire-sale engine.</span></li>
        <li><span class="t">CCP stress under margin calls</span> <span class="m">with Young &amp; co-authors &middot; OFR series</span><span class="take"><b>Takeaway &middot;</b> Margin procyclicality simulated on real cleared-market data: the risk-management rule itself is the amplifier &mdash; a convention producing the distribution, measured.</span></li>
      </ol>
    </div>
  </article>

  <h2>V &middot; The Map to Complexity Theory</h2>
  <p>Read as one story, the OFR is the <strong>networks-and-systemic-risk school of complexity economics given a government address</strong>. Its founding premise (the system is a network no one can see), its best data win (the LEI &mdash; names for nodes), its research crown jewels (Glasserman&ndash;Young on contagion, Bookstaber&ndash;Paddrik&ndash;Tivnan on fire sales, Paddrik&ndash;Young on CCPs), and its unfinished ambition (ACTUS and contract-as-automaton &mdash; the economy as executable code) are complexity economics end to end. It employed the field&rsquo;s purest practitioner-theorist (Bookstaber), collaborated with its sharpest conventions theorist (Young), and enforced identification discipline (Glasserman) a decade before &ldquo;causal factor investing&rdquo; made that fashionable.</p>
  <p>Its failure is equally instructive, and it is the strategic lesson of this dossier: <strong>the institutional home for complexity finance proved fragile, so the durable home is public, reproducible research</strong> &mdash; open data, open code, results anyone can rerun. The OFR&rsquo;s twin dismantlings are the strongest argument that the open seat on the strategy map (physical systems &times; runs-a-book, <em>published</em>) is not just unoccupied but structurally undersupplied: governments defund it, desks privatize it, academics lack the data. And two of its people hand this program its tools directly &mdash; Young&rsquo;s stochastic stability is the formal theory beneath the valuation-conventions and who-pays-for-weather lanes, and Mendelowitz&rsquo;s ACTUS is the contract-level substrate that would someday let Lane VII&rsquo;s observable economy be not merely measured but <em>run</em>.</p>

  <footer>
    <p>Prepared September 2026. Key sources: Dodd-Frank Act Title I; OFR annual reports and working-paper series; Hilary J. Allen, &ldquo;Resurrecting the OFR&rdquo; (J. Corp. Law); CE-NIF Senate testimony (2010); Federal News Network, Government Executive &amp; GARP reporting on the 2025&ndash;26 reductions; individual CVs and publisher records. Staffing figures: 196 (2024) &rarr; ~100 (2025) &rarr; 70 (planned, FY2026); budget $110M less ~23%; no Senate-confirmed director since February 2022. Details worth re-verifying before citing formally are the precise pre-2017 staffing peak and Flood&rsquo;s and Mendelowitz&rsquo;s doctoral institutions.</p>
  </footer>
</div>
</div>
`
