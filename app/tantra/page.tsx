'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getTantraConfig,
  saveTantraConfig,
  getTantraCheckins,
  setTantraCheckin,
  removeTantraCheckin,
  getTantraComments,
  addTantraComment,
  deleteTantraComment,
} from '@/lib/firestore/tantra'
import type {
  TantraCheckin,
  TantraComment,
  TantraCommentKind,
  TantraConfig,
} from '@/lib/types/tantra'
import { todayString } from '@/lib/date-utils'

const DEFAULT_ONELINER =
  'Builder-philosopher · Research engineer · Technical Principal — rigorous in mind, magnetic in body, present in every room'

const CYCLE_DAYS = 40
const DEFAULT_START = '2026-04-21'

const DISSOLVING: string[] = [
  'The one who checks her bank balance with anxiety',
  'The one who shrinks before asking for money',
  'The one who explains her ambition apologetically',
  'The one who mistakes self-doubt for humility',
  'The one who waits for external validation that the fund is real',
  'The one who believes she must be small to be loved',
  'The one who seeks permission instead of giving it to herself',
  'The one who hides her brilliance to keep others comfortable',
  'The one who says "just," "maybe," "kind of," "I think"',
  'The one who is anxious about whether she is enough',
]

type Aspect = {
  n: number
  domain: 'INNER' | 'CREATION' | 'RELATING'
  title: string
  line: string
}

const GENERATING: Aspect[] = [
  {
    n: 1,
    domain: 'INNER',
    title: 'The One Who Knows',
    line: 'My intuition is trained. My pattern recognition is sharp. I trust my read before the data confirms it.',
  },
  {
    n: 2,
    domain: 'INNER',
    title: 'The Practitioner',
    line: 'I return to the reps without drama. Consistency is my signature. The compounding is mine.',
  },
  {
    n: 3,
    domain: 'INNER',
    title: 'The One With Her Own Frame',
    line: 'My center is not negotiable. I hold the frame; I do not need the frame to be held for me.',
  },
  {
    n: 4,
    domain: 'CREATION',
    title: 'The Principal',
    line: 'I own the fund. I own my judgment. Allocators do not evaluate me — they seek me.',
  },
  {
    n: 5,
    domain: 'CREATION',
    title: 'The Builder',
    line: 'Code flows through me. Systems compound. I make, and the world catches up.',
  },
  {
    n: 6,
    domain: 'CREATION',
    title: 'The Radiant One',
    line: 'Radiant in body, mind, and character. Rooms receive my light before they know my name.',
  },
  {
    n: 7,
    domain: 'RELATING',
    title: 'The Loving One',
    line: 'My love is a force, not a concession. I hold people with warmth without losing my ground.',
  },
  {
    n: 8,
    domain: 'RELATING',
    title: 'The Playful One',
    line: 'My timing is musical. I find the joke inside the serious thing. I am alive in the room.',
  },
  {
    n: 9,
    domain: 'RELATING',
    title: 'The Present One',
    line: 'When I am with someone, no part of me is elsewhere. My attention is the gift.',
  },
]

