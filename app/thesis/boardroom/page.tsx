'use client'

import { useState } from 'react'
import SynthesisView from '@/components/thesis/alpe-dhuez/SynthesisView'
import AlpeDial from '@/components/thesis/alpe-dhuez/AlpeDial'

type BoardRoomTab = 'synthesis' | 'decisions' | 'principles' | 'cadence' | 'cognition'

const TABS: { key: BoardRoomTab; label: string }[] = [
  { key: 'synthesis', label: 'Synthesis' },
  { key: 'decisions', label: 'Decisions' },
  { key: 'principles', label: 'Principles' },
  { key: 'cadence', label: 'Cadence' },
  { key: 'cognition', label: 'Cognition' },
]

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="text-center">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          {title}
        </h3>
        <p className="font-serif text-[10px] text-ink-muted">{description}</p>
      </div>
    </div>
  )
}

export default function BoardRoomPage() {
  const [activeTab, setActiveTab] = useState<BoardRoomTab>('synthesis')

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-2 min-h-0">
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
          {activeTab === 'synthesis' && <SynthesisView />}
          {activeTab === 'decisions' && (
            <PlaceholderTab title="Decision Journal" description="Hypothesis-driven decisions with calibration tracking — Phase 2" />
          )}
          {activeTab === 'principles' && (
            <PlaceholderTab title="Principles Ledger" description="Derived principles with reinforcement counts — Phase 2" />
          )}
          {activeTab === 'cadence' && (
            <PlaceholderTab title="Cadence System" description="Daily / weekly / monthly / quarterly structured reviews — Phase 2" />
          )}
          {activeTab === 'cognition' && (
            <PlaceholderTab title="Cognition & PsyCap" description="Hope, Efficacy, Resilience, Optimism tracking — Phase 2" />
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="min-h-0 overflow-y-auto">
        <AlpeDial />
      </div>
    </div>
  )
}
