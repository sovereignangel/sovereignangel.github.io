'use client'

// Arete Technologies — The Long View (salon dashboard).
// Pre-launch invitation page. Brand source: Arete Technologies/salons/.
// Reached via aretetec.com/salons (middleware rewrites apex/www/legacy hosts to /arete/salons).

import { useState } from 'react'

const T = {
  ink: '#1a1815',
  cream: '#f4efe6',
  paper: '#ebe4d4',
  paperDeep: '#e0d6bb',
  bronze: '#7a5a2e',
  bronzeLight: '#a47e3e',
  night: '#13110e',
  wine: '#5a1f1d',
  wineLight: '#8a3a36',
  amber: '#c98a3a',
  ember: '#d6a25a',
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

const PRELAUNCH = {
  weekday: 'SATURDAY',
  dateLong: 'June 13, 2026',
  timeRange: '5 — 8 PM',
  city: 'NEW YORK',
  cap: 24,
  initialTaken: 4,
  speakers: [
    { roman: 'I', org: 'ASML', topic: 'The lithography frontier', confirmed: true },
    { roman: 'II', org: 'TBA', topic: 'Speaker to be announced', confirmed: false },
    { roman: 'III', org: 'TBA', topic: 'Speaker to be announced', confirmed: false },
  ] as const,
}

const PAGE_CSS = `
  .salon-root *, .salon-root *::before, .salon-root *::after { box-sizing: border-box; }
  .salon-root input::placeholder, .salon-root textarea::placeholder {
    color: rgba(244, 239, 230, 0.4); font-style: italic;
  }
  .salon-root ::selection { background: ${T.amber}; color: ${T.night}; }
`

export default function SalonsPage() {
  const [rsvpOpen, setRsvpOpen] = useState(false)
  const [taken, setTaken] = useState(PRELAUNCH.initialTaken)
  const [seats, setSeats] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [annOpen, setAnnOpen] = useState(false)
  const [annEmail, setAnnEmail] = useState('')
  const [annSubmitted, setAnnSubmitted] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTaken((t) => Math.min(PRELAUNCH.cap, t + seats))
    setSubmitted(true)
  }

  const submitAnnounce = (e: React.FormEvent) => {
    e.preventDefault()
    setAnnSubmitted(true)
  }

  const remaining = PRELAUNCH.cap - taken

  return (
    <div
      className="salon-root"
      style={{
        minHeight: '100vh',
        background: T.night,
        color: T.cream,
        padding: '20px 28px 24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: T.sans,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <Candlelight intensity={0.85} />
      <PatternColumns color={T.cream} opacity={0.03} size={90} />

      {/* TOP BAR */}
      <header
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
          paddingBottom: 14,
          borderBottom: `1px solid ${T.cream}1f`,
        }}
      >
        <a
          href="/"
          style={{
            color: T.cream,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 11,
          }}
        >
          <span
            style={{
              fontFamily: T.sans,
              fontSize: 11 * 0.7,
              letterSpacing: '0.42em',
              paddingLeft: '0.42em',
              fontWeight: 500,
            }}
          >
            ARETE
          </span>
          <span style={{ width: 1, height: 11, background: T.cream, opacity: 0.4 }} />
          <span
            style={{
              fontFamily: T.serif,
              fontSize: 22 * 0.7,
              fontStyle: 'italic',
              color: T.ember,
              lineHeight: 1,
            }}
          >
            The Long View
          </span>
        </a>
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: '0.42em',
            textTransform: 'uppercase',
            color: T.ember,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.ember }} />
          Pre-launch · First of the series
        </div>
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: '0.3em',
            opacity: 0.55,
            textTransform: 'uppercase',
          }}
        >
          aretetec.com · By invitation
        </div>
      </header>

      {/* MAIN */}
      <main
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* HERO */}
        <section
          style={{
            background:
              'linear-gradient(180deg, rgba(244,239,230,0.05) 0%, rgba(244,239,230,0) 100%)',
            border: `1px solid ${T.cream}1f`,
            padding: '36px 40px 28px',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: T.serif,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse 120% 70% at 50% 25%, ${T.amber}26 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 8,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: '0.5em',
                  paddingLeft: '0.5em',
                  color: T.ember,
                }}
              >
                NEXT
              </span>
              <span style={{ width: 28, height: 1, background: T.ember, opacity: 0.7 }} />
              <span
                style={{
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: T.cream,
                  opacity: 0.85,
                }}
              >
                Pre-launch event · first of the series
              </span>
            </div>

            <h1
              style={{
                fontFamily: T.serif,
                fontWeight: 400,
                lineHeight: 0.98,
                fontSize: 'clamp(48px, 6.4vw, 80px)',
                fontStyle: 'italic',
                color: T.cream,
                margin: '14px 0 22px',
                letterSpacing: '-0.01em',
              }}
            >
              The Long View<span style={{ color: T.ember }}>.</span>
            </h1>

            <figure
              style={{
                margin: '0 0 22px',
                maxWidth: 640,
                paddingLeft: 18,
                borderLeft: `1px solid ${T.ember}88`,
              }}
            >
              <blockquote
                style={{
                  margin: 0,
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(18px, 1.9vw, 22px)',
                  lineHeight: 1.45,
                  color: T.cream,
                  opacity: 0.92,
                }}
              >
                “The difficulty lies, not in the new ideas, but in escaping from the old ones.”
              </blockquote>
              <figcaption
                style={{
                  marginTop: 10,
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: '0.42em',
                  opacity: 0.6,
                  textTransform: 'uppercase',
                }}
              >
                — J. M. Keynes
              </figcaption>
            </figure>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <ThreeColumns size={42} color={T.ember} variant="classical" opacity={0.85} />
              <div
                style={{
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontSize: 15,
                  opacity: 0.75,
                  lineHeight: 1.4,
                  maxWidth: 360,
                }}
              >
                Three speakers. Ten minutes each. A panel. A long dinner.
              </div>
            </div>
          </div>
        </section>

        {/* EVENT DETAILS */}
        <section
          style={{
            border: `1px solid ${T.cream}1f`,
            padding: '26px 28px',
            background: `${T.cream}03`,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, auto) minmax(0, 1fr)',
            gap: 32,
            alignItems: 'start',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                padding: '18px 26px',
                borderTop: `1px solid ${T.ember}`,
                borderBottom: `1px solid ${T.ember}`,
              }}
            >
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: '0.42em',
                  opacity: 0.65,
                }}
              >
                {PRELAUNCH.weekday}
              </div>
              <div
                style={{
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(40px, 4.6vw, 56px)',
                  color: T.ember,
                  lineHeight: 1.05,
                  letterSpacing: '-0.01em',
                  marginTop: 10,
                }}
              >
                {PRELAUNCH.dateLong}
              </div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  letterSpacing: '0.4em',
                  opacity: 0.7,
                  marginTop: 12,
                }}
              >
                {PRELAUNCH.timeRange} · {PRELAUNCH.city}
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: '0.42em',
                opacity: 0.55,
                marginBottom: 12,
              }}
            >
              SPEAKERS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PRELAUNCH.speakers.map((sp) => (
                <div
                  key={sp.roman}
                  style={{
                    padding: '12px 12px',
                    borderTop: `1px solid ${sp.confirmed ? T.ember + 'aa' : T.cream + '22'}`,
                    opacity: sp.confirmed ? 1 : 0.65,
                  }}
                >
                  <div
                    style={{
                      fontFamily: T.serif,
                      fontStyle: 'italic',
                      fontSize: 20,
                      color: T.ember,
                      lineHeight: 1,
                    }}
                  >
                    {sp.roman}
                  </div>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 9,
                      letterSpacing: '0.3em',
                      opacity: 0.8,
                      marginTop: 10,
                      textTransform: 'uppercase',
                    }}
                  >
                    {sp.org}
                  </div>
                  <div
                    style={{
                      fontFamily: T.serif,
                      fontStyle: 'italic',
                      fontSize: 13,
                      marginTop: 4,
                      lineHeight: 1.3,
                      opacity: sp.confirmed ? 0.95 : 0.6,
                    }}
                  >
                    {sp.topic}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA ROW */}
        <section
          id="rsvp"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            padding: '8px 0 4px',
          }}
        >
          {!rsvpOpen && !submitted && !annOpen && !annSubmitted && (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={() => setRsvpOpen(true)}
                  style={{
                    background: T.wine,
                    color: T.cream,
                    padding: '14px 28px',
                    border: `1px solid ${T.wineLight}`,
                    cursor: 'pointer',
                    fontFamily: T.mono,
                    fontSize: 11,
                    letterSpacing: '0.42em',
                    textTransform: 'uppercase',
                  }}
                >
                  Request an Invitation →
                </button>
                <button
                  onClick={() => setAnnOpen(true)}
                  style={{
                    background: 'transparent',
                    color: T.cream,
                    padding: '14px 28px',
                    border: `1px solid ${T.cream}55`,
                    cursor: 'pointer',
                    fontFamily: T.mono,
                    fontSize: 11,
                    letterSpacing: '0.42em',
                    textTransform: 'uppercase',
                  }}
                >
                  Stay in the loop →
                </button>
              </div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: '0.32em',
                  opacity: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {remaining} of {PRELAUNCH.cap} seats remain
              </div>
            </>
          )}

          {rsvpOpen && !submitted && (
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                border: `1px solid ${T.ember}66`,
                padding: '24px 28px',
                background: `${T.wine}1f`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <TileHeader roman="I" label="L'INVITATION" title="Request an invitation" />
                <button
                  onClick={() => setRsvpOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: T.mono,
                    fontSize: 16,
                    color: T.cream,
                    opacity: 0.5,
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label="close"
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontSize: 14,
                  opacity: 0.78,
                  lineHeight: 1.5,
                  marginTop: 12,
                  paddingBottom: 14,
                  borderBottom: `1px solid ${T.cream}18`,
                }}
              >
                The salon is private. We confirm within forty-eight hours.
              </div>
              <form
                onSubmit={submit}
                style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <DashField
                  label="Name"
                  value={name}
                  onChange={setName}
                  placeholder="Full name"
                />
                <DashField
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  type="email"
                />
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: 8,
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      opacity: 0.6,
                    }}
                  >
                    Seats
                  </span>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${T.cream}55`,
                      padding: '6px 0',
                      fontFamily: T.serif,
                      fontSize: 14,
                      color: T.cream,
                      outline: 'none',
                    }}
                  >
                    <option value={1} style={{ color: T.ink }}>
                      1 — just me
                    </option>
                    <option value={2} style={{ color: T.ink }}>
                      2 — with guest
                    </option>
                  </select>
                </label>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 9,
                      letterSpacing: '0.3em',
                      opacity: 0.55,
                      textTransform: 'uppercase',
                    }}
                  >
                    {remaining}/{PRELAUNCH.cap} seats remain
                  </div>
                  <button
                    type="submit"
                    disabled={!name || !email}
                    style={{
                      background: T.wine,
                      color: T.cream,
                      padding: '12px 22px',
                      border: `1px solid ${T.wineLight}`,
                      cursor: !name || !email ? 'not-allowed' : 'pointer',
                      fontFamily: T.mono,
                      fontSize: 11,
                      letterSpacing: '0.32em',
                      textTransform: 'uppercase',
                      opacity: !name || !email ? 0.4 : 1,
                    }}
                  >
                    Submit →
                  </button>
                </div>
              </form>
            </div>
          )}

          {submitted && (
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                border: `1px solid ${T.ember}66`,
                background: `${T.wine}1f`,
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 12,
              }}
            >
              <Candle size={42} color={T.ember} lit />
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 22 }}>
                Reçu. Merci, {name.split(' ')[0] || 'ami'}.
              </div>
              <div
                style={{
                  fontFamily: T.serif,
                  fontSize: 13,
                  opacity: 0.75,
                  lineHeight: 1.5,
                  maxWidth: 320,
                }}
              >
                Your request is in. Confirmation arriving at {email} within 48 hours.
              </div>
            </div>
          )}

          {annOpen && !annSubmitted && (
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                border: `1px solid ${T.cream}33`,
                padding: '24px 28px',
                background: `${T.cream}04`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <TileHeader roman="II" label="L'ANNONCE" title="Stay in the loop" />
                <button
                  onClick={() => setAnnOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: T.mono,
                    fontSize: 16,
                    color: T.cream,
                    opacity: 0.5,
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label="close"
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontSize: 14,
                  opacity: 0.78,
                  lineHeight: 1.5,
                  marginTop: 12,
                  paddingBottom: 14,
                  borderBottom: `1px solid ${T.cream}18`,
                }}
              >
                Receive announcements for future salons. One short note a month, never more.
              </div>
              <form
                onSubmit={submitAnnounce}
                style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <DashField
                  label="Email for announcements"
                  value={annEmail}
                  onChange={setAnnEmail}
                  placeholder="you@example.com"
                  type="email"
                />
                <button
                  type="submit"
                  disabled={!annEmail}
                  style={{
                    background: 'transparent',
                    color: T.cream,
                    padding: '12px 22px',
                    border: `1px solid ${T.cream}55`,
                    cursor: !annEmail ? 'not-allowed' : 'pointer',
                    fontFamily: T.mono,
                    fontSize: 11,
                    letterSpacing: '0.32em',
                    textTransform: 'uppercase',
                    opacity: !annEmail ? 0.4 : 1,
                    alignSelf: 'flex-end',
                  }}
                >
                  Sign up →
                </button>
              </form>
            </div>
          )}

          {annSubmitted && (
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, opacity: 0.9 }}>
              Added. À bientôt.
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          paddingTop: 14,
          borderTop: `1px solid ${T.cream}1f`,
          fontFamily: T.mono,
          fontSize: 9,
          letterSpacing: '0.3em',
          opacity: 0.55,
          textTransform: 'uppercase',
        }}
      >
        <span>© MMXXVI · Arete Technologies</span>
        <span
          style={{
            fontFamily: T.serif,
            fontStyle: 'italic',
            textTransform: 'none',
            letterSpacing: 0,
            fontSize: 13,
            opacity: 0.9,
          }}
        >
          Eadem mutata resurgo
        </span>
        <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          ← Arete
        </a>
      </footer>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function TileHeader({
  roman,
  label,
  title,
}: {
  roman: string
  label: string
  title: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span
          style={{
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: 18,
            color: T.ember,
            lineHeight: 1,
          }}
        >
          {roman}
        </span>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.42em',
            opacity: 0.5,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: T.serif,
          fontStyle: 'italic',
          fontSize: 24,
          marginTop: 4,
          lineHeight: 1,
        }}
      >
        {title}
      </div>
    </div>
  )
}

function DashField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 8,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          opacity: 0.6,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${T.cream}55`,
          padding: '6px 0',
          fontFamily: T.serif,
          fontSize: 14,
          color: T.cream,
          outline: 'none',
        }}
      />
    </label>
  )
}

