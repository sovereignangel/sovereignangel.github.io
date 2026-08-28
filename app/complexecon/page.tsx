'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import { getComplexEconNotes, saveComplexEconNote } from '@/lib/firestore/complexecon-notes'
import type { ReaderSource } from '@/components/thesis/reader/ReaderOverlay'
import { Block, Checkbox, Chevron, FlatRow, Meta, ProgressRule, Row, Stat } from '@/components/complexecon/tearsheet'
import {
  ARTIFACTS,
  CENTRAL_QUESTION,
  HYPOTHESES,
  LANE_PILLARS,
  LANE_STATEMENT,
  LIBRARY,
  STAGES,
  WORKSHOP,
  type BookTier,
  type LanePillar,
  type LibraryItem,
  type LibraryTopic,
  type SourceKind,
} from '@/lib/complexecon/pathway'

const ReaderOverlay = dynamic(() => import('@/components/thesis/reader/ReaderOverlay'), { ssr: false })

const PROGRESS_KEY = 'complexecon-progress'
const OPEN_KEY = 'complexecon-open'
const BLOCKS_KEY = 'complexecon-blocks-closed'

const BLOCK_IDS = ['blk-lane', 'blk-pathway', 'blk-library', 'blk-hypotheses', 'blk-artifacts']

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

const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  pdf: 'PDF',
  borrow: 'Borrow',
  web: 'Web',
  buy: 'Buy',
}

/** Checked-off milestones and books, kept in localStorage. */
function useProgress() {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY)
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
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  return { done, toggle, loaded }
}

/**
 * Rows are closed until asked for; blocks are open until folded away. Both are
 * remembered, so the sheet reopens exactly as it was left.
 */
function useSheetState() {
  const [openRows, setOpenRows] = useState<Set<string>>(new Set())
  const [closedBlocks, setClosedBlocks] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const rows = localStorage.getItem(OPEN_KEY)
      setOpenRows(new Set(rows ? (JSON.parse(rows) as string[]) : [STAGES[0].id]))
      const blocks = localStorage.getItem(BLOCKS_KEY)
      if (blocks) setClosedBlocks(new Set(JSON.parse(blocks) as string[]))
    } catch {
      setOpenRows(new Set([STAGES[0].id]))
    }
  }, [])

  const writeRows = (next: Set<string>) => {
    localStorage.setItem(OPEN_KEY, JSON.stringify(Array.from(next)))
    return next
  }
  const writeBlocks = (next: Set<string>) => {
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(Array.from(next)))
    return next
  }

  const toggleRow = (id: string) =>
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return writeRows(next)
    })

  const toggleBlock = (id: string) =>
    setClosedBlocks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return writeBlocks(next)
    })

  const expandAll = (rowIds: string[]) => {
    setOpenRows(writeRows(new Set(rowIds)))
    setClosedBlocks(writeBlocks(new Set()))
  }

  const collapseAll = () => {
    setOpenRows(writeRows(new Set()))
    setClosedBlocks(writeBlocks(new Set(BLOCK_IDS)))
  }

  return { openRows, closedBlocks, toggleRow, toggleBlock, expandAll, collapseAll }
}

/** Split the shelf into two columns of roughly equal height, order preserved. */
function splitTopics(topics: LibraryTopic[]): [LibraryTopic[], LibraryTopic[]] {
  const weights = topics.map(t => t.items.length + 1)
  const total = weights.reduce((a, b) => a + b, 0)
  let running = 0
  let cut = 1
  let best = Infinity
  weights.forEach((w, i) => {
    running += w
    const imbalance = Math.abs(total - 2 * running)
    if (i < topics.length - 1 && imbalance < best) {
      best = imbalance
      cut = i + 1
    }
  })
  return [topics.slice(0, cut), topics.slice(cut)]
}

function LaneRow({ pillar, open, onToggle }: { pillar: LanePillar; open: boolean; onToggle: () => void }) {
  return (
    <Row
      open={open}
      onToggle={onToggle}
      head={
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-serif text-[18px] font-semibold text-burgundy">{pillar.name}</span>
          <span className="text-[15px] text-ink-light">{pillar.head}</span>
        </span>
      }
    >
      <p className="text-[16px] leading-relaxed text-ink-light">{pillar.body}</p>
    </Row>
  )
}

type MemoState = 'idle' | 'saving' | 'saved'

