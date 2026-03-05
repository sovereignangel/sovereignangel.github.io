'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { saveSignal } from '@/lib/firestore'
import PillarBriefCard from '@/components/thesis/intelligence/PillarBriefCard'
import PillarResearchFeed from '@/components/thesis/intelligence/PillarResearchFeed'
import IntelligenceGauge from '@/components/thesis/intelligence/IntelligenceGauge'
import CRMView from '@/components/thesis/crm/CRMView'
import SemanticSearch from '@/components/thesis/search/SemanticSearch'
import type { ThesisPillarExtended } from '@/lib/types/pillar-brief'
import type { SignalType } from '@/lib/types'

const PILLARS: Array<{ key: ThesisPillarExtended; label: string }> = [
  { key: 'ai', label: 'AI' },
  { key: 'markets', label: 'Markets' },
  { key: 'mind', label: 'Mind' },
  { key: 'emergence', label: 'Emergence' },
]

const SIGNAL_TYPES: { value: SignalType; label: string }[] = [
  { value: 'arbitrage', label: 'Arb' },
  { value: 'problem', label: 'Prob' },
  { value: 'market', label: 'Mkt' },
  { value: 'research', label: 'Res' },
]

type ActiveTab = 'briefing' | 'signals' | 'network' | 'search'

const TABS: Array<{ key: ActiveTab; label: string }> = [
  { key: 'briefing', label: 'Briefing' },
  { key: 'signals', label: 'Signals' },
  { key: 'network', label: 'Network' },
  { key: 'search', label: 'Search' },
]

export default function IntelligencePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('briefing')
  const [activePillar, setActivePillar] = useState<ThesisPillarExtended>('ai')

  // Inline signal form
  const [signalTitle, setSignalTitle] = useState('')
  const [signalType, setSignalType] = useState<SignalType>('arbitrage')
  const [signalDesc, setSignalDesc] = useState('')
  const [signalSaving, setSignalSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSaveSignal = useCallback(async () => {
    if (!user || !signalTitle.trim()) return
    setSignalSaving(true)
    await saveSignal(user.uid, {
      title: signalTitle.trim(),
      signalType,
      description: signalDesc.trim(),
    })
    setSignalTitle('')
    setSignalDesc('')
    setSignalSaving(false)
    setRefreshKey(k => k + 1)
  }, [user, signalTitle, signalType, signalDesc])

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-rule shrink-0 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`font-serif text-[16px] py-2 transition-colors ${
              activeTab === t.key
                ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2">

        {/* Briefing */}
        {activeTab === 'briefing' && (
          <div className="space-y-3">
            <div className="flex gap-1">
              {PILLARS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActivePillar(p.key)}
                  className={`font-serif text-[11px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                    activePillar === p.key
                      ? 'bg-burgundy text-paper border-burgundy'
                      : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <PillarBriefCard pillar={activePillar} />
            <PillarResearchFeed pillar={activePillar} />
          </div>
        )}

        {/* Signals */}
        {activeTab === 'signals' && (
          <div className="space-y-3">
            <div className="bg-white border border-rule rounded-sm p-3">
              <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule">
                Capture Signal
              </div>
              <div className="flex gap-1 mb-2">
                {SIGNAL_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSignalType(type.value)}
                    className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                      signalType === type.value
                        ? 'bg-burgundy text-paper border-burgundy'
                        : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={signalTitle}
                  onChange={(e) => setSignalTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSignal()}
                  className="flex-1 font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                  placeholder="What did you notice?"
                />
                <input
                  type="text"
                  value={signalDesc}
                  onChange={(e) => setSignalDesc(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSignal()}
                  className="flex-1 font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                  placeholder="Why it matters..."
                />
                <button
                  onClick={handleSaveSignal}
                  disabled={signalSaving || !signalTitle.trim()}
                  className="bg-burgundy text-paper font-serif text-[9px] font-semibold rounded-sm px-3 py-1 hover:bg-burgundy/90 transition-colors disabled:opacity-50"
                >
                  {signalSaving ? '...' : 'Save'}
                </button>
              </div>
            </div>
            <IntelligenceGauge refreshKey={refreshKey} />
          </div>
        )}

        {/* Network */}
        {activeTab === 'network' && <CRMView />}

        {/* Search */}
        {activeTab === 'search' && <SemanticSearch />}
      </div>
    </div>
  )
}
