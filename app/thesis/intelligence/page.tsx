'use client'

import { useState } from 'react'
import PillarBriefCard from '@/components/thesis/intelligence/PillarBriefCard'
import PillarResearchFeed from '@/components/thesis/intelligence/PillarResearchFeed'
import QuickCapture from '@/components/thesis/intelligence/QuickCapture'
import IntelligenceLibrary from '@/components/thesis/intelligence/IntelligenceLibrary'
import type { ThesisPillarExtended } from '@/lib/types/pillar-brief'

type TabType = ThesisPillarExtended | 'library'

const TABS: Array<{ key: TabType; label: string }> = [
  { key: 'ai', label: 'AI' },
  { key: 'markets', label: 'Markets' },
  { key: 'mind', label: 'Mind' },
  { key: 'emergence', label: 'Emergence' },
  { key: 'library', label: 'Library' },
]

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabType>('ai')
  const isPillarTab = activeTab !== 'library'

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Tab Navigation */}
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

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isPillarTab ? (
          <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-2">
            {/* Main Panel: Brief + Research Feed */}
            <div className="overflow-y-auto space-y-3 py-2">
              <PillarBriefCard pillar={activeTab as ThesisPillarExtended} />
              <PillarResearchFeed pillar={activeTab as ThesisPillarExtended} />
            </div>

            {/* Right Sidebar: Quick Capture */}
            <div className="hidden lg:block overflow-y-auto py-2">
              <QuickCapture />
            </div>
          </div>
        ) : (
          <div className="h-full py-2">
            <IntelligenceLibrary />
          </div>
        )}
      </div>
    </div>
  )
}
