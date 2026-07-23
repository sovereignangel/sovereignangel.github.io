'use client'

import { useEffect, useState } from 'react'

// ── Palette (matches the Peak State II flyer at /35) ─────────────────────────
const C = {
  page: '#DDD2BA',
  frame: '#F3ECDB',
  field: '#EFE7D4',
  navy: '#26374D',
  navySoft: '#54677E',
  coffee: '#6E4A30',
  coffeeSoft: '#9A7351',
  line: '#C8BC9F',
  good: '#3d6e4f',
  marginal: '#9A7351',
}

const serif = 'var(--font-cormorant), Georgia, serif'
const mono = 'var(--font-plex-mono), monospace'

const kicker: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 11,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: C.coffee,
  fontWeight: 600,
}

const cardStyle: React.CSSProperties = {
  border: `1px solid ${C.line}`,
  background: C.frame,
  padding: '16px 18px',
}

// ── Day-by-day itinerary ───────────────────────────────────────────────────
const ITINERARY = [
  {
    date: 'Fri · Aug 7',
    title: 'Retreat Wraps → Into the City',
    highlights: [
      'Farewell brunch at the house in Frederiksværk, then we peel off south into central Copenhagen',
      'Settle in — an easy first night, just the two of us',
    ],
  },
  {
    date: 'Sat · Aug 8',
    title: 'North Coast',
    highlights: [
      'Cycle the coastal loop — Bellevue, Klampenborg, Dyrehaven (push to Louisiana on the long option)',
      'Kite session at Amager Strandpark if the wind window holds',
    ],
  },
  {
    date: 'Sun · Aug 9',
    title: 'South Coast',
    highlights: [
      'Cycle south to Dragør via Amager Strandpark and Kastrup Søbad',
      'Kite session at Sydvestpynten — best local spot in a west wind',
    ],
  },
  {
    date: 'Mon · Aug 10',
    title: 'Departure',
    highlights: [
      'Morning at SMK or Frederiksberg Gardens before packing up',
      'Last coffee + vintage pass on the way to the airport',
    ],
  },
]

// ── Sights & interests ───────────────────────────────────────────────────────
const SIGHTS: { group: string; items: { name: string; note: string }[] }[] = [
  {
    group: 'Museums',
    items: [
      { name: 'SMK — National Gallery', note: '700 years of Danish & European art, free permanent collection' },
      { name: 'Cisterns', note: 'immersive underground art space in a former water reservoir' },
      { name: 'Design Museum Denmark', note: 'Danish design lineage, chairs to ceramics' },
    ],
  },
  {
    group: 'Parks',
    items: [
      { name: 'Frederiksberg Gardens', note: 'rococo park, hilltop palace, canal rowboats, zoo elephants at the wall' },
      { name: 'Superkilen', note: 'Nørrebro — zig-zag pink park with objects from 60 countries' },
      { name: 'Naturpark Amager', note: 'wild heath & wetland reserve — also the south cycling corridor' },
    ],
  },
  {
    group: 'Specialty Coffee',
    items: [
      { name: 'Coffee Collective', note: 'Jægersborggade 57 flagship, Nørrebro — since 2008' },
      { name: 'La Cabra', note: 'Møntergade, inside Another Aspect — crisp bright brews' },
      { name: 'Prolog Coffee Bar', note: 'Vesterbro / Frederiksberg / Papirøen — single-origin, slow bar' },
      { name: 'April Coffee', note: 'Østerbro — Danish design meets Japanese minimalism' },
    ],
  },
  {
    group: 'Vintage',
    items: [
      { name: 'Jægersborggade', note: 'Nørrebro — ~40 galleries/design studios incl. Tú a Tú vintage, right by Coffee Collective' },
      { name: 'Elmegade', note: 'Nørrebro — Fremtiden (Red Cross) at the Nørrebrogade corner' },
      { name: 'Prag Secondhand', note: 'Nørrebrogade — huge vintage selection' },
      { name: 'Ravnsborggade', note: 'Nørrebro antiques strip' },
    ],
  },
]