function TierChip({ tier }: { tier: BookTier }) {
  return (
    <span
      className={`shrink-0 rounded-sm border px-1 py-px font-mono text-[11px] uppercase tracking-[0.5px] ${TIER_CLASS[tier]}`}
    >
      {TIER_LABEL[tier]}
    </span>
  )
}

function BookRow({
  item,
  checked,
  onToggle,
  open,
  onOpenToggle,
  memo,
  memoState,
  onMemoChange,
  onRead,
  signedIn,
  onSignIn,
}: {
  item: LibraryItem
  checked: boolean
  onToggle: () => void
  open: boolean
  onOpenToggle: () => void
  memo: string
  memoState: MemoState
  onMemoChange: (text: string) => void
  onRead: () => void
  signedIn: boolean
  onSignIn: () => void
}) {
  return (
    <Row
      open={open}
      onToggle={onOpenToggle}
      indent
      lead={<Checkbox checked={checked} onToggle={onToggle} label={`Mark ${item.title} read`} />}
      head={
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span
            className={`font-serif text-[18px] font-semibold ${
              checked ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
            }`}
          >
            {item.title}
          </span>
          <span className="text-[14px] text-ink-muted">
            {item.author}, {item.year}
          </span>
        </span>
      }
      meta={
        <span className="flex items-center gap-1">
          {memo.trim() && <Meta tone="amber">Memo</Meta>}
          {item.kind === 'paper' && <Meta>Paper</Meta>}
          <TierChip tier={item.tier} />
        </span>
      }
    >
      <p className="text-[16px] leading-relaxed text-ink-light">{item.note}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {item.readerUrl && (
          <button
            onClick={signedIn ? onRead : onSignIn}
            className="rounded-sm border border-burgundy bg-burgundy px-2 py-px font-serif text-[14px] font-medium text-paper transition-colors hover:bg-burgundy/90"
          >
            {signedIn ? 'Read in site' : 'Sign in to read'}
          </button>
        )}
        {item.sources.map(s => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
          >
            {SOURCE_KIND_LABEL[s.kind]} · {s.label} →
          </a>
        ))}
      </div>

      <div className="mt-2 border-t border-rule-light pt-1.5">
        {signedIn ? (
          <>
            <textarea
              value={memo}
              onChange={e => onMemoChange(e.target.value)}
              placeholder={`Notes on ${item.title} — argument, objections, links to the lane...`}
              rows={memo ? Math.min(14, Math.max(3, memo.split('\n').length + 1)) : 3}
              className="w-full rounded-sm border border-rule bg-white px-2 py-1.5 font-serif text-[17px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
            />
            <div className="mt-0.5 flex items-center justify-between">
              <Meta>
                {memoState === 'saving' ? 'Saving...' : memoState === 'saved' ? 'Saved' : 'Autosaves as you type'}
              </Meta>
              <Meta>{memo.trim() ? `${memo.trim().split(/\s+/).length} words` : ''}</Meta>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] text-ink-muted">Sign in to keep a memo on this book.</span>
            <button
              onClick={onSignIn}
              className="rounded-sm border border-burgundy bg-burgundy px-2 py-px font-serif text-[14px] font-medium text-paper hover:bg-burgundy/90"
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </Row>
  )
}

