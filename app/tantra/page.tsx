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
const PRACTICE_START = '2026-04-21' // Day one (V1 began here)
const V2_START = '2026-05-14'       // New 40-day regime (V2)
const CURRENT_REGIME = 'V2'

// ── V2 · Dissolution Layer A: Five Hindrances ────────────────────────────────
const HINDRANCES: { name: string; gloss: string }[] = [
  { name: 'Sensory desire', gloss: 'grasping for what is pleasant, chasing what tastes good' },
  { name: 'Ill-will', gloss: 'aversion to what is unpleasant, contraction against difficulty' },
  { name: 'Sloth and torpor', gloss: 'dullness, heaviness, the dimming of attention' },
  { name: 'Restlessness and worry', gloss: 'agitation, the mind racing forward and back' },
  { name: 'Doubt', gloss: 'second-guessing, the uncertainty that paralyzes' },
]

// ── V2 · Dissolution Layer B: Personal Patterns ──────────────────────────────
const DISSOLUTIONS: string[] = [
  'The woman who lets the sting of rejection — from work, from men, from herself — pull her off her mission, her joy, her peace',
  'The woman who is still trying to be enough',
  'The woman who pushes away her anger as if it were unwomanly',
  'The woman who shrinks her needs to fit in the space she’s been given',
  'The woman who plays the supporting role in her own life',
  'The woman who waits — for a man unclear about her, for permission, for the right moment, for someone else’s yes',
  'The woman who says “just,” “maybe,” “kind of,” “I think”',
]

const LINGUISTIC_LOOSENING =
  'The self is a shadow cast by grammar. Rest in the space where no shadow is being cast — vast, empty, aware, free.'

// ── V2 · Generation: Seven Factors of Awakening ──────────────────────────────
const FACTORS: { name: string; gloss: string }[] = [
  { name: 'Mindfulness', gloss: 'I am clearly aware of this moment, as it is' },
  { name: 'Investigation', gloss: 'I look directly. I do not turn away from what is' },
  { name: 'Energy', gloss: 'vitality moves in me. I am engaged, present, alive' },
  { name: 'Joy', gloss: 'gladness arises naturally as grasping releases' },
  { name: 'Tranquility', gloss: 'my body settles. My breath deepens' },
  { name: 'Concentration', gloss: 'my mind is unified, gathered, here' },
  { name: 'Equanimity', gloss: 'my heart is steady. Neither grasping, nor pushing away' },
]

// ── V2 · Generation: The Nine Aspects (refined) ──────────────────────────────
type Aspect = {
  n: number
  domain: 'INNER' | 'CREATION' | 'RELATING'
  title: string
  line: string
}

const ASPECTS: Aspect[] = [
  {
    n: 1,
    domain: 'INNER',
    title: 'The Discerning One',
    line: 'My perception, intuition, and judgment are mine. I separate signal from noise — in markets, in people, in moments. I do not borrow other people’s seeing.',
  },
  {
    n: 2,
    domain: 'INNER',
    title: 'The Practitioner',
    line: 'I return to the reps without drama. My craft is my practice. Consistency is my signature. The compounding is mine.',
  },
  {
    n: 3,
    domain: 'INNER',
    title: 'The Attuned One',
    line: 'I am fully here, and I am aware — of the energy in me, in the room, the exchange. My presence is a gift, given with literacy and intent.',
  },
  {
    n: 4,
    domain: 'CREATION',
    title: 'The Principal',
    line: 'I own the fund. I own my judgment. I own the direction. Allocators do not evaluate me — they seek me.',
  },
  {
    n: 5,
    domain: 'CREATION',
    title: 'The Visionary',
    line: 'I see futures others cannot yet see, and I pull reality toward what I see — through conviction, through creation, through patient force.',
  },
  {
    n: 6,
    domain: 'CREATION',
    title: 'The Technologist',
    line: 'Phone, code, AI are limbs I have grown. My systems update themselves. Finance, AI, complexity — all flowing through me as one.',
  },
  {
    n: 7,
    domain: 'RELATING',
    title: 'The Loving One',
    line: 'My love is the ground beneath everything else. Without it, discernment becomes coldness. With it, all of me becomes trustworthy.',
  },
  {
    n: 8,
    domain: 'RELATING',
    title: 'The One With Gravitas',
    line: 'I do not push. I do not strain. I move effortlessly because I have nothing to prove. Rooms organize around me.',
  },
  {
    n: 9,
    domain: 'RELATING',
    title: 'The Influential One',
    line: 'Those who meet me are changed — because I am undeniably myself, and that gives them permission to be undeniably themselves.',
  },
]

