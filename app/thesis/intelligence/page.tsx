'use client'

import { useState } from 'react'
import IntelligenceReviewQueue from '@/components/thesis/intelligence/IntelligenceReviewQueue'
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
  const [showLibrary, setShowLibrary] = useState(false)
  const [feedPillar, setFeedPillar] = useState<ThesisPillarExtended | 'all'>('all')

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rule shrink-0 pb-1">
        <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Intelligence
        </span>
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
            {/* Anki-style review queue */}
            <IntelligenceReviewQueue />

            {/* All 4 Pillar Briefs — 2×2 grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {PILLARS.map((p) => (
                <PillarBriefCard key={p.key} pillar={p.key} />
              ))}
            </div>

            {/* Research Feed — filter chips, not tabs */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  Research Feed
                </span>
                <div className="flex gap-1 ml-2">
                  {[{ key: 'all' as const, label: 'All' }, ...PILLARS].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setFeedPillar(p.key)}
                      className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border transition-colors ${
                        feedPillar === p.key
                          ? 'bg-burgundy text-paper border-burgundy'
                          : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {feedPillar === 'all' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {PILLARS.map((p) => (
                    <PillarResearchFeed key={p.key} pillar={p.key} />
                  ))}
                </div>
              ) : (
                <PillarResearchFeed pillar={feedPillar} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
