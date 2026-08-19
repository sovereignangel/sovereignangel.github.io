import Link from 'next/link'
import { C, display, text, Diamond, Ridgeline, Label } from './brand'

const STAGES = [
  {
    title: 'Attention',
    sub: 'Settling the Mind',
    body: 'Strengthening focus and awareness. The breath as anchor; the mind returns.',
  },
  {
    title: 'Stability',
    sub: 'Taming the Mind',
    body: 'Building steadiness and inner resilience. Distraction loses its grip.',
  },
  {
    title: 'One-Pointedness',
    sub: 'Composure & Equanimity',
    body: 'Deepening awareness. Resting as awareness itself, without effort.',
  },
  {
    title: 'Open Presence',
    sub: 'Flow & Peak Performance',
    body: 'Bringing practice into life and performing at your highest.',
  },
]

export default function MahamudraPage() {
  return (
    <main
      className="min-h-screen py-6 px-4 sm:py-10 sm:px-8"
      style={{
        backgroundColor: C.parchment,
        backgroundImage: `radial-gradient(ellipse at center, ${C.parchmentLight} 0%, ${C.parchment} 55%, ${C.parchmentDeep} 100%)`,
        color: C.sepia,
        fontFamily: text,
      }}
    >
      {/* Double-rule frame */}
      <div className="max-w-[860px] mx-auto p-[3px]" style={{ border: `1px solid ${C.aubergine}` }}>
        <div className="px-5 py-12 sm:px-12 sm:py-16" style={{ border: `1px solid ${C.aubergine}55` }}>

          {/* Masthead */}
          <header className="relative text-center mb-14">
            <Ridgeline />
            <div className="relative">
              <Diamond />
              <h1
                className="mt-8 mb-4"
                style={{
                  fontFamily: display,
                  fontSize: 'clamp(38px, 8vw, 64px)',
                  letterSpacing: '0.08em',
                  color: C.aubergine,
                  fontWeight: 500,
                  lineHeight: 1.1,
                }}
              >
                MAHĀMUDRĀ
              </h1>
              <Label color={C.sepia} size={12}>A Community of Practice</Label>
              <div className="mt-2">
                <Label size={10}>Brooklyn · New York</Label>
              </div>
              <div className="mt-8">
                <Diamond />
              </div>
            </div>
          </header>

          {/* What is Mahamudra */}
          <section className="max-w-[560px] mx-auto text-center mb-16">
            <p className="text-[17px] leading-[1.7] mb-4">
              Mahāmudrā — the Great Seal — is a contemplative tradition of Tibetan
              Buddhism: a complete path of awareness, from training attention to
              resting in open presence. The practice is simple and demanding —
              the mind settles, steadies, clarifies, and finally recognizes its
              own nature.
            </p>
            <p className="text-[17px] leading-[1.7] italic" style={{ color: C.sepiaMuted }}>
              From attention to open presence, and from practice to peak experience.
            </p>
          </section>

          {/* The Path — column cards */}
          <section className="mb-16">
            <Label color={C.aubergine} size={13}>The Path</Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {STAGES.map((s, i) => (
                <div
                  key={s.title}
                  className="px-3 py-5 text-center flex flex-col"
                  style={{ border: `1px solid ${C.bronze}66`, backgroundColor: `${C.parchmentLight}99` }}
                >
                  <div style={{ fontFamily: display, fontSize: 10, letterSpacing: '0.24em', color: C.sepiaMuted }}>
                    {`STAGE ${i + 1}`}
                  </div>
                  <div
                    className="mt-2 uppercase"
                    style={{ fontFamily: display, fontSize: 13, letterSpacing: '0.1em', color: C.aubergine }}
                  >
                    {s.title}
                  </div>
                  <div className="mt-1 italic text-[13px]" style={{ color: C.sepiaMuted }}>
                    {s.sub}
                  </div>
                  <p className="mt-3 text-[14px] leading-[1.55] flex-1">{s.body}</p>
                  <div className="mt-4">
                    <Diamond color={C.bronze} width={40} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Teacher & lineage */}
          <section className="text-center mb-16">
            <Diamond color={C.bronze} />
            <div className="mt-8">
              <Label>Foundations Taught By</Label>
              <div
                className="mt-2 uppercase"
                style={{ fontFamily: display, fontSize: 24, letterSpacing: '0.14em', color: C.aubergine }}
              >
                Lev Brie
              </div>
              <div className="mt-4">
                <Label>Authorized to Teach Foundations By</Label>
              </div>
              <div
                className="mt-2 uppercase"
                style={{ fontFamily: display, fontSize: 16, letterSpacing: '0.14em', color: C.sepia }}
              >
                Dustin DiPerna
              </div>
            </div>
            <p className="max-w-[480px] mx-auto mt-6 text-[15px] leading-[1.7]" style={{ color: C.sepiaMuted }}>
              Teachings follow the traditional Mahāmudrā progression, offered
              plainly and without ornament. The first foundations series was
              taught in August 2026; recordings are available to its
              participants below.
            </p>
          </section>

          {/* Sunday Sits — inverted panel (gathering) */}
          <section className="mb-12">
            <div
              className="max-w-[560px] mx-auto px-6 py-10 text-center"
              style={{ backgroundColor: C.aubergineDeep, border: `1px solid ${C.aubergine}` }}
            >
              <Label color={C.gold} size={13}>Sunday Sits · Brooklyn</Label>
              <div className="my-4">
                <Diamond color={C.gold} width={60} />
              </div>
              <p className="text-[16px] leading-[1.7]" style={{ color: `${C.gold}dd` }}>
                A small in-person community, forming now. We meet on Sundays in
                Brooklyn — a short teaching, a sit together, and discussion.
                Beginners are welcome; consistency matters more than experience.
              </p>
              <a
                href="mailto:loricorpuz@gmail.com?subject=Sunday%20Sits%20%C2%B7%20Brooklyn"
                className="inline-block mt-6 px-6 py-2 uppercase transition-opacity hover:opacity-80"
                style={{
                  fontFamily: display,
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  color: C.gold,
                  border: `1px solid ${C.gold}88`,
                }}
              >
                Request a Seat
              </a>
            </div>
          </section>

          {/* Daily practice */}
          <section className="text-center mb-16">
            <Label color={C.aubergine} size={12}>Daily Practice</Label>
            <p className="mt-3 text-[15px]" style={{ color: C.sepiaMuted }}>
              Thirty minutes in total
            </p>
            <div className="mt-3 text-[15px] leading-[1.9]">
              <div>Ten-minute teaching</div>
              <div>Ten to twenty minutes of meditation</div>
              <div>Reflection &amp; discussion</div>
            </div>
          </section>

          {/* Recordings + retreats */}
          <section className="grid sm:grid-cols-2 gap-3 max-w-[640px] mx-auto mb-16">
            <Link
              href="/mahamudra/recordings"
              className="block px-5 py-6 text-center transition-colors hover:bg-white/30"
              style={{ border: `1px solid ${C.aubergine}88` }}
            >
              <Label color={C.aubergine} size={12}>Recordings</Label>
              <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: C.sepiaMuted }}>
                The First Series — three sessions, for participants. Enter with
                your access word.
              </p>
            </Link>
            <div className="px-5 py-6 text-center" style={{ border: `1px solid ${C.bronze}66` }}>
              <Label color={C.aubergine} size={12}>Retreats</Label>
              <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: C.sepiaMuted }}>
                Peak State — days of meditation and exploration. The second
                gathering met in Frederiksværk, Denmark, August 2026.
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center">
            <Diamond />
            <div className="mt-6">
              <Label color={C.sepia} size={11}>Practice Deeply · Live Clearly</Label>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}