// ── V1 archive ──────────────────────────────────────────────────────────────
const V1_DISSOLVING: string[] = [
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

const V1_GENERATING: Aspect[] = [
  { n: 1, domain: 'INNER', title: 'The One Who Knows', line: 'My intuition is trained. My pattern recognition is sharp. I trust my read before the data confirms it.' },
  { n: 2, domain: 'INNER', title: 'The Practitioner', line: 'I return to the reps without drama. Consistency is my signature. The compounding is mine.' },
  { n: 3, domain: 'INNER', title: 'The One With Her Own Frame', line: 'My center is not negotiable. I hold the frame; I do not need the frame to be held for me.' },
  { n: 4, domain: 'CREATION', title: 'The Principal', line: 'I own the fund. I own my judgment. Allocators do not evaluate me — they seek me.' },
  { n: 5, domain: 'CREATION', title: 'The Builder', line: 'Code flows through me. Systems compound. I make, and the world catches up.' },
  { n: 6, domain: 'CREATION', title: 'The Radiant One', line: 'Radiant in body, mind, and character. Rooms receive my light before they know my name.' },
  { n: 7, domain: 'RELATING', title: 'The Loving One', line: 'My love is a force, not a concession. I hold people with warmth without losing my ground.' },
  { n: 8, domain: 'RELATING', title: 'The Playful One', line: 'My timing is musical. I find the joke inside the serious thing. I am alive in the room.' },
  { n: 9, domain: 'RELATING', title: 'The Present One', line: 'When I am with someone, no part of me is elsewhere. My attention is the gift.' },
]

// ── Section design assets (SVG sigils) ───────────────────────────────────────
function HindrancesSigil() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-burgundy">
      {[8, 14, 20, 26, 32].map((x, i) => (
        <line key={i} x1={x} y1="8" x2={x} y2="32" stroke="currentColor" strokeWidth="1.4" />
      ))}
      <line x1="6" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  )
}
function DissolutionsSigil() {
  const dots = [
    [8, 8, 1.6], [16, 12, 1.2], [24, 9, 1.0], [32, 14, 0.8],
    [12, 20, 1.3], [22, 22, 1.6], [30, 24, 1.0],
    [8, 30, 1.0], [18, 32, 0.8], [28, 32, 1.2],
  ]
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-burgundy">
      {dots.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="currentColor" opacity={0.4 + (r as number) * 0.3} />
      ))}
    </svg>
  )
}
function FactorsSigil() {
  const rays = Array.from({ length: 7 }, (_, i) => {
    const a = (i * (360 / 7) - 90) * (Math.PI / 180)
    const x = 20 + 14 * Math.cos(a)
    const y = 20 + 14 * Math.sin(a)
    return { x, y, key: i }
  })
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-burgundy">
      {rays.map((r) => (
        <line key={r.key} x1="20" y1="20" x2={r.x} y2={r.y} stroke="currentColor" strokeWidth="1.2" />
      ))}
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      <circle cx="20" cy="20" r="9" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    </svg>
  )
}
function AspectsSigil() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-burgundy">
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <circle
            key={`${r}-${c}`}
            cx={10 + c * 10}
            cy={10 + r * 10}
            r={r === 1 && c === 1 ? 2.4 : 1.6}
            fill="currentColor"
            opacity={r === 1 && c === 1 ? 1 : 0.75}
          />
        ))
      )}
      <rect x="6" y="6" width="28" height="28" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
    </svg>
  )
}

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
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const d = new Date()
  if (!checkinDates.has(fmt(d))) d.setDate(d.getDate() - 1)
  let streak = 0
  for (let i = 0; i < 1000; i++) {
    if (checkinDates.has(fmt(d))) {
      streak += 1
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function SectionHeader({
  sigil,
  title,
  meta,
}: {
  sigil: React.ReactNode
  title: string
  meta: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center border border-rule-light rounded-sm bg-paper">
          {sigil}
        </div>
        <h2 className="font-serif text-[15px] lg:text-[16px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          {title}
        </h2>
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.5px] text-ink-muted">
        {meta}
      </div>
    </div>
  )
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
  const [backfillOpen, setBackfillOpen] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [showCommentHistory, setShowCommentHistory] = useState(false)

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
        startDate: PRACTICE_START,
        practiceStartDate: PRACTICE_START,
        cycleStartDate: V2_START,
        cycleLengthDays: CYCLE_DAYS,
        regimeName: CURRENT_REGIME,
      }
      await saveTantraConfig(user.uid, init)
      finalCfg = init
    } else if (!finalCfg.cycleStartDate) {
      const migration: Partial<TantraConfig> = {
        practiceStartDate: finalCfg.startDate || PRACTICE_START,
        cycleStartDate: V2_START,
        regimeName: CURRENT_REGIME,
      }
      await saveTantraConfig(user.uid, migration)
      finalCfg = { ...finalCfg, ...migration }
    }

    const seedDate = '2026-04-21'
    const hasSeed = cis.some((c) => c.date === seedDate)
    if (!hasSeed) {
      const seedInstant = new Date('2026-04-21T14:05:00Z')
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

  const practiceStart = config?.practiceStartDate || config?.startDate || PRACTICE_START
  const cycleStart = config?.cycleStartDate || PRACTICE_START
  const cycleLen = config?.cycleLengthDays || CYCLE_DAYS
  const regimeName = config?.regimeName || CURRENT_REGIME

  const daysIntoCycle = Math.max(0, Math.min(cycleLen, daysBetween(cycleStart, today) + 1))
  const daysRemaining = Math.max(0, cycleLen - daysIntoCycle)
  const daysSincePractice = Math.max(0, daysBetween(practiceStart, today) + 1)

  const cycleDays = useMemo(() => {
    const arr: { date: string; index: number; checked: boolean; isToday: boolean; isFuture: boolean }[] = []
    for (let i = 0; i < cycleLen; i++) {
      const d = new Date(cycleStart + 'T00:00:00')
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
  }, [cycleStart, cycleLen, checkinDates, today])

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
    <div className="max-w-[1680px] mx-auto px-4 lg:px-6 py-3 lg:h-screen lg:overflow-y-auto lg:flex lg:flex-col">
      {/* Top: who I am becoming (small, editable) */}
      <div className="mb-2">
        {editingOneliner ? (
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[9px] uppercase tracking-[1px] text-burgundy">
              Who I am becoming
            </div>
            <textarea
              value={onelinerDraft}
              onChange={(e) => setOnelinerDraft(e.target.value)}
              className="font-serif italic text-[12px] text-ink bg-transparent border border-rule rounded-sm px-2 py-1.5 w-full focus:outline-none focus:border-burgundy resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveOneliner}
                className="font-serif text-[10px] uppercase tracking-[0.5px] px-3 py-1 bg-burgundy text-paper rounded-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setOnelinerDraft(config?.oneliner || '')
                  setEditingOneliner(false)
                }}
                className="font-serif text-[10px] uppercase tracking-[0.5px] px-3 py-1 border border-rule text-ink-muted rounded-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingOneliner(true)}
            className="text-left w-full group"
            title="Click to edit"
          >
            <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted mr-2">
              Who I am becoming —
            </span>
            <span className="font-serif italic text-[12px] text-ink-muted group-hover:text-burgundy transition-colors">
              {config?.oneliner}
            </span>
          </button>
        )}
      </div>

      {/* Title — compact */}
      <div className="mb-3 pb-2 border-b border-rule-light">
        <h1 className="font-serif text-[22px] lg:text-[26px] font-semibold text-burgundy tracking-tight leading-tight">
          Daily Tantra Meditation
        </h1>
        <div className="font-serif italic text-[11px] lg:text-[12px] text-ink-muted mt-0.5">
          Becoming Her · {regimeName} · A 30-minute morning ritual
        </div>
      </div>

      {/* STREAK ~20vh */}
      <section className="mb-2 lg:mb-3 lg:h-[22vh] lg:min-h-[180px] flex flex-col">
        <div className="flex items-baseline justify-between mb-1.5">
          <h2 className="font-serif text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            The 40-Day Mandala · {regimeName}
          </h2>
          <div className="font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted">
            Day {daysIntoCycle}/{cycleLen} · {daysRemaining} left
          </div>
        </div>
        <div className="bg-white border border-rule rounded-sm p-2.5 flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-[170px_1fr] gap-3 lg:gap-4 h-full">
            {/* Left: counters */}
            <div className="flex flex-col gap-1.5">
              <div>
                <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Current streak</div>
                <div className="font-serif text-[32px] lg:text-[38px] font-semibold text-burgundy leading-none mt-0.5">
                  {streak}<span className="font-serif text-[10px] text-ink-muted ml-1">days</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rule-light">
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Total</div>
                  <div className="font-serif text-[13px] font-semibold text-ink">{totalCompleted}</div>
                </div>
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Day One</div>
                  <div className="font-serif text-[13px] font-semibold text-ink">
                    {daysSincePractice}<span className="font-serif text-[9px] text-ink-muted ml-0.5">d</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleToggleToday}
                disabled={submitting}
                className={`font-serif text-[10px] uppercase tracking-[0.5px] px-2 py-1.5 rounded-sm border transition-colors ${
                  checkedInToday
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-burgundy border-burgundy hover:bg-burgundy hover:text-paper'
                } disabled:opacity-50`}
              >
                {checkedInToday ? 'Completed today' : 'Mark today complete'}
              </button>
              <div className="mt-auto pt-1 border-t border-rule-light">
                <button
                  onClick={() => setBackfillOpen((o) => !o)}
                  className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted hover:text-burgundy flex items-center gap-1"
                >
                  <span>{backfillOpen ? '−' : '+'}</span>
                  <span>Backfill</span>
                </button>
                {backfillOpen && (
                  <div className="flex gap-1 mt-1">
                    <input
                      type="date"
                      value={backfillDate}
                      onChange={(e) => setBackfillDate(e.target.value)}
                      className="font-mono text-[9px] text-ink bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-burgundy flex-1 min-w-0"
                    />
                    <input
                      type="time"
                      value={backfillTime}
                      onChange={(e) => setBackfillTime(e.target.value)}
                      className="font-mono text-[9px] text-ink bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-burgundy w-[58px]"
                    />
                    <button
                      onClick={handleBackfill}
                      disabled={submitting || !backfillDate}
                      className="font-serif text-[9px] uppercase tracking-[0.5px] px-1.5 py-0.5 border border-burgundy text-burgundy rounded-sm hover:bg-burgundy hover:text-paper disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Right: 40-day grid */}
            <div className="flex flex-col min-h-0">
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted mb-1 flex justify-between">
                <span>{regimeName} · {cycleStart}</span>
                <span className="text-ink-faint">Day One {practiceStart}</span>
              </div>
              <div className="grid grid-cols-10 gap-1 flex-1 min-h-0">
                {cycleDays.map((d) => {
                  const base = 'aspect-square rounded-sm border flex items-center justify-center font-mono text-[9px]'
                  let cls = `${base} border-rule text-ink-faint bg-transparent`
                  if (d.checked) cls = `${base} bg-burgundy border-burgundy text-paper`
                  else if (d.isToday) cls = `${base} border-burgundy text-burgundy bg-burgundy-bg`
                  else if (d.isFuture) cls = `${base} border-rule-light text-ink-faint bg-transparent`
                  else cls = `${base} border-rule text-ink-muted bg-cream`
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

      {/* SECTIONS — 4 cols, ~40vh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2 lg:mb-3 lg:h-[42vh] lg:min-h-[340px]">
        {/* Five Hindrances */}
        <section className="bg-white border border-rule rounded-sm p-2.5 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-rule-light">
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"><HindrancesSigil /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy leading-tight">Five Hindrances</h3>
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Layer A · Universal</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {HINDRANCES.map((h, i) => (
              <div key={h.name} className="border-l-2 border-burgundy/30 pl-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-[8px] text-burgundy font-semibold">0{i + 1}</span>
                  <span className="font-serif text-[11px] font-semibold text-ink leading-tight">{h.name}</span>
                </div>
                <div className="font-serif text-[9px] text-ink-muted leading-snug">{h.gloss}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Dissolutions */}
        <section className="bg-white border border-rule rounded-sm p-2.5 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-rule-light">
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"><DissolutionsSigil /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy leading-tight">Dissolutions</h3>
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Layers B + C</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {DISSOLUTIONS.map((line, i) => (
              <div key={i} className="border-l-2 border-burgundy/30 pl-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-[8px] text-burgundy font-semibold flex-shrink-0">0{i + 1}</span>
                  <span className="font-serif text-[10px] text-ink leading-snug">{line}</span>
                </div>
              </div>
            ))}
            <div className="mt-1.5 p-1.5 bg-burgundy-bg border border-burgundy/20 rounded-sm">
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-burgundy mb-0.5">Layer C · Linguistic</div>
              <div className="font-serif text-[9px] italic text-ink leading-snug">&ldquo;{LINGUISTIC_LOOSENING}&rdquo;</div>
            </div>
          </div>
        </section>

        {/* Seven Factors */}
        <section className="bg-white border border-rule rounded-sm p-2.5 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-rule-light">
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"><FactorsSigil /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy leading-tight">Seven Factors</h3>
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Awakening · Foundation</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {FACTORS.map((f, i) => (
              <div key={f.name} className="border-l-2 border-burgundy/30 pl-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-[8px] text-burgundy font-semibold">0{i + 1}</span>
                  <span className="font-serif text-[11px] font-semibold text-ink leading-tight">{f.name}</span>
                </div>
                <div className="font-serif text-[9px] text-ink-muted leading-snug">{f.gloss}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Nine Aspects */}
        <section className="bg-white border border-rule rounded-sm p-2.5 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-rule-light">
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"><AspectsSigil /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy leading-tight">Nine Aspects</h3>
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Generation · 3 domains</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {(['INNER', 'CREATION', 'RELATING'] as const).map((domain) => (
              <div key={domain}>
                <div className="font-mono text-[8px] uppercase tracking-[1.2px] text-burgundy mb-0.5">
                  {domain === 'INNER' ? 'I · Inner' : domain === 'CREATION' ? 'II · Creation' : 'III · Relating'}
                </div>
                <div className="space-y-1">
                  {ASPECTS.filter((a) => a.domain === domain).map((a) => (
                    <div key={a.n} className="border-l-2 border-burgundy/30 pl-1.5 cursor-help" title={a.line}>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-[8px] text-burgundy font-semibold">0{a.n}</span>
                        <span className="font-serif text-[10px] font-semibold text-ink leading-tight">{a.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* COMMENTS ~10vh */}
      <section className="mb-2 lg:h-[10vh] lg:min-h-[88px]">
        <div className="flex items-baseline justify-between mb-1.5">
          <h2 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Commentary
          </h2>
          <div className="font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted">
            {comments.length} {comments.length === 1 ? 'entry' : 'entries'} · informs V3
          </div>
        </div>
        <div className="bg-white border border-rule rounded-sm p-2 flex items-stretch gap-1.5">
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            {(['other', 'dissolve', 'generate'] as TantraCommentKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setCommentKind(k)}
                className={`font-mono text-[8px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border ${
                  commentKind === k
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                }`}
              >
                {k === 'other' ? 'Note' : k === 'dissolve' ? 'Diss' : 'Gen'}
              </button>
            ))}
          </div>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What arose today?"
            rows={2}
            className="flex-1 font-serif text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy resize-none"
          />
          <div className="flex flex-col gap-0.5 flex-shrink-0 justify-between">
            <button
              onClick={handleAddComment}
              disabled={submitting || !commentText.trim()}
              className="font-serif text-[9px] uppercase tracking-[0.5px] px-2 py-1 bg-burgundy text-paper rounded-sm disabled:opacity-40"
            >
              Add
            </button>
            {comments.length > 0 && (
              <button
                onClick={() => setShowCommentHistory((o) => !o)}
                className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted hover:text-burgundy whitespace-nowrap"
              >
                {showCommentHistory ? 'Hide' : `View ${comments.length}`}
              </button>
            )}
          </div>
        </div>
        {showCommentHistory && comments.length > 0 && (
          <div className="space-y-1 mt-2 max-h-[40vh] overflow-y-auto">
            {comments.map((c) => {
              const d = c.createdAt?.toDate ? c.createdAt.toDate() : null
              const kindLabel = c.kind === 'dissolve' ? 'Dissolve' : c.kind === 'generate' ? 'Generate' : 'Note'
              const kindColor =
                c.kind === 'dissolve'
                  ? 'text-ink-muted border-rule bg-cream'
                  : c.kind === 'generate'
                  ? 'text-burgundy border-burgundy/30 bg-burgundy-bg'
                  : 'text-ink-muted border-rule bg-paper'
              return (
                <div key={c.id} className="bg-white border border-rule rounded-sm p-1.5 group relative">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className={`font-mono text-[8px] uppercase tracking-[1px] px-1 py-0.5 rounded-sm border ${kindColor}`}>
                      {kindLabel}
                    </span>
                    <span className="font-mono text-[8px] text-ink-muted">{d ? formatDateTime(d) : '—'}</span>
                  </div>
                  <div className="font-serif text-[11px] text-ink leading-snug whitespace-pre-wrap">{c.text}</div>
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 font-mono text-[10px] uppercase tracking-[0.5px] text-ink-muted hover:text-red-ink"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* V1 archive — collapsed pill */}
      <section className="mb-3">
        <button
          onClick={() => setShowArchive((o) => !o)}
          className="w-full flex items-center justify-between bg-paper border border-rule-light rounded-sm px-2.5 py-1.5 hover:border-rule transition-colors"
        >
          <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted">
            <span className="text-burgundy mr-1.5">{showArchive ? '−' : '+'}</span>
            V1 Archive · Apr 21 – May 13 · 18 days
          </span>
          <span className="font-mono text-[8px] text-ink-faint">{showArchive ? 'Hide' : 'Show'}</span>
        </button>
        {showArchive && (
          <div className="mt-2 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-2">
            <div className="bg-white border border-rule rounded-sm p-2.5">
              <div className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                V1 · Dissolving
              </div>
              <ul className="space-y-1">
                {V1_DISSOLVING.map((line, i) => (
                  <li key={i} className="font-serif text-[10px] text-ink-muted leading-snug pl-2.5 relative">
                    <span className="absolute left-0 top-[0.4em] text-ink-faint text-[9px]">·</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-rule rounded-sm p-2.5">
              <div className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                V1 · The Original Nine
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {(['INNER', 'CREATION', 'RELATING'] as const).map((domain) => (
                  <div key={domain} className="flex flex-col gap-1.5">
                    <div className="font-mono text-[8px] uppercase tracking-[1.2px] text-ink-muted pb-1 border-b border-rule-light">
                      {domain === 'INNER' ? 'I · Inner' : domain === 'CREATION' ? 'II · Creation' : 'III · Relating'}
                    </div>
                    {V1_GENERATING.filter((a) => a.domain === domain).map((a) => (
                      <div key={a.n} className="bg-paper border border-rule-light rounded-sm p-1.5">
                        <div className="flex items-baseline gap-1 mb-0.5">
                          <span className="font-mono text-[8px] text-ink-muted font-semibold">0{a.n}</span>
                          <span className="font-serif text-[10px] font-semibold text-ink leading-tight">{a.title}</span>
                        </div>
                        <div className="font-serif text-[9px] text-ink-muted leading-snug">{a.line}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-faint text-center">
        — ⬩ — Armstrong · Confidential · For Daily Practice — ⬩ —
      </div>
    </div>
  )
}
