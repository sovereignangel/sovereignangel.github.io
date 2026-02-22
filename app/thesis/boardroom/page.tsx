'use client'

import { useState } from 'react'
import SynthesisView from '@/components/thesis/alpe-dhuez/SynthesisView'
import DecisionJournal from '@/components/thesis/boardroom/DecisionJournal'
import PrinciplesLedger from '@/components/thesis/boardroom/PrinciplesLedger'
import CadenceView from '@/components/thesis/boardroom/CadenceView'
import DailyJournal from '@/components/thesis/boardroom/DailyJournal'
import BoardRoomDial from '@/components/thesis/boardroom/BoardRoomDial'
import PositionBriefing from '@/components/thesis/capital/PositionBriefing'

type BoardRoomTab = 'journal' | 'decisions' | 'principles' | 'capital' | 'cadence' | 'synthesis'

const TABS: { key: BoardRoomTab; label: string }[] = [
  { key: 'journal', label: 'Journal' },
  { key: 'decisions', label: 'Decisions' },
  { key: 'principles', label: 'Principles' },
  { key: 'capital', label: 'Capital' },
  { key: 'cadence', label: 'Cadence' },
  { key: 'synthesis', label: 'Synthesis' },
]

export default function BoardRoomPage() {
  const [activeTab, setActiveTab] = useState<BoardRoomTab>('journal')

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 min-h-0">
      {/* Left Panel: Tabbed Sections */}
      <div className="flex flex-col min-h-0">
        {/* Sub-tab Navigation */}
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

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'journal' && <DailyJournal />}
          {activeTab === 'decisions' && <DecisionJournal />}
          {activeTab === 'principles' && <PrinciplesLedger />}
          {activeTab === 'capital' && <PositionBriefing position={null} />}
          {activeTab === 'cadence' && <CadenceView />}
          {activeTab === 'synthesis' && <SynthesisView />}
        </div>
      </div>

      {/* Right Sidebar: Board Room Status */}
      <div className="min-h-0 overflow-y-auto">
        <BoardRoomDial />
      </div>
    </div>
  )
}
