'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import { getComplexEconNotes, saveComplexEconNote } from '@/lib/firestore/complexecon-notes'
import type { ReaderSource } from '@/components/thesis/reader/ReaderOverlay'
import {
  ARTIFACTS,
  CENTRAL_QUESTION,
  HYPOTHESES,
  LANE_STATEMENT,
  LIBRARY,
  STAGES,
  WORKSHOP,
  type BookTier,
  type LibraryItem,
  type SourceKind,
} from '@/lib/complexecon/pathway'

const ReaderOverlay = dynamic(() => import('@/components/thesis/reader/ReaderOverlay'), { ssr: false })

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

const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  pdf: 'PDF',
  borrow: 'Borrow',
  web: 'Web',
  buy: 'Buy',
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
      <span className="font-serif text-[20px] text-ink-faint">{numeral}</span>
      <h2 className="font-serif text-[23px] font-semibold uppercase tracking-[1.5px] text-burgundy">{title}</h2>
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

type MemoState = 'idle' | 'saving' | 'saved'

function LibraryRow({
  item,
  checked,
  onToggle,
  memo,
  memoOpen,
  memoState,
  onMemoToggle,
  onMemoChange,
  onRead,
  signedIn,
  onSignIn,
}: {
  item: LibraryItem
  checked: boolean
  onToggle: () => void
  memo: string
  memoOpen: boolean
  memoState: MemoState
  onMemoToggle: () => void
  onMemoChange: (text: string) => void
  onRead: () => void
  signedIn: boolean
  onSignIn: () => void
}) {
  return (
    <li className="rounded-sm border border-rule-light bg-white p-2.5">
      <div className="flex gap-2.5">
        <Checkbox checked={checked} onToggle={onToggle} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={`font-serif text-[20px] font-semibold ${
                checked ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
              }`}
            >
              {item.title}
            </span>
            <span className="text-[15px] text-ink-muted">
              {item.author}, {item.year}
            </span>
            <span
              className={`rounded-sm border px-1.5 py-0.5 font-mono text-[13px] uppercase tracking-[0.5px] ${TIER_CLASS[item.tier]}`}
            >
              {TIER_LABEL[item.tier]}
            </span>
            {item.kind === 'paper' && (
              <span className="rounded-sm border border-rule px-1.5 py-0.5 font-mono text-[13px] uppercase tracking-[0.5px] text-ink-muted">
                Paper
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[17px] leading-relaxed text-ink-muted">{item.note}</p>

          {/* Actions: read in site, sources, memo */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
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
                className="font-mono text-[14px] uppercase tracking-[0.5px] text-ink-muted underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
              >
                {SOURCE_KIND_LABEL[s.kind]} · {s.label} →
              </a>
            ))}
            <button
              onClick={onMemoToggle}
              className={`ml-auto rounded-sm border px-2 py-0.5 font-serif text-[15px] font-medium transition-colors ${
                memoOpen
                  ? 'border-burgundy bg-burgundy text-paper'
                  : memo
                    ? 'border-amber-ink/30 bg-amber-bg text-amber-ink hover:border-amber-ink/60'
                    : 'border-rule bg-transparent text-ink-muted hover:border-ink-faint'
              }`}
            >
              {memo ? 'Memo ·' : 'Memo'}
            </button>
          </div>

          {/* Memo drawer */}
          {memoOpen && (
            <div className="mt-2 border-t border-rule-light pt-2">
              {signedIn ? (
                <>
                  <textarea
                    value={memo}
                    onChange={e => onMemoChange(e.target.value)}
                    placeholder={`Notes on ${item.title} — argument, objections, links to the lane...`}
                    rows={memo ? Math.min(14, Math.max(4, memo.split('\n').length + 1)) : 4}
                    className="w-full rounded-sm border border-rule bg-paper px-2.5 py-2 font-serif text-[19px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-[13px] uppercase tracking-[1px] text-ink-faint">
                      {memoState === 'saving' ? 'Saving...' : memoState === 'saved' ? 'Saved' : 'Autosaves as you type'}
                    </span>
                    <span className="font-mono text-[13px] text-ink-faint">
                      {memo.trim() ? `${memo.trim().split(/\s+/).length} words` : ''}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 py-1">
                  <span className="text-[17px] text-ink-muted">Sign in to keep memos on this book.</span>
                  <button
                    onClick={onSignIn}
                    className="rounded-sm border border-burgundy bg-burgundy px-2.5 py-1 font-serif text-[15px] font-medium text-paper hover:bg-burgundy/90"
                  >
                    Sign in with Google
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

function ComplexEconInner() {
  const { user, signIn } = useAuth()
  const { done, toggle, loaded } = useProgress()

  const [reader, setReader] = useState<ReaderSource | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [openMemoId, setOpenMemoId] = useState<string | null>(null)
  const [memoState, setMemoState] = useState<Record<string, MemoState>>({})
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Load memos once signed in
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

  const allMilestoneIds = useMemo(() => STAGES.flatMap(s => s.milestones.map(m => m.id)), [])
  const allBookIds = useMemo(() => LIBRARY.flatMap(t => t.items.map(i => i.id)), [])

  const milestonesDone = allMilestoneIds.filter(id => done.has(id)).length
  const booksDone = allBookIds.filter(id => done.has(id)).length

  const weeksOut = useMemo(() => {
    const ms = new Date(WORKSHOP.startDate + 'T00:00:00').getTime() - Date.now()
    return Math.max(0, Math.round(ms / (7 * 24 * 3600 * 1000)))
  }, [])

  if (reader) {
    return <ReaderOverlay source={reader} onClose={() => setReader(null)} />
  }

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        {/* ─── Masthead ─── */}
        <header className="mb-10 text-center">
          <div className="mb-3 font-mono text-[15px] uppercase tracking-[3px] text-ink-muted">
            Lori Corpuz · A Research Program
          </div>
          <h1 className="font-serif text-[47px] font-semibold leading-tight text-ink md:text-[55px]">
            Complexity Economics
          </h1>
          <div className="mx-auto mt-3 mb-3 h-[2px] w-16 bg-burgundy" />
          <p className="font-serif text-[21px] italic text-ink-light">
            A mastery pathway toward the {WORKSHOP.name}
          </p>
          <p className="mt-1 font-mono text-[15px] uppercase tracking-[1.5px] text-ink-muted">
            {WORKSHOP.host} · {WORKSHOP.place} · {WORKSHOP.dates}
          </p>
        </header>

        {/* ─── Tabs ─── */}
        <nav className="mb-10 flex justify-center gap-4 border-b border-rule pb-2">
          <span className="border-b-2 border-burgundy py-1 font-serif text-[25px] font-semibold text-burgundy">
            Pathway
          </span>
          <Link
            href="/complexecon/research"
            className="py-1 font-serif text-[25px] text-ink-muted transition-colors hover:text-ink"
          >
            Research
          </Link>
          <Link
            href="/complexecon/strategy"
            className="py-1 font-serif text-[25px] text-ink-muted transition-colors hover:text-ink"
          >
            Strategy
          </Link>
        </nav>

        {/* ─── The question ─── */}
        <section className="mb-12 border-y border-rule py-8 text-center">
          <p className="font-serif text-[31px] italic leading-snug text-ink md:text-[35px]">
            &ldquo;{CENTRAL_QUESTION}&rdquo;
          </p>
        </section>

        {/* ─── The lane ─── */}
        <section className="mb-12">
          <SectionHeader numeral="—" title="The Lane" />
          <p className="mb-5 font-serif text-[23px] leading-relaxed text-ink">{LANE_STATEMENT}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-sm border border-rule bg-white p-3">
              <div className="mb-1.5 font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                Continuity
              </div>
              <p className="text-[17px] leading-relaxed text-ink-light">
                Armstrong&rsquo;s edge thesis is already a performativity claim: analyst anchoring as a convention that
                partly constitutes the price it estimates. A live trading book as empirical evidence for a
                social-studies-of-finance argument.
              </p>
            </div>
            <div className="rounded-sm border border-rule bg-white p-3">
              <div className="mb-1.5 font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                Legibility
              </div>
              <p className="text-[17px] leading-relaxed text-ink-light">
                The workshop&rsquo;s lines of inquiry — embeddedness, value, the social structure of accumulation —
                are exactly where capital-allocation conventions sit. This supplies the firm-level mechanism to a
                literature working at household scale.
              </p>
            </div>
            <div className="rounded-sm border border-rule bg-white p-3">
              <div className="mb-1.5 font-serif text-[17px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                Occupancy
              </div>
              <p className="text-[17px] leading-relaxed text-ink-light">
                The complexity economics of AI itself is the field&rsquo;s biggest open gap, and performativity is the
                bridge into it. Essentially no one holds this ground who also trades.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Status strip ─── */}
        <section className="mb-12 grid grid-cols-3 gap-3">
          <div className="rounded-sm border border-rule bg-white p-3 text-center">
            <div className="font-mono text-[29px] font-semibold text-burgundy">{weeksOut}</div>
            <div className="font-mono text-[14px] uppercase tracking-[1px] text-ink-muted">Weeks to Abu Dhabi</div>
          </div>
          <div className="rounded-sm border border-rule bg-white p-3 text-center">
            <div className="font-mono text-[29px] font-semibold text-ink">
              {loaded ? milestonesDone : '·'}<span className="text-ink-faint">/{allMilestoneIds.length}</span>
            </div>
            <div className="font-mono text-[14px] uppercase tracking-[1px] text-ink-muted">Milestones</div>
          </div>
          <div className="rounded-sm border border-rule bg-white p-3 text-center">
            <div className="font-mono text-[29px] font-semibold text-ink">
              {loaded ? booksDone : '·'}<span className="text-ink-faint">/{allBookIds.length}</span>
            </div>
            <div className="font-mono text-[14px] uppercase tracking-[1px] text-ink-muted">Library</div>
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
                      <span className="font-serif text-[23px] font-semibold text-ink-faint">{stage.numeral}</span>
                      <h3 className="font-serif text-[23px] font-semibold text-ink">{stage.name}</h3>
                    </div>
                    <span className="font-mono text-[14px] uppercase tracking-[1px] text-ink-muted">
                      {stage.window} · {doneCount}/{total}
                    </span>
                  </div>
                  <p className="mb-3 text-[17px] leading-relaxed text-ink-light">{stage.aim}</p>
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
                              className={`text-[19px] font-semibold ${
                                checked ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'
                              }`}
                            >
                              {m.label}
                            </div>
                            <p className="mt-0.5 text-[17px] leading-relaxed text-ink-muted">{m.detail}</p>
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
          <p className="mb-2 text-[17px] leading-relaxed text-ink-light">
            Six books and two papers form the spine — the anti-dilettante rule holds. Foundation titles close specific
            gaps; reference titles are read for their argument, not their pages. Every entry links to a place to read
            it; open PDFs read inside the site with highlights, and each book carries a memo that saves as you write.
          </p>
          {!user && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-sm border border-rule bg-white p-2.5">
              <span className="text-[17px] text-ink-muted">
                Sign in to read PDFs in the built-in reader and keep memos as you go.
              </span>
              <button
                onClick={signIn}
                className="rounded-sm border border-burgundy bg-burgundy px-2.5 py-1 font-serif text-[15px] font-medium text-paper hover:bg-burgundy/90"
              >
                Sign in with Google
              </button>
            </div>
          )}
          <div className="space-y-6">
            {LIBRARY.map(topic => (
              <div key={topic.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 border-b border-rule pb-1">
                  <h3 className="font-serif text-[20px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    {topic.name}
                  </h3>
                  <span className="font-mono text-[14px] text-ink-muted">
                    {topic.items.filter(i => done.has(i.id)).length}/{topic.items.length}
                  </span>
                </div>
                <p className="mb-2.5 text-[15px] italic leading-relaxed text-ink-muted">{topic.rationale}</p>
                <ul className="space-y-2">
                  {topic.items.map(item => (
                    <LibraryRow
                      key={item.id}
                      item={item}
                      checked={done.has(item.id)}
                      onToggle={() => toggle(item.id)}
                      memo={notes[item.id] || ''}
                      memoOpen={openMemoId === item.id}
                      memoState={memoState[item.id] || 'idle'}
                      onMemoToggle={() => setOpenMemoId(prev => (prev === item.id ? null : item.id))}
                      onMemoChange={text => handleMemoChange(item.id, text)}
                      onRead={() => openReader(item)}
                      signedIn={!!user}
                      onSignIn={signIn}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Hypotheses ─── */}
        <section className="mb-12">
          <SectionHeader numeral="H" title="The Hypotheses" />
          <p className="mb-4 text-[17px] leading-relaxed text-ink-light">
            The lane only counts if it produces something falsifiable. Tests are fixed before results are examined.
          </p>
          <div className="space-y-3">
            {HYPOTHESES.map(h => (
              <div key={h.id} className="rounded-sm border border-rule bg-white p-3">
                <div className="flex gap-3">
                  <span className="font-mono text-[20px] font-semibold text-burgundy">{h.id}</span>
                  <div>
                    <p className="text-[19px] font-semibold leading-relaxed text-ink">{h.claim}</p>
                    <p className="mt-1.5 text-[17px] leading-relaxed text-ink-muted">
                      <span className="font-mono text-[14px] uppercase tracking-[1px] text-amber-ink">Test · </span>
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
                <div className="mb-1.5 font-serif text-[19px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  {a.name}
                </div>
                <p className="text-[17px] leading-relaxed text-ink-light">{a.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-rule pt-4 text-center">
          <p className="font-serif text-[19px] italic text-ink-muted">
            An engine, not a camera — the measurement moves the world.
          </p>
          <p className="mt-1.5 font-mono text-[14px] uppercase tracking-[2px] text-ink-faint">
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
