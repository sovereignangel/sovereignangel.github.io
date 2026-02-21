'use client'

import { useState } from 'react'
import NetworkView from '@/components/thesis/alpe-dhuez/NetworkView'
import ConversationInbox from '@/components/thesis/intelligence/ConversationInbox'
import NetworkDial from '@/components/thesis/network/NetworkDial'

type NetworkTab = 'contacts' | 'conversations'

const TABS: { key: NetworkTab; label: string }[] = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'conversations', label: 'Conversations' },
]

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<NetworkTab>('contacts')

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2 min-h-0">
      {/* Left Panel: Tabbed Sections */}
      <div className="flex flex-col min-h-0">
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

      {/* Right Sidebar: NetworkDial */}
      <div className="min-h-0 overflow-y-auto">
        <NetworkDial />
      </div>
    </div>
  )
}
