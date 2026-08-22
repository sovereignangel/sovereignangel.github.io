import Link from 'next/link'
import type { Metadata } from 'next'
import DisciplineMap from '@/components/complexecon/DisciplineMap'
import {
  DISCIPLINES,
  GAPS,
  PRACTITIONERS,
  POSITION_STATEMENT,
  QUADRANTS,
  SCAFFOLDING_NOTE,
  SCHOOLS,
  STRATEGY_FRAMING,
} from '@/lib/complexecon/strategy'

export const metadata: Metadata = {
  title: 'Research Strategy · Complexity Economics',
  description: 'The competitive map of complexity economics — schools, practitioners, and the gaps in their research.',
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
  return <span className="font-mono text-[14px] uppercase tracking-[1px] text-amber-ink">{children}</span>
}

export default function ComplexEconStrategyPage() {
  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        {/* ─── Masthead ─── */}
        <header className="mb-8 text-center">
          <div className="mb-3 font-mono text-[15px] uppercase tracking-[3px] text-ink-muted">
            Lori Corpuz · A Competitive Map
          </div>
          <h1 className="font-serif text-[47px] font-semibold leading-tight text-ink md:text-[55px]">
            Research Strategy
          </h1>
          <div className="mx-auto mt-3 mb-3 h-[2px] w-16 bg-burgundy" />
          <p className="font-serif text-[21px] italic text-ink-light">
            The field, its traders, and the unoccupied ground
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
          <Link
            href="/complexecon/research"
            className="py-1 font-serif text-[25px] text-ink-muted transition-colors hover:text-ink"
          >
            Research
          </Link>
          <span className="border-b-2 border-burgundy py-1 font-serif text-[25px] font-semibold text-burgundy">
            Strategy
          </span>
        </nav>

        {/* ─── The question ─── */}
        <section className="mb-10 border-y border-rule py-8 text-center">
          <p className="font-serif text-[29px] italic leading-snug text-ink md:text-[31px]">
            &ldquo;{STRATEGY_FRAMING.question}&rdquo;
          </p>
        </section>

        {/* ─── Framing ─── */}
        <section className="mb-12">
          <SectionHeader numeral="—" title="The Premise" />
          <p className="font-serif text-[21px] leading-relaxed text-ink">{STRATEGY_FRAMING.statement}</p>
        </section>

        {/* ─── The schools ─── */}
        <section className="mb-12">
          <SectionHeader numeral="§" title="How the Field Is Studied" />
          <p className="mb-4 text-[17px] leading-relaxed text-ink-light">
            Eight schools plus one new hub. Each owns specific ground; the strategy question is what each has left
            unclaimed, not what any has done wrong.
          </p>
          <div className="space-y-4">
            {SCHOOLS.map(s => (
              <div key={s.id} className="rounded-sm border border-rule bg-white p-4">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-[22px] font-semibold text-ink">{s.name}</h3>
                  <span className="font-mono text-[14px] uppercase tracking-[0.5px] text-ink-muted">{s.where}</span>
                </div>
                <div className="mb-2 text-[16px] text-ink-muted">{s.people}</div>
                <p className="mb-1.5 text-[17px] leading-relaxed text-ink-muted">
                  <FieldLabel>Method · </FieldLabel>
                  {s.method}
                </p>
                <p className="text-[17px] leading-relaxed text-ink">
                  <FieldLabel>Owns · </FieldLabel>
                  {s.owns}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── The practitioner subset ─── */}
        <section className="mb-12">
          <SectionHeader numeral="$" title="The Subset That Runs Money" />
          <p className="mb-4 text-[17px] leading-relaxed text-ink-light">
            The traders and investors of the field — what each actually produced, and the moat that keeps their
            ground theirs. What this subset has collectively produced clusters almost entirely around liquid-market
            microstructure and tail risk.
          </p>
          <div className="space-y-4">
            {PRACTITIONERS.map(p => (
              <div key={p.id} className="rounded-sm border border-rule bg-white p-4">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-[22px] font-semibold text-ink">{p.name}</h3>
                </div>
                <div className="mb-2 font-mono text-[14px] uppercase tracking-[0.5px] text-ink-muted">{p.vehicle}</div>
                <p className="mb-1.5 text-[17px] leading-relaxed text-ink">
                  <FieldLabel>Produced · </FieldLabel>
                  {p.produced}
                </p>
                <p className="text-[17px] leading-relaxed text-ink-muted">
                  <FieldLabel>Moat · </FieldLabel>
                  {p.moat}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── The gaps ─── */}
        <section className="mb-12">
          <SectionHeader numeral="○" title="The Gaps" />
          <p className="mb-4 text-[17px] leading-relaxed text-ink-light">
            White space in what the field — and especially its trading subset — has produced. Each gap names its
            nearest occupant and which lane on the Research tab claims it.
          </p>
          <div className="space-y-4">
            {GAPS.map(g => (
              <div key={g.id} className="rounded-sm border border-rule bg-white p-4">
                <h3 className="mb-1.5 font-serif text-[22px] font-semibold text-ink">{g.name}</h3>
                <p className="mb-1.5 text-[17px] leading-relaxed text-ink">{g.gap}</p>
                <p className="mb-1.5 text-[17px] leading-relaxed text-ink-muted">
                  <FieldLabel>Nearest occupants · </FieldLabel>
                  {g.nearest}
                </p>
                <p className="text-[17px] leading-relaxed text-ink">
                  <FieldLabel>Claimed by · </FieldLabel>
                  {g.claim}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── The landscape map ─── */}
        <section className="mb-12">
          <SectionHeader numeral="×" title="The Landscape" />
          <p className="mb-4 text-[17px] leading-relaxed text-ink-light">
            Every sub-discipline of complexity economics placed by its value to investing and trading against how
            thoroughly practitioners have already mined it. Filled burgundy dots are the white space the research
            lanes claim; hollow dots are occupied ground. Hover or tap any dot for the schools and institutions
            behind it. Scores are editorial judgments, stated so they can be argued with.
          </p>
          <DisciplineMap />

          {/* Table view — the same data, readable without the chart */}
          <div className="mt-4 overflow-x-auto rounded-sm border border-rule bg-white">
            <table className="w-full min-w-[840px] border-collapse">
              <thead>
                <tr className="border-b-2 border-rule">
                  <th className="p-2.5 text-left font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    Discipline
                  </th>
                  <th className="p-2.5 text-center font-mono text-[14px] uppercase tracking-[0.5px] text-ink-muted">
                    Value
                  </th>
                  <th className="p-2.5 text-center font-mono text-[14px] uppercase tracking-[0.5px] text-ink-muted">
                    Mined
                  </th>
                  <th className="p-2.5 text-left font-mono text-[14px] uppercase tracking-[0.5px] text-ink-muted">
                    Why it matters to investing &amp; trading
                  </th>
                  <th className="p-2.5 text-left font-mono text-[14px] uppercase tracking-[0.5px] text-ink-muted">
                    Where
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...DISCIPLINES]
                  .sort((a, b) => b.y - a.y)
                  .map(d => (
                    <tr key={d.id} className={`border-b border-rule-light last:border-b-0 ${d.open ? 'bg-burgundy-bg' : ''}`}>
                      <td className="p-2.5">
                        <span className={`text-[16px] font-semibold ${d.open ? 'text-burgundy' : 'text-ink'}`}>
                          {d.name}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono text-[15px] text-ink">{d.y}</td>
                      <td className="p-2.5 text-center font-mono text-[15px] text-ink-muted">{d.x}</td>
                      <td className="p-2.5 text-[15px] leading-snug text-ink">{d.valueNote}</td>
                      <td className="p-2.5 text-[15px] leading-snug text-ink-muted">{d.where}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── The quadrants ─── */}
        <section className="mb-12">
          <SectionHeader numeral="◱" title="The Coarse Read" />
          <p className="mb-4 text-[17px] leading-relaxed text-ink-light">
            The same map collapsed to two axes: whether the work runs money, and whether it studies financial
            microstructure or physical-economic systems.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {QUADRANTS.map(q => (
              <div
                key={q.id}
                className={`rounded-sm border p-4 ${
                  q.highlight ? 'border-burgundy bg-burgundy-bg' : 'border-rule bg-white'
                }`}
              >
                <div
                  className={`mb-1.5 font-serif text-[17px] font-semibold uppercase tracking-[0.5px] ${
                    q.highlight ? 'text-burgundy' : 'text-ink'
                  }`}
                >
                  {q.title}
                </div>
                <p className="mb-1.5 text-[16px] leading-relaxed text-ink-muted">{q.occupants}</p>
                <p className={`text-[17px] leading-relaxed ${q.highlight ? 'font-semibold text-ink' : 'text-ink'}`}>
                  {q.verdict}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── The position ─── */}
        <section className="mb-12">
          <SectionHeader numeral="→" title="The Position" />
          <div className="border-y border-rule py-6">
            <p className="font-serif text-[21px] leading-relaxed text-ink">{POSITION_STATEMENT}</p>
          </div>
        </section>

        {/* ─── Scaffolding note ─── */}
        <section className="mb-12 rounded-sm border border-rule bg-white p-4">
          <p className="text-[17px] leading-relaxed text-ink-muted">
            {SCAFFOLDING_NOTE.text}{' '}
            <a
              href={SCAFFOLDING_NOTE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[15px] uppercase tracking-[0.5px] text-burgundy underline decoration-burgundy/40 underline-offset-2"
            >
              {SCAFFOLDING_NOTE.label} →
            </a>
          </p>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-rule pt-4 text-center">
          <p className="font-serif text-[19px] italic text-ink-muted">
            Not a new method — the field&rsquo;s methods, pointed where they have never been pointed.
          </p>
          <p className="mt-1.5 font-mono text-[14px] uppercase tracking-[2px] text-ink-faint">
            loricorpuz.com/complexecon/strategy · working document
          </p>
        </footer>
      </div>
    </main>
  )
}
