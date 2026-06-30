'use client'

import { useEffect, useState } from 'react'

// ── Palette (matches the Peak State II flyer & program) ──────────────────────
const C = {
  page: '#DDD2BA',
  frame: '#F3ECDB',
  field: '#EFE7D4',
  sky: '#DCE3E1',
  navy: '#26374D',
  navySoft: '#54677E',
  coffee: '#6E4A30',
  coffeeSoft: '#9A7351',
  line: '#C8BC9F',
}

const serif = 'var(--font-cormorant), Georgia, serif'
const mono = 'var(--font-plex-mono), monospace'

const VENMO_HANDLE = '@loricorpuz'
const VENMO_URL = 'https://venmo.com/u/loricorpuz'

// ── Program ──────────────────────────────────────────────────────────────────
const PROGRAM = [
  {
    idx: '01',
    kick: 'Arrival · fit the bikes · welcome dinner',
    title: 'The Welcome',
    desc: 'Land at the fjord house, fit and rent the bikes, settle in over an easy first dinner together.',
    am: 'Morning sit — calm abiding (śamatha)',
    state: 'Settle',
  },
  {
    idx: '02',
    kick: 'Easy spin · then the hunt',
    title: 'Spin & Seek',
    desc: 'A gentle loop along the fjord to find the legs, then a scavenger hunt through town — the old canal, the gunpowder works, the lake.',
    am: 'Morning sit — one-pointedness (rtse gcig)',
    state: 'Warm-up',
  },
  {
    idx: '03',
    kick: '~100 km · the full coast · train home with the bikes',
    title: 'The Long Way Round',
    desc: 'North coast and east past the troll-forest beaches to Kronborg, then down Strandvejen into the city — finishing with the sauna, a cold harbour dip and dinner at La Banchina.',
    am: 'Morning sit — simplicity (spros bral)',
    state: 'Exertion',
  },
  {
    idx: '04',
    kick: 'Birthday · the city · stay the night',
    title: 'Deep House',
    desc: 'A day loose in the city, a long dinner, then four-to-the-floor until the lights come up — crash in town, no dawn commute.',
    am: 'Morning sit — one taste (ro gcig)',
    state: 'Peak',
  },
  {
    idx: '05',
    kick: 'Home · last meal · farewell',
    title: 'The Slow Day',
    desc: 'Drift back to the fjord — a long morning by the lake and canal, the sauna, a final dinner in town, then goodbyes.',
    am: 'Morning sit — non-meditation (sgom med)',
    state: 'Recovery',
  },
]

