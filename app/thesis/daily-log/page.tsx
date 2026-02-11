'use client'

import DailyLogForm from '@/components/thesis/DailyLogForm'
import { todayString, dateFull } from '@/lib/formatters'

export default function DailyLogPage() {
  const today = todayString()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="font-serif text-[20px] font-bold text-ink tracking-tight">
          Daily Log
        </h2>
        <p className="font-serif text-[12px] italic text-ink-muted mt-1">
          {dateFull(today)}
        </p>
      </div>
      <DailyLogForm date={today} />
    </div>
  )
}
