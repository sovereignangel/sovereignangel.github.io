'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Tab = 'vision' | 'tech' | 'metrics'

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-burgundy">
      <path d="M12 5C7 5 2.73 8.11 1 12.46c1.73 4.35 6 7.54 11 7.54s9.27-3.19 11-7.54C21.27 8.11 17 5 12 5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-burgundy">
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

function PyramidIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-burgundy">
      <path d="M12 2L22 20H2L12 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="12" y1="2" x2="12" y2="20" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

// ── Palette (Armstrong brand) ────────────────────────────────────────────────
// cream      #f5f1ea  bg
// paper      #faf8f4  alt bg / cards
// ink        #2a2522  primary text
// ink-muted  #9a928a  secondary text
// ink-faint  #c8c0b8  tertiary
// rule       #d8d0c8  borders
// rule-light #e8e2da  subtle dividers
// burgundy   #7c2d2d  scholarly accent
// ─────────────────────────────────────────────────────────────────────────────

const fDisplay = 'font-[var(--font-display)]'   // Crimson Pro
const fBody    = 'font-[var(--font-display)]'   // body uses display for warmth
const fMono    = 'font-[var(--font-mono)]'      // IBM Plex Mono

// ── Vision diagram (animated, hero) ──────────────────────────────────────────
// Sources (left) → Alfred hub (center, breathing) → 3 platforms (right, stacked).
// Platform order top → bottom: Personal OS, Hedge Fund, Clients.

function ArchitectureFlow() {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 95)
    return () => clearInterval(id)
  }, [])

  const sources = [
    { x: -130, y: -30, label: 'meetings', sub: 'via Wave' },
    { x: -130, y: 28, label: 'ideas', sub: 'via Telegram' },
  ]
  // top → bottom: Personal OS, Hedge Fund, Clients
  const platforms = [
    { x: 105, y: -50, name: 'Personal OS', sub: 'Thesis Engine · wikis · journal · Lordas', emphasis: false },
    { x: 105, y: 0, name: 'Hedge Fund', sub: 'Arete Technologies · Armstrong', emphasis: true },
    { x: 105, y: 50, name: 'Clients', sub: 'Alamo Bernal · partnerships', emphasis: false },
  ]

  return (
    <svg viewBox="-170 -90 340 200" className="w-full max-w-[min(94vw,720px)] h-auto" aria-hidden>
      {/* IN THE WORLD label */}
      <text x="-130" y="-58" textAnchor="middle" fontSize="3.5" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">
        IN THE WORLD
      </text>

      {/* Sources */}
      {sources.map((s) => (
        <g key={s.label}>
          <circle cx={s.x} cy={s.y} r="2.6" fill="#2a2522" />
          <text x={s.x - 6} y={s.y + 1.5} textAnchor="end" fontSize="5.5" fontStyle="italic" fontFamily="serif" fill="#2a2522">
            {s.label}
          </text>
          <text x={s.x - 6} y={s.y + 8} textAnchor="end" fontSize="3.8" fontFamily="serif" fill="#9a928a">
            {s.sub}
          </text>
          <line x1={s.x + 3} y1={s.y} x2={-16} y2={0} stroke="#9a928a" strokeWidth="0.4" opacity="0.55" />
        </g>
      ))}

      {/* Alfred (center hub, breathing) */}
      {[0, 1, 2].map((i) => {
        const phase = (t / 14 + i * 0.7) % 4
        const r = 16 + phase * 14
        const op = Math.max(0, 0.22 - phase * 0.05)
        return <circle key={i} cx="0" cy="0" r={r} fill="none" stroke="#7c2d2d" strokeWidth="0.3" opacity={op} />
      })}
      <circle cx="0" cy="0" r="14" fill="#f5f1ea" stroke="#7c2d2d" strokeWidth="0.7" />
      <text x="0" y="2.2" textAnchor="middle" fontSize="6.5" fontStyle="italic" fontFamily="serif" fill="#7c2d2d">
        Alfred
      </text>
      <text x="0" y="22" textAnchor="middle" fontSize="3.5" letterSpacing="0.8" fontFamily="serif" fill="#9a928a">
        ONE THREAD · ONE TOKEN
      </text>

      {/* PLATFORMS label */}
      <text x="105" y="-72" textAnchor="middle" fontSize="3.5" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">
        PLATFORMS
      </text>

      {/* Platforms */}
      {platforms.map((p) => (
        <g key={p.name}>
          <line x1="16" y1="0" x2={p.x - 6} y2={p.y} stroke={p.emphasis ? '#7c2d2d' : '#9a928a'} strokeWidth={p.emphasis ? '0.6' : '0.4'} opacity={p.emphasis ? '0.85' : '0.55'} />
          <circle cx={p.x - 3} cy={p.y} r={p.emphasis ? '3.4' : '2.6'} fill="#7c2d2d" />
          <text x={p.x + 2} y={p.y + 0.5} fontSize={p.emphasis ? '6.5' : '5.5'} fontStyle="italic" fontFamily="serif" fontWeight={p.emphasis ? '600' : '400'} fill="#2a2522">
            {p.name}
          </text>
          <text x={p.x + 2} y={p.y + 7} fontSize="3.8" fontFamily="serif" fill="#9a928a">
            {p.sub}
          </text>
        </g>
      ))}

      {/* Inbound dots: sources → Alfred */}
      {sources.map((s, i) =>
        [0, 1].map((k) => {
          const offset = (t + i * 25 + k * 50) % 100
          const p = offset / 100
          const cx = s.x + (-s.x - 14) * p
          const cy = s.y + (-s.y) * p
          return (
            <circle key={`in-${i}-${k}`} cx={cx} cy={cy} r="0.7" fill="#7c2d2d" opacity={p > 0.08 && p < 0.92 ? 0.7 : 0} />
          )
        }),
      )}

      {/* Outbound dots: Alfred → platforms */}
      {platforms.map((pl, i) =>
        [0, 1].map((k) => {
          const offset = (t + i * 25 + k * 50 + 50) % 100
          const p = offset / 100
          const cx = 14 + (pl.x - 14 - 6) * p
          const cy = pl.y * p
          return (
            <circle key={`out-${i}-${k}`} cx={cx} cy={cy} r="0.7" fill="#7c2d2d" opacity={p > 0.08 && p < 0.92 ? 0.7 : 0} />
          )
        }),
      )}

      <line x1="-160" y1="82" x2="160" y2="82" stroke="#d8d0c8" strokeWidth="0.4" />
      <text x="0" y="93" textAnchor="middle" fontSize="3.8" fontStyle="italic" fontFamily="serif" fill="#9a928a">
        an artist and a capitalist · una vita in molte stanze
      </text>
    </svg>
  )
}

