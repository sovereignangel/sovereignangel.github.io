'use client'

import { useState, useEffect } from 'react'
import {
  getRisks,
  getActionItems,
} from '@/lib/alamo-bernal/firestore'
import {
  RISKS,
  ACTION_ITEMS,
} from '@/lib/alamo-bernal/seed-data'
import type {
  Risk,
  ActionItem,
  RiskCategory,
} from '@/lib/alamo-bernal/types'

const RISK_CATEGORY_COLORS: Record<RiskCategory, string> = {
  technology: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  operational: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  market: 'text-ink bg-cream border-rule',
  regulatory: 'text-red-ink bg-red-bg border-red-ink/20',
  partnership: 'text-green-ink bg-green-bg border-green-ink/20',
  execution: 'text-ink-muted bg-paper border-rule',
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
  const [actions, setActions] = useState<ActionItem[]>(ACTION_ITEMS)
  const [expandedRisks, setExpandedRisks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      try {
        const [r, a] = await Promise.all([
          getRisks(),
          getActionItems(),
        ])
        if (r.length > 0) setRisks(r)
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

      {/* ── Agreements ── */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Agreements
        </div>
        <p className="text-[10px] text-ink leading-relaxed mb-2">
          Live documents — edit directly in Google Docs. Please use <span className="font-semibold">Suggesting mode</span> so
          changes are tracked and visible to both parties.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <DocEmbed
            title="Statement of Work"
            url="https://docs.google.com/document/d/1Mt1MKpu-DJBBQ71sYddc4nF2ERORcF33/edit?usp=sharing&ouid=115310759493663215170&rtpof=true&sd=true"
          />
          <DocEmbed
            title="Side Letter"
            url="https://docs.google.com/document/d/10mLzxSVF4ijsTSqSjWy_mTrkoNVP8ckE/edit?usp=sharing&ouid=115310759493663215170&rtpof=true&sd=true"
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

function DocEmbed({ title, url }: { title: string; url: string }) {
  const previewUrl = url.replace(/\/edit.*$/, '/preview')

  return (
    <div className="border border-rule rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-rule bg-cream">
        <span className="text-[10px] font-semibold text-ink">{title}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[8px] text-burgundy hover:underline"
        >
          Open in Google Docs &rarr;
        </a>
      </div>
      <iframe
        src={previewUrl}
        className="w-full border-0"
        style={{ height: '500px' }}
        title={title}
      />
    </div>
  )
}
