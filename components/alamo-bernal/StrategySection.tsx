'use client'

import { useState, useEffect } from 'react'
import {
  getProposalPhases,
  getFinancialScenarios,
} from '@/lib/alamo-bernal/firestore'
import {
  PROPOSAL_PHASES,
  FINANCIAL_SCENARIOS,
} from '@/lib/alamo-bernal/seed-data'
import type {
  ProposalPhase,
  FinancialScenario,
  ValueMetric,
  ValueMapEntry,
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
  const [activePhase, setActivePhase] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        const [p, s] = await Promise.all([
          getProposalPhases(),
          getFinancialScenarios(),
        ])
        if (p.length > 0) setPhases(p)
        if (s.length > 0) setScenarios(s)
      } catch {
        // Fall back to seed data
      }
    }
    load()
  }, [])

  const currentPhase = phases.find((p) => p.phase === activePhase) ?? phases[0]

  return (
    <div className="space-y-3">
      {/* ── Partnership Phases ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Partnership Phases
        </div>

        {/* Phase tab bar */}
        <div className="flex gap-1 mb-3">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.phase)}
              className={`text-left px-3 py-1.5 rounded-sm border transition-colors flex-1 ${
                activePhase === phase.phase
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-[13px] font-medium">Phase {phase.phase}</span>
                <span className={`text-[11px] font-semibold ${
                  activePhase === phase.phase ? 'text-paper' : 'text-ink'
                }`}>
                  {phase.title}
                </span>
              </div>
              <div className={`text-[9px] leading-tight mt-0.5 ${
                activePhase === phase.phase ? 'text-paper/80' : 'text-ink-muted'
              }`}>
                {phase.subtitle}
              </div>
            </button>
          ))}
        </div>

        {/* Active phase content */}
        <PhaseContent phase={currentPhase} />
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
                <th className="text-right font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2">Op. Costs (est.)</th>
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
              <FeeRow phase="Phase 1" fee="Milestone-based from fund" note="Skin in the game" />
              <FeeRow phase="Phase 2" fee="Retainer + % of capital raised" note="Success-based alignment" />
              <FeeRow phase="Phase 3" fee="Equity + revenue share" note="Long-term partnership" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-ink mb-1">Skin in the Game</div>
            <p className="text-[10px] text-ink leading-relaxed">
              Sean allocates capital from the fund for Lori, distributed based on agreed technology milestones.
              This aligns incentives and lets Lori build conviction through real exposure to the strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function PhaseContent({ phase }: { phase: ProposalPhase }) {
  const statusColor = PHASE_STATUS_COLORS[phase.status]

  return (
    <div className="space-y-3">
      {/* Header: title + status + timeline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-ink">{phase.title}</span>
          <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${statusColor}`}>
            {phase.status}
          </span>
        </div>
        <span className="text-[9px] text-ink-muted font-mono">{phase.timeline}</span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-ink leading-relaxed">{phase.description}</p>

      {/* Value Map (Phase 1 only) */}
      {phase.valueMap && phase.valueMap.length > 0 && (
        <ValueMapTable entries={phase.valueMap} />
      )}

      {/* Value Metrics (before → after) */}
      {phase.valueMetrics.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-ink-muted uppercase mb-1">Value Metrics</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {phase.valueMetrics.map((vm, i) => (
              <ValueMetricRow key={i} metric={vm} />
            ))}
          </div>
        </div>
      )}

      {/* Two-column: Deliverables + Working Rhythm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-[9px] font-semibold text-ink-muted uppercase mb-0.5">Deliverables</div>
          <ul className="space-y-0.5">
            {phase.deliverables.map((d, i) => (
              <li key={i} className="text-[10px] text-ink flex items-start gap-1">
                <span className="text-ink-muted shrink-0">-</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
        {phase.workingRhythm && phase.workingRhythm.length > 0 && (
          <div>
            <div className="text-[9px] font-semibold text-ink-muted uppercase mb-0.5">Working Rhythm</div>
            <ul className="space-y-0.5">
              {phase.workingRhythm.map((item, i) => (
                <li key={i} className="text-[10px] text-ink flex items-start gap-1">
                  <span className="text-ink-muted shrink-0">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Scaling Notes */}
      {phase.scalingNotes && phase.scalingNotes.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-ink-muted uppercase mb-0.5">Infrastructure at This Stage</div>
          <ul className="space-y-0.5">
            {phase.scalingNotes.map((item, i) => (
              <li key={i} className="text-[10px] text-ink flex items-start gap-1">
                <span className="text-ink-muted shrink-0">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom row: terms + gate */}
      <div className="border-t border-rule-light pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <span className="text-[9px] font-semibold text-ink-muted uppercase">Financial Terms: </span>
          <span className="text-[9px] text-ink">{phase.financialTerms}</span>
        </div>
        <div>
          <span className="text-[9px] font-semibold text-ink-muted uppercase">Gate to Next: </span>
          <span className="text-[9px] text-ink">{phase.gateToNext}</span>
        </div>
      </div>
    </div>
  )
}

function ValueMapTable({ entries }: { entries: ValueMapEntry[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-ink mb-1.5 flex items-center gap-2">
        Value Map
        <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border text-amber-ink bg-amber-bg border-amber-ink/20">
          Draft Framework
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-rule">
              <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 pr-2 text-[9px]">Dimension</th>
              <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2 text-[9px]">Current</th>
              <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2 text-[9px]">With Tech</th>
              <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2 text-[9px]">Freed</th>
              <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 pl-2 text-[9px]">Impact</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i} className="border-b border-rule-light">
                <td className="py-1.5 pr-2 font-semibold text-ink">{entry.dimension}</td>
                <td className="py-1.5 px-2 text-ink-muted">{entry.current}</td>
                <td className="py-1.5 px-2 font-semibold text-green-ink">{entry.withTech}</td>
                <td className="py-1.5 px-2 font-mono text-burgundy">{entry.freed}</td>
                <td className="py-1.5 pl-2 text-ink">{entry.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.some((e) => e.note) && (
        <div className="mt-1.5 space-y-0.5">
          {entries
            .filter((e) => e.note)
            .map((entry, i) => (
              <p key={i} className="text-[9px] text-amber-ink italic border-l-2 border-amber-ink/30 pl-2">
                {entry.dimension}: {entry.note}
              </p>
            ))}
        </div>
      )}
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
