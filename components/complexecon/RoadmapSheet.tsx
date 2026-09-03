'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Block,
  Checkbox,
  FlatRow,
  Masthead,
  Meta,
  Row,
  SheetHead,
  Stat,
  useSheetState,
} from '@/components/complexecon/tearsheet'
import {
  ANTHRO_PAPERS,
  BOOKS,
  CE_PAPERS,
  DATA_QUALITY,
  GOALS,
  PHASES,
  WINTER,
  type ReadingItem,
} from '@/lib/complexecon/roadmap'

const BLOCK_IDS = ['blk-goals', 'blk-phases', 'blk-data', 'blk-ce', 'blk-anthro', 'blk-books']
const DONE_KEY = 'complexecon-roadmap-done'

/** Read/reproduction progress, kept in localStorage like the pathway sheet. */
function useDone() {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DONE_KEY)
      if (raw) setDone(new Set(JSON.parse(raw) as string[]))
    } catch {
      // corrupted storage — start clean
    }
    setLoaded(true)
  }, [])
  const toggle = (id: string) =>
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(DONE_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  return { done, toggle, loaded }
}

function ReadingRow({
  item,
  checked,
  onToggle,
}: {
  item: ReadingItem
  checked: boolean
  onToggle: () => void
}) {
  return (
    <FlatRow>
      <div className="flex items-start gap-2">
        <Checkbox checked={checked} onToggle={onToggle} label={`Mark ${item.title} done`} />
        <div className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span
              className={`font-serif text-[18px] font-semibold ${
                checked ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
              }`}
            >
              {item.title}
            </span>
            <span className="text-[15px] text-ink-muted">
              {item.authors}, {item.year}
            </span>
            {item.reproduce && (
              <span className="rounded-sm border border-burgundy/25 bg-burgundy-bg px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.5px] text-burgundy">
                Reproduce
              </span>
            )}
          </span>
          <p className="mt-0.5 text-[15px] leading-relaxed text-ink-muted">
            {item.note}
            {item.reproduce && (
              <>
                {' '}
                <Meta tone="amber">Reproduction · </Meta>
                {item.reproduce}
              </>
            )}
          </p>
        </div>
      </div>
    </FlatRow>
  )
}

