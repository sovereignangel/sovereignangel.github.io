'use client'

import { useState, useCallback } from 'react'
import IntelligenceGauge from '@/components/thesis/intelligence/IntelligenceGauge'
import IntelligenceDial from '@/components/thesis/intelligence/IntelligenceDial'
import ExternalSignalInbox from '@/components/thesis/intelligence/ExternalSignalInbox'
import InsightsInbox from '@/components/thesis/intelligence/InsightsInbox'

type TabType = 'signals' | 'external' | 'insights' | 'knowledge'

function KnowledgePlaceholder() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="text-center">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
          Knowledge Architecture
        </h3>
        <p className="font-serif text-[10px] text-ink-muted">Books, research, 10-K filings with automated tagging — Phase 3</p>
      </div>
    </div>
  )
}

export default function IntelligencePage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('signals')
  const onSignalSaved = useCallback(() => setRefreshKey(k => k + 1), [])

  return (
    <div className={`h-full grid grid-cols-1 gap-2 min-h-0 ${activeTab === 'signals' ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
      {/* Left Panel: Tabbed Sections */}
      <div className="flex flex-col min-h-0">
        {/* Sub-tab Navigation */}
        <div className="flex gap-1 border-b border-rule shrink-0">
          {([
            { key: 'signals' as const, label: 'Signals' },
            { key: 'external' as const, label: 'External' },
            { key: 'insights' as const, label: 'Insights' },
            { key: 'knowledge' as const, label: 'Knowledge' },
          ]).map((tab) => (
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
          {activeTab === 'signals' && <IntelligenceGauge refreshKey={refreshKey} />}
          {activeTab === 'external' && <ExternalSignalInbox onSignalCreated={onSignalSaved} />}
          {activeTab === 'insights' && <InsightsInbox />}
          {activeTab === 'knowledge' && <KnowledgePlaceholder />}
        </div>
      </div>

      {/* Right Sidebar: only show on Signals tab at lg+ width */}
      {activeTab === 'signals' && (
        <div className="hidden lg:block min-h-0 overflow-y-auto">
          <IntelligenceDial onSignalSaved={onSignalSaved} />
        </div>
      )}
    </div>
  )
}
