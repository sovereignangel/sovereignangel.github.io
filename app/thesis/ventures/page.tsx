'use client'

import { useState } from 'react'
import VenturesPipeline from '@/components/thesis/ventures/VenturesPipeline'
import VentureDetail from '@/components/thesis/ventures/VentureDetail'
import VenturesIdeas from '@/components/thesis/ventures/VenturesIdeas'
import VenturesDial from '@/components/thesis/ventures/VenturesDial'

type VenturesTab = 'pipeline' | 'ideas' | 'detail'

const TABS: { key: Exclude<VenturesTab, 'detail'>; label: string }[] = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'ideas', label: 'Ideas' },
]

export default function VenturesPage() {
  const [activeTab, setActiveTab] = useState<VenturesTab>('pipeline')
  const [selectedVentureId, setSelectedVentureId] = useState<string | null>(null)

  const handleSelectVenture = (id: string) => {
    setSelectedVentureId(id)
    setActiveTab('detail')
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3 min-h-0">
      {/* Left Panel */}
      <div className="flex flex-col gap-1 min-h-0">
        {/* Sub-tab Navigation */}
        <div className="flex gap-1 border-b border-rule shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-serif text-[13px] font-medium px-3 py-1.5 transition-colors ${
                activeTab === tab.key || (activeTab === 'detail' && tab.key === 'pipeline')
                  ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {activeTab === 'detail' && selectedVentureId && (
            <span className="font-serif text-[13px] font-semibold px-3 py-1.5 text-burgundy border-b-2 border-burgundy -mb-px">
              Detail
            </span>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'pipeline' && (
            <VenturesPipeline onSelectVenture={handleSelectVenture} />
          )}
          {activeTab === 'ideas' && (
            <VenturesIdeas onSelectVenture={handleSelectVenture} />
          )}
          {activeTab === 'detail' && selectedVentureId && (
            <VentureDetail
              ventureId={selectedVentureId}
              onBack={() => setActiveTab('pipeline')}
            />
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="min-h-0 overflow-y-auto">
        <VenturesDial selectedVentureId={selectedVentureId} />
      </div>
    </div>
  )
}
