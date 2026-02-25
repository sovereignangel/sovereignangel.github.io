'use client'

import { useState, useEffect } from 'react'
import { useMarketThesis } from '@/hooks/useMarketThesis'
import type { MarketCompany, MarketInvestor, MarketSector, MarketBelief, MarketSignal } from '@/lib/types'

// ── Hardcoded Market Data ──

const SECTOR_LABELS: Record<MarketSector, string> = {
  bci_neural: 'BCI & Neural Interfaces',
  biofeedback_wearables: 'Biofeedback & Wearables',
  digital_wellness: 'Digital Wellness',
  psychedelics_therapy: 'Psychedelics & Therapy',
  presence_tech: 'Presence Tech',
  embodied_ai: 'Embodied AI',
  consciousness_research: 'Consciousness Research',
}

const COMPANIES: MarketCompany[] = [
  // BCI & Neural
  { name: 'Neuralink', sector: 'bci_neural', stage: 'growth', funding: '$363M', founders: 'Elon Musk', whyWatch: 'First human BCI implants — sets regulatory and consumer precedent' },
  { name: 'Synchron', sector: 'bci_neural', stage: 'series_b', funding: '$145M', founders: 'Tom Oxley', whyWatch: 'Endovascular BCI — less invasive than Neuralink, further in FDA pipeline' },
  { name: 'Kernel', sector: 'bci_neural', stage: 'series_b', funding: '$107M', founders: 'Bryan Johnson', whyWatch: 'Non-invasive neuroimaging at scale — helmet-form-factor fNIRS' },
  { name: 'Neurable', sector: 'bci_neural', stage: 'series_a', funding: '$16M', whyWatch: 'BCI in everyday headphones — focus tracking for knowledge workers' },
  { name: 'Paradromics', sector: 'bci_neural', stage: 'series_a', funding: '$37M', whyWatch: 'High-bandwidth BCI with modular data architecture' },

  // Biofeedback & Wearables
  { name: 'Oura', sector: 'biofeedback_wearables', stage: 'growth', funding: '$300M+', whyWatch: 'Sleep & readiness ring — consumer health data at massive scale' },
  { name: 'Whoop', sector: 'biofeedback_wearables', stage: 'growth', funding: '$400M+', whyWatch: 'Strain & recovery — premium subscription model in wearables' },
  { name: 'Muse (InteraXon)', sector: 'biofeedback_wearables', stage: 'series_b', funding: '$30M', whyWatch: 'Consumer EEG headband — neurofeedback meditation device' },
  { name: 'Apollo Neuro', sector: 'biofeedback_wearables', stage: 'series_a', funding: '$15M', whyWatch: 'Haptic nervous system regulation — vibration-based stress relief' },

  // Digital Wellness
  { name: 'Calm', sector: 'digital_wellness', stage: 'growth', funding: '$218M', whyWatch: 'Category leader in meditation/sleep — $2B+ valuation' },
  { name: 'Headspace', sector: 'digital_wellness', stage: 'growth', funding: '$215M', whyWatch: 'Merged with Ginger — clinical-grade mental health + meditation' },
  { name: 'Waking Up', sector: 'digital_wellness', stage: 'growth', founders: 'Sam Harris', whyWatch: 'Intellectual approach to contemplative practice — high-intent audience' },

  // Psychedelics & Therapy
  { name: 'Compass Pathways', sector: 'psychedelics_therapy', stage: 'public', funding: 'NASDAQ: CMPS', whyWatch: 'Psilocybin therapy for treatment-resistant depression — Phase IIb' },
  { name: 'Atai Life Sciences', sector: 'psychedelics_therapy', stage: 'public', funding: 'NASDAQ: ATAI', whyWatch: 'Portfolio approach to psychedelic medicine — multiple compounds' },
  { name: 'MAPS/Lykos', sector: 'psychedelics_therapy', stage: 'growth', whyWatch: 'MDMA-assisted therapy — pioneered FDA breakthrough designation' },

  // Presence Tech
  { name: 'Light Phone', sector: 'presence_tech', stage: 'series_a', funding: '$12M', whyWatch: 'Anti-smartphone — deliberate disconnection as product category' },
  { name: 'Opal', sector: 'presence_tech', stage: 'seed', whyWatch: 'Screen time management for focus — system-level blocking' },
  { name: 'Yondr', sector: 'presence_tech', stage: 'series_a', whyWatch: 'Phone-free spaces at scale — events, schools, workplaces' },
  { name: 'Brick', sector: 'presence_tech', stage: 'seed', whyWatch: 'Physical device to block phone — NFC-based app control' },

  // Embodied AI
  { name: 'Humane', sector: 'embodied_ai', stage: 'growth', funding: '$230M', whyWatch: 'AI Pin — ambient computing without screen addiction' },
  { name: 'Rewind AI', sector: 'embodied_ai', stage: 'series_a', funding: '$35M', whyWatch: 'Personal AI memory — augmenting human recall, not replacing it' },
  { name: 'Tab', sector: 'embodied_ai', stage: 'seed', founders: 'Avi Schiffmann', whyWatch: 'AI wearable for contextual memory — friend-as-interface' },

  // Consciousness Research
  { name: 'Allen Institute', sector: 'consciousness_research', stage: 'growth', whyWatch: 'Brain cell atlas + neural dynamics — fundamental neuroscience infrastructure' },
  { name: 'Templeton Foundation', sector: 'consciousness_research', stage: 'growth', whyWatch: 'Funds consciousness research — Integrated Information Theory vs Global Workspace' },
  { name: 'Santa Fe Institute', sector: 'consciousness_research', stage: 'growth', whyWatch: 'Complexity science + consciousness — David Krakauer, cognitive artifacts' },
]

