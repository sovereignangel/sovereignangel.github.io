'use client'

import { REWARD_PILLARS } from '@/lib/constants'
import type { PillarKey } from '@/lib/constants'

const PILLAR_STYLES: Record<PillarKey, string> = {
  body: 'bg-green-bg text-green-ink border-green-ink/20',
  brain: 'bg-navy-bg text-navy border-navy/20',
  build: 'bg-burgundy-bg text-burgundy border-burgundy/20',
}

interface PillarBadgeProps {
  pillar: PillarKey
  score?: number
  size?: 'sm' | 'md'
}

export default function PillarBadge({ pillar, score, size = 'sm' }: PillarBadgeProps) {
  const config = REWARD_PILLARS.find(p => p.key === pillar)
  if (!config) return null

  const textSize = size === 'sm' ? 'text-[8px]' : 'text-[9px]'
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-0.5'

  return (
    <span className={`inline-flex items-center gap-1 font-mono ${textSize} uppercase ${padding} rounded-sm border ${PILLAR_STYLES[pillar]}`}>
      <span className="font-semibold">{config.label}</span>
      {score !== undefined && (
        <span>{(score * 100).toFixed(0)}</span>
      )}
    </span>
  )
}