type Comment = { id: string; name: string; message: string; createdAt: string }
type Rsvp = { id: string; name: string; guests: number; note: string; createdAt: string }

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function PeakStateIIPage() {
  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [cName, setCName] = useState('')
  const [cMessage, setCMessage] = useState('')
  const [cSending, setCSending] = useState(false)

  // RSVP / deposit
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [rName, setRName] = useState('')
  const [rGuests, setRGuests] = useState('1')
  const [rNote, setRNote] = useState('')
  const [rConfirmed, setRConfirmed] = useState(false)
  const [rSending, setRSending] = useState(false)
  const [rDone, setRDone] = useState(false)
  const [rError, setRError] = useState('')

  useEffect(() => {
    fetch('/api/peak-state-ii/comments')
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
      .catch(() => {})
    fetch('/api/peak-state-ii/rsvp')
      .then((r) => r.json())
      .then((d) => setRsvps(d.rsvps || []))
      .catch(() => {})
  }, [])

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!cName.trim() || !cMessage.trim()) return
    setCSending(true)
    try {
      const res = await fetch('/api/peak-state-ii/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cName, message: cMessage }),
      })
      const data = await res.json()
      if (data.success && data.comment) {
        setComments((prev) => [data.comment, ...prev])
        setCMessage('')
      }
    } catch {
      // ignore
    } finally {
      setCSending(false)
    }
  }

  async function submitRsvp(e: React.FormEvent) {
    e.preventDefault()
    setRError('')
    if (!rName.trim()) {
      setRError('Please add your name.')
      return
    }
    if (!rConfirmed) {
      setRError('Tick the box once your deposit is sent.')
      return
    }
    setRSending(true)
    try {
      const res = await fetch('/api/peak-state-ii/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rName,
          guests: rGuests,
          depositConfirmed: rConfirmed,
          note: rNote,
        }),
      })
      const data = await res.json()
      if (data.success && data.rsvp) {
        setRsvps((prev) => [data.rsvp, ...prev])
        setRDone(true)
      } else {
        setRError(data.error || 'Something went wrong.')
      }
    } catch {
      setRError('Something went wrong.')
    } finally {
      setRSending(false)
    }
  }

  // ── Shared style atoms ─────────────────────────────────────────────────────
  const kicker: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 9.5,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: C.navySoft,
  }
  const sectionLabel: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: C.coffee,
    fontWeight: 600,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: C.frame,
    border: `1px solid ${C.line}`,
    color: C.navy,
    fontFamily: serif,
    fontSize: 17,
    padding: '10px 12px',
    outline: 'none',
  }
  const cardStyle: React.CSSProperties = {
    background: `linear-gradient(180deg, ${C.sky} 0%, ${C.field} 30%, ${C.field} 100%)`,
    border: `1px solid ${C.line}`,
    padding: 'clamp(22px, 4vw, 34px)',
  }

  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '34px 14px 70px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Frame */}
        <div style={{ background: C.frame, padding: 'clamp(12px,2.4vw,18px)', boxShadow: '0 26px 64px -30px rgba(38,30,18,.5)' }}>
          {/* Header */}
          <header
            style={{
              ...cardStyle,
              textAlign: 'center',
              padding: 'clamp(30px,5vw,46px) clamp(22px,5vw,46px)',
            }}
          >
            <h1
              style={{
                fontFamily: serif,
                fontWeight: 500,
                letterSpacing: '0.07em',
                lineHeight: 0.9,
                fontSize: 'clamp(44px,9vw,78px)',
                color: C.navy,
                margin: 0,
              }}
            >
              PEAK STATE{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: C.coffee }}>II</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, margin: '18px auto 14px', maxWidth: 300, color: C.coffeeSoft }}>
              <span style={{ height: 1, flex: 1, background: C.line }} />
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.coffee }} />
              <span style={{ height: 1, flex: 1, background: C.line }} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 13, letterSpacing: '0.34em', textTransform: 'uppercase', color: C.navy, fontWeight: 500 }}>
              Copenhagen Edition
            </div>
            <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.navySoft, marginTop: 10 }}>
              Five days · the fjord &amp; the city · the thirty-fifth year
            </div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(14px,3.4vw,16px)', color: C.coffee, marginTop: 13, letterSpacing: '0.01em' }}>
              Each morning opens with a guided Mahamudra sit — the four yogas, settling to non-meditation.
            </div>
          </header>

          {/* Two columns: program (left) + flyer (right) */}
          <div
            style={{ display: 'grid', gap: 'clamp(12px,2.4vw,18px)', marginTop: 'clamp(12px,2.4vw,18px)' }}
            className="ps2-grid"
          >
            {/* Program */}
            <section style={cardStyle}>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>The Program</div>
              <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 17, color: C.coffee, margin: '0 0 6px' }}>
                Five days drawn as one curve — settle, warm-up, exertion, peak, recovery — each dawn met first in stillness.
              </p>
              <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 16 }}>
                {PROGRAM.map((day) => (
                  <article
                    key={day.idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: '0 18px',
                      alignItems: 'baseline',
                      padding: '18px 2px',
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.coffee, letterSpacing: '0.05em', paddingTop: 6, gridRow: 'span 2' }}>
                      {day.idx}
                    </div>
                    <div>
                      <div style={kicker}>{day.kick}</div>
                      <h2 style={{ fontFamily: serif, fontSize: 'clamp(24px,4vw,30px)', fontWeight: 600, lineHeight: 1.02, color: C.navy, margin: '4px 0 0' }}>
                        {day.title}
                      </h2>
                      <p style={{ fontFamily: serif, fontSize: 16.5, lineHeight: 1.38, color: '#46556a', margin: '4px 0 0', maxWidth: '52ch' }}>
                        {day.desc}
                      </p>
                      <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14.5, color: C.coffee, marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 9 }}>
                        <span style={{ flex: '0 0 auto', width: 5, height: 5, borderRadius: '50%', border: `1px solid ${C.coffee}`, transform: 'translateY(-2px)' }} />
                        {day.am}
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.coffeeSoft, marginTop: 8 }}>
                        {day.state}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Flyer */}
            <aside>
              <div style={{ position: 'sticky', top: 18 }}>
                <div style={{ ...cardStyle, padding: 'clamp(12px,2vw,16px)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/peak-state-ii.png"
                    alt="Peak State II — Copenhagen, August 2026"
                    style={{ width: '100%', height: 'auto', display: 'block', border: `1px solid ${C.line}` }}
                  />
                </div>
              </div>
            </aside>
          </div>

          {/* Deposit / Confirm */}
          <section style={{ ...cardStyle, marginTop: 'clamp(12px,2.4vw,18px)' }}>
            <div style={{ ...sectionLabel, marginBottom: 6 }}>Confirm Your Place</div>
            <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.45, color: '#46556a', margin: '0 0 4px', maxWidth: '60ch' }}>
              Spots are held with a deposit. Send yours on Venmo to{' '}
              <strong style={{ color: C.coffee }}>{VENMO_HANDLE}</strong>, then confirm below so I can
              count you in.
            </p>

            <a
              href={VENMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: C.frame,
                background: C.navy,
                border: `1px solid ${C.navy}`,
                padding: '11px 20px',
                margin: '12px 0 18px',
                textDecoration: 'none',
              }}
            >
              Send deposit on Venmo · {VENMO_HANDLE}
            </a>

            {rDone ? (
              <div
                style={{
                  border: `1px solid ${C.line}`,
                  background: C.frame,
                  padding: '18px 20px',
                  maxWidth: 560,
                }}
              >
                <div style={{ fontFamily: serif, fontSize: 22, color: C.navy }}>You're in.</div>
                <p style={{ fontFamily: serif, fontSize: 16.5, color: '#46556a', margin: '4px 0 0' }}>
                  Thank you — deposit noted. See you on the fjord.
                </p>
              </div>
            ) : (
              <form onSubmit={submitRsvp} style={{ maxWidth: 560, display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                  <div>
                    <label style={{ ...kicker, display: 'block', marginBottom: 5 }}>Your name</label>
                    <input style={inputStyle} value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Name" />
                  </div>
                  <div>
                    <label style={{ ...kicker, display: 'block', marginBottom: 5 }}>Guests</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min={1}
                      max={20}
                      value={rGuests}
                      onChange={(e) => setRGuests(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ ...kicker, display: 'block', marginBottom: 5 }}>Note (optional)</label>
                  <input style={inputStyle} value={rNote} onChange={(e) => setRNote(e.target.value)} placeholder="Arrival day, dietary notes, anything" />
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: serif, fontSize: 16.5, color: C.navy, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rConfirmed}
                    onChange={(e) => setRConfirmed(e.target.checked)}
                    style={{ marginTop: 5, width: 16, height: 16, accentColor: C.coffee }}
                  />
                  <span>
                    I've sent my deposit to <strong style={{ color: C.coffee }}>{VENMO_HANDLE}</strong> on Venmo.
                  </span>
                </label>
                {rError && (
                  <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.04em', color: '#8c2d2d' }}>{rError}</div>
                )}
                <button
                  type="submit"
                  disabled={rSending}
                  style={{
                    justifySelf: 'start',
                    fontFamily: mono,
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: C.frame,
                    background: C.coffee,
                    border: `1px solid ${C.coffee}`,
                    padding: '11px 22px',
                    cursor: rSending ? 'default' : 'pointer',
                    opacity: rSending ? 0.6 : 1,
                  }}
                >
                  {rSending ? 'Confirming…' : 'Confirm my place'}
                </button>
              </form>
            )}

            {rsvps.length > 0 && (
              <div style={{ marginTop: 24, borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
                <div style={{ ...kicker, marginBottom: 10 }}>
                  Confirmed · {rsvps.reduce((s, r) => s + (r.guests || 1), 0)} coming
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {rsvps.map((r) => (
                    <span
                      key={r.id}
                      style={{
                        fontFamily: mono,
                        fontSize: 11,
                        letterSpacing: '0.04em',
                        color: C.navy,
                        background: C.frame,
                        border: `1px solid ${C.line}`,
                        padding: '5px 11px',
                      }}
                    >
                      {r.name}
                      {r.guests > 1 ? ` +${r.guests - 1}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Comments */}
          <section style={{ ...cardStyle, marginTop: 'clamp(12px,2.4vw,18px)' }}>
            <div style={{ ...sectionLabel, marginBottom: 14 }}>The Wall</div>

            <form onSubmit={submitComment} style={{ maxWidth: 640, display: 'grid', gap: 12, marginBottom: 22 }}>
              <input style={inputStyle} value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Your name" />
              <textarea
                style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }}
                value={cMessage}
                onChange={(e) => setCMessage(e.target.value)}
                placeholder="Leave a note for the table…"
              />
              <button
                type="submit"
                disabled={cSending}
                style={{
                  justifySelf: 'start',
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: C.frame,
                  background: C.navy,
                  border: `1px solid ${C.navy}`,
                  padding: '10px 20px',
                  cursor: cSending ? 'default' : 'pointer',
                  opacity: cSending ? 0.6 : 1,
                }}
              >
                {cSending ? 'Posting…' : 'Post'}
              </button>
            </form>

            <div style={{ display: 'grid', gap: 0 }}>
              {comments.length === 0 && (
                <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16.5, color: C.coffeeSoft, margin: 0 }}>
                  No notes yet — be the first.
                </p>
              )}
              {comments.map((c) => (
                <div key={c.id} style={{ padding: '14px 0', borderTop: `1px solid ${C.line}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, color: C.navy }}>{c.name}</span>
                    <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.coffeeSoft }}>
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontFamily: serif, fontSize: 16.5, lineHeight: 1.4, color: '#46556a', margin: '3px 0 0', whiteSpace: 'pre-wrap' }}>
                    {c.message}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div
            style={{
              ...cardStyle,
              marginTop: 'clamp(12px,2.4vw,18px)',
              textAlign: 'center',
              fontFamily: mono,
              fontSize: 9.5,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: C.navySoft,
            }}
          >
            Peak State <strong style={{ color: C.coffee, fontWeight: 600 }}>II · Copenhagen</strong> · MMXXVI
          </div>
        </div>
      </div>

      <style>{`
        .ps2-grid { grid-template-columns: 1fr; }
        @media (min-width: 880px) {
          .ps2-grid { grid-template-columns: 1.35fr 1fr; align-items: start; }
        }
      `}</style>
    </div>
  )
}
