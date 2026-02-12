'use client'

import OutputGauge from '@/components/thesis/output/OutputGauge'
import OutputDial from '@/components/thesis/output/OutputDial'

export default function OutputPage() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <OutputGauge />
      <OutputDial />
    </div>
  )
}
