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
  TantraCycle,
} from '@/lib/types/tantra'
import { todayString } from '@/lib/date-utils'

const DEFAULT_ONELINER =
  'Builder-philosopher · Research engineer · Technical Principal — rigorous in mind, magnetic in body, present in every room'

const CYCLE_DAYS = 40

// Historical Day-1 dates for versions that predate the in-app version button.
// New versions get their start date the moment the "Begin" button is pressed.
const LEGACY_STARTS: Record<string, string> = {
  V1: '2026-04-21',
  V2: '2026-05-14',
}

// ─────────────────────────────────────────────────────────────────────────────
// Version content lives in code. The timeline of WHEN each version was begun
// lives in Firestore (TantraConfig.cycles). To ship a new version: add its
// content object to VERSIONS below — a "Begin" button then appears in the app,
// and pressing it starts a fresh cycle today while archiving the prior one.
// ─────────────────────────────────────────────────────────────────────────────

type Domain = 'INNER' | 'CREATION' | 'RELATING'
type PanelType = 'hindrances' | 'dissolutions' | 'factors' | 'linguistic' | 'aspects'

interface Aspect {
  n: number
  domain: Domain
  title: string
  line: string
}

interface Panel {
  type: PanelType
  title: string
  meta: string
}

interface Movement {
  name: string
  min: number
  signature?: boolean // the movement that defines this version
}

interface VersionContent {
  id: string
  label: string
  subtitle: string // 'Generation' | 'Recognition' — the mode of the version
  becomingLabel: string // prefix shown before the editable one-liner
  cycleLengthDays: number
  panels: Panel[]
  movements?: Movement[]
  hindrances?: { name: string; gloss: string }[]
  dissolutions?: string[]
  factors?: { name: string; gloss: string }[]
  linguistic?: string[]
  aspects?: Aspect[]
  aspectSuffix?: string // e.g. 'is here' — recognition framing (V3)
}

// ── Shared · Five Hindrances (Layer A, universal) ────────────────────────────
const HINDRANCES = [
  { name: 'Sensory desire', gloss: 'grasping for what is pleasant, chasing what tastes good' },
  { name: 'Ill-will', gloss: 'aversion to what is unpleasant, contraction against difficulty' },
  { name: 'Sloth and torpor', gloss: 'dullness, heaviness, the dimming of attention' },
  { name: 'Restlessness and worry', gloss: 'agitation, the mind racing forward and back' },
  { name: 'Doubt', gloss: 'second-guessing, the uncertainty that paralyzes' },
]

// ── Shared · Personal Patterns (Layer B, personal) ───────────────────────────
const PERSONAL_PATTERNS = [
  'The woman who lets the sting of rejection — from work, from men, from herself — pull her off her mission, her joy, her peace',
  'The woman who is still trying to be enough',
  'The woman who pushes away her anger as if it were unwomanly',
  'The woman who shrinks her needs to fit in the space she’s been given',
  'The woman who plays the supporting role in her own life',
  'The woman who waits — for a man unclear about her, for permission, for the right moment, for someone else’s yes',
  'The woman who says “just,” “maybe,” “kind of,” “I think”',
]

// ── V2 · Seven Factors of Awakening ──────────────────────────────────────────
const FACTORS = [
  { name: 'Mindfulness', gloss: 'I am clearly aware of this moment, as it is' },
  { name: 'Investigation', gloss: 'I look directly. I do not turn away from what is' },
  { name: 'Energy', gloss: 'vitality moves in me. I am engaged, present, alive' },
  { name: 'Joy', gloss: 'gladness arises naturally as grasping releases' },
  { name: 'Tranquility', gloss: 'my body settles. My breath deepens' },
  { name: 'Concentration', gloss: 'my mind is unified, gathered, here' },
  { name: 'Equanimity', gloss: 'my heart is steady. Neither grasping, nor pushing away' },
]

