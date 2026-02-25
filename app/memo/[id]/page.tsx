import { adminDb } from '@/lib/firebase-admin'
import type { VentureMemo, VentureMemoMetric, MarketSizeRow, BusinessModelRow, GTMPhase, FinancialProjectionRow, UnitEconomicsRow, UseOfFundsRow, MilestoneRow } from '@/lib/types'
import type { Metadata } from 'next'

interface PublicMemoDoc {
  memo: VentureMemo
  ventureName: string
  oneLiner: string
  category: string
  thesisPillars: string[]
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const snap = await adminDb.collection('public_memos').doc(params.id).get()
  if (!snap.exists) return { title: 'Memo Not Found' }
  const data = snap.data() as PublicMemoDoc
  return {
    title: `${data.ventureName} — Investment Memo`,
    description: data.memo.companyPurpose,
  }
}

function Section({ title, content }: { title: string; content: string }) {
  if (!content) return null
  return (
    <div>
      <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
        {title}
      </h3>
      <p className="font-mono text-[11px] text-ink leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  )
}

function MetricCard({ metric }: { metric: VentureMemoMetric }) {
  return (
    <div className="bg-cream border border-rule rounded-sm px-2 py-1.5">
      <span className="font-mono text-[8px] uppercase text-ink-muted block">{metric.label}</span>
      <span className="font-mono text-[11px] font-bold text-ink block leading-tight">{metric.value}</span>
      <span className="font-mono text-[8px] text-ink-muted">{metric.context}</span>
    </div>
  )
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-mono text-[8px] uppercase text-ink-muted text-left py-1 px-2 border-b border-rule">
      {children}
    </th>
  )
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="font-mono text-[10px] text-ink py-1.5 px-2 border-b border-rule/50">
      {children}
    </td>
  )
}

function MemoTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  if (rows.length === 0) return null
  return (
    <div>
      <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-cream">
              {headers.map((h, i) => <TableHeader key={i}>{h}</TableHeader>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-cream/50' : ''}>
                {row.map((cell, j) => (
                  <TableCell key={j}>{cell}</TableCell>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function MemoPage({ params }: { params: { id: string } }) {
  const snap = await adminDb.collection('public_memos').doc(params.id).get()

  if (!snap.exists) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-[16px] text-ink mb-2">Memo not found</h1>
          <p className="font-mono text-[11px] text-ink-muted">This memo may have been removed or the link is invalid.</p>
        </div>
      </div>
    )
  }

  const data = snap.data() as PublicMemoDoc
  const memo = data.memo

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white border border-rule rounded-sm mb-3">
          <div className="p-4 border-b-2 border-burgundy">
            {/* Title bar */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-[9px] uppercase text-ink-muted block mb-0.5">Investment Memo</span>
                <h1 className="font-serif text-[20px] font-bold text-ink">{data.ventureName}</h1>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                  {data.category}
                </span>
                {data.thesisPillars.map(p => (
                  <span key={p} className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-cream text-ink-muted border-rule">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Company Purpose */}
            <p className="font-serif text-[14px] text-ink leading-relaxed italic mb-4">
              {memo.companyPurpose}
            </p>

            {/* Key Metrics — compact inline strip */}
            {memo.keyMetrics.length > 0 && (
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5 mb-4">
                {memo.keyMetrics.map((m, i) => (
                  <MetricCard key={i} metric={m} />
                ))}
              </div>
            )}

            {/* Executive Summary */}
            <div>
              <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                Executive Summary
              </h2>
              <p className="font-mono text-[11px] text-ink leading-relaxed whitespace-pre-line">{memo.executiveSummary}</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Problem + Solution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Problem" content={memo.problem} />
              <Section title="Solution" content={memo.solution} />
            </div>

            {/* Why Now + Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Why Now" content={memo.whyNow} />
              <Section title="Founder Insight" content={memo.insight} />
            </div>

            {/* Market Size Table */}
            {memo.marketSizeTable && memo.marketSizeTable.length > 0 ? (
              <MemoTable
                title="Market Sizing"
                headers={['Segment', 'Size', 'CAGR', 'Notes']}
                rows={memo.marketSizeTable.map((r: MarketSizeRow) => [r.segment, r.size, r.cagr, r.notes])}
              />
            ) : (
              <Section title="Market Size" content={memo.marketSize} />
            )}

            {/* Market Dynamics */}
            <Section title="Market Dynamics" content={memo.marketDynamics} />

            {/* Competition */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Competitive Landscape" content={memo.competitiveLandscape} />
              <Section title="Defensibility" content={memo.defensibility} />
            </div>

            {/* Business Model Table */}
            {memo.businessModelTable && memo.businessModelTable.length > 0 ? (
              <MemoTable
                title="Business Model"
                headers={['Revenue Lever', 'Mechanism', 'Target', 'Margin Profile']}
                rows={memo.businessModelTable.map((r: BusinessModelRow) => [r.lever, r.mechanism, r.target, r.marginProfile])}
              />
            ) : (
              <Section title="Business Model" content={memo.businessModel} />
            )}

            {/* GTM Phases Table */}
            {memo.gtmPhases && memo.gtmPhases.length > 0 ? (
              <MemoTable
                title="Go-to-Market"
                headers={['Phase', 'Strategy', 'Channel', 'Milestone']}
                rows={memo.gtmPhases.map((r: GTMPhase) => [r.phase, r.strategy, r.channel, r.milestone])}
              />
            ) : (
              <Section title="Go-to-Market" content={memo.goToMarket} />
            )}

            {/* Founder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Founder Advantage" content={memo.founderAdvantage} />
              <Section title="Relevant Experience" content={memo.relevantExperience} />
            </div>

            {/* Financial Projection Table */}
            {memo.financialProjectionTable && memo.financialProjectionTable.length > 0 ? (
              <MemoTable
                title="Financial Projection"
                headers={['Year', 'Revenue', 'Customers', 'Burn', 'Key Assumption']}
                rows={memo.financialProjectionTable.map((r: FinancialProjectionRow) => [r.year, r.revenue, r.customers, r.burn, r.keyAssumption])}
              />
            ) : (
              <Section title="Financial Projection" content={memo.financialProjection} />
            )}

            {/* Unit Economics Table */}
            {memo.unitEconomicsTable && memo.unitEconomicsTable.length > 0 ? (
              <MemoTable
                title="Unit Economics"
                headers={['Metric', 'Current', 'Target', 'Benchmark']}
                rows={memo.unitEconomicsTable.map((r: UnitEconomicsRow) => [r.metric, r.current, r.target, r.benchmark])}
              />
            ) : (
              <Section title="Unit Economics" content={memo.unitEconomics} />
            )}

            {/* Funding Ask */}
            <Section title="Funding Ask" content={memo.fundingAsk} />

            {/* Use of Funds Table */}
            {memo.useOfFundsTable && memo.useOfFundsTable.length > 0 ? (
              <MemoTable
                title="Use of Funds"
                headers={['Category', 'Allocation', 'Amount', 'Rationale']}
                rows={memo.useOfFundsTable.map((r: UseOfFundsRow) => [r.category, r.allocation, r.amount, r.rationale])}
              />
            ) : (
              <Section title="Use of Funds" content={memo.useOfFunds} />
            )}

            {/* Milestones Table */}
            {memo.milestonesTable && memo.milestonesTable.length > 0 ? (
              <MemoTable
                title="Key Milestones"
                headers={['Timeline', 'Milestone', 'Success Metric']}
                rows={memo.milestonesTable.map((r: MilestoneRow) => [r.timeline, r.milestone, r.successMetric])}
              />
            ) : memo.milestones.length > 0 ? (
              <div>
                <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                  Key Milestones
                </h3>
                <ol className="space-y-1.5">
                  {memo.milestones.map((m, i) => (
                    <li key={i} className="font-mono text-[11px] text-ink flex items-start gap-2">
                      <span className="font-mono text-[9px] font-bold text-burgundy bg-burgundy-bg px-1.5 py-0.5 rounded-sm shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {m}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-3">
          <span className="font-mono text-[9px] text-ink-faint">
            v{memo.version} — Generated by Thesis Engine
          </span>
        </div>
      </div>
    </div>
  )
}
