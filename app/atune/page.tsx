'use client'

import { useEffect, useRef, useState } from 'react'

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

function BateyDiagram() {
  const drummers = 6
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 mx-auto" aria-hidden="true">
      {/* outer ring — the cousins, the community */}
      <circle cx="100" cy="100" r="82" fill="none" stroke="#7a4a2a" strokeWidth="0.4" opacity="0.6" />
      {/* inner ring — the batey edge */}
      <circle cx="100" cy="100" r="32" fill="none" stroke="#f4a261" strokeWidth="0.4" opacity="0.65" />
      {/* call-and-response radials */}
      {Array.from({ length: drummers }).map((_, i) => {
        const a = (i / drummers) * Math.PI * 2 - Math.PI / 2
        const x1 = 100 + Math.cos(a) * 34
        const y1 = 100 + Math.sin(a) * 34
        const x2 = 100 + Math.cos(a) * 80
        const y2 = 100 + Math.sin(a) * 80
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#f4a261"
            strokeWidth="0.3"
            opacity="0.35"
          />
        )
      })}
      {/* drummers on the perimeter */}
      {Array.from({ length: drummers }).map((_, i) => {
        const a = (i / drummers) * Math.PI * 2 - Math.PI / 2
        const cx = 100 + Math.cos(a) * 82
        const cy = 100 + Math.sin(a) * 82
        return <circle key={i} cx={cx} cy={cy} r="2.4" fill="#c2410c" opacity="0.9" />
      })}
      {/* dancer at center — body as the first instrument */}
      <circle cx="100" cy="100" r="10" fill="none" stroke="#f4a261" strokeWidth="0.3" opacity="0.5" />
      <circle cx="100" cy="100" r="3.5" fill="#f4a261" />
    </svg>
  )
}

// Brass facewear — digital echo of sculpted adornments worn to soften a face to a machine
function BrassMask() {
  return (
    <svg viewBox="-110 -130 220 260" className="w-[min(78vw,340px)] h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="brassPlate" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7a4a1f" />
          <stop offset="35%" stopColor="#f4c489" />
          <stop offset="65%" stopColor="#f4a261" />
          <stop offset="100%" stopColor="#5a3a14" />
        </linearGradient>
        <radialGradient id="brassDisc" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f8d6a8" />
          <stop offset="45%" stopColor="#f4a261" />
          <stop offset="100%" stopColor="#7a4a1f" />
        </radialGradient>
        <filter id="brassSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {/* Implied portrait — head, hair part, jaw */}
      <ellipse cx="0" cy="0" rx="62" ry="82" fill="none" stroke="#2a1f18" strokeWidth="0.5" opacity="0.55" />
      <path
        d="M -62 -40 Q -78 -100 -28 -114 Q 0 -120 28 -114 Q 78 -100 62 -40"
        fill="none"
        stroke="#2a1f18"
        strokeWidth="0.5"
        opacity="0.4"
      />
      {/* Center part */}
      <path d="M 0 -110 L 0 -82" stroke="#2a1f18" strokeWidth="0.4" opacity="0.45" />
      {/* Lip line — barest hint */}
      <path d="M -8 48 Q 0 52 8 48" fill="none" stroke="#2a1f18" strokeWidth="0.4" opacity="0.4" />

      {/* Thin curving wire — bridges the two cheek discs around the nose */}
      <path
        d="M -52 -8 Q -42 8 -22 6 Q -10 4 0 -8 Q 10 4 22 6 Q 42 8 52 -8"
        fill="none"
        stroke="#f4a261"
        strokeWidth="1.1"
        opacity="0.9"
      />

      {/* Left disc */}
      <g>
        <circle cx="-46" cy="-2" r="15" fill="url(#brassDisc)" />
        <circle cx="-46" cy="-2" r="15" fill="none" stroke="#7a4a1f" strokeWidth="0.5" opacity="0.7" />
        <circle cx="-50" cy="-6" r="3" fill="#f8d6a8" opacity="0.55" filter="url(#brassSoft)" />
      </g>

      {/* Right disc */}
      <g>
        <circle cx="46" cy="-2" r="15" fill="url(#brassDisc)" />
        <circle cx="46" cy="-2" r="15" fill="none" stroke="#7a4a1f" strokeWidth="0.5" opacity="0.7" />
        <circle cx="42" cy="-6" r="3" fill="#f8d6a8" opacity="0.55" filter="url(#brassSoft)" />
      </g>

      {/* Vertical sculpted plate — forehead, down across the bridge, ending at the philtrum */}
      <g>
        <path
          d="
            M -7 -82
            Q -8 -78 -8 -70
            L -7 -30
            Q -6 -10 -4 -2
            L -3 12
            Q -2 22 0 28
            Q 2 22 3 12
            L 4 -2
            Q 6 -10 7 -30
            L 8 -70
            Q 8 -78 7 -82
            Z
          "
          fill="url(#brassPlate)"
        />
        {/* Light edge */}
        <path
          d="M -3 -82 L -3 -30 Q -2 -10 0 -2 L 0 28"
          stroke="#fde3c0"
          strokeWidth="0.5"
          fill="none"
          opacity="0.65"
        />
        {/* Shadow edge */}
        <path
          d="M 5 -82 L 5 -30 Q 5 -10 2 -2 L 1 26"
          stroke="#3a2210"
          strokeWidth="0.4"
          fill="none"
          opacity="0.55"
        />
      </g>

      {/* Caption marks — like a fashion plate */}
      <text x="-100" y="-118" fontSize="6" fill="#7a4a2a" fontFamily="monospace" letterSpacing="2">
        ATUNE · No.01
      </text>
      <text x="100" y="-118" fontSize="6" fill="#7a4a2a" fontFamily="monospace" letterSpacing="2" textAnchor="end">
        la veladura
      </text>
      <line x1="-100" y1="118" x2="100" y2="118" stroke="#2a1f18" strokeWidth="0.4" />
      <text x="0" y="126" fontSize="6" fill="#7a4a2a" fontFamily="monospace" letterSpacing="3" textAnchor="middle">
        BRASS · WORN BY THE WILLING
      </text>
    </svg>
  )
}

