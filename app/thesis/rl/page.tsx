'use client'

import { useState } from 'react'
import ConceptsView from '@/components/thesis/rl/ConceptsView'
import TransitionsView from '@/components/thesis/rl/TransitionsView'
import PolicyView from '@/components/thesis/rl/PolicyView'
import ValueView from '@/components/thesis/rl/ValueView'
import AuditView from '@/components/thesis/rl/AuditView'
import RLStatusDial from '@/components/thesis/rl/RLStatusDial'

type RLTab = 'concepts' | 'transitions' | 'policy' | 'value' | 'audit'

const TABS: { key: RLTab; label: string }[] = [
  { key: 'concepts', label: 'Concepts' },
  { key: 'transitions', label: 'Transitions' },
  { key: 'policy', label: 'Policy' },
  { key: 'value', label: 'Value' },
  { key: 'audit', label: 'Audit' },
]

export default function RLPage() {
  const [activeTab, setActiveTab] = useState<RLTab>('concepts')

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 min-h-0">
      {/* Left Panel: Tabbed Sections */}
      <div className="flex flex-col gap-1 min-h-0">
        {/* Sub-tab Navigation */}
        <div className="flex gap-1 border-b border-rule shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-serif text-[13px] font-medium px-3 py-1.5 transition-colors ${
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
        <div className="flex-1 overflow-y-auto p-1">
          {activeTab === 'concepts' && <ConceptsView />}
          {activeTab === 'transitions' && <TransitionsView />}
          {activeTab === 'policy' && <PolicyView />}
          {activeTab === 'value' && <ValueView />}
          {activeTab === 'audit' && <AuditView />}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="min-h-0 overflow-y-auto">
        <RLStatusDial />
      </div>
    </div>
  )
}
