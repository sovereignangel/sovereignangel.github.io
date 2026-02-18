'use client'

import { useState } from 'react'
import AlpeDial from '@/components/thesis/alpe-dhuez/AlpeDial'
import SynthesisView from '@/components/thesis/alpe-dhuez/SynthesisView'
import NetworkView from '@/components/thesis/alpe-dhuez/NetworkView'
import PositionView from '@/components/thesis/alpe-dhuez/PositionView'
import AuditView from '@/components/thesis/alpe-dhuez/AuditView'

type AlpeTab = 'synthesis' | 'network' | 'position' | 'audit'

const TABS: { key: AlpeTab; label: string }[] = [
  { key: 'synthesis', label: 'Synthesis' },
  { key: 'network', label: 'Network' },
  { key: 'position', label: 'Position' },
  { key: 'audit', label: 'Audit' },
]

export default function AlpeDhuezPage() {
  const [activeTab, setActiveTab] = useState<AlpeTab>('synthesis')

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
          {activeTab === 'synthesis' && <SynthesisView />}
          {activeTab === 'network' && <NetworkView />}
          {activeTab === 'position' && <PositionView />}
          {activeTab === 'audit' && <AuditView />}
        </div>
      </div>

      {/* Right Sidebar */}
      <AlpeDial />
    </div>
  )
}
