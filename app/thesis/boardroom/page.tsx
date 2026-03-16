'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import TheMachine from '@/components/thesis/boardroom/TheMachine'
import MachineDial from '@/components/thesis/boardroom/MachineDial'
import MarketThesisView from '@/components/thesis/boardroom/MarketThesisView'
import AlphaFeedView from '@/components/thesis/alpha/AlphaFeedView'
import AlphaThesesView from '@/components/thesis/alpha/AlphaThesesView'
import AlphaLabView from '@/components/thesis/alpha/AlphaLabView'
import AlphaTrackerView from '@/components/thesis/alpha/AlphaTrackerView'
import AlphaDial from '@/components/thesis/alpha/AlphaDial'
import { getSignals, getHypotheses } from '@/lib/firestore'

type BoardRoomTab = 'machine' | 'thesis' | 'alpha'
type AlphaSubTab = 'feed' | 'theses' | 'lab' | 'tracker'

const TABS: { key: BoardRoomTab; label: string }[] = [
  { key: 'machine', label: 'The Machine' },
  { key: 'thesis', label: 'Thesis' },
  { key: 'alpha', label: 'Alpha' },
]

const ALPHA_TABS: { key: AlphaSubTab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'theses', label: 'Theses' },
  { key: 'lab', label: 'Lab' },
  { key: 'tracker', label: 'Tracker' },
]

export default function BoardRoomPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<BoardRoomTab>('machine')
  const [alphaSubTab, setAlphaSubTab] = useState<AlphaSubTab>('feed')
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
  const isThesis = activeTab === 'thesis'
  const isAlpha = activeTab === 'alpha'
  const isFullWidth = isThesis

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

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isMachine && (
            <div className="space-y-3 py-2">
              <TheMachine />
            </div>
          )}
          {isThesis && <MarketThesisView />}
          {isAlpha && alphaSubTab === 'feed' && <AlphaFeedView />}
          {isAlpha && alphaSubTab === 'theses' && <AlphaThesesView onExperimentCreated={refreshCounts} />}
          {isAlpha && alphaSubTab === 'lab' && <AlphaLabView />}
          {isAlpha && alphaSubTab === 'tracker' && <AlphaTrackerView />}
        </div>
      </div>

      {/* Right Sidebar — hidden when full-width tabs are active */}
      {!isFullWidth && (
        <div className="min-h-0 overflow-y-auto">
          {isMachine ? <MachineDial /> : <AlphaDial signalCount={signalCount} thesisCount={thesisCount} />}
        </div>
      )}
    </div>
  )
}
