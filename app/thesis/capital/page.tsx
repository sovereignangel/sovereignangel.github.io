'use client'

import { useState } from 'react'
import CapitalDial from '@/components/thesis/capital/CapitalDial'
import CockpitView from '@/components/thesis/capital/CockpitView'
import DecisionEngineView from '@/components/thesis/capital/DecisionEngineView'
import LiabilityCommandView from '@/components/thesis/capital/LiabilityCommandView'
import AllocationView from '@/components/thesis/capital/AllocationView'
import type { DebtItem, ScenarioParams, CapitalPosition } from '@/lib/types'
import { DEFAULT_SCENARIOS } from '@/lib/types'

type CapitalTab = 'cockpit' | 'scenarios' | 'liabilities' | 'allocation'

const TABS: { key: CapitalTab; label: string }[] = [
  { key: 'cockpit', label: 'Cockpit' },
  { key: 'scenarios', label: 'Scenarios' },
  { key: 'liabilities', label: 'Liabilities' },
  { key: 'allocation', label: 'Allocation' },
]

export default function CapitalPage() {
  const [activeTab, setActiveTab] = useState<CapitalTab>('cockpit')
  const [position, setPosition] = useState<CapitalPosition | null>(null)
  const [debts, setDebts] = useState<DebtItem[]>([])
  const [scenarios, setScenarios] = useState<ScenarioParams[]>(DEFAULT_SCENARIOS)

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3 min-h-0">
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
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'cockpit' && <CockpitView position={position} />}
          {activeTab === 'scenarios' && <DecisionEngineView position={position} scenarios={scenarios} />}
          {activeTab === 'liabilities' && <LiabilityCommandView position={position} debts={debts} />}
          {activeTab === 'allocation' && <AllocationView position={position} scenarios={scenarios} />}
        </div>
      </div>

      {/* Right Sidebar */}
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
