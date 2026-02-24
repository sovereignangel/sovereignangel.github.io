import { adminDb } from '@/lib/firebase-admin'
import type { VentureMemo, VentureMemoMetric } from '@/lib/types'
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
    <div className="bg-cream border border-rule rounded-sm p-3">
      <span className="font-mono text-[9px] uppercase text-ink-muted block">{metric.label}</span>
      <span className="font-mono text-[18px] font-bold text-ink block leading-tight">{metric.value}</span>
      <span className="font-mono text-[9px] text-ink-muted">{metric.context}</span>
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

            {/* Key Metrics */}
            {memo.keyMetrics.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
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

            {/* Market */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Market Size" content={memo.marketSize} />
              <Section title="Market Dynamics" content={memo.marketDynamics} />
            </div>

            {/* Competition */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Competitive Landscape" content={memo.competitiveLandscape} />
              <Section title="Defensibility" content={memo.defensibility} />
            </div>

            {/* Business */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Business Model" content={memo.businessModel} />
              <Section title="Go-to-Market" content={memo.goToMarket} />
            </div>

            {/* Founder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Founder Advantage" content={memo.founderAdvantage} />
              <Section title="Relevant Experience" content={memo.relevantExperience} />
            </div>

            {/* Financials */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Financial Projection" content={memo.financialProjection} />
              <Section title="Unit Economics" content={memo.unitEconomics} />
            </div>

            {/* The Ask */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Funding Ask" content={memo.fundingAsk} />
              <Section title="Use of Funds" content={memo.useOfFunds} />
            </div>

            {/* Milestones */}
            {memo.milestones.length > 0 && (
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
            )}
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
