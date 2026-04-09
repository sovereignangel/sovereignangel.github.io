/**
 * Shared roadmap data — used by both RoadmapView and weekly plan generation.
 * Source of truth for intellectual curriculum items and textbooks.
 */

export type RoadmapDomain = 'complexity' | 'ai' | 'quant' | 'markets' | 'neuro'
export type RoadmapQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'
export type RoadmapItemStatus = 'not_started' | 'in_progress' | 'complete'

export interface RoadmapItem {
  id: string
  domain: RoadmapDomain
  quarter: RoadmapQuarter
  title: string
  type: 'course' | 'book' | 'project' | 'milestone' | 'paper'
  description: string
  status: RoadmapItemStatus
  weekStart?: number
  weekEnd?: number
}

export interface TextbookEntry {
  id: string
  title: string
  author: string
  domain: RoadmapDomain
  quarter: RoadmapQuarter
  chaptersTotal: number
  chaptersRead: number
  status: RoadmapItemStatus
  url?: string
  /** Subdomain / topic tag for narrower context (e.g., "Portfolio Construction") */
  subdomain?: string
  /** Why this book matters — fed to plan generation so tasks can reference its strategic role */
  notes?: string
  /** Target month label, e.g., "April 2026" — used for grouping in the view */
  targetMonth?: string
}

export const DOMAIN_LABELS: Record<RoadmapDomain, string> = {
  complexity: 'Complexity Econ',
  ai: 'RL / AI / ML',
  quant: 'Quant Investing + ML',
  markets: 'Markets & Fundamentals',
  neuro: 'Cognitive & Neuro',
}

export const QUARTER_META: { key: RoadmapQuarter; label: string; months: string }[] = [
  { key: 'Q1', label: 'Q1 Foundations', months: 'Apr – Jun 2026' },
  { key: 'Q2', label: 'Q2 Integration', months: 'Jul – Sep 2026' },
  { key: 'Q3', label: 'Q3 Depth + Research', months: 'Oct – Dec 2026' },
  { key: 'Q4', label: 'Q4 Execution', months: 'Jan – Mar 2027' },
]

