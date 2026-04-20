// Conviction Sprint I — April 7 to May 31, 2026
// Eight weeks to proof of concept

export type SprintItemStatus = 'not_started' | 'in_progress' | 'complete'

export type SprintDomainKey = 'learning' | 'armstrong' | 'alamo' | 'social'

export interface SprintItem {
  id: string
  text: string
}

export interface SprintDomain {
  key: SprintDomainKey
  title: string
  items: SprintItem[]
}

export interface SprintWeek {
  id: string
  label: string
  dates: string
  location: string
  subtitle: string
  domains: SprintDomain[]
}

export const SPRINT_DOMAIN_META: Record<SprintDomainKey, { label: string; color: string; bg: string; border: string }> = {
  learning:  { label: 'Learning',     color: 'text-amber-ink',  bg: 'bg-amber-bg',   border: 'border-amber-ink/20' },
  armstrong: { label: 'Armstrong',    color: 'text-burgundy',   bg: 'bg-burgundy-bg', border: 'border-burgundy/20' },
  alamo:     { label: 'Alamo Bernal', color: 'text-red-ink',    bg: 'bg-red-ink/5',  border: 'border-red-ink/20' },
  social:    { label: 'Social',       color: 'text-ink-muted',  bg: 'bg-cream',      border: 'border-rule' },
}

const wk = (id: string, dn: SprintDomainKey, items: string[]): SprintDomain => ({
  key: dn,
  title: SPRINT_DOMAIN_META[dn].label,
  items: items.map((text, i) => ({ id: `${id}-${dn}-${i + 1}`, text })),
})

