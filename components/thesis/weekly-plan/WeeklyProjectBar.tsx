'use client'

import type { WeeklyProjectAllocation } from '@/lib/types'

interface WeeklyProjectBarProps {
  projects: WeeklyProjectAllocation[]
}

export default function WeeklyProjectBar({ projects }: WeeklyProjectBarProps) {
  if (projects.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {projects.map(p => (
        <div
          key={p.projectName}
          className="flex items-center gap-1.5 px-2 py-1 bg-paper border border-rule rounded-sm"
          style={{ borderLeftWidth: '2px', borderLeftColor: p.color }}
        >
          <span
            className="font-mono text-[7px] font-semibold uppercase tracking-[0.5px] px-1 py-px rounded-sm"
            style={{ color: p.color, backgroundColor: p.color + '14' }}
          >
            {p.role}
          </span>
          <span className="font-serif text-[10px] font-semibold text-ink">{p.projectName}</span>
        </div>
      ))}
    </div>
  )
}