// ── Cycling ───────────────────────────────────────────────────────────────────
const CYCLING_DAYS = [
  {
    day: 'Aug 8 · North Coast',
    short: {
      label: 'Short loop · ~48 km / 30 mi',
      route: 'Center → the Lakes → Hellerup Harbor → Charlottenlund Fort → Bellevue Beach → Klampenborg → Dyrehaven (Eremitageslottet loop) → back via Ordrup',
      stops: [
        'Charlottenlund Fort — beach + old coastal battery',
        'Bellevue Beach — swim break, café on the sand',
        "Peter Liep's Hus — forest lunch inside Dyrehaven, deer wandering nearby",
      ],
    },
    long: {
      label: 'Long loop · ~95 km / 60 mi',
      route: 'Same start, continue north past Rungsted Havn to Louisiana Museum of Modern Art in Humlebæk (~35 km one way), return the same coastal path',
      stops: ['Rungsted Havn — harborside break', 'Louisiana Museum — sculpture garden + café over the Øresund', 'Bellevue Beach — second swim stop on the way back'],
    },
  },
  {
    day: 'Aug 9 · South Coast',
    short: {
      label: 'Short loop · ~48 km / 30 mi',
      route: 'Center → Amager Strandpark → The Blue Planet (east side, ~16 km) → Dragør old town → back via Kalvebod Fælled (west side, ~25 km) with a Kongelunden forest detour',
      stops: [
        'Amager Strandpark — beach path, passes the kite launch',
        'Kastrup Søbad ("the Snail") — sea-bath swim stop',
        'Dragør — cobbled harbor town, thatched cottages, lunch',
        'Kongelunden — forest picnic on the way back',
      ],
    },
    long: {
      label: 'Long loop · ~95 km / 60 mi',
      route: "Extend the short loop with an inland pass through Store Magleby's farmhouses, then thread home via Frederiksberg Gardens and Superkilen",
      stops: ['Store Magleby — historic Dutch farming village', 'Frederiksberg Gardens — shaded rest, canal view', 'Superkilen — last stretch back into Nørrebro'],
    },
  },
]

// ── Kiteboarding ───────────────────────────────────────────────────────────────
const KITE_SPOTS = [
  {
    name: 'Amager Strandpark',
    distance: '~5 km from center',
    note: 'flattest water in the city, SW onshore, most consistent — default spot',
    links: [
      { label: 'Windy.app forecast', href: 'https://windy.app/forecast2/spot/188693/Amager+Strandpark+Copenhagen' },
      { label: 'Kiteforum spot page', href: 'https://se.kiteforum.com/kitesurf/spot/amager___strandpark' },
    ],
  },
  {
    name: 'Sydvestpynten, Dragør',
    distance: '~20 km, ~30 min south',
    note: 'best Copenhagen spot in a west wind; shallow lagoon; respect the bird-nesting no-kite zone',
    links: [
      { label: 'Windy.app forecast', href: 'https://windy.app/forecast2/spot/44834/Sydvestpynten+Dragor+Denmark' },
      { label: 'Kiteforum spot page', href: 'https://se.kiteforum.com/kitesurf/spot/amager___sydvest_pynten' },
    ],
  },
  {
    name: 'Charlottenlund Fort',
    distance: '~9 km, north side',
    note: 'open Øresund water, good on stronger-wind days',
    links: [{ label: 'Windy.app forecast', href: 'https://windy.app/forecast2/spot/770055/Charlottenlund+Fort' }],
  },
]

const COMMUNITY_LINKS = [
  { label: 'Kitekollektivet — Copenhagen spot guide', href: 'https://kitekollektivet.dk/en/kitesurfing-kobenhavn/' },
  { label: 'Mobil Kitesurf School — conditions guide', href: 'https://mobilkitesurfschool.dk/kitesurfing/' },
]

// ── Wind types (mirrors lib/kite/copenhagen-wind.ts) ──────────────────────────
interface KiteWindow {
  startHour: number
  endHour: number
  avgSpeedKn: number
  maxGustKn: number
  directionLabel: string
}
interface DayAnalysis {
  date: string
  verdict: 'good' | 'marginal' | 'light' | 'unavailable'
  window: KiteWindow | null
  peakSpeedKn: number
  avgSpeedKn: number
}

