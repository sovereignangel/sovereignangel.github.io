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
  DEEP_DIVES,
  INEQUALITY_BRIDGE,
  ITERATION_LOG,
  LANES,
  MARKETS,
  PROPOSED_PATH,
  RESEARCH_FRAMING,
  SCORECARD,
  SCORECARD_LANES,
  type LaneDeepDive,
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

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 mt-2.5 font-serif text-[15px] font-semibold uppercase tracking-[1px] text-burgundy first:mt-0">
      {children}
    </div>
  )
}

function DeepDive({
  laneId,
  deep,
  open,
  onToggle,
}: {
  laneId: string
  deep: LaneDeepDive
  open: (id: string) => boolean
  onToggle: (id: string) => void
}) {
  const rowId = `${laneId}-deep`
  return (
    <div className="mt-2 border-t border-rule-light pt-1.5">
      <Row
        open={open(rowId)}
        onToggle={() => onToggle(rowId)}
        head={
          <span className="font-serif text-[17px] font-semibold text-ink">
            Deeper · the chain, the record, the plan
          </span>
        }
        meta={
          <Meta>
            {deep.chain.length} links · {deep.facts.length} facts · {deep.plan.length} steps
          </Meta>
        }
      >
        <SubHead>The chain</SubHead>
        <ol className="space-y-1.5 border-l border-rule pl-3">
          {deep.chain.map((link, i) => (
            <li key={link.step}>
              <p className="text-[16px] leading-relaxed text-ink">
                <span className="mr-2 font-mono text-[13px] text-burgundy">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-semibold">{link.step}</span>
                <span className="text-ink-muted"> · </span>
                <span className="text-ink-light">{link.state}</span>
              </p>
              <p className="pl-7 text-[15px] leading-relaxed text-ink-muted">
                <Meta tone="amber">Convention · </Meta>
                {link.convention}
              </p>
            </li>
          ))}
        </ol>

        <SubHead>What is already on the record</SubHead>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
          {deep.facts.map(f => (
            <li key={f.fact} className="text-[15px] leading-relaxed text-ink-light">
              {f.fact}{' '}
              <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted">
                {f.source} · {f.asOf}
              </span>
            </li>
          ))}
        </ul>

        <SubHead>Identification</SubHead>
        <p className="text-[16px] leading-relaxed text-ink-light">{deep.identification}</p>

        <SubHead>Nearest prior work</SubHead>
        <ul className="space-y-1">
          {deep.priorWork.map(w => (
            <li key={w.cite} className="text-[15px] leading-relaxed">
              <span className="font-semibold text-ink">{w.cite}.</span> <span className="text-ink-light">{w.did}</span>{' '}
              <Meta tone="amber">Gap · </Meta>
              <span className="text-ink-muted">{w.gap}</span>
            </li>
          ))}
        </ul>

        <SubHead>Open questions</SubHead>
        {deep.openQuestions.map((q, i) => {
          const qId = `${laneId}-q-${i}`
          return (
            <Row
              key={qId}
              open={open(qId)}
              onToggle={() => onToggle(qId)}
              head={<span className="text-[16px] font-semibold leading-snug text-ink">{q.question}</span>}
              meta={<Meta>Why it matters</Meta>}
            >
              <Field label="Why it matters">{q.matters}</Field>
            </Row>
          )
        })}

        <SubHead>The plan</SubHead>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-rule">
                <th className="px-2 py-1 text-left font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">Window</th>
                <th className="px-2 py-1 text-left font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">Deliverable</th>
                <th className="px-2 py-1 text-left font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">Gate</th>
              </tr>
            </thead>
            <tbody>
              {deep.plan.map(step => (
                <tr key={step.window} className="border-b border-rule-light align-top last:border-b-0">
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[13px] text-burgundy">{step.window}</td>
                  <td className="px-2 py-1.5 text-[15px] leading-relaxed text-ink">{step.deliverable}</td>
                  <td className="px-2 py-1.5 text-[14px] leading-relaxed text-amber-ink">{step.gate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHead>How this dies</SubHead>
        <ul className="space-y-0.5">
          {deep.failureModes.map(f => (
            <li key={f} className="flex gap-2 text-[15px] leading-relaxed text-ink-light">
              <span className="shrink-0 text-red-ink">×</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-2.5 border border-rule bg-cream px-2.5 py-1.5">
          <p className="text-[16px] leading-relaxed text-ink">
            <Meta tone="amber">The twin lane · </Meta>
            {deep.crossLane}
          </p>
        </div>
      </Row>
    </div>
  )
}

const PIPELINE_ORDER: LaneStatus[] = ['candidate', 'probing', 'committed', 'parked']
const PIPELINE_NOTE: Record<LaneStatus, string> = {
  candidate: 'an idea with a pre-registered test, waiting its turn',
  probing: 'actively under test — a kill gate is live',
  committed: 'holds a position and a paragraph',
  parked: 'deliberately not pursued — the map stays honest',
}

function PipelineBoard() {
  return (
    <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-4">
      {PIPELINE_ORDER.map(st => {
        const lanes = LANES.filter(l => l.status === st)
        return (
          <div key={st} className="rounded-sm border border-rule-light bg-white p-2">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className={`rounded-sm border px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.5px] ${STATUS_CLASS[st]}`}>
                {STATUS_LABEL[st]}
              </span>
              <Meta>{lanes.length}</Meta>
            </div>
            <p className="mb-1.5 text-[13px] italic leading-snug text-ink-faint">{PIPELINE_NOTE[st]}</p>
            {lanes.length === 0 && <p className="text-[14px] text-ink-faint">—</p>}
            {lanes.map(l => (
              <div key={l.id} className="border-t border-rule-light py-1 first:border-t-0">
                <span className="font-serif text-[15px] font-semibold text-ink">
                  {l.numeral} · {l.name}
                </span>
                <span className="block font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted">{l.market}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
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
  const deep = DEEP_DIVES[lane.id]
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

      {deep && <DeepDive laneId={lane.id} deep={deep} open={open} onToggle={onToggle} />}
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
      ...LANES.flatMap(l => {
        const deep = DEEP_DIVES[l.id]
        return deep ? [`${l.id}-deep`, ...deep.openQuestions.map((_, i) => `${l.id}-q-${i}`)] : []
      }),
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
          <Block label="The Pipeline" meta="idea -> probe -> established, gated">
            <PipelineBoard />
          </Block>

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
            meta={`I–${LANES[LANES.length - 1].numeral} · ${committed} committed · ${probing} probing`}
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
