'use client'

import { useState } from 'react'
import { C, display, text, Diamond, Label, MMark, StageGlyph } from './brand'

const STAGES: { glyph: 1 | 2 | 3 | 4; label: string; title: string; body: string }[] = [
  { glyph: 1, label: 'Stage One', title: 'Attention & Settling the Mind', body: 'Strengthening focus and awareness.' },
  { glyph: 2, label: 'Stage Two', title: 'Stability & Taming the Mind', body: 'Building steadiness and inner resilience.' },
  { glyph: 3, label: 'Stage Three', title: 'One-Pointedness & Equanimity', body: 'Deepening awareness. Resting as awareness itself.' },
  { glyph: 4, label: 'Stage Four', title: 'Flow & Peak Performance', body: 'Bringing practice into life and performing at your highest.' },
]

const TEACHERS = [
  {
    name: 'Lev Brie',
    role: 'Facilitator',
    photo: '/mahamudra/lev-brie.jpg',
    bio: 'A technologist and teacher — engineering and product executive, startup founder, and adjunct professor of computer science at Columbia University. He leads the weekly practice in New York and is authorized to teach Mahāmudrā foundations by Dustin DiPerna.',
  },
  {
    name: 'Dustin DiPerna',
    role: 'Lineage & Authorization',
    photo: '/mahamudra/dustin-diperna.jpg',
    bio: 'A Harvard-trained scholar of world religions and senior teacher in the Pointing Out Way lineage of Mahāmudrā and Dzogchen, recognized by Daniel P. Brown, with whom he studied for sixteen years. He is the author of Streams of Wisdom, Evolution’s Ally, and Earth is Eden.',
  },
]

const NAV = [
  { href: '#practice', label: 'Practice' },
  { href: '#study', label: 'Study' },
  { href: '#path', label: 'The Path' },
  { href: '#teachers', label: 'Teachers' },
]

const INTERESTS: { key: string; label: string }[] = [
  { key: 'sundays', label: 'Sunday teachings · Brooklyn' },
  { key: 'text-study', label: 'Text study circle' },
  { key: 'retreat-2027', label: '2027 retreat' },
]

