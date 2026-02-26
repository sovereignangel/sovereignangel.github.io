'use client'

import { useState, useCallback } from 'react'
import IntelligenceGauge from '@/components/thesis/intelligence/IntelligenceGauge'
import IntelligenceDial from '@/components/thesis/intelligence/IntelligenceDial'
import KnowledgeArchitecture from '@/components/thesis/intelligence/KnowledgeArchitecture'
import NetworkView from '@/components/thesis/alpe-dhuez/NetworkView'
import ConversationInbox from '@/components/thesis/intelligence/ConversationInbox'

type LibraryTab = 'signals' | 'knowledge' | 'network'

export default function IntelligenceLibrary() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<LibraryTab>('signals')
  const onSignalSaved = useCallback(() => setRefreshKey(k => k + 1), [])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Sub-tab Navigation */}
      <div className="flex gap-1 border-b border-rule shrink-0 mb-2">
        {([
          { key: 'signals' as const, label: 'Signals' },
          { key: 'knowledge' as const, label: 'Knowledge' },
          { key: 'network' as const, label: 'Network' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
              activeTab === tab.key
                ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'signals' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-2 h-full">
            <IntelligenceGauge refreshKey={refreshKey} />
            <div className="hidden lg:block min-h-0 overflow-y-auto">
              <IntelligenceDial onSignalSaved={onSignalSaved} />
            </div>
          </div>
        )}
        {activeTab === 'knowledge' && <KnowledgeArchitecture />}
        {activeTab === 'network' && (
          <div className="space-y-3">
            <NetworkView />
            <ConversationInbox />
          </div>
        )}
      </div>
    </div>
  )
}
