'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
function PyramidIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-burgundy">
      <path d="M12 2L22 20H2L12 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="12" y1="2" x2="12" y2="20" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-burgundy">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <rect x="11" y="1" width="2" height="2.5" rx="0.5" />
        <rect x="11" y="20.5" width="2" height="2.5" rx="0.5" />
        <rect x="20.5" y="11" width="2.5" height="2" rx="0.5" />
        <rect x="1" y="11" width="2.5" height="2" rx="0.5" />
        <rect x="17.66" y="4.34" width="2.5" height="2" rx="0.5" transform="rotate(45 18.66 5.34)" />
        <rect x="3.84" y="18.16" width="2.5" height="2" rx="0.5" transform="rotate(45 4.84 19.16)" />
        <rect x="4.34" y="4.34" width="2" height="2.5" rx="0.5" transform="rotate(-45 5.34 5.84)" />
        <rect x="18.16" y="18.16" width="2" height="2.5" rx="0.5" transform="rotate(-45 19.16 19.66)" />
      </g>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-burgundy">
      <path d="M12 5C7 5 2.73 8.11 1 12.46c1.73 4.35 6 7.54 11 7.54s9.27-3.19 11-7.54C21.27 8.11 17 5 12 5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  )
}

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

  const daysIntoCycle = Math.max(0, Math.min(cycleLen, daysBetween(cycleStart, today) + 1))
  const daysSincePractice = Math.max(0, daysBetween(practiceStart, today) + 1)

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
    <div className="max-w-[1680px] mx-auto px-3 lg:px-6 py-2 lg:py-3 h-screen overflow-hidden flex flex-col">
      {/* Header — left: title + oneliner + grid · right: streak stack + pyramid icon */}
      <div className="mb-1.5 pb-1.5 border-b border-rule-light grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 sm:gap-5 items-start relative">
        <div className="min-w-0">
          <h1 className="font-serif text-[20px] lg:text-[24px] font-semibold text-burgundy tracking-tight leading-none">
            Daily Tantra Meditation
          </h1>
          {editingOneliner ? (
            <div className="flex flex-col gap-1 mt-1">
              <textarea
                value={onelinerDraft}
                onChange={(e) => setOnelinerDraft(e.target.value)}
                className="font-serif italic text-[11px] text-ink bg-transparent border border-rule rounded-sm px-2 py-1 w-full focus:outline-none focus:border-burgundy resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex gap-1.5">
                <button
                  onClick={handleSaveOneliner}
                  className="font-serif text-[9px] uppercase tracking-[0.5px] px-2 py-0.5 bg-burgundy text-paper rounded-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setOnelinerDraft(config?.oneliner || '')
                    setEditingOneliner(false)
                  }}
                  className="font-serif text-[9px] uppercase tracking-[0.5px] px-2 py-0.5 border border-rule text-ink-muted rounded-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingOneliner(true)}
              className="text-left group block leading-tight mb-1.5"
              title="Click to edit"
            >
              <span className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted mr-1.5">
                Who I am becoming —
              </span>
              <span className="font-serif italic text-[11px] text-ink-muted group-hover:text-burgundy transition-colors">
                {config?.oneliner}
              </span>
            </button>
          )}
          <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted flex justify-between items-baseline mb-1">
            <span>Day {daysIntoCycle} / {cycleLen}</span>
            <span className="text-burgundy">{totalCompleted} completed</span>
          </div>
          <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] gap-[3px]">
            {Array.from({ length: cycleLen }, (_, i) => {
              const d = new Date(cycleStart + 'T00:00:00')
              d.setDate(d.getDate() + i)
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              const completed = checkinDates.has(dateStr)
              const isToday = dateStr === today
              const isFuture = dateStr > today
              const status = completed ? 'practiced' : isFuture ? 'upcoming' : isToday ? 'today' : 'missed'
              const dayLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <div
                  key={i}
                  title={`Day ${i + 1} · ${dayLabel} · ${status}`}
                  className={`aspect-square rounded-sm ${
                    completed
                      ? 'bg-burgundy border border-burgundy'
                      : isToday
                      ? 'bg-cream border-2 border-burgundy'
                      : isFuture
                      ? 'bg-transparent border border-ink-faint/40'
                      : 'bg-cream border border-rule'
                  }`}
                />
              )
            })}
          </div>
          <div className="flex justify-between font-mono text-[8px] uppercase tracking-[1px] text-ink-muted mt-0.5">
            <span>Day 1</span>
            <span>10</span>
            <span>20</span>
            <span>30</span>
            <span>Day 40</span>
          </div>
        </div>
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="flex flex-col items-end leading-none">
            <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Streak</div>
            <div className="font-serif text-[24px] lg:text-[28px] font-semibold text-burgundy leading-none mt-0.5">
              {streak}<span className="font-serif text-[10px] text-ink-muted ml-1">d</span>
            </div>
          </div>
          <div className="flex flex-col items-end leading-none">
            <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Since start</div>
            <div className="font-serif text-[14px] font-semibold text-ink leading-none mt-0.5">
              {daysSincePractice}<span className="font-serif text-[9px] text-ink-muted ml-1">d</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tantra"
              title="Daily Practice — Sight"
              className="p-1.5 hover:opacity-75 transition-opacity"
            >
              <EyeIcon />
            </Link>
            <Link
              href="/tech"
              title="Tech & Systems"
              className="p-1.5 hover:opacity-75 transition-opacity"
            >
              <GearIcon />
            </Link>
            <Link
              href="/tantra/mastery"
              target="_blank"
              rel="noopener noreferrer"
              title="Progression & Mastery"
              className="p-1.5 hover:opacity-75 transition-opacity"
            >
              <PyramidIcon />
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <button
            onClick={handleToggleToday}
            disabled={submitting}
            className={`font-serif text-[10px] uppercase tracking-[0.5px] px-2.5 py-1 rounded-sm border transition-colors whitespace-nowrap ${
              checkedInToday
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-burgundy border-burgundy hover:bg-burgundy hover:text-paper'
            } disabled:opacity-50`}
          >
            {checkedInToday ? 'Done' : 'Today complete'}
          </button>
          <button
            onClick={() => setBackfillOpen((o) => !o)}
            className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted hover:text-burgundy transition-colors flex items-center gap-0.5 whitespace-nowrap"
          >
            <span>{backfillOpen ? '−' : '+'}</span>
            <span>Backfill</span>
          </button>
          {backfillOpen && (
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="date"
                value={backfillDate}
                onChange={(e) => setBackfillDate(e.target.value)}
                className="font-mono text-[9px] text-ink bg-cream border border-rule rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-burgundy"
              />
              <input
                type="time"
                value={backfillTime}
                onChange={(e) => setBackfillTime(e.target.value)}
                className="font-mono text-[9px] text-ink bg-cream border border-rule rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-burgundy w-[70px]"
              />
              <button
                onClick={handleBackfill}
                disabled={submitting || !backfillDate}
                className="font-serif text-[9px] uppercase tracking-[0.5px] px-1.5 py-0.5 border border-burgundy text-burgundy rounded-sm hover:bg-burgundy hover:text-paper disabled:opacity-40"
              >
                Record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTIONS — 4 cols, fill available space */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2 lg:mb-3 flex-1 min-h-0 overflow-hidden">
        {/* Five Hindrances */}
        <section className="bg-white border border-rule rounded-sm p-2 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-rule-light">
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"><HindrancesSigil /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy leading-tight">Five Hindrances</h3>
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Layer A · Universal</div>
            </div>
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden">
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
        <section className="bg-white border border-rule rounded-sm p-2 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-rule-light">
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"><DissolutionsSigil /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy leading-tight">Dissolutions</h3>
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Layer B · Personal</div>
            </div>
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden">
            {DISSOLUTIONS.map((line, i) => (
              <div key={i} className="border-l-2 border-burgundy/30 pl-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-[8px] text-burgundy font-semibold flex-shrink-0">0{i + 1}</span>
                  <span className="font-serif text-[10px] text-ink leading-snug">{line}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seven Factors */}
        <section className="bg-white border border-rule rounded-sm p-2 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-rule-light">
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"><FactorsSigil /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy leading-tight">Seven Factors</h3>
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Awakening · Foundation</div>
            </div>
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden">
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
        <section className="bg-white border border-rule rounded-sm p-2 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-rule-light">
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"><AspectsSigil /></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy leading-tight">Nine Aspects</h3>
              <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">Generation · 3 domains</div>
            </div>
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden">
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

      {/* COMMENTS */}
      <section className="mb-1.5">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Commentary
          </h2>
          <div className="font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted">
            {comments.length} {comments.length === 1 ? 'entry' : 'entries'} · informs V3
          </div>
        </div>
        <div className="bg-white border border-rule rounded-sm p-1.5 flex items-center gap-1 flex-nowrap">
          {(['other', 'dissolve', 'generate'] as TantraCommentKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setCommentKind(k)}
              className={`font-mono text-[8px] uppercase tracking-[1px] px-1.5 py-1 rounded-sm border flex-shrink-0 ${
                commentKind === k
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {k === 'other' ? 'Note' : k === 'dissolve' ? 'Diss' : 'Gen'}
            </button>
          ))}
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commentText.trim() && !submitting) {
                e.preventDefault()
                void handleAddComment()
              }
            }}
            placeholder="What arose today?"
            className="flex-1 min-w-0 font-serif text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !commentText.trim()}
            className="font-serif text-[9px] uppercase tracking-[0.5px] px-2 py-1 bg-burgundy text-paper rounded-sm disabled:opacity-40 flex-shrink-0"
          >
            Add
          </button>
          {comments.length > 0 && (
            <button
              onClick={() => setShowCommentHistory((o) => !o)}
              className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted hover:text-burgundy whitespace-nowrap flex-shrink-0"
            >
              {showCommentHistory ? 'Hide' : `View ${comments.length}`}
            </button>
          )}
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
      <section className="mb-1.5">
        <button
          onClick={() => setShowArchive((o) => !o)}
          className="w-full flex items-center justify-between bg-paper border border-rule-light rounded-sm px-2.5 py-1 hover:border-rule transition-colors"
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

      <div className="text-center">
        <div className="font-serif italic text-[10px] text-ink-muted leading-tight">
          what compounds, endures · <span className="font-mono not-italic uppercase tracking-[1px] text-ink-faint">Generative Intelligence, LLC</span>
        </div>
      </div>
    </div>
  )
}
