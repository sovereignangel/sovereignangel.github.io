'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getVentures } from '@/lib/firestore'
import type { Venture, VentureStage } from '@/lib/types'
import BuildStatusBar from './BuildStatusBar'

const STAGES: { key: VentureStage; label: string }[] = [
  { key: 'idea', label: 'Idea' },
  { key: 'specced', label: 'Specced' },
  { key: 'validated', label: 'Validated' },
  { key: 'prd_draft', label: 'PRD Draft' },
  { key: 'prd_approved', label: 'Approved' },
  { key: 'building', label: 'Building' },
  { key: 'deployed', label: 'Deployed' },
  { key: 'archived', label: 'Archived' },
]

function VentureCard({ venture, onClick }: { venture: Venture; onClick: () => void }) {
  const scoreColor = venture.score === null ? 'text-ink-muted'
    : venture.score >= 70 ? 'text-green-ink'
    : venture.score >= 40 ? 'text-amber-ink'
    : 'text-red-ink'

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-rule rounded-sm p-2 hover:border-ink-faint transition-colors"
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-serif text-[11px] font-semibold text-ink leading-tight">
          {venture.spec.name}
        </span>
        {venture.score !== null && (
          <span className={`font-mono text-[10px] font-semibold ${scoreColor} shrink-0`}>
            {venture.score}
          </span>
        )}
      </div>
      <p className="font-mono text-[9px] text-ink-muted leading-snug line-clamp-2 mb-1.5">
        {venture.spec.oneLiner}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
          {venture.spec.category}
        </span>
        {venture.spec.thesisPillars.map(p => (
          <span key={p} className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border bg-cream text-ink-muted border-rule">
            {p}
          </span>
        ))}
      </div>
      {venture.build.status !== 'pending' && (
        <div className="mt-1.5 pt-1 border-t border-rule">
          <BuildStatusBar status={venture.build.status} />
        </div>
      )}
      {venture.memo && (
        <div className="mt-1.5 pt-1 border-t border-rule">
          <a
            href={`/memo/${venture.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="font-mono text-[8px] text-burgundy hover:underline"
          >
            View Pitch Memo &rarr;
          </a>
        </div>
      )}
    </button>
  )
}

export default function VenturesPipeline({ onSelectVenture }: { onSelectVenture: (id: string) => void }) {
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
    return <div className="p-3 text-[11px] text-ink-muted">Loading ventures...</div>
  }

  if (ventures.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="font-serif text-[13px] text-ink-muted mb-2">No ventures yet</p>
        <p className="font-mono text-[10px] text-ink-faint">
          Send /venture in Telegram to spec your first business idea
        </p>
      </div>
    )
  }

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {STAGES.map(stage => {
          const stageVentures = ventures.filter(v => v.stage === stage.key)
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  {stage.label}
                </span>
                <span className="font-mono text-[9px] text-ink-muted">
                  {stageVentures.length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {stageVentures.map(v => (
                  <VentureCard
                    key={v.id}
                    venture={v}
                    onClick={() => onSelectVenture(v.id!)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
