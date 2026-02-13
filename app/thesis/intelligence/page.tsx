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
        {/* Tab Navigation - Armstrong Style */}
        <div className="flex gap-4 border-b border-rule pb-2">
          <button
            onClick={() => setActiveTab('signals')}
            className={`font-serif text-[16px] transition-colors py-2 ${
              activeTab === 'signals'
                ? 'text-burgundy font-semibold border-b-2 border-burgundy'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Signal Library
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`font-serif text-[16px] transition-colors py-2 ${
              activeTab === 'conversations'
                ? 'text-burgundy font-semibold border-b-2 border-burgundy'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`font-serif text-[16px] transition-colors py-2 ${
              activeTab === 'external'
                ? 'text-burgundy font-semibold border-b-2 border-burgundy'
                : 'text-ink-muted hover:text-ink'
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