// ── V2 · Nine Aspects (Generation — "I am") ──────────────────────────────────
const V2_ASPECTS: Aspect[] = [
  { n: 1, domain: 'INNER', title: 'The Discerning One', line: 'My perception, intuition, and judgment are mine. I separate signal from noise — in markets, in people, in moments. I do not borrow other people’s seeing.' },
  { n: 2, domain: 'INNER', title: 'The Practitioner', line: 'I return to the reps without drama. My craft is my practice. Consistency is my signature. The compounding is mine.' },
  { n: 3, domain: 'INNER', title: 'The Attuned One', line: 'I am fully here, and I am aware — of the energy in me, in the room, the exchange. My presence is a gift, given with literacy and intent.' },
  { n: 4, domain: 'CREATION', title: 'The Principal', line: 'I own the fund. I own my judgment. I own the direction. Allocators do not evaluate me — they seek me.' },
  { n: 5, domain: 'CREATION', title: 'The Visionary', line: 'I see futures others cannot yet see, and I pull reality toward what I see — through conviction, through creation, through patient force.' },
  { n: 6, domain: 'CREATION', title: 'The Technologist', line: 'Phone, code, AI are limbs I have grown. My systems update themselves. Finance, AI, complexity — all flowing through me as one.' },
  { n: 7, domain: 'RELATING', title: 'The Loving One', line: 'My love is the ground beneath everything else. Without it, discernment becomes coldness. With it, all of me becomes trustworthy.' },
  { n: 8, domain: 'RELATING', title: 'The One With Gravitas', line: 'I do not push. I do not strain. I move effortlessly because I have nothing to prove. Rooms organize around me.' },
  { n: 9, domain: 'RELATING', title: 'The Influential One', line: 'Those who meet me are changed — because I am undeniably myself, and that gives them permission to be undeniably themselves.' },
]

// ── V3 · Linguistic Loosening (Layer C — the self is grammar) ─────────────────
const V3_LINGUISTIC = [
  'I notice I say “I am.”',
  'I notice I say “my fund.”',
  'I notice I say “my doubt.”',
  'Where is the “I” that owns these?',
  'I find no solid “I” anywhere. Only appearances.',
  'The self is a shadow cast by grammar.',
  'I rest where no shadow is being cast. Vast. Empty. Aware. Free.',
]

// ── V3 · Nine Qualities (Recognition — "is here", not installed) ──────────────
const V3_QUALITIES: Aspect[] = [
  { n: 1, domain: 'INNER', title: 'Discernment', line: 'Not something I am cultivating — something already present when the noise settles.' },
  { n: 2, domain: 'INNER', title: 'Practice', line: 'The willingness to return — not a discipline I impose, but a natural inclination of awareness toward its own clarity.' },
  { n: 3, domain: 'INNER', title: 'Attunement', line: 'Awareness of what is happening in me, in the room, in the exchange — the natural condition of being alive.' },
  { n: 4, domain: 'CREATION', title: 'Sovereign authority', line: 'Not a role I play, but the natural clarity of a mind that knows what is true for itself.' },
  { n: 5, domain: 'CREATION', title: 'Vision', line: 'The capacity to see what could be — already operating, whether I direct it or not.' },
  { n: 6, domain: 'CREATION', title: 'Integrated intelligence', line: 'The seamless flow between mind and tool — code, systems, ideas — as natural as breath.' },
  { n: 7, domain: 'RELATING', title: 'Love', line: 'Not something I generate — the ground beneath everything else, always available.' },
  { n: 8, domain: 'RELATING', title: 'Gravitas', line: 'Depth and weight — not performed, simply what is present when I stop pushing.' },
  { n: 9, domain: 'RELATING', title: 'Influence', line: 'The natural effect of an undivided presence on the field around it — not something I do, something that happens.' },
]