// ============================================================
// Brand sub-components
// ============================================================

function ThreeColumns({
  size = 100,
  color,
  opacity = 1,
  variant = 'classical',
}: {
  size?: number
  color?: string
  opacity?: number
  variant?: 'classical' | 'minimal' | 'capitals'
}) {
  const c = color || T.ink
  const stroke = { fill: 'none' as const, stroke: c, strokeLinecap: 'butt' as const }
  const s = { width: size, height: size, opacity }
  if (variant === 'minimal') {
    return (
      <svg viewBox="0 0 60 60" style={s}>
        <line x1="15" y1="14" x2="15" y2="48" {...stroke} strokeWidth={1.5} />
        <line x1="30" y1="10" x2="30" y2="48" {...stroke} strokeWidth={1.5} />
        <line x1="45" y1="14" x2="45" y2="48" {...stroke} strokeWidth={1.5} />
        <line x1="6" y1="50" x2="54" y2="50" {...stroke} strokeWidth={1} />
      </svg>
    )
  }
  if (variant === 'capitals') {
    return (
      <svg viewBox="0 0 60 60" style={s}>
        {[15, 30, 45].map((x) => (
          <g key={x}>
            <line x1={x - 4} y1={13} x2={x + 4} y2={13} {...stroke} strokeWidth={1} />
            <line x1={x - 3} y1={16} x2={x + 3} y2={16} {...stroke} strokeWidth={1} />
            <line x1={x} y1={16} x2={x} y2={46} {...stroke} strokeWidth={1.25} />
            <line x1={x - 4} y1={46} x2={x + 4} y2={46} {...stroke} strokeWidth={1} />
            <line x1={x - 5} y1={49} x2={x + 5} y2={49} {...stroke} strokeWidth={1} />
          </g>
        ))}
        <line x1="4" y1="52" x2="56" y2="52" {...stroke} strokeWidth={1} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 60 60" style={s}>
      {[14, 30, 46].map((x) => (
        <g key={x}>
          <line x1={x - 5} y1={12} x2={x + 5} y2={12} {...stroke} strokeWidth={1} />
          <path d={`M ${x - 4} 12 Q ${x - 5} 15 ${x - 4} 16`} {...stroke} strokeWidth={1} />
          <path d={`M ${x + 4} 12 Q ${x + 5} 15 ${x + 4} 16`} {...stroke} strokeWidth={1} />
          <path d={`M ${x - 3} 16 Q ${x - 3.4} 30 ${x - 3} 44`} {...stroke} strokeWidth={1} />
          <path d={`M ${x + 3} 16 Q ${x + 3.4} 30 ${x + 3} 44`} {...stroke} strokeWidth={1} />
          <line x1={x - 5} y1={44} x2={x + 5} y2={44} {...stroke} strokeWidth={1} />
          <line x1={x - 6} y1={47} x2={x + 6} y2={47} {...stroke} strokeWidth={1} />
        </g>
      ))}
      <line x1="2" y1="50" x2="58" y2="50" {...stroke} strokeWidth={1} />
      <line x1="0" y1="53" x2="60" y2="53" {...stroke} strokeWidth={1} opacity={0.4} />
    </svg>
  )
}

function Candle({
  size = 64,
  color,
  lit = true,
}: {
  size?: number
  color?: string
  lit?: boolean
}) {
  const c = color || T.ink
  return (
    <svg viewBox="0 0 64 80" style={{ width: size, height: size * 1.25 }}>
      {lit && (
        <>
          <path d="M 32 8 Q 28 18 32 24 Q 36 18 32 8 Z" fill={T.amber} opacity="0.85" />
          <path d="M 32 14 Q 30 20 32 23 Q 34 20 32 14 Z" fill={T.cream} opacity="0.9" />
        </>
      )}
      <line x1="32" y1="24" x2="32" y2="28" stroke={c} strokeWidth="1" />
      <rect x="28" y="28" width="8" height="44" fill="none" stroke={c} strokeWidth="1" />
      <path d="M 30 36 Q 28 42 30 46" fill="none" stroke={c} strokeWidth="0.75" opacity="0.6" />
      <rect x="24" y="72" width="16" height="3" fill="none" stroke={c} strokeWidth="1" />
    </svg>
  )
}

function Candlelight({ intensity = 1 }: { intensity?: number }) {
  const alpha = Math.round(intensity * 38).toString(16).padStart(2, '0')
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${T.amber}${alpha} 0%, transparent 60%)`,
      }}
    />
  )
}

function PatternColumns({
  color,
  opacity = 0.12,
  size = 60,
}: {
  color?: string
  opacity?: number
  size?: number
}) {
  const c = color || T.ink
  const id = `col-pattern-${size}-${Math.round(opacity * 1000)}`
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id={id} x="0" y="0" width={size} height={size} patternUnits="userSpaceOnUse">
          <line
            x1={size * 0.2}
            y1="0"
            x2={size * 0.2}
            y2={size}
            stroke={c}
            strokeWidth="0.5"
            opacity={opacity}
          />
          <line
            x1={size * 0.5}
            y1="0"
            x2={size * 0.5}
            y2={size}
            stroke={c}
            strokeWidth="0.5"
            opacity={opacity * 1.3}
          />
          <line
            x1={size * 0.8}
            y1="0"
            x2={size * 0.8}
            y2={size}
            stroke={c}
            strokeWidth="0.5"
            opacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
