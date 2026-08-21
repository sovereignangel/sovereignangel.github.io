'use client'

import { useState } from 'react'
import FinancesOverview from '@/components/thesis/finances/FinancesOverview'
import FinancesLedger from '@/components/thesis/finances/FinancesLedger'
import FinancesImport from '@/components/thesis/finances/FinancesImport'
import CollateralView from '@/components/thesis/finances/CollateralView'
import TaxesView from '@/components/thesis/finances/TaxesView'

type FinancesTab = 'overview' | 'ledger' | 'import' | 'collateral' | 'taxes'

const TABS: { key: FinancesTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'ledger', label: 'Ledger' },
  { key: 'import', label: 'Import' },
  { key: 'collateral', label: 'Collateral' },
  { key: 'taxes', label: 'Taxes' },
]

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<FinancesTab>('overview')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex gap-1 border-b border-rule shrink-0">
        {TABS.map(tab => (
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

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && <FinancesOverview key={refreshKey} />}
        {activeTab === 'ledger' && <FinancesLedger key={refreshKey} />}
        {activeTab === 'import' && <FinancesImport onImported={() => setRefreshKey(k => k + 1)} />}
        {activeTab === 'collateral' && <CollateralView />}
        {activeTab === 'taxes' && <TaxesView />}
      </div>
    </div>
  )
}
