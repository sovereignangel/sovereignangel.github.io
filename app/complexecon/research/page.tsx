import Link from 'next/link'
import type { Metadata } from 'next'
import {
  INEQUALITY_BRIDGE,
  ITERATION_LOG,
  LANES,
  MARKETS,
  PROPOSED_PATH,
  RESEARCH_FRAMING,
  SCORECARD,
  SCORECARD_LANES,
  type LaneStatus,
} from '@/lib/complexecon/research'

export const metadata: Metadata = {
  title: 'Research Lanes · Complexity Economics',
  description: 'Climate, grids, balance sheets — a working document of research lanes and hypotheses.',
}

const STATUS_LABEL: Record<LaneStatus, string> = {
  candidate: 'Candidate',
  probing: 'Probing',
  committed: 'Committed',
  parked: 'Parked',
}

const STATUS_CLASS: Record<LaneStatus, string> = {
  candidate: 'bg-transparent text-ink-muted border-rule',
  probing: 'bg-amber-bg text-amber-ink border-amber-ink/30',
  committed: 'bg-green-bg text-green-ink border-green-ink/30',
  parked: 'bg-transparent text-ink-faint border-rule-light',
}

const SCORE_CLASS: Record<'high' | 'med' | 'low', string> = {
  high: 'text-green-ink',
  med: 'text-amber-ink',
  low: 'text-ink-faint',
}

const SCORE_MARK: Record<'high' | 'med' | 'low', string> = {
  high: '●●●',
  med: '●●○',
  low: '●○○',
}

function SectionHeader({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3 border-b-2 border-rule pb-2">
      <span className="font-serif text-[20px] text-ink-faint">{numeral}</span>
      <h2 className="font-serif text-[23px] font-semibold uppercase tracking-[1.5px] text-burgundy">{title}</h2>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[14px] uppercase tracking-[1px] text-amber-ink">{children}</span>
  )
}

