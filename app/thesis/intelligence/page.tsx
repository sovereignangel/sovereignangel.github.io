'use client'

import { useState } from 'react'
import PillarBriefCard from '@/components/thesis/intelligence/PillarBriefCard'
import PillarResearchFeed from '@/components/thesis/intelligence/PillarResearchFeed'
import IntelligenceLibrary from '@/components/thesis/intelligence/IntelligenceLibrary'
import type { ThesisPillarExtended } from '@/lib/types/pillar-brief'

const PILLARS: Array<{ key: ThesisPillarExtended; label: string }> = [
  { key: 'ai', label: 'AI' },
  { key: 'markets', label: 'Markets' },
  { key: 'mind', label: 'Mind' },
  { key: 'emergence', label: 'Emergence' },
]

export default function IntelligencePage() {
  const [activePillar, setActivePillar] = useState<ThesisPillarExtended>('ai')
  const [showLibrary, setShowLibrary] = useState(false)

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Pillar Selector + Library Toggle */}
      <div className="flex items-center justify-between border-b border-rule shrink-0 pb-1">
        <div className="flex gap-1">
          {PILLARS.map((p) => (
            <button
              key={p.key}
              onClick={() => { setActivePillar(p.key); setShowLibrary(false) }}
              className={`font-serif text-[13px] font-medium px-3 py-1 transition-colors ${
                activePillar === p.key && !showLibrary
                  ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLibrary(!showLibrary)}
          className={`font-serif text-[11px] font-medium px-2 py-1 rounded-sm border transition-colors ${
            showLibrary
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
          }`}
        >
          Library
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2">
        {showLibrary ? (
          <IntelligenceLibrary />
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
