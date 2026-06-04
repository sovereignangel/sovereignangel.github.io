'use client'

import type { SummerPlan, PlanVote } from '@/lib/types'
import { computePlanStats } from '@/lib/adventure-scheming'

interface PreferenceInsightsProps {
  plans: SummerPlan[]
  votes: PlanVote[]
}

export function PreferenceInsights({ plans, votes }: PreferenceInsightsProps) {
  if (votes.length === 0) {
    return null
  }

  // Analyze loved plans
  const lovedPlanIds = new Set(votes.filter((v) => v.vote === 'right').map((v) => v.planId))
  const lovedPlans = plans.filter((p) => lovedPlanIds.has(p.id))

  // Compute average stats of loved plans
  const lovedStats = lovedPlans.map(computePlanStats)
  const avgKiting = lovedPlans.length > 0 ? lovedStats.reduce((sum, s) => sum + s.kitingHours, 0) / lovedPlans.length : 0
  const avgCycling = lovedPlans.length > 0 ? lovedStats.reduce((sum, s) => sum + s.cyclingMiles, 0) / lovedPlans.length : 0
  const avgBudget = lovedPlans.length > 0 ? lovedStats.reduce((sum, s) => sum + s.budget, 0) / lovedPlans.length : 0

  // Extract themes from loved plans
  const themes = new Map<string, number>()
  lovedPlans.forEach((plan) => {
    plan.phases.forEach((phase) => {
      const name = phase.name.toLowerCase()
      themes.set(name, (themes.get(name) || 0) + 1)
    })
  })

  const topThemes = Array.from(themes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // Analyze blockers from left swipes
  const leftSwipes = votes.filter((v) => v.vote === 'left')
  const blockers = leftSwipes
    .filter((v) => v.feedback)
    .map((v) => v.feedback!)
    .slice(0, 3)

  return (
    <div style={{ padding: '20px', background: '#ebe4d4', borderRadius: '8px', marginTop: '20px' }}>
      <h3
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#b85c38',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        What You Love
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#8a7e72', marginBottom: '4px' }}>Avg Kiting Hours</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#2a2420' }}>{Math.round(avgKiting)}h</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#8a7e72', marginBottom: '4px' }}>Avg Cycling Miles</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#2a2420' }}>{Math.round(avgCycling)}mi</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#8a7e72', marginBottom: '4px' }}>Avg Budget</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#2a2420' }}>${(avgBudget / 1000).toFixed(1)}k</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#8a7e72', marginBottom: '4px' }}>Loved Plans</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#b85c38' }}>{lovedPlans.length}</div>
        </div>
      </div>

      {topThemes.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8a7e72', marginBottom: '8px' }}>TOP THEMES</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {topThemes.map(([theme, count]) => (
              <span
                key={theme}
                style={{
                  padding: '6px 12px',
                  background: '#b85c38',
                  color: '#faf8f4',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {theme} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {blockers.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#8a7e72', marginBottom: '8px' }}>BLOCKERS TO WATCH</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {blockers.map((blocker, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  background: '#faf8f4',
                  border: '1px solid #d8cfc4',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: '#8a7e72',
                }}
              >
                {blocker}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
