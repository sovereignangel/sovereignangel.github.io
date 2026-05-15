'use client'

import { useEffect, useState } from 'react'

type Tab = 'vision' | 'alfred' | 'streams' | 'world' | 'metrics'

// ── Palette (Renaissance notebook) ───────────────────────────────────────────
// parchment    #f4ede0   — bg
// parchment-2  #ece3d2   — alt card bg
// ink          #2a1f15   — primary text
// ink-muted    #7a6a5a   — secondary text
// ink-faint    #b8a890   — tertiary / disabled
// rule         #3a2f24   — borders (use at low opacity)
// cobalt       #1c3a6e   — scholarly accent
// cobalt-soft  #4c6a9e   — softer cobalt
// ochre        #a87a30   — illuminated manuscript accent
// ochre-soft   #c89a50   — softer ochre
// oxblood      #6a1f1a   — sparing emphasis
// ─────────────────────────────────────────────────────────────────────────────

// ── Central diagram: the rooms wheel ────────────────────────────────────────

function RoomsWheel() {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 90)
    return () => clearInterval(id)
  }, [])

  // Six rooms around a central hub (Alfred / the chat)
  const rooms = [
    { angle: -90, label: 'salons' },
    { angle: -30, label: 'wave transcripts' },
    { angle: 30, label: 'lordas' },
    { angle: 90, label: 'the body' },
    { angle: 150, label: 'the work' },
    { angle: 210, label: 'the world' },
  ]

  return (
    <div className="relative w-full max-w-[min(94vw,520px)] mx-auto aspect-square">
      <svg viewBox="-110 -110 220 220" className="w-full h-full" aria-hidden>
        <defs>
          <radialGradient id="hub-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1c3a6e" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#1c3a6e" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#1c3a6e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer ruled circle */}
        <circle cx="0" cy="0" r="98" fill="none" stroke="#3a2f24" strokeWidth="0.3" opacity="0.25" />
        <circle cx="0" cy="0" r="68" fill="none" stroke="#3a2f24" strokeWidth="0.3" opacity="0.18" strokeDasharray="1 2" />

        {/* Connecting lines, hub → each room */}
        {rooms.map((r) => {
          const x = Math.cos((r.angle * Math.PI) / 180) * 80
          const y = Math.sin((r.angle * Math.PI) / 180) * 80
          return (
            <line
              key={r.label + '-line'}
              x1="0"
              y1="0"
              x2={x * 0.85}
              y2={y * 0.85}
              stroke="#3a2f24"
              strokeWidth="0.35"
              opacity="0.35"
            />
          )
        })}

        {/* Pulsing hub */}
        <circle cx="0" cy="0" r="40" fill="url(#hub-grad)" />
        {[0, 1, 2].map((i) => {
          const phase = (t / 14 + i * 0.7) % 5
          const r = 12 + phase * 16
          const op = Math.max(0, 0.25 - phase * 0.05)
          return (
            <circle key={'ring-' + i} cx="0" cy="0" r={r} fill="none" stroke="#1c3a6e" strokeWidth="0.35" opacity={op} />
          )
        })}
        <circle cx="0" cy="0" r="9" fill="none" stroke="#1c3a6e" strokeWidth="0.6" />
        <text
          x="0"
          y="2"
          textAnchor="middle"
          fontSize="6"
          fontFamily="serif"
          fontStyle="italic"
          fill="#1c3a6e"
        >
          Alfred
        </text>

        {/* Animated dots travelling outward from hub */}
        {rooms.map((r, i) => {
          const x = Math.cos((r.angle * Math.PI) / 180)
          const y = Math.sin((r.angle * Math.PI) / 180)
          return [0, 1].map((k) => {
            const offset = (t + i * 11 + k * 50) % 100
            const progress = offset / 100
            const cx = x * progress * 80
            const cy = y * progress * 80
            return (
              <circle
                key={`dot-${i}-${k}`}
                cx={cx}
                cy={cy}
                r="0.7"
                fill="#a87a30"
                opacity={progress > 0.1 && progress < 0.95 ? 0.7 : 0}
              />
            )
          })
        })}

        {/* Room nodes — small squares (da Vinci sketch energy) */}
        {rooms.map((r) => {
          const cx = Math.cos((r.angle * Math.PI) / 180) * 82
          const cy = Math.sin((r.angle * Math.PI) / 180) * 82
          // Label position pushed further out radially
          const lx = Math.cos((r.angle * Math.PI) / 180) * 100
          const ly = Math.sin((r.angle * Math.PI) / 180) * 100
          // Text-anchor by quadrant
          const anchor =
            Math.cos((r.angle * Math.PI) / 180) > 0.3
              ? 'start'
              : Math.cos((r.angle * Math.PI) / 180) < -0.3
              ? 'end'
              : 'middle'
          return (
            <g key={r.label}>
              <rect
                x={cx - 3}
                y={cy - 3}
                width="6"
                height="6"
                fill="#f4ede0"
                stroke="#1c3a6e"
                strokeWidth="0.5"
              />
              <text
                x={lx}
                y={ly + 1.5}
                textAnchor={anchor}
                fontSize="5"
                fontFamily="serif"
                fontStyle="italic"
                fill="#2a1f15"
              >
                {r.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Grain (subtle parchment texture) ─────────────────────────────────────────

function Grain() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.06] mix-blend-multiply">
      <svg width="100%" height="100%" aria-hidden>
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0 0.08  0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>
    </div>
  )
}

// ── Marginalia (small italic label in the gutter on desktop, inline on mobile) ─

function Marginalia({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-[var(--font-display)] italic text-[12px] sm:text-[13px] text-[#7a6a5a] mb-2 sm:mb-0 sm:absolute sm:-left-44 sm:top-1 sm:w-40 sm:text-right">
      {children}
    </p>
  )
}

// ── Section header (small caps marginalia + serif title) ─────────────────────

function SectionHeader({ chapter, title }: { chapter: string; title: string }) {
  return (
    <div className="mb-6 sm:mb-8">
      <p className="font-[var(--font-body)] italic text-[11px] tracking-[3px] uppercase text-[#a87a30] mb-3">
        {chapter}
      </p>
      <h2 className="font-[var(--font-display)] text-[clamp(32px,6vw,52px)] leading-[1.05] tracking-[-0.5px] text-[#2a1f15]">
        {title}
      </h2>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function VisionTab() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-10">
        <SectionHeader chapter="i · the vision" title="A life lived in many rooms at once." />
        <div className="space-y-5 max-w-2xl font-[var(--font-body)] text-[16px] sm:text-[18px] leading-[1.7] text-[#2a1f15]">
          <p>
            Some days, conversations with founders in dim cafés or academics in their offices. Some days, kiting in the Mistral or chasing a scavenger hunt across Manhattan with friends. Some days, writing a memo at a desk that doubles as a piano bench.
          </p>
          <p>
            Some days, twenty pages of journal before anyone else is awake.
          </p>
          <p className="italic text-[#7a6a5a]">
            All of it routes through one chat.
          </p>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <RoomsWheel />
          <p className="font-[var(--font-display)] italic text-center text-[14px] sm:text-[15px] text-[#7a6a5a] mt-6">
            The rooms of a renaissance practice — connected by a chat that quietly indexes everything.
          </p>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 max-w-3xl">
            {[
              { name: 'In the world', body: 'Salons. Conversations with academics, investors, founders, engineers, researchers. Each one recorded as a Wave transcript that lands in Telegram an hour later. None of it lost.' },
              { name: 'Alfred', body: 'A small bot named after a small idea — that if you organize your inputs carefully enough, you can spend the rest of your time on the inputs that matter.' },
              { name: 'Adventures', body: 'Scavenger hunts through Manhattan. Kite trips to the Mistral. Investor caravans through Aruba. I get to be the curator of the experience as much as the participant.' },
              { name: 'The work in public', body: 'Talks at conferences and salons (aspirational). Research papers. Blog posts. Every talk recorded, transcribed, stored in Thesis Engine for the future.' },
              { name: 'The body', body: 'Tantra. Meditation. Training. Sleep. Regulation. The morning twenty pages. The evening conversation.' },
              { name: 'What I count', body: 'Things created. New relationships. Opportunities authored. Insights captured. Net worth. The body. The mind. The relationship with Aidas.' },
            ].map((r) => (
              <div key={r.name}>
                <h3 className="font-[var(--font-display)] text-[22px] sm:text-[24px] text-[#2a1f15] mb-2">{r.name}</h3>
                <p className="font-[var(--font-body)] text-[15px] sm:text-[16px] leading-[1.65] text-[#7a6a5a]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function AlfredTab() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-10">
        <SectionHeader chapter="ii · the chat" title="One bot. One thread. Every input organized." />
        <div className="space-y-5 max-w-2xl font-[var(--font-body)] text-[16px] sm:text-[18px] leading-[1.7] text-[#2a1f15]">
          <p>
            Alfred is the front door. A single Telegram chat where I text thoughts, voice notes, transcripts, and requests — and where every project I&apos;m running sends its alerts back. Bot token lives in one place, rotates in one place, never seven.
          </p>
          <p>
            Outbound: any of my codebases can fire an alert through one HTTP endpoint with a shared secret. The router adds the project prefix and severity badge before the message lands on my phone.
          </p>
          <p>
            Inbound: a slash prefix dispatches directly. Free-form text gets a five-button keyboard — <em>Armstrong, Alamo Bernal, Thesis, Lordas, Cancel</em>. I never let a model guess my intent.
          </p>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <p className="font-[var(--font-body)] italic text-[12px] uppercase tracking-[3px] text-[#a87a30] mb-6">Outbound · alerts to my phone</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { tag: '[Armstrong]', who: 'DeepOps alerts', body: 'Alpha engine, JPM refresh, watchdogs, CI failures' },
              { tag: '[Alamo Bernal]', who: 'AB cron alerts', body: 'Screener failures, missing-data watchdog' },
              { tag: '[Thesis]', who: 'Website internal', body: 'Journal review, morning brief, build watchdog' },
              { tag: '[Lordas]', who: 'Relational events', body: 'Wave transcripts tagged, weekly themes' },
            ].map((s) => (
              <div key={s.tag} className="border border-[#3a2f24]/25 bg-[#ece3d2]/50 p-4 sm:p-5">
                <p className="font-[var(--font-display)] italic text-[16px] text-[#1c3a6e] mb-1">{s.tag}</p>
                <p className="font-[var(--font-display)] text-[18px] text-[#2a1f15] mb-2">{s.who}</p>
                <p className="font-[var(--font-body)] text-[14px] leading-[1.6] text-[#7a6a5a]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <p className="font-[var(--font-body)] italic text-[12px] uppercase tracking-[3px] text-[#a87a30] mb-6">Inbound · messages to projects</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
            <div>
              <h3 className="font-[var(--font-display)] text-[22px] text-[#2a1f15] mb-3">The fast path</h3>
              <p className="font-[var(--font-body)] text-[15px] leading-[1.65] text-[#7a6a5a] mb-4">
                A slash prefix sends the message directly to its project queue. No prompt.
              </p>
              <div className="space-y-2 font-mono text-[13px] text-[#2a1f15]">
                <p><span className="text-[#1c3a6e] font-semibold">/arm</span> <span className="text-[#7a6a5a]">&lt;text&gt; → Armstrong</span></p>
                <p><span className="text-[#1c3a6e] font-semibold">/ab</span> <span className="text-[#7a6a5a]">&lt;text&gt; → Alamo Bernal</span></p>
                <p><span className="text-[#1c3a6e] font-semibold">/thesis</span> <span className="text-[#7a6a5a]">&lt;text&gt; → Thesis Engine</span></p>
                <p><span className="text-[#1c3a6e] font-semibold">/lordas</span> <span className="text-[#7a6a5a]">&lt;text&gt; → Lordas</span></p>
              </div>
            </div>
            <div>
              <h3 className="font-[var(--font-display)] text-[22px] text-[#2a1f15] mb-3">Free-form</h3>
              <p className="font-[var(--font-body)] text-[15px] leading-[1.65] text-[#7a6a5a] mb-4">
                No slash? Alfred asks. Five buttons. I tap.
              </p>
              <div className="border border-[#3a2f24]/25 bg-[#ece3d2]/40 p-3">
                <p className="font-[var(--font-body)] text-[13px] italic text-[#2a1f15] mb-2">&ldquo;Need to follow up with Manhad about the recession blend...&rdquo;</p>
                <p className="font-[var(--font-body)] italic text-[12px] text-[#7a6a5a] mb-3">Route to which project?</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Armstrong', 'Alamo Bernal', 'Thesis', 'Lordas'].map((b) => (
                    <button key={b} className="font-[var(--font-body)] text-[12px] text-[#1c3a6e] border border-[#1c3a6e]/40 bg-[#f4ede0] py-2">{b}</button>
                  ))}
                  <button className="font-[var(--font-body)] text-[12px] text-[#7a6a5a] border border-[#3a2f24]/25 py-2 col-span-2">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <p className="font-[var(--font-body)] italic text-[12px] uppercase tracking-[3px] text-[#a87a30] mb-6">The three codebases</p>
          <div className="space-y-4">
            {[
              { name: 'Website', role: 'My personal operating system', tag: 'sovereignangel/sovereignangel.github.io', stack: 'Next.js · TypeScript · Firestore · Vercel', hosts: ['Thesis Engine', 'Telegram router', 'Wikis', 'Lordas', 'Atune', 'Arete', 'Manifold', 'Harness scaffold'] },
              { name: 'DeepOps', role: 'Armstrong fund infrastructure', tag: 'sovereignangel/DeepOptions', stack: 'Python · Supabase · React/Vite · launchd', hosts: ['Alpha engine', 'Capacity testing', 'Daily data processor', 'JPM pipeline', 'Dev briefs'] },
              { name: 'AlamoBernal', role: 'Partnership work (paying client)', tag: 'sovereignangel/alamobernal', stack: 'Next.js · Supabase · Vercel', hosts: ['Screener', 'Watchdog', 'Meetings library', 'Brief publishing'] },
            ].map((r) => (
              <div key={r.name} className="border border-[#3a2f24]/25 bg-[#ece3d2]/40 p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                  <span className="font-[var(--font-display)] text-[24px] text-[#2a1f15]">{r.name}</span>
                  <code className="font-mono text-[11px] text-[#7a6a5a]">{r.tag}</code>
                </div>
                <p className="font-[var(--font-display)] italic text-[16px] text-[#1c3a6e] mb-2">{r.role}</p>
                <p className="font-[var(--font-body)] text-[12px] text-[#7a6a5a] mb-4">{r.stack}</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.hosts.map((h) => (
                    <span key={h} className="font-[var(--font-body)] text-[12px] text-[#2a1f15] border border-[#3a2f24]/25 bg-[#f4ede0] px-2 py-0.5">{h}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function StreamsTab() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-10">
        <SectionHeader chapter="iii · the streams" title="Seven destinations. One tap each." />
        <div className="space-y-5 max-w-2xl font-[var(--font-body)] text-[16px] sm:text-[18px] leading-[1.7] text-[#2a1f15]">
          <p>
            Every Wave transcript lands as a prompt in Telegram. Seven buttons. I tap one, and the transcript routes to the surface that needs it.
          </p>
          <p>
            The first four are about the world I&apos;m trying to understand — four lenses on the same fund. The fifth and sixth are about the worlds I&apos;m sharing — with partners, with Aidas. The seventh is the escape hatch: <em>defer, decide later, no destination yet</em>.
          </p>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <p className="font-[var(--font-body)] italic text-[12px] uppercase tracking-[3px] text-[#a87a30] mb-6">Armstrong · four lenses on one fund</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-12">
            {[
              { name: 'Fundraising', body: 'LP conversations, allocator updates, pitch refinement, capital introductions.' },
              { name: 'Research', body: 'Analyst discussions, paper reviews, technique deep-dives, hypothesis tests.' },
              { name: 'Management', body: 'Team check-ins, ops decisions, vendor calls, infrastructure planning.' },
              { name: 'Investing', body: 'Position reviews, idea generation, post-mortems, risk discussions.' },
            ].map((l) => (
              <div key={l.name} className="border-l-2 border-[#1c3a6e] pl-4 py-2">
                <h3 className="font-[var(--font-display)] text-[20px] text-[#2a1f15] mb-1">{l.name}</h3>
                <p className="font-[var(--font-body)] text-[14px] leading-[1.6] text-[#7a6a5a]">{l.body}</p>
              </div>
            ))}
          </div>

          <p className="font-[var(--font-body)] italic text-[12px] uppercase tracking-[3px] text-[#a87a30] mb-6">The other three</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { name: 'Alamo Bernal', body: 'Partnership site for dividend-capture investing. Paying client.' },
              { name: 'Lordas', body: 'Conversations with Aidas. Tracked through three pillars: safety, growth, alignment.' },
              { name: 'Defer', body: 'Tagged, deduped against future Wave retries. Decision deferred, never lost.' },
            ].map((l) => (
              <div key={l.name} className="border-l-2 border-[#a87a30] pl-4 py-2">
                <h3 className="font-[var(--font-display)] text-[20px] text-[#2a1f15] mb-1">{l.name}</h3>
                <p className="font-[var(--font-body)] text-[14px] leading-[1.6] text-[#7a6a5a]">{l.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <p className="font-[var(--font-body)] italic text-[12px] uppercase tracking-[3px] text-[#a87a30] mb-6">Lordas — a closer look</p>
          <div className="max-w-2xl">
            <p className="font-[var(--font-body)] text-[16px] sm:text-[17px] leading-[1.7] text-[#2a1f15] mb-6">
              When Aidas and I have a real conversation — about money, about kids, about each other — I record it through Wave. The transcript feeds a small pipeline that asks three questions about how the conversation went. Over time, it becomes a record of how we&apos;ve been doing the work.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'Safety', body: 'Could we say hard things without flinching?' },
                { name: 'Growth', body: 'Did either of us learn something we didn&apos;t know before?' },
                { name: 'Alignment', body: 'Are we still pointed at the same future?' },
              ].map((p) => (
                <div key={p.name} className="bg-[#ece3d2]/50 border border-[#3a2f24]/25 p-4">
                  <h4 className="font-[var(--font-display)] italic text-[18px] text-[#1c3a6e] mb-2">{p.name}</h4>
                  <p className="font-[var(--font-body)] text-[13px] leading-[1.55] text-[#7a6a5a]" dangerouslySetInnerHTML={{ __html: p.body }} />
                </div>
              ))}
            </div>
            <p className="font-[var(--font-display)] italic text-[15px] sm:text-[16px] text-[#7a6a5a] mt-6">
              The pipeline doesn&apos;t score people — it scores conversations. A bad number isn&apos;t a verdict, it&apos;s a flag. <span className="text-[#2a1f15]">Something happened there. Look at it.</span>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

function WorldTab() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-10">
        <SectionHeader chapter="iv · the world" title="Adventures. Salons. Talks. The texture of being out there." />
        <div className="space-y-5 max-w-2xl font-[var(--font-body)] text-[16px] sm:text-[18px] leading-[1.7] text-[#2a1f15]">
          <p>
            Software is the substrate. But the practice is in the world — with people, in places, holding the kite or the wine glass or the chalk. The system catches what happens; it does not replace happening.
          </p>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <p className="font-[var(--font-body)] italic text-[12px] uppercase tracking-[3px] text-[#a87a30] mb-6">Adventures I organize</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Scavenger hunts', when: 'Manhattan, recurring', body: 'A whole city as a puzzle for an evening. Friends gathered, points earned, bananas redeemed.' },
              { name: 'Kite trips', when: 'Mistral, seasonal', body: 'Wind, water, friends. A pilgrimage as much as a sport.' },
              { name: 'Investor caravans', when: 'Aruba, custom', body: 'A small group of LPs and founders moving together through a place. Dinners that close fundraises.' },
            ].map((a) => (
              <div key={a.name} className="border border-[#3a2f24]/25 bg-[#ece3d2]/40 p-5">
                <h3 className="font-[var(--font-display)] text-[22px] text-[#2a1f15] mb-1">{a.name}</h3>
                <p className="font-[var(--font-display)] italic text-[13px] text-[#a87a30] mb-3">{a.when}</p>
                <p className="font-[var(--font-body)] text-[14px] leading-[1.6] text-[#7a6a5a]">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <p className="font-[var(--font-body)] italic text-[12px] uppercase tracking-[3px] text-[#a87a30] mb-6">Conversations I seek</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              'Academics',
              'Investors',
              'Founders',
              'Engineers & researchers',
            ].map((c) => (
              <div key={c} className="border-l-2 border-[#1c3a6e] pl-3 py-1">
                <span className="font-[var(--font-display)] text-[18px] text-[#2a1f15]">{c}</span>
              </div>
            ))}
          </div>
          <p className="font-[var(--font-body)] italic text-[14px] sm:text-[15px] text-[#7a6a5a] mt-6 max-w-2xl">
            Every conversation a chance to update the model. Wave runs in the background; the transcript lands an hour later; the insight gets indexed.
          </p>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <p className="font-[var(--font-body)] italic text-[12px] uppercase tracking-[3px] text-[#a87a30] mb-6">The work in public · <span className="not-italic text-[#7a6a5a]">aspirational</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            {[
              { name: 'Talks', body: 'At conferences, salons, reading groups. Each one recorded, transcribed, stored in Thesis Engine for feedback to flow back.' },
              { name: 'Research papers', body: 'Macro signals. Capacity testing. Complexity economics. Written for peers, not for the algorithm.' },
              { name: 'Blog posts', body: 'Weekly. On what I&apos;m thinking about. The thinking gets sharper because someone might read it.' },
            ].map((w) => (
              <div key={w.name} className="border border-dashed border-[#3a2f24]/30 p-5">
                <h3 className="font-[var(--font-display)] text-[22px] text-[#2a1f15] mb-2">{w.name}</h3>
                <p className="font-[var(--font-body)] text-[14px] leading-[1.6] text-[#7a6a5a]" dangerouslySetInnerHTML={{ __html: w.body }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function MetricsTab() {
  const kpis = [
    { name: 'Creation', body: 'Things made and shipped. Code, writing, gatherings, products.', tone: 'cobalt' },
    { name: 'New relationships', body: 'People in the rolodex who weren&apos;t there last quarter.', tone: 'cobalt' },
    { name: 'Opportunities authored', body: 'Conversations I caused. Deals I introduced. Doors I opened for others.', tone: 'cobalt' },
    { name: 'Insights captured', body: 'What I learned, in language I can find again. (Still iterating on what counts.)', tone: 'ochre', aspirational: true },
    { name: 'Net worth', body: 'Capital that compounds. The base case for everything else.', tone: 'cobalt' },
    { name: 'The body', body: 'Training. Sleep. Recovery. Nervous system regulation. The container.', tone: 'cobalt' },
    { name: 'The mind', body: 'Tantra. Meditation. Reflections. Twenty pages before dawn.', tone: 'cobalt' },
    { name: 'The relationship', body: 'Lordas pillar scores. Conversations had. Repairs made.', tone: 'cobalt' },
  ]
  return (
    <>
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-10">
        <SectionHeader chapter="v · what i count" title="A small set of metrics. The shape of what matters." />
        <div className="space-y-5 max-w-2xl font-[var(--font-body)] text-[16px] sm:text-[18px] leading-[1.7] text-[#2a1f15]">
          <p>
            Most things are not worth measuring. The few that are, are worth measuring carefully. These are the metrics that decide whether the year was real or wasted.
          </p>
          <p className="italic text-[#7a6a5a]">
            Not a dashboard. A compass.
          </p>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {kpis.map((k) => (
              <div
                key={k.name}
                className={`border-l-2 ${k.tone === 'ochre' ? 'border-[#a87a30]' : 'border-[#1c3a6e]'} pl-4 py-3`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="font-[var(--font-display)] text-[22px] text-[#2a1f15]">{k.name}</h3>
                  {k.aspirational && (
                    <span className="font-[var(--font-body)] italic text-[11px] text-[#a87a30]">still iterating</span>
                  )}
                </div>
                <p className="font-[var(--font-body)] text-[14px] sm:text-[15px] leading-[1.6] text-[#7a6a5a]" dangerouslySetInnerHTML={{ __html: k.body }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#3a2f24]/30 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <p className="font-[var(--font-display)] italic text-[18px] sm:text-[22px] leading-[1.5] text-[#2a1f15] text-center">
            &ldquo;You can&apos;t optimize what you don&apos;t notice. You can&apos;t notice what you don&apos;t name. You can&apos;t name what you haven&apos;t lived.&rdquo;
          </p>
          <p className="font-[var(--font-body)] italic text-[14px] text-[#7a6a5a] text-center mt-4">
            — the only quote I&apos;m allowed to invent for my own page
          </p>
        </div>
      </section>
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TechPage() {
  const [tab, setTab] = useState<Tab>('vision')

  return (
    <div className="min-h-screen bg-[#f4ede0] text-[#2a1f15] antialiased relative">
      <Grain />

      {/* Top nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#f4ede0]/90 border-b border-[#3a2f24]/25">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-[var(--font-display)] italic text-[18px] sm:text-[22px] text-[#2a1f15] truncate">loricorpuz.com</span>
            <span className="font-[var(--font-body)] italic text-[11px] tracking-[2px] uppercase text-[#a87a30]">/tech</span>
          </div>
        </div>
        <div className="border-t border-[#3a2f24]/20">
          <div className="max-w-5xl mx-auto px-2 sm:px-8 flex overflow-x-auto no-scrollbar">
            {([
              ['vision', 'Vision'],
              ['alfred', 'Alfred'],
              ['streams', 'Streams'],
              ['world', 'World'],
              ['metrics', 'What I count'],
            ] as Array<[Tab, string]>).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-none font-[var(--font-display)] text-[14px] sm:text-[16px] px-4 sm:px-5 py-3 sm:py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                  tab === id
                    ? 'text-[#1c3a6e] border-[#1c3a6e] italic'
                    : 'text-[#7a6a5a] border-transparent hover:text-[#2a1f15]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab content */}
      {tab === 'vision' && <VisionTab />}
      {tab === 'alfred' && <AlfredTab />}
      {tab === 'streams' && <StreamsTab />}
      {tab === 'world' && <WorldTab />}
      {tab === 'metrics' && <MetricsTab />}

      {/* Footer */}
      <footer className="border-t border-[#3a2f24]/25 mt-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-[var(--font-display)] italic text-[18px] text-[#2a1f15]">loricorpuz.com</p>
            <p className="font-[var(--font-body)] italic text-[12px] text-[#7a6a5a] mt-1">
              A renaissance practice, indexed.
            </p>
          </div>
          <a
            href="mailto:loricorpuz@gmail.com?subject=tech"
            className="font-[var(--font-body)] text-[13px] text-[#1c3a6e] border border-[#1c3a6e]/40 bg-[#f4ede0] px-5 py-2 hover:bg-[#ece3d2] transition-colors"
          >
            Get in touch
          </a>
        </div>
      </footer>
    </div>
  )
}
