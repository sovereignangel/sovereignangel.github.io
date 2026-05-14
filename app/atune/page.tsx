'use client'

import { useEffect, useState } from 'react'

// ── Visuals ─────────────────────────────────────────────────────────────────

function PulseCore() {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 100)
    return () => clearInterval(id)
  }, [])
  const rings = [0, 1, 2, 3, 4]
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg viewBox="-100 -100 200 200" className="w-[min(80vw,720px)] h-[min(80vw,720px)] opacity-70">
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f4a261" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#c2410c" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="0" cy="0" r="40" fill="url(#core)" />
        {rings.map((i) => {
          const phase = (t / 10 + i * 0.4) % 4
          const r = 12 + phase * 26
          const op = Math.max(0, 0.35 - phase * 0.08)
          return (
            <circle
              key={i}
              cx="0"
              cy="0"
              r={r}
              fill="none"
              stroke="#e8a06c"
              strokeWidth="0.4"
              opacity={op}
            />
          )
        })}
        {Array.from({ length: 48 }).map((_, i) => {
          const angle = (i / 48) * Math.PI * 2
          const wob = Math.sin(t / 8 + i * 0.3) * 4
          const r1 = 60
          const r2 = 70 + wob
          const x1 = Math.cos(angle) * r1
          const y1 = Math.sin(angle) * r1
          const x2 = Math.cos(angle) * r2
          const y2 = Math.sin(angle) * r2
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#d97706"
              strokeWidth="0.5"
              opacity={0.35}
            />
          )
        })}
        <circle cx="0" cy="0" r="2" fill="#f4a261" opacity="0.9" />
      </svg>
    </div>
  )
}

function Grain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.06] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  )
}

// ── Content ─────────────────────────────────────────────────────────────────

const PRINCIPLES = [
  {
    n: '01',
    title: 'The crowd is the score',
    body: 'A great DJ already reads the room with their eyes — when hands go up, when bodies still, when the breath drops. Atune gives them superhuman vision, perfect memory, and a system that learns.',
  },
  {
    n: '02',
    title: 'The room becomes the instrument',
    body: 'Computer vision turns the audience into a continuous signal — density, motion, cohesion, attention. That signal flows back into the music. The crowd is no longer downstream of the DJ; they are inside the loop.',
  },
  {
    n: '03',
    title: 'The DJ stays sovereign',
    body: 'Atune is a co-pilot, not an autopilot. It suggests, surfaces, surfaces the next track, signals the drop. The human remains the artist. The machine is the third ear.',
  },
  {
    n: '04',
    title: 'Every night is a dataset',
    body: 'Each set becomes labeled data: what the room felt, what the DJ played, what worked. A model that gets better every night, across every venue, in every key.',
  },
]

const READINGS = [
  { label: 'Crowd density', unit: '0 — 1.0', body: 'Bodies per square meter — surfaced as warmth or pressure on the floor map.' },
  { label: 'Motion intensity', unit: 'optical flow', body: 'Aggregate movement vector — how hard the room is moving, where the locked-in pockets are.' },
  { label: 'Cohesion', unit: 'phase sync', body: 'Are bodies moving together, or fragmented? A measure of the room’s entrainment.' },
  { label: 'Attention', unit: 'gaze + pose', body: 'Faces oriented to the booth vs. faces in conversation. The room’s focus.' },
  { label: 'Phones in air', unit: 'count', body: 'The classic drop signal — a clean, objective measure of peak moments.' },
  { label: 'Energy trajectory', unit: 'derivative', body: 'Is the room building, holding, or fading? The most important read of all.' },
]

const SOURCES = [
  { name: 'Local files', verdict: 'Yes', tone: 'go', note: 'The gold standard. Rekordbox, Traktor, Serato, djay Pro all run on local libraries. Full beatgrid, key, cue points, FX, stems.' },
  { name: 'Beatport LINK / Beatsource LINK / TIDAL DJ', verdict: 'Yes', tone: 'go', note: 'The legit streaming path. Integrates directly into pro DJ software with beatgridded, DJ-ready audio.' },
  { name: 'Spotify Web API', verdict: 'No', tone: 'stop', note: 'Playback control only. No raw audio, no mixing, no FX, no beatmatching. Their terms explicitly prohibit DJ use.' },
  { name: 'YouTube Music', verdict: 'No', tone: 'stop', note: 'No public streaming API for DJ-style use. Terms-of-service blocker.' },
  { name: 'SoundCloud', verdict: 'Limited', tone: 'caution', note: 'API mostly closed to new applications since 2021. Workable only for unsigned/Creative Commons content.' },
  { name: 'AI stem separation', verdict: 'Yes', tone: 'go', note: 'djay Pro AI and Demucs allow real-time isolation of vocals, drums, bass, harmony. This is where vision-driven remixing actually lives.' },
]

