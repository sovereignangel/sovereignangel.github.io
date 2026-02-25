'use client'

import { useState } from 'react'
import SynthesisView from '@/components/thesis/alpe-dhuez/SynthesisView'
import DecisionJournal from '@/components/thesis/boardroom/DecisionJournal'
import PrinciplesLedger from '@/components/thesis/boardroom/PrinciplesLedger'
import DailyJournal from '@/components/thesis/boardroom/DailyJournal'
import JournalLedger from '@/components/thesis/boardroom/JournalLedger'
import BoardRoomDial from '@/components/thesis/boardroom/BoardRoomDial'
import ResearchNorthStarView from '@/components/thesis/boardroom/ResearchNorthStarView'
import ConceptsView from '@/components/thesis/rl/ConceptsView'
import TransitionsView from '@/components/thesis/rl/TransitionsView'
import PolicyView from '@/components/thesis/rl/PolicyView'
import ValueView from '@/components/thesis/rl/ValueView'
import AuditView from '@/components/thesis/rl/AuditView'
import RLStatusDial from '@/components/thesis/rl/RLStatusDial'

type BoardRoomTab = 'journal' | 'decisions' | 'principles' | 'synthesis' | 'rl' | 'research'
type JournalMode = 'entry' | 'ledger'
type RLSubTab = 'concepts' | 'transitions' | 'policy' | 'value' | 'audit'

const TABS: { key: BoardRoomTab; label: string }[] = [
  { key: 'journal', label: 'Journal' },
  { key: 'decisions', label: 'Decisions' },
  { key: 'principles', label: 'Principles' },
  { key: 'synthesis', label: 'Synthesis' },
  { key: 'rl', label: 'RL' },
  { key: 'research', label: 'Research' },
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
  const [journalMode, setJournalMode] = useState<JournalMode>('entry')
  const [rlSubTab, setRlSubTab] = useState<RLSubTab>('concepts')

  const isJournal = activeTab === 'journal'
  const isRL = activeTab === 'rl'
  const isResearch = activeTab === 'research'
  const isFullWidth = isResearch

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

        {/* Journal sub-tabs */}
        {isJournal && (
          <div className="flex gap-1 border-b border-rule-light shrink-0 mt-1">
            {([{ key: 'entry', label: 'Entry' }, { key: 'ledger', label: 'Ledger' }] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setJournalMode(tab.key)}
                className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
                  journalMode === tab.key
                    ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

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
          {isJournal && journalMode === 'entry' && <DailyJournal />}
          {isJournal && journalMode === 'ledger' && <JournalLedger />}
          {activeTab === 'decisions' && <DecisionJournal />}
          {activeTab === 'principles' && <PrinciplesLedger />}
          {activeTab === 'synthesis' && <SynthesisView />}
          {isResearch && <ResearchNorthStarView />}
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
          {isRL ? <RLStatusDial /> : <BoardRoomDial />}
        </div>
      )}
    </div>
  )
}