export default function MahamudraPage() {
  const [email, setEmail] = useState('')
  const [interests, setInterests] = useState<string[]>(['sundays'])
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  function toggleInterest(key: string) {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/mahamudra/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), interests }),
      })
      setSent(true)
    } catch {
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  const hairline = { borderTop: `1px solid ${C.borderSoft}` }

  return (
    <div
      style={{
        fontFamily: text,
        color: C.ink,
        background: `radial-gradient(130% 100% at 25% 0%, ${C.parchment} 0%, ${C.parchmentMid} 40%, ${C.agedEdge} 100%)`,
        position: 'relative',
      }}
    >
      {/* aged-edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{ boxShadow: 'inset 0 0 260px 60px rgba(122,96,48,0.30), inset 0 0 60px rgba(122,96,48,0.18)' }}
        aria-hidden
      />
      {/* paper speckle */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          opacity: 0.35,
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(150,120,60,0.16) 0 1.5px, transparent 2px), radial-gradient(circle at 62% 71%, rgba(150,120,60,0.13) 0 2px, transparent 2.5px), radial-gradient(circle at 84% 34%, rgba(120,95,45,0.10) 0 1px, transparent 1.6px)',
          backgroundSize: '140px 160px, 210px 190px, 90px 110px',
        }}
        aria-hidden
      />

      {/* Header — stays in view on scroll */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-x-8 gap-y-3 flex-wrap"
        style={{
          padding: '18px clamp(24px, 6vw, 92px)',
          borderBottom: `1px solid ${C.borderSoft}`,
          background: 'rgba(247,236,212,0.92)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <a href="#top" className="flex items-center gap-3.5">
          <MMark />
          <span
            className="uppercase"
            style={{ fontFamily: display, fontSize: 19, letterSpacing: '0.30em', color: C.indigo }}
          >
            Mahāmudrā NYC
          </span>
        </a>
        <nav
          className="flex flex-wrap items-center uppercase"
          style={{ gap: 'clamp(10px, 1.8vw, 22px)', fontFamily: display, fontSize: 12, letterSpacing: '0.16em', color: C.inkSoft }}
        >
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:opacity-70">
              {n.label}
            </a>
          ))}
          <a href="#join" style={{ color: C.indigo }}>
            Join
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section
        id="top"
        className="relative z-[4]"
        style={{ padding: 'clamp(32px, 5vw, 72px) clamp(20px, 5vw, 80px) clamp(42px, 5.5vw, 84px)' }}
      >
        {/* etched mountain artwork, pressed into the paper */}
        <div
          className="absolute left-0 right-0 bottom-0 z-0"
          style={{
            height: '52%',
            opacity: 0.5,
            mixBlendMode: 'multiply',
            backgroundImage: 'url(/mahamudra/mountain.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            maskImage: 'linear-gradient(to bottom, transparent, black 30%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%)',
          }}
          aria-hidden
        />

        <div
          className="relative z-[2] mx-auto"
          style={{ maxWidth: 1100, border: `1px solid ${C.border}`, padding: 'clamp(28px, 4vw, 58px)' }}
        >
          <div
            className="text-center"
            style={{ border: `1px solid ${C.borderSoft}`, padding: 'clamp(20px, 3.5vw, 48px) clamp(20px, 4vw, 56px)' }}
          >
            <div style={{ marginBottom: 'clamp(18px, 3vw, 30px)' }}>
              <Diamond />
            </div>

            <h1
              className="uppercase"
              style={{
                fontFamily: display,
                fontWeight: 600,
                color: C.indigo,
                fontSize: 'clamp(46px, 9vw, 124px)',
                lineHeight: 0.92,
                letterSpacing: '0.02em',
                margin: 0,
              }}
            >
              Mahāmudrā
            </h1>
            <div
              className="uppercase"
              style={{ fontFamily: display, fontSize: 'clamp(20px, 3.2vw, 40px)', letterSpacing: '0.44em', color: C.indigo, marginTop: 10 }}
            >
              New York
            </div>

            <div style={{ margin: 'clamp(22px, 3.4vw, 38px) 0' }}>
              <Diamond color={C.bronze} size={6} line={54} />
            </div>

            <p
              className="uppercase"
              style={{ fontFamily: display, fontSize: 'clamp(15px, 1.7vw, 21px)', letterSpacing: '0.30em', color: C.inkSoft, margin: 0 }}
            >
              A theory &amp; practice community
              <br />
              <span className="whitespace-nowrap">for meditation &amp; awareness</span>
            </p>

            <p
              style={{ maxWidth: 620, margin: 'clamp(26px, 4vw, 42px) auto 0', fontSize: 'clamp(17px, 1.7vw, 22px)', lineHeight: 1.62, color: C.ink }}
            >
              We study the foundations of Mahāmudrā and the path of awareness —
              from attention to open presence, and from practice to peak
              experience. Sunday sittings in Brooklyn.
            </p>

            <div className="flex flex-wrap gap-4 justify-center" style={{ marginTop: 'clamp(28px, 4vw, 44px)' }}>
              <a
                href="#join"
                className="uppercase transition-opacity hover:opacity-85"
                style={{
                  fontFamily: display,
                  fontSize: 14,
                  letterSpacing: '0.26em',
                  color: C.cream,
                  background: C.indigo,
                  padding: '15px 30px',
                  boxShadow: `0 0 0 1px ${C.gold} inset`,
                }}
              >
                Begin practicing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Practice */}
      <section
        id="practice"
        className="relative z-[4]"
        style={{ padding: 'clamp(48px, 7vw, 100px) clamp(24px, 6vw, 92px)', ...hairline }}
      >
        <div
          className="mx-auto grid items-start"
          style={{ maxWidth: 1100, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(30px, 5vw, 72px)' }}
        >
          <div>
            <div style={{ marginBottom: 16 }}>
              <Label>Sundays in Brooklyn</Label>
            </div>
            <h2
              style={{ fontFamily: display, fontWeight: 500, color: C.indigo, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.06, margin: '0 0 20px', letterSpacing: '0.01em' }}
            >
              Practice held in one place, at one hour, together.
            </h2>
            <p style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', lineHeight: 1.65, margin: 0 }}>
              Sessions run thirty minutes: a ten-minute teaching, ten to twenty
              minutes of meditation, then reflection and discussion. No
              experience is required, and no one is asked to believe anything.
            </p>
          </div>
          <div>
            <div
              className="flex justify-between items-baseline gap-5"
              style={{ padding: '18px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
            >
              <div>
                <div className="uppercase" style={{ fontFamily: display, fontSize: 15, letterSpacing: '0.28em', color: C.indigo }}>
                  Sunday
                </div>
                <div style={{ fontSize: 17, color: C.inkSoft }}>Sitting, teaching &amp; discussion — Brooklyn</div>
              </div>
              <div style={{ fontFamily: display, fontSize: 17, letterSpacing: '0.14em', color: C.bronze, whiteSpace: 'nowrap' }}>
                Weekly
              </div>
            </div>
            <p style={{ fontSize: 15, color: C.inkMuted, fontStyle: 'italic', margin: '16px 0 0' }}>
              Exact time and address arrive by email — join the list below.
            </p>
          </div>
        </div>
      </section>

      {/* Foundations Study Circle */}
      <section
        id="study"
        className="relative z-[4]"
        style={{ padding: 'clamp(48px, 7vw, 100px) clamp(24px, 6vw, 92px)', ...hairline }}
      >
        <div
          className="mx-auto grid items-start"
          style={{ maxWidth: 1100, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(30px, 5vw, 72px)' }}
        >
          <div>
            <div style={{ marginBottom: 16 }}>
              <Label>Foundations study circle</Label>
            </div>
            <h2
              style={{ fontFamily: display, fontWeight: 500, color: C.indigo, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.06, margin: '0 0 20px', letterSpacing: '0.01em' }}
            >
              Read the texts. Test them against life.
            </h2>
            <p style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', lineHeight: 1.65, margin: 0 }}>
              A commitment-based study circle for those who want to go deeper
              than a weekly sit. Each week we take one chapter of a core
              Mahāmudrā text as a case study — close reading, interpretation,
              and honest discussion of how it lands in lived experience.
            </p>
          </div>
          <div>
            <div
              className="flex justify-between items-baseline gap-5"
              style={{ padding: '18px 0', borderTop: `1px solid ${C.border}` }}
            >
              <div>
                <div className="uppercase" style={{ fontFamily: display, fontSize: 15, letterSpacing: '0.28em', color: C.indigo }}>
                  Rhythm
                </div>
                <div style={{ fontSize: 17, color: C.inkSoft }}>Weekly — one chapter per session</div>
              </div>
            </div>
            <div
              className="flex justify-between items-baseline gap-5"
              style={{ padding: '18px 0', borderTop: `1px solid ${C.border}` }}
            >
              <div>
                <div className="uppercase" style={{ fontFamily: display, fontSize: 15, letterSpacing: '0.28em', color: C.indigo }}>
                  Method
                </div>
                <div style={{ fontSize: 17, color: C.inkSoft }}>Meaning, interpretation &amp; lived experience</div>
              </div>
            </div>
            <div
              className="flex justify-between items-baseline gap-5"
              style={{ padding: '18px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
            >
              <div>
                <div className="uppercase" style={{ fontFamily: display, fontSize: 15, letterSpacing: '0.28em', color: C.indigo }}>
                  Convened by
                </div>
                <div style={{ fontSize: 17, color: C.inkSoft }}>Lori Corpuz — scholar &amp; practitioner</div>
              </div>
            </div>
            <p style={{ fontSize: 15, color: C.inkMuted, fontStyle: 'italic', margin: '16px 0 0', lineHeight: 1.6 }}>
              A note on authority: this circle is convened by a fellow student,
              not an authorized teacher. We read as peers; formal instruction in
              the lineage rests with Lev and his teachers.
            </p>
          </div>
        </div>
      </section>

      {/* The Path */}
      <section
        id="path"
        className="relative z-[4]"
        style={{ padding: 'clamp(48px, 7vw, 100px) clamp(24px, 6vw, 92px)', ...hairline }}
      >
        <div className="mx-auto" style={{ maxWidth: 1240 }}>
          <div className="text-center" style={{ marginBottom: 'clamp(34px, 5vw, 62px)' }}>
            <div style={{ marginBottom: 14 }}>
              <Label>The path of awareness</Label>
            </div>
            <h2
              style={{ fontFamily: display, fontWeight: 500, color: C.indigo, fontSize: 'clamp(30px, 4.4vw, 58px)', lineHeight: 1.04, margin: 0, letterSpacing: '0.01em' }}
            >
              Four stages, one continuous practice
            </h2>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'clamp(16px, 2vw, 26px)' }}>
            {STAGES.map((s) => (
              <article
                key={s.label}
                className="text-center grid content-start"
                style={{
                  border: `1px solid ${C.border}`,
                  background: 'rgba(255,248,228,0.42)',
                  padding: '26px 22px',
                  gap: 16,
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.35) inset',
                }}
              >
                <div className="uppercase" style={{ fontFamily: display, fontSize: 15, letterSpacing: '0.30em', color: C.indigo }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: display, fontSize: 23, lineHeight: 1.2, color: C.indigo }}>{s.title}</div>
                <div className="flex items-center justify-center" style={{ height: 96, border: `1px solid rgba(120,95,45,0.3)` }}>
                  <StageGlyph stage={s.glyph} size={52} />
                </div>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: C.inkSoft }}>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* The First Gathering */}
      <section
        id="first-gathering"
        className="relative z-[4]"
        style={{ padding: 'clamp(48px, 7vw, 100px) clamp(24px, 6vw, 92px)', ...hairline }}
      >
        <div className="mx-auto text-center" style={{ maxWidth: 860 }}>
          <div style={{ marginBottom: 14 }}>
            <Label>The first gathering</Label>
          </div>
          <h2
            style={{ fontFamily: display, fontWeight: 500, color: C.indigo, fontSize: 'clamp(28px, 4vw, 50px)', lineHeight: 1.06, margin: '0 0 28px', letterSpacing: '0.01em' }}
          >
            Peak State · Frederiksværk, Denmark · 2026
          </h2>
          <div className="mx-auto" style={{ maxWidth: 780, border: `1px solid ${C.border}`, padding: 8, background: 'rgba(255,248,228,0.42)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mahamudra/first-class.jpg"
              alt="The first class, gathered at Peak State in Frederiksværk, Denmark, 2026"
              className="w-full block"
              style={{ border: `1px solid ${C.borderSoft}` }}
            />
          </div>
          <p style={{ fontSize: 16, fontStyle: 'italic', color: C.inkMuted, margin: '18px 0 0' }}>
            The first class, gathered for four days of practice in August 2026.
          </p>
        </div>
      </section>

      {/* Teachers */}
      <section
        id="teachers"
        className="relative z-[4]"
        style={{ padding: 'clamp(48px, 7vw, 100px) clamp(24px, 6vw, 92px)', ...hairline }}
      >
        <div
          className="mx-auto grid"
          style={{ maxWidth: 1000, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(30px, 5vw, 64px)' }}
        >
          {TEACHERS.map((t) => (
            <div key={t.name} className="grid" style={{ gap: 18 }}>
              <div style={{ height: 300, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.photo}
                  alt={t.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 20%', filter: 'sepia(0.28) saturate(0.85)' }}
                />
              </div>
              <div>
                <div className="uppercase" style={{ fontFamily: display, fontSize: 28, letterSpacing: '0.10em', color: C.indigo }}>
                  {t.name}
                </div>
                <div className="uppercase" style={{ fontFamily: display, fontSize: 13, letterSpacing: '0.28em', color: C.bronze, margin: '6px 0 12px' }}>
                  {t.role}
                </div>
                <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: C.inkSoft }}>{t.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Join */}
      <section
        id="join"
        className="relative z-[4] text-center"
        style={{ padding: 'clamp(52px, 8vw, 110px) clamp(24px, 6vw, 92px)', ...hairline }}
      >
        <div className="mx-auto" style={{ maxWidth: 620 }}>
          <div style={{ marginBottom: 28 }}>
            <Diamond size={8} line={60} />
          </div>
          <h2 style={{ fontFamily: display, fontWeight: 500, color: C.indigo, fontSize: 'clamp(30px, 4.4vw, 56px)', lineHeight: 1.05, margin: '0 0 18px' }}>
            Sit with us
          </h2>
          <p style={{ fontSize: 'clamp(17px, 1.6vw, 21px)', lineHeight: 1.6, margin: '0 0 26px' }}>
            One note a month: practice times, retreat news, nothing else. Tell
            us what calls you.
          </p>
          {sent ? (
            <p
              className="uppercase"
              style={{ fontFamily: display, fontSize: 15, letterSpacing: '0.26em', color: C.bronze }}
            >
              Received — welcome
            </p>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-wrap gap-3 justify-center">
              <div className="w-full flex flex-wrap gap-3 justify-center" style={{ marginBottom: 6 }}>
                {INTERESTS.map((it) => {
                  const active = interests.includes(it.key)
                  return (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => toggleInterest(it.key)}
                      className="uppercase cursor-pointer transition-opacity hover:opacity-85"
                      style={{
                        fontFamily: display,
                        fontSize: 13,
                        letterSpacing: '0.22em',
                        padding: '11px 20px',
                        color: active ? C.cream : C.inkSoft,
                        background: active ? C.indigo : 'transparent',
                        border: 'none',
                        boxShadow: active ? `0 0 0 1px ${C.gold} inset` : `0 0 0 1px ${C.border} inset`,
                      }}
                    >
                      {active ? '◆ ' : ''}
                      {it.label}
                    </button>
                  )
                })}
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="outline-none"
                style={{
                  fontFamily: text,
                  fontSize: 17,
                  padding: '15px 18px',
                  minWidth: 260,
                  flex: '1 1 260px',
                  background: 'rgba(255,250,234,0.7)',
                  border: `1px solid ${C.border}`,
                  color: C.ink,
                }}
              />
              <button
                type="submit"
                disabled={sending}
                className="uppercase cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{
                  fontFamily: display,
                  fontSize: 14,
                  letterSpacing: '0.26em',
                  color: C.cream,
                  background: C.indigo,
                  border: 'none',
                  padding: '16px 30px',
                }}
              >
                {sending ? 'Sending' : 'Join'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-[4] flex flex-wrap items-center justify-between"
        style={{ padding: 'clamp(34px, 5vw, 56px) clamp(24px, 6vw, 92px)', gap: 22, ...hairline }}
      >
        <div className="flex items-center gap-3.5">
          <MMark size={30} />
          <span className="uppercase" style={{ fontFamily: display, fontSize: 14, letterSpacing: '0.28em', color: C.indigo }}>
            Mahāmudrā NYC
          </span>
        </div>
        <div className="uppercase" style={{ fontFamily: display, fontSize: 14, letterSpacing: '0.34em', color: C.bronze }}>
          Practice deeply. Live clearly.
        </div>
        <div style={{ fontSize: 15, color: C.inkMuted }}>
          <a href="#top" className="hover:opacity-70">New York City</a>
        </div>
      </footer>
    </div>
  )
}