const STACK = [
  {
    layer: 'Capture',
    bullets: [
      'Sony FX3 or A7S III (4K low-light) — primary booth-facing camera',
      'iPhone Pro + Continuity Camera — wide secondary, MVP-grade',
      'Optional: Intel RealSense depth or thermal for crowd density in low light',
    ],
  },
  {
    layer: 'Vision pipeline',
    bullets: [
      'Edge processor: Mac Studio (M-series, MPS) or NVIDIA Jetson Orin',
      'Pose estimation: YOLOv8-pose or MediaPipe (real-time, 30+ fps)',
      'Crowd density: CSRNet or OpenPose density maps',
      'Optical flow: Farnebäck (OpenCV) for collective motion vectors',
      'All running in Python — frame in, energy vector out, 100ms loop',
    ],
  },
  {
    layer: 'Energy synthesis',
    bullets: [
      'Normalize raw signals into a 6-dimensional energy vector',
      'Rolling 30s, 2min, 10min windows — short signal, mid arc, long arc',
      'Phase-2: RL policy trained on DJ-labeled "what worked" data',
    ],
  },
  {
    layer: 'Bridge',
    bullets: [
      'python-osc + mido — OSC and MIDI out from the CV machine',
      'MIDI Learn into rekordbox / Traktor / djay Pro',
      'Maps energy dimensions to filter cutoff, FX intensity, stem mute, cue triggers',
    ],
  },
  {
    layer: 'DJ surface',
    bullets: [
      'djay Pro AI (deepest AI stems + Neural Mix) — recommended for MVP',
      'Traktor Pro 4 (pro-grade FX + most flexible MIDI mapping)',
      'A second screen for the DJ: "co-pilot view" — next-track suggestions, drop window, energy trajectory',
    ],
  },
  {
    layer: 'Crowd feedback',
    bullets: [
      'Lightweight web app — QR code on screens at the venue',
      'Single-tap signals: "lock in", "lift it", "bring it down"',
      'Fuses with vision signal — the room votes with both motion and intent',
      'Next.js + Firebase for v1, can move to Convex for sub-100ms reactivity',
    ],
  },
]

const PHASES = [
  {
    n: 'P1',
    weeks: '4 weeks',
    title: 'The Eye',
    body: 'A single camera, a Mac, a Python pipeline that outputs a live energy vector to a dashboard. Validate the read. No DJ integration yet.',
  },
  {
    n: 'P2',
    weeks: '8 weeks',
    title: 'The Co-pilot',
    body: 'MIDI bridge into djay Pro. Energy vector controls filter and FX in real time. A second-screen co-pilot view for the DJ — next track, drop window, "the room is asking for X."',
  },
  {
    n: 'P3',
    weeks: '12 weeks',
    title: 'The Loop',
    body: 'Crowd feedback web app live at a real event. Vision + crowd intent fused. First end-to-end party as research lab.',
  },
  {
    n: 'P4',
    weeks: '6+ months',
    title: 'The Conductor',
    body: 'Closed-loop autonomous remixing on AI stems. The system can run a 20-minute interlude untouched. The DJ becomes a curator and conductor, not an operator.',
  },
]

const NEEDS = [
  { role: 'CV / ML lead', body: 'Real-time pose + crowd density on edge hardware. You’d own the eye.' },
  { role: 'Audio / DJ engineer', body: 'MIDI mapping, FX design, djay/Traktor depth, ideally a working DJ.' },
  { role: 'Venue + first event', body: 'A small room (50–150 capacity) willing to host the first live test.' },
  { role: 'Capital partner', body: 'Seed gear + early payroll. Sub-$200k gets us through P3 and a documented live show.' },
]

// ── Page ────────────────────────────────────────────────────────────────────

type Tab = 'vision' | 'architecture'