// ── Tech diagram (the control loop, used on Tech tab) ────────────────────────
// Loop-engineering view: five sensor streams → a summing junction (error vs.
// setpoint) → Alfred the controller + wikis as state estimate → actuators →
// the world, re-measured every loop. The feedback path along the bottom is
// what closes it. Same components as the old pipeline, drawn as a control system.

function TechDiagram() {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 95)
    return () => clearInterval(id)
  }, [])

  // Five sensor streams, inner (fast) to outer (slow). Energy gates all loops;
  // markets is the disturbance input — exogenous, only to be rejected or exploited.
  const sensors = [
    { label: 'energy',       sense: 'the gate',      clock: 'min–hr'     },
    { label: 'transactions', sense: 'allocation',    clock: 'daily'      },
    { label: 'transcripts',  sense: 'relationships', clock: 'daily'      },
    { label: 'ideas',        sense: 'optionality',   clock: 'weekly'     },
    { label: 'markets',      sense: 'disturbance',   clock: 'continuous' },
  ]
  const sensorY = (i: number) => -62 + i * 31   // centers: -62,-31,0,31,62
  const jx = -96, jy = 0                          // summing junction

  const actuators = [
    'drafts — memos & replies',
    'alerts — a drawdown is hit',
    'nudges — allocation has drifted',
    'holds — calendar & focus blocks',
  ]

  return (
    <svg viewBox="-200 -120 400 240" preserveAspectRatio="xMidYMid meet" className="w-full h-full max-w-[900px] max-h-full" aria-hidden>
      {/* === HARNESS · outer container wrapping the whole loop === */}
      <rect x="-194" y="-114" width="388" height="228" fill="#7c2d2d" fillOpacity="0.025" stroke="#7c2d2d" strokeWidth="0.45" strokeDasharray="3 1.8" />
      <rect x="-194" y="-114" width="92" height="11" fill="#f5f1ea" stroke="none" />
      <text x="-188" y="-106" fontSize="4.2" letterSpacing="1.2" fontFamily="serif" fontWeight="600" fill="#7c2d2d">HARNESS · ALFRED</text>
      <text x="188" y="-106" textAnchor="end" fontSize="3.2" fontStyle="italic" fontFamily="serif" fill="#9a928a">
        one controller · senses the world · writes back · closes every loop
      </text>

      {/* === SETPOINTS · the reference signal, from “what I count” === */}
      <text x="-190" y="-90" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">SETPOINTS</text>
      <rect x="-140" y="-95" width="300" height="12" fill="#7c2d2d" fillOpacity="0.05" stroke="#7c2d2d" strokeWidth="0.4" strokeOpacity="0.55" />
      <text x="10" y="-88.6" textAnchor="middle" fontSize="3.5" fontStyle="italic" fontFamily="serif" fill="#2a2522">
        ≥2 deep convos / wk · 1 thing shipped / wk · NAV CAGR · regulated nervous system
      </text>
      {/* setpoint drops into the summing junction from above */}
      <line x1={jx} y1={-83} x2={jx} y2={jy - 6} stroke="#9a928a" strokeWidth="0.4" opacity="0.6" />
      <text x={jx - 4} y={-40} textAnchor="end" fontSize="2.8" fontStyle="italic" fontFamily="serif" fill="#9a928a">the goal</text>

      {/* === SENSORS · the five input streams === */}
      <text x="-190" y="-72" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">SENSORS <tspan fontWeight="400" fill="#9a928a">· 5 streams</tspan></text>
      {sensors.map((s, i) => {
        const y = sensorY(i)
        const gate = s.label === 'energy'
        return (
          <g key={s.label}>
            <rect x="-192" y={y - 8} width="66" height="16" fill="#faf8f4" stroke="#2a2522" strokeWidth="0.4" strokeOpacity={gate ? '0.9' : '0.6'} />
            <text x="-188" y={y - 1.5} fontSize="4.6" fontStyle="italic" fontFamily="serif" fill="#2a2522">{s.label}</text>
            <text x="-188" y={y + 4.5} fontSize="3" fontFamily="serif" fill="#9a928a">{s.sense} · {s.clock}</text>
            {/* converge into the summing junction */}
            <line x1="-126" y1={y} x2={jx - 5} y2={jy} stroke={gate ? '#7c2d2d' : '#9a928a'} strokeWidth={gate ? '0.5' : '0.4'} opacity={gate ? '0.65' : '0.5'} />
          </g>
        )
      })}

      {/* === SUMMING JUNCTION · error = setpoint − state === */}
      <circle cx={jx} cy={jy} r="5" fill="#f5f1ea" stroke="#7c2d2d" strokeWidth="0.6" />
      <line x1={jx - 3} y1={jy} x2={jx + 3} y2={jy} stroke="#7c2d2d" strokeWidth="0.5" />
      <line x1={jx} y1={jy - 3} x2={jx} y2={jy + 3} stroke="#7c2d2d" strokeWidth="0.5" />
      <text x={jx} y={jy + 11} textAnchor="middle" fontSize="2.9" fontStyle="italic" fontFamily="serif" fill="#9a928a">error</text>
      {/* junction → controller */}
      <line x1={jx + 5} y1="0" x2="-24" y2="0" stroke="#7c2d2d" strokeWidth="0.5" opacity="0.7" />

      {/* === ALFRED · the controller (breathing) === */}
      {[0, 1, 2].map((i) => {
        const phase = (t / 14 + i * 0.7) % 4
        const r = 16 + phase * 14
        const op = Math.max(0, 0.2 - phase * 0.045)
        return <circle key={i} cx="-5" cy="0" r={r} fill="none" stroke="#7c2d2d" strokeWidth="0.3" opacity={op} />
      })}
      <circle cx="-5" cy="0" r="15" fill="#f5f1ea" stroke="#7c2d2d" strokeWidth="0.7" />
      <text x="-5" y="-1.5" textAnchor="middle" fontSize="6" fontStyle="italic" fontFamily="serif" fontWeight="600" fill="#7c2d2d">Alfred</text>
      <text x="-5" y="4.5" textAnchor="middle" fontSize="2.9" fontFamily="serif" fill="#9a928a">controller</text>

      {/* === WIKIS · the self-updating state estimate === */}
      <line x1="-5" y1="15" x2="-5" y2="26" stroke="#9a928a" strokeWidth="0.35" opacity="0.5" />
      <rect x="-56" y="26" width="102" height="15" fill="#7c2d2d" fillOpacity="0.04" stroke="#7c2d2d" strokeWidth="0.4" strokeOpacity="0.55" />
      <text x="-5" y="32" textAnchor="middle" fontSize="3.8" fontStyle="italic" fontFamily="serif" fontWeight="600" fill="#2a2522">wikis · state estimate</text>
      <text x="-5" y="37.5" textAnchor="middle" fontSize="2.9" fontFamily="serif" fill="#5c5550">self-updating · karpathy L2 · contact / ticker / project / topic</text>

      {/* controller → actuators */}
      <line x1="10" y1="0" x2="88" y2="0" stroke="#7c2d2d" strokeWidth="0.5" opacity="0.7" />

      {/* === ACTUATORS · what Alfred does === */}
      <text x="176" y="-30" textAnchor="end" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">ACTUATORS</text>
      {actuators.map((a, i) => {
        const y = -18 + i * 12
        return (
          <g key={a}>
            <rect x="90" y={y - 5} width="86" height="10" fill="#faf8f4" stroke="#7c2d2d" strokeWidth="0.4" strokeOpacity="0.55" />
            <text x="133" y={y + 1.6} textAnchor="middle" fontSize="3.4" fontStyle="italic" fontFamily="serif" fill="#2a2522">{a}</text>
          </g>
        )
      })}

      {/* === FEEDBACK · the return path that closes the loop === */}
      <path d="M 133 19 L 133 94 L -159 94 L -159 71" fill="none" stroke="#7c2d2d" strokeWidth="0.45" strokeDasharray="2 1.5" opacity="0.6" />
      <text x="-13" y="91" textAnchor="middle" fontSize="3.4" fontStyle="italic" fontFamily="serif" fill="#7c2d2d">
        the world, re-measured every loop
      </text>
      <text x="130" y="91" textAnchor="end" fontSize="2.9" fontFamily="serif" fill="#9a928a">drawdown triggers = when to act</text>

      {/* flowing dots — sensors → junction */}
      {sensors.map((s, i) => {
        const y = sensorY(i)
        const p = ((t + i * 20) % 100) / 100
        const cx = -126 + (jx - 5 - -126) * p
        const cy = y + (jy - y) * p
        return <circle key={`sen-${i}`} cx={cx} cy={cy} r="0.6" fill="#7c2d2d" opacity={p > 0.05 && p < 0.95 ? 0.55 : 0} />
      })}
      {/* flowing dots — junction → controller → actuators */}
      {[0, 1, 2].map((k) => {
        const p = ((t + k * 33) % 100) / 100
        const cx = -91 + (88 - -91) * p
        return <circle key={`fwd-${k}`} cx={cx} cy="0" r="0.7" fill="#7c2d2d" opacity={p > 0.05 && p < 0.95 ? 0.7 : 0} />
      })}
      {/* flowing dots — feedback path back to the sensors */}
      {[0, 1].map((k) => {
        const p = ((t + k * 50) % 100) / 100
        const cx = 133 + (-159 - 133) * p
        return <circle key={`fb-${k}`} cx={cx} cy="94" r="0.7" fill="#7c2d2d" opacity={p > 0.05 && p < 0.95 ? 0.55 : 0} />
      })}

      {/* tagline inside the harness wrapper */}
      <text x="0" y="107" textAnchor="middle" fontSize="3.3" fontStyle="italic" fontFamily="serif" fill="#9a928a">
        I set the setpoints and review the exceptions · the loops run themselves in between
      </text>
    </svg>
  )
}

