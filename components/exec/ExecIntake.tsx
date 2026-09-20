'use client'

/**
 * The intake surface — what goes in, and what it left behind.
 *
 * Three columns of standing at the top, the queue in the middle, the ledger
 * at the bottom. The queue is the point: something is always waiting, so
 * "nothing to read" never becomes a reason to open a feed and scroll.
 *
 * Marking something done demands a takeaway. It is the one piece of friction
 * kept on purpose — an item ticked without a sentence is an item you cannot
 * later prove you read, and a ledger of titles is a reading list wearing a
 * ledger's clothes.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { authFetch } from '@/lib/auth-fetch'
import {
  getIntakeItems,
  getIntakeDay,
  setIntakeStatus,
  setNewsScanned,
  setIntakeNote,
  returnToBacklog,
} from '@/lib/firestore/intake'
import type { IntakeDayDoc, IntakeItem, IntakeKind } from '@/lib/types/intake'
import { INTAKE_KINDS, KIND_BY_ID, intakeStanding, waitingDays } from '@/lib/exec/intake'
import { useExecDate } from './useExecDate'

const INK = '#2b3a3f'
const MUTED = '#7d8a86'
const FAINT = '#b8c2bc'
const RULE = '#e4dccb'
const CARD = '#fffdf7'
const GOOD = '#2d6b4a'
const ALERT = '#c94f35'

function Tick() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke={CARD} strokeWidth="2" aria-hidden="true">
      <path d="M2.5 6.2L4.8 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Btn({
  children,
  onClick,
  disabled,
  tone = 'quiet',
  title,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  tone?: 'quiet' | 'solid'
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent transition-colors disabled:opacity-40 shrink-0"
      style={
        tone === 'solid'
          ? { color: CARD, backgroundColor: INK, borderColor: INK }
          : { color: INK, borderColor: FAINT }
      }
    >
      {children}
    </button>
  )
}

// ── One row of the queue ──────────────────────────────────────────────────

function QueueRow({
  item,
  today,
  onDone,
  onSkip,
  busy,
}: {
  item: IntakeItem
  today: string
  onDone: (id: string, takeaway: string) => void
  onSkip: (id: string) => void
  busy: boolean
}) {
  const [open, setOpen] = useState(false)
  const [takeaway, setTakeaway] = useState('')
  const spec = KIND_BY_ID[item.kind]
  const waited = waitingDays(item, today)

  return (
    <div className="border rounded-lg px-2 py-1.5" style={{ borderColor: RULE, backgroundColor: CARD }}>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className="font-mono text-[8px] uppercase tracking-[0.4px] px-1 py-px rounded-sm border shrink-0"
          style={{ color: spec.color, borderColor: spec.color + '33', backgroundColor: spec.color + '0d' }}
        >
          {spec.label}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold leading-snug hover:underline min-w-0"
          style={{ color: INK }}
        >
          {item.title}
        </a>
        <span className="font-mono text-[9px] ml-auto shrink-0" style={{ color: waited >= 7 ? ALERT : FAINT }}>
          {item.source} &middot; {waited === 0 ? 'today' : `${waited}d`}
        </span>
      </div>

      {item.blurb && (
        <p className="text-[10px] leading-snug mt-0.5 line-clamp-2" style={{ color: MUTED }}>
          {item.blurb}
        </p>
      )}

      {open ? (
        <div className="flex items-center gap-1.5 mt-1.5">
          <input
            autoFocus
            value={takeaway}
            onChange={(e) => setTakeaway(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && takeaway.trim()) onDone(item.id!, takeaway)
              if (e.key === 'Escape') setOpen(false)
            }}
            maxLength={280}
            placeholder="The takeaway — one line. What does this change?"
            className="flex-1 min-w-0 border rounded-md px-2 py-1 text-[11px] bg-transparent outline-none"
            style={{ borderColor: RULE, color: INK }}
          />
          <Btn tone="solid" disabled={!takeaway.trim() || busy} onClick={() => onDone(item.id!, takeaway)}>
            Save
          </Btn>
          <Btn onClick={() => setOpen(false)}>Cancel</Btn>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mt-1">
          <Btn onClick={() => setOpen(true)} disabled={busy}>
            Log takeaway
          </Btn>
          <Btn onClick={() => onSkip(item.id!)} disabled={busy} title="Judged and passed over — keeps the queue a queue">
            Skip
          </Btn>
        </div>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────

export function ExecIntake({ date: serverDate }: { date: string }) {
  const date = useExecDate(serverDate)
  const { user, signIn, loading: authLoading } = useAuth()
  const [items, setItems] = useState<IntakeItem[] | null>(null)
  const [day, setDay] = useState<IntakeDayDoc | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [pulling, setPulling] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState<IntakeKind | 'all'>('all')

  const load = useCallback(async () => {
    if (!user) return
    const [i, d] = await Promise.all([
      getIntakeItems(user.uid).catch(() => [] as IntakeItem[]),
      getIntakeDay(user.uid, date).catch(() => null),
    ])
    setItems(i)
    setDay(d)
    setNote(d?.note || '')
  }, [user, date])
  useEffect(() => { void load() }, [load])

  const standing = useMemo(
    () => intakeStanding(items || [], date, Boolean(day?.newsScanned)),
    [items, date, day]
  )

  const queue = useMemo(() => {
    const all = standing.kinds.flatMap((k) => (filter === 'all' || filter === k.spec.id ? k.backlog : []))
    // Oldest first across kinds, so the queue reads as one debt rather than three.
    return all.sort((a, b) => (a.addedOn || '').localeCompare(b.addedOn || ''))
  }, [standing, filter])

  /** The ledger, newest day first — only what was actually consumed. */
  const ledger = useMemo(() => {
    const done = (items || []).filter((i) => i.status === 'done' && i.consumedOn)
    const byDay = new Map<string, IntakeItem[]>()
    for (const i of done) {
      const list = byDay.get(i.consumedOn!) || []
      list.push(i)
      byDay.set(i.consumedOn!, list)
    }
    return [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30)
  }, [items])

  const pull = useCallback(async () => {
    if (!user) return
    setPulling(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await authFetch('/api/exec/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Pull failed')
      setMsg(
        json.added === 0
          ? `Nothing new — all ${json.seen} already in the ledger.`
          : `${json.added} new of ${json.seen} seen.`
      )
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Pull failed')
    } finally {
      setPulling(false)
    }
  }, [user, date, load])

  const markDone = useCallback(
    async (id: string, takeaway: string) => {
      if (!user) return
      setBusy(id)
      try {
        await setIntakeStatus(user.uid, id, 'done', { takeaway, consumedOn: date })
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, date, load]
  )

  const skip = useCallback(
    async (id: string) => {
      if (!user) return
      setBusy(id)
      try {
        await setIntakeStatus(user.uid, id, 'skipped')
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, load]
  )

  const toggleImplemented = useCallback(
    async (item: IntakeItem) => {
      if (!user || !item.id) return
      setBusy(item.id)
      try {
        await setIntakeStatus(user.uid, item.id, 'done', { implemented: !item.implemented })
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, load]
  )

  const unread = useCallback(
    async (id: string) => {
      if (!user) return
      setBusy(id)
      try {
        await returnToBacklog(user.uid, id)
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, load]
  )

  const toggleScan = useCallback(async () => {
    if (!user) return
    setBusy('news')
    try {
      await setNewsScanned(user.uid, date, !day?.newsScanned)
      await load()
    } finally {
      setBusy(null)
    }
  }, [user, date, day, load])

  const saveNote = useCallback(async () => {
    if (!user || note === (day?.note || '')) return
    await setIntakeNote(user.uid, date, note)
    await load()
  }, [user, date, note, day, load])

  if (!user) {
    return (
      <div className="border rounded-xl p-6 text-center" style={{ borderColor: RULE, backgroundColor: CARD }}>
        <p className="text-[11px] mb-3" style={{ color: MUTED }}>The download and the ledger are your own.</p>
        <Btn tone="solid" onClick={signIn} disabled={authLoading}>Sign in with Google</Btn>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* The three acts. */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {standing.kinds.map((k) => (
          <div
            key={k.spec.id}
            className="border rounded-xl px-2.5 py-2"
            style={{
              borderColor: k.done ? k.spec.color + '55' : RULE,
              backgroundColor: k.done ? k.spec.color + '0d' : CARD,
            }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold"
                style={{ color: k.spec.color }}
              >
                {k.spec.label}
              </span>
              {k.halfDone && (
                <span className="font-mono text-[8px] uppercase px-1 py-px rounded-sm border" style={{ color: MUTED, borderColor: FAINT }}>
                  reviewed
                </span>
              )}
              <span className="ml-auto flex items-center gap-1.5">
                <span className="font-mono text-[9px]" style={{ color: FAINT }}>
                  {k.backlog.length} waiting
                </span>
                {k.spec.id === 'news' ? (
                  <button
                    type="button"
                    onClick={() => void toggleScan()}
                    disabled={busy === 'news'}
                    aria-pressed={k.done}
                    aria-label={k.done ? 'Mark the scan not done' : 'Mark the scan done'}
                    className="w-[18px] h-[18px] rounded-md border flex items-center justify-center shrink-0 disabled:opacity-40"
                    style={{
                      borderColor: k.done ? k.spec.color : FAINT,
                      backgroundColor: k.done ? k.spec.color : 'transparent',
                    }}
                  >
                    {k.done && <Tick />}
                  </button>
                ) : (
                  <span
                    className="w-[18px] h-[18px] rounded-md border flex items-center justify-center shrink-0"
                    style={{
                      borderColor: k.done ? k.spec.color : RULE,
                      backgroundColor: k.done ? k.spec.color : 'transparent',
                    }}
                  >
                    {k.done && <Tick />}
                  </span>
                )}
              </span>
            </div>
            <p className="text-[10px] leading-snug" style={{ color: MUTED }}>{k.spec.order}</p>
            {k.today.map((i) => (
              <div key={i.id} className="flex items-baseline gap-1.5 mt-1 pt-1 border-t" style={{ borderColor: RULE }}>
                <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold truncate hover:underline" style={{ color: INK }}>
                  {i.title}
                </a>
                {k.spec.id === 'paper' && (
                  <button
                    type="button"
                    onClick={() => void toggleImplemented(i)}
                    disabled={busy === i.id}
                    className="font-mono text-[8px] uppercase px-1 py-px rounded-sm border ml-auto shrink-0 disabled:opacity-40"
                    style={
                      i.implemented
                        ? { color: CARD, backgroundColor: k.spec.color, borderColor: k.spec.color }
                        : { color: MUTED, borderColor: FAINT }
                    }
                    title={i.implemented ? 'Implemented — click to undo' : 'Mark implemented'}
                  >
                    {i.implemented ? 'implemented' : 'implement'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* The queue. */}
      <section className="border rounded-xl px-2.5 py-2" style={{ borderColor: RULE, backgroundColor: CARD }}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="font-serif text-[15px] font-semibold" style={{ color: INK }}>The queue</span>
          <span className="font-mono text-[10px]" style={{ color: MUTED }}>
            {standing.backlogTotal} waiting &middot; oldest first
          </span>
          <span className="flex items-center gap-1 ml-auto">
            {(['all', ...INTAKE_KINDS.map((k) => k.id)] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f as IntakeKind | 'all')}
                className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent transition-colors"
                style={
                  filter === f
                    ? { color: CARD, backgroundColor: INK, borderColor: INK }
                    : { color: MUTED, borderColor: FAINT }
                }
              >
                {f === 'all' ? 'All' : KIND_BY_ID[f as IntakeKind].label}
              </button>
            ))}
            <Btn tone="solid" onClick={() => void pull()} disabled={pulling}>
              {pulling ? 'Pulling…' : 'Pull the download'}
            </Btn>
          </span>
        </div>

        {msg && <div className="text-[10px] mb-1.5" style={{ color: GOOD }}>{msg}</div>}
        {err && <div className="text-[10px] mb-1.5" style={{ color: ALERT }}>{err}</div>}

        {items === null ? (
          <div className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: RULE }} />
        ) : queue.length === 0 ? (
          <p className="text-[10px] py-2" style={{ color: MUTED }}>
            Queue empty — pull the download and there will be something waiting tomorrow.
          </p>
        ) : (
          <div className="space-y-1.5">
            {queue.slice(0, 40).map((item) => (
              <QueueRow
                key={item.id}
                item={item}
                today={date}
                onDone={markDone}
                onSkip={skip}
                busy={busy === item.id}
              />
            ))}
            {queue.length > 40 && (
              <p className="text-[10px] pt-1" style={{ color: FAINT }}>
                {queue.length - 40} more waiting — clear some before pulling again.
              </p>
            )}
          </div>
        )}
      </section>

      {/* The ledger. */}
      <section className="border rounded-xl px-2.5 py-2" style={{ borderColor: RULE, backgroundColor: CARD }}>
        <div className="flex items-baseline gap-2 flex-wrap mb-2">
          <span className="font-serif text-[15px] font-semibold" style={{ color: INK }}>The ledger</span>
          <span className="font-mono text-[10px]" style={{ color: MUTED }}>what went in, and what it left</span>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.4px] shrink-0" style={{ color: MUTED }}>
            Today
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => void saveNote()}
            onKeyDown={(e) => { if (e.key === 'Enter') void saveNote() }}
            maxLength={280}
            placeholder="The day's line — what the reading added up to."
            className="flex-1 min-w-0 border rounded-md px-2 py-1 text-[11px] bg-transparent outline-none"
            style={{ borderColor: RULE, color: INK }}
          />
        </div>

        {ledger.length === 0 ? (
          <p className="text-[10px] py-1" style={{ color: MUTED }}>
            Nothing logged yet. A takeaway on the first item starts the ledger.
          </p>
        ) : (
          <div className="space-y-2">
            {ledger.map(([d, list]) => (
              <div key={d}>
                <div className="font-mono text-[9px] uppercase tracking-[0.4px] mb-0.5" style={{ color: d === date ? INK : FAINT }}>
                  {d}{d === date ? ' · today' : ''}
                </div>
                <div className="space-y-1">
                  {list.map((i) => {
                    const spec = KIND_BY_ID[i.kind]
                    return (
                      <div key={i.id} className="flex items-baseline gap-1.5 flex-wrap pl-2 border-l-2" style={{ borderColor: spec.color + '55' }}>
                        <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold hover:underline" style={{ color: INK }}>
                          {i.title}
                        </a>
                        {i.implemented && (
                          <span className="font-mono text-[8px] uppercase px-1 py-px rounded-sm border shrink-0" style={{ color: spec.color, borderColor: spec.color + '44' }}>
                            implemented
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => void unread(i.id!)}
                          disabled={busy === i.id}
                          className="font-mono text-[9px] ml-auto shrink-0 hover:underline disabled:opacity-40"
                          style={{ color: FAINT }}
                          title="Put it back in the queue"
                        >
                          unread
                        </button>
                        {i.takeaway && (
                          <p className="text-[10px] leading-snug w-full" style={{ color: MUTED }}>{i.takeaway}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div>
        <Link
          href="/exec"
          className="inline-flex items-center gap-1.5 font-serif text-[11px] font-medium px-2.5 py-1.5 rounded-md border bg-transparent transition-colors"
          style={{ color: INK, borderColor: FAINT }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M8 5H2M4.5 2.5L2 5l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to the tear sheet
        </Link>
      </div>
    </div>
  )
}
