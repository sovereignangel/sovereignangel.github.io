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

// ── The five pillars ─────────────────────────────────────────────────────────
const PILLARS = [
  {
    icon: 'enso',
    title: 'Morning Meditation · 30 min',
    body: 'Every day opens in stillness — a daily 30-minute sit facilitated by Lev David, refining discernment, clarity, and focus before the world gets loud.',
  },
  {
    icon: 'wheel',
    title: 'Mahamudra Buddhism',
    body: 'A foundational introduction guided by Lev David — a Buddhist practice carried into the language of Western thought by a recent generation of masters, translating the tradition to our lens from backgrounds at U Chicago, Stanford, and Harvard.',
  },
  {
    icon: 'bowl',
    title: 'The Table',
    body: 'Selected chefs take breakfast, lunch, and dinner each day, backed by a supportive clean-up crew. Claim a meal below — feeding the house is part of the practice.',
  },
  {
    icon: 'plunge',
    title: 'Sauna & Cold Plunge',
    body: 'The nervous-system reset, every evening — heat, then the cold shock of the harbour and the ocean.',
  },
  {
    icon: 'moon',
    title: 'Attendee-led Evenings',
    body: 'Evenings stay open on purpose. Each night a new activity orchestrated by one of us — a day of cycling ending at La Banchina, a scavenger hunt through the area, and whatever you want to bring. Suggest and claim yours in advance below.',
  },
]

// ── Line-art marks for the pillars (flyer palette, stroke only) ──────────────
function PillarIcon({ kind }: { kind: string }) {
  const s = {
    fill: 'none',
    stroke: C.coffee,
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={34} height={34} viewBox="0 0 32 32" aria-hidden="true">
      {kind === 'enso' && (
        <>
          <path {...s} d="M 22.6 7.2 A 10.8 10.8 0 1 0 26.6 13.8" />
          <circle cx={16} cy={16} r={1.1} fill={C.coffee} />
        </>
      )}
      {kind === 'wheel' && (
        <>
          <circle {...s} cx={16} cy={16} r={10.4} />
          <circle {...s} cx={16} cy={16} r={3.3} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4
            return (
              <line
                key={i}
                {...s}
                x1={16 + 3.3 * Math.cos(a)}
                y1={16 + 3.3 * Math.sin(a)}
                x2={16 + 10.4 * Math.cos(a)}
                y2={16 + 10.4 * Math.sin(a)}
              />
            )
          })}
        </>
      )}
      {kind === 'bowl' && (
        <>
          <path {...s} d="M 6.5 16.5 h 19" />
          <path {...s} d="M 8 16.5 a 8 8 0 0 0 16 0" />
          <path {...s} d="M 13 12.5 c 1.4 -1.5 -1.4 -3 0 -4.5" />
          <path {...s} d="M 19 12.5 c 1.4 -1.5 -1.4 -3 0 -4.5" />
        </>
      )}
      {kind === 'plunge' && (
        <>
          <path {...s} d="M 4.5 23.5 c 2 -2.4 4 -2.4 6 0 s 4 2.4 6 0 s 4 -2.4 6 0 s 4 2.4 5 0.6" />
          <path {...s} d="M 10 17 c 1.5 -1.7 -1.5 -3.4 0 -5.1" />
          <path {...s} d="M 16 17 c 1.5 -1.7 -1.5 -3.4 0 -5.1" />
          <path {...s} d="M 22 17 c 1.5 -1.7 -1.5 -3.4 0 -5.1" />
        </>
      )}
      {kind === 'moon' && (
        <>
          <path {...s} d="M 18.5 5.8 a 10.2 10.2 0 1 0 7.4 16.4 a 8.6 8.6 0 0 1 -7.4 -16.4 Z" />
          <circle cx={23.5} cy={8.5} r={0.9} fill={C.coffee} />
          <circle cx={27} cy={13} r={0.7} fill={C.coffee} />
        </>
      )}
    </svg>
  )
}

