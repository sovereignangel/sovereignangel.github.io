'use client'

import { useState, useCallback } from 'react'
import IntelligenceGauge from '@/components/thesis/intelligence/IntelligenceGauge'
import IntelligenceDial from '@/components/thesis/intelligence/IntelligenceDial'
import ExternalSignalInbox from '@/components/thesis/intelligence/ExternalSignalInbox'
import KnowledgeArchitecture from '@/components/thesis/intelligence/KnowledgeArchitecture'
import InsightsInbox from '@/components/thesis/intelligence/InsightsInbox'
import NetworkView from '@/components/thesis/alpe-dhuez/NetworkView'
import ConversationInbox from '@/components/thesis/intelligence/ConversationInbox'

type TabType = 'feed' | 'signals' | 'network' | 'knowledge'

export default function IntelligencePage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('feed')
  const onSignalSaved = useCallback(() => setRefreshKey(k => k + 1), [])

  return (
    <div className={`h-full grid grid-cols-1 gap-2 min-h-0 ${activeTab === 'signals' ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
      {/* Left Panel: Tabbed Sections */}
      <div className="flex flex-col min-h-0">
        {/* Sub-tab Navigation */}
        <div className="flex gap-1 border-b border-rule shrink-0">
          {([
            { key: 'feed' as const, label: 'Feed' },
            { key: 'signals' as const, label: 'Signals' },
            { key: 'network' as const, label: 'Network' },
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
          {activeTab === 'feed' && <ExternalSignalInbox onSignalCreated={onSignalSaved} />}
          {activeTab === 'signals' && <IntelligenceGauge refreshKey={refreshKey} />}
          {activeTab === 'network' && (
            <div className="space-y-3">
              <NetworkView />
              <ConversationInbox />
            </div>
          )}
          {activeTab === 'knowledge' && (
            <div className="space-y-3">
              <KnowledgeArchitecture />
              <InsightsInbox />
            </div>
          )}
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
