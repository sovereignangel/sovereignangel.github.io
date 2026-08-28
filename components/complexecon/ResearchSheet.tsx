'use client'

import { useMemo } from 'react'
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
  INEQUALITY_BRIDGE,
  ITERATION_LOG,
  LANES,
  MARKETS,
  PROPOSED_PATH,
  RESEARCH_FRAMING,
  SCORECARD,
  SCORECARD_LANES,
  type LaneStatus,
  type ResearchLane,
} from '@/lib/complexecon/research'

const BLOCK_IDS = ['blk-premise', 'blk-markets', 'blk-lanes', 'blk-bridge', 'blk-scorecard', 'blk-path', 'blk-log']

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-[16px] leading-relaxed text-ink-muted">
      <Meta tone="amber">{label} · </Meta>
      {children}
    </p>
  )
}

function LaneBody({
  lane,
  open,
  onToggle,
}: {
  lane: ResearchLane
  open: (id: string) => boolean
  onToggle: (id: string) => void
}) {
  return (
    <>
      <p className="mb-2 text-[17px] leading-relaxed text-ink">{lane.thesis}</p>
      <div className="mb-2 space-y-1">
        <Field label="Why the seat is empty">{lane.whyOpen}</Field>
        <Field label="Complexity mechanism">{lane.mechanism}</Field>
      </div>

      <div className="border-t border-rule-light pt-1.5">
        <div className="mb-0.5 font-serif text-[15px] font-semibold uppercase tracking-[1px] text-burgundy">
          Hypotheses
        </div>
        {lane.hypotheses.map(h => (
          <Row
            key={h.id}
            open={open(h.id)}
            onToggle={() => onToggle(h.id)}
            head={
              <span className="flex gap-2">
                <span className="shrink-0 font-mono text-[16px] font-semibold text-burgundy">{h.id}</span>
                <span className="text-[16px] font-semibold leading-snug text-ink">{h.claim}</span>
              </span>
            }
            meta={<Meta>Test</Meta>}
          >
            <Field label="Test">{h.test}</Field>
          </Row>
        ))}
      </div>

      <div className="mt-2 border-t border-rule-light pt-1.5">
        <div className="mb-1 font-serif text-[15px] font-semibold uppercase tracking-[1px] text-burgundy">Data</div>
        <ul className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          {lane.data.map(d => (
            <li key={d.url} className="flex flex-wrap items-baseline gap-x-2 leading-relaxed">
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[13px] uppercase tracking-[0.5px] text-ink underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
              >
                {d.name} →
              </a>
              <span className="text-[14px] text-ink-muted">{d.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-x-6 border-t border-rule-light pt-1.5 md:grid-cols-2">
        <Field label="Armstrong">{lane.armstrongAngle}</Field>
        <Field label="Quant intelligence">{lane.quantSkill}</Field>
      </div>

      <div className="mt-2 border border-rule bg-cream px-2.5 py-1.5">
        <p className="text-[16px] leading-relaxed text-ink">
          <Meta tone="amber">First probe · </Meta>
          {lane.firstProbe}
        </p>
      </div>
    </>
  )
}

export default function ResearchSheet() {
  const { openRows, closedBlocks, toggleRow, toggleBlock, expandAll, collapseAll } = useSheetState({
    storageKey: 'complexecon-research',
    blockIds: BLOCK_IDS,
    defaultRows: [LANES[0].id],
  })

  const allRowIds = useMemo(
    () => [
      ...MARKETS.map(m => m.id),
      ...LANES.map(l => l.id),
      ...LANES.flatMap(l => l.hypotheses.map(h => h.id)),
      ...INEQUALITY_BRIDGE.cards.map(c => c.title),
      ...PROPOSED_PATH.map(s => s.label),
    ],
    [],
  )

  const hypothesisCount = LANES.reduce((n, l) => n + l.hypotheses.length, 0)
  const dataCount = LANES.reduce((n, l) => n + l.data.length, 0)
  const committed = LANES.filter(l => l.status === 'committed').length
  const probing = LANES.filter(l => l.status === 'probing').length
  const [marketsLeft, marketsRight] = splitColumns(MARKETS, () => 1)
  const [pathLeft, pathRight] = splitColumns(PROPOSED_PATH, () => 1)
  const [logLeft, logRight] = splitColumns(ITERATION_LOG, () => 1)

  const marketRow = (m: (typeof MARKETS)[number]) => (
    <Row
      key={m.id}
      open={openRows.has(m.id)}
      onToggle={() => toggleRow(m.id)}
      head={<span className="font-serif text-[18px] font-semibold text-ink">{m.name}</span>}
      meta={
        <span className="rounded-sm border border-burgundy/20 bg-burgundy-bg px-1 py-px font-mono text-[11px] uppercase tracking-[0.5px] text-burgundy">
          {m.driver}
        </span>
      }
    >
      <p className="text-[16px] leading-relaxed text-ink-muted">{m.gap}</p>
    </Row>
  )

  const pathRow = (step: (typeof PROPOSED_PATH)[number]) => (
    <Row
      key={step.label}
      open={openRows.has(step.label)}
      onToggle={() => toggleRow(step.label)}
      head={<span className="font-serif text-[17px] font-semibold text-ink">{step.label}</span>}
      meta={<Meta>{step.window}</Meta>}
    >
      <p className="mb-1 text-[16px] leading-relaxed text-ink-light">{step.detail}</p>
      <Field label="Gate">{step.gate}</Field>
    </Row>
  )

  const logRow = (entry: (typeof ITERATION_LOG)[number]) => (
    <Row
      key={entry.version + entry.date}
      open={openRows.has(entry.version + entry.date)}
      onToggle={() => toggleRow(entry.version + entry.date)}
      head={
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-[16px] font-semibold text-burgundy">{entry.version}</span>
          <span className="truncate text-[15px] text-ink-muted">{entry.note}</span>
        </span>
      }
      meta={<Meta>{entry.date}</Meta>}
    >
      <p className="text-[16px] leading-relaxed text-ink-muted">{entry.note}</p>
    </Row>
  )

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-[1320px] px-3 py-5 md:px-5 md:py-7">
        <Masthead
          kicker="Lori Corpuz · A Working Document"
          title={RESEARCH_FRAMING.title}
          meta="Research lanes toward a climate-to-markets program"
          active="research"
        />

        <SheetHead
          question={RESEARCH_FRAMING.question}
          subline={`Latest revision ${ITERATION_LOG[0].version} · ${ITERATION_LOG[0].date}`}
          openCount={openRows.size}
          onExpandAll={() => expandAll(allRowIds)}
          onCollapseAll={collapseAll}
          stats={
            <>
              <Stat value={LANES.length} label="Lanes" />
              <Stat value={committed} label="Committed" />
              <Stat muted value={probing} label="Probing" />
              <Stat muted value={hypothesisCount} label="Hypotheses" />
              <Stat muted value={dataCount} label="Data sets" />
              <Stat muted value={MARKETS.length} label="Markets" />
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
              <p className="font-serif text-[18px] leading-relaxed text-ink">{RESEARCH_FRAMING.statement}</p>
            </FlatRow>
          </Block>

          <Block
            label="The Markets"
            meta={`§ · ${MARKETS.length} grids`}
            open={!closedBlocks.has('blk-markets')}
            onToggle={() => toggleBlock('blk-markets')}
          >
            <TwoUp left={marketsLeft.map(marketRow)} right={marketsRight.map(marketRow)} />
          </Block>

          <Block
            label="The Lanes"
            meta={`I–V · ${committed} committed · ${probing} probing`}
            open={!closedBlocks.has('blk-lanes')}
            onToggle={() => toggleBlock('blk-lanes')}
          >
            {LANES.map(lane => (
              <Row
                key={lane.id}
                open={openRows.has(lane.id)}
                onToggle={() => toggleRow(lane.id)}
                head={
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-serif text-[17px] font-semibold text-ink-faint">{lane.numeral}</span>
                    <span className="font-serif text-[19px] font-semibold text-ink">{lane.name}</span>
                    <span className="font-mono text-[12px] uppercase tracking-[1px] text-ink-muted">
                      {lane.vector} · {lane.market}
                    </span>
                  </span>
                }
                meta={
                  <span className="flex items-center gap-2">
                    <Meta>{lane.hypotheses.length} H</Meta>
                    <span
                      className={`rounded-sm border px-1 py-px font-mono text-[11px] uppercase tracking-[0.5px] ${STATUS_CLASS[lane.status]}`}
                    >
                      {STATUS_LABEL[lane.status]}
                    </span>
                  </span>
                }
              >
                <LaneBody lane={lane} open={id => openRows.has(id)} onToggle={toggleRow} />
              </Row>
            ))}
          </Block>

          <Block
            label="The Inequality Bridge"
            meta="≡ · physical state → convention → incidence"
            open={!closedBlocks.has('blk-bridge')}
            onToggle={() => toggleBlock('blk-bridge')}
          >
            <FlatRow>
              <p className="font-serif text-[21px] italic leading-snug text-ink">
                &ldquo;{INEQUALITY_BRIDGE.oneLiner}&rdquo;
              </p>
              <p className="mt-1.5 text-[16px] leading-relaxed text-ink-light">{INEQUALITY_BRIDGE.statement}</p>
            </FlatRow>
            <TwoUp
              left={INEQUALITY_BRIDGE.cards.slice(0, 2).map(card => (
                <Row
                  key={card.title}
                  open={openRows.has(card.title)}
                  onToggle={() => toggleRow(card.title)}
                  head={
                    <span className="font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                      {card.title}
                    </span>
                  }
                >
                  <p className="text-[16px] leading-relaxed text-ink-light">{card.body}</p>
                </Row>
              ))}
              right={INEQUALITY_BRIDGE.cards.slice(2).map(card => (
                <Row
                  key={card.title}
                  open={openRows.has(card.title)}
                  onToggle={() => toggleRow(card.title)}
                  head={
                    <span className="font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                      {card.title}
                    </span>
                  }
                >
                  <p className="text-[16px] leading-relaxed text-ink-light">{card.body}</p>
                </Row>
              ))}
            />
          </Block>

          <Block
            label="The Scorecard"
            meta="× · criteria fixed before probes"
            open={!closedBlocks.has('blk-scorecard')}
            onToggle={() => toggleBlock('blk-scorecard')}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="px-3 py-1.5 text-left font-serif text-[15px] font-semibold uppercase tracking-[1px] text-burgundy">
                      Criterion
                    </th>
                    {SCORECARD_LANES.map(l => (
                      <th
                        key={l}
                        className="px-3 py-1.5 text-center font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted"
                      >
                        {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCORECARD.map(row => (
                    <tr key={row.criterion} className="border-b border-rule-light last:border-b-0">
                      <td className="px-3 py-1.5">
                        <span className="text-[16px] font-semibold text-ink">{row.criterion}</span>{' '}
                        <span className="text-[14px] text-ink-muted">{row.note}</span>
                      </td>
                      {SCORECARD_LANES.map(l => (
                        <td key={l} className="px-3 py-1.5 text-center">
                          <span className={`font-mono text-[14px] tracking-[1px] ${SCORE_CLASS[row.scores[l]]}`}>
                            {SCORE_MARK[row.scores[l]]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>

          <Block
            label="The Proposed Path"
            meta={`→ · ${PROPOSED_PATH.length} steps`}
            open={!closedBlocks.has('blk-path')}
            onToggle={() => toggleBlock('blk-path')}
          >
            <TwoUp left={pathLeft.map(pathRow)} right={pathRight.map(pathRow)} />
          </Block>

          <Block
            label="Iteration Log"
            meta={`Δ · ${ITERATION_LOG.length} revisions`}
            open={!closedBlocks.has('blk-log')}
            onToggle={() => toggleBlock('blk-log')}
          >
            <TwoUp left={logLeft.map(logRow)} right={logRight.map(logRow)} />
          </Block>
        </div>

        <footer className="flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-2">
          <p className="font-serif text-[16px] italic text-ink-muted">
            A lane is committed when it holds a position and a paragraph — one in the book, one in the paper.
          </p>
          <p className="font-mono text-[12px] uppercase tracking-[2px] text-ink-faint">
            loricorpuz.com/complexecon/research · working document
          </p>
        </footer>
      </div>
    </main>
  )
}
