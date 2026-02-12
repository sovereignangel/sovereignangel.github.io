'use client'

import IntelligenceGauge from '@/components/thesis/intelligence/IntelligenceGauge'
import IntelligenceDial from '@/components/thesis/intelligence/IntelligenceDial'

export default function IntelligencePage() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <IntelligenceGauge />
      <IntelligenceDial />
    </div>
  )
}
