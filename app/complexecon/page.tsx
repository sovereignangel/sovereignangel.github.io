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
  type LibraryItem,
  type SourceKind,
} from '@/lib/complexecon/pathway'

const ReaderOverlay = dynamic(() => import('@/components/thesis/reader/ReaderOverlay'), { ssr: false })

const PROGRESS_KEY = 'complexecon-progress'
const OPEN_KEY = 'complexecon-open'

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

/** Which rows are unfolded — also remembered, so the sheet reopens as it was left. */
function useOpenRows(initial: () => string[]) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OPEN_KEY)
      setOpen(new Set(raw ? (JSON.parse(raw) as string[]) : initial()))
    } catch {
      setOpen(new Set(initial()))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = (next: Set<string>) => {
    localStorage.setItem(OPEN_KEY, JSON.stringify(Array.from(next)))
    return next
  }

  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return persist(next)
    })

  const setAll = (ids: string[]) => setOpen(persist(new Set(ids)))

  return { open, toggle, setAll }
}

type MemoState = 'idle' | 'saving' | 'saved'

function TierChip({ tier }: { tier: BookTier }) {
  return (
    <span
      className={`shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.5px] ${TIER_CLASS[tier]}`}
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
            className={`font-serif text-[19px] font-semibold ${
              checked ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
            }`}
          >
            {item.title}
          </span>
          <span className="text-[15px] text-ink-muted">
            {item.author}, {item.year}
          </span>
        </span>
      }
      meta={
        <span className="flex items-center gap-1.5">
          {memo.trim() && <Meta tone="amber">Memo</Meta>}
          {item.kind === 'paper' && <Meta>Paper</Meta>}
          <TierChip tier={item.tier} />
        </span>
      }
    >
      <p className="text-[17px] leading-relaxed text-ink-light">{item.note}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {item.readerUrl && (
          <button
            onClick={signedIn ? onRead : onSignIn}
            className="rounded-sm border border-burgundy bg-burgundy px-2 py-0.5 font-serif text-[15px] font-medium text-paper transition-colors hover:bg-burgundy/90"
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
            className="font-mono text-[13px] uppercase tracking-[0.5px] text-ink-muted underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
          >
            {SOURCE_KIND_LABEL[s.kind]} · {s.label} →
          </a>
        ))}
      </div>

      <div className="mt-2.5 border-t border-rule-light pt-2">
        {signedIn ? (
          <>
            <textarea
              value={memo}
              onChange={e => onMemoChange(e.target.value)}
              placeholder={`Notes on ${item.title} — argument, objections, links to the lane...`}
              rows={memo ? Math.min(14, Math.max(3, memo.split('\n').length + 1)) : 3}
              className="w-full rounded-sm border border-rule bg-white px-2.5 py-2 font-serif text-[18px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between">
              <Meta>{memoState === 'saving' ? 'Saving...' : memoState === 'saved' ? 'Saved' : 'Autosaves as you type'}</Meta>
              <Meta>{memo.trim() ? `${memo.trim().split(/\s+/).length} words` : ''}</Meta>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[16px] text-ink-muted">Sign in to keep a memo on this book.</span>
            <button
              onClick={onSignIn}
              className="rounded-sm border border-burgundy bg-burgundy px-2.5 py-1 font-serif text-[15px] font-medium text-paper hover:bg-burgundy/90"
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

  const [reader, setReader] = useState<ReaderSource | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [memoState, setMemoState] = useState<Record<string, MemoState>>({})
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const allMilestoneIds = useMemo(() => STAGES.flatMap(s => s.milestones.map(m => m.id)), [])
  const allBookIds = useMemo(() => LIBRARY.flatMap(t => t.items.map(i => i.id)), [])
  const spineIds = useMemo(
    () => LIBRARY.flatMap(t => t.items.filter(i => i.tier === 'spine').map(i => i.id)),
    []
  )

  // The active stage is the first one still carrying unfinished milestones.
  const activeStage = useMemo(
    () => STAGES.find(s => s.milestones.some(m => !done.has(m.id))) ?? STAGES[STAGES.length - 1],
    [done]
  )

  // First visit opens Stage I and nothing else; after that the sheet reopens as it was left.
  const { open, toggle: toggleOpen, setAll } = useOpenRows(() => [STAGES[0].id])

  const topLevelIds = useMemo(
    () => [
      ...LANE_PILLARS.map(p => p.id),
      'lane-statement',
      ...STAGES.map(s => s.id),
      ...allBookIds,
      ...HYPOTHESES.map(h => h.id),
      ...ARTIFACTS.map(a => a.id),
    ],
    [allBookIds]
  )
  const anyOpen = open.size > 0

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
    [user?.uid]
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

  const weeksOut = useMemo(() => {
    const ms = new Date(WORKSHOP.startDate + 'T00:00:00').getTime() - Date.now()
    return Math.max(0, Math.round(ms / (7 * 24 * 3600 * 1000)))
  }, [])

  if (reader) {
    return <ReaderOverlay source={reader} onClose={() => setReader(null)} />
  }

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        {/* ─── Masthead ─── */}
        <header className="mb-6 text-center">
          <div className="mb-2 font-mono text-[14px] uppercase tracking-[3px] text-ink-muted">
            Lori Corpuz · A Research Program
          </div>
          <h1 className="font-serif text-[40px] font-semibold leading-tight text-ink md:text-[46px]">
            Complexity Economics
          </h1>
          <div className="mx-auto mt-2.5 mb-2.5 h-[2px] w-16 bg-burgundy" />
          <p className="font-mono text-[14px] uppercase tracking-[1.5px] text-ink-muted">
            {WORKSHOP.name} · {WORKSHOP.place} · {WORKSHOP.dates}
          </p>
        </header>

        {/* ─── Tabs ─── */}
        <nav className="mb-6 flex justify-center gap-4 border-b border-rule pb-2">
          <span className="border-b-2 border-burgundy py-1 font-serif text-[22px] font-semibold text-burgundy">
            Pathway
          </span>
          <Link
            href="/complexecon/research"
            className="py-1 font-serif text-[22px] text-ink-muted transition-colors hover:text-ink"
          >
            Research
          </Link>
          <Link
            href="/complexecon/strategy"
            className="py-1 font-serif text-[22px] text-ink-muted transition-colors hover:text-ink"
          >
            Strategy
          </Link>
        </nav>

        {/* ─── Sheet head: the question, the numbers, the controls ─── */}
        <section className="mb-5 border border-rule bg-white">
          <div className="border-b border-rule px-4 py-5 text-center">
            <p className="font-serif text-[24px] italic leading-snug text-ink md:text-[27px]">
              &ldquo;{CENTRAL_QUESTION}&rdquo;
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-rule-light border-b border-rule md:grid-cols-5">
            <Stat value={weeksOut} label="Weeks to Abu Dhabi" />
            <Stat value={activeStage.numeral} label="Active stage" />
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
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
            <Meta>Every line opens · {open.size} open</Meta>
            <div className="flex gap-1">
              <button
                onClick={() => setAll(topLevelIds)}
                className="rounded-sm border border-rule px-2 py-0.5 font-mono text-[12px] uppercase tracking-[1px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
              >
                Expand all
              </button>
              <button
                onClick={() => setAll([])}
                disabled={!anyOpen}
                className="rounded-sm border border-rule px-2 py-0.5 font-mono text-[12px] uppercase tracking-[1px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-40"
              >
                Collapse all
              </button>
            </div>
          </div>
        </section>

        {/* ─── The lane ─── */}
        <Block label="The Lane" meta="Position">
          <Row
            open={open.has('lane-statement')}
            onToggle={() => toggleOpen('lane-statement')}
            head={
              <span className="font-serif text-[19px] font-semibold text-ink">
                Valuation conventions as distributive institutions
              </span>
            }
            meta={<Meta>Statement</Meta>}
          >
            <p className="text-[18px] leading-relaxed text-ink">{LANE_STATEMENT}</p>
          </Row>
          {LANE_PILLARS.map(p => (
            <Row
              key={p.id}
              open={open.has(p.id)}
              onToggle={() => toggleOpen(p.id)}
              head={
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-serif text-[19px] font-semibold text-burgundy">{p.name}</span>
                  <span className="text-[16px] text-ink-light">{p.head}</span>
                </span>
              }
            >
              <p className="text-[17px] leading-relaxed text-ink-light">{p.body}</p>
            </Row>
          ))}
        </Block>

        {/* ─── The pathway ─── */}
        <Block label="The Pathway" meta={`I–V · ${loaded ? milestonesDone : '·'}/${allMilestoneIds.length}`}>
          {STAGES.map(stage => {
            const total = stage.milestones.length
            const doneCount = stage.milestones.filter(m => done.has(m.id)).length
            const pct = total ? Math.round((doneCount / total) * 100) : 0
            const isActive = stage.id === activeStage.id
            return (
              <Row
                key={stage.id}
                open={open.has(stage.id)}
                onToggle={() => toggleOpen(stage.id)}
                head={
                  <span className="block">
                    <span className="flex flex-wrap items-baseline gap-x-2.5">
                      <span className="font-serif text-[19px] font-semibold text-ink-faint">{stage.numeral}</span>
                      <span className="font-serif text-[21px] font-semibold text-ink">{stage.name}</span>
                      {isActive && (
                        <span className="rounded-sm border border-burgundy/25 bg-burgundy-bg px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.5px] text-burgundy">
                          Active
                        </span>
                      )}
                    </span>
                  </span>
                }
                meta={
                  <span className="block">
                    <Meta>{stage.window}</Meta>
                    <span className="mt-0.5 block font-mono text-[13px] text-ink">
                      {doneCount}
                      <span className="text-ink-faint">/{total}</span>
                    </span>
                    <span className="mt-1 ml-auto block w-[72px]">
                      <ProgressRule pct={pct} />
                    </span>
                  </span>
                }
              >
                <p className="mb-2 text-[17px] leading-relaxed text-ink-light">{stage.aim}</p>
                <div className="border-t border-rule-light">
                  {stage.milestones.map(m => {
                    const checked = done.has(m.id)
                    return (
                      <div key={m.id} className="border-b border-rule-light last:border-b-0">
                        <div className="flex items-start gap-2.5 py-1.5">
                          <Checkbox checked={checked} onToggle={() => toggle(m.id)} label={`Mark ${m.label} done`} />
                          <button
                            onClick={() => toggleOpen(m.id)}
                            aria-expanded={open.has(m.id)}
                            className="flex min-w-0 flex-1 items-start gap-2 text-left"
                          >
                            <span className="mt-[6px]">
                              <Chevron open={open.has(m.id)} />
                            </span>
                            <span
                              className={`text-[18px] leading-snug ${
                                checked ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
                              }`}
                            >
                              {m.label}
                            </span>
                          </button>
                        </div>
                        {open.has(m.id) && (
                          <p className="pb-2 pl-[46px] text-[16px] leading-relaxed text-ink-muted">{m.detail}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Row>
            )
          })}
        </Block>

        {/* ─── The library ─── */}
        <Block label="The Library" meta={`§ · ${loaded ? booksDone : '·'}/${allBookIds.length}`}>
          <FlatRow>
            <p className="text-[16px] leading-relaxed text-ink-light">
              Six books and two papers form the spine — the anti-dilettante rule holds. Foundation titles close
              specific gaps; reference titles are read for their argument, not their pages. Open a title for where to
              read it and the memo that saves as you write.
            </p>
            {!user && (
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <span className="text-[16px] text-ink-muted">
                  Sign in to read PDFs in the built-in reader and keep memos.
                </span>
                <button
                  onClick={signIn}
                  className="rounded-sm border border-burgundy bg-burgundy px-2.5 py-1 font-serif text-[15px] font-medium text-paper hover:bg-burgundy/90"
                >
                  Sign in with Google
                </button>
              </div>
            )}
          </FlatRow>
          {LIBRARY.map(topic => (
            <div key={topic.id}>
              <div className="flex items-baseline justify-between gap-3 border-y border-rule-light bg-cream px-3 py-1">
                <span className="font-serif text-[16px] font-semibold uppercase tracking-[1px] text-burgundy">
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
                  open={open.has(item.id)}
                  onOpenToggle={() => toggleOpen(item.id)}
                  memo={notes[item.id] || ''}
                  memoState={memoState[item.id] || 'idle'}
                  onMemoChange={text => handleMemoChange(item.id, text)}
                  onRead={() => openReader(item)}
                  signedIn={!!user}
                  onSignIn={signIn}
                />
              ))}
            </div>
          ))}
        </Block>

        {/* ─── Hypotheses ─── */}
        <Block label="The Hypotheses" meta="H1–H3 · pre-registered">
          {HYPOTHESES.map(h => (
            <Row
              key={h.id}
              open={open.has(h.id)}
              onToggle={() => toggleOpen(h.id)}
              head={
                <span className="flex gap-2.5">
                  <span className="font-mono text-[18px] font-semibold text-burgundy">{h.id}</span>
                  <span className="text-[18px] font-semibold leading-snug text-ink">{h.claim}</span>
                </span>
              }
              meta={<Meta>Test</Meta>}
            >
              <p className="text-[17px] leading-relaxed text-ink-muted">
                <Meta tone="amber">Test · </Meta>
                {h.test}
              </p>
            </Row>
          ))}
        </Block>

        {/* ─── Artifacts ─── */}
        <Block label="The Artifacts" meta="Δ · four deliverables">
          {ARTIFACTS.map(a => (
            <Row
              key={a.id}
              open={open.has(a.id)}
              onToggle={() => toggleOpen(a.id)}
              head={
                <span className="font-serif text-[19px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  {a.name}
                </span>
              }
            >
              <p className="text-[17px] leading-relaxed text-ink-light">{a.detail}</p>
            </Row>
          ))}
        </Block>

        {/* ─── Footer ─── */}
        <footer className="border-t border-rule pt-4 text-center">
          <p className="font-serif text-[18px] italic text-ink-muted">
            An engine, not a camera — the measurement moves the world.
          </p>
          <p className="mt-1.5 font-mono text-[13px] uppercase tracking-[2px] text-ink-faint">
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
