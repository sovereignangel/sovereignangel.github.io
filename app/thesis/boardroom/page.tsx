'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import TheMachine from '@/components/thesis/boardroom/TheMachine'
import MachineDial from '@/components/thesis/boardroom/MachineDial'
import ResearchNorthStarView from '@/components/thesis/boardroom/ResearchNorthStarView'
import MarketThesisView from '@/components/thesis/boardroom/MarketThesisView'
import ConceptsView from '@/components/thesis/rl/ConceptsView'
import TransitionsView from '@/components/thesis/rl/TransitionsView'
import PolicyView from '@/components/thesis/rl/PolicyView'
import ValueView from '@/components/thesis/rl/ValueView'
import AuditView from '@/components/thesis/rl/AuditView'
import RoleLabView from '@/components/thesis/rl/RoleLabView'
import RLStatusDial from '@/components/thesis/rl/RLStatusDial'
import AlphaFeedView from '@/components/thesis/alpha/AlphaFeedView'
import AlphaThesesView from '@/components/thesis/alpha/AlphaThesesView'
import AlphaLabView from '@/components/thesis/alpha/AlphaLabView'
import AlphaTrackerView from '@/components/thesis/alpha/AlphaTrackerView'
import AlphaDial from '@/components/thesis/alpha/AlphaDial'
import GovernanceLedger from '@/components/thesis/rl/GovernanceLedger'
import CalibrationView from '@/components/thesis/rl/CalibrationView'
import QuantPathView from '@/components/thesis/quant/QuantPathView'
import SurfaceAreaView from '@/components/thesis/quant/SurfaceAreaView'
import QuantLabView from '@/components/thesis/quant/QuantLabView'
import QuantDial from '@/components/thesis/quant/QuantDial'
import { getSignals, getHypotheses } from '@/lib/firestore'

type BoardRoomTab = 'machine' | 'rl' | 'research' | 'thesis' | 'alpha' | 'quant'
type RLSubTab = 'transitions' | 'policy' | 'audit' | 'lab'
type AlphaSubTab = 'feed' | 'theses' | 'lab' | 'tracker'
type QuantSubTab = 'path' | 'lab' | 'surface'

const TABS: { key: BoardRoomTab; label: string }[] = [
  { key: 'machine', label: 'The Machine' },
  { key: 'rl', label: 'RL' },
  { key: 'research', label: 'Research' },
  { key: 'thesis', label: 'Thesis' },
  { key: 'alpha', label: 'Alpha' },
  { key: 'quant', label: 'Quant' },
]

const RL_TABS: { key: RLSubTab; label: string }[] = [
  { key: 'transitions', label: 'Transitions' },
  { key: 'policy', label: 'Policy' },
  { key: 'audit', label: 'Audit' },
  { key: 'lab', label: 'Lab' },
]

const ALPHA_TABS: { key: AlphaSubTab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'theses', label: 'Theses' },
  { key: 'lab', label: 'Lab' },
  { key: 'tracker', label: 'Tracker' },
]

const QUANT_TABS: { key: QuantSubTab; label: string }[] = [
  { key: 'path', label: 'Quant Path' },
  { key: 'lab', label: 'Research Lab' },
  { key: 'surface', label: 'Surface Area' },
]

export default function BoardRoomPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<BoardRoomTab>('machine')
  const [rlSubTab, setRlSubTab] = useState<RLSubTab>('transitions')
  const [alphaSubTab, setAlphaSubTab] = useState<AlphaSubTab>('feed')
  const [quantSubTab, setQuantSubTab] = useState<QuantSubTab>('path')
  const [signalCount, setSignalCount] = useState(0)
  const [thesisCount, setThesisCount] = useState(0)

  const refreshCounts = useCallback(async () => {
    if (!user?.uid) return
    const [signals, hypotheses] = await Promise.all([
      getSignals(user.uid),
      getHypotheses(user.uid),
    ])
    setSignalCount(signals.filter(s => s.status !== 'archived').length)
    setThesisCount(hypotheses.length)
  }, [user?.uid])

  useEffect(() => {
    if (activeTab === 'alpha') refreshCounts()
  }, [activeTab, refreshCounts])

  const isMachine = activeTab === 'machine'
  const isRL = activeTab === 'rl'
  const isResearch = activeTab === 'research'
  const isThesis = activeTab === 'thesis'
  const isAlpha = activeTab === 'alpha'
  const isQuant = activeTab === 'quant'
  const isFullWidth = isResearch || isThesis

  return (
    <div className={`h-full grid gap-2 min-h-0 ${
      isFullWidth
        ? 'grid-cols-1'
        : 'grid-cols-1 lg:grid-cols-[1fr_320px]'
    }`}>
      {/* Left Panel: Tabbed Sections */}
      <div className="flex flex-col min-h-0">
        {/* Primary tab navigation */}
        <div className="flex gap-1 border-b border-rule shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-serif text-[13px] font-medium px-3 py-1 transition-colors ${
                activeTab === tab.key
                  ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* RL sub-tabs */}
        {isRL && (
          <div className="flex gap-1 border-b border-rule-light shrink-0 mt-1">
            {RL_TABS.map((tab) => (
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
        )}

        {/* Alpha sub-tabs */}
        {isAlpha && (
          <div className="flex gap-1 border-b border-rule-light shrink-0 mt-1">
            {ALPHA_TABS.map((tab) => (
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
        )}

        {/* Quant sub-tabs */}
        {isQuant && (
          <div className="flex gap-1 border-b border-rule-light shrink-0 mt-1">
            {QUANT_TABS.map((tab) => (
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
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isMachine && (
            <div className="space-y-3 py-2">
              <TheMachine />
            </div>
          )}
          {isResearch && <ResearchNorthStarView />}
          {isThesis && <MarketThesisView />}
          {isRL && rlSubTab === 'transitions' && <TransitionsView />}
          {isRL && rlSubTab === 'policy' && <PolicyView />}
          {isRL && rlSubTab === 'audit' && (
            <div className="space-y-3 py-1">
              <AuditView />
              <ValueView />
              <CalibrationView />
              <GovernanceLedger />
            </div>
          )}
          {isRL && rlSubTab === 'lab' && (
            <div className="space-y-3 py-1">
              <ConceptsView />
              <RoleLabView />
            </div>
          )}
          {isAlpha && alphaSubTab === 'feed' && <AlphaFeedView />}
          {isAlpha && alphaSubTab === 'theses' && <AlphaThesesView onExperimentCreated={refreshCounts} />}
          {isAlpha && alphaSubTab === 'lab' && <AlphaLabView />}
          {isAlpha && alphaSubTab === 'tracker' && <AlphaTrackerView />}
          {isQuant && quantSubTab === 'path' && <QuantPathView />}
          {isQuant && quantSubTab === 'lab' && <QuantLabView />}
          {isQuant && quantSubTab === 'surface' && <SurfaceAreaView />}
        </div>
      </div>

      {/* Right Sidebar — hidden when full-width tabs are active */}
      {!isFullWidth && (
        <div className="min-h-0 overflow-y-auto">
          {isMachine ? <MachineDial /> : isAlpha ? <AlphaDial signalCount={signalCount} thesisCount={thesisCount} /> : isQuant ? <QuantDial /> : <RLStatusDial />}
        </div>
      )}
    </div>
  )
}
