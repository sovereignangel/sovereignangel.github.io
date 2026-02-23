'use client'

import type { VentureBuildStatus } from '@/lib/types'

const STEPS: { key: VentureBuildStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'generating', label: 'Generating' },
  { key: 'pushing', label: 'Pushing' },
  { key: 'deploying', label: 'Deploying' },
  { key: 'live', label: 'Live' },
]

const STEP_ORDER: Record<VentureBuildStatus, number> = {
  pending: 0,
  generating: 1,
  pushing: 2,
  deploying: 3,
  live: 4,
  failed: -1,
}

export default function BuildStatusBar({ status }: { status: VentureBuildStatus }) {
  const currentIdx = STEP_ORDER[status]
  const isFailed = status === 'failed'

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isCompleted = currentIdx > idx
        const isActive = currentIdx === idx && !isFailed
        const isCurrent = step.key === status

        return (
          <div key={step.key} className="flex items-center">
            {idx > 0 && (
              <div className={`w-6 h-px ${isCompleted ? 'bg-burgundy' : 'bg-rule'}`} />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`w-2 h-2 rounded-full border ${
                  isFailed && isCurrent
                    ? 'bg-red-ink border-red-ink'
                    : isCompleted
                    ? 'bg-burgundy border-burgundy'
                    : isActive
                    ? 'bg-burgundy border-burgundy animate-pulse'
                    : 'bg-transparent border-rule'
                }`}
              />
              <span className={`font-mono text-[8px] ${
                isCompleted || isActive ? 'text-burgundy' : isFailed && isCurrent ? 'text-red-ink' : 'text-ink-faint'
              }`}>
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
