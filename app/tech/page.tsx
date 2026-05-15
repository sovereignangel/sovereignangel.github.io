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
    <svg viewBox="-170 -110 340 220" className="w-full max-w-[min(94vw,720px)] h-auto" aria-hidden>
      {/* Compounding goals — north star */}
      <text x="0" y="-96" textAnchor="middle" fontSize="4" fontFamily="serif" letterSpacing="1.2" fill="#7c2d2d">
        ↑ COMPOUNDS INTO ↑
      </text>
      <text x="0" y="-86" textAnchor="middle" fontSize="6" fontStyle="italic" fontFamily="serif" fill="#2a2522">
        creation · net worth · relationships · aesthetic · knowledge
      </text>

      <line x1="-160" y1="-72" x2="160" y2="-72" stroke="#d8d0c8" strokeWidth="0.4" />

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
    <svg viewBox="-200 -150 400 300" className="w-full max-w-[min(96vw,860px)] h-auto" aria-hidden>
      {/* === Top: sources === */}
      <text x="-180" y="-138" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">SOURCES</text>
      {[
        { x: -150, y: -120, label: 'Telegram', sub: 'chat · voice · slash' },
        { x: -50, y: -120, label: 'Wave AI', sub: 'session.completed' },
        { x: 50, y: -120, label: 'journal · email', sub: 'passive ingest' },
      ].map((s) => (
        <g key={s.label}>
          <rect x={s.x - 26} y={s.y - 6} width="52" height="12" fill="#faf8f4" stroke="#2a2522" strokeWidth="0.4" />
          <text x={s.x} y={s.y - 1} textAnchor="middle" fontSize="4.5" fontFamily="serif" fontStyle="italic" fill="#2a2522">{s.label}</text>
          <text x={s.x} y={s.y + 4} textAnchor="middle" fontSize="3" fontFamily="serif" fill="#9a928a">{s.sub}</text>
          <line x1={s.x} y1={s.y + 6} x2={s.x * 0.45} y2={-80} stroke="#9a928a" strokeWidth="0.35" opacity="0.55" />
        </g>
      ))}

      {/* === Alfred router === */}
      <text x="-180" y="-78" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">L1 · ROUTER</text>
      <rect x="-95" y="-90" width="190" height="36" fill="#7c2d2d" fillOpacity="0.06" stroke="#7c2d2d" strokeWidth="0.6" />
      <text x="0" y="-78" textAnchor="middle" fontSize="6.5" fontStyle="italic" fontFamily="serif" fontWeight="600" fill="#7c2d2d">
        Alfred · Website /api/inbox
      </text>
      <text x="0" y="-71" textAnchor="middle" fontSize="3.8" fontFamily="serif" fill="#5c5550">
        prefix · ask-buttons · Wave 7-tag · dedupe · digest
      </text>
      <text x="0" y="-64" textAnchor="middle" fontSize="3.2" fontFamily="serif" fill="#9a928a" fontStyle="italic">
        one HMAC-auth&apos;d endpoint · one bot token, never seven
      </text>
      {/* breathing rings around the router */}
      {[0, 1, 2].map((i) => {
        const phase = (t / 14 + i * 0.7) % 4
        const r = 24 + phase * 22
        const op = Math.max(0, 0.18 - phase * 0.04)
        return <ellipse key={i} cx="0" cy="-72" rx={r * 2} ry={r * 0.7} fill="none" stroke="#7c2d2d" strokeWidth="0.25" opacity={op} />
      })}

      {/* === Project queues (3 columns) === */}
      <text x="-180" y="-38" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">L2 · QUEUES</text>
      {[
        {
          x: -110, label: 'Armstrong', emphasis: true,
          stack: ['DeepOps · Supabase', 'research_requests · meetings', 'fundraising · research', 'management · investing'],
        },
        {
          x: 0, label: 'Alamo Bernal',
          stack: ['AB · Supabase', 'ab_meetings · research_requests', 'screener · briefs', 'partnership work'],
        },
        {
          x: 110, label: 'Thesis · Lordas',
          stack: ['Website · Firestore', 'inbox_messages · relational', 'wikis · journal', 'the apps'],
        },
      ].map((p) => (
        <g key={p.label}>
          <line x1={0} y1={-54} x2={p.x} y2={-30} stroke={p.emphasis ? '#7c2d2d' : '#9a928a'} strokeWidth={p.emphasis ? '0.55' : '0.4'} opacity="0.6" />
          <rect x={p.x - 50} y={-30} width="100" height="62" fill="#faf8f4" stroke={p.emphasis ? '#7c2d2d' : '#7c2d2d'} strokeWidth={p.emphasis ? '0.8' : '0.5'} strokeOpacity={p.emphasis ? '1' : '0.55'} />
          <text x={p.x} y={-22} textAnchor="middle" fontSize="5.5" fontStyle="italic" fontFamily="serif" fontWeight={p.emphasis ? '600' : '500'} fill="#2a2522">{p.label}</text>
          {p.stack.map((line, j) => (
            <text key={j} x={p.x} y={-13 + j * 6.5} textAnchor="middle" fontSize="3" fontFamily="serif" fill="#5c5550">{line}</text>
          ))}
        </g>
      ))}

      {/* outbound dots from router to each queue */}
      {[-110, 0, 110].map((px, i) =>
        [0, 1].map((k) => {
          const offset = (t + i * 25 + k * 50 + 50) % 100
          const p = offset / 100
          const cx = px * p
          const cy = -54 + (24) * p
          return (
            <circle key={`dq-${i}-${k}`} cx={cx} cy={cy} r="0.7" fill="#7c2d2d" opacity={p > 0.08 && p < 0.92 ? 0.65 : 0} />
          )
        }),
      )}

      {/* === Wikis (Layer 3) === */}
      <text x="-180" y="50" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">L3 · WIKIS</text>
      <rect x="-130" y="42" width="260" height="22" fill="#8a6d2f" fillOpacity="0.06" stroke="#8a6d2f" strokeWidth="0.45" strokeOpacity="0.7" />
      <text x="0" y="52" textAnchor="middle" fontSize="5" fontStyle="italic" fontFamily="serif" fontWeight="600" fill="#2a2522">
        Karpathy Layer 2 — self-updating knowledge
      </text>
      <text x="0" y="59" textAnchor="middle" fontSize="3.5" fontFamily="serif" fill="#5c5550">
        contact / ticker / project / topic / meeting — wikis/{'{slug}'}
      </text>
      {/* upward arrows from queues into wikis */}
      {[-110, 0, 110].map((px) => (
        <line key={'wU' + px} x1={px} y1={32} x2={px * 0.6} y2={42} stroke="#9a928a" strokeWidth="0.35" opacity="0.5" />
      ))}

      {/* === Harness (Layer 4) === */}
      <text x="-180" y="84" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">L4 · HARNESS</text>
      <rect x="-150" y="74" width="300" height="28" fill="#faf8f4" stroke="#7c2d2d" strokeWidth="0.7" />
      <text x="0" y="84" textAnchor="middle" fontSize="6" fontStyle="italic" fontFamily="serif" fontWeight="600" fill="#7c2d2d">Alfred · the agent</text>
      <text x="0" y="91" textAnchor="middle" fontSize="3.8" fontFamily="serif" fill="#5c5550">
        Ollama (cheap) + Claude (premium) · launchd → Cloud Run
      </text>
      <text x="0" y="97" textAnchor="middle" fontSize="3.2" fontStyle="italic" fontFamily="serif" fill="#9a928a">
        reads queues · writes wikis · drafts memos · alerts Telegram
      </text>

      {/* === Seven tags fan, bottom === */}
      <text x="-180" y="120" fontSize="3.8" letterSpacing="0.8" fontFamily="serif" fill="#7c2d2d">7-TAG FANOUT · Wave session.completed</text>
      {['Fundraising', 'Research', 'Management', 'Investing', 'Alamo Bernal', 'Thesis Engine', 'Lordas'].map((tag, i) => {
        const x = -150 + i * 50
        return (
          <g key={tag}>
            <rect x={x - 23} y="128" width="46" height="9" fill="#faf8f4" stroke="#7c2d2d" strokeWidth="0.4" strokeOpacity="0.55" />
            <text x={x} y="134" textAnchor="middle" fontSize="3.5" fontFamily="serif" fontStyle="italic" fill="#2a2522">{tag}</text>
          </g>
        )
      })}
      <text x="170" y="146" textAnchor="end" fontSize="3" fontStyle="italic" fontFamily="serif" fill="#9a928a">+ defer (no destination)</text>
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

// ── Tabs ─────────────────────────────────────────────────────────────────────

function VisionTab() {
  return (
    <div className="h-full flex flex-col px-5 sm:px-8 py-4 sm:py-6 max-w-5xl mx-auto w-full">
      <div className="shrink-0">
        <Chapter label="i · the vision" title="An artist and a capitalist." italic />
        <p className={`${fBody} text-[13px] sm:text-[15px] leading-[1.55] text-[#2a2522]/85 max-w-2xl`}>
          A life lived in many rooms at once. Meetings get transcribed by Wave; ideas get texted to Alfred. Each one routes to the platform that needs it — Personal OS, the Hedge Fund, or the Clients. <span className="italic text-[#7c2d2d]">All of it compounds into the few things that matter.</span>
        </p>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center my-2 sm:my-3">
        <ArchitectureFlow />
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
        <Chapter label="iii · what i count" title="An artist and a capitalist." italic />
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

      <p className={`${fDisplay} italic text-[11px] sm:text-[13px] text-[#9a928a] text-center mt-2 sm:mt-3 shrink-0`}>
        foundations always on · body · mind · experiences
      </p>
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
