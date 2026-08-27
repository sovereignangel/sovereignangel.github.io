'use client'

import type { PlanVote } from '@/lib/types'
import { computePlanScore } from '@/lib/adventure-preferences'

interface VoteBreakdownProps {
  planId: string
  votes: PlanVote[]
}

export function VoteBreakdown({ planId, votes }: VoteBreakdownProps) {
  const planVotes = votes.filter((v) => v.planId === planId)
  const score = computePlanScore(planVotes)

  const loriVotes = planVotes.filter((v) => v.user === 'lori')
  const aidasVotes = planVotes.filter((v) => v.user === 'aidas')

  const renderVoteEmoji = (vote: string) => {
    if (vote === 'right') return '❤️'
    if (vote === 'maybe') return '?'
    if (vote === 'left') return '👋'
    return '—'
  }

  return (
    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', alignItems: 'center' }}>
      {/* Lori's votes */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <span style={{ color: '#B39D85', minWidth: '24px' }}>Lori:</span>
        {loriVotes.length === 0 ? (
          <span style={{ color: '#836F5C' }}>—</span>
        ) : (
          loriVotes.map((v, i) => (
            <span key={i} title={v.feedback}>
              {renderVoteEmoji(v.vote)}
            </span>
          ))
        )}
      </div>

      {/* Aidas's votes */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <span style={{ color: '#B39D85', minWidth: '32px' }}>Aidas:</span>
        {aidasVotes.length === 0 ? (
          <span style={{ color: '#836F5C' }}>—</span>
        ) : (
          aidasVotes.map((v, i) => (
            <span key={i} title={v.feedback}>
              {renderVoteEmoji(v.vote)}
            </span>
          ))
        )}
      </div>

      {/* Combined score */}
      <div style={{ marginLeft: '8px', paddingLeft: '8px', borderLeft: '1px solid #3E2C20' }}>
        <span style={{ fontWeight: 600, color: '#6FA3CE' }}>{score.score} pts</span>
      </div>
    </div>
  )
}
