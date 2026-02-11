'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import ProgressBar from './ProgressBar'

interface DailyThesisBannerProps {
  focusHoursActual: number
  focusHoursTarget: number
}

export default function DailyThesisBanner({ focusHoursActual, focusHoursTarget }: DailyThesisBannerProps) {
  const { profile } = useAuth()
  const spineProject = profile?.spineProject || 'Armstrong'

  return (
    <div className="bg-paper border border-rule rounded-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted mb-1">
            Today&apos;s Spine
          </p>
          <h2 className="font-serif text-[20px] font-bold text-ink tracking-tight">
            {spineProject}
          </h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-[15px] font-semibold text-navy">
            {focusHoursActual}h
          </p>
          <p className="font-serif text-[10px] italic text-ink-muted">
            of {focusHoursTarget}h allocated
          </p>
        </div>
      </div>
      <ProgressBar current={focusHoursActual} target={focusHoursTarget} showValues={false} />
    </div>
  )
}