// ── Daily rhythm (Copenhagen local CEST · New York EST) ──────────────────────
// CEST = UTC+2 · EST column is 6h behind (US Eastern in August). Adjust freely.
const SCHEDULE = [
  { cest: '7:30 AM', est: '1:30 AM', label: 'Morning Mahamudra sit · 30 min', sub: 'facilitated by Lev David', mark: true },
  { cest: '8:15 AM', est: '2:15 AM', label: 'Breakfast · slow start', sub: "today's breakfast chef" },
  { cest: '9:00 AM', est: '3:00 AM', label: 'Deep work', sub: 'heads-down, our own projects' },
  { cest: '1:00 PM', est: '7:00 AM', label: 'Lunch', sub: "today's lunch chef" },
  { cest: '2:00 PM', est: '8:00 AM', label: 'Deep work', sub: '' },
  { cest: '5:30 PM', est: '11:30 AM', label: 'Laptops closed', sub: '' },
  { cest: '6:00 PM', est: '12:00 PM', label: 'Sauna & cold plunge · evening activity', sub: 'attendee-led', mark: true },
  { cest: '8:00 PM', est: '2:00 PM', label: 'Dinner, then clean-up', sub: 'dinner chef · clean-up crew' },
]

// ── The five days · Aug 3–7 (Mon–Fri) ────────────────────────────────────────
const DAYS_PROGRAM = [
  {
    idx: '01',
    date: 'Mon · Aug 3',
    title: 'Arrival & Settle',
    desc: 'Land, settle into the house, fit the bikes. An easy welcome dinner and a first warm-up in the sauna.',
    am: 'Sit — calm abiding (śamatha)',
  },
  {
    idx: '02',
    date: 'Tue · Aug 4',
    title: 'First Full Day',
    desc: 'The rhythm finds itself — morning sit, a full working day, sauna and cold plunge, an attendee-led evening.',
    am: 'Sit — one-pointedness (rtse gcig)',
  },
  {
    idx: '03',
    date: 'Wed · Aug 5',
    title: 'The Birthday',
    desc: 'Save this one. The ride out and into the city — cyclists and non-cyclists both land at La Banchina for the birthday dinner: eat, sauna, and cold-plunge in the ocean.',
    am: 'Sit — simplicity (spros bral)',
    mark: true,
  },
  {
    idx: '04',
    date: 'Thu · Aug 6',
    title: 'The Hunt',
    desc: 'Another full working day, then a scavenger hunt through the area in the evening — the canal, the lake, the town.',
    am: 'Sit — one taste (ro gcig)',
  },
  {
    idx: '05',
    date: 'Fri · Aug 7',
    title: 'Farewell',
    desc: 'A last morning sit and working block, a final sauna, and an unhurried farewell dinner before goodbyes.',
    am: 'Sit — non-meditation (sgom med)',
  },
]

const SIGNUP_DAYS = ['Mon Aug 3', 'Tue Aug 4', 'Wed Aug 5', 'Thu Aug 6', 'Fri Aug 7']
const SIGNUP_ROLES = ['Breakfast', 'Lunch', 'Dinner', 'Cleanup', 'Evening activity']

// ── The house & getting there ────────────────────────────────────────────────
const HOUSE_ADDRESS = 'Store Ryvej 39A, 3300 Frederiksværk, Denmark'
const HOUSE_MAPS_URL = 'https://maps.google.com/?q=Store+Ryvej+39A,+3300+Frederiksv%C3%A6rk,+Denmark'
const BIKE_RENTAL_NAME = 'Ditlev Cykler'
const BIKE_RENTAL_ADDRESS = 'Vinderød Skov 3, 3300 Frederiksværk, Denmark'
const BIKE_RENTAL_MAPS_URL = 'https://maps.google.com/?q=Ditlev+Cykler,+Vinder%C3%B8d+Skov+3,+3300+Frederiksv%C3%A6rk,+Denmark'

const HOUSE_PHOTOS = [
  'house-01.avif', 'house-02.avif', 'house-03.avif', 'house-04.avif', 'house-05.avif',
  'house-06.avif', 'house-07.avif', 'house-08.avif', 'house-09.avif', 'house-10.avif',
  'house-11.avif', 'house-12.avif', 'house-13.jpeg', 'house-14.avif', 'house-15.avif',
  'house-16.avif', 'house-17.avif', 'house-18.avif', 'house-19.avif', 'house-20.jpeg',
  'house-21.jpeg',
].map((f) => `/peak-state-ii/house/${f}`)