export default function RoadmapSheet() {
  const { openRows, closedBlocks, toggleRow, toggleBlock, expandAll, collapseAll } = useSheetState({
    storageKey: 'complexecon-roadmap',
    blockIds: BLOCK_IDS,
    defaultRows: ['p0'],
  })
  const { done, toggle, loaded } = useDone()

  const daysOut = useMemo(() => {
    const ms = new Date(WINTER.start + 'T00:00:00').getTime() - Date.now()
    return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)))
  }, [])

  const ceRepro = CE_PAPERS.filter(p => p.reproduce)
  const ceRead = CE_PAPERS.filter(p => !p.reproduce)
  const anRepro = ANTHRO_PAPERS.filter(p => p.reproduce)
  const anRead = ANTHRO_PAPERS.filter(p => !p.reproduce)

  const count = (items: ReadingItem[]) => items.filter(i => done.has(i.id)).length
  const allRowIds = [...PHASES.map(p => p.id), ...GOALS.map(g => g.id)]

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-[1320px] px-3 py-5 md:px-5 md:py-7">
        <Masthead
          kicker="Lori Corpuz · The Road to Abu Dhabi"
          title="Roadmap"
          meta={`${WINTER.name} · ${WINTER.place} · Jan 3–17, 2027`}
          active="roadmap"
        />

        <SheetHead
          question="What must be true on January 2 — and which week does each piece get done?"
          subline="Four goals · six phases · one paper"
          openCount={openRows.size}
          onExpandAll={() => expandAll(allRowIds)}
          onCollapseAll={collapseAll}
          stats={
            <>
              <Stat value={daysOut} label="Days to the room" />
              <Stat value="Dec 20" label="Paper final" />
              <Stat
                muted
                value={
                  <>
                    {loaded ? count(CE_PAPERS) : '·'}
                    <span className="text-ink-faint">/{CE_PAPERS.length}</span>
                  </>
                }
                label="CE papers"
              />
              <Stat
                muted
                value={
                  <>
                    {loaded ? count(ANTHRO_PAPERS) : '·'}
                    <span className="text-ink-faint">/{ANTHRO_PAPERS.length}</span>
                  </>
                }
                label="Anthro papers"
              />
              <Stat
                muted
                value={
                  <>
                    {loaded ? count([...ceRepro, ...anRepro]) : '·'}
                    <span className="text-ink-faint">/{ceRepro.length + anRepro.length}</span>
                  </>
                }
                label="Reproductions"
              />
              <Stat
                muted
                value={
                  <>
                    {loaded ? count(BOOKS) : '·'}
                    <span className="text-ink-faint">/{BOOKS.length}</span>
                  </>
                }
                label="Books"
              />
            </>
          }
        />

        <div className="space-y-3">
          {/* ─── The four goals ─── */}
          <Block
            label="The Four Winter Goals"
            meta="what walks in the door"
            open={!closedBlocks.has('blk-goals')}
            onToggle={() => toggleBlock('blk-goals')}
          >
            {GOALS.map(g => (
              <Row
                key={g.id}
                open={openRows.has(g.id)}
                onToggle={() => toggleRow(g.id)}
                head={
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-[16px] font-semibold text-burgundy">{g.numeral}</span>
                    <span className="font-serif text-[19px] font-semibold text-ink">{g.name}</span>
                    <span className="text-[16px] text-ink-muted">{g.target}</span>
                  </span>
                }
                meta={null}
              >
                <p className="text-[16px] leading-relaxed text-ink">{g.detail}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">
                  <Meta tone="amber">Cadence · </Meta>
                  {g.cadence}
                </p>
              </Row>
            ))}
          </Block>

          {/* ─── The phases ─── */}
          <Block
            label="The Phases"
            meta="Sep 3 → Jan 17"
            open={!closedBlocks.has('blk-phases')}
            onToggle={() => toggleBlock('blk-phases')}
          >
            {PHASES.map(p => (
              <Row
                key={p.id}
                open={openRows.has(p.id)}
                onToggle={() => toggleRow(p.id)}
                head={
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-serif text-[19px] font-semibold text-ink">{p.name}</span>
                  </span>
                }
                meta={<Meta>{p.window}</Meta>}
              >
                <p className="text-[16px] leading-relaxed text-ink">{p.detail}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">
                  <Meta tone="burgundy">Gate · </Meta>
                  {p.gate}
                </p>
              </Row>
            ))}
          </Block>

          {/* ─── Data quality ranking ─── */}
          <Block
            label="Data Quality by Lane"
            meta="what can actually be gotten"
            open={!closedBlocks.has('blk-data')}
            onToggle={() => toggleBlock('blk-data')}
          >
            {DATA_QUALITY.map(d => (
              <FlatRow key={d.lane}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-[16px] font-semibold text-burgundy">{d.rank}</span>
                  <span className="font-serif text-[18px] font-semibold text-ink">
                    {d.lane} · {d.name}
                  </span>
                  <span className="font-mono text-[15px] text-ink">{d.score.toFixed(1)}/10</span>
                </div>
                <p className="mt-0.5 text-[15px] leading-relaxed text-ink-muted">
                  <Meta tone="amber">Strength · </Meta>
                  {d.strength} <Meta tone="burgundy"> Weakness · </Meta>
                  {d.weakness}
                </p>
              </FlatRow>
            ))}
          </Block>

          {/* ─── Complexity economics reading ─── */}
          <Block
            label="Complexity Economics — 30 Papers, 10 Reproductions"
            meta={loaded ? `${count(CE_PAPERS)}/${CE_PAPERS.length} read` : undefined}
            open={!closedBlocks.has('blk-ce')}
            onToggle={() => toggleBlock('blk-ce')}
          >
            <FlatRow>
              <Meta tone="burgundy">Reproduce — the top ten</Meta>
            </FlatRow>
            {ceRepro.map(p => (
              <ReadingRow key={p.id} item={p} checked={done.has(p.id)} onToggle={() => toggle(p.id)} />
            ))}
            <FlatRow>
              <Meta tone="burgundy">Read — the other twenty</Meta>
            </FlatRow>
            {ceRead.map(p => (
              <ReadingRow key={p.id} item={p} checked={done.has(p.id)} onToggle={() => toggle(p.id)} />
            ))}
          </Block>

          {/* ─── Anthropology & economics reading ─── */}
          <Block
            label="Anthropology & Economics — 15 Papers, 5 Replications"
            meta={loaded ? `${count(ANTHRO_PAPERS)}/${ANTHRO_PAPERS.length} read` : undefined}
            open={!closedBlocks.has('blk-anthro')}
            onToggle={() => toggleBlock('blk-anthro')}
          >
            <FlatRow>
              <Meta tone="burgundy">Replicate on a new site — the five</Meta>
            </FlatRow>
            {anRepro.map(p => (
              <ReadingRow key={p.id} item={p} checked={done.has(p.id)} onToggle={() => toggle(p.id)} />
            ))}
            <FlatRow>
              <Meta tone="burgundy">Read — the other ten</Meta>
            </FlatRow>
            {anRead.map(p => (
              <ReadingRow key={p.id} item={p} checked={done.has(p.id)} onToggle={() => toggle(p.id)} />
            ))}
          </Block>

          {/* ─── Books ─── */}
          <Block
            label="The Books"
            meta={loaded ? `${count(BOOKS)}/${BOOKS.length} read` : undefined}
            open={!closedBlocks.has('blk-books')}
            onToggle={() => toggleBlock('blk-books')}
          >
            {BOOKS.map(b => (
              <ReadingRow key={b.id} item={b} checked={done.has(b.id)} onToggle={() => toggle(b.id)} />
            ))}
          </Block>
        </div>

        <footer className="mt-4 border-t border-rule pt-3 text-center">
          <p className="font-serif text-[17px] italic text-ink-muted">
            Nothing is finished on the plane.
          </p>
          <p className="mt-1 font-mono text-[13px] uppercase tracking-[2px] text-ink-faint">
            loricorpuz.com/complexecon/roadmap · the road to abu dhabi
          </p>
        </footer>
      </div>
    </main>
  )
}
