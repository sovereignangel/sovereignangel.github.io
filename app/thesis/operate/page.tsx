'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PositionBriefing from '@/components/thesis/capital/PositionBriefing'
import WarRoomView from '@/components/thesis/capital/WarRoomView'
import RoadmapView from '@/components/thesis/roadmap/RoadmapView'
import ConvictionSprint from '@/components/thesis/sprint/ConvictionSprint'
import ConvictionSprintFinancials from '@/components/thesis/sprint/ConvictionSprintFinancials'

type OperateTab = 'sprint' | 'capital' | 'roadmap'
type CapitalSubTab = 'position' | 'warroom' | 'sprint'

function OperateContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState<OperateTab>(
    tabParam === 'capital' ? 'capital'
      : tabParam === 'roadmap' ? 'roadmap'
      : 'sprint'
  )

  // Capital state
  const [capitalSubTab, setCapitalSubTab] = useState<CapitalSubTab>('position')
  const [capitalRefreshKey, setCapitalRefreshKey] = useState(0)

  return (
    <div className={`h-full flex flex-col min-h-0`}>
      {/* Primary tabs */}
      <div className="flex gap-1 border-b border-rule shrink-0">
        {([
          { key: 'sprint' as const, label: 'Sprint' },
          { key: 'capital' as const, label: 'Capital' },
          { key: 'roadmap' as const, label: 'Roadmap' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`font-serif text-[13px] font-medium px-3 py-1.5 transition-colors ${
              activeTab === tab.key
                ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'sprint' && (
          <div className="overflow-y-auto h-full">
            <ConvictionSprint />
          </div>
        )}

        {activeTab === 'capital' && (
          <div className="flex flex-col min-h-0 overflow-y-auto h-full">
            <div className="flex gap-1 border-b border-rule shrink-0 mt-1">
              {([
                { key: 'position' as const, label: 'Position' },
                { key: 'warroom' as const, label: 'War Room' },
                { key: 'sprint' as const, label: 'Conviction Sprint' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setCapitalSubTab(tab.key)}
                  className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
                    capitalSubTab === tab.key
                      ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {capitalSubTab === 'position' && (
                <PositionBriefing
                  key={capitalRefreshKey}
                  onApplied={() => setCapitalRefreshKey(k => k + 1)}
                />
              )}
              {capitalSubTab === 'warroom' && <WarRoomView />}
              {capitalSubTab === 'sprint' && <ConvictionSprintFinancials />}
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="overflow-y-auto h-full">
            <RoadmapView />
          </div>
        )}
      </div>
    </div>
  )
}

export default function OperatePage() {
  return (
    <Suspense fallback={<div className="p-3 font-mono text-[11px] text-ink-muted">Loading...</div>}>
      <OperateContent />
    </Suspense>
  )
}
