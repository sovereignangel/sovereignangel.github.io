'use client'

import { useEffect, useState } from 'react'

type Tab = 'vision' | 'tech' | 'metrics'

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

// ── Tech diagram (detailed, technical, used on Tech tab) ─────────────────────
// Same flow but with the full technical surface visible: router endpoints,
// project queues, wikis, harness, model routing.

function TechDiagram() {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 95)
    return () => clearInterval(id)
  }, [])

  return (
    <svg viewBox="-200 -120 400 240" preserveAspectRatio="xMidYMid meet" className="w-full h-full max-w-[900px] max-h-full" aria-hidden>
      {/* === HARNESS · outer container wrapping everything === */}
      <rect x="-194" y="-114" width="388" height="228" fill="#7c2d2d" fillOpacity="0.025" stroke="#7c2d2d" strokeWidth="0.45" strokeDasharray="3 1.8" />
      <rect x="-194" y="-114" width="92" height="11" fill="#f5f1ea" stroke="none" />
      <text x="-188" y="-106" fontSize="4.2" letterSpacing="1.2" fontFamily="serif" fontWeight="600" fill="#7c2d2d">HARNESS · ALFRED</text>
      <text x="188" y="-106" textAnchor="end" fontSize="3.2" fontStyle="italic" fontFamily="serif" fill="#9a928a">
        Ollama + Claude · reads platforms · writes wikis · drafts memos
      </text>

      {/* === SOURCES === */}
      <text x="-180" y="-90" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">SOURCES</text>
      {[
        { x: -70, y: -78, label: 'Telegram', sub: 'chat · voice · slash · journal' },
        { x: 70, y: -78, label: 'Wave AI', sub: 'session.completed' },
      ].map((s) => (
        <g key={s.label}>
          <rect x={s.x - 36} y={s.y - 6} width="72" height="12" fill="#faf8f4" stroke="#2a2522" strokeWidth="0.4" />
          <text x={s.x} y={s.y - 1} textAnchor="middle" fontSize="4.8" fontFamily="serif" fontStyle="italic" fill="#2a2522">{s.label}</text>
          <text x={s.x} y={s.y + 4} textAnchor="middle" fontSize="3" fontFamily="serif" fill="#9a928a">{s.sub}</text>
          <line x1={s.x} y1={s.y + 6} x2={s.x * 0.3} y2={-52} stroke="#9a928a" strokeWidth="0.35" opacity="0.55" />
        </g>
      ))}

      {/* === ROUTER === */}
      <text x="-180" y="-46" fontSize="3.8" letterSpacing="1.2" fontWeight="600" fontFamily="serif" fill="#7c2d2d">ROUTER</text>
      <rect x="-100" y="-56" width="200" height="22" fill="#7c2d2d" fillOpacity="0.06" stroke="#7c2d2d" strokeWidth="0.6" />
      <text x="0" y="-48" textAnchor="middle" fontSize="6" fontStyle="italic" fontFamily="serif" fontWeight="600" fill="#7c2d2d">
        Alfred · Website /api/inbox
      </text>
      <text x="0" y="-41" textAnchor="middle" fontSize="3.3" fontFamily="serif" fill="#5c5550">
        prefix · ask-buttons · dedupe · digest · HMAC auth · one bot token
      </text>
      {/* breathing rings around the router */}
      {[0, 1, 2].map((i) => {
        const phase = (t / 14 + i * 0.7) % 4
        const r = 20 + phase * 18
        const op = Math.max(0, 0.16 - phase * 0.04)
        return <ellipse key={i} cx="0" cy="-45" rx={r * 2.2} ry={r * 0.55} fill="none" stroke="#7c2d2d" strokeWidth="0.22" opacity={op} />
      })}

      {/* === Wave tags (between router and platforms) === */}
      <text x="-180" y="-22" fontSize="3.8" letterSpacing="1.2" fontWeight="600" fontFamily="serif" fill="#7c2d2d">WAVE TAGS <tspan fontWeight="400" letterSpacing="0.8" fill="#9a928a">· tap one of 7</tspan></text>
      {['Fundraising', 'Research', 'Management', 'Investing', 'Alamo Bernal', 'Thesis Engine', 'Lordas'].map((tag, i) => {
        const x = -150 + i * 50
        return (
          <g key={tag}>
            <rect x={x - 23} y="-16" width="46" height="9" fill="#faf8f4" stroke="#7c2d2d" strokeWidth="0.4" strokeOpacity="0.6" />
            <text x={x} y={-10} textAnchor="middle" fontSize="3.5" fontFamily="serif" fontStyle="italic" fill="#2a2522">{tag}</text>
          </g>
        )
      })}
      <text x="184" y="-1" textAnchor="end" fontSize="3" fontStyle="italic" fontFamily="serif" fill="#9a928a">+ defer (escape hatch)</text>
      {/* dots from router to the tag strip */}
      {[0, 1, 2].map((k) => {
        const offset = (t + k * 33) % 100
        const p = offset / 100
        const cy = -34 + 18 * p
        return <circle key={`r2t-${k}`} cx="0" cy={cy} r="0.7" fill="#7c2d2d" opacity={p > 0.08 && p < 0.92 ? 0.6 : 0} />
      })}

      {/* === PLATFORMS === */}
      <text x="-180" y="6" fontSize="3.8" letterSpacing="1.2" fontWeight="600" fontFamily="serif" fill="#7c2d2d">PLATFORMS</text>
      {[
        {
          x: -110, label: 'Armstrong', emphasis: true,
          stack: ['DeepOps · Supabase', 'research_requests · meetings', 'fundraise · research · mgmt · invest'],
        },
        {
          x: 0, label: 'Alamo Bernal',
          stack: ['AB · Supabase', 'ab_meetings · research_requests', 'partnership · screener · briefs'],
        },
        {
          x: 110, label: 'Thesis Engine',
          stack: ['Website · Firestore', 'wikis · journal · inbox_messages', 'Lordas · the apps · relational'],
        },
      ].map((p) => (
        <g key={p.label}>
          <line x1={0} y1={-2} x2={p.x} y2={12} stroke={p.emphasis ? '#7c2d2d' : '#9a928a'} strokeWidth={p.emphasis ? '0.55' : '0.4'} opacity="0.6" />
          <rect x={p.x - 50} y={12} width="100" height="36" fill="#faf8f4" stroke="#7c2d2d" strokeWidth={p.emphasis ? '0.8' : '0.5'} strokeOpacity={p.emphasis ? '1' : '0.55'} />
          <text x={p.x} y={20} textAnchor="middle" fontSize="5" fontStyle="italic" fontFamily="serif" fontWeight={p.emphasis ? '600' : '500'} fill="#2a2522">{p.label}</text>
          {p.stack.map((line, j) => (
            <text key={j} x={p.x} y={27 + j * 6} textAnchor="middle" fontSize="3" fontFamily="serif" fill="#5c5550">{line}</text>
          ))}
        </g>
      ))}

      {/* === WIKIS · karpathy layer 2 === */}
      <text x="-180" y="62" fontSize="3.8" letterSpacing="1.2" fontWeight="600" fontFamily="serif" fill="#7c2d2d">WIKIS <tspan fontWeight="400" letterSpacing="0.8" fill="#9a928a">· karpathy layer 2</tspan></text>
      <rect x="-130" y="56" width="260" height="20" fill="#7c2d2d" fillOpacity="0.04" stroke="#7c2d2d" strokeWidth="0.45" strokeOpacity="0.55" />
      <text x="0" y="65" textAnchor="middle" fontSize="5" fontStyle="italic" fontFamily="serif" fontWeight="600" fill="#2a2522">
        self-updating knowledge
      </text>
      <text x="0" y="72" textAnchor="middle" fontSize="3.4" fontFamily="serif" fill="#5c5550">
        contact / ticker / project / topic / meeting — wikis/{'{slug}'}
      </text>
      {/* upward arrows from queues into wikis */}
      {[-110, 0, 110].map((px) => (
        <line key={'wU' + px} x1={px} y1={48} x2={px * 0.6} y2={56} stroke="#9a928a" strokeWidth="0.35" opacity="0.5" />
      ))}

      {/* tagline beneath the wikis row, inside the harness wrapper */}
      <text x="0" y="92" textAnchor="middle" fontSize="3.3" fontStyle="italic" fontFamily="serif" fill="#9a928a">
        every loop closes back inside the agent · one thread, one token, one operator
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
        <Chapter label="ii · the tech" title="One bot. One thread. Five layers." />
        <p className={`${fBody} text-[12px] sm:text-[14px] leading-[1.5] text-[#2a2522]/85 max-w-3xl`}>
          Sources route through a single auth&apos;d HTTP endpoint into per-project queues. Queues feed wikis (Karpathy L2). Wikis feed the agent (Alfred, Phase 4) — which drafts memos, alerts, and updates back. <span className="italic text-[#7c2d2d]">No LLM auto-classification; every routing decision is explicit (slash prefix or 5/7-button keyboard).</span>
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
    <div className="border border-[#d8d0c8] bg-[#faf8f4] p-2.5 sm:p-3 flex flex-col">
      <div className="flex items-baseline justify-between mb-1">
        <span className={`${fDisplay} font-semibold text-[16px] sm:text-[19px] text-[#2a2522] leading-tight`}>{k.name}</span>
      </div>
      <p className={`${fDisplay} italic text-[11px] sm:text-[13px] text-[#7c2d2d] mb-1.5 leading-tight`}>{k.frame}</p>
      <div className="space-y-1 flex-1">
        <div>
          <p className={`${fMono} text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-[#9a928a]`}>compound</p>
          <p className={`${fBody} text-[11px] sm:text-[12px] text-[#2a2522] leading-snug`}>{k.compound}</p>
        </div>
        <div>
          <p className={`${fMono} text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-[#9a928a]`}>lead</p>
          <p className={`${fBody} text-[11px] sm:text-[12px] text-[#2a2522] leading-snug`}>{k.lead}</p>
        </div>
        <div>
          <p className={`${fMono} text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-[#9a928a]`}>drawdown</p>
          <p className={`${fBody} text-[11px] sm:text-[12px] text-[#2a2522] leading-snug`}>{k.draw}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col px-4 sm:px-8 py-4 sm:py-6 max-w-5xl mx-auto w-full">
      <div className="shrink-0">
        <Chapter label="iii · what i count" title="Three things practiced. Two things compounded." italic />
        <p className={`${fBody} text-[12px] sm:text-[14px] leading-[1.5] text-[#2a2522]/85 max-w-2xl`}>
          Three things I cultivate. Two things they compound into. <span className="italic text-[#7c2d2d]">Each gets a compound metric, a leading indicator (cheap, weekly), and a drawdown trigger (when to act). Not a dashboard — a compass.</span>
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-3 min-h-0 mt-2 sm:mt-3">
        <div>
          <p className={`${fMono} text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#7c2d2d] font-semibold mb-1.5`}>Inputs · cultivated weekly</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {inputs.map((k) => <Card key={k.name} k={k} />)}
          </div>
        </div>

        <div className={`${fMono} text-[11px] uppercase tracking-[0.25em] text-[#7c2d2d] text-center`}>↓ compounds into ↓</div>

        <div>
          <p className={`${fMono} text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#7c2d2d] font-semibold mb-1.5`}>Outputs · measured quarterly</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          <span className={`${fDisplay} italic text-[11px] sm:text-[13px] text-[#9a928a] hidden xs:inline`}>
            a notebook
          </span>
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
