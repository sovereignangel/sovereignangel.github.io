'use client'

import DisciplineMap from '@/components/complexecon/DisciplineMap'
import {
  Block,
  FlatRow,
  Masthead,
  Meta,
  Row,
  SheetHead,
  Stat,
  TwoUp,
  splitColumns,
  useSheetState,
} from '@/components/complexecon/tearsheet'
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

const BLOCK_IDS = [
  'blk-premise',
  'blk-schools',
  'blk-practitioners',
  'blk-gaps',
  'blk-landscape',
  'blk-quadrants',
  'blk-position',
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-[16px] leading-relaxed text-ink-muted">
      <Meta tone="amber">{label} · </Meta>
      {children}
    </p>
  )
}

export default function StrategySheet() {
  const { openRows, closedBlocks, toggleRow, toggleBlock, expandAll, collapseAll } = useSheetState({
    storageKey: 'complexecon-strategy',
    blockIds: BLOCK_IDS,
    defaultRows: [],
  })

  const allRowIds = [
    ...SCHOOLS.map(s => s.id),
    ...PRACTITIONERS.map(p => p.id),
    ...GAPS.map(g => g.id),
    ...QUADRANTS.map(q => q.id),
  ]

  const openGround = DISCIPLINES.filter(d => d.open).length
  const [schoolsLeft, schoolsRight] = splitColumns(SCHOOLS, () => 1)
  const [practLeft, practRight] = splitColumns(PRACTITIONERS, () => 1)
  const [gapsLeft, gapsRight] = splitColumns(GAPS, () => 1)
  const [quadLeft, quadRight] = splitColumns(QUADRANTS, () => 1)

  const schoolRow = (s: (typeof SCHOOLS)[number]) => (
    <Row
      key={s.id}
      open={openRows.has(s.id)}
      onToggle={() => toggleRow(s.id)}
      head={<span className="font-serif text-[18px] font-semibold text-ink">{s.name}</span>}
      meta={<Meta>{s.where}</Meta>}
    >
      <p className="mb-1 text-[15px] text-ink-muted">{s.people}</p>
      <Field label="Method">{s.method}</Field>
      <p className="mt-1 text-[16px] leading-relaxed text-ink">
        <Meta tone="amber">Owns · </Meta>
        {s.owns}
      </p>
    </Row>
  )

  const practitionerRow = (p: (typeof PRACTITIONERS)[number]) => (
    <Row
      key={p.id}
      open={openRows.has(p.id)}
      onToggle={() => toggleRow(p.id)}
      head={<span className="font-serif text-[18px] font-semibold text-ink">{p.name}</span>}
      meta={<Meta>{p.vehicle}</Meta>}
    >
      <p className="text-[16px] leading-relaxed text-ink">
        <Meta tone="amber">Produced · </Meta>
        {p.produced}
      </p>
      <Field label="Moat">{p.moat}</Field>
    </Row>
  )

  const gapRow = (g: (typeof GAPS)[number]) => (
    <Row
      key={g.id}
      open={openRows.has(g.id)}
      onToggle={() => toggleRow(g.id)}
      head={<span className="font-serif text-[18px] font-semibold text-ink">{g.name}</span>}
      meta={<Meta tone="burgundy">Open</Meta>}
    >
      <p className="mb-1 text-[16px] leading-relaxed text-ink">{g.gap}</p>
      <Field label="Nearest occupants">{g.nearest}</Field>
      <p className="mt-1 text-[16px] leading-relaxed text-ink">
        <Meta tone="amber">Claimed by · </Meta>
        {g.claim}
      </p>
    </Row>
  )

  const quadrantRow = (q: (typeof QUADRANTS)[number]) => (
    <Row
      key={q.id}
      open={openRows.has(q.id)}
      onToggle={() => toggleRow(q.id)}
      head={
        <span
          className={`font-serif text-[17px] font-semibold uppercase tracking-[0.5px] ${
            q.highlight ? 'text-burgundy' : 'text-ink'
          }`}
        >
          {q.title}
        </span>
      }
      meta={q.highlight ? <Meta tone="burgundy">The seat</Meta> : undefined}
    >
      <p className="mb-1 text-[15px] leading-relaxed text-ink-muted">{q.occupants}</p>
      <p className={`text-[16px] leading-relaxed ${q.highlight ? 'font-semibold text-ink' : 'text-ink'}`}>
        {q.verdict}
      </p>
    </Row>
  )

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-[1320px] px-3 py-5 md:px-5 md:py-7">
        <Masthead
          kicker="Lori Corpuz · A Competitive Map"
          title="Research Strategy"
          meta="The field, its traders, and the unoccupied ground"
          active="strategy"
        />

        <SheetHead
          question={STRATEGY_FRAMING.question}
          subline="Editorial layer over the CEcon landscape · 76 researchers · 5,300+ papers"
          openCount={openRows.size}
          onExpandAll={() => expandAll(allRowIds)}
          onCollapseAll={collapseAll}
          stats={
            <>
              <Stat value={openGround} label="Open ground" />
              <Stat value={GAPS.length} label="Gaps" />
              <Stat muted value={SCHOOLS.length} label="Schools" />
              <Stat muted value={PRACTITIONERS.length} label="Run money" />
              <Stat muted value={DISCIPLINES.length} label="Disciplines" />
              <Stat muted value={QUADRANTS.length} label="Quadrants" />
            </>
          }
        />

        <div className="mb-3 space-y-3">
          <Block
            label="The Premise"
            meta="Framing"
            open={!closedBlocks.has('blk-premise')}
            onToggle={() => toggleBlock('blk-premise')}
          >
            <FlatRow>
              <p className="font-serif text-[18px] leading-relaxed text-ink">{STRATEGY_FRAMING.statement}</p>
            </FlatRow>
          </Block>

          <Block
            label="How the Field Is Studied"
            meta={`§ · ${SCHOOLS.length} schools`}
            open={!closedBlocks.has('blk-schools')}
            onToggle={() => toggleBlock('blk-schools')}
          >
            <TwoUp left={schoolsLeft.map(schoolRow)} right={schoolsRight.map(schoolRow)} />
          </Block>

          <Block
            label="The Subset That Runs Money"
            meta={`$ · ${PRACTITIONERS.length} practitioners`}
            open={!closedBlocks.has('blk-practitioners')}
            onToggle={() => toggleBlock('blk-practitioners')}
          >
            <TwoUp left={practLeft.map(practitionerRow)} right={practRight.map(practitionerRow)} />
          </Block>

          <Block
            label="The Gaps"
            meta={`○ · ${GAPS.length} unoccupied`}
            open={!closedBlocks.has('blk-gaps')}
            onToggle={() => toggleBlock('blk-gaps')}
          >
            <TwoUp left={gapsLeft.map(gapRow)} right={gapsRight.map(gapRow)} />
          </Block>

          <Block
            label="The Landscape"
            meta={`× · ${DISCIPLINES.length} disciplines · ${openGround} open`}
            open={!closedBlocks.has('blk-landscape')}
            onToggle={() => toggleBlock('blk-landscape')}
          >
            <FlatRow>
              <p className="text-[15px] leading-relaxed text-ink-light">
                Every sub-discipline placed by its value to investing and trading against how thoroughly practitioners
                have already mined it. Filled burgundy dots are the white space the research lanes claim; hollow dots
                are occupied ground. Hover or tap any dot for the schools behind it. Scores are editorial judgments,
                stated so they can be argued with.
              </p>
            </FlatRow>
            <div className="px-3 py-2">
              <DisciplineMap />
            </div>
            <div className="overflow-x-auto border-t border-rule-light">
              <table className="w-full min-w-[840px] border-collapse">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="px-3 py-1.5 text-left font-serif text-[15px] font-semibold uppercase tracking-[1px] text-burgundy">
                      Discipline
                    </th>
                    <th className="px-3 py-1.5 text-center font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">
                      Value
                    </th>
                    <th className="px-3 py-1.5 text-center font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">
                      Mined
                    </th>
                    <th className="px-3 py-1.5 text-left font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">
                      Why it matters to investing &amp; trading
                    </th>
                    <th className="px-3 py-1.5 text-left font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">
                      Where
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...DISCIPLINES]
                    .sort((a, b) => b.y - a.y)
                    .map(d => (
                      <tr
                        key={d.id}
                        className={`border-b border-rule-light last:border-b-0 ${d.open ? 'bg-burgundy-bg' : ''}`}
                      >
                        <td className="px-3 py-1">
                          <span className={`text-[15px] font-semibold ${d.open ? 'text-burgundy' : 'text-ink'}`}>
                            {d.name}
                          </span>
                        </td>
                        <td className="px-3 py-1 text-center font-mono text-[14px] text-ink">{d.y}</td>
                        <td className="px-3 py-1 text-center font-mono text-[14px] text-ink-muted">{d.x}</td>
                        <td className="px-3 py-1 text-[14px] leading-snug text-ink">{d.valueNote}</td>
                        <td className="px-3 py-1 text-[14px] leading-snug text-ink-muted">{d.where}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Block>

          <Block
            label="The Coarse Read"
            meta="◱ · runs money × what it studies"
            open={!closedBlocks.has('blk-quadrants')}
            onToggle={() => toggleBlock('blk-quadrants')}
          >
            <TwoUp left={quadLeft.map(quadrantRow)} right={quadRight.map(quadrantRow)} />
          </Block>

          <Block
            label="The Position"
            meta="→ · the unoccupied intersection"
            open={!closedBlocks.has('blk-position')}
            onToggle={() => toggleBlock('blk-position')}
          >
            <FlatRow>
              <p className="font-serif text-[18px] leading-relaxed text-ink">{POSITION_STATEMENT}</p>
            </FlatRow>
            <FlatRow>
              <p className="text-[15px] leading-relaxed text-ink-muted">
                {SCAFFOLDING_NOTE.text}{' '}
                <a
                  href={SCAFFOLDING_NOTE.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[13px] uppercase tracking-[0.5px] text-burgundy underline decoration-burgundy/40 underline-offset-2"
                >
                  {SCAFFOLDING_NOTE.label} →
                </a>
              </p>
            </FlatRow>
          </Block>
        </div>

        <footer className="flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-2">
          <p className="font-serif text-[16px] italic text-ink-muted">
            Not a new method — the field&rsquo;s methods, pointed where they have never been pointed.
          </p>
          <p className="font-mono text-[12px] uppercase tracking-[2px] text-ink-faint">
            loricorpuz.com/complexecon/strategy · working document
          </p>
        </footer>
      </div>
    </main>
  )
}
