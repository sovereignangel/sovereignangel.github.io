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
      {/* ── Executive Summary ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Execution Overview
        </div>
        <p className="text-[10px] text-ink leading-relaxed">
          This section covers risk management, draft collaboration terms, technology capabilities,
          and next steps. Key risks include strategy crowding, liquidity constraints at scale, and
          regulatory changes to Section 475 tax treatment. All agreement clauses are preliminary
          and subject to discussion — nothing constitutes a binding commitment. The technology
          demo showcases the engineering capabilities that would be applied to Alamo Bernal&apos;s
          infrastructure needs.
        </p>
      </div>

      {/* ── Risk Matrix ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule flex items-center gap-2">
          Risk Matrix
          <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border text-amber-ink bg-amber-bg border-amber-ink/20">
            Draft
          </span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <DemoCard
            title="Surfaced Opportunities"
            description="Automated screening and ranking of dividend capture candidates. Daily filtered lists delivered via text or email with risk scores and historical performance data."
            tech={['Next.js 14', 'Firebase', 'Recharts', 'TypeScript']}
          />
          <DemoCard
            title="Macro Signals"
            description="AI-powered signal extraction from market data, earnings calls, and macro indicators. Automated categorization with confidence scoring to flag regime changes and sector rotations."
            tech={['Google Gemini API', 'NLP', 'Signal Processing']}
          />
          <DemoCard
            title="Capital & Risk Engine"
            description="Portfolio position tracking, stress test visualization, automated alerts with severity scoring, and decision rule evaluation."
            tech={['Risk Models', 'Stress Testing', 'Alert Engine']}
          />
          <DemoCard
            title="Automated Data Feeds"
            description="ETL pipelines for stock universe data, ex-dividend calendars, historical price behavior, dividend yield feeds, and volume/liquidity metrics. Background cron jobs with error monitoring."
            tech={['Cron Jobs', 'ETL', 'Market Data APIs', 'Vercel Functions']}
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