function ComplexEconInner() {
  const { user, signIn } = useAuth()
  const { done, toggle, loaded } = useProgress()
  const { openRows, closedBlocks, toggleRow, toggleBlock, expandAll, collapseAll } = useSheetState()

  const [reader, setReader] = useState<ReaderSource | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [memoState, setMemoState] = useState<Record<string, MemoState>>({})
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const allMilestoneIds = useMemo(() => STAGES.flatMap(s => s.milestones.map(m => m.id)), [])
  const allBookIds = useMemo(() => LIBRARY.flatMap(t => t.items.map(i => i.id)), [])
  const spineIds = useMemo(() => LIBRARY.flatMap(t => t.items.filter(i => i.tier === 'spine').map(i => i.id)), [])
  const [shelfLeft, shelfRight] = useMemo(() => splitTopics(LIBRARY), [])

  const allRowIds = useMemo(
    () => [
      'lane-statement',
      ...LANE_PILLARS.map(p => p.id),
      ...STAGES.map(s => s.id),
      ...allBookIds,
      ...HYPOTHESES.map(h => h.id),
      ...ARTIFACTS.map(a => a.id),
    ],
    [allBookIds],
  )

  // The active stage is the first one still carrying unfinished milestones.
  const activeStage = useMemo(
    () => STAGES.find(s => s.milestones.some(m => !done.has(m.id))) ?? STAGES[STAGES.length - 1],
    [done],
  )

  useEffect(() => {
    if (!user?.uid) return
    getComplexEconNotes(user.uid).then(setNotes)
  }, [user?.uid])

  const handleMemoChange = useCallback(
    (itemId: string, text: string) => {
      setNotes(prev => ({ ...prev, [itemId]: text }))
      if (!user?.uid) return
      const uid = user.uid
      setMemoState(prev => ({ ...prev, [itemId]: 'saving' }))
      if (saveTimers.current[itemId]) clearTimeout(saveTimers.current[itemId])
      saveTimers.current[itemId] = setTimeout(async () => {
        await saveComplexEconNote(uid, itemId, text)
        setMemoState(prev => ({ ...prev, [itemId]: 'saved' }))
      }, 900)
    },
    [user?.uid],
  )

  const openReader = useCallback((item: LibraryItem) => {
    if (!item.readerUrl) return
    setReader({
      title: item.title,
      author: item.author,
      sourceUrl: item.readerUrl,
      sourceType: item.readerUrl.includes('archive.org') ? 'archive_org' : 'direct_url',
    })
  }, [])

  const milestonesDone = allMilestoneIds.filter(id => done.has(id)).length
  const booksDone = allBookIds.filter(id => done.has(id)).length
  const spineDone = spineIds.filter(id => done.has(id)).length
  const memoCount = Object.values(notes).filter(t => t.trim()).length

  const weeksOut = useMemo(() => {
    const ms = new Date(WORKSHOP.startDate + 'T00:00:00').getTime() - Date.now()
    return Math.max(0, Math.round(ms / (7 * 24 * 3600 * 1000)))
  }, [])

  const renderShelf = (topics: LibraryTopic[]) =>
    topics.map(topic => (
      <div key={topic.id}>
        <div className="flex items-baseline justify-between gap-3 border-y border-rule-light bg-cream px-3 py-0.5">
          <span className="font-serif text-[15px] font-semibold uppercase tracking-[1px] text-burgundy">
            {topic.name}
          </span>
          <Meta>
            {topic.items.filter(i => done.has(i.id)).length}/{topic.items.length}
          </Meta>
        </div>
        {topic.items.map(item => (
          <BookRow
            key={item.id}
            item={item}
            checked={done.has(item.id)}
            onToggle={() => toggle(item.id)}
            open={openRows.has(item.id)}
            onOpenToggle={() => toggleRow(item.id)}
            memo={notes[item.id] || ''}
            memoState={memoState[item.id] || 'idle'}
            onMemoChange={text => handleMemoChange(item.id, text)}
            onRead={() => openReader(item)}
            signedIn={!!user}
            onSignIn={signIn}
          />
        ))}
      </div>
    ))

  if (reader) {
    return <ReaderOverlay source={reader} onClose={() => setReader(null)} />
  }

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-[1320px] px-3 py-5 md:px-5 md:py-7">
        {/* ─── Masthead: title left, destination and tabs right ─── */}
        <header className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-rule pb-2">
          <div>
            <div className="font-mono text-[12px] uppercase tracking-[3px] text-ink-muted">
              Lori Corpuz · A Research Program
            </div>
            <h1 className="font-serif text-[32px] font-semibold leading-tight text-ink md:text-[38px]">
              Complexity Economics
            </h1>
          </div>
          <div className="text-right">
            <div className="font-mono text-[12px] uppercase tracking-[1.5px] text-ink-muted">
              {WORKSHOP.name} · {WORKSHOP.place} · {WORKSHOP.dates}
            </div>
            <nav className="mt-1 flex justify-end gap-3">
              <span className="border-b-2 border-burgundy font-serif text-[19px] font-semibold text-burgundy">
                Pathway
              </span>
              <Link
                href="/complexecon/research"
                className="font-serif text-[19px] text-ink-muted transition-colors hover:text-ink"
              >
                Research
              </Link>
              <Link
                href="/complexecon/strategy"
                className="font-serif text-[19px] text-ink-muted transition-colors hover:text-ink"
              >
                Strategy
              </Link>
            </nav>
          </div>
        </header>

        {/* ─── Sheet head: the question beside the numbers ─── */}
        <section className="mb-3 border border-rule bg-white">
          <div className="flex flex-col lg:flex-row">
            <div className="flex-1 border-b border-rule px-4 py-3 lg:border-b-0 lg:border-r">
              <p className="font-serif text-[21px] italic leading-snug text-ink md:text-[23px]">
                &ldquo;{CENTRAL_QUESTION}&rdquo;
              </p>
              <p className="mt-1 font-mono text-[12px] uppercase tracking-[1.5px] text-ink-muted">
                Lane · Valuation conventions as distributive institutions
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-rule-light sm:grid-cols-6 lg:w-[680px] lg:shrink-0">
              <Stat value={weeksOut} label="Weeks out" />
              <Stat value={activeStage.numeral} label="Stage" />
              <Stat
                muted
                value={
                  <>
                    {loaded ? milestonesDone : '·'}
                    <span className="text-ink-faint">/{allMilestoneIds.length}</span>
                  </>
                }
                label="Milestones"
              />
              <Stat
                muted
                value={
                  <>
                    {loaded ? booksDone : '·'}
                    <span className="text-ink-faint">/{allBookIds.length}</span>
                  </>
                }
                label="Library"
              />
              <Stat
                muted
                value={
                  <>
                    {loaded ? spineDone : '·'}
                    <span className="text-ink-faint">/{spineIds.length}</span>
                  </>
                }
                label="Spine"
              />
              <Stat muted value={memoCount} label="Memos" />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule px-3 py-1">
            <Meta>Every line opens · {openRows.size} open</Meta>
            <div className="flex gap-1">
              <button
                onClick={() => expandAll(allRowIds)}
                className="rounded-sm border border-rule px-2 py-px font-mono text-[11px] uppercase tracking-[1px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
              >
                Expand all
              </button>
              <button
                onClick={collapseAll}
                className="rounded-sm border border-rule px-2 py-px font-mono text-[11px] uppercase tracking-[1px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
              >
                Collapse all
              </button>
            </div>
          </div>
        </section>

        {/* ─── The sheet: every block folds, every line opens ─── */}
        <div className="mb-3 space-y-3">
          <Block
            label="The Lane"
            meta="Position"
            open={!closedBlocks.has('blk-lane')}
            onToggle={() => toggleBlock('blk-lane')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-rule-light">
              <div>
                <Row
                  open={openRows.has('lane-statement')}
                  onToggle={() => toggleRow('lane-statement')}
                  head={
                    <span className="font-serif text-[18px] font-semibold text-ink">
                      Valuation conventions as distributive institutions
                    </span>
                  }
                  meta={<Meta>Statement</Meta>}
                >
                  <p className="text-[17px] leading-relaxed text-ink">{LANE_STATEMENT}</p>
                </Row>
                {LANE_PILLARS.slice(0, 1).map(p => (
                  <LaneRow key={p.id} pillar={p} open={openRows.has(p.id)} onToggle={() => toggleRow(p.id)} />
                ))}
              </div>
              <div>
                {LANE_PILLARS.slice(1).map(p => (
                  <LaneRow key={p.id} pillar={p} open={openRows.has(p.id)} onToggle={() => toggleRow(p.id)} />
                ))}
              </div>
            </div>
          </Block>
          <Block
            label="The Pathway"
            meta={`I–V · ${loaded ? milestonesDone : '·'}/${allMilestoneIds.length}`}
            open={!closedBlocks.has('blk-pathway')}
            onToggle={() => toggleBlock('blk-pathway')}
          >
            {STAGES.map(stage => {
              const total = stage.milestones.length
              const doneCount = stage.milestones.filter(m => done.has(m.id)).length
              const pct = total ? Math.round((doneCount / total) * 100) : 0
              const isActive = stage.id === activeStage.id
              return (
                <Row
                  key={stage.id}
                  open={openRows.has(stage.id)}
                  onToggle={() => toggleRow(stage.id)}
                  head={
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-serif text-[17px] font-semibold text-ink-faint">{stage.numeral}</span>
                      <span className="font-serif text-[19px] font-semibold text-ink">{stage.name}</span>
                      {isActive && (
                        <span className="rounded-sm border border-burgundy/25 bg-burgundy-bg px-1 py-px font-mono text-[11px] uppercase tracking-[0.5px] text-burgundy">
                          Active
                        </span>
                      )}
                    </span>
                  }
                  meta={
                    <span className="flex items-center gap-2">
                      <Meta>{stage.window}</Meta>
                      <span className="font-mono text-[13px] text-ink">
                        {doneCount}
                        <span className="text-ink-faint">/{total}</span>
                      </span>
                      <span className="block w-[44px]">
                        <ProgressRule pct={pct} />
                      </span>
                    </span>
                  }
                >
                  <p className="mb-1.5 text-[16px] leading-relaxed text-ink-light">{stage.aim}</p>
                  <div className="grid grid-cols-1 border-t border-rule-light lg:grid-cols-2 lg:gap-x-8">
                    {stage.milestones.map(m => {
                      const checked = done.has(m.id)
                      return (
                        <div key={m.id} className="border-b border-rule-light last:border-b-0">
                          <div className="flex items-start gap-2 py-1">
                            <Checkbox checked={checked} onToggle={() => toggle(m.id)} label={`Mark ${m.label} done`} />
                            <button
                              onClick={() => toggleRow(m.id)}
                              aria-expanded={openRows.has(m.id)}
                              className="flex min-w-0 flex-1 items-start gap-2 text-left"
                            >
                              <span className="mt-[5px]">
                                <Chevron open={openRows.has(m.id)} />
                              </span>
                              <span
                                className={`text-[17px] leading-snug ${
                                  checked ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
                                }`}
                              >
                                {m.label}
                              </span>
                            </button>
                          </div>
                          {openRows.has(m.id) && (
                            <p className="pb-1.5 pl-[41px] text-[15px] leading-relaxed text-ink-muted">{m.detail}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Row>
              )
            })}
          </Block>
          <Block
            label="The Library"
            meta={`§ · ${loaded ? booksDone : '·'}/${allBookIds.length}`}
            open={!closedBlocks.has('blk-library')}
            onToggle={() => toggleBlock('blk-library')}
          >
            <FlatRow>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="max-w-[820px] text-[15px] leading-relaxed text-ink-light">
                  Six books and two papers form the spine — the anti-dilettante rule holds. Foundation titles close
                  specific gaps; reference titles are read for their argument, not their pages. Open a title for where
                  to read it and the memo that saves as you write.
                </p>
                {!user && (
                  <button
                    onClick={signIn}
                    className="rounded-sm border border-burgundy bg-burgundy px-2 py-px font-serif text-[14px] font-medium text-paper hover:bg-burgundy/90"
                  >
                    Sign in to read and annotate
                  </button>
                )}
              </div>
            </FlatRow>
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-rule-light">
              <div>{renderShelf(shelfLeft)}</div>
              <div>{renderShelf(shelfRight)}</div>
            </div>
          </Block>
          <Block
            label="The Hypotheses"
            meta="H1–H3 · pre-registered"
            open={!closedBlocks.has('blk-hypotheses')}
            onToggle={() => toggleBlock('blk-hypotheses')}
          >
            {HYPOTHESES.map(h => (
              <Row
                key={h.id}
                open={openRows.has(h.id)}
                onToggle={() => toggleRow(h.id)}
                head={
                  <span className="flex gap-2">
                    <span className="font-mono text-[17px] font-semibold text-burgundy">{h.id}</span>
                    <span className="text-[17px] font-semibold leading-snug text-ink">{h.claim}</span>
                  </span>
                }
                meta={<Meta>Test</Meta>}
              >
                <p className="text-[16px] leading-relaxed text-ink-muted">
                  <Meta tone="amber">Test · </Meta>
                  {h.test}
                </p>
              </Row>
            ))}
          </Block>
          <Block
            label="The Artifacts"
            meta="Δ · four deliverables"
            open={!closedBlocks.has('blk-artifacts')}
            onToggle={() => toggleBlock('blk-artifacts')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-rule-light">
              {[ARTIFACTS.slice(0, 2), ARTIFACTS.slice(2)].map((column, i) => (
                <div key={i}>
                  {column.map(a => (
                    <Row
                      key={a.id}
                      open={openRows.has(a.id)}
                      onToggle={() => toggleRow(a.id)}
                      head={
                        <span className="font-serif text-[18px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                          {a.name}
                        </span>
                      }
                    >
                      <p className="text-[16px] leading-relaxed text-ink-light">{a.detail}</p>
                    </Row>
                  ))}
                </div>
              ))}
            </div>
          </Block>
        </div>

        {/* ─── Footer ─── */}
        <footer className="flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-2">
          <p className="font-serif text-[16px] italic text-ink-muted">
            An engine, not a camera — the measurement moves the world.
          </p>
          <p className="font-mono text-[12px] uppercase tracking-[2px] text-ink-faint">
            loricorpuz.com/complexecon · est. August 2026
          </p>
        </footer>
      </div>
    </main>
  )
}

export default function ComplexEconPage() {
  return (
    <AuthProvider>
      <ComplexEconInner />
    </AuthProvider>
  )
}
