'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  { href: '#path', label: 'The Path' },
  { href: '#retreat', label: 'Retreat' },
  { href: '#teachers', label: 'Teachers' },
]

export default function MahamudraPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/mahamudra/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
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
        overflow: 'hidden',
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

      {/* Header */}
      <header
        className="relative z-[5] flex items-center justify-between gap-8 flex-wrap"
        style={{ padding: '26px clamp(24px, 6vw, 92px)', borderBottom: `1px solid ${C.borderSoft}` }}
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
          style={{ gap: 'clamp(14px, 3vw, 40px)', fontFamily: display, fontSize: 14, letterSpacing: '0.24em', color: C.inkSoft }}
        >
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:opacity-70">
              {n.label}
            </a>
          ))}
          <Link href="/mahamudra/recordings" className="transition-colors hover:opacity-70">
            Recordings
          </Link>
          <a href="#join" style={{ color: C.indigo }}>
            Join
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section
        id="top"
        className="relative z-[4]"
        style={{ padding: 'clamp(46px, 7vw, 104px) clamp(20px, 5vw, 80px) clamp(60px, 8vw, 120px)' }}
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
            style={{ border: `1px solid ${C.borderSoft}`, padding: 'clamp(26px, 5vw, 70px) clamp(20px, 4vw, 56px)' }}
          >
            <div style={{ marginBottom: 'clamp(24px, 4vw, 42px)' }}>
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
              A practice community for meditation &amp; awareness
            </p>

            <p
              style={{ maxWidth: 620, margin: 'clamp(26px, 4vw, 42px) auto 0', fontSize: 'clamp(17px, 1.7vw, 22px)', lineHeight: 1.62, color: C.ink }}
            >
              We study the foundations of Mahāmudrā and the path of awareness —
              from attention to open presence, and from practice to peak
              experience. Sunday sittings in Brooklyn, and one long retreat each
              summer.
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
              <a
                href="#retreat"
                className="uppercase transition-opacity hover:opacity-70"
                style={{
                  fontFamily: display,
                  fontSize: 14,
                  letterSpacing: '0.26em',
                  color: C.indigo,
                  padding: '15px 30px',
                  boxShadow: `0 0 0 1px ${C.border} inset`,
                }}
              >
                Peak State II →
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

      {/* Retreat */}
      <section
        id="retreat"
        className="relative z-[4]"
        style={{ padding: 'clamp(48px, 7vw, 100px) clamp(24px, 6vw, 92px)', ...hairline }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: 1140,
            background: `linear-gradient(165deg, ${C.indigo} 0%, ${C.indigoDeep} 100%)`,
            color: C.parchmentMid,
            padding: 'clamp(28px, 4vw, 56px)',
            boxShadow: `0 0 0 1px ${C.gold} inset, 0 26px 60px -30px rgba(40,28,74,0.7)`,
          }}
        >
          <div
            className="grid items-start"
            style={{
              border: '1px solid rgba(198,166,90,0.45)',
              padding: 'clamp(26px, 4vw, 54px)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'clamp(30px, 5vw, 64px)',
            }}
          >
            <div>
              <div style={{ marginBottom: 18 }}>
                <Label color={C.goldSoft} size={13} tracking="0.34em">Summer retreat</Label>
              </div>
              <h2
                className="uppercase"
                style={{ fontFamily: display, fontWeight: 600, fontSize: 'clamp(38px, 6vw, 74px)', lineHeight: 0.95, margin: '0 0 14px', letterSpacing: '0.02em', color: C.panelTitle }}
              >
                Peak State II
              </h2>
              <p
                className="uppercase"
                style={{ fontFamily: display, fontSize: 'clamp(15px, 1.6vw, 20px)', letterSpacing: '0.26em', margin: '0 0 26px', color: C.goldSoft }}
              >
                A week of meditation &amp; exploration
              </p>
              <div className="grid" style={{ gap: 4, marginBottom: 26 }}>
                <div style={{ fontFamily: display, fontSize: 'clamp(20px, 2.4vw, 30px)', letterSpacing: '0.16em' }}>
                  August 3 – 7, 2026
                </div>
                <div className="uppercase" style={{ fontFamily: display, fontSize: 15, letterSpacing: '0.26em', color: C.panelMuted }}>
                  Frederiksværk, Denmark
                </div>
              </div>
              <p style={{ fontSize: 'clamp(17px, 1.6vw, 21px)', lineHeight: 1.6, margin: '0 0 18px', color: C.panelText }}>
                Four days examining the foundations of Mahāmudrā and the path of
                awareness — from attention to open presence, and from practice
                to peak experience.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 30px', color: C.panelMuted, fontStyle: 'italic' }}>
                The first gathering met in Frederiksværk in August 2026. The
                next is announced to the list first.
              </p>
              <div className="flex flex-wrap" style={{ gap: 28 }}>
                <div>
                  <Label color={C.goldMuted} size={12} tracking="0.30em">Facilitated by</Label>
                  <div className="uppercase" style={{ fontFamily: display, fontSize: 24, letterSpacing: '0.10em', color: C.panelTitle }}>
                    Lev Brie
                  </div>
                </div>
                <div>
                  <Label color={C.goldMuted} size={12} tracking="0.30em">Authorized by</Label>
                  <div className="uppercase" style={{ fontFamily: display, fontSize: 24, letterSpacing: '0.10em', color: C.panelTitle }}>
                    Dustin DiPerna
                  </div>
                </div>
              </div>
            </div>
            <div className="grid" style={{ gap: 26 }}>
              <div style={{ border: '1px solid rgba(198,166,90,0.4)', padding: '22px 24px' }}>
                <div style={{ marginBottom: 12 }}>
                  <Label color={C.goldSoft} size={14} tracking="0.28em">Daily practice</Label>
                </div>
                <div style={{ fontSize: 17, lineHeight: 1.7, color: C.panelText }}>30 minutes in total</div>
                <div className="grid" style={{ gap: 6, marginTop: 10, fontSize: 16, color: C.panelMuted }}>
                  <div>10 minute teaching</div>
                  <div>10–20 minute meditation</div>
                  <div>Reflection &amp; discussion</div>
                </div>
              </div>
              <div style={{ border: '1px solid rgba(198,166,90,0.4)', padding: '22px 24px' }}>
                <div style={{ marginBottom: 12 }}>
                  <Label color={C.goldSoft} size={14} tracking="0.28em">Deep dive (optional)</Label>
                </div>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: C.panelMuted }}>
                  30 minutes for those exploring Mahāmudrā in greater depth.
                </p>
              </div>
              <div className="grid grid-cols-2" style={{ gap: 14 }}>
                {['/mahamudra/poster-i.jpg', '/mahamudra/poster-ii.jpg'].map((src) => (
                  <div key={src} style={{ height: 190, border: '1px solid rgba(198,166,90,0.4)', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="Peak State II poster"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                ))}
              </div>
              <a
                href="#join"
                className="uppercase text-center transition-opacity hover:opacity-85"
                style={{ fontFamily: display, fontSize: 14, letterSpacing: '0.26em', color: C.indigo, background: C.goldLight, padding: '16px 28px' }}
              >
                Request a place
              </a>
            </div>
          </div>
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
          <p style={{ fontSize: 'clamp(17px, 1.6vw, 21px)', lineHeight: 1.6, margin: '0 0 30px' }}>
            One note a month: practice times, retreat news, nothing else.
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
          {' · '}
          <a href="#retreat" className="hover:opacity-70">Denmark</a>
          {' · '}
          <Link href="/mahamudra/recordings" className="hover:opacity-70">Recordings</Link>
        </div>
      </footer>
    </div>
  )
}