const VERDICT_LABEL: Record<DayAnalysis['verdict'], string> = {
  good: 'GOOD',
  marginal: 'MARGINAL',
  light: 'LIGHT',
  unavailable: 'NOT YET FORECAST',
}

function verdictColor(v: DayAnalysis['verdict']): string {
  if (v === 'good') return C.good
  if (v === 'marginal') return C.marginal
  return C.coffeeSoft
}

function fmtDate(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.coffee, textDecoration: 'underline', textUnderlineOffset: 3 }}
    >
      {children} →
    </a>
  )
}

export default function ThirtyFiveWeekendPage() {
  const [days, setDays] = useState<DayAnalysis[] | null>(null)
  const [windError, setWindError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/35weekend/wind')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setDays(json.days)
        else setWindError(json.error || 'Failed to load forecast')
      })
      .catch(() => setWindError('Failed to load forecast'))
  }, [])

  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '0 0 70px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,3vw,24px)' }}>
        {/* Hero */}
        <section style={{ ...cardStyle, marginTop: 'clamp(16px,3vw,28px)', padding: 'clamp(22px,4vw,34px)' }}>
          <div style={{ ...kicker, marginBottom: 8 }}>Peak State II · Copenhagen</div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(30px,5vw,44px)', fontWeight: 600, lineHeight: 1.05, color: C.navy, margin: '0 0 10px' }}>
            The Weekend After
          </h1>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(17px,2.2vw,20px)', lineHeight: 1.35, color: C.coffee, margin: '0 0 14px', maxWidth: '62ch' }}>
            The retreat wraps Friday in Frederiksværk — we peel off into the city for three more days, just the two of us. Maximize exploring, cycling, and kiting.
          </p>
          <p style={{ fontFamily: serif, fontSize: 16.5, fontWeight: 600, color: C.navy, margin: 0 }}>
            Aug 7–10, 2026 · Copenhagen · Lori & Aidas
          </p>
        </section>

        {/* Itinerary */}
        <div className="w35-itin" style={{ marginTop: 16 }}>
          {ITINERARY.map((d) => (
            <div key={d.date} style={cardStyle}>
              <div style={{ ...kicker, marginBottom: 4 }}>{d.date}</div>
              <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 8 }}>{d.title}</div>
              {d.highlights.map((h) => (
                <p key={h} style={{ fontFamily: serif, fontSize: 15, lineHeight: 1.4, color: '#46556a', margin: '0 0 6px', paddingLeft: 12, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: C.coffee }}>·</span>
                  {h}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Three columns */}
        <div className="w35-cols" style={{ marginTop: 16 }}>
          {/* Sights */}
          <section>
            <div style={{ ...kicker, marginBottom: 10 }}>Key Sights & Interests</div>
            {SIGHTS.map((g) => (
              <div key={g.group} style={{ ...cardStyle, marginBottom: 12 }}>
                <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 6 }}>{g.group}</div>
                {g.items.map((item) => (
                  <div key={item.name} style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: serif, fontSize: 15.5, fontWeight: 600, color: C.navy }}>{item.name}</div>
                    <div style={{ fontFamily: serif, fontSize: 14, lineHeight: 1.35, color: C.coffeeSoft }}>{item.note}</div>
                  </div>
                ))}
              </div>
            ))}
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.4, color: C.coffeeSoft, margin: 0 }}>
              Jægersborggade covers three columns in one stop — vintage racks, design studios, and the Coffee Collective flagship on the same block.
            </p>
          </section>

          {/* Cycling */}
          <section>
            <div style={{ ...kicker, marginBottom: 10 }}>Cycling</div>
            {CYCLING_DAYS.map((d) => (
              <div key={d.day} style={{ ...cardStyle, marginBottom: 12 }}>
                <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 8 }}>{d.day}</div>
                {[d.short, d.long].map((loop) => (
                  <div key={loop.label} style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.coffee, marginBottom: 3 }}>{loop.label}</div>
                    <p style={{ fontFamily: serif, fontSize: 14.5, lineHeight: 1.4, color: '#46556a', margin: '0 0 5px' }}>{loop.route}</p>
                    {loop.stops.map((s) => (
                      <p key={s} style={{ fontFamily: serif, fontSize: 13.5, lineHeight: 1.35, color: C.coffeeSoft, margin: '0 0 2px', paddingLeft: 11, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0 }}>·</span>
                        {s}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.4, color: C.coffeeSoft, margin: 0 }}>
              Distances are approximate — pull the exact GPX on Komoot or Strava the morning of.
            </p>
          </section>

          {/* Kiting */}
          <section>
            <div style={{ ...kicker, marginBottom: 10 }}>Kiteboarding</div>
            {KITE_SPOTS.map((spot) => (
              <div key={spot.name} style={{ ...cardStyle, marginBottom: 12 }}>
                <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.navy }}>{spot.name}</div>
                <div style={{ fontFamily: mono, fontSize: 10.5, textTransform: 'uppercase', color: C.coffeeSoft, margin: '2px 0 6px' }}>{spot.distance}</div>
                <p style={{ fontFamily: serif, fontSize: 14, lineHeight: 1.35, color: '#46556a', margin: '0 0 8px' }}>{spot.note}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {spot.links.map((l) => (
                    <ExternalLink key={l.href} href={l.href}>
                      {l.label}
                    </ExternalLink>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <div style={{ ...kicker, fontSize: 10, marginBottom: 6 }}>Community & conditions</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {COMMUNITY_LINKS.map((l) => (
                  <ExternalLink key={l.href} href={l.href}>
                    {l.label}
                  </ExternalLink>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle }}>
              <div style={{ ...kicker, fontSize: 10, marginBottom: 10 }}>Live Wind · Amager Strandpark</div>
              {windError && <p style={{ fontFamily: serif, fontSize: 14, color: '#8c2d2d' }}>{windError}</p>}
              {!windError && !days && (
                <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: C.coffeeSoft }}>Loading forecast…</p>
              )}
              {days &&
                days.map((day) => {
                  const color = verdictColor(day.verdict)
                  return (
                    <div key={day.date} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10, marginTop: 10 }} className="w35-first-no-border">
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: C.navy }}>{fmtDate(day.date)}</span>
                        <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.frame, background: color, padding: '2px 7px' }}>
                          {VERDICT_LABEL[day.verdict]}
                        </span>
                      </div>
                      {day.verdict === 'unavailable' ? (
                        <p style={{ fontFamily: serif, fontSize: 13.5, lineHeight: 1.35, color: C.coffeeSoft, margin: 0 }}>
                          Open-Meteo opens ~16 days out — check back closer to the date, or tap a live spot link above.
                        </p>
                      ) : (
                        <>
                          {day.window ? (
                            <p style={{ fontFamily: serif, fontSize: 14.5, color: C.navy, margin: '0 0 2px' }}>
                              Best window: {String(day.window.startHour).padStart(2, '0')}:00–{String(day.window.endHour).padStart(2, '0')}:00 ·{' '}
                              {day.window.avgSpeedKn} kn avg, gusts {day.window.maxGustKn} kn, {day.window.directionLabel}
                            </p>
                          ) : (
                            <p style={{ fontFamily: serif, fontSize: 14.5, color: C.navy, margin: '0 0 2px' }}>No sustained rideable window in daylight hours</p>
                          )}
                          <p style={{ fontFamily: serif, fontSize: 13, color: C.coffeeSoft, margin: 0 }}>
                            Day peak {day.peakSpeedKn} kn · day avg {day.avgSpeedKn} kn
                          </p>
                        </>
                      )}
                    </div>
                  )
                })}
            </div>
          </section>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontFamily: mono, fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.navySoft }}>
          Peak State <strong style={{ color: C.coffee, fontWeight: 600 }}>II · The Weekend After</strong> · Aug 7–10 · MMXXVI
        </div>
      </div>

      <style>{`
        .w35-itin { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .w35-cols { display: grid; grid-template-columns: 1fr; gap: 20px; align-items: start; }
        @media (min-width: 640px) {
          .w35-itin { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .w35-itin { grid-template-columns: repeat(4, 1fr); }
          .w35-cols { grid-template-columns: repeat(3, 1fr); }
        }
        .w35-first-no-border:first-child { border-top: none; padding-top: 0; margin-top: 0; }
      `}</style>
    </div>
  )
}
