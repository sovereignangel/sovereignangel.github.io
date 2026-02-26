'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ExecutionView from '@/components/thesis/execution/ExecutionView'
import VenturesPipeline from '@/components/thesis/ventures/VenturesPipeline'
import VentureDetail from '@/components/thesis/ventures/VentureDetail'
import VenturesIdeas from '@/components/thesis/ventures/VenturesIdeas'
import VenturesDial from '@/components/thesis/ventures/VenturesDial'
import CapitalDial from '@/components/thesis/capital/CapitalDial'
import PositionBriefing from '@/components/thesis/capital/PositionBriefing'
import WarRoomView from '@/components/thesis/capital/WarRoomView'
import WeeklyPlanView from '@/components/thesis/weekly-plan/WeeklyPlanView'
import type { CapitalPosition, ScenarioParams } from '@/lib/types'
import { DEFAULT_SCENARIOS } from '@/lib/types'

type OperateTab = 'plan' | 'execute' | 'ventures' | 'capital'
type VenturesSubTab = 'pipeline' | 'ideas' | 'detail'
type CapitalSubTab = 'position' | 'warroom'

function OperateContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const ventureId = searchParams.get('id')

  const [activeTab, setActiveTab] = useState<OperateTab>(
    tabParam === 'ventures' ? 'ventures'
      : tabParam === 'capital' ? 'capital'
      : tabParam === 'plan' ? 'plan'
      : 'plan'
  )

  // Ventures state
  const [venturesSubTab, setVenturesSubTab] = useState<VenturesSubTab>(ventureId ? 'detail' : 'pipeline')
  const [selectedVentureId, setSelectedVentureId] = useState<string | null>(ventureId)

  // Capital state
  const [capitalSubTab, setCapitalSubTab] = useState<CapitalSubTab>('position')
  const [position, setPosition] = useState<CapitalPosition | null>(null)
  const [scenarios, setScenarios] = useState<ScenarioParams[]>(DEFAULT_SCENARIOS)
  const [capitalRefreshKey, setCapitalRefreshKey] = useState(0)

  useEffect(() => {
    if (ventureId) {
      setActiveTab('ventures')
      setSelectedVentureId(ventureId)
      setVenturesSubTab('detail')
    }
  }, [ventureId])

  const handleSelectVenture = (id: string) => {
    setSelectedVentureId(id)
    setVenturesSubTab('detail')
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Primary tabs */}
      <div className="flex gap-1 border-b border-rule shrink-0">
        {([
          { key: 'plan' as const, label: 'Plan' },
          { key: 'execute' as const, label: 'Execute' },
          { key: 'ventures' as const, label: 'Ventures' },
          { key: 'capital' as const, label: 'Capital' },
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
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'plan' && (
          <WeeklyPlanView />
        )}

        {activeTab === 'execute' && (
          <ExecutionView />
        )}

        {activeTab === 'ventures' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3 min-h-0">
            <div className="flex flex-col gap-1 min-h-0">
              <div className="flex gap-1 border-b border-rule shrink-0 mt-1">
                {([
                  { key: 'pipeline' as const, label: 'Pipeline' },
                  { key: 'ideas' as const, label: 'Ideas' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setVenturesSubTab(tab.key)}
                    className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
                      venturesSubTab === tab.key || (venturesSubTab === 'detail' && tab.key === 'pipeline')
                        ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {venturesSubTab === 'detail' && (
                  <span className="font-serif text-[11px] font-semibold px-2 py-1 text-burgundy border-b-2 border-burgundy -mb-px">
                    Detail
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {venturesSubTab === 'pipeline' && <VenturesPipeline onSelectVenture={handleSelectVenture} />}
                {venturesSubTab === 'ideas' && <VenturesIdeas onSelectVenture={handleSelectVenture} />}
                {venturesSubTab === 'detail' && selectedVentureId && (
                  <VentureDetail ventureId={selectedVentureId} onBack={() => setVenturesSubTab('pipeline')} />
                )}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <VenturesDial selectedVentureId={selectedVentureId} />
            </div>
          </div>
        )}

        {activeTab === 'capital' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2 min-h-0">
            <div className="flex flex-col min-h-0">
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
                    position={position}
                    onApplied={() => setCapitalRefreshKey(k => k + 1)}
                  />
                )}
                {capitalSubTab === 'warroom' && <WarRoomView position={position} scenarios={scenarios} />}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <CapitalDial
                onPositionChange={setPosition}
                onDebtsChange={() => {}}
                scenarios={scenarios}
                onScenariosChange={setScenarios}
              />
            </div>
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