// SoundCloud Widget API loader — track loops via FINISH event
function AmbientAudio({ playing, onReady }: { playing: boolean; onReady: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<{ play: () => void; pause: () => void; seekTo: (n: number) => void } | null>(null)
  const readyRef = useRef(false)

  useEffect(() => {
    function setupWidget() {
      if (!iframeRef.current || readyRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SC = (window as any).SC
      if (!SC?.Widget) return
      const widget = SC.Widget(iframeRef.current)
      widgetRef.current = widget
      widget.bind(SC.Widget.Events.READY, () => {
        widget.setVolume(45)
        readyRef.current = true
        onReady()
      })
      widget.bind(SC.Widget.Events.FINISH, () => {
        widget.seekTo(0)
        widget.play()
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).SC?.Widget) {
      setupWidget()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-sc-api]')
    if (existing) {
      existing.addEventListener('load', setupWidget)
      return () => existing.removeEventListener('load', setupWidget)
    }
    const script = document.createElement('script')
    script.src = 'https://w.soundcloud.com/player/api.js'
    script.async = true
    script.dataset.scApi = 'true'
    script.onload = setupWidget
    document.head.appendChild(script)
  }, [onReady])

  useEffect(() => {
    const w = widgetRef.current
    if (!w || !readyRef.current) return
    if (playing) w.play()
    else w.pause()
  }, [playing])

  const trackUrl =
    'https://soundcloud.com/scorpioscommunity/demaya-arkdayan-feat-yana-mann-esperanza-jean-claude-ades-remix'
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    trackUrl
  )}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&buying=false&sharing=false&liking=false&download=false&single_active=true`

  return (
    <iframe
      ref={iframeRef}
      src={src}
      width="1"
      height="1"
      allow="autoplay"
      title="Ambient — Demaya (Arkdayan, Jean Claude Ades Remix)"
      style={{ position: 'fixed', left: -9999, top: -9999, opacity: 0, pointerEvents: 'none' }}
    />
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
  { role: 'A friend who plays with CV', body: 'Pose, density, optical flow — all runnable on a Mac today. You don’t need to be a research scientist. You need to be curious.' },
  { role: 'A friend who DJs', body: 'Bring a deck, a library, and an open mind. djay Pro AI handles the stems — you handle the room.' },
  { role: 'A room to make our own', body: 'A loft, a warehouse, a backyard, the playa. Small enough to feel, big enough to matter, dark enough to disappear into.' },
  { role: 'A weekend and a few hands', body: 'Camera, cables, the patience to fail twice and get it right on the third night. No team, no roadmap — just the work.' },
]

const PLAYA_TIMELINE = [
  { window: 'May → June', title: 'The eye', body: 'Webcam in someone’s apartment. Python pipeline outputs a live energy vector to a dashboard. Validate the read.' },
  { window: 'June → July', title: 'The bridge', body: 'MIDI from the CV machine into djay Pro on a friend’s DJ rig. Filter, FX, stem mute responding to motion. Mistakes welcomed.' },
  { window: 'July', title: 'The dress rehearsal', body: 'One small night in a Brooklyn loft or a friend’s living room. 30 people. Break things in private before we break them on the playa.' },
  { window: 'August', title: 'The pack-out + the burn', body: 'Crate the rig, generator, sound system. Drive it out. Run it for one night. Take notes. Come home changed.' },
]

const PLAYA_COSTS = [
  { item: 'Gear (camera, mounts, MIDI, cables)', range: 'free → $2,500', note: 'iPhone + Continuity Camera is real. New Sony A7S III if we want it.' },
  { item: 'Software (djay Pro AI, Beatport LINK)', range: '$60 → $120', note: 'For 3–4 months of LINK + djay subscription.' },
  { item: 'Burning Man tickets (2)', range: '$1,200', note: 'Standard tickets + vehicle pass.' },
  { item: 'Camp logistics (RV share, food, water)', range: '$1,500 → $2,500', note: 'Costs scale with comfort level. Shared RV is the move.' },
  { item: 'Power (Honda EU2200i + fuel)', range: '$800', note: 'Generator handles the rig and a small PA. Quiet enough to live with.' },
  { item: 'Small PA / sound rental', range: '$500 → $1,000', note: 'A pair of QSC K12s and a sub. Doesn’t need to be huge — needs to be true.' },
  { item: 'Dust protection + contingency', range: '$300 → $500', note: 'Cases, microfiber, redundancy. The playa eats electronics.' },
]

// ── Page ────────────────────────────────────────────────────────────────────

type Tab = 'vision' | 'architecture'

export default function AtunePage() {
  const [tab, setTab] = useState<Tab>('vision')
  const [audioReady, setAudioReady] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0807] text-[#f0e8de] antialiased relative">
      <Grain />
      <AmbientAudio playing={audioPlaying} onReady={() => setAudioReady(true)} />

      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#0a0807]/80 border-b border-[#2a1f18]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-[20px] tracking-[-0.5px] text-[#f4a261]">atune</span>
            <span className="font-mono text-[9px] uppercase tracking-[3px] text-[#8a7a6c]">prelude · 01</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAudioPlaying((v) => !v)}
              disabled={!audioReady}
              aria-label={audioPlaying ? 'Pause ambient music' : 'Play ambient music'}
              className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] px-3 py-2 transition-colors ${
                audioReady ? 'text-[#8a7a6c] hover:text-[#f4a261]' : 'text-[#3a2f28] cursor-wait'
              }`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${
                  audioPlaying ? 'bg-[#f4a261] animate-pulse' : 'bg-[#7a4a2a]'
                }`}
              />
              <span className="hidden sm:inline">{audioPlaying ? 'sound on' : 'sound off'}</span>
            </button>
            <span className="text-[#2a1f18] mx-1">·</span>
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
            Come play
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

      {/* Lineage — Bomba */}
      <section className="border-t border-[#2a1f18] py-32 bg-gradient-to-b from-[#0a0807] via-[#0e0a07] to-[#0a0807]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-[#7a4a2a] mb-12">
            A lineage
          </p>

          <div className="mb-10 opacity-90">
            <BateyDiagram />
          </div>

          <h2 className="font-serif text-[36px] sm:text-[44px] leading-[1.1] text-[#f0e8de] mb-10">
            The first instrument
            <br />
            <em className="not-italic italic font-light text-[#f4a261]">was the body.</em>
          </h2>

          <div className="space-y-6 font-serif text-[18px] leading-[1.65] text-[#d4c4b0] max-w-2xl mx-auto">
            <p>
              In <em className="text-[#f4a261] not-italic italic">bomba</em> — the Afro-Puerto Rican dance carried from West Africa to coastal towns like Loíza —
              a woman steps into the <em className="text-[#f4a261] not-italic italic">batey</em> and the cousins surrounding her answer
              her body in real time.
            </p>
            <p>
              Her hip calls. The <em className="text-[#f4a261] not-italic italic">primo</em> drummer follows on the fly.
              The other drummers hold the floor steady so the conversation can happen.
              <br />
              <span className="text-[#f0e8de]">The dance leads. The music listens.</span>
            </p>
            <p className="text-[#a89786]">
              Atune is a continuation, not an invention.
              The room becomes the dancer.
              The system becomes the cousins with the drums.
            </p>
          </div>

          <div className="mt-12 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-[#7a4a2a]" />
            <span className="font-mono text-[9px] uppercase tracking-[3px] text-[#7a4a2a]">
              Loíza · Mayagüez · Ponce
            </span>
            <span className="h-px w-12 bg-[#7a4a2a]" />
          </div>
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

      {/* The vow — privacy & adornment */}
      <section className="border-t border-[#2a1f18] py-32">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-[#7a4a2a] mb-12 text-center">
            A vow
          </p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
            <div className="md:col-span-5 flex justify-center">
              <BrassMask />
            </div>

            <div className="md:col-span-7 space-y-8">
              <h2 className="font-serif text-[clamp(36px,5vw,56px)] leading-[1.05] tracking-[-1px] text-[#f0e8de]">
                The face
                <br />
                <em className="not-italic italic font-light text-[#f4a261]">stays sacred.</em>
              </h2>

              <div className="space-y-5 font-serif text-[17px] leading-[1.7] text-[#d4c4b0]">
                <p>
                  The system reads the body — pose, density, motion, the breath of the room.
                  <span className="text-[#a89786]"> Never the face. Never a name. Never a record.</span>
                </p>
                <p className="text-[#a89786]">
                  Faces are not stored. Faces are not matched. Faces are not learned. The eye blurs them on the wire,
                  before the frame ever leaves the lens.
                </p>
                <p>
                  And for those who want the refusal made tactile — who want their privacy
                  <em className="text-[#f4a261] not-italic italic"> worn</em> — we sculpt adornments.
                </p>
                <p className="text-[#a89786]">
                  Sheets of brass that meet the machine as ornament: discs that obscure, plates that confound,
                  thin gold wire that turns a watching room into a jewel box. Anti-surveillance, designed by
                  someone who loves beauty.
                </p>
              </div>

              <div className="pt-4 border-t border-[#2a1f18] flex flex-col sm:flex-row gap-6 sm:gap-10">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[3px] text-[#7a4a2a] mb-1">Privacy</p>
                  <p className="font-serif text-[15px] text-[#f4a261]">as ornament</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[3px] text-[#7a4a2a] mb-1">Anonymity</p>
                  <p className="font-serif text-[15px] text-[#f4a261]">as elegance</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[3px] text-[#7a4a2a] mb-1">The room</p>
                  <p className="font-serif text-[15px] text-[#f4a261]">as a jewel box</p>
                </div>
              </div>

              <p className="font-serif italic text-[15px] text-[#a89786] leading-relaxed pt-4">
                The most beautiful disguise is one you wear with pride.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The spirit */}
      <section className="border-t border-[#2a1f18] py-32 bg-gradient-to-b from-[#0a0807] to-[#120c08]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-[#7a4a2a] mb-8">
            The spirit
          </p>
          <h2 className="font-serif text-[42px] leading-tight text-[#f0e8de] mb-8">
            Built for the love of it.
          </h2>
          <p className="font-serif text-[18px] leading-relaxed text-[#a89786]">
            No round to raise, no team to scale, no roadmap to defend.
            A few friends, a camera, a deck, a room — and the question of what happens
            when the floor and the music start to talk.
          </p>
          <p className="font-serif text-[18px] leading-relaxed text-[#a89786] mt-6">
            Maybe a loft in Brooklyn.
            <br />
            Maybe a backyard.
            <br />
            <span className="text-[#f4a261]">Maybe the playa.</span>
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
            If you build with computer vision and have always wanted it to do something tender —
          </p>
          <p className="font-serif text-[22px] leading-relaxed text-[#d4c4b0] mb-6">
            If you DJ, or love DJs, or just love a room that knows what it’s doing —
          </p>
          <p className="font-serif text-[22px] leading-relaxed text-[#d4c4b0] mb-6">
            If the burn is calling you, or a loft is, or a backyard is —
          </p>
          <p className="font-serif text-[22px] leading-relaxed text-[#f4a261]">
            Come play. The circle is small on purpose.
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
              See how we’d build it →
            </a>
            <a
              href="mailto:loricorpuz@gmail.com?subject=atune"
              className="font-mono text-[10px] uppercase tracking-[3px] text-[#d4c4b0] border border-[#2a1f18] px-5 py-3 hover:border-[#7a4a2a] transition-colors"
            >
              Tell me you’re in
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
          What we’d build, how it’d work, what it’d take.
        </h1>
        <p className="font-serif text-[17px] leading-relaxed text-[#a89786] max-w-2xl">
          From camera lens to MIDI cable, the honest constraints on music sources, and a back-of-napkin plan for getting it on the playa.
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

      {/* What we’d need */}
      <section className="border-t border-[#2a1f18] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7a4a2a] mb-3">
            What we’d need
          </p>
          <h2 className="font-serif text-[32px] text-[#f0e8de] mb-10">A short list of friends and things.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {NEEDS.map((n) => (
              <div key={n.role} className="border-t border-[#2a1f18] pt-6">
                <h3 className="font-serif text-[20px] text-[#f4a261] mb-2">{n.role}</h3>
                <p className="font-serif text-[15px] leading-relaxed text-[#a89786]">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* If we did this for the burn */}
      <section className="border-t border-[#2a1f18] py-20 bg-gradient-to-b from-[#0a0807] via-[#0e0a07] to-[#0a0807]">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[#7a4a2a] mb-3">
            If we did this for the burn
          </p>
          <h2 className="font-serif text-[32px] text-[#f0e8de] mb-3">
            A back-of-napkin plan for one night on the playa.
          </h2>
          <p className="font-serif text-[15px] leading-relaxed text-[#a89786] mb-12 max-w-2xl">
            Burning Man is roughly 14 weeks out. Tight, but doable if we move now. Here’s how it would sketch out — both the weeks and the wallet.
          </p>

          {/* Timeline */}
          <div className="mb-16">
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#7a4a2a] mb-6">
              Timeline
            </p>
            <div className="space-y-5">
              {PLAYA_TIMELINE.map((t) => (
                <div key={t.window} className="grid grid-cols-12 gap-6 border-l border-[#7a4a2a] pl-6 py-2">
                  <div className="col-span-12 md:col-span-3">
                    <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#f4a261]">
                      {t.window}
                    </p>
                  </div>
                  <div className="col-span-12 md:col-span-9">
                    <h3 className="font-serif text-[20px] text-[#f0e8de] mb-1">{t.title}</h3>
                    <p className="font-serif text-[14px] leading-relaxed text-[#a89786]">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Costs */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#7a4a2a] mb-6">
              Money
            </p>
            <div className="border border-[#2a1f18]">
              {PLAYA_COSTS.map((c, i) => (
                <div
                  key={c.item}
                  className={`grid grid-cols-12 gap-4 px-5 py-4 ${
                    i < PLAYA_COSTS.length - 1 ? 'border-b border-[#2a1f18]' : ''
                  }`}
                >
                  <div className="col-span-12 md:col-span-4">
                    <p className="font-serif text-[15px] text-[#f0e8de]">{c.item}</p>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <span className="font-mono text-[11px] text-[#f4a261]">{c.range}</span>
                  </div>
                  <p className="col-span-8 md:col-span-6 font-serif text-[14px] leading-relaxed text-[#a89786]">
                    {c.note}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#2a1f18] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#7a4a2a] mb-2">
                  Scrappy total
                </p>
                <p className="font-serif text-[24px] text-[#f0e8de]">~$4,500</p>
                <p className="font-serif text-[13px] leading-relaxed text-[#a89786] mt-2">
                  Borrowed gear, friend’s DJ rig, shared RV, modest PA. Most of the cost is just being on the playa.
                </p>
              </div>
              <div className="border border-[#7a4a2a] p-5 bg-[#1a120c]">
                <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#f4a261] mb-2">
                  Comfortable total
                </p>
                <p className="font-serif text-[24px] text-[#f4a261]">~$7,500 – $9,000</p>
                <p className="font-serif text-[13px] leading-relaxed text-[#d4c4b0] mt-2">
                  New camera, dedicated MIDI rig, rented sound, dust-proof cases. Less duct tape, more sleep.
                </p>
              </div>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#6a5a4c] mt-6">
              Split across two or three friends, this is a normal vacation budget — for something that almost no one has done.
            </p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-[#2a1f18] py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <a
            href="mailto:loricorpuz@gmail.com?subject=atune"
            className="inline-block font-mono text-[10px] uppercase tracking-[3px] text-[#0a0807] bg-[#f4a261] px-6 py-3 hover:bg-[#e8a06c] transition-colors"
          >
            Come play
          </a>
        </div>
      </section>
    </>
  )
}
