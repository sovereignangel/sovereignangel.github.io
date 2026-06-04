'use client'

import type { PersonDreamsConstraints } from '@/lib/types'

interface DreamsConstraintsSummaryProps {
  items: PersonDreamsConstraints[]
}

export function DreamsConstraintsSummary({ items }: DreamsConstraintsSummaryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-ink-muted">
        <p className="text-[11px]">No dreams or constraints recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.person} className="space-y-2">
          <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            {item.person === 'lori' ? 'Lori' : 'Aidas'}
          </h4>

          {item.dreams.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-muted">
                Dreams
              </div>
              <ul className="space-y-1">
                {item.dreams.map((dream, i) => (
                  <li key={i} className="text-[11px] text-ink leading-relaxed">
                    · {dream}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.constraints.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-muted">
                Constraints
              </div>
              <ul className="space-y-1">
                {item.constraints.map((constraint, i) => (
                  <li key={i} className="text-[11px] text-ink leading-relaxed">
                    · {constraint}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
