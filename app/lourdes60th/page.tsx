'use client'

import { useEffect, useState } from 'react'

// ── Palette (warm Panama tropical — parallels the /35 flyer system) ──────────
const C = {
  page: '#EFE7D3',
  frame: '#F8F3E7',
  field: '#F3ECDA',
  sky: '#E3EBDD',
  green: '#1F3D2E',
  greenSoft: '#4C6B57',
  gold: '#B07A2E',
  goldSoft: '#C79A5C',
  line: '#D9CBA8',
}

const serif = 'var(--font-cormorant), Georgia, serif'
const mono = 'var(--font-plex-mono), monospace'

// ── The shape of the week ─────────────────────────────────────────────────────
const WEEK_ARC = [
  {
    idx: '01',
    date: 'Weekend before · Oct 17–18',
    title: 'The Resort Weekend',
    desc: "Lori's gift to Lourdes — a couple of days away together before the family week begins. Dates and resort still open, see the Resort Weekend tab.",
  },
  {
    idx: '02',
    date: 'Mon–Fri · Oct 19–23',
    title: 'Family & Friends Arrive',
    desc: 'Open days — come whenever works for you. No fixed schedule; use the Ideas tab and the Wall to find each other for a boat day, a walk through Casco Viejo, or just coffee.',
  },
  {
    idx: '03',
    date: 'Sat · Oct 24',
    title: 'Family Day',
    desc: 'One big day, all together — an activity, then dinner somewhere special. See the Saturday tab.',
    mark: true,
  },
  {
    idx: '04',
    date: 'Sun · Oct 25',
    title: 'A Quiet Day',
    desc: 'Open on purpose — rest, a smaller gathering, or trade Saturday-night stories over breakfast.',
  },
  {
    idx: '05',
    date: 'Mon · Oct 26',
    title: 'The Birthday',
    desc: 'Lourdes turns 60.',
    mark: true,
    star: true,
  },
]

// ── Saturday · Family Day ─────────────────────────────────────────────────────
const ACTIVITY_IDEAS = [
  { icon: 'water', title: 'Panama Canal · Miraflores Locks', desc: 'Watch the ships lift through the locks from the air-conditioned viewing decks — easy walking, good for every age.' },
  { icon: 'landmark', title: 'Casco Viejo Walking Tour', desc: 'Colonial streets, plazas, and rooftop views at an easy pace — pause for coffee whenever the group needs.' },
  { icon: 'water', title: 'A Boat Day on the Bay', desc: 'A calm-water cruise out on the water — gentle enough for the elders, fun enough for the kids.' },
  { icon: 'landmark', title: 'Amador Causeway', desc: 'Golf carts or bikes along the water with a stop at the Biomuseo — low effort, high view.' },
  { icon: 'table', title: 'Cook Together at Home', desc: 'A private chef or a family cooking session — everyone in one kitchen, no one has to go far.' },
]

const DINNER_IDEAS = [
  { title: 'A View of the Bay', desc: 'Somewhere up high, overlooking the skyline or the water — a table with a view.' },
  { title: 'Live Music, Room to Dance', desc: "Somewhere with music after dinner so the night doesn't have to end at dessert." },
  { title: 'One Long Table', desc: 'Family-style, everyone at one table — the point is being together, not a formal sit-down.' },
]

// ── The Resort Weekend (Lori's gift) ──────────────────────────────────────────
const RESORT_MORNING_SPORTS = [
  'Beach volleyball',
  'Paddleboard or kayak race',
  'Padel or tennis',
  'A swim relay',
  'A morning hike, if the resort has a trail',
]

