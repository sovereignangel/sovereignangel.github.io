'use client'

import { useMemo } from 'react'
import type { SummerPlan, PlanVote } from '@/lib/types'
import { computePlanScore, rankPlans, computeCombinedSummary } from '@/lib/adventure-preferences'
import { computePlanStats } from '@/lib/adventure-scheming'
import { VoteBreakdown } from './VoteBreakdown'

interface PrioritiesViewProps {
  plans: SummerPlan[]
  votes: PlanVote[]
}

export function PrioritiesView({ plans, votes }: PrioritiesViewProps) {
  const { scores, ranked, summary } = useMemo(() => {
    // Group votes by plan
    const votesByPlan = new Map<string, PlanVote[]>()
    votes.forEach((v) => {
      if (!votesByPlan.has(v.planId)) {
        votesByPlan.set(v.planId, [])
      }
      votesByPlan.get(v.planId)!.push(v)
    })

    // Compute scores
    const planScores = Array.from(votesByPlan.values()).map(computePlanScore)
    const ranked = rankPlans(planScores)
    const summary = computeCombinedSummary(votes)

    return { scores: planScores, ranked, summary }
  }, [votes])

  const planMap = new Map(plans.map((p) => [p.id, p]))

  return (
    <div className="space-y-6">
      {/* Summary */}
      {votes.length > 0 && (
        <div style={{ padding: '24px', background: '#ebe4d4', borderRadius: '8px' }}>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#b85c38',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Preference Summary
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#8a7e72', marginBottom: '4px' }}>Total Swipes</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#2a2420' }}>{summary.totalVotes}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#8a7e72', marginBottom: '4px' }}>Alignment</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#2a2420' }}>
                {summary.alignmentScore || '—'}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#8a7e72', marginBottom: '4px' }}>Loves</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#b85c38' }}>❤️ {summary.rightCount}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#8a7e72', marginBottom: '4px' }}>Maybes</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#8a7e72' }}>? {summary.maybeCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Ranked Queue */}
      <div>
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#b85c38',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Top Plans (Ranked by Votes)
        </h3>

        {ranked.length === 0 ? (
          <div style={{ padding: '24px', background: '#faf8f4', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#8a7e72', fontSize: '13px' }}>No swipes yet. Start playing to see rankings!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ranked.slice(0, 10).map((score, idx) => {
              const plan = planMap.get(score.planId)
              if (!plan) return null

              const stats = computePlanStats(plan)

              return (
                <div
                  key={score.planId}
                  style={{
                    padding: '16px',
                    background: '#faf8f4',
                    border: '1px solid #d8cfc4',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#2a2420' }}>
                      #{idx + 1} {plan.phases[0]?.name} → {plan.phases[plan.phases.length - 1]?.name}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <VoteBreakdown planId={score.planId} votes={votes} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '10px' }}>
                    <div>
                      <span style={{ color: '#8a7e72' }}>Kiting:</span> {Math.round(stats.kitingHours)}h
                    </div>
                    <div>
                      <span style={{ color: '#8a7e72' }}>Cycling:</span> {Math.round(stats.cyclingMiles)}mi
                    </div>
                    <div>
                      <span style={{ color: '#8a7e72' }}>Budget:</span> ${stats.budget.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