export default function AtunePage() {
  const [tab, setTab] = useState<Tab>('vision')

  return (
    <div className="min-h-screen bg-[#0a0807] text-[#f0e8de] antialiased relative">
      <Grain />

      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#0a0807]/80 border-b border-[#2a1f18]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-[20px] tracking-[-0.5px] text-[#f4a261]">atune</span>
            <span className="font-mono text-[9px] uppercase tracking-[3px] text-[#8a7a6c]">prelude · 01</span>
          </div>
          <div className="flex gap-1">
            <button
              data-tab="vision"
              onClick={() => setTab('vision')}
              className={`font-mono text-[10px] uppercase tracking-[2px] px-3 py-2 transition-colors ${
                tab === 'vision' ? 'text-[#f4a261]' : 'text-[#8a7a6c] hover:text-[#d4c4b0]'
              }`}
            >
              The vision
            </button>
            <button
              data-tab="architecture"
              onClick={() => setTab('architecture')}
              className={`font-mono text-[10px] uppercase tracking-[2px] px-3 py-2 transition-colors ${
                tab === 'architecture' ? 'text-[#f4a261]' : 'text-[#8a7a6c] hover:text-[#d4c4b0]'
              }`}
            >
              The architecture
            </button>
          </div>
        </div>
      </nav>

      {tab === 'vision' ? <VisionTab /> : <ArchitectureTab />}

      <footer className="border-t border-[#2a1f18] mt-32">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-serif text-[14px] text-[#d4c4b0]">atune</p>
            <p className="font-mono text-[9px] uppercase tracking-[2px] text-[#6a5a4c] mt-1">
              The crowd composes the night
            </p>
          </div>
          <a
            href="mailto:loricorpuz@gmail.com?subject=atune"
            className="font-mono text-[10px] uppercase tracking-[2px] text-[#f4a261] border border-[#7a4a2a] px-4 py-2 hover:bg-[#1a120c] transition-colors"
          >
            Build this with me
          </a>
        </div>
      </footer>
    </div>
  )
}

// ── Vision tab ──────────────────────────────────────────────────────────────

function VisionTab() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden border-b border-[#2a1f18]">
        <PulseCore />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center py-24">
          <p className="font-mono text-[10px] uppercase tracking-[6px] text-[#8a7a6c] mb-6">
            A prelude
          </p>
          <h1 className="font-serif text-[clamp(48px,9vw,120px)] leading-[0.95] tracking-[-2px] text-[#f0e8de] mb-6">
            The crowd
            <br />
            <em className="text-[#f4a261] not-italic font-light italic">composes</em>
            <br />
            the night.
          </h1>
          <p className="font-serif text-[18px] leading-relaxed text-[#a89786] max-w-xl mx-auto mt-10">
            A real-time vision system that reads the room and turns it into the music’s next move.
          </p>
        </div>
      </section>

      {/* Manifesto */}
      <section className="max-w-4xl mx-auto px-6 py-32">
        <p className="font-mono text-[10px] uppercase tracking-[4px] text-[#7a4a2a] mb-8">
          What it is
        </p>
        <div className="space-y-12 font-serif text-[22px] leading-[1.5] text-[#d4c4b0]">
          <p>
            Every great DJ already reads the crowd with their eyes — when hands rise, when bodies still, when the breath of the room shifts.
          </p>
          <p>
            <span className="text-[#f4a261]">Atune is that eye, made absolute.</span> A high-fidelity video camera watches the floor.
            Computer vision turns motion, density, attention, and cohesion into a continuous signal.
            That signal flows into the DJ’s rig in real time — as a co-pilot, not an autopilot.
          </p>
          <p>
            The room stops being downstream of the music.
            <br />
            <span className="text-[#f4a261]">It becomes part of the instrument.</span>
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="border-t border-[#2a1f18] py-32">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-[#7a4a2a] mb-12 text-center">
            Four principles
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {PRINCIPLES.map((p) => (
              <div key={p.n}>
                <p className="font-mono text-[10px] tracking-[3px] text-[#7a4a2a] mb-3">{p.n}</p>
                <h3 className="font-serif text-[24px] leading-tight text-[#f0e8de] mb-3">
                  {p.title}
                </h3>
                <p className="font-serif text-[15px] leading-relaxed text-[#a89786]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The party as research lab */}
      <section className="border-t border-[#2a1f18] py-32 bg-gradient-to-b from-[#0a0807] to-[#120c08]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-[#7a4a2a] mb-8">
            The bet
          </p>
          <h2 className="font-serif text-[42px] leading-tight text-[#f0e8de] mb-8">
            Build the technology by throwing the parties.
          </h2>
          <p className="font-serif text-[18px] leading-relaxed text-[#a89786]">
            We don’t need to convince a venue to take a risk. We don’t need a research grant.
            We host the events ourselves, in rooms small enough to feel and large enough to matter,
            and every night becomes labeled data — what the room felt, what the DJ played, what worked.
          </p>
          <p className="font-serif text-[18px] leading-relaxed text-[#a89786] mt-6">
            A model that gets better every set. A practice that compounds.
          </p>
        </div>
      </section>

      {/* Invite */}
      <section className="border-t border-[#2a1f18] py-32">
        <div className="max-w-3xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-[#7a4a2a] mb-8">
            Who this is for
          </p>
          <p className="font-serif text-[22px] leading-relaxed text-[#d4c4b0] mb-6">
            If you build computer vision systems and dream about them living somewhere other than warehouses and security cameras —
          </p>
          <p className="font-serif text-[22px] leading-relaxed text-[#d4c4b0] mb-6">
            If you DJ, or you love DJs, and you’ve felt the limit of human pattern-matching at hour four —
          </p>
          <p className="font-serif text-[22px] leading-relaxed text-[#f4a261]">
            We’re building the early team.
          </p>
          <div className="mt-12 flex gap-3">
            <a
              href="#architecture"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector<HTMLButtonElement>('button[data-tab="architecture"]')?.click()
              }}
              className="font-mono text-[10px] uppercase tracking-[3px] text-[#f4a261] border border-[#7a4a2a] px-5 py-3 hover:bg-[#1a120c] transition-colors"
            >
              See the architecture →
            </a>
            <a
              href="mailto:loricorpuz@gmail.com?subject=atune"
              className="font-mono text-[10px] uppercase tracking-[3px] text-[#d4c4b0] border border-[#2a1f18] px-5 py-3 hover:border-[#7a4a2a] transition-colors"
            >
              Write to us
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

// ── Architecture tab ────────────────────────────────────────────────────────

function ArchitectureTab() {
  return (
    <>
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <p className="font-mono text-[10px] uppercase tracking-[4px] text-[#7a4a2a] mb-6">
          The architecture
        </p>
        <h1 className="font-serif text-[clamp(36px,6vw,68px)] leading-[1.05] tracking-[-1px] text-[#f0e8de] mb-6">
          What we build, what it touches, what it costs.
        </h1>
        <p className="font-serif text-[17px] leading-relaxed text-[#a89786] max-w-2xl">
          The full stack from camera lens to MIDI cable, the honest constraints on music sources, and a four-phase build path with timelines.
        </p>
      </section>

      {/* Pipeline diagram */}
      <section className="border-t border-[#2a1f18] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7a4a2a] mb-10">
            The signal path
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { n: '01', title: 'Camera', sub: 'Sony FX3 / iPhone' },
              { n: '02', title: 'CV pipeline', sub: 'YOLO + flow' },
              { n: '03', title: 'Energy vector', sub: '6 dimensions' },
              { n: '04', title: 'OSC / MIDI', sub: 'bridge layer' },
              { n: '05', title: 'DJ surface', sub: 'djay / Traktor' },
            ].map((s, i, arr) => (
              <div key={s.n} className="relative">
                <div className="border border-[#2a1f18] p-5 hover:border-[#7a4a2a] transition-colors">
                  <p className="font-mono text-[9px] tracking-[2px] text-[#7a4a2a] mb-3">{s.n}</p>
                  <p className="font-serif text-[18px] text-[#f0e8de] mb-1">{s.title}</p>
                  <p className="font-mono text-[10px] text-[#8a7a6c]">{s.sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 text-[#7a4a2a] font-mono text-xs">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-[#6a5a4c] mt-6 text-center">
            ~100ms end-to-end · 30 fps · single Mac Studio
          </p>
        </div>
      </section>

      {/* What CV reads */}
      <section className="border-t border-[#2a1f18] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7a4a2a] mb-3">
            What the vision system reads
          </p>
          <h2 className="font-serif text-[32px] text-[#f0e8de] mb-10">Six dimensions of energy.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#2a1f18]">
            {READINGS.map((r) => (
              <div key={r.label} className="bg-[#0a0807] p-6">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-serif text-[18px] text-[#f0e8de]">{r.label}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[2px] text-[#7a4a2a]">{r.unit}</span>
                </div>
                <p className="font-serif text-[14px] leading-relaxed text-[#a89786]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Music sources — the honest table */}
      <section className="border-t border-[#2a1f18] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7a4a2a] mb-3">
            Where the music comes from
          </p>
          <h2 className="font-serif text-[32px] text-[#f0e8de] mb-3">The honest answer on streaming.</h2>
          <p className="font-serif text-[15px] text-[#a89786] mb-10 max-w-2xl">
            We get asked this constantly. Most streaming services do not allow DJ-style use — only playback control. The real catalog lives in two places.
          </p>
          <div className="border border-[#2a1f18]">
            {SOURCES.map((s, i) => (
              <div
                key={s.name}
                className={`grid grid-cols-12 gap-4 px-5 py-4 ${
                  i < SOURCES.length - 1 ? 'border-b border-[#2a1f18]' : ''
                }`}
              >
                <div className="col-span-12 md:col-span-4">
                  <p className="font-serif text-[16px] text-[#f0e8de]">{s.name}</p>
                </div>
                <div className="col-span-3 md:col-span-2">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[2px] px-2 py-1 border ${
                      s.tone === 'go'
                        ? 'text-[#a8d8a8] border-[#3a5a3a]'
                        : s.tone === 'caution'
                        ? 'text-[#e8c068] border-[#5a4a2a]'
                        : 'text-[#d88888] border-[#5a2a2a]'
                    }`}
                  >
                    {s.verdict}
                  </span>
                </div>
                <p className="col-span-9 md:col-span-6 font-serif text-[14px] leading-relaxed text-[#a89786]">
                  {s.note}
                </p>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#6a5a4c] mt-6">
            Conclusion · Local library + Beatport LINK + AI stems = the working set.
          </p>
        </div>
      </section>

      {/* Stack */}
      <section className="border-t border-[#2a1f18] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7a4a2a] mb-3">
            The stack
          </p>
          <h2 className="font-serif text-[32px] text-[#f0e8de] mb-10">Six layers, all real today.</h2>
          <div className="space-y-px bg-[#2a1f18]">
            {STACK.map((s) => (
              <div key={s.layer} className="bg-[#0a0807] p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[2px] text-[#7a4a2a] mb-1">Layer</p>
                  <p className="font-serif text-[20px] text-[#f4a261]">{s.layer}</p>
                </div>
                <ul className="md:col-span-3 space-y-1.5">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="font-serif text-[14px] leading-relaxed text-[#d4c4b0] flex gap-3">
                      <span className="text-[#7a4a2a] font-mono text-[10px] pt-1.5">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Build path */}
      <section className="border-t border-[#2a1f18] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7a4a2a] mb-3">
            The build path
          </p>
          <h2 className="font-serif text-[32px] text-[#f0e8de] mb-10">From eye to conductor in four phases.</h2>
          <div className="space-y-6">
            {PHASES.map((p) => (
              <div key={p.n} className="grid grid-cols-12 gap-6 border-l border-[#7a4a2a] pl-6 py-2">
                <div className="col-span-12 md:col-span-2">
                  <p className="font-mono text-[10px] tracking-[3px] text-[#7a4a2a]">{p.n}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#6a5a4c] mt-1">{p.weeks}</p>
                </div>
                <div className="col-span-12 md:col-span-10">
                  <h3 className="font-serif text-[24px] text-[#f0e8de] mb-2">{p.title}</h3>
                  <p className="font-serif text-[15px] leading-relaxed text-[#a89786]">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we need */}
      <section className="border-t border-[#2a1f18] py-20 bg-gradient-to-b from-[#0a0807] to-[#120c08]">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7a4a2a] mb-3">
            What we need
          </p>
          <h2 className="font-serif text-[32px] text-[#f0e8de] mb-10">Four chairs at the table.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {NEEDS.map((n) => (
              <div key={n.role} className="border-t border-[#2a1f18] pt-6">
                <h3 className="font-serif text-[20px] text-[#f4a261] mb-2">{n.role}</h3>
                <p className="font-serif text-[15px] leading-relaxed text-[#a89786]">{n.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <a
              href="mailto:loricorpuz@gmail.com?subject=atune"
              className="inline-block font-mono text-[10px] uppercase tracking-[3px] text-[#0a0807] bg-[#f4a261] px-6 py-3 hover:bg-[#e8a06c] transition-colors"
            >
              Build this with me
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