// ── Ideas for the open week ───────────────────────────────────────────────────
const IDEA_GROUPS = [
  { icon: 'landmark', label: 'Around the City', items: ['Casco Viejo', 'Miraflores Locks', 'Biomuseo', 'Amador Causeway'] },
  { icon: 'water', label: 'On the Water', items: ['Island boat day (e.g. Taboga)', 'A sunset cruise', 'A fishing trip'] },
  { icon: 'table', label: 'At Home', items: ['Dominoes, cards, or mahjong night', 'A big family cook-together', 'A family photo session'] },
  { icon: 'youth', label: 'For the Youth (10–40)', items: ['Padel', 'Beach volleyball', 'A hike', 'Paddleboarding'] },
  { icon: 'rest', label: 'Slow Days', items: ['A spa afternoon', 'A pool day', 'Siesta and cafecito'] },
]

// ── Line-art marks, gold stroke on parchment ─────────────────────────────────
function IdeaIcon({ kind }: { kind: string }) {
  const s = {
    fill: 'none',
    stroke: C.gold,
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={30} height={30} viewBox="0 0 32 32" aria-hidden="true">
      {kind === 'water' && (
        <>
          <path {...s} d="M 4.5 20.5 c 2 -2.4 4 -2.4 6 0 s 4 2.4 6 0 s 4 -2.4 6 0 s 4 2.4 5 0.6" />
          <path {...s} d="M 4.5 25.5 c 2 -2.4 4 -2.4 6 0 s 4 2.4 6 0 s 4 -2.4 6 0 s 4 2.4 5 0.6" />
          <path {...s} d="M 10 15 l 12 0 l -2 -6 l -8 0 Z" />
        </>
      )}
      {kind === 'landmark' && (
        <>
          <path {...s} d="M 7 26 h 18" />
          <path {...s} d="M 9 26 v -11 M 23 26 v -11" />
          <path {...s} d="M 7 15 l 9 -8 l 9 8 Z" />
          <path {...s} d="M 16 26 v -7" />
        </>
      )}
      {kind === 'table' && (
        <>
          <circle {...s} cx={13} cy={13} r={4.2} />
          <circle {...s} cx={20} cy={20} r={4.2} />
          <circle cx={13} cy={13} r={1} fill={C.gold} />
          <circle cx={20} cy={20} r={1} fill={C.gold} />
        </>
      )}
      {kind === 'youth' && (
        <>
          <circle {...s} cx={16} cy={11} r={5.2} />
          <path {...s} d="M 11.5 8.5 a 5.2 5.2 0 0 1 9 0" />
          <path {...s} d="M 9 22 c 2.5 -3 12 -3 14 0" />
        </>
      )}
      {kind === 'rest' && (
        <>
          <circle {...s} cx={16} cy={13} r={5.5} />
          <path {...s} d="M 16 4.5 v 2.4 M 16 21 v 2.4 M 6.5 13 h 2.4 M 23.5 13 h 2.4" />
          <path {...s} d="M 9.5 6.5 l 1.7 1.7 M 20.8 19.3 l 1.7 1.7 M 22.5 6.5 l -1.7 1.7 M 11.2 19.3 l -1.7 1.7" />
        </>
      )}
    </svg>
  )
}

const TABS = [
  { key: 'week', label: 'The Week' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'resort', label: 'Resort Weekend' },
  { key: 'ideas', label: 'Ideas' },
] as const
type TabKey = (typeof TABS)[number]['key']

type Idea = { id: string; name: string; category: string; message: string; createdAt: string }