export const SPRINT_WEEKS: SprintWeek[] = [
  {
    id: 'w1',
    label: 'Week 1',
    dates: 'Apr 7 — 13',
    location: 'Williamsburg',
    subtitle: 'Foundation & Scope',
    domains: [
      wk('w1', 'learning', [
        'Read: Brian Arthur — Complexity and the Economy (Ch 1–4)',
        'Sutton & Barto Ch 3–4 (MDP foundations — apply to strategy parameterization)',
        'Study Chicago vs MIT trading nuances — document the differences for backtest design',
        'Watch: Cathie Wood ARK Invest thesis on AI economic transformation',
        'Watch: Emad Mostaque interviews on owning vs wielding AI',
      ]),
      wk('w1', 'armstrong', [
        'Define complete backtest scope: data sources, rules, output format',
        "Inventory Dave's expanded DB — what did he buy, what's the schema?",
        'Set up paper trading infrastructure (parallel to live)',
        "Draft backtest decision rules from Dave's trading logic",
        'Establish regime detection framework v0 — what market states matter?',
      ]),
      wk('w1', 'alamo', [
        'Pre-onboarding: review limit order optimization literature',
        "Document Sean's strategy as you understand it — gaps list for Apr 14",
        'Set up audit trail / logging system for LOOE work',
      ]),
      wk('w1', 'social', [
        'Williamsburg farewell week — see core friends intentionally',
        'Brooklyn Track Club run (1–2x)',
        'Pack remaining items for Chinatown move',
      ]),
    ],
  },
  {
    id: 'w2',
    label: 'Week 2',
    dates: 'Apr 14 — 20',
    location: 'Chinatown · Homebrew',
    subtitle: 'Onboarding & Rhythm',
    domains: [
      wk('w2', 'learning', [
        'Brian Arthur — Complexity and the Economy (Ch 5–8)',
        'Sutton & Barto Ch 5–6 (Monte Carlo methods — portfolio simulation)',
        'Research: Santa Fe Institute working papers on agent-based financial models',
        "Identify Michael's research direction — what's the collaboration shape?",
      ]),
      wk('w2', 'armstrong', [
        'Backtest v0.1 running — first pass across 2015–2025 data',
        "Implement Dave's core decision rules as systematic logic",
        'Begin logging paper trades with full state context',
        "Send Dave preliminary signal: 'here's what the data shows so far'",
      ]),
      wk('w2', 'alamo', [
        "AB onboarding — deep dive into Sean's limit order strategy",
        'First week of LOOE work — understand the edge and document it',
        'Identify transferable concepts for Armstrong execution layer',
        'Log all alpha generated from day one',
      ]),
      wk('w2', 'social', [
        'Settle into Homebrew — establish morning routine in new space',
        'Real conversation with neuromorphic computation roommate',
        'Real conversation with quant agent builder roommate',
        'Find Chinatown running route or nearest Track Club meetup',
      ]),
    ],
  },
  {
    id: 'w3',
    label: 'Week 3',
    dates: 'Apr 21 — 27',
    location: 'Chinatown · Homebrew',
    subtitle: 'Backtest Sprint I',
    domains: [
      wk('w3', 'learning', [
        'Brian Arthur — Complexity and the Economy (finish)',
        'Sutton & Barto Ch 7–8 (TD learning — strategy refinement loops)',
        'Read: 2–3 SFI papers on regime detection in financial markets',
        'Draft research question for potential Santa Fe collaboration',
      ]),
      wk('w3', 'armstrong', [
        'Backtest v0.5 — multiple regime scenarios tested',
        'Drawdown analysis across market crashes (2018, 2020, 2022)',
        'Risk parameterization: model 3 different capital allocation approaches',
        'Dave working session — review results, capture his evaluation logic',
      ]),
      wk('w3', 'alamo', [
        'Week 2 of LOOE — first optimization iteration delivered to Sean',
        "Quantify alpha generated: what's the $ impact so far?",
        'Build internal case study of LOOE methodology for portfolio',
      ]),
      wk('w3', 'social', [
        'Host or attend Homebrew community dinner',
        'One intentional meeting with entrepreneur/investor friend',
        'Gym or Track Club 3x minimum this week',
      ]),
    ],
  },
  {
    id: 'w4',
    label: 'Week 4',
    dates: 'Apr 28 — May 4',
    location: 'Chinatown · Homebrew',
    subtitle: 'Backtest Sprint II',
    domains: [
      wk('w4', 'learning', [
        'Sutton & Barto Ch 9–10 (function approximation — scaling strategy)',
        'Deep dive: Cathie Wood vs Emad Mostaque — synthesize your own AI economic thesis',
        'Write 1-page personal thesis: where is the economy going with AI?',
        'Share thesis draft with Dave for alignment conversation',
      ]),
      wk('w4', 'armstrong', [
        'Backtest v1.0 complete — credible results across all regimes',
        'Sharpe ratio, max drawdown, annualized return calculated',
        'Begin one-page performance tearsheet draft',
        'Paper trading: 4 weeks of logged, timestamped decisions',
      ]),
      wk('w4', 'alamo', [
        "LOOE month 1 review with Sean — what's the run rate?",
        'Negotiate: if performance strong, discuss LOOE bonus structure',
        'Assess: is this worth continuing from Europe? Decision by May 15',
      ]),
      wk('w4', 'social', [
        'Plan a meaningful small gathering — test experience design skills',
        'Two revenue/partnership asks this week (logged)',
        'Introduce Homebrew roommates to your investor/entrepreneur circle',
      ]),
    ],
  },
  {
    id: 'w5',
    label: 'Week 5',
    dates: 'May 5 — 11',
    location: 'Chinatown · Homebrew',
    subtitle: 'Tearsheet & Dave Push',
    domains: [
      wk('w5', 'learning', [
        'Sutton & Barto Ch 11–13 (policy gradient — advanced methods)',
        'Read: Marcos López de Prado — Advances in Financial ML (key chapters)',
        "Refine personal AI economic thesis based on Dave's feedback",
        'Reach out to Michael re: Santa Fe research timeline',
      ]),
      wk('w5', 'armstrong', [
        'Performance tearsheet finalized — the artifact Dave shows investors',
        'Fund methodology document v1 (2–3 pages, systematic explanation)',
        "Dave conversation: 'Here are the results. Are you in for entity formation?'",
        'Begin F&F investor list — who are the first 5 people to approach?',
      ]),
      wk('w5', 'alamo', [
        'LOOE month 2 underway — refine optimization approach',
        'Document transferable insights for Armstrong execution',
        'Evaluate: remote-compatible workflow for Europe?',
      ]),
      wk('w5', 'social', [
        'Latent Space dinner #1 or intellectual salon prototype',
        'Two more revenue/partnership asks (logged)',
        'One conversation with a family office contact',
      ]),
    ],
  },
  {
    id: 'w6',
    label: 'Week 6',
    dates: 'May 12 — 18',
    location: 'Chinatown · Homebrew',
    subtitle: 'Entity & Capital',
    domains: [
      wk('w6', 'learning', [
        'Finish Sutton & Barto — synthesis document of key RL concepts applied to finance',
        'SFI complexity economics: identify 1 publishable research angle',
        'Draft outline for public technical writeup (GitHub or Substack)',
      ]),
      wk('w6', 'armstrong', [
        'If Dave committed: begin entity formation (attorney quotes, structure)',
        'If Dave uncommitted: tearsheet goes to 2–3 alternative allocators',
        'Paper trading: 6 weeks logged — halfway to credible track record',
        'Regime detection system v1 — the proprietary evaluation layer',
      ]),
      wk('w6', 'alamo', [
        "LOOE performance assessment — what's the total $ impact?",
        'Sean relationship: is there a path to larger engagement or referrals?',
        'Decision: continue remotely from Europe or pause?',
      ]),
      wk('w6', 'social', [
        'Prioritize entrepreneur & investor friends — 2 intentional dinners',
        'Begin Europe logistics if fund milestones are on track',
        'Burning Man ticket secured if going ($3k budgeted)',
      ]),
    ],
  },
  {
    id: 'w7',
    label: 'Week 7',
    dates: 'May 19 — 25',
    location: 'Chinatown · Homebrew',
    subtitle: 'Consolidation',
    domains: [
      wk('w7', 'learning', [
        'Publish technical writeup — RL applied to systematic trading (Substack or GitHub)',
        'Confirm Santa Fe / London research plan with Michael',
        'Read: one Cathie Wood ARK research report in depth — annotate disagreements',
      ]),
      wk('w7', 'armstrong', [
        'Armstrong automated components running — screener + paper trading + logging',
        'First F&F investor conversation if Dave committed',
        'Backtest + tearsheet + methodology = complete fundraising package',
        'Target: $50k first check by end of June',
      ]),
      wk('w7', 'alamo', [
        'AB month 2 closing — total revenue assessment',
        'If continuing: set up remote workflow for June+',
        'If pausing: clean handoff documentation for Sean',
      ]),
      wk('w7', 'social', [
        'Europe plans finalized — dates, cities, logistics',
        'Farewell gathering with Homebrew community + friends',
        'Sublease extension confirmed for Williamsburg (June+)',
      ]),
    ],
  },
  {
    id: 'w8',
    label: 'Week 8',
    dates: 'May 26 — 31',
    location: 'Chinatown · Homebrew',
    subtitle: 'Sprint Close & Transition',
    domains: [
      wk('w8', 'learning', [
        'Sprint retrospective: what did you learn, what compounds, what to drop?',
        'Summer reading list built — complexity econ + DL foundations for Europe',
        'Research direction for Santa Fe crystallized into 1-page proposal',
      ]),
      wk('w8', 'armstrong', [
        '8 weeks of paper trading logged — the artifact is real',
        'Fund status: Dave committed? Entity formed? First capital?',
        'Armstrong running autonomously enough for Europe travel',
        'Automated strategy monitoring — alerts, not manual checking',
      ]),
      wk('w8', 'alamo', [
        'Month 2 complete — total performance: $5k base + $X LOOE',
        'Relationship with Sean positioned for ongoing or referral value',
      ]),
      wk('w8', 'social', [
        'Sprint celebration — you survived and built something real',
        "Investor/entrepreneur circle: who's coming to Europe?",
        'Midsommar Stockholm logistics if pursuing',
      ]),
    ],
  },
]