// ── V1 · archive content ─────────────────────────────────────────────────────
const V1_DISSOLVING = [
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

// ── Version registry — ordered oldest → newest ───────────────────────────────
const VERSIONS: VersionContent[] = [
  {
    id: 'V1',
    label: 'V1',
    subtitle: 'Generation',
    becomingLabel: 'Who I am becoming —',
    cycleLengthDays: CYCLE_DAYS,
    panels: [
      { type: 'dissolutions', title: 'Dissolving', meta: 'The old self' },
      { type: 'aspects', title: 'The Original Nine', meta: 'Generation · 3 domains' },
    ],
    dissolutions: V1_DISSOLVING,
    aspects: V1_GENERATING,
  },
  {
    id: 'V2',
    label: 'V2',
    subtitle: 'Generation',
    becomingLabel: 'Who I am becoming —',
    cycleLengthDays: CYCLE_DAYS,
    panels: [
      { type: 'hindrances', title: 'Five Hindrances', meta: 'Layer A · Universal' },
      { type: 'dissolutions', title: 'Dissolutions', meta: 'Layer B · Personal' },
      { type: 'factors', title: 'Seven Factors', meta: 'Awakening · Foundation' },
      { type: 'aspects', title: 'Nine Aspects', meta: 'Generation · 3 domains' },
    ],
    hindrances: HINDRANCES,
    dissolutions: PERSONAL_PATTERNS,
    factors: FACTORS,
    aspects: V2_ASPECTS,
  },
  {
    id: 'V3',
    label: 'V3',
    subtitle: 'Recognition',
    becomingLabel: 'What is already here —',
    cycleLengthDays: CYCLE_DAYS,
    panels: [
      { type: 'hindrances', title: 'Five Hindrances', meta: 'Layer A · Universal' },
      { type: 'dissolutions', title: 'Personal Patterns', meta: 'Layer B · Personal' },
      { type: 'linguistic', title: 'Linguistic Loosening', meta: 'Layer C · The self is grammar' },
      { type: 'aspects', title: 'Nine Qualities', meta: 'Recognition · already present' },
    ],
    movements: [
      { name: 'Arrival', min: 2 },
      { name: 'Dissolution', min: 5 },
      { name: 'Recognition', min: 4 },
      { name: 'Completion Rest', min: 3, signature: true },
      { name: 'Sealing', min: 1 },
    ],
    hindrances: HINDRANCES,
    dissolutions: PERSONAL_PATTERNS,
    linguistic: V3_LINGUISTIC,
    aspects: V3_QUALITIES,
    aspectSuffix: 'is here',
  },
]

const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

// ── Navigation icons ──────────────────────────────────────────────────────────
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

// ── Panel sigils ──────────────────────────────────────────────────────────────
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
function LinguisticSigil() {
  // Interwoven strokes coming loose — the grammar of self unravelling.
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-burgundy">
      <path d="M8 12 C16 12, 16 20, 8 20 C16 20, 16 28, 8 28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M20 10 C28 10, 28 18, 20 18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M22 24 C30 24, 30 32, 24 32" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
      <circle cx="32" cy="14" r="1.4" fill="currentColor" opacity="0.5" />
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

function panelSigil(type: PanelType) {
  switch (type) {
    case 'hindrances':
      return <HindrancesSigil />
    case 'dissolutions':
      return <DissolutionsSigil />
    case 'factors':
      return <FactorsSigil />
    case 'linguistic':
      return <LinguisticSigil />
    case 'aspects':
      return <AspectsSigil />
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function monthDay(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

function countCompleted(startDate: string, length: number, checkinDates: Set<string>): number {
  let done = 0
  for (let i = 0; i < length; i++) {
    if (checkinDates.has(addDays(startDate, i))) done += 1
  }
  return done
}

// ── Completion grid (used by active header + archive) ─────────────────────────
function CompletionGrid({
  startDate,
  length,
  checkinDates,
  today,
  axis,
}: {
  startDate: string
  length: number
  checkinDates: Set<string>
  today: string
  axis?: boolean
}) {
  const ticks = axis
    ? Array.from(new Set([1, Math.round(length / 4), Math.round(length / 2), Math.round((3 * length) / 4), length]))
    : []
  return (
    <div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${length}, minmax(0,1fr))` }}>
        {Array.from({ length }, (_, i) => {
          const dateStr = addDays(startDate, i)
          const completed = checkinDates.has(dateStr)
          const isToday = dateStr === today
          const isFuture = dateStr > today
          const status = completed ? 'practiced' : isFuture ? 'upcoming' : isToday ? 'today' : 'missed'
          return (
            <div
              key={i}
              title={`Day ${i + 1} · ${monthDay(dateStr)} · ${status}`}
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
      {axis && (
        <div className="flex justify-between font-mono text-[8px] uppercase tracking-[1px] text-ink-muted mt-0.5">
          {ticks.map((t, i) => (
            <span key={t}>{i === 0 ? `Day ${t}` : i === ticks.length - 1 ? `Day ${t}` : t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Panel body (shared by active board + archive) ─────────────────────────────
function PanelBody({ panel, version }: { panel: Panel; version: VersionContent }) {
  if (panel.type === 'hindrances' || panel.type === 'factors') {
    const items = panel.type === 'hindrances' ? version.hindrances : version.factors
    return (
      <>
        {(items || []).map((h, i) => (
          <div key={h.name} className="border-l-2 border-burgundy/30 pl-1.5">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[8px] text-burgundy font-semibold">0{i + 1}</span>
              <span className="font-serif text-[11px] font-semibold text-ink leading-tight">{h.name}</span>
            </div>
            <div className="font-serif text-[9px] text-ink-muted leading-snug">{h.gloss}</div>
          </div>
        ))}
      </>
    )
  }

  if (panel.type === 'dissolutions') {
    return (
      <>
        {(version.dissolutions || []).map((line, i) => (
          <div key={i} className="border-l-2 border-burgundy/30 pl-1.5">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[8px] text-burgundy font-semibold flex-shrink-0">0{i + 1}</span>
              <span className="font-serif text-[10px] text-ink leading-snug">{line}</span>
            </div>
          </div>
        ))}
      </>
    )
  }

  if (panel.type === 'linguistic') {
    return (
      <>
        {(version.linguistic || []).map((line, i) => (
          <div key={i} className="border-l-2 border-burgundy/30 pl-1.5">
            <span className="font-serif italic text-[10px] text-ink leading-snug">{line}</span>
          </div>
        ))}
      </>
    )
  }

  // aspects — grouped by domain
  return (
    <>
      {(['INNER', 'CREATION', 'RELATING'] as const).map((domain) => (
        <div key={domain}>
          <div className="font-mono text-[8px] uppercase tracking-[1.2px] text-burgundy mb-0.5">
            {domain === 'INNER' ? 'I · Inner' : domain === 'CREATION' ? 'II · Creation' : 'III · Relating'}
          </div>
          <div className="space-y-1">
            {(version.aspects || [])
              .filter((a) => a.domain === domain)
              .map((a) => (
                <div key={a.n} className="border-l-2 border-burgundy/30 pl-1.5 cursor-help" title={a.line}>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-[8px] text-burgundy font-semibold">0{a.n}</span>
                    <span className="font-serif text-[10px] font-semibold text-ink leading-tight">{a.title}</span>
                    {version.aspectSuffix && (
                      <span className="font-serif italic text-[9px] text-ink-muted">{version.aspectSuffix}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </>
  )
}

function PanelCard({ panel, version, fill }: { panel: Panel; version: VersionContent; fill?: boolean }) {
  return (
    <section className={`bg-white border border-rule rounded-sm p-2 flex flex-col ${fill ? 'min-h-0 overflow-hidden' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-rule-light">
        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">{panelSigil(panel.type)}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy leading-tight">{panel.title}</h3>
          <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted">{panel.meta}</div>
        </div>
      </div>
      <div className={`space-y-0.5 ${fill ? 'flex-1 overflow-hidden' : ''}`}>
        <PanelBody panel={panel} version={version} />
      </div>
    </section>
  )
}

function VersionBoard({ version, fill }: { version: VersionContent; fill?: boolean }) {
  return (
    <div
      className={`grid grid-cols-2 ${LG_COLS[version.panels.length] || 'lg:grid-cols-4'} gap-2 ${
        fill ? 'flex-1 min-h-0 overflow-hidden' : ''
      }`}
    >
      {version.panels.map((p) => (
        <PanelCard key={`${p.type}-${p.title}`} panel={p} version={version} fill={fill} />
      ))}
    </div>
  )
}

// ── Movements ribbon (the timed arc — V3's five movements) ────────────────────
function MovementsRibbon({ movements }: { movements: Movement[] }) {
  const total = movements.reduce((s, m) => s + m.min, 0)
  return (
    <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto whitespace-nowrap">
      <span className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted flex-shrink-0">{total}-min arc</span>
      {movements.map((m, i) => (
        <span key={m.name} className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-rule">·</span>
          <span className={`font-serif text-[10px] ${m.signature ? 'text-burgundy font-semibold' : 'text-ink'}`}>
            {m.name}
          </span>
          <span className="font-mono text-[8px] text-ink-muted">{m.min}m</span>
        </span>
      ))}
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
        cycles: [
          { versionId: 'V1', startDate: LEGACY_STARTS.V1, cycleLengthDays: CYCLE_DAYS },
          { versionId: 'V2', startDate: LEGACY_STARTS.V2, cycleLengthDays: CYCLE_DAYS },
        ],
      }
      await saveTantraConfig(user.uid, init)
      finalCfg = init
    } else if (!finalCfg.cycles || finalCfg.cycles.length === 0) {
      // Migrate legacy single-cycle config into the versioned timeline.
      const cycles: TantraCycle[] = [
        { versionId: 'V1', startDate: finalCfg.practiceStartDate || finalCfg.startDate || LEGACY_STARTS.V1, cycleLengthDays: CYCLE_DAYS },
        { versionId: 'V2', startDate: finalCfg.cycleStartDate || LEGACY_STARTS.V2, cycleLengthDays: finalCfg.cycleLengthDays || CYCLE_DAYS },
      ]
      await saveTantraConfig(user.uid, { cycles })
      finalCfg = { ...finalCfg, cycles }
    }

    const seedDate = LEGACY_STARTS.V1
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

  const cycles: TantraCycle[] = useMemo(() => config?.cycles || [], [config])
  const activeCycle = cycles[cycles.length - 1]
  const activeIdx = VERSIONS.findIndex((v) => v.id === activeCycle?.versionId)
  const activeVersion = (activeIdx >= 0 ? VERSIONS[activeIdx] : VERSIONS[VERSIONS.length - 1]) as VersionContent
  const nextVersion = activeIdx >= 0 ? VERSIONS[activeIdx + 1] : undefined

  const practiceStart = cycles[0]?.startDate || activeCycle?.startDate || LEGACY_STARTS.V1
  const cycleStart = activeCycle?.startDate || LEGACY_STARTS.V1
  const cycleLen = activeCycle?.cycleLengthDays || CYCLE_DAYS

  const daysIntoCycle = Math.max(0, Math.min(cycleLen, daysBetween(cycleStart, today) + 1))
  const daysSincePractice = Math.max(0, daysBetween(practiceStart, today) + 1)
  const cycleCompleted = countCompleted(cycleStart, cycleLen, checkinDates)

  // Archived versions (everything before the active cycle), newest first.
  const archived = useMemo(() => {
    return cycles
      .map((cycle, i) => {
        const next = cycles[i + 1]
        const version = VERSIONS.find((v) => v.id === cycle.versionId)
        const effectiveLen = next
          ? Math.min(cycle.cycleLengthDays, Math.max(0, daysBetween(cycle.startDate, next.startDate)))
          : cycle.cycleLengthDays
        return { cycle, version, effectiveLen, index: i }
      })
      .filter((c) => c.index < cycles.length - 1 && c.version)
      .reverse()
  }, [cycles])

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

  async function handleBeginNextVersion() {
    if (!user || !nextVersion || !activeVersion) return
    const ok = window.confirm(
      `Begin ${nextVersion.label} · ${nextVersion.subtitle}?\n\n` +
        `This starts a fresh ${nextVersion.cycleLengthDays}-day cycle today (Day 1). ` +
        `Your ${activeVersion.label} record — every day you did and didn’t sit — stays in the archive below.`
    )
    if (!ok) return
    setSubmitting(true)
    try {
      const newCycles: TantraCycle[] = [
        ...cycles,
        { versionId: nextVersion.id, startDate: today, cycleLengthDays: nextVersion.cycleLengthDays },
      ]
      await saveTantraConfig(user.uid, { cycles: newCycles })
      setConfig((c) => (c ? { ...c, cycles: newCycles } : c))
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
      {/* Header */}
      <div className="mb-1.5 pb-1.5 border-b border-rule-light">
        {/* Title row — title + version, icon nav on the same level */}
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="font-serif text-[20px] lg:text-[24px] font-semibold text-burgundy tracking-tight leading-none">
              Daily Tantra Meditation
            </h1>
            <span className="font-mono text-[9px] uppercase tracking-[1.5px] text-ink-muted flex-shrink-0">
              {activeVersion.label} · {activeVersion.subtitle}
            </span>
          </div>
          <nav className="flex items-center gap-1.5 flex-shrink-0">
            <Link href="/tantra" title="Daily Practice — Sight" className="p-1.5 hover:opacity-75 transition-opacity">
              <EyeIcon />
            </Link>
            <Link href="/tech" title="Tech & Systems" className="p-1.5 hover:opacity-75 transition-opacity">
              <GearIcon />
            </Link>
            <Link
              href="/mastery"
              target="_blank"
              rel="noopener noreferrer"
              title="Progression & Mastery"
              className="p-1.5 hover:opacity-75 transition-opacity"
            >
              <PyramidIcon />
            </Link>
          </nav>
        </div>

        {/* Body row — left: oneliner + progress · right: metrics + controls */}
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 sm:gap-5 items-start">
          <div className="min-w-0">
            {editingOneliner ? (
              <div className="flex flex-col gap-1">
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
                  {activeVersion.becomingLabel}
                </span>
                <span className="font-serif italic text-[11px] text-ink-muted group-hover:text-burgundy transition-colors">
                  {config?.oneliner}
                </span>
              </button>
            )}
            <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted flex justify-between items-baseline mb-1">
              <span>Day {daysIntoCycle} / {cycleLen}</span>
              <span className="text-burgundy">{cycleCompleted} this cycle · {totalCompleted} all-time</span>
            </div>
            <CompletionGrid startDate={cycleStart} length={cycleLen} checkinDates={checkinDates} today={today} axis />
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
              {nextVersion && (
                <button
                  onClick={handleBeginNextVersion}
                  disabled={submitting}
                  className="mt-1 font-serif text-[9px] uppercase tracking-[0.5px] px-2 py-0.5 border border-burgundy bg-burgundy-bg text-burgundy rounded-sm hover:bg-burgundy hover:text-paper transition-colors whitespace-nowrap disabled:opacity-40"
                  title={`Restart Day 1 on the ${nextVersion.label} regime`}
                >
                  Begin {nextVersion.label} · {nextVersion.subtitle} →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Movements arc (versions that define one — V3's timed sequence) */}
      {activeVersion.movements && <MovementsRibbon movements={activeVersion.movements} />}

      {/* Active version board */}
      <VersionBoard version={activeVersion} fill />

      {/* COMMENTS */}
      <section className="mb-1.5 mt-2 lg:mt-3">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Commentary
          </h2>
          <div className="font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted">
            {comments.length} {comments.length === 1 ? 'entry' : 'entries'} · informs {nextVersion?.label || 'the next cycle'}
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

      {/* ARCHIVE — every prior version, with grid + stats + content */}
      {archived.length > 0 && (
        <section className="mb-1.5">
          <button
            onClick={() => setShowArchive((o) => !o)}
            className="w-full flex items-center justify-between bg-paper border border-rule-light rounded-sm px-2.5 py-1 hover:border-rule transition-colors"
          >
            <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted">
              <span className="text-burgundy mr-1.5">{showArchive ? '−' : '+'}</span>
              Archive · {archived.length} completed {archived.length === 1 ? 'version' : 'versions'}
            </span>
            <span className="font-mono text-[8px] text-ink-faint">{showArchive ? 'Hide' : 'Show'}</span>
          </button>
          {showArchive && (
            <div className="mt-2 space-y-3 max-h-[60vh] overflow-y-auto">
              {archived.map(({ cycle, version, effectiveLen }) => {
                const done = countCompleted(cycle.startDate, effectiveLen, checkinDates)
                const endStr = addDays(cycle.startDate, Math.max(0, effectiveLen - 1))
                return (
                  <div key={cycle.startDate} className="bg-white border border-rule rounded-sm p-2.5">
                    <div className="flex items-baseline justify-between gap-2 mb-1.5 pb-1 border-b border-rule">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="font-serif text-[12px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                          {version!.label}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted">{version!.subtitle}</span>
                        <span className="font-mono text-[9px] text-ink-muted">
                          {monthDay(cycle.startDate)} – {monthDay(endStr)}
                        </span>
                      </div>
                      <span className="font-serif text-[11px] font-semibold text-burgundy flex-shrink-0">
                        {done} / {effectiveLen} practiced
                      </span>
                    </div>
                    <div className="mb-2">
                      <CompletionGrid startDate={cycle.startDate} length={effectiveLen} checkinDates={checkinDates} today={today} />
                    </div>
                    <VersionBoard version={version!} />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      <div className="text-center">
        <div className="font-serif italic text-[10px] text-ink-muted leading-tight">
          what compounds, endures · <span className="font-mono not-italic uppercase tracking-[1px] text-ink-faint">Generative Intelligence, LLC</span>
        </div>
      </div>
    </div>
  )
}
