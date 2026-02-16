'use client'

import EliteGauge from '@/components/thesis/elite/EliteGauge'
import EliteDial from '@/components/thesis/elite/EliteDial'

export default function ElitePage() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <EliteGauge />
      <EliteDial />
    </div>
  )
}