const INVESTORS: MarketInvestor[] = [
  { name: 'Vinod Khosla', firm: 'Khosla Ventures', focus: 'Deep tech, health tech, future-of-humanity bets', notableDeals: ['Neurable', 'Headspace', 'Forward Health'] },
  { name: 'Peter Thiel', firm: 'Founders Fund', focus: 'Contrarian frontier tech, life extension, BCI', notableDeals: ['Neuralink', 'Compass Pathways', 'Synchron'] },
  { name: 'Josh Wolfe', firm: 'Lux Capital', focus: 'Science fiction → science fact', notableDeals: ['Kernel', 'Synchron', 'Evolved'] },
  { name: 'Robert Nelsen', firm: 'ARCH Venture', focus: 'Biotech/neurotech at the earliest stage', notableDeals: ['Neuralink', 'Compass Pathways', 'Atai'] },
  { name: 'Hemant Taneja', firm: 'General Catalyst', focus: 'Responsible tech, digital wellness', notableDeals: ['Calm', 'Oura', 'Spring Health'] },
  { name: 'Jeff Bezos', firm: 'Bezos Expeditions', focus: 'Big swings — longevity, neural, space', notableDeals: ['Synchron', 'Unity Biotechnology'] },
  { name: 'Bill Maris', firm: 'GV / Section 32', focus: 'Neuroscience-first, aging, consciousness', notableDeals: ['Kernel', 'Paradromics'] },
  { name: 'Vijay Pande', firm: 'a16z Bio', focus: 'Computational bio & digital therapeutics', notableDeals: ['Headspace/Ginger', 'Freenome', 'insitro'] },
]

const MARKET_SIZING = [
  { label: 'Wellness Tech', current: '$57.1B', projected: '$208.4B by 2035' },
  { label: 'BCI Funding', current: '$3.74B', projected: 'Accelerating post-Neuralink' },
  { label: 'Digital Therapeutics', current: '$5.8B', projected: '$26.4B by 2030' },
  { label: 'Neurotechnology', current: '$13.3B', projected: '$38.2B by 2030' },
]

const BELIEF_CATEGORIES = ['macro', 'sector', 'technology', 'timing'] as const
const CATEGORY_COLORS: Record<string, string> = {
  macro: 'text-burgundy border-burgundy/20 bg-burgundy-bg',
  sector: 'text-green-ink border-green-ink/20 bg-green-bg',
  technology: 'text-amber-ink border-amber-ink/20 bg-amber-bg',
  timing: 'text-ink border-rule bg-paper',
}

const STAGE_LABELS: Record<string, string> = {
  seed: 'Seed',
  series_a: 'A',
  series_b: 'B',
  growth: 'Growth',
  public: 'Public',
}

// ── Component ──