export default function ComplexEconResearchPage() {
  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        {/* ─── Masthead ─── */}
        <header className="mb-8 text-center">
          <div className="mb-3 font-mono text-[15px] uppercase tracking-[3px] text-ink-muted">
            Lori Corpuz · A Working Document
          </div>
          <h1 className="font-serif text-[47px] font-semibold leading-tight text-ink md:text-[55px]">
            {RESEARCH_FRAMING.title}
          </h1>
          <div className="mx-auto mt-3 mb-3 h-[2px] w-16 bg-burgundy" />
          <p className="font-serif text-[21px] italic text-ink-light">
            Research lanes toward a climate-to-markets program
          </p>
        </header>

        {/* ─── Tabs ─── */}
        <nav className="mb-10 flex justify-center gap-4 border-b border-rule pb-2">
          <Link
            href="/complexecon"
            className="py-1 font-serif text-[25px] text-ink-muted transition-colors hover:text-ink"
          >
            Pathway
          </Link>
          <span className="border-b-2 border-burgundy py-1 font-serif text-[25px] font-semibold text-burgundy">
            Research
          </span>
        </nav>

        {/* ─── The question ─── */}
        <section className="mb-10 border-y border-rule py-8 text-center">
          <p className="font-serif text-[29px] italic leading-snug text-ink md:text-[31px]">
            &ldquo;{RESEARCH_FRAMING.question}&rdquo;
          </p>
        </section>

        {/* ─── Framing ─── */}
        <section className="mb-12">
          <SectionHeader numeral="—" title="The Premise" />
          <p className="font-serif text-[21px] leading-relaxed text-ink">{RESEARCH_FRAMING.statement}</p>
        </section>

        {/* ─── Markets ─── */}
        <section className="mb-12">
          <SectionHeader numeral="§" title="The Markets" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {MARKETS.map(m => (
              <div key={m.id} className="rounded-sm border border-rule bg-white p-3">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="font-serif text-[19px] font-semibold text-ink">{m.name}</span>
                  <span className="rounded-sm border border-burgundy/20 bg-burgundy-bg px-1.5 py-0.5 font-mono text-[13px] uppercase tracking-[0.5px] text-burgundy">
                    {m.driver}
                  </span>
                </div>
                <p className="text-[17px] leading-relaxed text-ink-muted">{m.gap}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Lanes ─── */}
        <section className="mb-12">
          <SectionHeader numeral="I–IV" title="The Lanes" />
          <div className="space-y-6">
            {LANES.map(lane => (
              <div key={lane.id} className="rounded-sm border border-rule bg-white p-4">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-serif text-[23px] font-semibold text-ink-faint">{lane.numeral}</span>
                    <h3 className="font-serif text-[23px] font-semibold text-ink">{lane.name}</h3>
                  </div>
                  <span
                    className={`rounded-sm border px-1.5 py-0.5 font-mono text-[13px] uppercase tracking-[0.5px] ${STATUS_CLASS[lane.status]}`}
                  >
                    {STATUS_LABEL[lane.status]}
                  </span>
                </div>
                <div className="mb-3 font-mono text-[14px] uppercase tracking-[1px] text-ink-muted">
                  {lane.vector} · {lane.market}
                </div>

                <p className="mb-3 text-[19px] leading-relaxed text-ink">{lane.thesis}</p>

                <div className="mb-3 space-y-2">
                  <p className="text-[17px] leading-relaxed text-ink-muted">
                    <FieldLabel>Why the seat is empty · </FieldLabel>
                    {lane.whyOpen}
                  </p>
                  <p className="text-[17px] leading-relaxed text-ink-muted">
                    <FieldLabel>Complexity mechanism · </FieldLabel>
                    {lane.mechanism}
                  </p>
                </div>

                <div className="mb-3 border-t border-rule-light pt-2.5">
                  <div className="mb-1.5 font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    Hypotheses
                  </div>
                  <ul className="space-y-2.5">
                    {lane.hypotheses.map(h => (
                      <li key={h.id} className="flex gap-3">
                        <span className="shrink-0 font-mono text-[17px] font-semibold text-burgundy">{h.id}</span>
                        <div>
                          <p className="text-[17px] font-semibold leading-relaxed text-ink">{h.claim}</p>
                          <p className="mt-0.5 text-[17px] leading-relaxed text-ink-muted">
                            <FieldLabel>Test · </FieldLabel>
                            {h.test}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-3 border-t border-rule-light pt-2.5">
                  <div className="mb-1 font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    Data
                  </div>
                  <ul className="space-y-1">
                    {lane.data.map(d => (
                      <li key={d.url} className="flex flex-wrap items-baseline gap-x-2 text-[17px] leading-relaxed">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[15px] uppercase tracking-[0.5px] text-ink underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
                        >
                          {d.name} →
                        </a>
                        <span className="text-[15px] text-ink-muted">{d.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 gap-2.5 border-t border-rule-light pt-2.5 md:grid-cols-2">
                  <p className="text-[17px] leading-relaxed text-ink-muted">
                    <FieldLabel>Armstrong · </FieldLabel>
                    {lane.armstrongAngle}
                  </p>
                  <p className="text-[17px] leading-relaxed text-ink-muted">
                    <FieldLabel>Quant intelligence · </FieldLabel>
                    {lane.quantSkill}
                  </p>
                </div>

                <div className="mt-2.5 rounded-sm border border-rule bg-paper p-2.5">
                  <p className="text-[17px] leading-relaxed text-ink">
                    <FieldLabel>First probe · </FieldLabel>
                    {lane.firstProbe}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Inequality bridge ─── */}
        <section className="mb-12">
          <SectionHeader numeral="≡" title="The Inequality Bridge" />
          <div className="mb-4 border-y border-rule py-6 text-center">
            <p className="font-serif text-[27px] italic leading-snug text-ink md:text-[29px]">
              &ldquo;{INEQUALITY_BRIDGE.oneLiner}&rdquo;
            </p>
          </div>
          <p className="mb-5 font-serif text-[20px] leading-relaxed text-ink">{INEQUALITY_BRIDGE.statement}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {INEQUALITY_BRIDGE.cards.map(card => (
              <div key={card.title} className="rounded-sm border border-rule bg-white p-3">
                <div className="mb-1.5 font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  {card.title}
                </div>
                <p className="text-[17px] leading-relaxed text-ink-light">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Scorecard ─── */}
        <section className="mb-12">
          <SectionHeader numeral="×" title="The Scorecard" />
          <p className="mb-3 text-[17px] leading-relaxed text-ink-light">
            Lane selection is a decision, not a mood. Criteria fixed before probes run; ratings revised only in the
            iteration log.
          </p>
          <div className="overflow-x-auto rounded-sm border border-rule bg-white">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr className="border-b-2 border-rule">
                  <th className="p-2.5 text-left font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    Criterion
                  </th>
                  {SCORECARD_LANES.map(l => (
                    <th
                      key={l}
                      className="p-2.5 text-center font-mono text-[14px] uppercase tracking-[0.5px] text-ink-muted"
                    >
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCORECARD.map(row => (
                  <tr key={row.criterion} className="border-b border-rule-light last:border-b-0">
                    <td className="p-2.5">
                      <div className="text-[17px] font-semibold text-ink">{row.criterion}</div>
                      <div className="text-[15px] text-ink-muted">{row.note}</div>
                    </td>
                    {SCORECARD_LANES.map(l => (
                      <td key={l} className="p-2.5 text-center">
                        <span className={`font-mono text-[15px] tracking-[1px] ${SCORE_CLASS[row.scores[l]]}`}>
                          {SCORE_MARK[row.scores[l]]}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── The path ─── */}
        <section className="mb-12">
          <SectionHeader numeral="→" title="The Proposed Path" />
          <div className="space-y-3">
            {PROPOSED_PATH.map(step => (
              <div key={step.label} className="rounded-sm border border-rule bg-white p-3">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-[20px] font-semibold text-ink">{step.label}</span>
                  <span className="font-mono text-[14px] uppercase tracking-[1px] text-ink-muted">{step.window}</span>
                </div>
                <p className="mb-1.5 text-[17px] leading-relaxed text-ink-light">{step.detail}</p>
                <p className="text-[17px] leading-relaxed text-ink-muted">
                  <FieldLabel>Gate · </FieldLabel>
                  {step.gate}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Iteration log ─── */}
        <section className="mb-12">
          <SectionHeader numeral="Δ" title="Iteration Log" />
          <ul className="space-y-2.5">
            {ITERATION_LOG.map(entry => (
              <li key={entry.version} className="flex gap-3 rounded-sm border border-rule-light bg-white p-2.5">
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[17px] font-semibold text-burgundy">{entry.version}</div>
                  <div className="font-mono text-[13px] uppercase tracking-[0.5px] text-ink-faint">{entry.date}</div>
                </div>
                <p className="text-[17px] leading-relaxed text-ink-muted">{entry.note}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-rule pt-4 text-center">
          <p className="font-serif text-[19px] italic text-ink-muted">
            A lane is committed when it holds a position and a paragraph — one in the book, one in the paper.
          </p>
          <p className="mt-1.5 font-mono text-[14px] uppercase tracking-[2px] text-ink-faint">
            loricorpuz.com/complexecon/research · working document
          </p>
        </footer>
      </div>
    </main>
  )
}
