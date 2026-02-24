'use client'

import { useState } from 'react'
import SynthesisView from '@/components/thesis/alpe-dhuez/SynthesisView'
import DecisionJournal from '@/components/thesis/boardroom/DecisionJournal'
import PrinciplesLedger from '@/components/thesis/boardroom/PrinciplesLedger'
import DailyJournal from '@/components/thesis/boardroom/DailyJournal'
import BoardRoomDial from '@/components/thesis/boardroom/BoardRoomDial'
import ConceptsView from '@/components/thesis/rl/ConceptsView'
import TransitionsView from '@/components/thesis/rl/TransitionsView'
import PolicyView from '@/components/thesis/rl/PolicyView'
import ValueView from '@/components/thesis/rl/ValueView'
import AuditView from '@/components/thesis/rl/AuditView'
import RLStatusDial from '@/components/thesis/rl/RLStatusDial'

type BoardRoomTab = 'journal' | 'decisions' | 'principles' | 'synthesis' | 'rl'
type RLSubTab = 'concepts' | 'transitions' | 'policy' | 'value' | 'audit'

const TABS: { key: BoardRoomTab; label: string }[] = [
  { key: 'journal', label: 'Journal' },
  { key: 'decisions', label: 'Decisions' },
  { key: 'principles', label: 'Principles' },
  { key: 'synthesis', label: 'Synthesis' },
  { key: 'rl', label: 'RL' },
]

const RL_TABS: { key: RLSubTab; label: string }[] = [
  { key: 'concepts', label: 'Concepts' },
  { key: 'transitions', label: 'Transitions' },
  { key: 'policy', label: 'Policy' },
  { key: 'value', label: 'Value' },
  { key: 'audit', label: 'Audit' },
]

export default function BoardRoomPage() {
  const [activeTab, setActiveTab] = useState<BoardRoomTab>('journal')
  const [rlSubTab, setRlSubTab] = useState<RLSubTab>('concepts')

  const isRL = activeTab === 'rl'

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 min-h-0">
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
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'journal' && <DailyJournal />}
          {activeTab === 'decisions' && <DecisionJournal />}
          {activeTab === 'principles' && <PrinciplesLedger />}
          {activeTab === 'synthesis' && <SynthesisView />}
          {isRL && rlSubTab === 'concepts' && <ConceptsView />}
          {isRL && rlSubTab === 'transitions' && <TransitionsView />}
          {isRL && rlSubTab === 'policy' && <PolicyView />}
          {isRL && rlSubTab === 'value' && <ValueView />}
          {isRL && rlSubTab === 'audit' && <AuditView />}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="min-h-0 overflow-y-auto">
        {isRL ? <RLStatusDial /> : <BoardRoomDial />}
      </div>
    </div>
  )
}
