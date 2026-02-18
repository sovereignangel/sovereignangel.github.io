'use client'

import { useState } from 'react'
import ExecutionDial from '@/components/thesis/execution/ExecutionDial'
import FocusView from '@/components/thesis/execution/FocusView'
import MusclesView from '@/components/thesis/execution/MusclesView'
import GoalsView from '@/components/thesis/execution/GoalsView'

type ExecutionTab = 'focus' | 'muscles' | 'goals'

const TABS: { key: ExecutionTab; label: string }[] = [
  { key: 'focus', label: 'Focus' },
  { key: 'muscles', label: 'Muscles' },
  { key: 'goals', label: 'Goals' },
]

export default function ExecutionPage() {
  const [activeTab, setActiveTab] = useState<ExecutionTab>('focus')

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3">
      {/* Left Panel: Tabbed Sections */}
      <div className="flex flex-col gap-3">
        {/* Sub-tab Navigation */}
        <div className="flex gap-4 border-b border-rule pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-serif text-[16px] transition-colors py-2 ${
                activeTab === tab.key
                  ? 'text-burgundy font-semibold border-b-2 border-burgundy'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'focus' && <FocusView />}
          {activeTab === 'muscles' && <MusclesView />}
          {activeTab === 'goals' && <GoalsView />}
        </div>
      </div>

      {/* Right Sidebar */}
      <ExecutionDial />
    </div>
  )
}
