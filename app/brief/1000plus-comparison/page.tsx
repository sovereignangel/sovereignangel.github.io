import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Internal Memo — Armstrong vs. 1000+ Capital',
  description: 'Comparative performance read on the 1000+ Capital pitch deck (Eko S&P Plus, Alina) vs. Armstrong and S&P 500.',
}

function Th({ children, accent }: { children?: React.ReactNode; accent?: boolean }) {
  return (
    <th className={`font-mono text-[8px] uppercase text-left py-1 px-2 border-b border-rule whitespace-nowrap ${accent ? 'text-burgundy' : 'text-ink-muted'}`}>
      {children}
    </th>
  )
}

function Td({ children, accent, mono = true }: { children: React.ReactNode; accent?: boolean; mono?: boolean }) {
  return (
    <td className={`${mono ? 'font-mono' : 'font-serif'} text-[10px] py-1 px-2 border-b border-rule/50 ${accent ? 'text-burgundy font-semibold' : 'text-ink'}`}>
      {children}
    </td>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
      {children}
    </h2>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted w-16 shrink-0">{label}</span>
      <span className="font-mono text-[11px] text-ink">{value}</span>
    </div>
  )
}

export default function ComparisonBriefPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header card */}
        <div className="bg-white border border-rule rounded-sm mb-3">
          <div className="p-4 border-b-2 border-burgundy">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-[9px] uppercase text-ink-muted block mb-0.5">Internal Memo</span>
                <h1 className="font-serif text-[20px] font-bold text-ink leading-tight">
                  Armstrong vs. 1000<sup className="text-[12px]">+</sup> Capital
                </h1>
                <p className="font-serif text-[13px] text-ink-muted italic mt-1">
                  Comparative performance read — Quant 4.0 Factor (Eko S&P Plus, Alina) vs. Armstrong and S&P 500
                </p>
              </div>
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20 whitespace-nowrap">
                Confidential
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-rule">
              <MetaRow label="To" value="Armstrong IC" />
              <MetaRow label="From" value="Lori Corpuz" />
              <MetaRow label="Date" value="2026-05-17" />
              <MetaRow label="Source" value="1000+ Capital 2026 marketing deck" />
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Methodology */}
            <div>
              <SectionHeader>Methodology</SectionHeader>
              <p className="font-mono text-[10px] text-ink leading-relaxed">
                Mirrors source-deck conventions: total return (Eko window) or 1Y annualized (Alina); Max DD = peak-to-trough in window; Sharpe = annualized; simulated vs. live explicitly flagged. Per source disclaimer: <span className="italic">"BACKTESTED, HYPOTHETICAL results... do not represent actual trading using client assets"</span> — same caveat applies to Armstrong's walk-forward backtest. S&P 500 figures are TR (dividends reinvested) from public historical data; <span className="font-semibold text-burgundy">verify with Bloomberg / Refinitiv before external use</span>.
              </p>
            </div>

            {/* Window A */}
            <div>
              <SectionHeader>Window A — Eko S&P Plus: 14 Jul 2003 → 9 Jan 2026 (~22.5y)</SectionHeader>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-cream">
                      <Th>Strategy</Th>
                      <Th>Return %</Th>
                      <Th>Max DD %</Th>
                      <Th>Sharpe</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td accent>Eko S&P Plus (source)</Td>
                      <Td>64.74%</Td>
                      <Td>-16.86%</Td>
                      <Td>1.44</Td>
                      <Td>Live, $25M</Td>
                    </tr>
                    <tr className="bg-cream/50">
                      <Td>S&P 500 TR (matched)</Td>
                      <Td>~700-800%</Td>
                      <Td>~-55% (GFC)</Td>
                      <Td>~0.55-0.60</Td>
                      <Td>Index</Td>
                    </tr>
                    <tr>
                      <Td>Armstrong</Td>
                      <Td>n/a — dataset begins 2012</Td>
                      <Td>—</Td>
                      <Td>—</Td>
                      <Td>n/a</Td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="font-mono text-[10px] text-ink-muted leading-relaxed mt-2 italic">
                Eko is materially below S&P 500 cumulative return but with much higher Sharpe — consistent with a vol-managed, low-beta overlay, not a beta replacement.
              </p>
            </div>

            {/* Window B */}
            <div>
              <SectionHeader>Window B — Alina: 1Y simulated (period not disclosed in source)</SectionHeader>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-cream">
                      <Th>Strategy</Th>
                      <Th>Annual Return</Th>
                      <Th>Max DD</Th>
                      <Th>Sharpe</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td accent>Alina (source)</Td>
                      <Td>43.29%</Td>
                      <Td>-6.20%</Td>
                      <Td>2.23</Td>
                      <Td>Simulated</Td>
                    </tr>
                    <tr className="bg-cream/50">
                      <Td>S&P 500 TR (2024 cal)</Td>
                      <Td>~25%</Td>
                      <Td>~-8%</Td>
                      <Td>~2.0</Td>
                      <Td>Index</Td>
                    </tr>
                    <tr>
                      <Td>Armstrong 2025 trailing (BT)</Td>
                      <Td>n/d</Td>
                      <Td>n/d</Td>
                      <Td>1.43</Td>
                      <Td>Backtest</Td>
                    </tr>
                    <tr className="bg-cream/50">
                      <Td>Armstrong 2013 (BT, best yr)</Td>
                      <Td>n/d</Td>
                      <Td>n/d</Td>
                      <Td>2.55</Td>
                      <Td>Backtest</Td>
                    </tr>
                    <tr>
                      <Td>Armstrong live Schwab (Feb 2023 → Mar 2026, ~3Y)</Td>
                      <Td>388% cumulative</Td>
                      <Td>n/d</Td>
                      <Td>n/d</Td>
                      <Td>Live (retail acct)</Td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Window C */}
            <div>
              <SectionHeader>Window C — Armstrong native: 2012 → 2025 (~14y walk-forward)</SectionHeader>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-cream">
                      <Th>Strategy</Th>
                      <Th>Median Annual</Th>
                      <Th>Max DD</Th>
                      <Th>Avg Sharpe</Th>
                      <Th>Sharpe Range</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td accent>Armstrong (BT)</Td>
                      <Td>-1.1%</Td>
                      <Td>-75.2% (2018)</Td>
                      <Td>0.25</Td>
                      <Td>-1.89 → 2.55</Td>
                    </tr>
                    <tr className="bg-cream/50">
                      <Td>S&P 500 TR</Td>
                      <Td>~13%</Td>
                      <Td>~-25% (2022)</Td>
                      <Td>~0.75</Td>
                      <Td>—</Td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="font-mono text-[10px] text-ink-muted leading-relaxed mt-2 italic">
                7/14 positive years; best 2020 +2,673.5%; worst 2018 -70.3%; payoff ratio 5.59× in 2013 (primary KPI per primer).
              </p>
            </div>

            {/* Side-by-side */}
            <div>
              <SectionHeader>Side-by-side</SectionHeader>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-cream">
                      <Th></Th>
                      <Th>Eko</Th>
                      <Th>Alina</Th>
                      <Th>Armstrong BT</Th>
                      <Th>Armstrong Live</Th>
                      <Th>S&P 500 TR</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td>Period</Td>
                      <Td>22.5Y</Td>
                      <Td>1Y sim</Td>
                      <Td>14Y walk-fwd</Td>
                      <Td>~3Y live</Td>
                      <Td>matched</Td>
                    </tr>
                    <tr className="bg-cream/50">
                      <Td>Status</Td>
                      <Td>Live $25M</Td>
                      <Td>Simulated</Td>
                      <Td>Simulated</Td>
                      <Td>Live retail</Td>
                      <Td>Index</Td>
                    </tr>
                    <tr>
                      <Td>Strategy</Td>
                      <Td>Vol/sentiment</Td>
                      <Td>L/S multifactor</Td>
                      <Td>Long LEAP calls</Td>
                      <Td>Long LEAP calls</Td>
                      <Td>Long beta</Td>
                    </tr>
                    <tr className="bg-cream/50">
                      <Td>Headline Sharpe</Td>
                      <Td>1.44</Td>
                      <Td>2.23</Td>
                      <Td>0.25 avg</Td>
                      <Td>n/d</Td>
                      <Td>0.55-0.75</Td>
                    </tr>
                    <tr>
                      <Td>Max DD</Td>
                      <Td>-16.86%</Td>
                      <Td>-6.20%</Td>
                      <Td>-75.2%</Td>
                      <Td>n/d</Td>
                      <Td>-25% to -55%</Td>
                    </tr>
                    <tr className="bg-cream/50">
                      <Td>Honest median yr</Td>
                      <Td>n/d</Td>
                      <Td>n/d</Td>
                      <Td accent>-1.1%</Td>
                      <Td>n/d</Td>
                      <Td>~+13%</Td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commentary */}
            <div>
              <SectionHeader>Notable commentary</SectionHeader>
              <ol className="space-y-2.5">
                {[
                  {
                    title: 'Different risk buckets.',
                    body: "Eko/Alina are low-tracking-error, allocator-distributable products. Armstrong's LEAP-call book is venture-style payoff (high payoff ratio, lumpy Sharpe, fat tails). Direct Sharpe comparison flatters Alina and penalizes Armstrong on a metric that doesn't capture its asymmetry.",
                  },
                  {
                    title: 'Use payoff ratio externally, not Sharpe.',
                    body: 'Armstrong primer puts payoff ratio (avg win / avg loss) — 5.59× backtest 2013, 10× live Schwab — as the primary KPI. 1000+ Capital doesn\'t report payoff. To engage on their terms we either (a) vol-target Armstrong, or (b) reframe to expected payoff per unit at risk.',
                  },
                  {
                    title: 'Backtest honesty cuts both ways.',
                    body: "The 14Y median of -1.1% (7/14 negative years) is the inconvenient number the slick 1000+ Capital deck doesn't have to match. Eko at $25M live for 22.5 years is a real asset; Alina is hypothetical. Armstrong's strongest cards are live Schwab (388% / 85% win-rate / 3Y) and the structural LEAP-asymmetry rationale — not the walk-forward backtest.",
                  },
                  {
                    title: 'What to borrow from them.',
                    body: 'Their three-layer framework (Data & Signal / Orchestration / Execution), their AI-as-decision-support framing (AI monitors regime/decay; does not select securities), and their governance language (documented model rationale, version-controlled research/production segregation) is the institutional bar Armstrong must match to be allocator-ready.',
                  },
                  {
                    title: 'Non-overlapping wallets.',
                    body: '1000+ Capital sells scalable, governable, low-TE factor sleeves to banks/pensions/MPS. Armstrong is a high-conviction, payoff-asymmetry product. If Armstrong moves to a fund vehicle, the 1000+ Capital deck is a useful template for what allocators want in writing.',
                  },
                  {
                    title: 'Data flag.',
                    body: 'S&P 500 numbers here are public-data approximations — re-pull from vendor before this leaves the building. Eko\'s "low risk" descriptor implies hedging/vol-targeting, so the 64.74% headline is not the apples-to-apples comparator a casual reader will assume — request Eko monthly returns / fact sheet from 1000+ Capital to confirm.',
                  },
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="font-mono text-[9px] font-bold text-burgundy bg-burgundy-bg px-1.5 py-0.5 rounded-sm shrink-0 mt-0.5 border border-burgundy/20">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <span className="font-serif text-[12px] font-semibold text-ink">{item.title}</span>{' '}
                      <span className="font-mono text-[10px] text-ink leading-relaxed">{item.body}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Reference */}
            <div>
              <SectionHeader>Reference</SectionHeader>
              <ul className="space-y-1 font-mono text-[10px] text-ink leading-relaxed">
                <li>
                  <span className="text-ink-muted">Source PDF:</span>{' '}
                  <span className="text-ink">1000+ Capital 2026 marketing deck</span>{' '}
                  <span className="text-ink-muted">(received 2026-05-16). Contact: Amine Rouhana, amine@1000pluscapital.com</span>
                </li>
                <li>
                  <span className="text-ink-muted">Armstrong backtest deck (live):</span>{' '}
                  <a href="https://armstrong.loricorpuz.com/#backtest" className="text-burgundy underline hover:text-burgundy/70">
                    armstrong.loricorpuz.com/#backtest
                  </a>
                </li>
                <li>
                  <span className="text-ink-muted">Armstrong primer:</span>{' '}
                  <span className="text-ink">PRIMER_v3_BACKTEST_AND_CAPACITY.md (DeepOps repo)</span>
                </li>
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="pt-3 border-t border-rule">
              <p className="font-mono text-[9px] text-ink-faint leading-relaxed italic">
                Disclaimer — Past performance, simulated or actual, is not indicative of future results. Backtested figures reflect retroactive model application with the benefit of hindsight; live results may differ materially. This memo is an internal working document, not investment advice.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center py-3">
          <span className="font-mono text-[9px] text-ink-faint">
            Internal — Armstrong IC — 2026-05-17
          </span>
        </div>
      </div>
    </div>
  )
}