// ─── Financials ─────────────────────────────────────────────────────

export const SPRINT_FINANCIALS = {
  income: [
    { label: 'Alamo Bernal base (active)',          amount: '$2,500/mo' },
    { label: 'AB optimization engine (3–5mo dev)',  amount: '$0–10k/mo' },
    { label: 'AB engine maintenance (post-dev)',    amount: '$1,000/mo' },
    { label: 'Armstrong salary (contingent)',       amount: '$12,500/mo' },
    { label: 'Armstrong equity (45% GP)',           amount: 'deferred' },
    { label: 'Williamsburg sublease',               amount: 'covers liability' },
  ],
  burn: [
    { label: 'Chinatown rent',     amount: '$1,360/mo' },
    { label: 'Food + essentials',  amount: '$600/mo' },
    { label: 'Credit cards',       amount: '$400/mo' },
    { label: 'Total burn',         amount: '$2,360/mo', total: true },
  ],
  scenarios: [
    { label: 'Floor (AB base only)',                  net: '+$140/mo',    note: 'Breakeven — alive' },
    { label: 'Dev phase (AB + $3k engine)',           net: '+$3,140/mo',  note: 'Building savings' },
    { label: 'Dev ceiling (AB + $10k engine)',        net: '+$10,140/mo', note: 'Runway extends indefinitely' },
    { label: 'Armstrong closes ($2M raised by May 1)', net: '+$12,640/mo', note: '$150k salary active, AB becomes upside' },
    { label: 'Full stack (Armstrong + AB engine)',    net: '+$22,640/mo', note: 'Salary + engine ceiling; equity compounds' },
  ],
  insight:
    "Three income layers stacking on different timelines. AB base ($2.5k) is live and covers burn. AB optimization engine unlocks $0–10k/mo over the next 3–5 months, then decays to $1k/mo maintenance. Armstrong is the step-function: $150k salary + 45% GP equity if the $2M raise closes by May 1. Constraint shifts from survival → execution speed on the engine → closing the raise.",
}

