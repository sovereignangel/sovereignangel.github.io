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
  technology: 'text-forest bg-forest-bg border-forest/20',
  operational: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  market: 'text-forest-ink bg-forest-cream border-forest-rule',
  regulatory: 'text-red-ink bg-red-bg border-red-ink/20',
  partnership: 'text-green-ink bg-green-bg border-green-ink/20',
  execution: 'text-forest-ink-muted bg-forest-surface border-forest-rule',
}

function severityScore(r: Risk): number {
  return r.probability * r.impact
}

function severityLabel(score: number): { label: string; color: string } {
  if (score >= 15) return { label: 'Critical', color: 'text-red-ink' }
  if (score >= 9) return { label: 'High', color: 'text-amber-ink' }
  if (score >= 4) return { label: 'Medium', color: 'text-forest-ink' }
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
      <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b-2 border-forest-rule">
          Execution Overview
        </div>
        <p className="text-[10px] text-forest-ink leading-relaxed">
          Live collaboration agreements, risk management, and action item tracking.
          Key risks include strategy crowding, liquidity constraints at scale, and
          regulatory changes to Section 475 tax treatment.
        </p>
      </div>

      {/* ── Agreements ── */}
      <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b-2 border-forest-rule">
          Agreements
        </div>
        <p className="text-[10px] text-forest-ink leading-relaxed mb-2">
          Live documents — edit directly in Google Docs. Please use <span className="font-semibold">Suggesting mode</span> so
          changes are tracked and visible to both parties.
        </p>
        {/* SOW + Limit Order Optimization */}
        <div className="space-y-2">
          <DocEmbed
            title="Statement of Work"
            url="https://docs.google.com/document/d/1Mt1MKpu-DJBBQ71sYddc4nF2ERORcF33/edit?usp=sharing&ouid=115310759493663215170&rtpof=true&sd=true"
          />

          {/* Limit Order Optimization — under SOW */}
          <div className="border border-forest-rule rounded-sm">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-forest-rule bg-forest-cream">
              <span className="text-[10px] font-semibold text-forest-ink">Limit Order Optimization — Performance Contract</span>
              <span className="font-mono text-[8px] text-forest-ink-muted">Addendum to SOW</span>
            </div>

            <div className="px-3 py-2 space-y-3">
            {/* Header */}
            <div className="text-center pb-2 border-b border-forest-rule">
              <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest-ink">
                Performance-Based Technology Services Agreement
              </div>
              <div className="font-mono text-[9px] text-forest-ink-muted mt-0.5">
                Alamo Bernal Investments LLC &amp; Lori Corpuz (&ldquo;Tech Partner&rdquo;)
              </div>
              <div className="font-mono text-[8px] text-forest-ink-muted mt-0.5">
                Effective Date: Upon execution of Phase 1 SOW
              </div>
            </div>

            {/* 1. Purpose */}
            <div>
              <div className="text-[9px] font-semibold text-forest uppercase mb-0.5 tracking-[0.5px]">
                1. Purpose
              </div>
              <p className="text-[10px] text-forest-ink leading-relaxed">
                This agreement governs the development and deployment of a Limit Order Optimization Engine
                designed to reduce the percentage of dividend income lost through post-ex-dividend stock sales.
                Currently, the Fund loses approximately 45&ndash;50% of captured dividends through stock price
                depreciation on ex-dividend dates. The objective is to reduce this loss rate below 40% through
                data-driven limit order recommendations.
              </p>
            </div>

            {/* 2. Scope of Work */}
            <div>
              <div className="text-[9px] font-semibold text-forest uppercase mb-0.5 tracking-[0.5px]">
                2. Scope of Work
              </div>
              <div className="space-y-1">
                <div className="flex items-start gap-1.5">
                  <span className="text-green-ink shrink-0 text-[10px]">&bull;</span>
                  <span className="text-[10px] text-forest-ink leading-relaxed">
                    <span className="font-semibold">Historical Analysis:</span> Ingest all trade history from August 2025 onward
                    (50% threshold era) plus pre-August discretionary trades. Analyze intraday price behavior on ex-dividend dates,
                    not just daily close.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-green-ink shrink-0 text-[10px]">&bull;</span>
                  <span className="text-[10px] text-forest-ink leading-relaxed">
                    <span className="font-semibold">Model Development:</span> Train an algorithm on Sean&rsquo;s historical performance
                    to optimize limit order thresholds per stock (not a blanket 50%). Factors include: historical ex-dividend price behavior,
                    dividend size relative to share price, sector/industry volatility, and macro regime signals.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-green-ink shrink-0 text-[10px]">&bull;</span>
                  <span className="text-[10px] text-forest-ink leading-relaxed">
                    <span className="font-semibold">Live Optimization:</span> Build tooling that suggests per-stock limit order
                    thresholds (e.g., 30%, 50%, 75% of dividend value) based on historical patterns and real-time market conditions.
                    Incorporate macro event filtering (Fed decisions, geopolitical events) to flag &ldquo;no-buy&rdquo; days.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-green-ink shrink-0 text-[10px]">&bull;</span>
                  <span className="text-[10px] text-forest-ink leading-relaxed">
                    <span className="font-semibold">Back-Testing:</span> Validate model against historical trades to quantify
                    expected improvement before live deployment.
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Compensation Structure */}
            <div>
              <div className="text-[9px] font-semibold text-forest uppercase mb-0.5 tracking-[0.5px]">
                3. Compensation Structure
              </div>
              <div className="space-y-2">
                <div className="bg-forest-cream border border-forest-rule rounded-sm p-2">
                  <div className="text-[9px] font-semibold text-forest-ink mb-0.5">A. Flat Retainer (Phase 1 — Active)</div>
                  <p className="text-[10px] text-forest-ink leading-relaxed">
                    $1,000/month for screening, filtering, historical data aggregation, spreadsheet automation,
                    and record-keeping infrastructure. Biweekly meetings. 6-month initial term.
                  </p>
                </div>
                <div className="bg-forest-cream border border-forest-rule rounded-sm p-2">
                  <div className="text-[9px] font-semibold text-forest-ink mb-0.5">B. Performance-Based (This Contract — Deferred)</div>
                  <div className="text-[10px] text-forest-ink leading-relaxed space-y-1">
                    <p>
                      <span className="font-semibold">Baseline:</span> Current average dividend loss rate of ~45&ndash;50%
                      (measured monthly as total stock sale losses / total dividends captured).
                    </p>
                    <p>
                      <span className="font-semibold">Threshold:</span> 40% loss rate. Tech Partner earns performance
                      compensation only when the monthly loss rate falls below 40%.
                    </p>
                    <p>
                      <span className="font-semibold">Formula:</span> Tech Partner receives 50% of the dollar savings
                      achieved below the 40% threshold.
                    </p>
                    <div className="bg-forest-surface border border-forest-rule rounded-sm p-1.5 mt-1">
                      <div className="font-mono text-[9px] text-forest-ink">
                        <span className="text-forest-ink-muted">Example:</span> $80K dividends captured, 30% loss = $24K lost.
                        40% baseline = $32K. Savings = $8K. Tech Partner compensation = <span className="font-semibold text-green-ink">$4,000</span>.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-forest-cream border border-forest-rule rounded-sm p-2">
                  <div className="text-[9px] font-semibold text-forest-ink mb-0.5">C. Capital Raising (Phase 2 — Deferred)</div>
                  <p className="text-[10px] text-forest-ink leading-relaxed">
                    $500/month invested into the Fund as skin-in-the-game. Compensation structure for capital raised
                    TBD — options under consideration include: advisory retainer, discretionary bonus tied to AUM growth,
                    or equity/profit participation. Requires either Series 65 registration or exempt reporting advisor
                    (ERA) structuring. Phase 2 begins after Tech Partner achieves comfort level with fund strategy.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Data Requirements */}
            <div>
              <div className="text-[9px] font-semibold text-forest uppercase mb-0.5 tracking-[0.5px]">
                4. Data Requirements
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
                <div className="text-[10px] text-forest-ink leading-relaxed">
                  <span className="font-semibold">From Sean:</span>
                  <ul className="mt-0.5 space-y-0.5 pl-2">
                    <li>&bull; Complete trade history (all buys, sells, limit orders)</li>
                    <li>&bull; Stock screening criteria &amp; filtering universe</li>
                    <li>&bull; Edge cases &amp; strategy exceptions</li>
                    <li>&bull; Fidelity account API access or CSV exports</li>
                  </ul>
                </div>
                <div className="text-[10px] text-forest-ink leading-relaxed">
                  <span className="font-semibold">From Tech Partner:</span>
                  <ul className="mt-0.5 space-y-0.5 pl-2">
                    <li>&bull; API vendor selection (Polygon.io, Alpha Vantage, etc.)</li>
                    <li>&bull; Intraday price history on ex-dividend dates</li>
                    <li>&bull; Macro event signals &amp; regime indicators</li>
                    <li>&bull; Back-test results &amp; model performance metrics</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 5. Performance Tracking */}
            <div>
              <div className="text-[9px] font-semibold text-forest uppercase mb-0.5 tracking-[0.5px]">
                5. Performance Tracking &amp; Attribution
              </div>
              <p className="text-[10px] text-forest-ink leading-relaxed">
                Monthly loss rate tracked automatically via the partnership portal. Windfall gains
                (stocks rising &gt;100% of dividend value) and macro-driven losses (market-wide drops
                due to Fed/geopolitical events) may be flagged for exclusion by mutual agreement.
                Attribution between model-driven improvement and market conditions to be reviewed
                collaboratively during biweekly check-ins.
              </p>
            </div>

            {/* 6. Infrastructure Costs */}
            <div>
              <div className="text-[9px] font-semibold text-forest uppercase mb-0.5 tracking-[0.5px]">
                6. Infrastructure Costs
              </div>
              <p className="text-[10px] text-forest-ink leading-relaxed">
                API data feeds and hosting costs (estimated ~$20/month for Vercel + market data APIs)
                are passed through to the Fund. Additional infrastructure costs require mutual approval.
              </p>
            </div>

            {/* 7. Timeline */}
            <div>
              <div className="text-[9px] font-semibold text-forest uppercase mb-0.5 tracking-[0.5px]">
                7. Timeline
              </div>
              <p className="text-[10px] text-forest-ink leading-relaxed">
                Estimated 1&ndash;5+ months from kickoff to live model deployment. No fixed deadline &mdash;
                quality of model takes priority. Milestones: (1) Strategy ingestion &amp; data collection,
                (2) Historical back-test, (3) Per-stock threshold recommendations, (4) Live deployment with
                tracking dashboard.
              </p>
            </div>

            {/* 8. Historical Reference */}
            <div>
              <div className="text-[9px] font-semibold text-forest uppercase mb-0.5 tracking-[0.5px]">
                8. Historical Performance Reference
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-forest-rule">
                      <th className="text-left font-semibold text-forest-ink-muted uppercase tracking-[0.5px] py-1 pr-3">Month</th>
                      <th className="text-left font-semibold text-forest-ink-muted uppercase tracking-[0.5px] py-1 px-2">Dividends</th>
                      <th className="text-left font-semibold text-forest-ink-muted uppercase tracking-[0.5px] py-1 px-2">Loss %</th>
                      <th className="text-left font-semibold text-forest-ink-muted uppercase tracking-[0.5px] py-1 pl-2">$ Lost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-forest-rule-light">
                      <td className="py-1 pr-3 text-forest-ink">Dec 2025</td>
                      <td className="py-1 px-2 font-mono text-forest-ink">$83,200</td>
                      <td className="py-1 px-2 font-mono text-red-ink">59.7%</td>
                      <td className="py-1 pl-2 font-mono text-red-ink">~$49,670</td>
                    </tr>
                    <tr className="border-b border-forest-rule-light">
                      <td className="py-1 pr-3 text-forest-ink">Jan 2026</td>
                      <td className="py-1 px-2 font-mono text-forest-ink">$66,500</td>
                      <td className="py-1 px-2 font-mono text-amber-ink">45.0%</td>
                      <td className="py-1 pl-2 font-mono text-amber-ink">~$29,925</td>
                    </tr>
                    <tr className="border-b border-forest-rule-light">
                      <td className="py-1 pr-3 text-forest-ink">Feb 2026</td>
                      <td className="py-1 px-2 font-mono text-forest-ink">$76,700</td>
                      <td className="py-1 px-2 font-mono text-amber-ink">47.6%</td>
                      <td className="py-1 pl-2 font-mono text-amber-ink">~$36,509</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[9px] text-forest-ink-muted mt-1 italic">
                Target: Reduce monthly loss rate from ~45&ndash;50% to below 40% consistently.
              </p>
            </div>

            {/* Signature block */}
            <div className="pt-2 border-t border-forest-rule">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-[10px] text-forest-ink-muted">
                  <div className="mb-3 border-b border-forest-rule-light pb-1">Sean Becker — Alamo Bernal Investments LLC</div>
                  <div>Date: _______________</div>
                </div>
                <div className="text-[10px] text-forest-ink-muted">
                  <div className="mb-3 border-b border-forest-rule-light pb-1">Lori Corpuz — Technology Partner</div>
                  <div>Date: _______________</div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Side Letter — Deferred */}
        <details className="mt-3 border border-forest-rule rounded-sm">
          <summary className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-forest-cream/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-forest-ink">Side Letter — Capital Raising</span>
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border text-amber-ink bg-amber-bg border-amber-ink/20">
                Deferred
              </span>
            </div>
            <span className="font-mono text-[8px] text-forest-ink-muted">Open in Google Docs &rarr;</span>
          </summary>
          <div className="border-t border-forest-rule">
            <DocEmbed
              title="Side Letter"
              url="https://docs.google.com/document/d/10mLzxSVF4ijsTSqSjWy_mTrkoNVP8ckE/edit?usp=sharing&ouid=115310759493663215170&rtpof=true&sd=true"
            />
          </div>
        </details>
      </div>

      {/* ── Risk Matrix ── */}
      <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b-2 border-forest-rule flex items-center gap-2">
          Risk Matrix
          <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border text-amber-ink bg-amber-bg border-amber-ink/20">
            Draft
          </span>
        </div>
        <div className="space-y-1.5">
          {sortedRisks.map((risk) => {
            const score = severityScore(risk)
            const { label: sevLabel, color: sevColor } = severityLabel(score)
            const catColor = RISK_CATEGORY_COLORS[risk.category]
            const isExpanded = !!expandedRisks[risk.id]

            return (
              <div key={risk.id} className="border border-forest-rule rounded-sm">
                <button
                  onClick={() => toggleRisk(risk.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-forest-cream/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${catColor}`}>
                      {risk.category}
                    </span>
                    <span className="text-[10px] font-medium text-forest-ink text-left">{risk.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-[9px] font-semibold ${sevColor}`}>
                      {sevLabel} ({score})
                    </span>
                    <span className="font-mono text-[8px] text-forest-ink-muted uppercase">
                      {risk.owner}
                    </span>
                    <span className="text-[10px] text-forest-ink-muted">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-forest-rule-light px-2 py-1.5 space-y-1.5">
                    <p className="text-[10px] text-forest-ink leading-relaxed">{risk.description}</p>
                    <div>
                      <div className="text-[9px] font-semibold text-forest-ink-muted uppercase mb-0.5">
                        Mitigations
                      </div>
                      <ul className="space-y-0.5">
                        {risk.mitigations.map((m, i) => (
                          <li key={i} className="text-[9px] text-forest-ink flex items-start gap-1">
                            <span className="text-green-ink shrink-0">&bull;</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-3 text-[8px] text-forest-ink-muted">
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

      {/* ── Next Steps & Action Items ── */}
      <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b-2 border-forest-rule">
          Next Steps & Action Items
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-forest-rule">
                <th className="text-left font-semibold text-forest-ink-muted uppercase tracking-[0.5px] py-1 pr-3">Action</th>
                <th className="text-left font-semibold text-forest-ink-muted uppercase tracking-[0.5px] py-1 px-2 w-[60px]">Owner</th>
                <th className="text-left font-semibold text-forest-ink-muted uppercase tracking-[0.5px] py-1 px-2 w-[80px]">Due</th>
                <th className="text-left font-semibold text-forest-ink-muted uppercase tracking-[0.5px] py-1 pl-2 w-[80px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((item) => (
                <tr key={item.id} className="border-b border-forest-rule-light">
                  <td className="py-1.5 pr-3 text-forest-ink">{item.description}</td>
                  <td className="py-1.5 px-2">
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${
                      item.owner === 'lori'
                        ? 'text-forest bg-forest-bg border-forest/20'
                        : item.owner === 'sean'
                        ? 'text-green-ink bg-green-bg border-green-ink/20'
                        : 'text-forest-ink-muted bg-forest-cream border-forest-rule'
                    }`}>
                      {item.owner}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 font-mono text-forest-ink-muted">{item.dueDate || '—'}</td>
                  <td className="py-1.5 pl-2">
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${
                      item.status === 'completed'
                        ? 'text-green-ink bg-green-bg border-green-ink/20'
                        : item.status === 'in_progress'
                        ? 'text-amber-ink bg-amber-bg border-amber-ink/20'
                        : 'text-forest-ink-muted bg-forest-cream border-forest-rule'
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
    <div className="border border-forest-rule rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-forest-rule bg-forest-cream">
        <span className="text-[10px] font-semibold text-forest-ink">{title}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[8px] text-forest hover:underline"
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