const IDEA_CATEGORIES = ['Saturday Activity', 'Saturday Dinner', 'Resort Weekend', 'Week Idea', 'Gift Idea', 'Other']

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function Lourdes60thPage() {
  const [tab, setTab] = useState<TabKey>('week')

  const [ideas, setIdeas] = useState<Idea[]>([])
  const [iName, setIName] = useState('')
  const [iCategory, setICategory] = useState(IDEA_CATEGORIES[0])
  const [iMessage, setIMessage] = useState('')
  const [iSending, setISending] = useState(false)
  const [iError, setIError] = useState('')

  useEffect(() => {
    fetch('/api/lourdes60th/ideas')
      .then((r) => r.json())
      .then((d) => setIdeas(d.ideas || []))
      .catch(() => {})
  }, [])

  async function submitIdea(e: React.FormEvent) {
    e.preventDefault()
    setIError('')
    if (!iName.trim() || !iMessage.trim()) {
      setIError('Add your name and an idea.')
      return
    }
    setISending(true)
    try {
      const res = await fetch('/api/lourdes60th/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: iName, category: iCategory, message: iMessage }),
      })
      const data = await res.json()
      if (data.success && data.idea) {
        setIdeas((prev) => [data.idea, ...prev])
        setIMessage('')
      } else {
        setIError(data.error || 'Something went wrong.')
      }
    } catch {
      setIError('Something went wrong.')
    } finally {
      setISending(false)
    }
  }

  // ── Shared style atoms ─────────────────────────────────────────────────────
  const kicker: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 9.5,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: C.greenSoft,
  }
  const sectionLabel: React.CSSProperties = {
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: C.gold,
    fontWeight: 600,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: C.frame,
    border: `1px solid ${C.line}`,
    color: C.green,
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
  const btnGreen: React.CSSProperties = {
    justifySelf: 'start',
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: C.frame,
    background: C.gold,
    border: `1px solid ${C.gold}`,
    padding: '11px 22px',
    cursor: 'pointer',
  }

  // ── Tab bodies ─────────────────────────────────────────────────────────────
  const weekTab = (
    <div>
      <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16.5, color: C.gold, margin: '0 0 8px' }}>
        Nothing here is fixed — think of this as a shared notebook for the week, not a locked itinerary.
      </p>
      <div style={{ borderTop: `1px solid ${C.line}` }} className="l60-week">
        {WEEK_ARC.map((day) => (
          <article
            key={day.idx}
            className="l60-week-day"
            style={{ borderBottom: `1px solid ${C.line}`, padding: '16px 0', background: day.mark ? '#B07A2E0C' : 'transparent' }}
          >
            <div>
              <div style={{ ...kicker, color: C.gold }}>{day.date}</div>
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(22px,3vw,27px)', fontWeight: 600, lineHeight: 1.05, color: C.green, margin: '2px 0 0' }}>
                {day.star && <span style={{ color: C.gold, marginRight: 6 }}>★</span>}
                {day.title}
              </h2>
            </div>
            <p style={{ fontFamily: serif, fontSize: 16.5, lineHeight: 1.4, color: C.greenSoft, margin: 0, maxWidth: '78ch' }}>{day.desc}</p>
          </article>
        ))}
      </div>
    </div>
  )

  const saturdayTab = (
    <div>
      <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16.5, color: C.gold, margin: '0 0 14px' }}>
        One big day, all of us together — an activity, then dinner somewhere special. Drop your favorite idea on the Wall.
      </p>
      <div style={{ ...sectionLabel, marginBottom: 10 }}>The Activity</div>
      <div style={{ borderTop: `1px solid ${C.line}`, marginBottom: 22 }}>
        {ACTIVITY_IDEAS.map((p) => (
          <div key={p.title} style={{ padding: '13px 0', borderBottom: `1px solid ${C.line}`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 auto', width: 44, height: 44, border: `1px solid ${C.line}`, background: C.frame, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 3 }}>
              <IdeaIcon kind={p.icon} />
            </div>
            <div>
              <div style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, color: C.green }}>{p.title}</div>
              <p style={{ fontFamily: serif, fontSize: 16, lineHeight: 1.38, color: C.greenSoft, margin: '2px 0 0', maxWidth: '72ch' }}>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...sectionLabel, marginBottom: 10 }}>Dinner, Somewhere Special</div>
      <div style={{ display: 'grid', gap: 10 }} className="l60-dinner">
        {DINNER_IDEAS.map((d) => (
          <div key={d.title} style={{ border: `1px solid ${C.line}`, background: C.frame, padding: '14px 16px' }}>
            <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.green }}>{d.title}</div>
            <p style={{ fontFamily: serif, fontSize: 15.5, lineHeight: 1.4, color: C.greenSoft, margin: '3px 0 0' }}>{d.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const resortTab = (
    <div>
      <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16.5, color: C.gold, margin: '0 0 6px' }}>
        Lori's gift to Lourdes — a couple of days away together, just the two of you. Bring your partner along if you'd like.
      </p>
      <p style={{ fontFamily: serif, fontSize: 16.5, lineHeight: 1.45, color: C.greenSoft, margin: '0 0 22px', maxWidth: '76ch' }}>
        A resort on Panama's Pacific coast, a couple of hours from the city — exact place and dates still open. The idea: mornings loose and social, the youth (10–40) running the games; afternoons slow, for whoever wants slow.
      </p>
      <div style={{ ...sectionLabel, marginBottom: 10 }}>Mornings — Sports with the Youth</div>
      <div style={{ borderTop: `1px solid ${C.line}`, marginBottom: 22 }}>
        {RESORT_MORNING_SPORTS.map((s) => (
          <div key={s} style={{ padding: '11px 0', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <span style={{ flex: '0 0 auto', width: 5, height: 5, borderRadius: '50%', border: `1px solid ${C.gold}`, transform: 'translateY(-2px)' }} />
            <span style={{ fontFamily: serif, fontSize: 17.5, color: C.green }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ ...sectionLabel, marginBottom: 10 }}>Afternoons</div>
      <p style={{ fontFamily: serif, fontSize: 16.5, lineHeight: 1.45, color: C.greenSoft, margin: 0, maxWidth: '76ch' }}>
        Open — the pool, the spa, a card table, a nap. This half of the day belongs to Lourdes.
      </p>
    </div>
  )

  const ideasTab = (
    <div>
      <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16.5, color: C.gold, margin: '0 0 16px' }}>
        Simple, easy-paced ideas for the open days — something for the elders and something for the kids, sometimes both.
      </p>
      <div style={{ display: 'grid', gap: 12 }} className="l60-idea-groups">
        {IDEA_GROUPS.map((g) => (
          <div key={g.label} style={{ border: `1px solid ${C.line}`, background: C.frame, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ flex: '0 0 auto', width: 36, height: 36, border: `1px solid ${C.line}`, background: C.field, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IdeaIcon kind={g.icon} />
              </div>
              <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.green }}>{g.label}</div>
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {g.items.map((item) => (
                <div key={item} style={{ fontFamily: serif, fontSize: 16, color: C.greenSoft }}>· {item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const tabBody = tab === 'week' ? weekTab : tab === 'saturday' ? saturdayTab : tab === 'resort' ? resortTab : ideasTab

  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '0 0 70px' }}>
      <div style={{ maxWidth: 'none', margin: 0 }}>
        <div style={{ background: C.frame, padding: '0 0 clamp(12px,2.4vw,18px)', boxShadow: '0 26px 64px -30px rgba(24,30,18,.4)' }}>
          <div style={{ display: 'grid', gap: 'clamp(12px,2.4vw,18px)' }} className="l60-grid">
            <section style={cardStyle} className="l60-main">
              <div style={{ ...sectionLabel, marginBottom: 8 }}>Lourdes · 60th Birthday · Panama</div>
              <h1 style={{ fontFamily: serif, fontSize: 'clamp(32px,5vw,46px)', fontWeight: 600, lineHeight: 1.02, color: C.green, margin: '0 0 10px' }}>
                Lourdes Turns 60
              </h1>
              <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(18px,2.4vw,22px)', lineHeight: 1.3, color: C.gold, margin: '0 0 14px', maxWidth: '60ch' }}>
                A week to brainstorm together — family and friends in Panama, closing with her birthday on Monday.
              </p>
              <p style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.4, color: C.green, fontWeight: 600, margin: '0 0 2px' }}>
                Week of Oct 19–26, 2026 · Panama · open to family & friends
              </p>
              <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15.5, color: C.goldSoft, margin: '0 0 20px' }}>
                Saturday Oct 24 — family day · Monday Oct 26 — the birthday
              </p>

              {/* Tabs */}
              <div className="l60-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, borderBottom: `1px solid ${C.line}`, marginBottom: 20 }}>
                {TABS.map((t) => {
                  const active = t.key === tab
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      style={{
                        fontFamily: serif,
                        fontSize: 'clamp(15px,1.8vw,17px)',
                        padding: '8px 13px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
                        color: active ? C.gold : C.greenSoft,
                        fontWeight: active ? 600 : 400,
                        cursor: 'pointer',
                        marginBottom: -1,
                      }}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
              {tabBody}
            </section>

            {/* The Wall — persistent brainstorm board */}
            <div className="l60-wall" style={{ background: C.green, border: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#e8dcc0', fontWeight: 600, marginBottom: 6 }}>The Wall</div>
              <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: '#d7e0d3', margin: '0 0 16px' }}>
                Leave an idea for the group — an activity, a restaurant, a gift idea, anything.
              </p>
              <form onSubmit={submitIdea} style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                <input style={{ ...inputStyle, background: 'rgba(248,243,231,.94)' }} value={iName} onChange={(e) => setIName(e.target.value)} placeholder="Your name" />
                <select style={{ ...inputStyle, background: 'rgba(248,243,231,.94)', appearance: 'none' }} value={iCategory} onChange={(e) => setICategory(e.target.value)}>
                  {IDEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <textarea
                  style={{ ...inputStyle, background: 'rgba(248,243,231,.94)', minHeight: 76, resize: 'vertical' }}
                  value={iMessage}
                  onChange={(e) => setIMessage(e.target.value)}
                  placeholder="Your idea…"
                />
                {iError && <div style={{ fontFamily: mono, fontSize: 11, color: '#e0a06a' }}>{iError}</div>}
                <button type="submit" disabled={iSending} style={{ ...btnGreen, padding: '9px 18px', opacity: iSending ? 0.6 : 1 }}>
                  {iSending ? 'Posting…' : 'Post to the wall'}
                </button>
              </form>
              <div style={{ display: 'grid', gap: 0 }}>
                {ideas.length === 0 && (
                  <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: '#a9b8a5', margin: 0 }}>No ideas yet — be the first.</p>
                )}
                {ideas.map((i) => (
                  <div key={i.id} style={{ padding: '12px 0', borderTop: '1px solid rgba(215,224,211,.22)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: '#fff' }}>{i.name}</span>
                      <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0f2419', background: C.goldSoft, padding: '2px 7px' }}>{i.category}</span>
                      <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9db299' }}>{formatDate(i.createdAt)}</span>
                    </div>
                    <p style={{ fontFamily: serif, fontSize: 16, lineHeight: 1.4, color: '#d7e0d3', margin: '3px 0 0', whiteSpace: 'pre-wrap' }}>{i.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: 'clamp(12px,2.4vw,18px)', textAlign: 'center', fontFamily: mono, fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.greenSoft }}>
            Lourdes <strong style={{ color: C.gold, fontWeight: 600 }}>Turns 60</strong> · Panama · Oct 2026
          </div>
        </div>
      </div>

      <style>{`
        .l60-grid { grid-template-columns: 1fr; grid-template-areas: "main" "wall"; }
        .l60-main { grid-area: main; }
        .l60-wall { grid-area: wall; padding: clamp(22px,4vw,30px); }
        .l60-week-day { display: grid; grid-template-columns: 1fr; gap: 4px; }
        .l60-dinner { grid-template-columns: 1fr; }
        .l60-idea-groups { grid-template-columns: 1fr; }
        @media (min-width: 720px) {
          .l60-week-day { grid-template-columns: 190px 1fr; gap: 18px; align-items: baseline; }
          .l60-dinner { grid-template-columns: repeat(3, 1fr); }
          .l60-idea-groups { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 880px) {
          .l60-grid { grid-template-columns: 1.7fr 1fr; grid-template-areas: "main wall"; align-items: start; }
        }
        @media (min-width: 1100px) { .l60-idea-groups { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
    </div>
  )
}