// ─── North Star ─────────────────────────────────────────────────────

export const NORTH_STAR_BET =
  'Build a systematized, backtested, auditable investment strategy. Raise $5M. Charge 1% management fee. Own the infrastructure. Become the quantitative investment engineer who organizes experiences, studies complexity, and lives fully.'

export const NORTH_STAR_EXIT_CRITERIA = [
  {
    domain: 'Learning',
    outcome:
      'Personal AI economic thesis written and shared with Dave. Sutton & Barto complete. Complexity economics research direction identified for Santa Fe. One technical writeup published.',
  },
  {
    domain: 'Armstrong',
    outcome:
      'Backtest complete with tearsheet. 8 weeks paper trading logged. Dave committed to entity formation. Regime detection v1 running. F&F fundraising package ready.',
  },
  {
    domain: 'Alamo Bernal',
    outcome:
      '$5k+ base earned. LOOE performance quantified and documented. Transferable insights captured for Armstrong. Remote workflow assessed for Europe.',
  },
  {
    domain: 'Social',
    outcome:
      'Entrepreneur & investor circle activated. One intellectual salon or Latent Space dinner hosted. Europe plans locked. Homebrew relationships compounding.',
  },
]

export const NORTH_STAR_IDENTITY =
  "I am a quantitative investment engineer who builds AI-native fund infrastructure, studies complexity economics and reinforcement learning, organizes deeply meaningful experiences, and lives a full and nourishing life. My edge is sitting at the intersection of finance domain expertise, AI building ability, and the speed of the current regime shift. Life's prime objectives are love, the creation and enjoyment of aesthetic experience and knowledge."
