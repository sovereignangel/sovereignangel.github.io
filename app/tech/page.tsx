'use client'

import { useEffect, useState } from 'react'

type Tab = 'vision' | 'alfred' | 'streams' | 'world' | 'metrics'

// ── Palette (Armstrong brand) ────────────────────────────────────────────────
// cream      #f5f1ea  bg
// paper      #faf8f4  alt bg / cards
// ink        #2a2522  primary text
// ink-muted  #9a928a  secondary text
// ink-faint  #c8c0b8  tertiary
// rule       #d8d0c8  borders
// rule-light #e8e2da  subtle dividers
// burgundy   #7c2d2d  scholarly accent
// burgundy-bg #7c2d2d10  burgundy at low opacity
// ─────────────────────────────────────────────────────────────────────────────

// font helpers
const fDisplay = 'font-[var(--font-display)]'
const fBody    = 'font-[var(--font-display)]' // body is also Crimson Pro for warmth; mono handles labels
const fMono    = 'font-[var(--font-mono)]'

// ── Diagrams ─────────────────────────────────────────────────────────────────

function RoomsWheel({ size = 280 }: { size?: number }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 90)
    return () => clearInterval(id)
  }, [])

  const rooms = [
    { angle: -90, label: 'salons' },
    { angle: -30, label: 'transcripts' },
    { angle: 30, label: 'lordas' },
    { angle: 90, label: 'the body' },
    { angle: 150, label: 'the work' },
    { angle: 210, label: 'adventures' },
  ]

  return (
    <svg viewBox="-110 -110 220 220" width={size} height={size} aria-hidden>
      <circle cx="0" cy="0" r="96" fill="none" stroke="#d8d0c8" strokeWidth="0.4" />
      <circle cx="0" cy="0" r="66" fill="none" stroke="#d8d0c8" strokeWidth="0.4" strokeDasharray="1 2.5" />

      {rooms.map((r) => {
        const x = Math.cos((r.angle * Math.PI) / 180) * 80
        const y = Math.sin((r.angle * Math.PI) / 180) * 80
        return (
          <line key={r.label + '-l'} x1="0" y1="0" x2={x * 0.85} y2={y * 0.85} stroke="#9a928a" strokeWidth="0.3" opacity="0.6" />
        )
      })}

      {[0, 1, 2].map((i) => {
        const phase = (t / 14 + i * 0.7) % 5
        const r = 12 + phase * 18
        const op = Math.max(0, 0.25 - phase * 0.05)
        return <circle key={'r' + i} cx="0" cy="0" r={r} fill="none" stroke="#7c2d2d" strokeWidth="0.35" opacity={op} />
      })}
      <circle cx="0" cy="0" r="9" fill="none" stroke="#7c2d2d" strokeWidth="0.7" />
      <text x="0" y="2" textAnchor="middle" fontSize="6" fontFamily="serif" fontStyle="italic" fill="#7c2d2d">
        Alfred
      </text>

      {rooms.map((r, i) =>
        [0, 1].map((k) => {
          const x = Math.cos((r.angle * Math.PI) / 180)
          const y = Math.sin((r.angle * Math.PI) / 180)
          const progress = ((t + i * 11 + k * 50) % 100) / 100
          const cx = x * progress * 80
          const cy = y * progress * 80
          return (
            <circle key={`d-${i}-${k}`} cx={cx} cy={cy} r="0.7" fill="#7c2d2d" opacity={progress > 0.1 && progress < 0.95 ? 0.8 : 0} />
          )
        }),
      )}

      {rooms.map((r) => {
        const cx = Math.cos((r.angle * Math.PI) / 180) * 82
        const cy = Math.sin((r.angle * Math.PI) / 180) * 82
        const lx = Math.cos((r.angle * Math.PI) / 180) * 100
        const ly = Math.sin((r.angle * Math.PI) / 180) * 100
        const cosA = Math.cos((r.angle * Math.PI) / 180)
        const anchor = cosA > 0.3 ? 'start' : cosA < -0.3 ? 'end' : 'middle'
        return (
          <g key={r.label}>
            <rect x={cx - 2.5} y={cy - 2.5} width="5" height="5" fill="#f5f1ea" stroke="#7c2d2d" strokeWidth="0.45" />
            <text x={lx} y={ly + 1.5} textAnchor={anchor} fontSize="4.5" fontFamily="serif" fontStyle="italic" fill="#2a2522">
              {r.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function RouterDiagram({ size = 260 }: { size?: number }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 90)
    return () => clearInterval(id)
  }, [])

  const inputs = [
    { x: -70, y: -50, label: 'Telegram' },
    { x: 0, y: -75, label: 'Wave AI' },
    { x: 70, y: -50, label: 'journal' },
  ]
  const outputs = [
    { x: -70, y: 50, label: 'Armstrong' },
    { x: 0, y: 75, label: 'Alamo Bernal' },
    { x: 70, y: 50, label: 'Thesis · Lordas' },
  ]

  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} aria-hidden>
      <circle cx="0" cy="0" r="14" fill="none" stroke="#7c2d2d" strokeWidth="0.6" />
      <text x="0" y="2" textAnchor="middle" fontSize="5.5" fontFamily="serif" fontStyle="italic" fill="#7c2d2d">
        Alfred
      </text>
      {[0, 1, 2].map((i) => {
        const phase = (t / 18 + i * 0.55) % 3
        const r = 17 + phase * 18
        const op = Math.max(0, 0.22 - phase * 0.06)
        return <circle key={'r' + i} cx="0" cy="0" r={r} fill="none" stroke="#7c2d2d" strokeWidth="0.3" opacity={op} />
      })}

      {inputs.map((n) => (
        <g key={n.label}>
          <line x1={n.x * 0.85} y1={n.y * 0.85} x2={n.x * 0.2} y2={n.y * 0.2} stroke="#9a928a" strokeWidth="0.35" opacity="0.5" />
          <circle cx={n.x} cy={n.y} r="2.2" fill="#7c2d2d" />
          <text x={n.x} y={n.y - 5} textAnchor="middle" fontSize="4.5" fontStyle="italic" fontFamily="serif" fill="#2a2522">
            {n.label}
          </text>
          {[0, 1, 2].map((i) => {
            const p = ((t + i * 35) % 100) / 100
            return <circle key={i} cx={n.x * (1 - p) * 0.85} cy={n.y * (1 - p) * 0.85} r="0.7" fill="#7c2d2d" opacity={p > 0.1 && p < 0.9 ? 0.7 : 0} />
          })}
        </g>
      ))}
      {outputs.map((n) => (
        <g key={n.label}>
          <line x1={n.x * 0.2} y1={n.y * 0.2} x2={n.x * 0.85} y2={n.y * 0.85} stroke="#9a928a" strokeWidth="0.35" opacity="0.5" />
          <circle cx={n.x} cy={n.y} r="2.2" fill="#2a2522" />
          <text x={n.x} y={n.y + 9} textAnchor="middle" fontSize="4.5" fontStyle="italic" fontFamily="serif" fill="#2a2522">
            {n.label}
          </text>
          {[0, 1, 2].map((i) => {
            const p = ((t + i * 35 + 50) % 100) / 100
            return <circle key={i} cx={n.x * p * 0.85} cy={n.y * p * 0.85} r="0.7" fill="#2a2522" opacity={p > 0.1 && p < 0.9 ? 0.7 : 0} />
          })}
        </g>
      ))}
    </svg>
  )
}

// ── Section header (compact, viewport-fit) ───────────────────────────────────

function Chapter({ label, title, italic }: { label: string; title: string; italic?: boolean }) {
  return (
    <div className="mb-3 sm:mb-5 shrink-0">
      <p className={`${fMono} text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#7c2d2d] mb-1.5`}>
        {label}
      </p>
      <h2 className={`${fDisplay} ${italic ? 'italic' : ''} text-[22px] sm:text-[32px] md:text-[38px] leading-[1.1] tracking-[-0.5px] text-[#2a2522]`}>
        {title}
      </h2>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function VisionTab() {
  return (
    <div className="h-full flex flex-col items-center justify-between px-5 sm:px-8 py-5 sm:py-7 max-w-3xl mx-auto w-full">
      <div className="w-full">
        <Chapter label="i · the vision" title="A life lived in many rooms at once." italic />
        <p className={`${fBody} text-[14px] sm:text-[16px] leading-[1.55] text-[#2a2522]/85 max-w-xl`}>
          Some days, founders in cafés. Some days, kiting in the Mistral. Some days, twenty pages of journal before anyone is awake. <span className="italic text-[#7c2d2d]">All of it routes through one chat.</span>
        </p>
      </div>

      <div className="flex items-center justify-center my-4 sm:my-6">
        <RoomsWheel size={240} />
      </div>

      <p className={`${fDisplay} italic text-[13px] sm:text-[15px] text-[#9a928a] text-center shrink-0`}>
        una vita in molte stanze · a renaissance practice, indexed
      </p>
    </div>
  )
}

function AlfredTab() {
  const phases = [
    { n: 'I', name: 'Outbound router', state: 'live' },
    { n: 'II.a', name: 'Inbound prefix · ask-buttons', state: 'live' },
    { n: 'II.b', name: 'Wave 7-tag fanout', state: 'live' },
    { n: 'III', name: 'Wikis (Karpathy L2)', state: 'reconciling' },
    { n: 'IV', name: 'Alfred harness', state: 'scaffolded' },
  ]
  const tone = (s: string) =>
    s === 'live' ? 'text-[#2d5f3f] border-[#2d5f3f]/40 bg-[#2d5f3f]/8' :
    s === 'reconciling' ? 'text-[#8a6d2f] border-[#8a6d2f]/40 bg-[#8a6d2f]/8' :
    'text-[#9a928a] border-[#d8d0c8] bg-[#faf8f4]'

  return (
    <div className="h-full flex flex-col px-5 sm:px-8 py-5 sm:py-7 max-w-3xl mx-auto w-full">
      <Chapter label="ii · the chat" title="One bot. One thread. Every input organized." />

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-6 items-center min-h-0">
        <div className="sm:col-span-2 flex items-center justify-center order-2 sm:order-1">
          <RouterDiagram size={220} />
        </div>
        <div className="sm:col-span-3 order-1 sm:order-2 flex flex-col gap-1.5 sm:gap-2 min-h-0">
          {phases.map((p) => (
            <div key={p.n} className="flex items-baseline justify-between gap-3 border-b border-[#e8e2da] pb-1.5">
              <div className="flex items-baseline gap-2.5 min-w-0">
                <span className={`${fMono} text-[10px] sm:text-[11px] text-[#7c2d2d] shrink-0 w-8`}>{p.n}</span>
                <span className={`${fDisplay} text-[15px] sm:text-[17px] text-[#2a2522] truncate`}>{p.name}</span>
              </div>
              <span className={`${fMono} text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 border ${tone(p.state)}`}>
                {p.state}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className={`${fDisplay} italic text-[12px] sm:text-[14px] text-[#9a928a] text-center mt-3 shrink-0`}>
        bot token rotates in one place, never seven
      </p>
    </div>
  )
}

function StreamsTab() {
  const streams = [
    { tag: 'Fundraising', sub: 'Armstrong', dest: 'DeepOps · meetings' },
    { tag: 'Research', sub: 'Armstrong', dest: 'DeepOps · meetings' },
    { tag: 'Management', sub: 'Armstrong', dest: 'DeepOps · meetings' },
    { tag: 'Investing', sub: 'Armstrong', dest: 'DeepOps · meetings' },
    { tag: 'Lordas', sub: 'with Aidas', dest: 'Website · relational' },
    { tag: 'Alamo Bernal', sub: 'partnership', dest: 'AB · ab_meetings' },
    { tag: 'Defer', sub: 'escape hatch', dest: '— (no destination)' },
  ]

  return (
    <div className="h-full flex flex-col px-5 sm:px-8 py-5 sm:py-7 max-w-3xl mx-auto w-full">
      <Chapter label="iii · seven streams" title="Seven destinations. One tap each." />

      <div className="flex-1 flex flex-col justify-center min-h-0 gap-1 sm:gap-1.5 overflow-hidden">
        {streams.map((s, i) => (
          <div key={s.tag} className="grid grid-cols-12 gap-3 items-baseline border-b border-[#e8e2da] pb-1.5 sm:pb-2">
            <span className={`${fMono} text-[10px] text-[#7c2d2d] col-span-1`}>{String(i + 1).padStart(2, '0')}</span>
            <div className="col-span-6 sm:col-span-5">
              <span className={`${fDisplay} text-[15px] sm:text-[19px] text-[#2a2522]`}>{s.tag}</span>
              <span className={`${fDisplay} italic text-[11px] sm:text-[13px] text-[#9a928a] ml-2`}>· {s.sub}</span>
            </div>
            <span className={`${fMono} text-[10px] sm:text-[11px] text-[#9a928a] col-span-5 sm:col-span-6 text-right truncate`}>{s.dest}</span>
          </div>
        ))}
      </div>

      <p className={`${fDisplay} italic text-[12px] sm:text-[14px] text-[#9a928a] text-center mt-3 shrink-0`}>
        every transcript caught · every one routed to the surface that needs it
      </p>
    </div>
  )
}

function WorldTab() {
  const adventures = [
    { name: 'Scavenger hunts', sub: 'Manhattan · recurring' },
    { name: 'Kite trips', sub: 'Mistral · seasonal' },
    { name: 'Investor caravans', sub: 'Aruba · custom' },
    { name: 'Salons', sub: 'with academics, founders, engineers' },
  ]
  const work = [
    { name: 'Talks', sub: 'conferences · podcasts · private rooms' },
    { name: 'Papers', sub: 'macro signals · capacity testing · complexity econ' },
    { name: 'Posts', sub: 'weekly · blog.loricorpuz.com' },
  ]

  return (
    <div className="h-full flex flex-col px-5 sm:px-8 py-5 sm:py-7 max-w-3xl mx-auto w-full">
      <Chapter label="iv · the world" title="Adventures. Salons. Work in public." />

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 min-h-0">
        <div className="flex flex-col min-h-0">
          <p className={`${fMono} text-[10px] tracking-[0.2em] uppercase text-[#7c2d2d] mb-2.5`}>Adventures I organize</p>
          <div className="space-y-2">
            {adventures.map((a) => (
              <div key={a.name} className="border-l-2 border-[#7c2d2d] pl-3 py-0.5">
                <p className={`${fDisplay} text-[16px] sm:text-[19px] text-[#2a2522] leading-tight`}>{a.name}</p>
                <p className={`${fMono} text-[10px] sm:text-[11px] text-[#9a928a]`}>{a.sub}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <p className={`${fMono} text-[10px] tracking-[0.2em] uppercase text-[#7c2d2d] mb-2.5`}>
            Work in public · <span className="text-[#9a928a] normal-case tracking-normal italic">aspirational</span>
          </p>
          <div className="space-y-2">
            {work.map((w) => (
              <div key={w.name} className="border-l border-dashed border-[#7c2d2d]/60 pl-3 py-0.5">
                <p className={`${fDisplay} text-[16px] sm:text-[19px] text-[#2a2522] leading-tight`}>{w.name}</p>
                <p className={`${fMono} text-[10px] sm:text-[11px] text-[#9a928a]`}>{w.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className={`${fDisplay} italic text-[12px] sm:text-[14px] text-[#9a928a] text-center mt-3 shrink-0`}>
        software is the substrate · the practice is in the world
      </p>
    </div>
  )
}

function MetricsTab() {
  // Hedge-fund-manager rigor: each KPI has a compound metric (what compounds),
  // a leading indicator (cheap to measure, weekly cadence), and a drawdown
  // trigger (the condition that demands action). Treat life as a portfolio.
  const kpis = [
    {
      name: 'Relationships',
      frame: 'the asset class',
      compound: 'depth × duration × density',
      lead: '≥ 2 deep convos / wk',
      draw: '14d w/o seeing the closest five',
    },
    {
      name: 'Experiences',
      frame: 'the income statement',
      compound: 'peaks × variety × novelty',
      lead: '1 first-time experience / mo',
      draw: '60d of pure routine',
    },
    {
      name: 'Body',
      frame: 'the maintenance margin',
      compound: 'VO₂max · sleep · HRV trajectory',
      lead: 'sleep 7h+ · training 4×/wk',
      draw: '3d nervous system spiked',
    },
    {
      name: 'Mind',
      frame: 'the cognitive engine',
      compound: 'insights × retained × applied',
      lead: 'morning pages · meditation streak',
      draw: '14d w/o a wiki write or journal',
    },
    {
      name: 'Aesthetic',
      frame: 'the signature',
      compound: 'taste × consistency × distinctness',
      lead: 'pieces curated > pieces consumed',
      draw: 'output starts pleasing not signaturing',
    },
    {
      name: 'Work',
      frame: 'the human capital',
      compound: 'skill depth × shipping rate × peer respect',
      lead: '20h+ deep work / wk',
      draw: '14d w/o shipping',
    },
    {
      name: 'Net worth',
      frame: 'the balance sheet',
      compound: 'NAV CAGR · dividend yield · optionality',
      lead: 'savings rate · allocation discipline',
      draw: 'Sharpe (return / stress) declining',
    },
    {
      name: 'Knowledge',
      frame: 'the intellectual capital',
      compound: 'wikis × retrieval × half-life',
      lead: 'notes / wk · conversations indexed',
      draw: 'wiki unused 12 mo → refresh or write-down',
    },
  ]

  return (
    <div className="h-full flex flex-col px-4 sm:px-8 py-4 sm:py-6 max-w-5xl mx-auto w-full">
      <div className="shrink-0">
        <Chapter label="v · what i count" title="A portfolio of compounding lives." />
        <p className={`${fBody} text-[12px] sm:text-[14px] leading-[1.5] text-[#2a2522]/80 max-w-2xl mb-2 sm:mb-3`}>
          Each category gets the discipline of a position: a compound metric (what compounds), a leading indicator (cheap, weekly), a drawdown trigger (when to act). <span className="italic text-[#7c2d2d]">Not a dashboard. A compass.</span>
        </p>
      </div>

      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 min-h-0">
        {kpis.map((k, i) => (
          <div
            key={k.name}
            className="border border-[#d8d0c8] bg-[#faf8f4] p-2 sm:p-3 flex flex-col"
          >
            <div className="flex items-baseline justify-between mb-1 sm:mb-1.5">
              <span className={`${fDisplay} text-[14px] sm:text-[17px] text-[#2a2522] leading-tight`}>{k.name}</span>
              <span className={`${fMono} text-[8px] sm:text-[9px] text-[#7c2d2d]`}>{String(i + 1).padStart(2, '0')}</span>
            </div>
            <p className={`${fDisplay} italic text-[10px] sm:text-[12px] text-[#7c2d2d] mb-1 sm:mb-1.5 leading-tight`}>
              {k.frame}
            </p>
            <div className="space-y-0.5 sm:space-y-1 flex-1">
              <div>
                <p className={`${fMono} text-[7px] sm:text-[8px] uppercase tracking-[0.1em] text-[#9a928a]`}>compound</p>
                <p className={`${fBody} text-[10px] sm:text-[11px] text-[#2a2522] leading-tight`}>{k.compound}</p>
              </div>
              <div>
                <p className={`${fMono} text-[7px] sm:text-[8px] uppercase tracking-[0.1em] text-[#9a928a]`}>lead</p>
                <p className={`${fBody} text-[10px] sm:text-[11px] text-[#2a2522] leading-tight`}>{k.lead}</p>
              </div>
              <div>
                <p className={`${fMono} text-[7px] sm:text-[8px] uppercase tracking-[0.1em] text-[#9a928a]`}>drawdown</p>
                <p className={`${fBody} text-[10px] sm:text-[11px] text-[#2a2522] leading-tight`}>{k.draw}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className={`${fDisplay} italic text-[11px] sm:text-[13px] text-[#9a928a] text-center mt-2 sm:mt-3 shrink-0`}>
        you can&apos;t optimize what you don&apos;t notice · you can&apos;t notice what you don&apos;t name
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
          <div className="max-w-5xl mx-auto flex overflow-x-auto no-scrollbar">
            {([
              ['vision', 'I · Vision'],
              ['alfred', 'II · Alfred'],
              ['streams', 'III · Streams'],
              ['world', 'IV · World'],
              ['metrics', 'V · What I count'],
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
        {tab === 'alfred' && <AlfredTab />}
        {tab === 'streams' && <StreamsTab />}
        {tab === 'world' && <WorldTab />}
        {tab === 'metrics' && <MetricsTab />}
      </main>
    </div>
  )
}
