'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ARTIFACTS,
  CENTRAL_QUESTION,
  HYPOTHESES,
  LANE_STATEMENT,
  LIBRARY,
  STAGES,
  WORKSHOP,
  type BookTier,
} from '@/lib/complexecon/pathway'

const STORAGE_KEY = 'complexecon-progress'

const TIER_LABEL: Record<BookTier, string> = {
  spine: 'Spine',
  foundation: 'Foundation',
  reference: 'Reference',
}

const TIER_CLASS: Record<BookTier, string> = {
  spine: 'bg-burgundy-bg text-burgundy border-burgundy/25',
  foundation: 'bg-amber-bg text-amber-ink border-amber-ink/25',
  reference: 'bg-transparent text-ink-muted border-rule',
}

function useProgress() {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setDone(new Set(JSON.parse(raw) as string[]))
    } catch {
      // corrupted storage — start clean
    }
    setLoaded(true)
  }, [])

  const toggle = (id: string) => {
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  return { done, toggle, loaded }
}

function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={checked}
      className={`mt-[2px] h-[14px] w-[14px] shrink-0 rounded-sm border transition-colors ${
        checked ? 'border-burgundy bg-burgundy' : 'border-rule bg-white hover:border-ink-faint'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 14 14" className="h-full w-full" aria-hidden="true">
          <path d="M3.5 7.2 6 9.7 10.5 4.5" fill="none" stroke="#faf8f4" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

function SectionHeader({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3 border-b-2 border-rule pb-2">
      <span className="font-serif text-[13px] text-ink-faint">{numeral}</span>
      <h2 className="font-serif text-[15px] font-semibold uppercase tracking-[1.5px] text-burgundy">{title}</h2>
    </div>
  )
}

function ProgressRule({ pct }: { pct: number }) {
  return (
    <div className="h-[3px] w-full rounded-sm bg-rule-light">
      <div className="h-full rounded-sm bg-burgundy transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function ComplexEconPage() {
  const { done, toggle, loaded } = useProgress()

  const allMilestoneIds = useMemo(() => STAGES.flatMap(s => s.milestones.map(m => m.id)), [])
  const allBookIds = useMemo(() => LIBRARY.flatMap(t => t.items.map(i => i.id)), [])

  const milestonesDone = allMilestoneIds.filter(id => done.has(id)).length
  const booksDone = allBookIds.filter(id => done.has(id)).length

  const weeksOut = useMemo(() => {
    const ms = new Date(WORKSHOP.startDate + 'T00:00:00').getTime() - Date.now()
    return Math.max(0, Math.round(ms / (7 * 24 * 3600 * 1000)))
  }, [])

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        {/* ─── Masthead ─── */}
        <header className="mb-10 text-center">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[3px] text-ink-muted">
            Lori Corpuz · A Research Program
          </div>
          <h1 className="font-serif text-[34px] font-semibold leading-tight text-ink md:text-[42px]">
            Complexity Economics
          </h1>
          <div className="mx-auto mt-3 mb-3 h-[2px] w-16 bg-burgundy" />
          <p className="font-serif text-[14px] italic text-ink-light">
            A mastery pathway toward the {WORKSHOP.name}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[1.5px] text-ink-muted">
            {WORKSHOP.host} · {WORKSHOP.place} · {WORKSHOP.dates}
          </p>
        </header>

        {/* ─── The question ─── */}
        <section className="mb-12 border-y border-rule py-8 text-center">
          <p className="font-serif text-[22px] italic leading-snug text-ink md:text-[26px]">
            &ldquo;{CENTRAL_QUESTION}&rdquo;
          </p>
        </section>

        {/* ─── The lane ─── */}
        <section className="mb-12">
          <SectionHeader numeral="—" title="The Lane" />
          <p className="mb-5 font-serif text-[15px] leading-relaxed text-ink">{LANE_STATEMENT}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-sm border border-rule bg-white p-3">
              <div className="mb-1.5 font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                Continuity
              </div>
              <p className="text-[11px] leading-relaxed text-ink-light">
                Armstrong&rsquo;s edge thesis is already a performativity claim: analyst anchoring as a convention that
                partly constitutes the price it estimates. A live trading book as empirical evidence for a
                social-studies-of-finance argument.
              </p>
            </div>
            <div className="rounded-sm border border-rule bg-white p-3">
              <div className="mb-1.5 font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                Legibility
              </div>
              <p className="text-[11px] leading-relaxed text-ink-light">
                The workshop&rsquo;s lines of inquiry — embeddedness, value, the social structure of accumulation —
                are exactly where capital-allocation conventions sit. This supplies the firm-level mechanism to a
                literature working at household scale.
              </p>
            </div>
            <div className="rounded-sm border border-rule bg-white p-3">
              <div className="mb-1.5 font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                Occupancy
              </div>
              <p className="text-[11px] leading-relaxed text-ink-light">
                The complexity economics of AI itself is the field&rsquo;s biggest open gap, and performativity is the
                bridge into it. Essentially no one holds this ground who also trades.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Status strip ─── */}
        <section className="mb-12 grid grid-cols-3 gap-3">
          <div className="rounded-sm border border-rule bg-white p-3 text-center">
            <div className="font-mono text-[20px] font-semibold text-burgundy">{weeksOut}</div>
            <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted">Weeks to Abu Dhabi</div>
          </div>
          <div className="rounded-sm border border-rule bg-white p-3 text-center">
            <div className="font-mono text-[20px] font-semibold text-ink">
              {loaded ? milestonesDone : '·'}<span className="text-ink-faint">/{allMilestoneIds.length}</span>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted">Milestones</div>
          </div>
          <div className="rounded-sm border border-rule bg-white p-3 text-center">
            <div className="font-mono text-[20px] font-semibold text-ink">
              {loaded ? booksDone : '·'}<span className="text-ink-faint">/{allBookIds.length}</span>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted">Library</div>
          </div>
        </section>

        {/* ─── The pathway ─── */}
        <section className="mb-12">
          <SectionHeader numeral="I–V" title="The Pathway" />
          <div className="space-y-6">
            {STAGES.map(stage => {
              const total = stage.milestones.length
              const doneCount = stage.milestones.filter(m => done.has(m.id)).length
              const pct = total ? Math.round((doneCount / total) * 100) : 0
              return (
                <div key={stage.id} className="rounded-sm border border-rule bg-white p-4">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-serif text-[15px] font-semibold text-ink-faint">{stage.numeral}</span>
                      <h3 className="font-serif text-[15px] font-semibold text-ink">{stage.name}</h3>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted">
                      {stage.window} · {doneCount}/{total}
                    </span>
                  </div>
                  <p className="mb-3 text-[11px] leading-relaxed text-ink-light">{stage.aim}</p>
                  <div className="mb-3">
                    <ProgressRule pct={pct} />
                  </div>
                  <ul className="space-y-2.5">
                    {stage.milestones.map(m => {
                      const checked = done.has(m.id)
                      return (
                        <li key={m.id} className="flex gap-2.5">
                          <Checkbox checked={checked} onToggle={() => toggle(m.id)} />
                          <div>
                            <div
                              className={`text-[12px] font-semibold ${
                                checked ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
                              }`}
                            >
                              {m.label}
                            </div>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{m.detail}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── The library ─── */}
        <section className="mb-12">
          <SectionHeader numeral="§" title="The Library" />
          <p className="mb-5 text-[11px] leading-relaxed text-ink-light">
            Six books and two papers form the spine — the anti-dilettante rule holds. Foundation titles close specific
            gaps; reference titles are read for their argument, not their pages.
          </p>
          <div className="space-y-6">
            {LIBRARY.map(topic => (
              <div key={topic.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 border-b border-rule pb-1">
                  <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    {topic.name}
                  </h3>
                  <span className="font-mono text-[9px] text-ink-muted">
                    {topic.items.filter(i => done.has(i.id)).length}/{topic.items.length}
                  </span>
                </div>
                <p className="mb-2.5 text-[10px] italic leading-relaxed text-ink-muted">{topic.rationale}</p>
                <ul className="space-y-2">
                  {topic.items.map(item => {
                    const checked = done.has(item.id)
                    return (
                      <li key={item.id} className="flex gap-2.5 rounded-sm border border-rule-light bg-white p-2.5">
                        <Checkbox checked={checked} onToggle={() => toggle(item.id)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span
                              className={`font-serif text-[13px] font-semibold ${
                                checked ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
                              }`}
                            >
                              {item.title}
                            </span>
                            <span className="text-[10px] text-ink-muted">
                              {item.author}, {item.year}
                            </span>
                            <span
                              className={`rounded-sm border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.5px] ${TIER_CLASS[item.tier]}`}
                            >
                              {TIER_LABEL[item.tier]}
                            </span>
                            {item.kind === 'paper' && (
                              <span className="rounded-sm border border-rule px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.5px] text-ink-muted">
                                Paper
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{item.note}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Hypotheses ─── */}
        <section className="mb-12">
          <SectionHeader numeral="H" title="The Hypotheses" />
          <p className="mb-4 text-[11px] leading-relaxed text-ink-light">
            The lane only counts if it produces something falsifiable. Tests are fixed before results are examined.
          </p>
          <div className="space-y-3">
            {HYPOTHESES.map(h => (
              <div key={h.id} className="rounded-sm border border-rule bg-white p-3">
                <div className="flex gap-3">
                  <span className="font-mono text-[13px] font-semibold text-burgundy">{h.id}</span>
                  <div>
                    <p className="text-[12px] font-semibold leading-relaxed text-ink">{h.claim}</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
                      <span className="font-mono text-[9px] uppercase tracking-[1px] text-amber-ink">Test · </span>
                      {h.test}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Artifacts ─── */}
        <section className="mb-12">
          <SectionHeader numeral="Δ" title="The Artifacts" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ARTIFACTS.map(a => (
              <div key={a.id} className="rounded-sm border border-rule bg-white p-3">
                <div className="mb-1.5 font-serif text-[12px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  {a.name}
                </div>
                <p className="text-[11px] leading-relaxed text-ink-light">{a.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-rule pt-4 text-center">
          <p className="font-serif text-[12px] italic text-ink-muted">
            An engine, not a camera — the measurement moves the world.
          </p>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[2px] text-ink-faint">
            loricorpuz.com/complexecon · est. August 2026
          </p>
        </footer>
      </div>
    </main>
  )
}
