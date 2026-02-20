'use client'

import { useState } from 'react'
import CapitalDial from '@/components/thesis/capital/CapitalDial'
import PositionBriefing from '@/components/thesis/capital/PositionBriefing'
import WarRoomView from '@/components/thesis/capital/WarRoomView'
import type { DebtItem, ScenarioParams, CapitalPosition } from '@/lib/types'
import { DEFAULT_SCENARIOS } from '@/lib/types'

type CapitalTab = 'position' | 'warroom'

const TABS: { key: CapitalTab; label: string }[] = [
  { key: 'position', label: 'Position' },
  { key: 'warroom', label: 'War Room' },
]

export default function CapitalPage() {
  const [activeTab, setActiveTab] = useState<CapitalTab>('position')
  const [position, setPosition] = useState<CapitalPosition | null>(null)
  const [debts, setDebts] = useState<DebtItem[]>([])
  const [scenarios, setScenarios] = useState<ScenarioParams[]>(DEFAULT_SCENARIOS)

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2 min-h-0">
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
          {activeTab === 'position' && <PositionBriefing position={position} />}
          {activeTab === 'warroom' && <WarRoomView position={position} scenarios={scenarios} />}
        </div>
      </div>

      {/* Right Sidebar: CapitalDial */}
      <div className="min-h-0 overflow-y-auto">
        <CapitalDial
          onPositionChange={setPosition}
          onDebtsChange={setDebts}
          scenarios={scenarios}
          onScenariosChange={setScenarios}
        />
      </div>
    </div>
  )
}