export const INITIAL_ITEMS: RoadmapItem[] = [
  // ── Q1: Foundations ──
  { id: 'q1-sfi-mooc', domain: 'complexity', quarter: 'Q1', title: 'SFI Complexity Explorer MOOC', type: 'course', description: 'Introduction to Complexity (6-week async)', status: 'not_started', weekStart: 1, weekEnd: 6 },
  { id: 'q1-farmer-papers', domain: 'complexity', quarter: 'Q1', title: 'Read 5 Farmer papers', type: 'paper', description: 'Agent-based modelling, market ecology, economy as physical science', status: 'not_started', weekStart: 3, weekEnd: 13 },
  { id: 'q1-cs231n', domain: 'ai', quarter: 'Q1', title: 'CS231n', type: 'course', description: 'ConvNets, transformers, representation learning', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q1-cs224r', domain: 'ai', quarter: 'Q1', title: 'CS224r', type: 'course', description: 'Deep RL — policy gradients, model-based RL, multi-agent', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q1-macro-signals', domain: 'quant', quarter: 'Q1', title: 'Macro signal pipeline', type: 'project', description: 'Build 3+ signals: yield curve, FX, inflation. Backtest framework.', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q1-pca-factors', domain: 'quant', quarter: 'Q1', title: 'PCA latent factors', type: 'project', description: 'Apply PCA to macro indicator set — find latent drivers of asset returns', status: 'not_started', weekStart: 8, weekEnd: 13 },
  { id: 'q1-blog-posts', domain: 'quant', quarter: 'Q1', title: '8 blog posts', type: 'milestone', description: 'Weekly research blog: signals, backtesting, time-series, portfolio', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q1-dalio', domain: 'markets', quarter: 'Q1', title: 'Economic Machine + Marks', type: 'book', description: 'Dalio economic machine, Howard Marks "The Most Important Thing"', status: 'not_started', weekStart: 1, weekEnd: 8 },
  { id: 'q1-options-greeks', domain: 'markets', quarter: 'Q1', title: 'Option Greeks intuition', type: 'milestone', description: 'Deep understanding of delta, gamma, theta, vega, vol surface basics', status: 'not_started', weekStart: 5, weekEnd: 13 },
  { id: 'q1-neural-net-synthesis', domain: 'neuro', quarter: 'Q1', title: 'Apply NN to macro data', type: 'project', description: 'CS231n synthesis: MLP on macro signal data vs. linear models', status: 'not_started', weekStart: 8, weekEnd: 13 },

  // ── Q2: Integration ──
  { id: 'q2-abm-market', domain: 'complexity', quarter: 'Q2', title: 'Build first ABM', type: 'project', description: 'Agent-based market model (Mesa/Python) — reproduce fat tails', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q2-farmer-ralph', domain: 'complexity', quarter: 'Q2', title: 'Deepen Farmer/Ralph research', type: 'milestone', description: 'Via Michael Ralph — build shared research artifacts', status: 'not_started', weekStart: 6, weekEnd: 13 },
  { id: 'q2-cs224r-final', domain: 'ai', quarter: 'Q2', title: 'CS224r final project', type: 'project', description: 'Multi-agent RL market simulation — Farmer alignment artifact', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q2-agents', domain: 'ai', quarter: 'Q2', title: 'LLM agent systems', type: 'project', description: 'RAG, tool-use, multi-agent coordination patterns', status: 'not_started', weekStart: 6, weekEnd: 13 },
  { id: 'q2-deprado', domain: 'quant', quarter: 'Q2', title: 'de Prado ch. 1–8', type: 'book', description: 'Meta-labeling, purged CV, feature importance — implemented in repo', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q2-ml-backtest', domain: 'quant', quarter: 'Q2', title: 'ML backtesting framework', type: 'project', description: 'Proper ML backtest: walk-forward, combinatorial purged CV', status: 'not_started', weekStart: 3, weekEnd: 13 },
  { id: 'q2-private-credit', domain: 'markets', quarter: 'Q2', title: 'Private credit deep dive', type: 'paper', description: 'Cliffwater research, Ares whitepapers, credit structure', status: 'not_started', weekStart: 1, weekEnd: 8 },
  { id: 'q2-leaps', domain: 'markets', quarter: 'Q2', title: 'LEAPs + vol surface dynamics', type: 'milestone', description: 'Long-dated options strategies, vol term structure', status: 'not_started', weekStart: 5, weekEnd: 13 },
  { id: 'q2-kahneman', domain: 'neuro', quarter: 'Q2', title: 'Kahneman + predictive processing', type: 'book', description: 'Fast/Slow, active inference intro (Friston)', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q2-active-inference', domain: 'neuro', quarter: 'Q2', title: 'Active inference → RL bridge', type: 'paper', description: 'Friston active inference tutorials — ties neuro + RL + complexity', status: 'not_started', weekStart: 6, weekEnd: 13 },

  // ── Q3: Depth + Research ──
  { id: 'q3-network-finance', domain: 'complexity', quarter: 'Q3', title: 'Network theory in finance', type: 'paper', description: 'Contagion models, Farmer ecology of trading strategies', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q3-sfi-workshop', domain: 'complexity', quarter: 'Q3', title: 'Apply to SFI workshop', type: 'milestone', description: 'SFI summer programs or INET workshop submission', status: 'not_started', weekStart: 1, weekEnd: 6 },
  { id: 'q3-ai-agents-prod', domain: 'ai', quarter: 'Q3', title: 'Agentic trading system', type: 'project', description: 'Autonomous research agent: processes macro data, generates trade ideas', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q3-portfolio-system', domain: 'quant', quarter: 'Q3', title: 'Full systematic portfolio', type: 'project', description: 'Signal → allocation → risk management → execution pipeline', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q3-research-paper', domain: 'quant', quarter: 'Q3', title: 'Working paper draft', type: 'milestone', description: 'Deep RL agents + market microstructure or complexity regime detection', status: 'not_started', weekStart: 5, weekEnd: 13 },
  { id: 'q3-options-mm', domain: 'markets', quarter: 'Q3', title: 'Options market making models', type: 'book', description: 'Volatility trading strategies, skew dynamics, hedging', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q3-neuroeconomics', domain: 'neuro', quarter: 'Q3', title: 'Neuroeconomics + decision-making', type: 'paper', description: 'Decision-making under uncertainty, embodied cognition', status: 'not_started', weekStart: 1, weekEnd: 10 },

  // ── Q4: Execution ──
  { id: 'q4-farmer-collab', domain: 'complexity', quarter: 'Q4', title: 'Farmer/Ralph collaboration', type: 'milestone', description: 'Joint research output w/ Michael Ralph, conference submissions, SFI engagement', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q4-ai-interview', domain: 'ai', quarter: 'Q4', title: 'AI firm positioning', type: 'milestone', description: 'Portfolio of: CS231n, CS224r, agent systems, multi-agent RL', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q4-fund-docs', domain: 'quant', quarter: 'Q4', title: 'Fund strategy document', type: 'milestone', description: 'Legal structure, strategy doc, track record, investor materials', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q4-track-record', domain: 'quant', quarter: 'Q4', title: '6+ months track record', type: 'milestone', description: 'Systematic portfolio paper/live trading documented', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q4-paper-submit', domain: 'quant', quarter: 'Q4', title: 'Submit paper to arXiv/SSRN', type: 'milestone', description: 'Research paper published or posted', status: 'not_started', weekStart: 5, weekEnd: 10 },
  { id: 'q4-kelly', domain: 'markets', quarter: 'Q4', title: 'Kelly criterion + risk parity', type: 'book', description: 'Advanced position sizing, multi-asset risk budgeting', status: 'not_started', weekStart: 1, weekEnd: 8 },
]

export const INITIAL_TEXTBOOKS: TextbookEntry[] = [
  // ── April 2026 — Q1 ──
  { id: 'tb-grinold-kahn', title: 'Active Portfolio Management', author: 'Grinold & Kahn', domain: 'quant', subdomain: 'Portfolio Construction', quarter: 'Q1', targetMonth: 'April 2026', chaptersTotal: 16, chaptersRead: 0, status: 'not_started', notes: 'Capacity analysis is your flagged skill gap. Gives you the language for the tearsheet and investor conversations. Read first.' },
  { id: 'tb-marks-most-important', title: 'The Most Important Thing', author: 'Howard Marks', domain: 'markets', subdomain: 'Discretionary Investing', quarter: 'Q1', targetMonth: 'April 2026', chaptersTotal: 20, chaptersRead: 0, status: 'not_started', notes: "Maps directly to Dave's second-level thinking and risk intuition. Short, dense, immediately applicable to how you frame Armstrong's edge." },
  { id: 'tb-sutton', title: 'Reinforcement Learning: An Introduction', author: 'Sutton & Barto', domain: 'ai', subdomain: 'ML / RL', quarter: 'Q1', targetMonth: 'April 2026', chaptersTotal: 17, chaptersRead: 0, status: 'not_started', url: 'http://incompleteideas.net/book/RLbook2020.pdf', notes: "Companion to your Stanford RL coursework. Read in parallel with the course — it's the canonical text and you'll reference it for years." },
  { id: 'tb-farmer-chaos', title: 'Making Sense of Chaos', author: 'Doyne Farmer', domain: 'complexity', subdomain: 'Complexity Economics', quarter: 'Q1', targetMonth: 'April 2026', chaptersTotal: 15, chaptersRead: 0, status: 'not_started', notes: 'Lower priority. Reading with Michael Ralph — builds the complexity vocabulary that differentiates your intellectual identity. Good accountability read.' },

  // ── May 2026 — Q1 ──
  { id: 'tb-mcneil-qrm', title: 'Quantitative Risk Management', author: 'McNeil, Frey & Embrechts', domain: 'quant', subdomain: 'Risk Management', quarter: 'Q1', targetMonth: 'May 2026', chaptersTotal: 14, chaptersRead: 0, status: 'not_started', notes: "Drawdown analysis, tail risk, VaR — the quantitative risk vocabulary Dave's backtest scenarios demand. Feeds directly into the tearsheet." },
  { id: 'tb-klarman-margin', title: 'Margin of Safety', author: 'Seth Klarman', domain: 'markets', subdomain: 'Discretionary Investing', quarter: 'Q1', targetMonth: 'May 2026', chaptersTotal: 14, chaptersRead: 0, status: 'not_started', notes: 'The value investing bible for risk-aware discretionary capital allocation. Hard to find physically — PDF circulates. Shapes how you talk about downside protection.' },
  { id: 'tb-kahneman-tfs', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', domain: 'neuro', subdomain: 'Cognitive Science', quarter: 'Q1', targetMonth: 'May 2026', chaptersTotal: 38, chaptersRead: 0, status: 'not_started', notes: "If you haven't read it: foundational for understanding decision biases in trading. If you have: skip and pull a later book forward." },

  // ── June 2026 — Q1 ──
  { id: 'tb-graham-dodd', title: 'Security Analysis', author: 'Graham & Dodd', domain: 'markets', subdomain: 'Fundamentals (Chicago)', quarter: 'Q1', targetMonth: 'June 2026', chaptersTotal: 20, chaptersRead: 0, status: 'not_started', notes: "The canonical text. Don't read cover-to-cover — read sections on margin of safety, earnings analysis, and balance sheet analysis. Gives you credibility language." },
  { id: 'tb-rahl-risk-budget', title: 'Risk Budgeting', author: 'Leslie Rahl', domain: 'quant', subdomain: 'Portfolio Construction', quarter: 'Q1', targetMonth: 'June 2026', chaptersTotal: 18, chaptersRead: 0, status: 'not_started', notes: "Bridges discretionary and systematic risk management. Practical frameworks for how you'll actually allocate across positions in the fund." },

  // ── July 2026 — Q2 ──
  { id: 'tb-soros-alchemy', title: 'The Alchemy of Finance', author: 'George Soros', domain: 'markets', subdomain: 'Macro / Reflexivity', quarter: 'Q2', targetMonth: 'July 2026', chaptersTotal: 14, chaptersRead: 0, status: 'not_started', notes: 'Reflexivity framework connects fundamentals to market dynamics. The macro overlay Dave uses intuitively — Soros formalized it. Essential for regime shift thinking.' },
  { id: 'tb-goodfellow', title: 'Deep Learning', author: 'Goodfellow, Bengio & Courville', domain: 'ai', subdomain: 'ML Foundations', quarter: 'Q2', targetMonth: 'July 2026', chaptersTotal: 20, chaptersRead: 0, status: 'not_started', url: 'https://www.deeplearningbook.org/', notes: 'Your math background absorbs this fast. Gives you the deep learning foundations that make your RL work and agent-building rigorous, not just applied.' },
  { id: 'tb-meadows-systems', title: 'Thinking in Systems', author: 'Donella Meadows', domain: 'complexity', subdomain: 'Systems Dynamics', quarter: 'Q2', targetMonth: 'July 2026', chaptersTotal: 7, chaptersRead: 0, status: 'not_started', notes: 'Short, foundational. Gives you the systems grammar that connects complexity economics to everything else. Read in a weekend.' },

  // ── August 2026 — Q2 ──
  { id: 'tb-arthur', title: 'Complexity and the Economy', author: 'W. Brian Arthur', domain: 'complexity', subdomain: 'Complexity Economics', quarter: 'Q2', targetMonth: 'August 2026', chaptersTotal: 12, chaptersRead: 0, status: 'not_started', notes: "Santa Fe Institute lineage. Arthur is the intellectual ancestor of Farmer's work. Deepens your complexity vocabulary and gives you the theoretical backbone." },
  { id: 'tb-sapolsky-behave', title: 'Behave', author: 'Robert Sapolsky', domain: 'neuro', subdomain: 'Neuroscience', quarter: 'Q2', targetMonth: 'August 2026', chaptersTotal: 17, chaptersRead: 0, status: 'not_started', notes: 'The most comprehensive single volume on human behavior — biology, neuroscience, environment, decision-making. Long but extraordinary. Connects your inner architecture work to hard science.' },
  { id: 'tb-page-model-thinker', title: 'The Model Thinker', author: 'Scott Page', domain: 'complexity', subdomain: 'Multi-Domain Bridge', quarter: 'Q2', targetMonth: 'August 2026', chaptersTotal: 28, chaptersRead: 0, status: 'not_started', notes: 'Multi-model thinking across all your domains. Frameworks for switching between complexity, Bayesian, game-theoretic, and agent-based mental models.' },

  // ── September 2026 — Q2 ──
  { id: 'tb-mackay-info', title: 'Information Theory, Inference & Learning Algorithms', author: 'David MacKay', domain: 'ai', subdomain: 'Math / ML Bridge', quarter: 'Q2', targetMonth: 'September 2026', chaptersTotal: 50, chaptersRead: 0, status: 'not_started', notes: 'The mathematical bridge between information theory, Bayesian reasoning, and ML. Dense but your math background handles it. The book that makes you legit in quant conversations.' },
  { id: 'tb-hohwy-predictive', title: 'Predictive Minds', author: 'Jakob Hohwy', domain: 'neuro', subdomain: 'Computational Neuroscience', quarter: 'Q2', targetMonth: 'September 2026', chaptersTotal: 10, chaptersRead: 0, status: 'not_started', notes: 'Predictive processing / free energy principle — the neuroscience framework that maps directly onto RL and Bayesian inference. Connects your AI work to neuro at the deepest level.' },

  // ── October 2026 — Q3 ──
  { id: 'tb-beinhocker-wealth', title: 'The Origin of Wealth', author: 'Eric Beinhocker', domain: 'complexity', subdomain: 'Complexity Economics', quarter: 'Q3', targetMonth: 'October 2026', chaptersTotal: 19, chaptersRead: 0, status: 'not_started', notes: 'The best bridge between traditional economics and complexity theory. Impressive in investor conversations — very few fund managers think in these terms.' },
  { id: 'tb-russell-norvig', title: 'AI: A Modern Approach', author: 'Russell & Norvig', domain: 'ai', subdomain: 'AI Foundations', quarter: 'Q3', targetMonth: 'October 2026', chaptersTotal: 28, chaptersRead: 0, status: 'not_started', notes: 'The structural backbone of AI. Reference text more than cover-to-cover read. Having it in your vocabulary signals seriousness for research roles.' },

  // ── November 2026 — Q3 ──
  { id: 'tb-barrett-emotions', title: 'How Emotions Are Made', author: 'Lisa Feldman Barrett', domain: 'neuro', subdomain: 'Cognitive Science', quarter: 'Q3', targetMonth: 'November 2026', chaptersTotal: 14, chaptersRead: 0, status: 'not_started', notes: 'Destroys the classical model of emotions. Constructionist view directly relevant to your inner architecture work and understanding yourself as an agent.' },
  { id: 'tb-noise', title: 'Noise', author: 'Kahneman, Sibony & Sunstein', domain: 'neuro', subdomain: 'Decision Science', quarter: 'Q3', targetMonth: 'November 2026', chaptersTotal: 28, chaptersRead: 0, status: 'not_started', notes: 'Decision-making under uncertainty — directly applicable to discretionary trading, fund management, and reducing noise in your own judgment process.' },

  // ── December 2026+ — Q3 ──
  { id: 'tb-doidge-brain', title: 'The Brain That Changes Itself', author: 'Norman Doidge', domain: 'neuro', subdomain: 'Neuroplasticity', quarter: 'Q3', targetMonth: 'December 2026', chaptersTotal: 11, chaptersRead: 0, status: 'not_started', notes: 'Neuroplasticity science connecting to your Hoffman Process experience and the retraining-the-OS frame. Read when the sprint pressure lifts and you have space for reflection.' },

  // ── Pre-existing references (kept for plan continuity) ──
  { id: 'tb-deprado', title: 'Advances in Financial Machine Learning', author: 'de Prado', domain: 'quant', quarter: 'Q2', chaptersTotal: 20, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-sornette', title: 'Why Stock Markets Crash', author: 'Sornette', domain: 'complexity', quarter: 'Q2', chaptersTotal: 14, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-taleb-dh', title: 'Dynamic Hedging', author: 'Taleb', domain: 'markets', quarter: 'Q3', chaptersTotal: 20, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-mitchell', title: 'Complexity: A Guided Tour', author: 'Mitchell', domain: 'complexity', quarter: 'Q1', chaptersTotal: 18, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-bouchaud', title: 'Theory of Financial Risk', author: 'Bouchaud & Potters', domain: 'quant', quarter: 'Q3', chaptersTotal: 15, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-chan', title: 'Quantitative Trading', author: 'Chan', domain: 'quant', quarter: 'Q1', chaptersTotal: 8, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-natenberg', title: 'Option Volatility & Pricing', author: 'Natenberg', domain: 'markets', quarter: 'Q1', chaptersTotal: 22, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-hamilton', title: 'Time Series Analysis', author: 'Hamilton', domain: 'quant', quarter: 'Q2', chaptersTotal: 22, chaptersRead: 0, status: 'not_started' },
]

// ─── Helpers ────────────────────────────────────────────────────────

export function getCurrentQuarter(): RoadmapQuarter {
  const now = new Date()
  const m = now.getMonth()
  if (m >= 3 && m <= 5) return 'Q1'
  if (m >= 6 && m <= 8) return 'Q2'
  if (m >= 9 && m <= 11) return 'Q3'
  return 'Q4'
}

export function getCurrentWeekInQuarter(): number {
  const now = new Date()
  const q = getCurrentQuarter()
  const startMonth = q === 'Q1' ? 3 : q === 'Q2' ? 6 : q === 'Q3' ? 9 : 0
  const start = new Date(now.getFullYear(), startMonth, 1)
  const diff = now.getTime() - start.getTime()
  return Math.min(13, Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))))
}

/** Get active roadmap items for the current quarter and week */
export function getActiveRoadmapItems(items: RoadmapItem[], quarter: RoadmapQuarter, week: number): RoadmapItem[] {
  return items.filter(i =>
    i.quarter === quarter &&
    i.status !== 'complete' &&
    (i.weekStart || 1) <= week &&
    (i.weekEnd || 13) >= week
  )
}

/** Get active textbooks for the current quarter */
export function getActiveTextbooks(textbooks: TextbookEntry[], quarter: RoadmapQuarter): TextbookEntry[] {
  return textbooks.filter(t => t.quarter === quarter && t.status !== 'complete')
}

/** Build roadmap context for plan generation */
export function buildRoadmapContext(
  items: RoadmapItem[],
  textbooks: TextbookEntry[],
): import('./weekly-plan-ai').RoadmapContext {
  const quarter = getCurrentQuarter()
  const week = getCurrentWeekInQuarter()
  const qMeta = QUARTER_META.find(q => q.key === quarter)

  return {
    currentQuarter: qMeta ? `${qMeta.label} (${qMeta.months})` : quarter,
    currentWeekInQuarter: week,
    activeItems: getActiveRoadmapItems(items, quarter, week).map(i => ({
      title: i.title,
      domain: DOMAIN_LABELS[i.domain],
      type: i.type,
      description: i.description,
      status: i.status,
    })),
    activeTextbooks: getActiveTextbooks(textbooks, quarter).map(t => ({
      title: t.title,
      author: t.author,
      domain: DOMAIN_LABELS[t.domain],
      subdomain: t.subdomain,
      chaptersTotal: t.chaptersTotal,
      chaptersRead: t.chaptersRead,
      status: t.status,
      notes: t.notes,
      targetMonth: t.targetMonth,
    })),
  }
}
