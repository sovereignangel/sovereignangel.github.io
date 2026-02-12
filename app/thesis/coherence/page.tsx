'use client'

import CoherenceGauge from '@/components/thesis/coherence/CoherenceGauge'
import CoherenceDial from '@/components/thesis/coherence/CoherenceDial'

export default function CoherencePage() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <CoherenceGauge />
      <CoherenceDial />
    </div>
  )
}