// ── Section header ───────────────────────────────────────────────────────────

function Chapter({ label, title, italic }: { label: string; title: string; italic?: boolean }) {
  return (
    <div className="mb-3 sm:mb-5 shrink-0">
      <p className={`${fMono} text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase text-[#7c2d2d] mb-1.5`}>
        {label}
      </p>
      <h2 className={`${fDisplay} ${italic ? 'italic font-medium' : 'font-semibold'} text-[24px] sm:text-[34px] md:text-[40px] leading-[1.05] tracking-[-0.6px] text-[#2a2522]`}>
        {title}
      </h2>
    </div>
  )
}

// ── Triadic crest — Medici / Leonardo / Mozart ───────────────────────────────
// One glyph per archetype, side-by-side. Burgundy + ink on cream. The page's
// chapter ornament; sits between the title and the description.

function TriadCrest() {
  return (
    <div className="flex flex-col items-center gap-2.5 sm:gap-3">
      <div className="flex items-center justify-center gap-8 sm:gap-16">
        {/* Leonardo · sight — Vitruvian geometry */}
        <svg viewBox="-30 -30 60 60" width="56" height="56" aria-hidden>
          <rect x="-22" y="-22" width="44" height="44" fill="none" stroke="#2a2522" strokeWidth="0.9" />
          <circle cx="0" cy="0" r="22" fill="none" stroke="#7c2d2d" strokeWidth="0.9" />
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#9a928a" strokeWidth="0.25" />
          <line x1="0" y1="-22" x2="0" y2="22" stroke="#9a928a" strokeWidth="0.25" />
          <circle cx="0" cy="0" r="1" fill="#2a2522" />
        </svg>

        {/* Medici · discipline — the six palle, 3-2-1 Florentine */}
        <svg viewBox="-30 -30 60 60" width="56" height="56" aria-hidden>
          <circle cx="-14" cy="-14" r="4.2" fill="#7c2d2d" />
          <circle cx="0" cy="-16" r="4.8" fill="#7c2d2d" stroke="#7c2d2d" strokeWidth="0.4" />
          <circle cx="14" cy="-14" r="4.2" fill="#7c2d2d" />
          <circle cx="-9" cy="-1" r="4.2" fill="#7c2d2d" />
          <circle cx="9" cy="-1" r="4.2" fill="#7c2d2d" />
          <circle cx="0" cy="12" r="4.2" fill="#7c2d2d" />
        </svg>

        {/* Mozart · play — staff, clef, ascending notes */}
        <svg viewBox="-30 -30 60 60" width="56" height="56" aria-hidden>
          {[-12, -6, 0, 6, 12].map((y) => (
            <line key={y} x1="-22" y1={y} x2="22" y2={y} stroke="#2a2522" strokeWidth="0.5" />
          ))}
          <path
            d="M -16 -12 Q -12 -18 -10 -10 Q -8 -2 -12 2 Q -16 6 -14 12 L -14 18"
            fill="none" stroke="#7c2d2d" strokeWidth="1.1" strokeLinecap="round"
          />
          <ellipse cx="-2" cy="6" rx="2.4" ry="1.8" fill="#7c2d2d" transform="rotate(-18 -2 6)" />
          <line x1="0.2" y1="6" x2="0.2" y2="-8" stroke="#7c2d2d" strokeWidth="0.9" />
          <ellipse cx="7" cy="0" rx="2.4" ry="1.8" fill="#7c2d2d" transform="rotate(-18 7 0)" />
          <line x1="9.2" y1="0" x2="9.2" y2="-14" stroke="#7c2d2d" strokeWidth="0.9" />
          <ellipse cx="16" cy="-6" rx="2.4" ry="1.8" fill="#7c2d2d" transform="rotate(-18 16 -6)" />
          <line x1="18.2" y1="-6" x2="18.2" y2="-20" stroke="#7c2d2d" strokeWidth="0.9" />
        </svg>
      </div>
      <p className={`${fMono} text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-[#9a928a]`}>
        morning &middot; day &middot; evening
      </p>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function VisionTab() {
  // Chapter opening. Editorial restraint:
  //   chapter label (top) · hero title · ornamental crest · single Keynes anchor.
  // Architecture diagram lives only on the Tech tab — Vision is the manifesto, not the system.
  return (
    <div className="h-full flex flex-col px-5 sm:px-8 py-5 sm:py-8 max-w-4xl mx-auto w-full">
      <p className={`${fMono} text-[10px] sm:text-[11px] font-semibold tracking-[0.32em] uppercase text-[#7c2d2d] text-center shrink-0`}>
        i &middot; the vision
      </p>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-7 sm:gap-10 text-center">
        {/* Hero title — three-line stanza, all italic, one unified voice */}
        <h1 className={`${fDisplay} italic font-medium text-[28px] sm:text-[44px] md:text-[54px] leading-[1.12] tracking-[-0.6px] text-[#2a2522]`}>
          <span className="block">Leonardo sight.</span>
          <span className="block">Medici discipline.</span>
          <span className="block">Mozart play.</span>
        </h1>

        {/* Ornamental crest — three glyphs as pure heraldry, no labels */}
        <TriadCrest />

        {/* Hair-thin classical rule — the editorial pivot from heading to epigraph */}
        <div className="border-t border-[#7c2d2d]/35 w-10 sm:w-14" aria-hidden />

        {/* Keynes as the page's stillpoint */}
        <blockquote className={`${fDisplay} italic text-[15px] sm:text-[19px] leading-[1.6] text-[#2a2522]/90 max-w-xl`}>
          &ldquo;Our prime objects in life were love, the creation and enjoyment of aesthetic experience, and the pursuit of knowledge. <span className="text-[#7c2d2d] not-italic font-semibold">Of these, love came a long way first.</span>&rdquo;
          <footer className={`${fMono} not-italic text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-[#9a928a] mt-3 sm:mt-4`}>
            J.M. Keynes &middot; My Early Beliefs &middot; 1938
          </footer>
        </blockquote>
      </div>
    </div>
  )
}

function TechTab() {
  return (
    <div className="h-full flex flex-col px-4 sm:px-8 py-4 sm:py-6 max-w-6xl mx-auto w-full">
      <div className="shrink-0">
        <Chapter label="ii · the tech" title="Five sensors. One controller. Loops that close." />
        <p className={`${fBody} text-[12px] sm:text-[14px] leading-[1.5] text-[#2a2522]/85 max-w-3xl`}>
          Not a pipeline — a control system. Five input streams (energy, transactions, transcripts, ideas, markets) are <span className="italic">sensors</span>. Alfred is the <span className="italic">controller</span>; the wikis are its self-updating <span className="italic">state estimate</span>. It measures each stream against a setpoint — the things I count — and <span className="italic">actuates</span>: drafts, alerts, nudges, holds. The world changes, gets re-measured, and the loop closes. <span className="italic text-[#7c2d2d]">No dashboard to stare at — a system that runs itself, with me on the setpoints and the exceptions.</span>
        </p>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center my-1 sm:my-2">
        <TechDiagram />
      </div>
    </div>
  )
}

function MetricsTab() {
  // 3 INPUTS Lori cultivates weekly compound into 2 OUTPUTS measured quarterly.
  // "I'm an Artist and a Capitalist." Body & mind are foundations (footer line).
  const inputs = [
    {
      name: 'Relationships',
      frame: 'the asset class',
      compound: 'depth × duration × density',
      lead: '≥ 2 deep convos / wk',
      draw: '14d w/o seeing the closest five',
    },
    {
      name: 'Aesthetic',
      frame: 'the signature · the artist',
      compound: 'taste × consistency × distinctness',
      lead: 'pieces curated > pieces consumed',
      draw: 'output starts pleasing, not signaturing',
    },
    {
      name: 'Knowledge',
      frame: 'the intellectual capital',
      compound: 'wikis × retrieval × half-life',
      lead: 'notes / wk · conversations indexed',
      draw: 'wiki unused 12 mo → refresh',
    },
  ]
  const outputs = [
    {
      name: 'Creation',
      frame: 'what reaches the world',
      compound: 'things shipped × originality × reach',
      lead: '1 thing shipped / wk · artifact · talk · gathering',
      draw: '14d w/o shipping anything',
    },
    {
      name: 'Net worth',
      frame: 'the balance sheet · the capitalist',
      compound: 'NAV CAGR · dividend yield · optionality',
      lead: 'savings rate · allocation discipline',
      draw: 'Sharpe (return / stress) declining',
    },
  ]

  const Card = ({ k }: { k: { name: string; frame: string; compound: string; lead: string; draw: string } }) => (
    <div className="border border-[#d8d0c8] bg-[#faf8f4] p-1.5 sm:p-3 flex flex-col min-w-0">
      <span className={`${fDisplay} font-semibold text-[13px] sm:text-[19px] text-[#2a2522] leading-tight`}>{k.name}</span>
      <p className={`${fDisplay} italic text-[10px] sm:text-[13px] text-[#7c2d2d] leading-tight mt-0.5 sm:mt-1`}>{k.frame}</p>
      <div className="mt-1 sm:mt-1.5 space-y-0.5 sm:space-y-1 flex-1">
        <div>
          <p className={`${fMono} text-[8px] sm:text-[10px] uppercase tracking-[0.12em] text-[#9a928a] leading-tight`}>compound</p>
          <p className={`${fBody} text-[10px] sm:text-[12px] text-[#2a2522] leading-snug`}>{k.compound}</p>
        </div>
        <div>
          <p className={`${fMono} text-[8px] sm:text-[10px] uppercase tracking-[0.12em] text-[#9a928a] leading-tight`}>lead</p>
          <p className={`${fBody} text-[10px] sm:text-[12px] text-[#2a2522] leading-snug`}>{k.lead}</p>
        </div>
        <div>
          <p className={`${fMono} text-[8px] sm:text-[10px] uppercase tracking-[0.12em] text-[#9a928a] leading-tight`}>drawdown</p>
          <p className={`${fBody} text-[10px] sm:text-[12px] text-[#2a2522] leading-snug`}>{k.draw}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col px-3 sm:px-8 py-3 sm:py-6 max-w-5xl mx-auto w-full">
      <div className="shrink-0">
        <Chapter label="iii · what i count" title="Three things practiced. Two things compounded." italic />
        <p className={`${fBody} text-[11px] sm:text-[14px] leading-[1.45] text-[#2a2522]/85 max-w-2xl`}>
          Three things I cultivate. Two things they compound into. <span className="italic text-[#7c2d2d]">Each gets a compound metric, a leading indicator (cheap, weekly), and a drawdown trigger (when to act). Not a dashboard — a compass.</span>
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-3 min-h-0 mt-2 sm:mt-3">
        <div>
          <p className={`${fMono} text-[9px] sm:text-[11px] uppercase tracking-[0.18em] text-[#7c2d2d] font-semibold mb-1 sm:mb-1.5`}>Inputs &middot; cultivated weekly</p>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {inputs.map((k) => <Card key={k.name} k={k} />)}
          </div>
        </div>

        <div className={`${fMono} text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#7c2d2d] text-center`}>↓ compounds into ↓</div>

        <div>
          <p className={`${fMono} text-[9px] sm:text-[11px] uppercase tracking-[0.18em] text-[#7c2d2d] font-semibold mb-1 sm:mb-1.5`}>Outputs &middot; measured quarterly</p>
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            {outputs.map((k) => <Card key={k.name} k={k} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TechPage() {
  const [tab, setTab] = useState<Tab>('vision')

  return (
    <div className={`h-[100dvh] flex flex-col bg-[#f5f1ea] text-[#2a2522] overflow-hidden antialiased ${fBody}`}>
      <nav className="shrink-0 border-b border-[#d8d0c8]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-2.5 sm:py-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className={`${fDisplay} italic text-[18px] sm:text-[22px] text-[#2a2522] truncate`}>loricorpuz.com</span>
            <span className={`${fMono} text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-[#7c2d2d]`}>/tech</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`${fDisplay} italic text-[11px] sm:text-[13px] text-[#9a928a] hidden xs:inline`}>
              a notebook
            </span>
            <div className="flex items-center gap-1.5">
              <Link
                href="/tantra"
                title="Daily Practice — Sight"
                className="p-1 hover:opacity-75 transition-opacity"
              >
                <EyeIcon />
              </Link>
              <Link
                href="/tech"
                title="Tech & Systems"
                className="p-1 hover:opacity-75 transition-opacity"
              >
                <GearIcon />
              </Link>
              <Link
                href="/mastery"
                target="_blank"
                rel="noopener noreferrer"
                title="Progression & Mastery"
                className="p-1 hover:opacity-75 transition-opacity"
              >
                <PyramidIcon />
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#e8e2da]">
          <div className="max-w-5xl mx-auto flex justify-center sm:justify-start">
            {([
              ['vision', 'I · Vision'],
              ['tech', 'II · Tech'],
              ['metrics', 'III · What I count'],
            ] as Array<[Tab, string]>).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-none ${fMono} text-[10px] sm:text-[11px] tracking-[0.15em] uppercase px-3 sm:px-5 py-2.5 sm:py-3 border-b-2 transition-colors whitespace-nowrap ${
                  tab === id
                    ? 'text-[#7c2d2d] border-[#7c2d2d]'
                    : 'text-[#9a928a] border-transparent hover:text-[#2a2522]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        {tab === 'vision' && <VisionTab />}
        {tab === 'tech' && <TechTab />}
        {tab === 'metrics' && <MetricsTab />}
      </main>
    </div>
  )
}
