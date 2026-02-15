'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NetWorthMilestone {
  year: number
  target: number
  revenue: number
  description: string
}

const milestones: NetWorthMilestone[] = [
  { year: 2026, target: 150000, revenue: 15000, description: '$100k cash + $50k investments' },
  { year: 2027, target: 500000, revenue: 40000, description: '$300k cash + $200k investments' },
  { year: 2028, target: 1500000, revenue: 100000, description: 'Business scaling + investments' },
  { year: 2029, target: 4000000, revenue: 200000, description: 'Multiple income streams + real estate' },
  { year: 2030, target: 10000000, revenue: 250000, description: 'Financial independence achieved' }
]

export default function ElitePage() {
  const [currentNetWorth, setCurrentNetWorth] = useState(0)
  const [currentMRR, setCurrentMRR] = useState(6000)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadCurrentMetrics()
  }, [])

  async function loadCurrentMetrics() {
    // Get latest revenue data
    const { data: revenueData } = await supabase
      .from('revenue_metrics')
      .select('mrr')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (revenueData) {
      setCurrentMRR(revenueData.mrr)
    }

    // Calculate current net worth (simplified - you'd track this properly)
    // For now, estimate from MRR * 12 * 0.7 (70% savings rate)
    const estimatedAnnualSavings = (revenueData?.mrr || 6000) * 12 * 0.7
    setCurrentNetWorth(estimatedAnnualSavings)

    setLoading(false)
  }

  const currentYear = new Date().getFullYear()
  const yearsRemaining = 2030 - currentYear
  const targetGrowthRate = currentNetWorth > 0
    ? Math.pow(10000000 / currentNetWorth, 1 / yearsRemaining) - 1
    : 0

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-8">
      {/* Header */}
      <div className="border-b border-rule pb-4">
        <h1 className="font-serif text-[24px] font-bold text-ink mb-2">
          $0 → $10M Net Worth Path
        </h1>
        <p className="font-sans text-[13px] text-ink-light leading-relaxed">
          Systematic wealth building through business scaling, investments, and compounding.
          Target: $10M+ by 2030.
        </p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-paper border border-rule rounded-sm p-4">
          <p className="font-serif text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-2">
            Current Net Worth
          </p>
          <p className="font-mono text-[28px] font-bold text-ink">
            ${(currentNetWorth / 1000).toFixed(0)}k
          </p>
          <p className="font-mono text-[10px] text-ink-faint mt-1">
            Estimated from savings rate
          </p>
        </div>

        <div className="bg-paper border border-rule rounded-sm p-4">
          <p className="font-serif text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-2">
            Current MRR
          </p>
          <p className="font-mono text-[28px] font-bold text-navy">
            ${(currentMRR / 1000).toFixed(1)}k
          </p>
          <p className="font-mono text-[10px] text-ink-faint mt-1">
            Monthly recurring revenue
          </p>
        </div>

        <div className="bg-paper border border-rule rounded-sm p-4">
          <p className="font-serif text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-2">
            Required Growth Rate
          </p>
          <p className="font-mono text-[28px] font-bold text-green-ink">
            {(targetGrowthRate * 100).toFixed(0)}%
          </p>
          <p className="font-mono text-[10px] text-ink-faint mt-1">
            Annual compounding needed
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-paper border border-rule rounded-sm p-6">
        <h2 className="font-serif text-[16px] font-semibold text-ink mb-4">
          5-Year Wealth Trajectory
        </h2>

        <div className="space-y-6">
          {milestones.map((milestone, index) => {
            const isPast = milestone.year < currentYear
            const isCurrent = milestone.year === currentYear
            const progress = currentNetWorth >= milestone.target ? 100
              : (currentNetWorth / milestone.target) * 100

            return (
              <div key={milestone.year} className="relative">
                {/* Year marker */}
                <div className="flex items-center gap-4 mb-2">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    progress >= 100 ? 'border-green-ink bg-green-ink/10' :
                    isCurrent ? 'border-navy bg-navy-bg' :
                    'border-rule-light bg-paper'
                  }`}>
                    <span className={`font-mono text-[13px] font-semibold ${
                      progress >= 100 ? 'text-green-ink' :
                      isCurrent ? 'text-navy' :
                      'text-ink-muted'
                    }`}>
                      {milestone.year}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className={`font-mono text-[20px] font-bold ${
                        progress >= 100 ? 'text-green-ink' :
                        isCurrent ? 'text-navy' :
                        'text-ink'
                      }`}>
                        ${(milestone.target / 1000).toFixed(0)}k
                      </span>
                      <span className="font-mono text-[11px] text-ink-muted">
                        ${(milestone.revenue / 1000).toFixed(0)}k MRR required
                      </span>
                    </div>
                    <p className="font-sans text-[12px] text-ink-light mb-2">
                      {milestone.description}
                    </p>

                    {/* Progress bar (only for current/future years) */}
                    {!isPast && (
                      <div className="h-2 bg-rule-light rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            progress >= 100 ? 'bg-green-ink' :
                            isCurrent ? 'bg-navy' :
                            'bg-rule'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {index < milestones.length - 1 && (
                  <div className="absolute left-6 top-12 w-px h-6 bg-rule-light" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Elite Skills Progress */}
      <div className="bg-paper border border-rule rounded-sm p-6">
        <h2 className="font-serif text-[16px] font-semibold text-ink mb-4">
          Elite Skills Development
        </h2>

        <div className="space-y-4">
          {[
            { skill: 'AI Research', current: 5, target: 9, description: 'World-class research: papers, expertise' },
            { skill: 'Business', current: 4, target: 8, description: 'Sales, fundraising, operations' },
            { skill: 'Communication', current: 6, target: 9, description: 'Writing, speaking, persuasion' }
          ].map(item => (
            <div key={item.skill}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-serif text-[13px] font-semibold text-ink">
                  {item.skill}
                </span>
                <span className="font-mono text-[11px] text-ink-muted">
                  {item.current}/10 → {item.target}/10
                </span>
              </div>
              <div className="h-2 bg-rule-light rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-navy transition-all"
                  style={{ width: `${(item.current / 10) * 100}%` }}
                />
              </div>
              <p className="font-sans text-[10px] text-ink-light">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Network & Influence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-paper border border-rule rounded-sm p-4">
          <h3 className="font-serif text-[14px] font-semibold text-ink mb-3">
            Network Quality
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-sans text-[11px] text-ink-light">VCs</span>
              <span className="font-mono text-[12px] text-ink">0/10</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-sans text-[11px] text-ink-light">Founders</span>
              <span className="font-mono text-[12px] text-ink">0/20</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-sans text-[11px] text-ink-light">Researchers</span>
              <span className="font-mono text-[12px] text-ink">0/10</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-sans text-[11px] text-ink-light">LPs</span>
              <span className="font-mono text-[12px] text-ink">0/30</span>
            </div>
          </div>
        </div>

        <div className="bg-paper border border-rule rounded-sm p-4">
          <h3 className="font-serif text-[14px] font-semibold text-ink mb-3">
            Public Influence
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-sans text-[11px] text-ink-light">Twitter Followers</span>
              <span className="font-mono text-[12px] text-ink">0/10k</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-sans text-[11px] text-ink-light">Published Papers</span>
              <span className="font-mono text-[12px] text-ink">0/1</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-sans text-[11px] text-ink-light">Podcast Appearances</span>
              <span className="font-mono text-[12px] text-ink">0/5</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-sans text-[11px] text-ink-light">Conference Talks</span>
              <span className="font-mono text-[12px] text-ink">0/3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy */}
      <div className="bg-navy-bg border border-navy/20 rounded-sm p-4">
        <p className="font-serif text-[11px] italic text-navy leading-relaxed">
          "The path from $0 to $10M is multiplicative, not additive. Each milestone compounds the next.
          Revenue → savings → investments → optionality → leverage → wealth.
          Ruin avoidance is primary. Systems over goals. Compounding over linear growth."
        </p>
      </div>
    </div>
  )
}
