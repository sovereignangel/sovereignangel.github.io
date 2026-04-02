'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'

// Operate archived tabs
import ExecutionView from '@/components/thesis/execution/ExecutionView'
import VenturesPipeline from '@/components/thesis/ventures/VenturesPipeline'
import VentureDetail from '@/components/thesis/ventures/VentureDetail'
import VenturesIdeas from '@/components/thesis/ventures/VenturesIdeas'
import VenturesDial from '@/components/thesis/ventures/VenturesDial'
import ResearchNorthStarView from '@/components/thesis/boardroom/ResearchNorthStarView'

// RL archived tabs
import TransitionsView from '@/components/thesis/rl/TransitionsView'
import PolicyView from '@/components/thesis/rl/PolicyView'
import AuditView from '@/components/thesis/rl/AuditView'
import ValueView from '@/components/thesis/rl/ValueView'
import CalibrationView from '@/components/thesis/rl/CalibrationView'
import GovernanceLedger from '@/components/thesis/rl/GovernanceLedger'
import RLStatusDial from '@/components/thesis/rl/RLStatusDial'

// Quant archived tabs
import QuantLabView from '@/components/thesis/quant/QuantLabView'
import SurfaceAreaView from '@/components/thesis/quant/SurfaceAreaView'
import QuantDial from '@/components/thesis/quant/QuantDial'

// Alpha archived tabs
import MarketThesisView from '@/components/thesis/boardroom/MarketThesisView'
import AlphaFeedView from '@/components/thesis/alpha/AlphaFeedView'
import AlphaThesesView from '@/components/thesis/alpha/AlphaThesesView'
import AlphaLabView from '@/components/thesis/alpha/AlphaLabView'
import AlphaTrackerView from '@/components/thesis/alpha/AlphaTrackerView'
import AlphaDial from '@/components/thesis/alpha/AlphaDial'
import { getSignals, getHypotheses, saveSignal } from '@/lib/firestore'

// Intelligence archived tabs
import PillarBriefCard from '@/components/thesis/intelligence/PillarBriefCard'
import PillarResearchFeed from '@/components/thesis/intelligence/PillarResearchFeed'
import IntelligenceGauge from '@/components/thesis/intelligence/IntelligenceGauge'
import CRMView from '@/components/thesis/crm/CRMView'
import PaperQueueView from '@/components/thesis/intelligence/PaperQueueView'
import SemanticSearch from '@/components/thesis/search/SemanticSearch'

type AlphaSubTab = 'thesis' | 'feed' | 'theses' | 'lab' | 'tracker'
import type { ThesisPillarExtended } from '@/lib/types/pillar-brief'
import type { SignalType } from '@/lib/types'

type ArchiveSection = 'execute' | 'ventures' | 'quant' | 'rl' | 'research' | 'alpha' | 'intelligence'
type RLSubTab = 'transitions' | 'policy' | 'audit'
type QuantSubTab = 'lab' | 'surface'
type VenturesSubTab = 'pipeline' | 'ideas' | 'detail'
type IntelSubTab = 'briefing' | 'signals' | 'papers' | 'network' | 'search'

const PILLARS: Array<{ key: ThesisPillarExtended; label: string }> = [
  { key: 'ai', label: 'AI' },
  { key: 'markets', label: 'Markets' },
  { key: 'mind', label: 'Mind' },
  { key: 'emergence', label: 'Emergence' },
]

const SIGNAL_TYPES: { value: SignalType; label: string }[] = [
  { value: 'arbitrage', label: 'Arb' },
  { value: 'problem', label: 'Prob' },
  { value: 'market', label: 'Mkt' },
  { value: 'research', label: 'Res' },
]

function ArchiveContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get('section')

  const [activeSection, setActiveSection] = useState<ArchiveSection>(
    (sectionParam as ArchiveSection) || 'execute'
  )

  // RL state
  const [rlSubTab, setRlSubTab] = useState<RLSubTab>('transitions')

  // Quant state
  const [quantSubTab, setQuantSubTab] = useState<QuantSubTab>('lab')

  // Ventures state
  const [venturesSubTab, setVenturesSubTab] = useState<VenturesSubTab>('pipeline')
  const [selectedVentureId, setSelectedVentureId] = useState<string | null>(null)

  // Alpha state
  const [alphaSubTab, setAlphaSubTab] = useState<AlphaSubTab>('thesis')
  const [signalCount, setSignalCount] = useState(0)
  const [thesisCount, setThesisCount] = useState(0)

  const refreshAlphaCounts = useCallback(async () => {
    if (!user?.uid) return
    const [signals, hypotheses] = await Promise.all([
      getSignals(user.uid),
      getHypotheses(user.uid),
    ])
    setSignalCount(signals.filter(s => s.status !== 'archived').length)
    setThesisCount(hypotheses.length)
  }, [user?.uid])

  useEffect(() => {
    if (activeSection === 'alpha') refreshAlphaCounts()
  }, [activeSection, refreshAlphaCounts])

  // Intelligence state
  const [intelSubTab, setIntelSubTab] = useState<IntelSubTab>('briefing')
  const [activePillar, setActivePillar] = useState<ThesisPillarExtended>('ai')
  const [signalTitle, setSignalTitle] = useState('')
  const [signalType, setSignalType] = useState<SignalType>('arbitrage')
  const [signalDesc, setSignalDesc] = useState('')
  const [signalSaving, setSignalSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSaveSignal = useCallback(async () => {
    if (!user || !signalTitle.trim()) return
    setSignalSaving(true)
    await saveSignal(user.uid, {
      title: signalTitle.trim(),
      signalType,
      description: signalDesc.trim(),
    })
    setSignalTitle('')
    setSignalDesc('')
    setSignalSaving(false)
    setRefreshKey(k => k + 1)
  }, [user, signalTitle, signalType, signalDesc])

  const handleSelectVenture = (id: string) => {
    setSelectedVentureId(id)
    setVenturesSubTab('detail')
  }

  const isAlphaThesis = activeSection === 'alpha' && alphaSubTab === 'thesis'
  const hasSidebar = activeSection === 'ventures' || activeSection === 'rl' || activeSection === 'quant' || (activeSection === 'alpha' && !isAlphaThesis)

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rule shrink-0 pb-1">
        <div className="flex items-center gap-2">
          <Link
            href="/thesis/operate"
            className="font-mono text-[10px] text-ink-muted hover:text-ink no-underline transition-colors"
          >
            &larr; Back
          </Link>
          <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
            Archive
          </h2>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-rule shrink-0 mt-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {([
          { key: 'execute' as const, label: 'Execute' },
          { key: 'ventures' as const, label: 'Ventures' },
          { key: 'quant' as const, label: 'Quant' },
          { key: 'rl' as const, label: 'RL' },
          { key: 'research' as const, label: 'Research' },
          { key: 'alpha' as const, label: 'Alpha' },
          { key: 'intelligence' as const, label: 'Intelligence' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`font-serif text-[13px] font-medium px-3 py-1.5 transition-colors whitespace-nowrap ${
              activeSection === tab.key
                ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={`flex-1 min-h-0 ${
        hasSidebar ? 'grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3' : ''
      }`}>
        {/* Execute */}
        {activeSection === 'execute' && (
          <div className="overflow-y-auto">
            <ExecutionView />
          </div>
        )}

        {/* Ventures */}
        {activeSection === 'ventures' && (
          <>
            <div className="flex flex-col gap-1 min-h-0">
              <div className="flex gap-1 border-b border-rule shrink-0 mt-1">
                {([
                  { key: 'pipeline' as const, label: 'Pipeline' },
                  { key: 'ideas' as const, label: 'Ideas' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setVenturesSubTab(tab.key)}
                    className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
                      venturesSubTab === tab.key || (venturesSubTab === 'detail' && tab.key === 'pipeline')
                        ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {venturesSubTab === 'detail' && (
                  <span className="font-serif text-[11px] font-semibold px-2 py-1 text-burgundy border-b-2 border-burgundy -mb-px">
                    Detail
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {venturesSubTab === 'pipeline' && <VenturesPipeline onSelectVenture={handleSelectVenture} />}
                {venturesSubTab === 'ideas' && <VenturesIdeas onSelectVenture={handleSelectVenture} />}
                {venturesSubTab === 'detail' && selectedVentureId && (
                  <VentureDetail ventureId={selectedVentureId} onBack={() => setVenturesSubTab('pipeline')} />
                )}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <VenturesDial selectedVentureId={selectedVentureId} />
            </div>
          </>
        )}

        {/* Quant (Research Lab + Surface Area only) */}
        {activeSection === 'quant' && (
          <>
            <div className="flex flex-col min-h-0">
              <div className="flex gap-1 border-b border-rule-light shrink-0 mt-1">
                {([
                  { key: 'lab' as const, label: 'Research Lab' },
                  { key: 'surface' as const, label: 'Surface Area' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setQuantSubTab(tab.key)}
                    className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
                      quantSubTab === tab.key
                        ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {quantSubTab === 'lab' && <QuantLabView />}
                {quantSubTab === 'surface' && <SurfaceAreaView />}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <QuantDial />
            </div>
          </>
        )}

        {/* RL (Transitions, Policy, Audit) */}
        {activeSection === 'rl' && (
          <>
            <div className="flex flex-col min-h-0">
              <div className="flex gap-1 border-b border-rule-light shrink-0 mt-1">
                {([
                  { key: 'transitions' as const, label: 'Transitions' },
                  { key: 'policy' as const, label: 'Policy' },
                  { key: 'audit' as const, label: 'Audit' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setRlSubTab(tab.key)}
                    className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
                      rlSubTab === tab.key
                        ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {rlSubTab === 'transitions' && <TransitionsView />}
                {rlSubTab === 'policy' && <PolicyView />}
                {rlSubTab === 'audit' && (
                  <div className="space-y-3 py-1">
                    <AuditView />
                    <ValueView />
                    <CalibrationView />
                    <GovernanceLedger />
                  </div>
                )}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <RLStatusDial />
            </div>
          </>
        )}

        {/* Research */}
        {activeSection === 'research' && (
          <div className="overflow-y-auto">
            <ResearchNorthStarView />
          </div>
        )}

        {/* Alpha */}
        {activeSection === 'alpha' && (
          <>
            <div className="flex flex-col min-h-0">
              <div className="flex gap-1 border-b border-rule-light shrink-0 mt-1">
                {([
                  { key: 'thesis' as const, label: 'Thesis' },
                  { key: 'feed' as const, label: 'Feed' },
                  { key: 'theses' as const, label: 'Theses' },
                  { key: 'lab' as const, label: 'Lab' },
                  { key: 'tracker' as const, label: 'Tracker' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setAlphaSubTab(tab.key)}
                    className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
                      alphaSubTab === tab.key
                        ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {alphaSubTab === 'thesis' && <MarketThesisView />}
                {alphaSubTab === 'feed' && <AlphaFeedView />}
                {alphaSubTab === 'theses' && <AlphaThesesView onExperimentCreated={refreshAlphaCounts} />}
                {alphaSubTab === 'lab' && <AlphaLabView />}
                {alphaSubTab === 'tracker' && <AlphaTrackerView />}
              </div>
            </div>
            {!isAlphaThesis && (
              <div className="min-h-0 overflow-y-auto">
                <AlphaDial signalCount={signalCount} thesisCount={thesisCount} />
              </div>
            )}
          </>
        )}

        {/* Intelligence */}
        {activeSection === 'intelligence' && (
          <div className="flex flex-col min-h-0 overflow-y-auto">
            <div className="flex items-center gap-4 border-b border-rule shrink-0 mt-1 pb-1">
              {([
                { key: 'briefing' as const, label: 'Briefing' },
                { key: 'signals' as const, label: 'Signals' },
                { key: 'papers' as const, label: 'Papers' },
                { key: 'network' as const, label: 'Network' },
                { key: 'search' as const, label: 'Search' },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setIntelSubTab(t.key)}
                  className={`font-serif text-[13px] py-1 transition-colors ${
                    intelSubTab === t.key
                      ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {intelSubTab === 'briefing' && (
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {PILLARS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setActivePillar(p.key)}
                        className={`font-serif text-[11px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                          activePillar === p.key
                            ? 'bg-burgundy text-paper border-burgundy'
                            : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <PillarBriefCard pillar={activePillar} />
                  <PillarResearchFeed pillar={activePillar} />
                </div>
              )}
              {intelSubTab === 'signals' && (
                <div className="space-y-3">
                  <div className="bg-white border border-rule rounded-sm p-3">
                    <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule">
                      Capture Signal
                    </div>
                    <div className="flex gap-1 mb-2">
                      {SIGNAL_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setSignalType(type.value)}
                          className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                            signalType === type.value
                              ? 'bg-burgundy text-paper border-burgundy'
                              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={signalTitle}
                        onChange={(e) => setSignalTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveSignal()}
                        className="flex-1 font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                        placeholder="What did you notice?"
                      />
                      <input
                        type="text"
                        value={signalDesc}
                        onChange={(e) => setSignalDesc(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveSignal()}
                        className="flex-1 font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                        placeholder="Why it matters..."
                      />
                      <button
                        onClick={handleSaveSignal}
                        disabled={signalSaving || !signalTitle.trim()}
                        className="bg-burgundy text-paper font-serif text-[9px] font-semibold rounded-sm px-3 py-1 hover:bg-burgundy/90 transition-colors disabled:opacity-50"
                      >
                        {signalSaving ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                  <IntelligenceGauge refreshKey={refreshKey} />
                </div>
              )}
              {intelSubTab === 'papers' && <PaperQueueView />}
              {intelSubTab === 'network' && <CRMView />}
              {intelSubTab === 'search' && <SemanticSearch />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ArchivePage() {
  return (
    <Suspense fallback={<div className="p-3 font-mono text-[11px] text-ink-muted">Loading archive...</div>}>
      <ArchiveContent />
    </Suspense>
  )
}