export default function MarketThesisView() {
  const {
    state,
    loading,
    updateThesisStatement,
    addBelief,
    updateBelief,
    removeBelief,
    addObservation,
  } = useMarketThesis()

  const [expandedSectors, setExpandedSectors] = useState<Set<MarketSector>>(new Set(['bci_neural']))
  const [showAddBelief, setShowAddBelief] = useState(false)
  const [newBelief, setNewBelief] = useState({ statement: '', conviction: 60, category: 'macro' as MarketBelief['category'] })
  const [obsInput, setObsInput] = useState('')
  const [obsSignal, setObsSignal] = useState<'bullish' | 'bearish' | 'neutral'>('neutral')
  const [signals, setSignals] = useState<MarketSignal[]>([])
  const [signalsLoading, setSignalsLoading] = useState(true)
  const [editingBelief, setEditingBelief] = useState<string | null>(null)
  const [editConviction, setEditConviction] = useState(50)

  useEffect(() => {
    fetch('/api/market-signals')
      .then(r => r.json())
      .then(data => setSignals(data.signals || []))
      .catch(() => {})
      .finally(() => setSignalsLoading(false))
  }, [])

  function toggleSector(sector: MarketSector) {
    setExpandedSectors(prev => {
      const next = new Set(prev)
      if (next.has(sector)) next.delete(sector)
      else next.add(sector)
      return next
    })
  }

  function handleAddBelief() {
    if (!newBelief.statement.trim()) return
    addBelief({
      statement: newBelief.statement.trim(),
      conviction: newBelief.conviction,
      category: newBelief.category,
      evidence: [],
      counterEvidence: [],
    })
    setNewBelief({ statement: '', conviction: 60, category: 'macro' })
    setShowAddBelief(false)
  }

  function handleAddObservation() {
    if (!obsInput.trim()) return
    addObservation({
      date: new Date().toISOString().slice(0, 10),
      content: obsInput.trim(),
      signal: obsSignal,
    })
    setObsInput('')
    setObsSignal('neutral')
  }

  function convictionColor(c: number): string {
    if (c >= 80) return 'bg-green-ink'
    if (c >= 60) return 'bg-green-ink/60'
    if (c >= 40) return 'bg-amber-ink'
    return 'bg-red-ink/60'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-[11px] text-ink-muted">Loading thesis...</span>
      </div>
    )
  }

  const sectorCompanies = (sector: MarketSector) => COMPANIES.filter(c => c.sector === sector)
  const hiringCompanies = COMPANIES.filter(c => c.hiringExec)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3">

      {/* ── Column 1: Thesis Architecture ── */}
      <div className="space-y-3">

        {/* Core Thesis */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Core Thesis
          </div>
          <textarea
            value={state.thesisStatement}
            onChange={e => updateThesisStatement(e.target.value)}
            placeholder="What is your investment thesis on slow computing / consciousness tech?&#10;&#10;e.g. Technology will bifurcate: mass-market AI optimizes for engagement (attention extraction), while a counter-movement builds tools that expand human agency, presence, and consciousness. The latter is undervalued and will compound as burnout + AI anxiety reach critical mass."
            className="w-full text-[10px] text-ink leading-relaxed bg-paper border border-rule rounded-sm p-2 resize-none min-h-[120px] focus:outline-none focus:border-burgundy/50"
            rows={6}
          />
        </div>

        {/* Beliefs */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Beliefs
            </div>
            <button
              onClick={() => setShowAddBelief(!showAddBelief)}
              className="text-[9px] font-serif font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
            >
              {showAddBelief ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {showAddBelief && (
            <div className="mb-2 p-2 bg-paper border border-rule-light rounded-sm space-y-1.5">
              <input
                value={newBelief.statement}
                onChange={e => setNewBelief(p => ({ ...p, statement: e.target.value }))}
                placeholder="State your belief..."
                className="w-full text-[10px] border border-rule rounded-sm px-2 py-1 bg-white text-ink"
                onKeyDown={e => e.key === 'Enter' && handleAddBelief()}
              />
              <div className="flex items-center gap-2">
                <select
                  value={newBelief.category}
                  onChange={e => setNewBelief(p => ({ ...p, category: e.target.value as MarketBelief['category'] }))}
                  className="text-[9px] border border-rule rounded-sm px-1.5 py-0.5 bg-white text-ink"
                >
                  {BELIEF_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <label className="text-[9px] text-ink-muted">Conviction:</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={newBelief.conviction}
                  onChange={e => setNewBelief(p => ({ ...p, conviction: parseInt(e.target.value) }))}
                  className="flex-1 h-1"
                />
                <span className="text-[9px] font-mono text-ink w-8 text-right">{newBelief.conviction}%</span>
              </div>
              <button
                onClick={handleAddBelief}
                disabled={!newBelief.statement.trim()}
                className="text-[9px] font-serif px-2 py-0.5 bg-burgundy text-paper rounded-sm disabled:opacity-30"
              >
                Save Belief
              </button>
            </div>
          )}

          {state.beliefs.length === 0 ? (
            <div className="text-[9px] text-ink-faint text-center py-3">
              No beliefs encoded yet. Add your first market conviction.
            </div>
          ) : (
            <div className="space-y-1.5">
              {state.beliefs.map(b => (
                <div key={b.id} className="border border-rule-light rounded-sm p-2">
                  <div className="flex items-start gap-1.5">
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${CATEGORY_COLORS[b.category]}`}>
                      {b.category}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-ink leading-tight">{b.statement}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {editingBelief === b.id ? (
                          <>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={editConviction}
                              onChange={e => setEditConviction(parseInt(e.target.value))}
                              className="flex-1 h-1"
                            />
                            <span className="text-[9px] font-mono text-ink w-8 text-right">{editConviction}%</span>
                            <button
                              onClick={() => {
                                updateBelief(b.id, { conviction: editConviction })
                                setEditingBelief(null)
                              }}
                              className="text-[8px] px-1 py-0.5 bg-burgundy text-paper rounded-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingBelief(null)}
                              className="text-[8px] text-ink-faint hover:text-ink px-1"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 bg-paper rounded-sm h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-sm transition-all ${convictionColor(b.conviction)}`}
                                style={{ width: `${b.conviction}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-ink-muted w-8 text-right">{b.conviction}%</span>
                            <button
                              onClick={() => {
                                setEditingBelief(b.id)
                                setEditConviction(b.conviction)
                              }}
                              className="text-[8px] text-ink-muted hover:text-ink"
                            >
                              edit
                            </button>
                            <button
                              onClick={() => removeBelief(b.id)}
                              className="text-[8px] text-ink-faint hover:text-red-ink"
                            >
                              remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {b.counterEvidence.length > 0 && (
                    <div className="mt-1 pl-6">
                      {b.counterEvidence.map((ce, i) => (
                        <div key={i} className="text-[9px] text-red-ink/70 italic">— {ce}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Column 2: Market Map ── */}
      <div className="space-y-3">

        {/* Sector Map */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Market Map
          </div>

          <div className="space-y-1">
            {(Object.keys(SECTOR_LABELS) as MarketSector[]).map(sector => {
              const companies = sectorCompanies(sector)
              const isExpanded = expandedSectors.has(sector)
              return (
                <div key={sector}>
                  <button
                    onClick={() => toggleSector(sector)}
                    className="w-full flex items-center justify-between text-left py-1 px-1.5 rounded-sm hover:bg-paper transition-colors"
                  >
                    <span className="font-serif text-[11px] font-medium text-ink">
                      {SECTOR_LABELS[sector]}
                    </span>
                    <span className="text-[9px] font-mono text-ink-muted">
                      {companies.length} {isExpanded ? '▾' : '▸'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="pl-2 pb-1 space-y-1">
                      {companies.map(c => (
                        <div key={c.name} className="border border-rule-light rounded-sm p-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-ink">{c.name}</span>
                            <span className="font-mono text-[8px] px-1 py-0.5 rounded-sm border border-rule text-ink-muted">
                              {STAGE_LABELS[c.stage]}
                            </span>
                            {c.funding && (
                              <span className="text-[8px] font-mono text-green-ink">{c.funding}</span>
                            )}
                            {c.hiringExec && (
                              <span className="text-[8px] px-1 py-0.5 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20">
                                Hiring
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-ink-muted mt-0.5 leading-tight">{c.whyWatch}</div>
                          {c.founders && (
                            <div className="text-[8px] text-ink-faint mt-0.5">Founded by {c.founders}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Key Investors */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Key Investors
          </div>
          <div className="space-y-1.5">
            {INVESTORS.map(inv => (
              <div key={inv.name} className="border-l-2 border-burgundy/20 pl-2 py-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-ink">{inv.name}</span>
                  <span className="text-[9px] text-ink-muted">— {inv.firm}</span>
                </div>
                <div className="text-[9px] text-ink-muted">{inv.focus}</div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {inv.notableDeals.map(d => (
                    <span key={d} className="font-mono text-[8px] px-1 py-0.5 rounded-sm bg-paper border border-rule-light text-ink-muted">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Sizing */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Market Sizing
          </div>
          <div className="space-y-1">
            {MARKET_SIZING.map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-[10px] text-ink">{m.label}</span>
                <div className="text-right">
                  <span className="text-[10px] font-semibold font-mono text-ink">{m.current}</span>
                  <span className="text-[8px] text-ink-muted ml-1">→ {m.projected}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Column 3: Signal Flow & Opportunities ── */}
      <div className="space-y-3">

        {/* Thesis Journal (Bridgewater Daily Observations) */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Daily Observations
          </div>
          <div className="space-y-1.5">
            <textarea
              value={obsInput}
              onChange={e => setObsInput(e.target.value)}
              placeholder="What did you observe today about consciousness tech markets?"
              className="w-full text-[10px] text-ink bg-paper border border-rule rounded-sm p-2 resize-none focus:outline-none focus:border-burgundy/50"
              rows={3}
            />
            <div className="flex items-center gap-1.5">
              {(['bullish', 'bearish', 'neutral'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setObsSignal(s)}
                  className={`text-[9px] font-serif px-2 py-0.5 rounded-sm border transition-colors ${
                    obsSignal === s
                      ? s === 'bullish' ? 'bg-green-ink text-paper border-green-ink'
                        : s === 'bearish' ? 'bg-red-ink text-paper border-red-ink'
                        : 'bg-ink text-paper border-ink'
                      : 'border-rule text-ink-muted hover:text-ink'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={handleAddObservation}
                disabled={!obsInput.trim()}
                className="text-[9px] font-serif px-2 py-0.5 bg-burgundy text-paper rounded-sm disabled:opacity-30"
              >
                Log
              </button>
            </div>
          </div>

          {state.observations.length > 0 && (
            <div className="mt-2 space-y-1.5 max-h-[240px] overflow-y-auto">
              {state.observations.slice(0, 10).map(obs => (
                <div key={obs.id} className="border-l-2 border-rule-light pl-2 py-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-mono text-ink-muted">{obs.date}</span>
                    {obs.signal && obs.signal !== 'neutral' && (
                      <span className={`text-[8px] font-mono ${obs.signal === 'bullish' ? 'text-green-ink' : 'text-red-ink'}`}>
                        {obs.signal === 'bullish' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-ink leading-tight mt-0.5">{obs.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signal Flow (RSS) */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Signal Flow
          </div>
          {signalsLoading ? (
            <div className="text-[9px] text-ink-faint text-center py-3">Loading signals...</div>
          ) : signals.length === 0 ? (
            <div className="text-[9px] text-ink-faint text-center py-3">
              No consciousness tech signals found in current feed cycle.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {signals.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-rule-light rounded-sm p-1.5 hover:border-burgundy/30 transition-colors"
                >
                  <div className="text-[10px] font-medium text-ink leading-tight">{s.title}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] text-ink-muted">{s.source}</span>
                    {s.date && (
                      <span className="text-[8px] font-mono text-ink-faint">
                        {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  {s.snippet && (
                    <div className="text-[9px] text-ink-muted mt-0.5 line-clamp-2">{s.snippet}</div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Opportunity Radar */}
        {hiringCompanies.length > 0 && (
          <div className="bg-white border border-burgundy/20 rounded-sm p-3">
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-burgundy/20">
              Opportunity Radar
            </div>
            <div className="space-y-1">
              {hiringCompanies.map(c => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-ink">{c.name}</span>
                  <span className="text-[8px] text-ink-muted">({SECTOR_LABELS[c.sector]})</span>
                  <span className="font-mono text-[8px] px-1 py-0.5 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20 ml-auto">
                    Exec role
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
