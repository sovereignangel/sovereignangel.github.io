'use client'

import GoalsGauge from '@/components/thesis/goals/GoalsGauge'
import GoalsDial from '@/components/thesis/goals/GoalsDial'

export default function GoalsPage() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <GoalsGauge />
      <GoalsDial />
    </div>
  )
}
