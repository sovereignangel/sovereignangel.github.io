'use client'

import { useState } from 'react'
import CapitalDial from '@/components/thesis/capital/CapitalDial'
import PositionView from '@/components/thesis/capital/PositionView'
import ScenarioView from '@/components/thesis/capital/ScenarioView'
import DebtView from '@/components/thesis/capital/DebtView'
import type { DebtItem, ScenarioParams, CapitalPosition } from '@/lib/types'
import { DEFAULT_SCENARIOS } from '@/lib/types'

type CapitalTab = 'position' | 'scenarios' | 'debt'

const TABS: { key: CapitalTab; label: string }[] = [
  { key: 'position', label: 'Position' },
  { key: 'scenarios', label: 'Scenarios' },
  { key: 'debt', label: 'Debt' },
]

export default function CapitalPage() {
  const [activeTab, setActiveTab] = useState<CapitalTab>('position')
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
          {activeTab === 'position' && <PositionView position={position} />}
          {activeTab === 'scenarios' && <ScenarioView position={position} scenarios={scenarios} />}
          {activeTab === 'debt' && <DebtView position={position} debts={debts} />}
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
