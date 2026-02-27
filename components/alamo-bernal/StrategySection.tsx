'use client'

import { useState, useEffect } from 'react'
import {
  getProposalPhases,
  getFinancialScenarios,
  getScalingMilestones,
} from '@/lib/alamo-bernal/firestore'
import {
  PROPOSAL_PHASES,
  FINANCIAL_SCENARIOS,
  SCALING_MILESTONES,
} from '@/lib/alamo-bernal/seed-data'
import type {
  ProposalPhase,
  FinancialScenario,
  ScalingMilestone,
  ValueMetric,
  PhaseStatus,
} from '@/lib/alamo-bernal/types'

const PHASE_STATUS_COLORS: Record<PhaseStatus, string> = {
  proposed: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  active: 'text-green-ink bg-green-bg border-green-ink/20',
  completed: 'text-ink-muted bg-cream border-rule',
  future: 'text-ink-muted bg-paper border-rule',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

export default function StrategySection() {
  const [phases, setPhases] = useState<ProposalPhase[]>(PROPOSAL_PHASES)
  const [scenarios, setScenarios] = useState<FinancialScenario[]>(FINANCIAL_SCENARIOS)
  const [milestones, setMilestones] = useState<ScalingMilestone[]>(SCALING_MILESTONES)

  useEffect(() => {
    async function load() {
      try {
        const [p, s, m] = await Promise.all([
          getProposalPhases(),
          getFinancialScenarios(),
          getScalingMilestones(),
        ])
        if (p.length > 0) setPhases(p)
        if (s.length > 0) setScenarios(s)
        if (m.length > 0) setMilestones(m)
      } catch {
        // Fall back to seed data
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-3">
      {/* ── Phased Proposal ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Phased Proposal
        </div>
        <div className="space-y-3">
          {phases.map((phase) => (
            <PhaseCard key={phase.id} phase={phase} />
          ))}
        </div>
      </div>

      {/* ── Financial Model ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Financial Model — AUM Scenarios
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 pr-3">Scenario</th>
                <th className="text-right font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2">AUM</th>
                <th className="text-right font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2">Monthly Div Rev</th>
                <th className="text-right font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2">Sean (10%)</th>
                <th className="text-right font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2">Lori</th>
                <th className="text-right font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2">Op. Costs</th>
                <th className="text-right font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2">Investor Returns</th>
                <th className="text-right font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 pl-2">Net to Fund</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id} className="border-b border-rule-light">
                  <td className="py-1.5 pr-3 font-semibold text-ink">{s.label}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-ink">{fmt(s.aum)}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-ink">{fmt(s.monthlyDividendRevenue)}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-green-ink">{fmt(s.seanMonthlyTake)}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-burgundy">{fmt(s.loriMonthlyTake)}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-ink-muted">{fmt(s.operatingCosts)}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-ink-muted">{s.investorReturns}</td>
                  <td className="py-1.5 pl-2 text-right font-mono text-ink font-semibold">{fmt(s.netToFund)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-ink-muted mt-2 italic">
          Note: Monthly dividend revenue assumes ~100% annualized return on AUM (based on historical performance). Lori&apos;s take evolves across phases — retainer in Phase 1, success fee in Phase 2, equity/rev-share in Phase 3.
        </p>
      </div>

      {/* ── Partnership Economics ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Partnership Economics
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-semibold text-ink mb-1">Core Constraint</div>
            <p className="text-[10px] text-ink leading-relaxed">
              Sean must still net <span className="font-mono font-semibold">$25K/month</span> at{' '}
              <span className="font-mono font-semibold">$250K/month</span> dividend revenue (10%).
              Any compensation for Lori comes from <span className="font-semibold">incremental value created</span>,
              not from Sean&apos;s existing take.
            </p>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-ink mb-1">Value Sources</div>
            <ul className="space-y-0.5">
              {[
                'Time savings → more hours for fundraising → faster AUM growth',
                'Better stock selection → higher dividend capture rate → more revenue',
                'Fundraising support → new capital → larger revenue base',
                'New strategies → additional revenue streams → fund diversification',
                'Risk reduction → lower drawdowns → better investor retention',
              ].map((item, i) => (
                <li key={i} className="text-[10px] text-ink flex items-start gap-1">
                  <span className="text-burgundy shrink-0">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-ink mb-1">Fee Evolution</div>
            <div className="space-y-1">
              <FeeRow phase="Phase 1" fee="Monthly retainer" note="For dedicated tech development" />
              <FeeRow phase="Phase 2" fee="Retainer + % of capital raised" note="Success-based alignment" />
              <FeeRow phase="Phase 3" fee="Equity + revenue share" note="Long-term partnership" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-ink mb-1">Skin in the Game</div>
            <p className="text-[10px] text-ink leading-relaxed">
              Lori invests personal capital into the fund on same terms as other investors.
              Amount TBD. This aligns incentives, demonstrates conviction, and signals
              credibility to future investors.
            </p>
          </div>
        </div>
      </div>

      {/* ── Scaling Vision ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Scaling Vision
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {milestones.map((ms) => (
            <MilestoneCard key={ms.id} milestone={ms} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function PhaseCard({ phase }: { phase: ProposalPhase }) {
  const statusColor = PHASE_STATUS_COLORS[phase.status]

  return (
    <div className="border border-rule rounded-sm p-3">
      {/* Phase header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] font-semibold text-burgundy bg-burgundy-bg border border-burgundy/20 px-1.5 py-0.5 rounded-sm">
            Phase {phase.phase}
          </span>
          <span className="text-[12px] font-semibold text-ink">{phase.title}</span>
          <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${statusColor}`}>
            {phase.status}
          </span>
        </div>
        <span className="text-[9px] text-ink-muted font-mono">{phase.timeline}</span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-ink leading-relaxed mb-2">{phase.description}</p>

      {/* Value Metrics (before → after) */}
      {phase.valueMetrics.length > 0 && (
        <div className="mb-2">
          <div className="text-[9px] font-semibold text-ink-muted uppercase mb-1">Value Metrics</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {phase.valueMetrics.map((vm, i) => (
              <ValueMetricRow key={i} metric={vm} />
            ))}
          </div>
        </div>
      )}

      {/* Deliverables */}
      <div className="mb-2">
        <div className="text-[9px] font-semibold text-ink-muted uppercase mb-0.5">Deliverables</div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
          {phase.deliverables.map((d, i) => (
            <li key={i} className="text-[10px] text-ink flex items-start gap-1">
              <span className="text-ink-muted shrink-0">-</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Gate to next */}
      <div className="border-t border-rule-light pt-1.5 mt-1.5">
        <span className="text-[9px] font-semibold text-ink-muted uppercase">Gate to next: </span>
        <span className="text-[9px] text-ink">{phase.gateToNext}</span>
      </div>
    </div>
  )
}

function ValueMetricRow({ metric }: { metric: ValueMetric }) {
  return (
    <div className="bg-cream/50 border border-rule-light rounded-sm px-2 py-1.5">
      <div className="text-[9px] font-semibold text-ink mb-0.5">{metric.label}</div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[9px] text-ink-muted line-through">{metric.before}</span>
        <span className="text-[9px] text-ink-muted">&rarr;</span>
        <span className="font-mono text-[9px] font-semibold text-green-ink">{metric.after}</span>
      </div>
      <div className="text-[8px] text-burgundy font-medium mt-0.5">{metric.impact}</div>
    </div>
  )
}

function FeeRow({ phase, fee, note }: { phase: string; fee: string; note: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="font-mono text-[9px] text-burgundy bg-burgundy-bg border border-burgundy/20 px-1 py-0.5 rounded-sm shrink-0">
        {phase}
      </span>
      <div>
        <span className="text-[10px] font-medium text-ink">{fee}</span>
        <span className="text-[9px] text-ink-muted ml-1">— {note}</span>
      </div>
    </div>
  )
}

function MilestoneCard({ milestone }: { milestone: ScalingMilestone }) {
  return (
    <div className="border border-rule rounded-sm p-2">
      <div className="font-mono text-[12px] font-bold text-burgundy mb-1.5">{milestone.aumThreshold}</div>

      <MilestoneSection label="Operations" items={milestone.operationalNeeds} />
      <MilestoneSection label="Infrastructure" items={milestone.infrastructureNeeds} />
      <MilestoneSection label="Compliance" items={milestone.complianceNeeds} />
      <MilestoneSection label="Team" items={milestone.teamNeeds} />
      <MilestoneSection label="Technology" items={milestone.technologyDeliverables} />
    </div>
  )
}

function MilestoneSection({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="mb-1.5">
      <div className="text-[9px] font-semibold text-ink-muted uppercase mb-0.5">{label}</div>
      <ul className="space-y-0">
        {items.map((item, i) => (
          <li key={i} className="text-[9px] text-ink flex items-start gap-1">
            <span className="text-ink-faint shrink-0">-</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
