'use client'

import { useState } from 'react'
import TheMachine from '@/components/thesis/boardroom/TheMachine'
import MachineDial from '@/components/thesis/boardroom/MachineDial'
import ResearchNorthStarView from '@/components/thesis/boardroom/ResearchNorthStarView'
import MarketThesisView from '@/components/thesis/boardroom/MarketThesisView'
import ConceptsView from '@/components/thesis/rl/ConceptsView'
import TransitionsView from '@/components/thesis/rl/TransitionsView'
import PolicyView from '@/components/thesis/rl/PolicyView'
import ValueView from '@/components/thesis/rl/ValueView'
import AuditView from '@/components/thesis/rl/AuditView'
import RLStatusDial from '@/components/thesis/rl/RLStatusDial'

type BoardRoomTab = 'machine' | 'rl' | 'research' | 'thesis'
type RLSubTab = 'concepts' | 'transitions' | 'policy' | 'value' | 'audit'

const TABS: { key: BoardRoomTab; label: string }[] = [
  { key: 'machine', label: 'The Machine' },
  { key: 'rl', label: 'RL' },
  { key: 'research', label: 'Research' },
  { key: 'thesis', label: 'Thesis' },
]

const RL_TABS: { key: RLSubTab; label: string }[] = [
  { key: 'concepts', label: 'Concepts' },
  { key: 'transitions', label: 'Transitions' },
  { key: 'policy', label: 'Policy' },
  { key: 'value', label: 'Value' },
  { key: 'audit', label: 'Audit' },
]

export default function BoardRoomPage() {
  const [activeTab, setActiveTab] = useState<BoardRoomTab>('machine')
  const [rlSubTab, setRlSubTab] = useState<RLSubTab>('concepts')

  const isMachine = activeTab === 'machine'
  const isRL = activeTab === 'rl'
  const isResearch = activeTab === 'research'
  const isThesis = activeTab === 'thesis'
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

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isMachine && <TheMachine />}
          {isResearch && <ResearchNorthStarView />}
          {isThesis && <MarketThesisView />}
          {isRL && rlSubTab === 'concepts' && <ConceptsView />}
          {isRL && rlSubTab === 'transitions' && <TransitionsView />}
          {isRL && rlSubTab === 'policy' && <PolicyView />}
          {isRL && rlSubTab === 'value' && <ValueView />}
          {isRL && rlSubTab === 'audit' && <AuditView />}
        </div>
      </div>

      {/* Right Sidebar — hidden when full-width tabs are active */}
      {!isFullWidth && (
        <div className="min-h-0 overflow-y-auto">
          {isMachine ? <MachineDial /> : <RLStatusDial />}
        </div>
      )}
    </div>
  )
}
