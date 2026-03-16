'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ExecutionView from '@/components/thesis/execution/ExecutionView'
import VenturesPipeline from '@/components/thesis/ventures/VenturesPipeline'
import VentureDetail from '@/components/thesis/ventures/VentureDetail'
import VenturesIdeas from '@/components/thesis/ventures/VenturesIdeas'
import VenturesDial from '@/components/thesis/ventures/VenturesDial'
import PositionBriefing from '@/components/thesis/capital/PositionBriefing'
import WarRoomView from '@/components/thesis/capital/WarRoomView'
import WeeklyPlanView from '@/components/thesis/weekly-plan/WeeklyPlanView'
import ResearchNorthStarView from '@/components/thesis/boardroom/ResearchNorthStarView'
import ConceptsView from '@/components/thesis/rl/ConceptsView'
import TransitionsView from '@/components/thesis/rl/TransitionsView'
import PolicyView from '@/components/thesis/rl/PolicyView'
import ValueView from '@/components/thesis/rl/ValueView'
import AuditView from '@/components/thesis/rl/AuditView'
import RoleLabView from '@/components/thesis/rl/RoleLabView'
import RLStatusDial from '@/components/thesis/rl/RLStatusDial'
import GovernanceLedger from '@/components/thesis/rl/GovernanceLedger'
import CalibrationView from '@/components/thesis/rl/CalibrationView'
import QuantPathView from '@/components/thesis/quant/QuantPathView'
import SurfaceAreaView from '@/components/thesis/quant/SurfaceAreaView'
import QuantLabView from '@/components/thesis/quant/QuantLabView'
import QuantDial from '@/components/thesis/quant/QuantDial'

type OperateTab = 'plan' | 'execute' | 'ventures' | 'capital' | 'research' | 'rl' | 'quant'
type RLSubTab = 'transitions' | 'policy' | 'audit' | 'lab'
type QuantSubTab = 'path' | 'lab' | 'surface'
type VenturesSubTab = 'pipeline' | 'ideas' | 'detail'
type CapitalSubTab = 'position' | 'warroom'

function OperateContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const ventureId = searchParams.get('id')

  const [activeTab, setActiveTab] = useState<OperateTab>(
    tabParam === 'ventures' ? 'ventures'
      : tabParam === 'capital' ? 'capital'
      : tabParam === 'research' ? 'research'
      : tabParam === 'rl' ? 'rl'
      : tabParam === 'quant' ? 'quant'
      : tabParam === 'plan' ? 'plan'
      : 'plan'
  )

  // RL & Quant state
  const [rlSubTab, setRlSubTab] = useState<RLSubTab>('transitions')
  const [quantSubTab, setQuantSubTab] = useState<QuantSubTab>('path')

  // Ventures state
  const [venturesSubTab, setVenturesSubTab] = useState<VenturesSubTab>(ventureId ? 'detail' : 'pipeline')
  const [selectedVentureId, setSelectedVentureId] = useState<string | null>(ventureId)

  // Capital state
  const [capitalSubTab, setCapitalSubTab] = useState<CapitalSubTab>('position')
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

  const isResearch = activeTab === 'research'
  const hasSidebar = activeTab === 'ventures' || activeTab === 'rl' || activeTab === 'quant'

  return (
    <div className={`h-full flex flex-col min-h-0`}>
      {/* Primary tabs */}
      <div className="flex gap-1 border-b border-rule shrink-0">
        {([
          { key: 'plan' as const, label: 'Plan' },
          { key: 'execute' as const, label: 'Execute' },
          { key: 'ventures' as const, label: 'Ventures' },
          { key: 'capital' as const, label: 'Capital' },
          { key: 'research' as const, label: 'Research' },
          { key: 'rl' as const, label: 'RL' },
          { key: 'quant' as const, label: 'Quant' },
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
      <div className={`flex-1 min-h-0 ${
        hasSidebar ? 'grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3' : ''
      }`}>
        {activeTab === 'plan' && (
          <div className="overflow-y-auto">
            <WeeklyPlanView />
          </div>
        )}

        {activeTab === 'execute' && (
          <div className="overflow-y-auto">
            <ExecutionView />
          </div>
        )}

        {activeTab === 'ventures' && (
          <>
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
          </>
        )}

        {activeTab === 'capital' && (
          <div className="flex flex-col min-h-0 overflow-y-auto">
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

        {activeTab === 'research' && (
          <div className="overflow-y-auto">
            <ResearchNorthStarView />
          </div>
        )}

        {activeTab === 'rl' && (
          <>
            <div className="flex flex-col min-h-0">
              <div className="flex gap-1 border-b border-rule-light shrink-0 mt-1">
                {([
                  { key: 'transitions' as const, label: 'Transitions' },
                  { key: 'policy' as const, label: 'Policy' },
                  { key: 'audit' as const, label: 'Audit' },
                  { key: 'lab' as const, label: 'Lab' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setRlSubTab(tab.key)}
                    className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
                      rlSubTab === tab.key
                        ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {rlSubTab === 'transitions' && <TransitionsView />}
                {rlSubTab === 'policy' && <PolicyView />}
                {rlSubTab === 'audit' && (
                  <div className="space-y-3 py-1">
                    <AuditView />
                    <ValueView />
                    <CalibrationView />
                    <GovernanceLedger />
                  </div>
                )}
                {rlSubTab === 'lab' && (
                  <div className="space-y-3 py-1">
                    <ConceptsView />
                    <RoleLabView />
                  </div>
                )}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <RLStatusDial />
            </div>
          </>
        )}

        {activeTab === 'quant' && (
          <>
            <div className="flex flex-col min-h-0">
              <div className="flex gap-1 border-b border-rule-light shrink-0 mt-1">
                {([
                  { key: 'path' as const, label: 'Quant Path' },
                  { key: 'lab' as const, label: 'Research Lab' },
                  { key: 'surface' as const, label: 'Surface Area' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setQuantSubTab(tab.key)}
                    className={`font-serif text-[11px] font-medium px-2 py-1 transition-colors ${
                      quantSubTab === tab.key
                        ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {quantSubTab === 'path' && <QuantPathView />}
                {quantSubTab === 'lab' && <QuantLabView />}
                {quantSubTab === 'surface' && <SurfaceAreaView />}
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <QuantDial />
            </div>
          </>
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
