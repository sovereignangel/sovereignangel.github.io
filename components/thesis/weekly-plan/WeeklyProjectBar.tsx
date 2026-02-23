'use client'

import type { WeeklyProjectAllocation } from '@/lib/types'

interface WeeklyProjectBarProps {
  projects: WeeklyProjectAllocation[]
}

export default function WeeklyProjectBar({ projects }: WeeklyProjectBarProps) {
  if (projects.length === 0) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
      {projects.map(p => (
        <div
          key={p.projectName}
          className="p-2.5 bg-paper border border-rule rounded-sm"
          style={{ borderTopWidth: '2px', borderTopColor: p.color }}
        >
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-sm inline-block"
            style={{ color: p.color, backgroundColor: p.color + '14' }}
          >
            {p.role}
          </span>
          <div className="font-serif text-[14px] font-semibold text-ink mt-1">{p.projectName}</div>
          <div className="font-mono text-[10px] text-ink-muted mt-0.5">{p.description}</div>
        </div>
      ))}
    </div>
  )
}
