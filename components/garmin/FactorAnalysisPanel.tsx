'use client'

import type { FactorAnalysis, FactorStat } from '@/lib/garmin-factor-analysis'

const POS = '#2d5f3f'
const NEG = '#8c2d2d'

function QuintileBars({ quintiles }: { quintiles: number[] }) {
  const min = Math.min(...quintiles)
  const max = Math.max(...quintiles)
  const range = max - min || 1
  return (
    <svg width={64} height={18} className="inline-block align-middle">
      {quintiles.map((q, i) => {
        const h = 4 + ((q - min) / range) * 12
        return (
          <rect
            key={i}
            x={i * 13}
            y={17 - h}
            width={10}
            height={h}
            rx={1}
            fill={i === 0 || i === 4 ? '#7c2d2d' : '#c8b8b8'}
          />
        )
      })}
    </svg>
  )
}

function FactorRow({ f }: { f: FactorStat }) {
  const sig = Math.abs(f.icT) >= 2
  const dirColor = f.ic > 0 ? POS : NEG
  return (
    <tr className="border-b border-rule-light">
      <td className={`text-[11px] py-1.5 pr-2 ${sig ? 'text-ink font-medium' : 'text-ink-muted'}`}>{f.label}</td>
      <td className="font-mono text-[10px] text-ink-muted py-1.5 pr-2 text-right">{f.n}</td>
      <td className="font-mono text-[11px] py-1.5 pr-2 text-right font-semibold" style={{ color: sig ? dirColor : '#9a928a' }}>
        {f.ic >= 0 ? '+' : '−'}{Math.abs(f.ic).toFixed(2)}
      </td>
      <td className={`font-mono text-[10px] py-1.5 pr-2 text-right ${sig ? 'text-ink font-semibold' : 'text-ink-faint'}`}>
        {f.icT.toFixed(1)}
      </td>
      <td className="font-mono text-[10px] text-ink-muted py-1.5 pr-2 text-right">
        {f.ic12m === null ? '—' : `${f.ic12m >= 0 ? '+' : '−'}${Math.abs(f.ic12m).toFixed(2)}`}
      </td>
      <td className="font-mono text-[10px] py-1.5 pr-2 text-right" style={{ color: sig ? dirColor : '#9a928a' }}>
        {f.beta >= 0 ? '+' : '−'}{Math.abs(f.beta).toFixed(1)}
      </td>
      <td className="py-1 pr-2 text-center"><QuintileBars quintiles={f.quintiles} /></td>
      <td className="font-mono text-[10px] py-1.5 text-right" style={{ color: Math.abs(f.spread) >= 2 ? dirColor : '#9a928a' }}>
        {f.spread >= 0 ? '+' : '−'}{Math.abs(f.spread).toFixed(1)}
      </td>
    </tr>
  )
}

export default function FactorAnalysisPanel({ fa }: { fa: FactorAnalysis }) {
  const lagged = fa.stats.filter(s => s.group === 'lagged')
  const concurrent = fa.stats.filter(s => s.group === 'concurrent')

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-ink-muted leading-relaxed">
        Target: nightly sleep score. Universe: {fa.universeN.toLocaleString()} nights since Jun 2021
        (mean {fa.meanScore.toFixed(1)}, sd {fa.sdScore.toFixed(1)}; {fa.excludedLowScores} partial
        nights with score ≤ 5 excluded). Every signal is lagged to the prior day (t−1) so nothing
        uses information from the night being predicted. IC is the Spearman rank correlation between
        factor and next-night score — the standard signal-quality measure; |t| ≥ 2 marks
        significance. β is the univariate effect in score points per +1σ of the factor. Q1–Q5 are
        mean scores by factor quintile; the Q5−Q1 spread is the long-short portfolio equivalent.
        IC 12m re-computes on the trailing year as a stability check.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="border-b border-rule">
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2">Factor</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-right">n</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-right">IC</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-right">t</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-right">IC 12m</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-right">β pts/σ</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 pr-2 text-center">Q1→Q5</th>
              <th className="text-[10px] text-ink-muted font-medium py-1 text-right">Q5−Q1</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={8} className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy pt-2 pb-1">
              Signals — Known Before The Night (t−1)
            </td></tr>
            {lagged.map(f => <FactorRow key={f.key} f={f} />)}
            <tr><td colSpan={8} className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy pt-3 pb-1">
              Concurrent Physiology — Diagnostic, Not Tradeable
            </td></tr>
            {concurrent.map(f => <FactorRow key={f.key} f={f} />)}
          </tbody>
        </table>
      </div>

      {fa.model && (
        <div className="border-t-2 border-rule pt-2">
          <div className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
            Joint Model — OLS on z-scored signals · n={fa.model.n.toLocaleString()} · R² = {fa.model.r2.toFixed(3)} (adj {fa.model.adjR2.toFixed(3)})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {fa.model.coefficients.map(c => {
              const sig = Math.abs(c.t) >= 2
              return (
                <div key={c.key} className="flex items-center gap-2 py-[2px]">
                  <div className={`flex-1 text-[11px] truncate ${sig ? 'text-ink font-medium' : 'text-ink-muted'}`}>{c.label}</div>
                  <div className="w-14 text-right font-mono text-[11px] font-semibold" style={{ color: sig ? (c.beta > 0 ? POS : NEG) : '#9a928a' }}>
                    {c.beta >= 0 ? '+' : '−'}{Math.abs(c.beta).toFixed(2)}
                  </div>
                  <div className={`w-12 text-right font-mono text-[10px] ${sig ? 'text-ink font-semibold' : 'text-ink-faint'}`}>
                    t {c.t.toFixed(1)}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-[10px] text-ink-muted mt-1.5">
            Joint betas attribute overlapping factors (e.g. steps vs training load) instead of
            double-counting; a factor significant alone but not here is proxying for another. R² is
            the share of nightly score variance these signals explain — the rest is unmeasured
            (alcohol, meals, light, temperature, psychology).
          </div>
        </div>
      )}
    </div>
  )
}
