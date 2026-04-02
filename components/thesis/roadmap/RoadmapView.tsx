'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

// ─── Types ──────────────────────────────────────────────────────────────

type Domain = 'complexity' | 'ai' | 'quant' | 'markets' | 'neuro'
type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'
type ItemStatus = 'not_started' | 'in_progress' | 'complete'

interface RoadmapItem {
  id: string
  domain: Domain
  quarter: Quarter
  title: string
  type: 'course' | 'book' | 'project' | 'milestone' | 'paper'
  description: string
  status: ItemStatus
  weekStart?: number   // week within the quarter (1-13)
  weekEnd?: number
}

interface TextbookEntry {
  id: string
  title: string
  author: string
  domain: Domain
  quarter: Quarter
  chaptersTotal: number
  chaptersRead: number
  status: ItemStatus
  url?: string
}

// ─── Constants ──────────────────────────────────────────────────────────

const DOMAINS: { key: Domain; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: 'complexity', label: 'Complexity Econ', color: 'text-burgundy', bgColor: 'bg-burgundy-bg', borderColor: 'border-burgundy/20' },
  { key: 'ai', label: 'AI / RL / DL / Agents', color: 'text-green-ink', bgColor: 'bg-green-bg', borderColor: 'border-green-ink/20' },
  { key: 'quant', label: 'Quant Investing + ML', color: 'text-amber-ink', bgColor: 'bg-amber-bg', borderColor: 'border-amber-ink/20' },
  { key: 'markets', label: 'Markets & Fundamentals', color: 'text-ink', bgColor: 'bg-cream', borderColor: 'border-rule' },
  { key: 'neuro', label: 'Cognitive & Neuro', color: 'text-ink-muted', bgColor: 'bg-cream', borderColor: 'border-rule' },
]

const QUARTERS: { key: Quarter; label: string; months: string }[] = [
  { key: 'Q1', label: 'Q1 Foundations', months: 'Apr \u2013 Jun 2026' },
  { key: 'Q2', label: 'Q2 Integration', months: 'Jul \u2013 Sep 2026' },
  { key: 'Q3', label: 'Q3 Depth + Research', months: 'Oct \u2013 Dec 2026' },
  { key: 'Q4', label: 'Q4 Execution', months: 'Jan \u2013 Mar 2027' },
]

const CAREER_OUTCOMES = [
  { label: 'Full-Stack Hedge Fund', icon: '\u03B1' },
  { label: 'Frontier AI Lab / Startup', icon: '\u2021' },
  { label: 'Complexity Research w/ Farmer', icon: '\u03A9' },
]

