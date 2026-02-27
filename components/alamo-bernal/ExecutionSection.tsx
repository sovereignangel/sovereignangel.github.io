'use client'

import { useState, useEffect } from 'react'
import {
  getRisks,
  getAgreementClauses,
  getActionItems,
} from '@/lib/alamo-bernal/firestore'
import {
  RISKS,
  AGREEMENT_CLAUSES,
  ACTION_ITEMS,
} from '@/lib/alamo-bernal/seed-data'
import type {
  Risk,
  AgreementClause,
  ActionItem,
  RiskCategory,
  ClauseStatus,
} from '@/lib/alamo-bernal/types'

const RISK_CATEGORY_COLORS: Record<RiskCategory, string> = {
  technology: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  operational: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  market: 'text-ink bg-cream border-rule',
  regulatory: 'text-red-ink bg-red-bg border-red-ink/20',
  partnership: 'text-green-ink bg-green-bg border-green-ink/20',
  execution: 'text-ink-muted bg-paper border-rule',
}

const CLAUSE_STATUS_COLORS: Record<ClauseStatus, string> = {
  draft: 'text-ink-muted bg-cream border-rule',
  proposed: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  agreed: 'text-green-ink bg-green-bg border-green-ink/20',
  needs_discussion: 'text-red-ink bg-red-bg border-red-ink/20',
}

const CLAUSE_STATUS_LABELS: Record<ClauseStatus, string> = {
  draft: 'Draft',
  proposed: 'Proposed',
  agreed: 'Agreed',
  needs_discussion: 'Needs Discussion',
}

function severityScore(r: Risk): number {
  return r.probability * r.impact
}

function severityLabel(score: number): { label: string; color: string } {
  if (score >= 15) return { label: 'Critical', color: 'text-red-ink' }
  if (score >= 9) return { label: 'High', color: 'text-amber-ink' }
  if (score >= 4) return { label: 'Medium', color: 'text-ink' }
  return { label: 'Low', color: 'text-green-ink' }
}

