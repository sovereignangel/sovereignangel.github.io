'use client'

import { REWARD_COMPONENT_META } from '@/lib/constants'

const PILLAR_BADGE_STYLES: Record<string, string> = {
  body: 'bg-green-bg text-green-ink border-green-ink/20',
  brain: 'bg-navy-bg text-navy border-navy/20',
  build: 'bg-burgundy-bg text-burgundy border-burgundy/20',
}

interface SubComponentBadgeProps {
  componentKey: string
  score?: number
}

export default function SubComponentBadge({ componentKey, score }: SubComponentBadgeProps) {
  const meta = REWARD_COMPONENT_META[componentKey]
  if (!meta) return null

  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${PILLAR_BADGE_STYLES[meta.pillar]}`}>
      <span className="font-semibold">{meta.symbol}</span>
      {score !== undefined && (
        <span>{(score * 100).toFixed(0)}</span>
      )}
    </span>
  )
}