function formatDateTime(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function computeStreak(checkinDates: Set<string>): number {
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 1000; i++) {
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (checkinDates.has(s)) {
      streak += 1
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export default function TantraPage() {
  const { user } = useAuth()
  const [config, setConfig] = useState<TantraConfig | null>(null)
  const [checkins, setCheckins] = useState<TantraCheckin[]>([])
  const [comments, setComments] = useState<TantraComment[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOneliner, setEditingOneliner] = useState(false)
  const [onelinerDraft, setOnelinerDraft] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentKind, setCommentKind] = useState<TantraCommentKind>('other')
  const [submitting, setSubmitting] = useState(false)
  const [backfillDate, setBackfillDate] = useState('')
  const [backfillTime, setBackfillTime] = useState('10:00')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [cfg, cis, cms] = await Promise.all([
      getTantraConfig(user.uid),
      getTantraCheckins(user.uid),
      getTantraComments(user.uid),
    ])

    let finalCfg = cfg
    if (!finalCfg) {
      const init: TantraConfig = {
        oneliner: DEFAULT_ONELINER,
        startDate: DEFAULT_START,
        cycleLengthDays: CYCLE_DAYS,
      }
      await saveTantraConfig(user.uid, init)
      finalCfg = init
    }

    // Seed the Apr 21, 2026 10:05 AM EDT check-in if this is first load and it's missing
    const seedDate = '2026-04-21'
    const hasSeed = cis.some((c) => c.date === seedDate)
    if (!hasSeed) {
      const seedInstant = new Date('2026-04-21T14:05:00Z') // 10:05 AM EDT
      await setTantraCheckin(user.uid, seedDate, seedInstant)
      const refreshed = await getTantraCheckins(user.uid)
      setCheckins(refreshed)
    } else {
      setCheckins(cis)
    }

    setConfig(finalCfg)
    setOnelinerDraft(finalCfg.oneliner)
    setComments(cms)
    setLoading(false)
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const checkinDates = useMemo(() => new Set(checkins.map((c) => c.date)), [checkins])
  const today = todayString()
  const checkedInToday = checkinDates.has(today)
  const streak = useMemo(() => computeStreak(checkinDates), [checkinDates])
  const totalCompleted = checkins.length

  const startDate = config?.startDate || DEFAULT_START
  const cycleLen = config?.cycleLengthDays || CYCLE_DAYS
  const daysElapsed = Math.max(0, Math.min(cycleLen, daysBetween(startDate, today) + 1))
  const daysRemaining = Math.max(0, cycleLen - daysElapsed)

  const cycleDays = useMemo(() => {
    const arr: { date: string; index: number; checked: boolean; isToday: boolean; isFuture: boolean }[] = []
    for (let i = 0; i < cycleLen; i++) {
      const d = new Date(startDate + 'T00:00:00')
      d.setDate(d.getDate() + i)
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      arr.push({
        date: s,
        index: i + 1,
        checked: checkinDates.has(s),
        isToday: s === today,
        isFuture: new Date(s + 'T00:00:00').getTime() > new Date(today + 'T00:00:00').getTime(),
      })
    }
    return arr
  }, [startDate, cycleLen, checkinDates, today])

  async function handleToggleToday() {
    if (!user) return
    setSubmitting(true)
    try {
      if (checkedInToday) {
        await removeTantraCheckin(user.uid, today)
      } else {
        await setTantraCheckin(user.uid, today, new Date())
      }
      const refreshed = await getTantraCheckins(user.uid)
      setCheckins(refreshed)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBackfill() {
    if (!user || !backfillDate) return
    setSubmitting(true)
    try {
      const [h, m] = backfillTime.split(':').map(Number)
      const local = new Date(`${backfillDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
      await setTantraCheckin(user.uid, backfillDate, local)
      const refreshed = await getTantraCheckins(user.uid)
      setCheckins(refreshed)
      setBackfillDate('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveOneliner() {
    if (!user) return
    const trimmed = onelinerDraft.trim()
    if (!trimmed) return
    await saveTantraConfig(user.uid, { oneliner: trimmed })
    setConfig((c) => (c ? { ...c, oneliner: trimmed } : c))
    setEditingOneliner(false)
  }

  async function handleAddComment() {
    if (!user) return
    const text = commentText.trim()
    if (!text) return
    setSubmitting(true)
    try {
      await addTantraComment(user.uid, text, commentKind)
      setCommentText('')
      const refreshed = await getTantraComments(user.uid)
      setComments(refreshed)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(id: string) {
    if (!user) return
    await deleteTantraComment(user.uid, id)
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  const todayCheckinTime = checkins.find((c) => c.date === today)?.completedAt

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-serif text-[13px] uppercase tracking-[0.5px] text-burgundy">
          Loading practice...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[1px] text-ink-muted mb-1">
          Armstrong · Personal Development Practice
        </div>
        <h1 className="font-serif text-[28px] font-semibold text-burgundy tracking-tight leading-tight">
          Becoming Her
        </h1>
        <div className="font-serif italic text-[13px] text-ink-muted mt-0.5">
          A 40-day ritual · Modern tantric architecture for identity transformation
        </div>
      </div>

      {/* Oneliner banner */}
      <div className="bg-white border border-rule rounded-sm p-4 mb-6 relative">
        <div className="font-mono text-[9px] uppercase tracking-[1px] text-burgundy mb-1.5">
          Who I am becoming
        </div>
        {editingOneliner ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={onelinerDraft}
              onChange={(e) => setOnelinerDraft(e.target.value)}
              className="font-serif text-[16px] text-ink bg-transparent border border-rule rounded-sm px-2 py-1.5 w-full focus:outline-none focus:border-burgundy resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveOneliner}
                className="font-serif text-[11px] uppercase tracking-[0.5px] px-3 py-1 bg-burgundy text-paper rounded-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setOnelinerDraft(config?.oneliner || '')
                  setEditingOneliner(false)
                }}
                className="font-serif text-[11px] uppercase tracking-[0.5px] px-3 py-1 border border-rule text-ink-muted rounded-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingOneliner(true)}
            className="font-serif text-[18px] text-ink leading-snug text-left hover:text-burgundy transition-colors w-full"
          >
            {config?.oneliner}
          </button>
        )}
      </div>

      {/* Streak section */}
      <section className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            The 40-Day Mandala
          </h2>
          <div className="font-mono text-[10px] uppercase tracking-[0.5px] text-ink-muted">
            Day {daysElapsed} of {cycleLen} · {daysRemaining} remaining
          </div>
        </div>

        <div className="bg-white border border-rule rounded-sm p-4">
          <div className="grid grid-cols-[auto_1fr] gap-6 items-center">
            {/* Left: streak counters */}
            <div className="flex flex-col gap-3 min-w-[160px]">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted">
                  Current streak
                </div>
                <div className="font-serif text-[44px] font-semibold text-burgundy leading-none mt-1">
                  {streak}
                  <span className="font-serif text-[14px] text-ink-muted ml-1.5">days</span>
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted">
                  Total completed
                </div>
                <div className="font-serif text-[16px] font-semibold text-ink mt-0.5">
                  {totalCompleted} of {cycleLen}
                </div>
              </div>

              <button
                onClick={handleToggleToday}
                disabled={submitting}
                className={`font-serif text-[11px] uppercase tracking-[0.5px] px-3 py-2 rounded-sm border transition-colors mt-1 ${
                  checkedInToday
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-burgundy border-burgundy hover:bg-burgundy hover:text-paper'
                } disabled:opacity-50`}
              >
                {checkedInToday ? 'Completed today' : 'Mark today complete'}
              </button>
              {checkedInToday && todayCheckinTime && (
                <div className="font-mono text-[9px] text-ink-muted">
                  {formatDateTime(todayCheckinTime.toDate())}
                </div>
              )}

              <div className="pt-3 mt-1 border-t border-rule-light">
                <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted mb-1.5">
                  Backfill a day
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="date"
                    value={backfillDate}
                    onChange={(e) => setBackfillDate(e.target.value)}
                    className="font-mono text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                  />
                  <input
                    type="time"
                    value={backfillTime}
                    onChange={(e) => setBackfillTime(e.target.value)}
                    className="font-mono text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                  />
                  <button
                    onClick={handleBackfill}
                    disabled={submitting || !backfillDate}
                    className="font-serif text-[10px] uppercase tracking-[0.5px] px-2 py-1 border border-burgundy text-burgundy rounded-sm hover:bg-burgundy hover:text-paper transition-colors disabled:opacity-40"
                  >
                    Record
                  </button>
                </div>
              </div>
            </div>

            {/* Right: 40-day dot grid */}
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted mb-2">
                Cycle progress
              </div>
              <div className="grid grid-cols-10 gap-1.5">
                {cycleDays.map((d) => {
                  const base =
                    'aspect-square rounded-sm border flex items-center justify-center font-mono text-[9px]'
                  let cls = `${base} border-rule text-ink-faint bg-transparent`
                  if (d.checked) {
                    cls = `${base} bg-burgundy border-burgundy text-paper`
                  } else if (d.isToday) {
                    cls = `${base} border-burgundy text-burgundy bg-burgundy-bg`
                  } else if (d.isFuture) {
                    cls = `${base} border-rule-light text-ink-faint bg-transparent`
                  } else {
                    cls = `${base} border-rule text-ink-muted bg-cream`
                  }
                  return (
                    <div key={d.date} title={`${d.date} · Day ${d.index}`} className={cls}>
                      {d.index}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key concepts — dissolving + generating */}
      <section className="mb-6">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3">
          Key Concepts
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Dissolving — small */}
          <div className="bg-white border border-rule rounded-sm p-4">
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b border-rule">
              What I&apos;m dissolving
            </div>
            <div className="font-serif italic text-[10px] text-ink-muted mb-2 leading-snug">
              The old version of me — consciously released before She can arise.
            </div>
            <ul className="space-y-1.5">
              {DISSOLVING.map((line, i) => (
                <li
                  key={i}
                  className="font-serif text-[11px] text-ink-light leading-snug pl-3 relative"
                >
                  <span className="absolute left-0 top-[0.4em] text-burgundy text-[10px]">·</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Generating — the nine, takes most space */}
          <div className="bg-white border border-rule rounded-sm p-4">
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b border-rule">
              What I&apos;m generating — The Nine Aspects
            </div>
            <div className="font-serif italic text-[11px] text-ink-muted mb-3 leading-snug">
              Three domains of becoming. From the empty space, She arises.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['INNER', 'CREATION', 'RELATING'] as const).map((domain) => (
                <div key={domain} className="flex flex-col gap-2">
                  <div className="font-mono text-[9px] uppercase tracking-[1.2px] text-gold pb-1 border-b border-rule-light">
                    {domain === 'INNER'
                      ? 'I · Inner'
                      : domain === 'CREATION'
                      ? 'II · Creation'
                      : 'III · Relating'}
                  </div>
                  {GENERATING.filter((a) => a.domain === domain).map((a) => (
                    <div
                      key={a.n}
                      className="bg-burgundy-bg border border-burgundy/20 rounded-sm p-3"
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-mono text-[9px] text-burgundy font-semibold">
                          0{a.n}
                        </span>
                        <span className="font-serif text-[13px] font-semibold text-burgundy leading-tight">
                          {a.title}
                        </span>
                      </div>
                      <div className="font-serif text-[11px] text-ink leading-snug">
                        {a.line}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Commentary */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Commentary
          </h2>
          <div className="font-mono text-[10px] uppercase tracking-[0.5px] text-ink-muted">
            {comments.length} {comments.length === 1 ? 'entry' : 'entries'} · reintegrate after day {cycleLen}
          </div>
        </div>

        <div className="bg-white border border-rule rounded-sm p-4 mb-3">
          <div className="font-serif italic text-[11px] text-ink-muted mb-3 leading-snug">
            Notes, things to dissolve, things to generate — aggregated across the 40 days to inform your next practice.
          </div>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What arose today?"
            rows={3}
            className="w-full font-serif text-[13px] text-ink bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-burgundy resize-none"
          />
          <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
            <div className="flex gap-1">
              {(['other', 'dissolve', 'generate'] as TantraCommentKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setCommentKind(k)}
                  className={`font-mono text-[9px] uppercase tracking-[1px] px-2 py-1 rounded-sm border transition-colors ${
                    commentKind === k
                      ? 'bg-burgundy text-paper border-burgundy'
                      : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {k === 'other' ? 'Note' : k === 'dissolve' ? 'Dissolve' : 'Generate'}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddComment}
              disabled={submitting || !commentText.trim()}
              className="font-serif text-[11px] uppercase tracking-[0.5px] px-3 py-1.5 bg-burgundy text-paper rounded-sm disabled:opacity-40"
            >
              Add entry
            </button>
          </div>
        </div>

        {comments.length === 0 ? (
          <div className="font-serif italic text-[12px] text-ink-muted text-center py-6">
            No entries yet. Your reflections will accumulate here.
          </div>
        ) : (
          <div className="space-y-2">
            {comments.map((c) => {
              const d = c.createdAt?.toDate ? c.createdAt.toDate() : null
              const kindLabel =
                c.kind === 'dissolve' ? 'Dissolve' : c.kind === 'generate' ? 'Generate' : 'Note'
              const kindColor =
                c.kind === 'dissolve'
                  ? 'text-ink-muted border-rule bg-cream'
                  : c.kind === 'generate'
                  ? 'text-burgundy border-burgundy/30 bg-burgundy-bg'
                  : 'text-ink-muted border-rule bg-paper'
              return (
                <div
                  key={c.id}
                  className="bg-white border border-rule rounded-sm p-3 group relative"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span
                      className={`font-mono text-[9px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border ${kindColor}`}
                    >
                      {kindLabel}
                    </span>
                    <span className="font-mono text-[9px] text-ink-muted">
                      {d ? formatDateTime(d) : '—'}
                    </span>
                  </div>
                  <div className="font-serif text-[13px] text-ink leading-snug whitespace-pre-wrap">
                    {c.text}
                  </div>
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted hover:text-red-ink transition-opacity"
                    title="Delete"
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-faint text-center mb-4">
        — ⬩ — Armstrong · Confidential · For Daily Practice — ⬩ —
      </div>
    </div>
  )
}