type Comment = { id: string; name: string; message: string; createdAt: string }
type Rsvp = { id: string; name: string; guests: number; note: string; createdAt: string }
type Signup = { id: string; name: string; day: string; role: string; what: string; createdAt: string }

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

  // Signups / facilitation
  const [signups, setSignups] = useState<Signup[]>([])
  const [sName, setSName] = useState('')
  const [sDay, setSDay] = useState(SIGNUP_DAYS[0])
  const [sRole, setSRole] = useState(SIGNUP_ROLES[0])
  const [sWhat, setSWhat] = useState('')
  const [sSending, setSSending] = useState(false)
  const [sError, setSError] = useState('')

  useEffect(() => {
    fetch('/api/peak-state-ii/comments')
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
      .catch(() => {})
    fetch('/api/peak-state-ii/rsvp')
      .then((r) => r.json())
      .then((d) => setRsvps(d.rsvps || []))
      .catch(() => {})
    fetch('/api/peak-state-ii/signups')
      .then((r) => r.json())
      .then((d) => setSignups(d.signups || []))
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

  async function submitSignup(e: React.FormEvent) {
    e.preventDefault()
    setSError('')
    if (!sName.trim()) {
      setSError('Please add your name.')
      return
    }
    setSSending(true)
    try {
      const res = await fetch('/api/peak-state-ii/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sName, day: sDay, role: sRole, what: sWhat }),
      })
      const data = await res.json()
      if (data.success && data.signup) {
        setSignups((prev) => [...prev, data.signup])
        setSWhat('')
      } else {
        setSError(data.error || 'Something went wrong.')
      }
    } catch {
      setSError('Something went wrong.')
    } finally {
      setSSending(false)
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
  const btnNavy: React.CSSProperties = {
    justifySelf: 'start',
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: C.frame,
    background: C.navy,
    border: `1px solid ${C.navy}`,
    padding: '11px 22px',
    cursor: 'pointer',
  }

  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '0 0 70px' }}>
      <div style={{ maxWidth: 'none', margin: 0 }}>
        {/* Frame */}
        <div style={{ background: C.frame, padding: '0 0 clamp(12px,2.4vw,18px)', boxShadow: '0 26px 64px -30px rgba(38,30,18,.5)' }}>
          {/* Two columns: description (left) + flyer (right) — flush to top, flyer wider */}
          <div style={{ display: 'grid', gap: 'clamp(12px,2.4vw,18px)' }} className="ps2-grid">
            {/* Description */}
            <section style={cardStyle}>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>The Retreat</div>
              <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(19px,2.6vw,23px)', lineHeight: 1.3, color: C.coffee, margin: '0 0 12px' }}>
                A week for developing the micro-habits of peak performance — the small daily practices that compound into our best versions.
              </p>
              <p style={{ fontFamily: serif, fontSize: 16.5, lineHeight: 1.45, color: '#46556a', margin: '0 0 10px' }}>
                <strong style={{ color: C.navy }}>Aug 3–7, 2026 · Frederiksværk, north of Copenhagen · 10–16 of us.</strong>{' '}
                An intimate crew — remote workers, cyclists and non-cyclists alike — sharing a house, keeping our
                working hours, and exploring the area together. Meditation opens each morning, chefs among us take
                the meals, and every evening ends in the sauna and the cold.
              </p>
              <p style={{ fontFamily: serif, fontSize: 16.5, lineHeight: 1.45, color: '#46556a', margin: '0 0 6px' }}>
                A few key moments to save on your calendar — <strong style={{ color: C.navy }}>Wed Aug 5, the
                birthday dinner</strong>, and <strong style={{ color: C.navy }}>an evening at La Banchina</strong> —
                while the rest is choose-your-own-adventure. More coming soon; I welcome ideas and any activity you
                want to facilitate.
              </p>

              <div style={{ ...kicker, margin: '20px 0 10px', color: C.coffee }}>The Daily Practice</div>
              <div style={{ borderTop: `1px solid ${C.line}` }}>
                {PILLARS.map((p) => (
                  <div key={p.title} style={{ padding: '13px 0', borderBottom: `1px solid ${C.line}`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        flex: '0 0 auto',
                        width: 48,
                        height: 48,
                        border: `1px solid ${C.line}`,
                        background: C.frame,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 3,
                      }}
                    >
                      <PillarIcon kind={p.icon} />
                    </div>
                    <div>
                      <div style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, color: C.navy }}>{p.title}</div>
                      <p style={{ fontFamily: serif, fontSize: 16, lineHeight: 1.38, color: '#46556a', margin: '2px 0 0', maxWidth: '54ch' }}>
                        {p.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Flyer */}
            <aside className="ps2-aside">
              <div className="ps2-flyer-card" style={{ background: C.frame, border: `1px solid ${C.line}`, padding: 0, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/peak-state-ii.png" alt="Peak State II — Copenhagen, August 2026" className="ps2-flyer-img" />
              </div>
            </aside>
          </div>

          {/* Daily Schedule — dual timezone */}
          <section style={{ ...cardStyle, marginTop: 'clamp(12px,2.4vw,18px)' }}>
            <div style={{ ...sectionLabel, marginBottom: 4 }}>A Day in the Retreat</div>
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16.5, color: C.coffee, margin: '0 0 16px' }}>
              The same rhythm each day, Mon–Fri. Times in Copenhagen (CEST) and New York (EST).
            </p>

            {/* Header row */}
            <div className="ps2-sched-row" style={{ borderBottom: `2px solid ${C.line}`, paddingBottom: 8 }}>
              <div style={{ ...kicker, color: C.coffee }}>CEST</div>
              <div style={{ ...kicker, color: C.coffeeSoft }}>EST</div>
              <div style={{ ...kicker }}>What</div>
            </div>

            {SCHEDULE.map((row, i) => (
              <div
                key={i}
                className="ps2-sched-row"
                style={{ borderBottom: `1px solid ${C.line}`, padding: '12px 0', background: row.mark ? '#6E4A3008' : 'transparent' }}
              >
                <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 600, color: C.navy }}>{row.cest}</div>
                <div style={{ fontFamily: mono, fontSize: 13, color: C.coffeeSoft }}>{row.est}</div>
                <div>
                  <div style={{ fontFamily: serif, fontSize: 17.5, fontWeight: row.mark ? 600 : 500, color: C.navy }}>
                    {row.label}
                  </div>
                  {row.sub && (
                    <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14.5, color: C.coffee, marginTop: 1 }}>
                      {row.sub}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* The Week — five days */}
          <section style={{ ...cardStyle, marginTop: 'clamp(12px,2.4vw,18px)' }}>
            <div style={{ ...sectionLabel, marginBottom: 4 }}>The Week</div>
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16.5, color: C.coffee, margin: '0 0 8px' }}>
              Five days · settle, work, sweat, plunge, repeat — each dawn met first in stillness.
            </p>
            <div style={{ borderTop: `1px solid ${C.line}` }} className="ps2-week">
              {DAYS_PROGRAM.map((day) => (
                <article
                  key={day.idx}
                  className="ps2-week-day"
                  style={{
                    borderBottom: `1px solid ${C.line}`,
                    padding: '16px 0',
                    background: 'mark' in day && day.mark ? '#6E4A300C' : 'transparent',
                  }}
                >
                  <div>
                    <div style={{ ...kicker, color: C.coffee }}>{day.date}{'mark' in day && day.mark ? ' · save the date' : ''}</div>
                    <h2 style={{ fontFamily: serif, fontSize: 'clamp(22px,3vw,27px)', fontWeight: 600, lineHeight: 1.05, color: C.navy, margin: '2px 0 0' }}>
                      {day.title}
                    </h2>
                  </div>
                  <div>
                    <p style={{ fontFamily: serif, fontSize: 16.5, lineHeight: 1.4, color: '#46556a', margin: 0, maxWidth: '56ch' }}>
                      {day.desc}
                    </p>
                    <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14.5, color: C.coffee, marginTop: 7, display: 'flex', alignItems: 'baseline', gap: 9 }}>
                      <span style={{ flex: '0 0 auto', width: 5, height: 5, borderRadius: '50%', border: `1px solid ${C.coffee}`, transform: 'translateY(-2px)' }} />
                      {day.am}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* The House — photos & getting there */}
          <section style={{ ...cardStyle, marginTop: 'clamp(12px,2.4vw,18px)' }}>
            <div style={{ ...sectionLabel, marginBottom: 4 }}>The House</div>
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16.5, color: C.coffee, margin: '0 0 14px', maxWidth: '64ch' }}>
              Our home for the week — a house by the fjord in Frederiksværk, with the sauna and plunge tub out back.
            </p>

            <div className="ps2-house-info" style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              <div style={{ border: `1px solid ${C.line}`, background: C.frame, padding: '12px 14px' }}>
                <div style={{ ...kicker, color: C.coffee, marginBottom: 4 }}>Address</div>
                <a
                  href={HOUSE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: C.navy, textDecoration: 'underline', textDecorationColor: C.line, textUnderlineOffset: 3 }}
                >
                  {HOUSE_ADDRESS}
                </a>
              </div>
              <div style={{ border: `1px solid ${C.line}`, background: C.frame, padding: '12px 14px' }}>
                <div style={{ ...kicker, color: C.coffee, marginBottom: 4 }}>Bike Rental · Road & Electric</div>
                <a
                  href={BIKE_RENTAL_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: C.navy, textDecoration: 'underline', textDecorationColor: C.line, textUnderlineOffset: 3 }}
                >
                  {BIKE_RENTAL_NAME} · {BIKE_RENTAL_ADDRESS}
                </a>
                <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14.5, color: C.coffee, marginTop: 3 }}>
                  8 min drive · 18 min by bike from the house
                </div>
              </div>
            </div>

            <div className="ps2-gallery">
              {HOUSE_PHOTOS.map((src, i) => (
                <div key={src} style={{ border: `1px solid ${C.line}`, background: C.frame, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`The house · photo ${i + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </section>

          {/* Facilitate / Sign-ups */}
          <section style={{ ...cardStyle, marginTop: 'clamp(12px,2.4vw,18px)' }}>
            <div style={{ ...sectionLabel, marginBottom: 4 }}>Take a Slot · Facilitate</div>
            <p style={{ fontFamily: serif, fontSize: 16.5, lineHeight: 1.45, color: '#46556a', margin: '0 0 16px', maxWidth: '64ch' }}>
              The retreat runs on all of us. Claim a meal to chef — breakfast, lunch, or dinner — join a clean-up
              crew, or offer an evening activity you want to facilitate: a run, a sit, a swim, a workshop, a hunt.
              Evenings stay open on purpose, so suggest and contribute in advance. More coming soon — I welcome
              ideas and anything you want to lead.
            </p>

            <form onSubmit={submitSignup} style={{ display: 'grid', gap: 12, maxWidth: 720, marginBottom: 22 }}>
              <div className="ps2-signup-fields">
                <div>
                  <label style={{ ...kicker, display: 'block', marginBottom: 5 }}>Your name</label>
                  <input style={inputStyle} value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Name" />
                </div>
                <div>
                  <label style={{ ...kicker, display: 'block', marginBottom: 5 }}>Day</label>
                  <select style={{ ...inputStyle, appearance: 'none' }} value={sDay} onChange={(e) => setSDay(e.target.value)}>
                    {SIGNUP_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...kicker, display: 'block', marginBottom: 5 }}>Role</label>
                  <select style={{ ...inputStyle, appearance: 'none' }} value={sRole} onChange={(e) => setSRole(e.target.value)}>
                    {SIGNUP_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ ...kicker, display: 'block', marginBottom: 5 }}>What are you bringing? (optional)</label>
                <input style={inputStyle} value={sWhat} onChange={(e) => setSWhat(e.target.value)} placeholder="Dish, activity, or details" />
              </div>
              {sError && <div style={{ fontFamily: mono, fontSize: 11, color: '#8c2d2d' }}>{sError}</div>}
              <button type="submit" disabled={sSending} style={{ ...btnNavy, background: C.coffee, border: `1px solid ${C.coffee}`, opacity: sSending ? 0.6 : 1 }}>
                {sSending ? 'Adding…' : 'Add my slot'}
              </button>
            </form>

            {/* Board grouped by day */}
            <div className="ps2-board">
              {SIGNUP_DAYS.map((d) => {
                const items = signups.filter((s) => s.day === d)
                return (
                  <div key={d} style={{ border: `1px solid ${C.line}`, background: C.frame, padding: '12px 14px' }}>
                    <div style={{ ...kicker, color: C.coffee, marginBottom: 8 }}>{d}</div>
                    {items.length === 0 ? (
                      <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: C.coffeeSoft }}>Open</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 7 }}>
                        {items.map((s) => (
                          <div key={s.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 7 }}>
                            <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.frame, background: C.navy, padding: '2px 7px' }}>
                              {s.role}
                            </span>
                            <span style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: C.navy }}>{s.name}</span>
                            {s.what && <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: C.coffee }}>— {s.what}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Deposit / Confirm */}
          <section style={{ ...cardStyle, marginTop: 'clamp(12px,2.4vw,18px)' }}>
            <div style={{ ...sectionLabel, marginBottom: 6 }}>Confirm Your Place</div>
            <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.45, color: '#46556a', margin: '0 0 4px', maxWidth: '60ch' }}>
              Spots are held with an <strong style={{ color: C.navy }}>$800 deposit</strong> to confirm your place
              in the Airbnb. Send yours on Venmo to{' '}
              <strong style={{ color: C.coffee }}>{VENMO_HANDLE}</strong>, then confirm below so I can count you in.
            </p>

            <a
              href={VENMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...btnNavy, display: 'inline-block', padding: '11px 20px', margin: '12px 0 18px', textDecoration: 'none' }}
            >
              Send deposit on Venmo · {VENMO_HANDLE}
            </a>

            {rDone ? (
              <div style={{ border: `1px solid ${C.line}`, background: C.frame, padding: '18px 20px', maxWidth: 560 }}>
                <div style={{ fontFamily: serif, fontSize: 22, color: C.navy }}>You're in.</div>
                <p style={{ fontFamily: serif, fontSize: 16.5, color: '#46556a', margin: '4px 0 0' }}>
                  Thank you — deposit noted. See you in Copenhagen.
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
                    <input style={inputStyle} type="number" min={1} max={20} value={rGuests} onChange={(e) => setRGuests(e.target.value)} />
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
                {rError && <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.04em', color: '#8c2d2d' }}>{rError}</div>}
                <button type="submit" disabled={rSending} style={{ ...btnNavy, background: C.coffee, border: `1px solid ${C.coffee}`, opacity: rSending ? 0.6 : 1 }}>
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
                    <span key={r.id} style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.04em', color: C.navy, background: C.frame, border: `1px solid ${C.line}`, padding: '5px 11px' }}>
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
                placeholder="Leave a note for the group…"
              />
              <button type="submit" disabled={cSending} style={{ ...btnNavy, padding: '10px 20px', opacity: cSending ? 0.6 : 1 }}>
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
            Peak State <strong style={{ color: C.coffee, fontWeight: 600 }}>II · Copenhagen</strong> · Aug 3–7 · MMXXVI
          </div>
        </div>
      </div>

      <style>{`
        .ps2-grid { grid-template-columns: 1fr; }
        .ps2-aside { order: -1; }
        .ps2-flyer-img { width: 100%; height: auto; display: block; }
        .ps2-sched-row { display: grid; grid-template-columns: 84px 76px 1fr; gap: 14px; align-items: baseline; }
        .ps2-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .ps2-gallery img { width: 100%; height: 100%; object-fit: cover; aspect-ratio: 4 / 3; display: block; }
        @media (min-width: 720px) { .ps2-gallery { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1100px) { .ps2-gallery { grid-template-columns: repeat(4, 1fr); } }
        .ps2-week-day { display: grid; grid-template-columns: 1fr; gap: 4px; }
        .ps2-signup-fields { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .ps2-board { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 720px) {
          .ps2-house-info { grid-template-columns: 1fr 1fr; }
          .ps2-week-day { grid-template-columns: 190px 1fr; gap: 18px; align-items: baseline; }
          .ps2-signup-fields { grid-template-columns: 1fr 160px 180px; }
          .ps2-board { grid-template-columns: repeat(5, 1fr); }
        }
        @media (min-width: 880px) {
          .ps2-grid { grid-template-columns: 1fr 1.45fr; align-items: stretch; }
          .ps2-aside { order: 0; display: flex; }
          .ps2-flyer-card { width: 100%; display: flex; }
          .ps2-flyer-img { height: 100%; object-fit: contain; }
        }
      `}</style>
    </div>
  )
}
