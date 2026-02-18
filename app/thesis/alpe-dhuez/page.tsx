'use client'

import { useState } from 'react'
import AlpeDial from '@/components/thesis/alpe-dhuez/AlpeDial'
import SynthesisView from '@/components/thesis/alpe-dhuez/SynthesisView'
import NetworkView from '@/components/thesis/alpe-dhuez/NetworkView'
import AuditView from '@/components/thesis/alpe-dhuez/AuditView'

type AlpeTab = 'synthesis' | 'network' | 'ascent'

const TABS: { key: AlpeTab; label: string }[] = [
  { key: 'synthesis', label: 'Synthesis' },
  { key: 'network', label: 'Network' },
  { key: 'ascent', label: 'Ascent' },
]

export default function AlpeDhuezPage() {
  const [activeTab, setActiveTab] = useState<AlpeTab>('synthesis')

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
          {activeTab === 'synthesis' && <SynthesisView />}
          {activeTab === 'network' && <NetworkView />}
          {activeTab === 'ascent' && <AuditView />}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="min-h-0 overflow-y-auto">
        <AlpeDial />
      </div>
    </div>
  )
}
