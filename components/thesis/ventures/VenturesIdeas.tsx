'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getVentures } from '@/lib/firestore'
import type { Venture } from '@/lib/types'

const STAGE_COLORS: Record<string, string> = {
  idea: 'text-ink-muted border-rule',
  specced: 'text-burgundy border-burgundy/20 bg-burgundy-bg',
  building: 'text-amber-ink border-amber-ink/20 bg-amber-bg',
  deployed: 'text-green-ink border-green-ink/20 bg-green-bg',
  archived: 'text-ink-faint border-rule',
}

export default function VenturesIdeas({ onSelectVenture }: { onSelectVenture: (id: string) => void }) {
  const { user } = useAuth()
  const [ventures, setVentures] = useState<Venture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getVentures(user.uid).then(v => {
      setVentures(v)
      setLoading(false)
    })
  }, [user])

  if (loading) {
    return <div className="p-3 text-[11px] text-ink-muted">Loading...</div>
  }

  if (ventures.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="font-serif text-[13px] text-ink-muted">No ventures yet</p>
      </div>
    )
  }

  return (
    <div className="p-3">
      <table className="w-full">
        <thead>
          <tr className="border-b border-rule">
            <th className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-left py-1.5 pr-2">Name</th>
            <th className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-left py-1.5 pr-2 hidden lg:table-cell">One-Liner</th>
            <th className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-center py-1.5 pr-2">Stage</th>
            <th className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-right py-1.5">Score</th>
          </tr>
        </thead>
        <tbody>
          {ventures.map(v => (
            <tr
              key={v.id}
              onClick={() => onSelectVenture(v.id!)}
              className="border-b border-rule hover:bg-cream cursor-pointer transition-colors"
            >
              <td className="py-1.5 pr-2">
                <span className="font-serif text-[11px] font-semibold text-ink">{v.spec.name}</span>
              </td>
              <td className="py-1.5 pr-2 hidden lg:table-cell">
                <span className="font-mono text-[9px] text-ink-muted line-clamp-1">{v.spec.oneLiner}</span>
              </td>
              <td className="py-1.5 pr-2 text-center">
                <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${STAGE_COLORS[v.stage] || 'text-ink-muted border-rule'}`}>
                  {v.stage}
                </span>
              </td>
              <td className="py-1.5 text-right">
                <span className={`font-mono text-[10px] font-semibold ${
                  v.score === null ? 'text-ink-faint'
                  : v.score >= 70 ? 'text-green-ink'
                  : v.score >= 40 ? 'text-amber-ink'
                  : 'text-red-ink'
                }`}>
                  {v.score !== null ? v.score : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
