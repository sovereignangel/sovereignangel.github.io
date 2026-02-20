'use client'

import { useState } from 'react'
import NetworkView from '@/components/thesis/alpe-dhuez/NetworkView'
import ConversationInbox from '@/components/thesis/intelligence/ConversationInbox'

type NetworkTab = 'contacts' | 'conversations'

const TABS: { key: NetworkTab; label: string }[] = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'conversations', label: 'Conversations' },
]

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<NetworkTab>('contacts')

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Sub-tab Navigation */}
      <div className="flex gap-1 border-b border-rule shrink-0">
        {TABS.map((tab) => (
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
        {activeTab === 'contacts' && <NetworkView />}
        {activeTab === 'conversations' && <ConversationInbox />}
      </div>
    </div>
  )
}
