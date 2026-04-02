'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import WeeklyPlanView from '@/components/thesis/weekly-plan/WeeklyPlanView'
import PositionBriefing from '@/components/thesis/capital/PositionBriefing'
import WarRoomView from '@/components/thesis/capital/WarRoomView'
import RoadmapView from '@/components/thesis/roadmap/RoadmapView'

type OperateTab = 'plan' | 'capital' | 'roadmap'
type CapitalSubTab = 'position' | 'warroom'

function OperateContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState<OperateTab>(
    tabParam === 'capital' ? 'capital'
      : tabParam === 'roadmap' ? 'roadmap'
      : tabParam === 'plan' ? 'plan'
      : 'plan'
  )

  // Capital state
  const [capitalSubTab, setCapitalSubTab] = useState<CapitalSubTab>('position')
  const [capitalRefreshKey, setCapitalRefreshKey] = useState(0)

  return (
    <div className={`h-full flex flex-col min-h-0`}>
      {/* Primary tabs */}
      <div className="flex gap-1 border-b border-rule shrink-0">
        {([
          { key: 'plan' as const, label: 'Plan' },
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
        {activeTab === 'plan' && (
          <div className="overflow-y-auto h-full">
            <WeeklyPlanView />
          </div>
        )}

        {activeTab === 'capital' && (
          <div className="flex flex-col min-h-0 overflow-y-auto h-full">
            <div className="flex gap-1 border-b border-rule shrink-0 mt-1">
              {([
                { key: 'position' as const, label: 'Position' },
                { key: 'warroom' as const, label: 'War Room' },
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