export default function ExecutionSection() {
  const [risks, setRisks] = useState<Risk[]>(RISKS)
  const [clauses, setClauses] = useState<AgreementClause[]>(AGREEMENT_CLAUSES)
  const [actions, setActions] = useState<ActionItem[]>(ACTION_ITEMS)
  const [expandedRisks, setExpandedRisks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      try {
        const [r, c, a] = await Promise.all([
          getRisks(),
          getAgreementClauses(),
          getActionItems(),
        ])
        if (r.length > 0) setRisks(r)
        if (c.length > 0) setClauses(c)
        if (a.length > 0) setActions(a)
      } catch {
        // Fall back to seed data
      }
    }
    load()
  }, [])

  const sortedRisks = [...risks].sort((a, b) => severityScore(b) - severityScore(a))
  const toggleRisk = (id: string) =>
    setExpandedRisks((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-3">
      {/* ── Risk Matrix Heatmap ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Risk Matrix
        </div>

        {/* Visual heatmap grid */}
        <div className="mb-3">
          <div className="flex gap-1 items-end">
            {/* Y-axis label */}
            <div className="flex flex-col items-center justify-center w-[60px] shrink-0">
              <span className="text-[8px] text-ink-muted uppercase tracking-[0.5px] -rotate-90 whitespace-nowrap">
                Impact &rarr;
              </span>
            </div>
            {/* Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-px">
                {[5, 4, 3, 2, 1].map((impact) =>
                  [1, 2, 3, 4, 5].map((prob) => {
                    const score = prob * impact
                    const risksInCell = sortedRisks.filter(
                      (r) => r.probability === prob && r.impact === impact
                    )
                    const bg =
                      score >= 15
                        ? 'bg-red-ink/15'
                        : score >= 9
                        ? 'bg-amber-ink/15'
                        : score >= 4
                        ? 'bg-ink/5'
                        : 'bg-green-ink/8'

                    return (
                      <div
                        key={`${prob}-${impact}`}
                        className={`aspect-square rounded-sm flex items-center justify-center relative ${bg}`}
                        title={`P:${prob} I:${impact} = ${score}`}
                      >
                        {risksInCell.length > 0 && (
                          <span className="font-mono text-[8px] font-bold text-ink">
                            {risksInCell.length}
                          </span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              <div className="flex justify-between mt-0.5 px-1">
                {[1, 2, 3, 4, 5].map((p) => (
                  <span key={p} className="text-[7px] text-ink-muted">{p}</span>
                ))}
              </div>
              <div className="text-center text-[8px] text-ink-muted uppercase tracking-[0.5px] mt-0.5">
                Probability &rarr;
              </div>
            </div>
          </div>
        </div>

        {/* Risk list */}
        <div className="space-y-1.5">
          {sortedRisks.map((risk) => {
            const score = severityScore(risk)
            const { label: sevLabel, color: sevColor } = severityLabel(score)
            const catColor = RISK_CATEGORY_COLORS[risk.category]
            const isExpanded = !!expandedRisks[risk.id]

            return (
              <div key={risk.id} className="border border-rule rounded-sm">
                <button
                  onClick={() => toggleRisk(risk.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-cream/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${catColor}`}>
                      {risk.category}
                    </span>
                    <span className="text-[10px] font-medium text-ink text-left">{risk.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-[9px] font-semibold ${sevColor}`}>
                      {sevLabel} ({score})
                    </span>
                    <span className="font-mono text-[8px] text-ink-muted uppercase">
                      {risk.owner}
                    </span>
                    <span className="text-[10px] text-ink-muted">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-rule-light px-2 py-1.5 space-y-1.5">
                    <p className="text-[10px] text-ink leading-relaxed">{risk.description}</p>
                    <div>
                      <div className="text-[9px] font-semibold text-ink-muted uppercase mb-0.5">
                        Mitigations
                      </div>
                      <ul className="space-y-0.5">
                        {risk.mitigations.map((m, i) => (
                          <li key={i} className="text-[9px] text-ink flex items-start gap-1">
                            <span className="text-green-ink shrink-0">&bull;</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-3 text-[8px] text-ink-muted">
                      <span>Probability: {risk.probability}/5</span>
                      <span>Impact: {risk.impact}/5</span>
                      <span>Status: {risk.status}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Draft Collaboration Agreement ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Draft Collaboration Agreement
        </div>
        <p className="text-[9px] text-ink-muted italic mb-2">
          All terms below are preliminary and subject to discussion. Nothing constitutes a binding agreement.
        </p>
        <div className="space-y-2">
          {clauses.map((clause) => (
            <ClauseCard key={clause.id} clause={clause} />
          ))}
        </div>
      </div>

      {/* ── Armstrong Demo ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Technology Capabilities — Armstrong / Thesis Engine
        </div>
        <p className="text-[10px] text-ink leading-relaxed mb-2">
          The following showcases the technology platform Lori has built — a personal performance
          tracking and decision-making dashboard called the Thesis Engine (codenamed Armstrong).
          This demonstrates the full-stack engineering, AI/ML, and financial technology capabilities
          that would be applied to Alamo Bernal.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <DemoCard
            title="Command Center"
            description="Live reward scoring engine computing daily performance across 8 weighted components. Real-time data visualization with Recharts."
            tech={['Next.js 14', 'Firebase', 'Recharts', 'TypeScript']}
          />
          <DemoCard
            title="Intelligence System"
            description="AI-powered signal extraction from conversations, market data, and research. Automated insight categorization and confidence scoring."
            tech={['Google Gemini API', 'NLP', 'Signal Processing']}
          />
          <DemoCard
            title="Capital & Risk Engine"
            description="Portfolio position tracking, stress test visualization, automated alerts with severity scoring, and decision rule evaluation."
            tech={['Risk Models', 'Stress Testing', 'Alert Engine']}
          />
          <DemoCard
            title="Automated Data Sync"
            description="ETL pipelines for Garmin health data, Google Calendar, Stripe revenue, and GitHub activity. Background cron jobs with error monitoring."
            tech={['Cron Jobs', 'ETL', 'Vercel Functions']}
          />
          <DemoCard
            title="Options Trading Tool"
            description="Built for a separate client — full equities universe browser, options chain analysis, AI-powered analyst consensus, portfolio management."
            tech={['Options Pricing', 'Portfolio Analytics', 'AI Analysis']}
          />
          <DemoCard
            title="What This Means for Alamo Bernal"
            description="The same engineering capabilities applied to: automated stock screening, historical dividend analysis, AI-driven buy/sell signals, investor reporting, and risk management dashboards."
            tech={['Your Tools', 'Your Edge', 'Built for You']}
          />
        </div>
      </div>

      {/* ── Next Steps & Action Items ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Next Steps & Action Items
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 pr-3">Action</th>
                <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2 w-[60px]">Owner</th>
                <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 px-2 w-[80px]">Due</th>
                <th className="text-left font-semibold text-ink-muted uppercase tracking-[0.5px] py-1 pl-2 w-[80px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((item) => (
                <tr key={item.id} className="border-b border-rule-light">
                  <td className="py-1.5 pr-3 text-ink">{item.description}</td>
                  <td className="py-1.5 px-2">
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${
                      item.owner === 'lori'
                        ? 'text-burgundy bg-burgundy-bg border-burgundy/20'
                        : item.owner === 'sean'
                        ? 'text-green-ink bg-green-bg border-green-ink/20'
                        : 'text-ink-muted bg-cream border-rule'
                    }`}>
                      {item.owner}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 font-mono text-ink-muted">{item.dueDate || '—'}</td>
                  <td className="py-1.5 pl-2">
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${
                      item.status === 'completed'
                        ? 'text-green-ink bg-green-bg border-green-ink/20'
                        : item.status === 'in_progress'
                        ? 'text-amber-ink bg-amber-bg border-amber-ink/20'
                        : 'text-ink-muted bg-cream border-rule'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function ClauseCard({ clause }: { clause: AgreementClause }) {
  const statusColor = CLAUSE_STATUS_COLORS[clause.status]

  return (
    <div className="border border-rule rounded-sm p-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-ink-muted font-mono uppercase">{clause.section}</span>
          <span className="text-[10px] font-semibold text-ink">{clause.label}</span>
        </div>
        <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${statusColor}`}>
          {CLAUSE_STATUS_LABELS[clause.status]}
        </span>
      </div>
      <p className="text-[10px] text-ink leading-relaxed">{clause.terms}</p>
      {clause.notes && (
        <p className="text-[9px] text-amber-ink italic mt-1 border-l-2 border-amber-ink/30 pl-2">
          {clause.notes}
        </p>
      )}
    </div>
  )
}

function DemoCard({
  title,
  description,
  tech,
}: {
  title: string
  description: string
  tech: string[]
}) {
  return (
    <div className="border border-rule rounded-sm p-2">
      <div className="text-[11px] font-semibold text-ink mb-1">{title}</div>
      <p className="text-[9px] text-ink-muted leading-relaxed mb-1.5">{description}</p>
      <div className="flex flex-wrap gap-1">
        {tech.map((t) => (
          <span
            key={t}
            className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border bg-cream text-ink-muted border-rule"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
