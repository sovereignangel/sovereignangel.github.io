'use client'

import { SPRINT_FINANCIALS } from './sprint-data'

export default function ConvictionSprintFinancials() {
  const { income, burn, scenarios, insight } = SPRINT_FINANCIALS

  return (
    <div className="space-y-3 p-3">
      {/* Header */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-3">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Conviction Sprint · April — May Financial Model
        </h3>
        <p className="font-serif text-[11px] italic text-ink-muted mt-0.5">
          Eight-week runway analysis with LOOE performance scenarios
        </p>
      </div>

      {/* Income + Burn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule mb-2">
            Income
          </div>
          {income.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1 border-b border-rule-light last:border-0"
            >
              <span className="font-sans text-[11px] text-ink">{item.label}</span>
              <span className="font-mono text-[11px] font-semibold text-green-ink">{item.amount}</span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule mb-2">
            Monthly Burn
          </div>
          {burn.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between py-1 border-b border-rule-light last:border-0 ${
                item.total ? 'font-semibold' : ''
              }`}
            >
              <span className={`font-sans text-[11px] ${item.total ? 'text-ink font-semibold' : 'text-ink'}`}>
                {item.label}
              </span>
              <span className={`font-mono text-[11px] font-semibold ${item.total ? 'text-red-ink' : 'text-ink'}`}>
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scenarios */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule mb-2">
          LOOE Performance Scenarios
        </div>
        {scenarios.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center py-1.5 border-b border-rule-light last:border-0"
          >
            <span className="font-sans text-[11px] text-ink">{s.label}</span>
            <span className="font-mono text-[12px] font-semibold text-green-ink text-center min-w-[100px]">
              {s.net}
            </span>
            <span className="font-serif text-[11px] italic text-ink-muted">{s.note}</span>
          </div>
        ))}
      </div>

      {/* Insight */}
      <div className="bg-cream border border-rule rounded-sm p-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-burgundy mb-1">
          The Insight
        </div>
        <p className="font-serif text-[12px] italic text-ink leading-relaxed">{insight}</p>
      </div>
    </div>
  )
}
