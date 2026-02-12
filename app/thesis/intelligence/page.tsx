'use client'

import { useState, useCallback } from 'react'
import IntelligenceGauge from '@/components/thesis/intelligence/IntelligenceGauge'
import IntelligenceDial from '@/components/thesis/intelligence/IntelligenceDial'
import ConversationInbox from '@/components/thesis/intelligence/ConversationInbox'
import ExternalSignalInbox from '@/components/thesis/intelligence/ExternalSignalInbox'

type TabType = 'signals' | 'conversations' | 'external'

export default function IntelligencePage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('signals')
  const onSignalSaved = useCallback(() => setRefreshKey(k => k + 1), [])

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      {/* Left Panel: Tabbed Sections */}
      <div className="flex flex-col gap-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'signals'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Signal Library
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'conversations'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'external'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            External Signals
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'signals' && <IntelligenceGauge refreshKey={refreshKey} />}
          {activeTab === 'conversations' && <ConversationInbox />}
          {activeTab === 'external' && <ExternalSignalInbox onSignalCreated={onSignalSaved} />}
        </div>
      </div>

      {/* Right Sidebar: Signal Creation Form */}
      <IntelligenceDial onSignalSaved={onSignalSaved} />
    </div>
  )
}
