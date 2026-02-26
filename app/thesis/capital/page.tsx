'use client'

import { useState } from 'react'
import PositionBriefing from '@/components/thesis/capital/PositionBriefing'
import WarRoomView from '@/components/thesis/capital/WarRoomView'

type CapitalTab = 'position' | 'warroom'

const TABS: { key: CapitalTab; label: string }[] = [
  { key: 'position', label: 'Position' },
  { key: 'warroom', label: 'War Room' },
]

export default function CapitalPage() {
  const [activeTab, setActiveTab] = useState<CapitalTab>('position')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
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
        {activeTab === 'position' && (
          <PositionBriefing
            key={refreshKey}
            onApplied={() => setRefreshKey(k => k + 1)}
          />
        )}
        {activeTab === 'warroom' && <WarRoomView />}
      </div>
    </div>
  )
}
