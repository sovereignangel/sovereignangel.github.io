'use client'

import EnergyGauge from '@/components/thesis/energy/EnergyGauge'
import EnergyDial from '@/components/thesis/energy/EnergyDial'

export default function EnergyPage() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <EnergyGauge />
      <EnergyDial />
    </div>
  )
}
