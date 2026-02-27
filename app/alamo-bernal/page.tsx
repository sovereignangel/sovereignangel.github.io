'use client'

import { useState } from 'react'
import ABNav from '@/components/alamo-bernal/ABNav'
import IntelligenceSection from '@/components/alamo-bernal/IntelligenceSection'
import StrategySection from '@/components/alamo-bernal/StrategySection'
import ExecutionSection from '@/components/alamo-bernal/ExecutionSection'
import type { ABTab } from '@/lib/alamo-bernal/types'

export default function AlamoBernalPage() {
  const [activeTab, setActiveTab] = useState<ABTab>('intelligence')

  return (
    <>
      <ABNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-3">
          {activeTab === 'intelligence' && <IntelligenceSection />}
          {activeTab === 'strategy' && <StrategySection />}
          {activeTab === 'execution' && <ExecutionSection />}
        </div>
      </main>
    </>
  )
}
