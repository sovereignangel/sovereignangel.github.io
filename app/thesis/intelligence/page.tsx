'use client'

import { useState } from 'react'
import PillarBriefCard from '@/components/thesis/intelligence/PillarBriefCard'
import PillarResearchFeed from '@/components/thesis/intelligence/PillarResearchFeed'
import IntelligenceLibrary from '@/components/thesis/intelligence/IntelligenceLibrary'
import CRMView from '@/components/thesis/crm/CRMView'
import SemanticSearch from '@/components/thesis/search/SemanticSearch'
import type { ThesisPillarExtended } from '@/lib/types/pillar-brief'

const PILLARS: Array<{ key: ThesisPillarExtended; label: string }> = [
  { key: 'ai', label: 'AI' },
  { key: 'markets', label: 'Markets' },
  { key: 'mind', label: 'Mind' },
  { key: 'emergence', label: 'Emergence' },
]

type ActiveView = 'pillar' | 'library' | 'network' | 'search'

export default function IntelligencePage() {
  const [activePillar, setActivePillar] = useState<ThesisPillarExtended>('ai')
  const [activeView, setActiveView] = useState<ActiveView>('pillar')

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Pillar Selector + toggles */}
      <div className="flex items-center justify-between border-b border-rule shrink-0 pb-1">
        <div className="flex gap-1">
          {PILLARS.map((p) => (
            <button
              key={p.key}
              onClick={() => { setActivePillar(p.key); setActiveView('pillar') }}
              className={`font-serif text-[13px] font-medium px-3 py-1 transition-colors ${
                activeView === 'pillar' && activePillar === p.key
                  ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveView(activeView === 'search' ? 'pillar' : 'search')}
            className={`font-serif text-[11px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              activeView === 'search'
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveView(activeView === 'network' ? 'pillar' : 'network')}
            className={`font-serif text-[11px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              activeView === 'network'
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            Network
          </button>
          <button
            onClick={() => setActiveView(activeView === 'library' ? 'pillar' : 'library')}
            className={`font-serif text-[11px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              activeView === 'library'
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            Library
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2">
        {activeView === 'search' ? (
          <SemanticSearch />
        ) : activeView === 'library' ? (
          <IntelligenceLibrary />
        ) : activeView === 'network' ? (
          <CRMView />
        ) : (
          <div className="space-y-3">
            <PillarBriefCard pillar={activePillar} />
            <PillarResearchFeed pillar={activePillar} />
          </div>
        )}
      </div>
    </div>
  )
}