const INITIAL_ITEMS: RoadmapItem[] = [
  // ── Q1: Foundations ──
  // Complexity
  { id: 'q1-sfi-mooc', domain: 'complexity', quarter: 'Q1', title: 'SFI Complexity Explorer MOOC', type: 'course', description: 'Introduction to Complexity (6-week async)', status: 'not_started', weekStart: 1, weekEnd: 6 },
  { id: 'q1-farmer-papers', domain: 'complexity', quarter: 'Q1', title: 'Read 5 Farmer papers', type: 'paper', description: 'Agent-based modelling, market ecology, economy as physical science', status: 'not_started', weekStart: 3, weekEnd: 13 },
  // AI
  { id: 'q1-cs231n', domain: 'ai', quarter: 'Q1', title: 'CS231n', type: 'course', description: 'ConvNets, transformers, representation learning', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q1-cs224r', domain: 'ai', quarter: 'Q1', title: 'CS224r', type: 'course', description: 'Deep RL \u2014 policy gradients, model-based RL, multi-agent', status: 'not_started', weekStart: 1, weekEnd: 13 },
  // Quant
  { id: 'q1-macro-signals', domain: 'quant', quarter: 'Q1', title: 'Macro signal pipeline', type: 'project', description: 'Build 3+ signals: yield curve, FX, inflation. Backtest framework.', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q1-pca-factors', domain: 'quant', quarter: 'Q1', title: 'PCA latent factors', type: 'project', description: 'Apply PCA to macro indicator set \u2014 find latent drivers of asset returns', status: 'not_started', weekStart: 8, weekEnd: 13 },
  { id: 'q1-blog-posts', domain: 'quant', quarter: 'Q1', title: '8 blog posts', type: 'milestone', description: 'Weekly research blog: signals, backtesting, time-series, portfolio', status: 'not_started', weekStart: 1, weekEnd: 13 },
  // Markets
  { id: 'q1-dalio', domain: 'markets', quarter: 'Q1', title: 'Economic Machine + Marks', type: 'book', description: 'Dalio economic machine, Howard Marks "The Most Important Thing"', status: 'not_started', weekStart: 1, weekEnd: 8 },
  { id: 'q1-options-greeks', domain: 'markets', quarter: 'Q1', title: 'Option Greeks intuition', type: 'milestone', description: 'Deep understanding of delta, gamma, theta, vega, vol surface basics', status: 'not_started', weekStart: 5, weekEnd: 13 },
  // Neuro
  { id: 'q1-neural-net-synthesis', domain: 'neuro', quarter: 'Q1', title: 'Apply NN to macro data', type: 'project', description: 'CS231n synthesis: MLP on macro signal data vs. linear models', status: 'not_started', weekStart: 8, weekEnd: 13 },

  // ── Q2: Integration ──
  // Complexity
  { id: 'q2-abm-market', domain: 'complexity', quarter: 'Q2', title: 'Build first ABM', type: 'project', description: 'Agent-based market model (Mesa/Python) \u2014 reproduce fat tails', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q2-farmer-email', domain: 'complexity', quarter: 'Q2', title: 'Cold email Farmer group', type: 'milestone', description: 'With: ABM work, RL project, macro research, blog trail', status: 'not_started', weekStart: 10, weekEnd: 13 },
  // AI
  { id: 'q2-cs224r-final', domain: 'ai', quarter: 'Q2', title: 'CS224r final project', type: 'project', description: 'Multi-agent RL market simulation \u2014 Farmer alignment artifact', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q2-agents', domain: 'ai', quarter: 'Q2', title: 'LLM agent systems', type: 'project', description: 'RAG, tool-use, multi-agent coordination patterns', status: 'not_started', weekStart: 6, weekEnd: 13 },
  // Quant
  { id: 'q2-deprado', domain: 'quant', quarter: 'Q2', title: 'de Prado ch. 1\u20138', type: 'book', description: 'Meta-labeling, purged CV, feature importance \u2014 implemented in repo', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q2-ml-backtest', domain: 'quant', quarter: 'Q2', title: 'ML backtesting framework', type: 'project', description: 'Proper ML backtest: walk-forward, combinatorial purged CV', status: 'not_started', weekStart: 3, weekEnd: 13 },
  // Markets
  { id: 'q2-private-credit', domain: 'markets', quarter: 'Q2', title: 'Private credit deep dive', type: 'paper', description: 'Cliffwater research, Ares whitepapers, credit structure', status: 'not_started', weekStart: 1, weekEnd: 8 },
  { id: 'q2-leaps', domain: 'markets', quarter: 'Q2', title: 'LEAPs + vol surface dynamics', type: 'milestone', description: 'Long-dated options strategies, vol term structure', status: 'not_started', weekStart: 5, weekEnd: 13 },
  // Neuro
  { id: 'q2-kahneman', domain: 'neuro', quarter: 'Q2', title: 'Kahneman + predictive processing', type: 'book', description: 'Fast/Slow, active inference intro (Friston)', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q2-active-inference', domain: 'neuro', quarter: 'Q2', title: 'Active inference \u2192 RL bridge', type: 'paper', description: 'Friston active inference tutorials \u2014 ties neuro + RL + complexity', status: 'not_started', weekStart: 6, weekEnd: 13 },

  // ── Q3: Depth + Research ──
  // Complexity
  { id: 'q3-network-finance', domain: 'complexity', quarter: 'Q3', title: 'Network theory in finance', type: 'paper', description: 'Contagion models, Farmer ecology of trading strategies', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q3-sfi-workshop', domain: 'complexity', quarter: 'Q3', title: 'Apply to SFI workshop', type: 'milestone', description: 'SFI summer programs or INET workshop submission', status: 'not_started', weekStart: 1, weekEnd: 6 },
  // AI
  { id: 'q3-ai-agents-prod', domain: 'ai', quarter: 'Q3', title: 'Agentic trading system', type: 'project', description: 'Autonomous research agent: processes macro data, generates trade ideas', status: 'not_started', weekStart: 1, weekEnd: 13 },
  // Quant
  { id: 'q3-portfolio-system', domain: 'quant', quarter: 'Q3', title: 'Full systematic portfolio', type: 'project', description: 'Signal \u2192 allocation \u2192 risk management \u2192 execution pipeline', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q3-research-paper', domain: 'quant', quarter: 'Q3', title: 'Working paper draft', type: 'milestone', description: 'Deep RL agents + market microstructure or complexity regime detection', status: 'not_started', weekStart: 5, weekEnd: 13 },
  // Markets
  { id: 'q3-options-mm', domain: 'markets', quarter: 'Q3', title: 'Options market making models', type: 'book', description: 'Volatility trading strategies, skew dynamics, hedging', status: 'not_started', weekStart: 1, weekEnd: 10 },
  // Neuro
  { id: 'q3-neuroeconomics', domain: 'neuro', quarter: 'Q3', title: 'Neuroeconomics + decision-making', type: 'paper', description: 'Decision-making under uncertainty, embodied cognition', status: 'not_started', weekStart: 1, weekEnd: 10 },

  // ── Q4: Execution ──
  // Complexity
  { id: 'q4-farmer-collab', domain: 'complexity', quarter: 'Q4', title: 'Farmer group engagement', type: 'milestone', description: 'Conference submissions, visiting researcher proposal', status: 'not_started', weekStart: 1, weekEnd: 13 },
  // AI
  { id: 'q4-ai-interview', domain: 'ai', quarter: 'Q4', title: 'AI firm positioning', type: 'milestone', description: 'Portfolio of: CS231n, CS224r, agent systems, multi-agent RL', status: 'not_started', weekStart: 1, weekEnd: 13 },
  // Quant
  { id: 'q4-fund-docs', domain: 'quant', quarter: 'Q4', title: 'Fund strategy document', type: 'milestone', description: 'Legal structure, strategy doc, track record, investor materials', status: 'not_started', weekStart: 1, weekEnd: 10 },
  { id: 'q4-track-record', domain: 'quant', quarter: 'Q4', title: '6+ months track record', type: 'milestone', description: 'Systematic portfolio paper/live trading documented', status: 'not_started', weekStart: 1, weekEnd: 13 },
  { id: 'q4-paper-submit', domain: 'quant', quarter: 'Q4', title: 'Submit paper to arXiv/SSRN', type: 'milestone', description: 'Research paper published or posted', status: 'not_started', weekStart: 5, weekEnd: 10 },
  // Markets
  { id: 'q4-kelly', domain: 'markets', quarter: 'Q4', title: 'Kelly criterion + risk parity', type: 'book', description: 'Advanced position sizing, multi-asset risk budgeting', status: 'not_started', weekStart: 1, weekEnd: 8 },
]

const INITIAL_TEXTBOOKS: TextbookEntry[] = [
  // Tier 1 — Must complete
  { id: 'tb-deprado', title: 'Advances in Financial Machine Learning', author: 'de Prado', domain: 'quant', quarter: 'Q2', chaptersTotal: 20, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-arthur', title: 'Complexity and the Economy', author: 'Arthur', domain: 'complexity', quarter: 'Q1', chaptersTotal: 12, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-sutton', title: 'Reinforcement Learning', author: 'Sutton & Barto', domain: 'ai', quarter: 'Q1', chaptersTotal: 17, chaptersRead: 0, status: 'not_started', url: 'http://incompleteideas.net/book/RLbook2020.pdf' },
  { id: 'tb-goodfellow', title: 'Deep Learning', author: 'Goodfellow et al.', domain: 'ai', quarter: 'Q1', chaptersTotal: 20, chaptersRead: 0, status: 'not_started', url: 'https://www.deeplearningbook.org/' },
  // Tier 2 — High value
  { id: 'tb-sornette', title: 'Why Stock Markets Crash', author: 'Sornette', domain: 'complexity', quarter: 'Q2', chaptersTotal: 14, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-taleb-dh', title: 'Dynamic Hedging', author: 'Taleb', domain: 'markets', quarter: 'Q3', chaptersTotal: 20, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-mitchell', title: 'Complexity: A Guided Tour', author: 'Mitchell', domain: 'complexity', quarter: 'Q1', chaptersTotal: 18, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-bouchaud', title: 'Theory of Financial Risk', author: 'Bouchaud & Potters', domain: 'quant', quarter: 'Q3', chaptersTotal: 15, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-chan', title: 'Quantitative Trading', author: 'Chan', domain: 'quant', quarter: 'Q1', chaptersTotal: 8, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-natenberg', title: 'Option Volatility & Pricing', author: 'Natenberg', domain: 'markets', quarter: 'Q1', chaptersTotal: 22, chaptersRead: 0, status: 'not_started' },
  { id: 'tb-hamilton', title: 'Time Series Analysis', author: 'Hamilton', domain: 'quant', quarter: 'Q2', chaptersTotal: 22, chaptersRead: 0, status: 'not_started' },
]

const STATUS_ICON: Record<ItemStatus, string> = {
  not_started: '\u25CB',
  in_progress: '\u25D0',
  complete: '\u2713',
}

const STATUS_COLOR: Record<ItemStatus, string> = {
  not_started: 'text-ink-faint',
  in_progress: 'text-amber-ink',
  complete: 'text-green-ink',
}

const TYPE_BADGE: Record<string, string> = {
  course: 'text-green-ink bg-green-bg border-green-ink/20',
  book: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  project: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  milestone: 'text-ink bg-cream border-rule',
  paper: 'text-ink-muted bg-cream border-rule',
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getCurrentQuarter(): Quarter {
  const now = new Date()
  const m = now.getMonth() // 0-indexed
  // Apr-Jun = Q1, Jul-Sep = Q2, Oct-Dec = Q3, Jan-Mar = Q4
  if (m >= 3 && m <= 5) return 'Q1'
  if (m >= 6 && m <= 8) return 'Q2'
  if (m >= 9 && m <= 11) return 'Q3'
  return 'Q4'
}

function getCurrentWeekInQuarter(): number {
  const now = new Date()
  const q = getCurrentQuarter()
  const startMonth = q === 'Q1' ? 3 : q === 'Q2' ? 6 : q === 'Q3' ? 9 : 0
  const startYear = q === 'Q4' ? now.getFullYear() : now.getFullYear()
  const start = new Date(startYear, startMonth, 1)
  const diff = now.getTime() - start.getTime()
  return Math.min(13, Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))))
}

// ─── Component ──────────────────────────────────────────────────────────

export default function RoadmapView() {
  const { user } = useAuth()
  const [items, setItems] = useState<RoadmapItem[]>(INITIAL_ITEMS)
  const [textbooks, setTextbooks] = useState<TextbookEntry[]>(INITIAL_TEXTBOOKS)
  const [view, setView] = useState<'gantt' | 'textbooks'>('gantt')
  const [filterDomain, setFilterDomain] = useState<Domain | 'all'>('all')

  const storageKeyItems = user?.uid ? `roadmap-items-${user.uid}` : null
  const storageKeyBooks = user?.uid ? `roadmap-books-${user.uid}` : null

  // Load persisted state
  useEffect(() => {
    if (!storageKeyItems) return
    const saved = localStorage.getItem(storageKeyItems)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { id: string; status: ItemStatus }[]
        setItems(INITIAL_ITEMS.map(item => {
          const s = parsed.find(p => p.id === item.id)
          return s ? { ...item, status: s.status } : item
        }))
      } catch { /* ignore */ }
    }
  }, [storageKeyItems])

  useEffect(() => {
    if (!storageKeyBooks) return
    const saved = localStorage.getItem(storageKeyBooks)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { id: string; chaptersRead: number; status: ItemStatus }[]
        setTextbooks(INITIAL_TEXTBOOKS.map(tb => {
          const s = parsed.find(p => p.id === tb.id)
          return s ? { ...tb, chaptersRead: s.chaptersRead, status: s.status } : tb
        }))
      } catch { /* ignore */ }
    }
  }, [storageKeyBooks])

  const persistItems = useCallback((updated: RoadmapItem[]) => {
    setItems(updated)
    if (storageKeyItems) {
      localStorage.setItem(storageKeyItems, JSON.stringify(updated.map(i => ({ id: i.id, status: i.status }))))
    }
  }, [storageKeyItems])

  const persistBooks = useCallback((updated: TextbookEntry[]) => {
    setTextbooks(updated)
    if (storageKeyBooks) {
      localStorage.setItem(storageKeyBooks, JSON.stringify(updated.map(b => ({ id: b.id, chaptersRead: b.chaptersRead, status: b.status }))))
    }
  }, [storageKeyBooks])

  const cycleStatus = (id: string) => {
    const order: ItemStatus[] = ['not_started', 'in_progress', 'complete']
    const updated = items.map(item => {
      if (item.id !== id) return item
      return { ...item, status: order[(order.indexOf(item.status) + 1) % order.length] }
    })
    persistItems(updated)
  }

  const updateBookChapters = (id: string, delta: number) => {
    const updated = textbooks.map(tb => {
      if (tb.id !== id) return tb
      const next = Math.max(0, Math.min(tb.chaptersTotal, tb.chaptersRead + delta))
      const status: ItemStatus = next === 0 ? 'not_started' : next >= tb.chaptersTotal ? 'complete' : 'in_progress'
      return { ...tb, chaptersRead: next, status }
    })
    persistBooks(updated)
  }

  // Stats
  const currentQ = getCurrentQuarter()
  const currentWeek = getCurrentWeekInQuarter()
  const totalItems = items.length
  const completeItems = items.filter(i => i.status === 'complete').length
  const inProgressItems = items.filter(i => i.status === 'in_progress').length

  // Domain progress
  const domainProgress = DOMAINS.map(d => {
    const domainItems = items.filter(i => i.domain === d.key)
    const done = domainItems.filter(i => i.status === 'complete').length
    return { ...d, total: domainItems.length, done, pct: domainItems.length > 0 ? Math.round((done / domainItems.length) * 100) : 0 }
  })

  // Quarter progress
  const quarterProgress = QUARTERS.map(q => {
    const qItems = items.filter(i => i.quarter === q.key)
    const done = qItems.filter(i => i.status === 'complete').length
    const prog = qItems.filter(i => i.status === 'in_progress').length
    return { ...q, total: qItems.length, done, prog, pct: qItems.length > 0 ? Math.round(((done + prog * 0.3) / qItems.length) * 100) : 0 }
  })

  const filteredItems = filterDomain === 'all' ? items : items.filter(i => i.domain === filterDomain)

  // Lagging detection
  const lagging = items.filter(i => {
    if (i.status === 'complete') return false
    if (i.quarter < currentQ) return true // past quarter, not complete
    if (i.quarter === currentQ && i.weekEnd && i.weekEnd < currentWeek && i.status === 'not_started') return true
    return false
  })

  return (
    <div className="space-y-3 py-2">
      {/* Mission Banner */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-3">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          12-Month Learning Roadmap
        </h3>
        <p className="font-sans text-[10px] text-ink leading-relaxed">
          <strong>Increase surface area for:</strong> Running a full-stack hedge fund
          <span className="text-ink-muted"> | </span>
          Working at a frontier AI lab / startup
          <span className="text-ink-muted"> | </span>
          Complexity economics research with Doyne Farmer
        </p>
        <div className="flex gap-3 mt-1.5">
          {CAREER_OUTCOMES.map(c => (
            <span key={c.label} className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-white text-burgundy border-burgundy/20">
              {c.icon} {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* View toggle + Current position */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['gantt', 'textbooks'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`font-serif text-[11px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                view === v
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {v === 'gantt' ? 'Roadmap' : 'Textbooks'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-muted">
            {currentQ} \u00B7 Week {currentWeek}
          </span>
          <span className="font-mono text-[10px] font-semibold text-ink">
            {completeItems}/{totalItems} items
          </span>
          <span className="font-mono text-[10px] text-amber-ink">
            {inProgressItems} active
          </span>
        </div>
      </div>

      {/* Lagging Alert */}
      {lagging.length > 0 && (
        <div className="bg-amber-bg border border-amber-ink/20 rounded-sm p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-mono text-[10px] font-semibold text-amber-ink">
              {lagging.length} item{lagging.length > 1 ? 's' : ''} lagging
            </span>
          </div>
          <div className="space-y-0.5">
            {lagging.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-1.5">
                <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${
                  DOMAINS.find(d => d.key === item.domain)?.bgColor
                } ${DOMAINS.find(d => d.key === item.domain)?.borderColor}`}>
                  {item.domain}
                </span>
                <span className="font-sans text-[10px] text-ink">{item.title}</span>
                <span className="font-mono text-[8px] text-ink-faint ml-auto">{item.quarter}</span>
              </div>
            ))}
            {lagging.length > 5 && (
              <span className="font-mono text-[8px] text-ink-muted">+{lagging.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {view === 'gantt' ? (
        <>
          {/* Domain progress bars */}
          <div className="bg-white border border-rule rounded-sm p-3">
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
              Domain Progress
            </h4>
            <div className="space-y-1.5">
              {domainProgress.map(d => (
                <button
                  key={d.key}
                  onClick={() => setFilterDomain(filterDomain === d.key ? 'all' : d.key)}
                  className={`w-full flex items-center gap-2 py-0.5 rounded-sm transition-colors ${
                    filterDomain === d.key ? 'bg-cream' : ''
                  }`}
                >
                  <span className={`font-sans text-[10px] w-[120px] text-left ${d.color} ${
                    filterDomain === d.key ? 'font-semibold' : ''
                  }`}>
                    {d.label}
                  </span>
                  <div className="flex-1 h-1.5 bg-cream rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-burgundy rounded-sm transition-all"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-[9px] text-ink-muted w-[40px] text-right">
                    {d.done}/{d.total}
                  </span>
                </button>
              ))}
            </div>
            {filterDomain !== 'all' && (
              <button
                onClick={() => setFilterDomain('all')}
                className="font-serif text-[9px] text-ink-muted mt-1.5 hover:text-ink transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Gantt Chart */}
          <div className="bg-white border border-rule rounded-sm p-3 overflow-x-auto">
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
              Timeline
            </h4>

            {/* Quarter headers */}
            <div className="grid grid-cols-[180px_1fr_1fr_1fr_1fr] gap-0 mb-1">
              <div />
              {quarterProgress.map(q => (
                <div key={q.key} className="text-center border-l border-rule-light px-1">
                  <div className={`font-serif text-[10px] font-semibold ${
                    q.key === currentQ ? 'text-burgundy' : 'text-ink-muted'
                  }`}>
                    {q.label}
                  </div>
                  <div className="font-mono text-[8px] text-ink-faint">{q.months}</div>
                  <div className="h-1 bg-cream rounded-sm overflow-hidden mt-0.5 mx-1">
                    <div
                      className={`h-full rounded-sm transition-all ${q.key === currentQ ? 'bg-burgundy' : 'bg-ink-faint'}`}
                      style={{ width: `${q.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Gantt rows grouped by domain */}
            {DOMAINS.map(domain => {
              const domainItems = filteredItems.filter(i => i.domain === domain.key)
              if (domainItems.length === 0) return null

              return (
                <div key={domain.key} className="mb-2">
                  {/* Domain label */}
                  <div className="grid grid-cols-[180px_1fr_1fr_1fr_1fr] gap-0">
                    <div className={`py-1 pr-2 ${domain.color}`}>
                      <span className="font-serif text-[10px] font-semibold uppercase tracking-[0.3px]">
                        {domain.label}
                      </span>
                    </div>
                    {QUARTERS.map(q => (
                      <div key={q.key} className="border-l border-rule-light" />
                    ))}
                  </div>

                  {/* Items */}
                  {domainItems.map(item => (
                    <div key={item.id} className="grid grid-cols-[180px_1fr_1fr_1fr_1fr] gap-0 group">
                      {/* Item label */}
                      <button
                        onClick={() => cycleStatus(item.id)}
                        className="flex items-center gap-1 py-0.5 pr-1 text-left hover:bg-cream transition-colors"
                      >
                        <span className={`font-mono text-[10px] ${STATUS_COLOR[item.status]}`}>
                          {STATUS_ICON[item.status]}
                        </span>
                        <span className="font-sans text-[10px] text-ink truncate">{item.title}</span>
                        <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${TYPE_BADGE[item.type]}`}>
                          {item.type}
                        </span>
                      </button>

                      {/* Gantt bars */}
                      {QUARTERS.map(q => {
                        const isItemQuarter = item.quarter === q.key
                        const isCurrentQ = q.key === currentQ

                        return (
                          <div key={q.key} className={`border-l border-rule-light relative ${
                            isCurrentQ ? 'bg-burgundy-bg/30' : ''
                          }`}>
                            {isItemQuarter && (
                              <div className="absolute inset-y-0 flex items-center px-0.5" style={{
                                left: `${((item.weekStart || 1) - 1) / 13 * 100}%`,
                                right: `${(1 - (item.weekEnd || 13) / 13) * 100}%`,
                              }}>
                                <div
                                  className={`h-3 rounded-sm w-full transition-colors ${
                                    item.status === 'complete'
                                      ? 'bg-green-ink/40'
                                      : item.status === 'in_progress'
                                        ? 'bg-amber-ink/30'
                                        : 'bg-rule'
                                  }`}
                                  title={item.description}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Current week marker legend */}
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-rule-light">
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 bg-green-ink/40 rounded-sm" />
                <span className="font-mono text-[8px] text-ink-muted">Complete</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 bg-amber-ink/30 rounded-sm" />
                <span className="font-mono text-[8px] text-ink-muted">In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 bg-rule rounded-sm" />
                <span className="font-mono text-[8px] text-ink-muted">Not Started</span>
              </div>
              <span className="font-mono text-[8px] text-ink-faint ml-auto">Click item name to cycle status</span>
            </div>
          </div>

          {/* Quarter Detail Cards */}
          {QUARTERS.map(q => {
            const qItems = filteredItems.filter(i => i.quarter === q.key)
            if (qItems.length === 0) return null
            const isCurrent = q.key === currentQ

            return (
              <div key={q.key} className={`bg-white border rounded-sm p-3 ${
                isCurrent ? 'border-burgundy/30' : 'border-rule'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className={`font-serif text-[11px] font-semibold uppercase tracking-[0.5px] ${
                      isCurrent ? 'text-burgundy' : 'text-ink-muted'
                    }`}>
                      {q.label}
                    </h4>
                    <span className="font-mono text-[9px] text-ink-faint">{q.months}</span>
                  </div>
                  {isCurrent && (
                    <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm bg-burgundy text-paper">
                      Current
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {qItems.map(item => {
                    const domainMeta = DOMAINS.find(d => d.key === item.domain)
                    return (
                      <button
                        key={item.id}
                        onClick={() => cycleStatus(item.id)}
                        className="w-full flex items-start gap-2 py-1 border-b border-rule-light last:border-0 text-left hover:bg-cream transition-colors rounded-sm"
                      >
                        <span className={`font-mono text-[10px] mt-0.5 ${STATUS_COLOR[item.status]}`}>
                          {STATUS_ICON[item.status]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-sans text-[10px] text-ink">{item.title}</span>
                            <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${TYPE_BADGE[item.type]}`}>
                              {item.type}
                            </span>
                            <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${domainMeta?.bgColor} ${domainMeta?.borderColor}`}>
                              {item.domain}
                            </span>
                          </div>
                          <p className="font-sans text-[9px] text-ink-muted mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                        {item.weekStart && item.weekEnd && (
                          <span className="font-mono text-[8px] text-ink-faint shrink-0">
                            W{item.weekStart}\u2013{item.weekEnd}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      ) : (
        /* ── Textbooks View ── */
        <div className="space-y-3">
          {/* Overall reading progress */}
          <div className="bg-white border border-rule rounded-sm p-3">
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
              Textbook Progress
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-cream rounded-sm overflow-hidden">
                <div
                  className="h-full bg-burgundy rounded-sm transition-all"
                  style={{ width: `${Math.round(textbooks.reduce((sum, t) => sum + t.chaptersRead, 0) / textbooks.reduce((sum, t) => sum + t.chaptersTotal, 0) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-ink">
                {textbooks.reduce((sum, t) => sum + t.chaptersRead, 0)}/{textbooks.reduce((sum, t) => sum + t.chaptersTotal, 0)} chapters
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-mono text-[9px] text-green-ink">{textbooks.filter(t => t.status === 'complete').length} complete</span>
              <span className="font-mono text-[9px] text-amber-ink">{textbooks.filter(t => t.status === 'in_progress').length} reading</span>
              <span className="font-mono text-[9px] text-ink-faint">{textbooks.filter(t => t.status === 'not_started').length} queued</span>
            </div>
          </div>

          {/* Textbook rows */}
          <div className="bg-white border border-rule rounded-sm">
            {textbooks.map((tb, idx) => {
              const domainMeta = DOMAINS.find(d => d.key === tb.domain)
              const pct = Math.round((tb.chaptersRead / tb.chaptersTotal) * 100)

              const titleEl = tb.url ? (
                <a
                  href={tb.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-serif text-[10px] font-semibold text-burgundy hover:underline"
                >
                  {tb.title}
                </a>
              ) : (
                <span className="font-serif text-[10px] font-semibold text-ink">{tb.title}</span>
              )

              return (
                <div key={tb.id} className={`flex items-center gap-2 px-2 py-1 ${
                  idx < textbooks.length - 1 ? 'border-b border-rule-light' : ''
                }`}>
                  <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainMeta?.bgColor} ${domainMeta?.borderColor}`}>
                    {tb.domain.slice(0, 4)}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    {titleEl}
                    <span className="font-sans text-[9px] text-ink-muted shrink-0">{tb.author}</span>
                  </div>
                  <div className="w-[60px] h-1 bg-cream rounded-sm overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-sm transition-all ${
                        pct >= 100 ? 'bg-green-ink' : pct > 0 ? 'bg-amber-ink' : 'bg-rule'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => updateBookChapters(tb.id, -1)}
                      className="font-mono text-[9px] w-4 h-4 flex items-center justify-center rounded-sm border border-rule text-ink-muted hover:bg-cream transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono text-[9px] text-ink w-[36px] text-center">
                      {tb.chaptersRead}/{tb.chaptersTotal}
                    </span>
                    <button
                      onClick={() => updateBookChapters(tb.id, 1)}
                      className="font-mono text-[9px] w-4 h-4 flex items-center justify-center rounded-sm border border-rule text-ink-muted hover:bg-cream transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-mono text-[8px] text-ink-faint w-[20px] text-right shrink-0">{tb.quarter}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
