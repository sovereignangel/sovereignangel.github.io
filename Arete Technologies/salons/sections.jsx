/* global React */
const { useState: useStateSalon } = React;

// ============================================================
// UPCOMING EVENTS — data
// ============================================================
const SALONS = [
  {
    n: 'I', no: '01',
    date: '17 JUN 2026', day: 'WEDNESDAY', time: '18:30',
    title: 'The technical stack beneath the markets',
    sub: 'How compute, energy, and data infrastructure are reshaping public companies at the 1–2 year horizon.',
    cap: 24, taken: 11,
    speakers: [
      { name: 'TBA · Hyperscaler infra', topic: 'Where the cycles are landing' },
      { name: 'TBA · Energy / data centers', topic: 'The grid as the bottleneck' },
      { name: 'TBA · Public-markets analyst', topic: 'Reading the 10-Ks differently' },
    ],
    status: 'open',
  },
  {
    n: 'II', no: '02',
    date: '15 JUL 2026', day: 'WEDNESDAY', time: '18:30',
    title: 'TBA',
    sub: 'Theme announced four weeks before. Returning guests notified first.',
    cap: 24, taken: 0,
    speakers: [],
    status: 'announce-soon',
  },
  {
    n: 'III', no: '03',
    date: '19 AUG 2026', day: 'WEDNESDAY', time: '18:30',
    title: 'TBA',
    sub: '',
    cap: 24, taken: 0,
    speakers: [],
    status: 'scheduled',
  },
  {
    n: 'IV', no: '04',
    date: '16 SEP 2026', day: 'WEDNESDAY', time: '18:30',
    title: 'TBA',
    sub: '',
    cap: 24, taken: 0,
    speakers: [],
    status: 'scheduled',
  },
];

// ============================================================
// HERO — dark, candlelit, three-column motif center
// ============================================================
function SalonHero() {
  const T = window.SalonT;
  return (
    <section style={{
      background: T.night, color: T.cream, padding: '32px 48px 96px',
      position: 'relative', overflow: 'hidden', minHeight: 720,
    }}>
      <window.Candlelight intensity={1} />
      <window.PatternColumns color={T.cream} opacity={0.04} size={80} />

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <window.SalonLockup light size="sm" stacked={false} />
        <nav style={{ display: 'flex', gap: 32, fontFamily: T.mono, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          {['Format', 'Schedule', 'Upcoming', 'RSVP', 'House'].map(s => (
            <a key={s} href={`#${s.toLowerCase()}`} style={{ color: T.cream, textDecoration: 'none', opacity: 0.7 }}>{s}</a>
          ))}
        </nav>
      </div>

      {/* Hero center */}
      <div style={{
        textAlign: 'center', marginTop: 80, position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6 }}>
          ARETE · A SALON · MMXXVI
        </div>

        <h1 style={{
          fontFamily: T.serif, fontSize: 140, fontWeight: 400, lineHeight: 1.02,
          margin: '32px 0 8px', letterSpacing: '-0.01em', fontStyle: 'italic',
          color: T.cream,
        }}>
          The Long View<span style={{ color: T.ember }}>.</span>
        </h1>

        {/* Three columns motif */}
        <div style={{ margin: '40px 0 8px' }}>
          <window.ThreeColumns size={90} color={T.ember} opacity={0.85} variant="classical" />
        </div>

        <div style={{ maxWidth: 580, fontFamily: T.serif, fontSize: 19, lineHeight: 1.7, opacity: 0.85, marginTop: 24 }}>
          A monthly salon for the Arete circle. Three speakers, ten minutes each.
          A panel. Open question. A long dinner.
        </div>

        <div style={{
          marginTop: 48, display: 'flex', gap: 16, alignItems: 'center',
          fontFamily: T.mono, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase',
        }}>
          <a href="#rsvp" style={{
            background: T.wine, color: T.cream, padding: '18px 32px', textDecoration: 'none',
            border: `1px solid ${T.wineLight}`,
          }}>Reserve a seat →</a>
          <a href="#upcoming" style={{
            color: T.cream, padding: '18px 32px', textDecoration: 'none',
            border: `1px solid ${T.cream}44`,
          }}>See the calendar</a>
        </div>
      </div>

      {/* bottom row */}
      <div style={{
        position: 'absolute', bottom: 32, left: 48, right: 48,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: T.mono, fontSize: 10, letterSpacing: '0.32em', opacity: 0.55, zIndex: 2,
        textTransform: 'uppercase',
      }}>
        <span>New York · By invitation</span>
        <span>III speakers · X minutes · One table</span>
        <span>Eadem mutata resurgo</span>
      </div>
    </section>
  );
}

// ============================================================
// FORMAT — the 3+panel+Q&A structure
// ============================================================
function SalonFormat() {
  const T = window.SalonT;
  const items = [
    { n: 'I',   t: 'Three speakers',     d: 'Ten minutes each. No slides unless essential. One idea, well-formed.', icon: 'columns' },
    { n: 'II',  t: 'A panel',            d: 'The three return to the table. The host presses on the seams.', icon: 'table' },
    { n: 'III', t: 'Open question',      d: 'The room takes over. Anyone may ask. Anyone may answer.', icon: 'candle' },
    { n: 'IV',  t: 'A long dinner',      d: 'The salon properly begins. Catered. No itinerary past this point.', icon: 'table' },
  ];
  return (
    <section id="format" style={{ background: T.cream, color: T.ink, padding: '120px 48px', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 72 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
              I · LA FORME
            </div>
            <h2 style={{ fontFamily: T.serif, fontSize: 60, fontWeight: 400, lineHeight: 1, margin: 0, fontStyle: 'italic' }}>
              How an evening<br />unfolds.
            </h2>
          </div>
          <div style={{ maxWidth: 360, fontSize: 15, lineHeight: 1.7, opacity: 0.78 }}>
            Two hours of structure, then dinner. Doors at 18:30. Aperitif while the table fills. Brief introductions; the format does the rest.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}` }}>
          {items.map((it, i) => (
            <div key={it.n} style={{
              padding: '40px 28px',
              borderRight: i < 3 ? `1px solid ${T.ink}33` : 'none',
              display: 'flex', flexDirection: 'column', gap: 16, minHeight: 320,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: T.serif, fontSize: 44, fontStyle: 'italic', color: T.wine, lineHeight: 1 }}>{it.n}</div>
                <div style={{ marginTop: 4 }}>
                  {it.icon === 'columns' && <window.ThreeColumns size={36} color={T.ink} opacity={0.45} variant="minimal" />}
                  {it.icon === 'table' && (
                    <svg viewBox="0 0 60 60" width="36" height="36" style={{ opacity: 0.45 }}>
                      <rect x="8" y="24" width="44" height="12" fill="none" stroke={T.ink} strokeWidth="1" />
                      {[14, 22, 30, 38, 46].map(x => (
                        <circle key={x} cx={x} cy="18" r="2.5" fill="none" stroke={T.ink} strokeWidth="0.75" />
                      ))}
                      {[14, 22, 30, 38, 46].map(x => (
                        <circle key={x} cx={x} cy="42" r="2.5" fill="none" stroke={T.ink} strokeWidth="0.75" />
                      ))}
                    </svg>
                  )}
                  {it.icon === 'candle' && <window.Candle size={32} color={T.ink} />}
                </div>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 26, lineHeight: 1.1, fontStyle: 'italic' }}>{it.t}</div>
              <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.65, opacity: 0.75 }}>{it.d}</div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 32, fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, opacity: 0.65, maxWidth: 600,
        }}>
          "The whole is more than the sum of its parts."
          <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', marginLeft: 16, opacity: 0.7, fontStyle: 'normal' }}>
            — ARISTOTLE
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SCHEDULE — the evening's exact timing
// ============================================================
function Schedule() {
  const T = window.SalonT;
  const rows = [
    ['18:30', 'Doors',                  'Aperitif as the table fills'],
    ['19:00', 'Speaker I',              '10 min · one idea'],
    ['19:15', 'Speaker II',             '10 min · one idea'],
    ['19:30', 'Speaker III',            '10 min · one idea'],
    ['19:45', 'Panel',                  '30 min · the host presses'],
    ['20:15', 'Open question',          'The room takes over'],
    ['20:45', 'Dinner',                 'Catered · long table · no itinerary'],
  ];
  return (
    <section id="schedule" style={{ background: T.paper, color: T.ink, padding: '120px 48px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
          II · LE PROGRAMME
        </div>
        <h2 style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, lineHeight: 1, margin: '0 0 48px', fontStyle: 'italic' }}>
          The evening, hour by hour.
        </h2>
        <div style={{ borderTop: `1px solid ${T.ink}` }}>
          {rows.map(([t, h, d], i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '100px 1fr 1.5fr',
              gap: 32, padding: '20px 0',
              borderBottom: `1px solid ${T.ink}33`,
              alignItems: 'baseline',
            }}>
              <div style={{ fontFamily: T.mono, fontSize: 14, letterSpacing: '0.18em', color: T.wine }}>{t}</div>
              <div style={{ fontFamily: T.serif, fontSize: 22, fontStyle: 'italic' }}>{h}</div>
              <div style={{ fontFamily: T.serif, fontSize: 15, opacity: 0.75, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// UPCOMING — the salon calendar
// ============================================================
function Upcoming() {
  const T = window.SalonT;
  return (
    <section id="upcoming" style={{ background: T.night, color: T.cream, padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
      <window.PatternColumns color={T.cream} opacity={0.04} size={100} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.55, marginBottom: 16 }}>
              III · LE CALENDRIER
            </div>
            <h2 style={{ fontFamily: T.serif, fontSize: 60, fontWeight: 400, lineHeight: 1, margin: 0, fontStyle: 'italic' }}>
              Upcoming salons.
            </h2>
          </div>
          <div style={{ maxWidth: 320, fontFamily: T.serif, fontSize: 15, lineHeight: 1.6, opacity: 0.7 }}>
            One Wednesday a month. Same table. Different question.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {SALONS.map((s, i) => (
            <a key={s.n} href={`#rsvp-${s.n}`} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 2fr 1fr 120px',
              gap: 32, padding: '36px 24px',
              borderTop: `1px solid ${T.cream}22`,
              borderBottom: i === SALONS.length - 1 ? `1px solid ${T.cream}22` : 'none',
              alignItems: 'center', textDecoration: 'none', color: T.cream,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.cream + '08'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontFamily: T.serif, fontSize: 56, fontStyle: 'italic', color: T.ember, lineHeight: 1 }}>
                {s.n}
              </div>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.32em', opacity: 0.75 }}>{s.date}</div>
                <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.32em', opacity: 0.5, marginTop: 6 }}>{s.day} · {s.time}</div>
              </div>
              <div>
                <div style={{ fontFamily: T.serif, fontSize: 24, fontStyle: 'italic', lineHeight: 1.2 }}>{s.title}</div>
                {s.sub && <div style={{ fontFamily: T.serif, fontSize: 14, opacity: 0.65, marginTop: 8, lineHeight: 1.5 }}>{s.sub}</div>}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', opacity: 0.65, textTransform: 'uppercase' }}>
                {s.status === 'open' && <span style={{ color: T.ember }}>● Open · {s.cap - s.taken}/{s.cap}</span>}
                {s.status === 'announce-soon' && <span style={{ opacity: 0.6 }}>● Soon</span>}
                {s.status === 'scheduled' && <span style={{ opacity: 0.4 }}>● Scheduled</span>}
              </div>
              <div style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em' }}>
                {s.status === 'open' ? 'RSVP →' : '—'}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// RSVP — per-event picker (mirrors Mistral structure)
// ============================================================
function SalonRSVP() {
  const T = window.SalonT;
  const open = SALONS.filter(s => s.status === 'open' || s.status === 'announce-soon');
  const [taken, setTaken] = useStateSalon(Object.fromEntries(SALONS.map(s => [s.n, s.taken])));
  const [picked, setPicked] = useStateSalon([SALONS[0].n]);
  const [seats, setSeats] = useStateSalon(1);
  const [name, setName] = useStateSalon('');
  const [email, setEmail] = useStateSalon('');
  const [note, setNote] = useStateSalon('');
  const [submitted, setSubmitted] = useStateSalon(false);

  const toggle = (n) => setPicked(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);

  const submit = (e) => {
    e.preventDefault();
    setTaken(t => {
      const next = { ...t };
      picked.forEach(n => {
        const cap = SALONS.find(s => s.n === n).cap;
        next[n] = Math.min(cap, next[n] + seats);
      });
      return next;
    });
    setSubmitted(true);
  };

  return (
    <section id="rsvp" style={{ background: T.cream, color: T.ink, padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
      <window.PatternColumns color={T.wine} opacity={0.04} size={100} />
      <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
          IV · RÉSERVER
        </div>
        <h2 style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, lineHeight: 1, margin: '0 0 16px', fontStyle: 'italic' }}>
          Reserve a seat.
        </h2>
        <p style={{ fontFamily: T.serif, fontSize: 16, opacity: 0.75, maxWidth: 580, margin: '0 0 48px' }}>
          Twenty-four seats at the table. The salon is by invitation; LPs and one guest each. We confirm within forty-eight hours.
        </p>

        {!submitted ? (
          <form onSubmit={submit}>
            {/* Event picker */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
              {SALONS.map(s => {
                const remaining = s.cap - taken[s.n];
                const sel = picked.includes(s.n);
                const dim = s.status !== 'open' && s.status !== 'announce-soon';
                const full = remaining <= 0;
                const dis = dim || full;
                return (
                  <label key={s.n} style={{
                    cursor: dis ? 'not-allowed' : 'pointer',
                    border: `1px solid ${sel ? T.ink : T.ink + '44'}`,
                    background: sel ? T.ink : 'transparent',
                    color: sel ? T.cream : T.ink,
                    padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    opacity: dis ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}>
                    <input type="checkbox" checked={sel} onChange={() => !dis && toggle(s.n)} disabled={dis} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontFamily: T.serif, fontSize: 32, fontStyle: 'italic', lineHeight: 1, color: sel ? T.ember : T.wine }}>
                        {s.n}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.7 }}>
                        {full ? 'COMPLET' : s.status === 'open' ? `${remaining}/${s.cap}` : 'SOON'}
                      </div>
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.25em', opacity: 0.7 }}>
                      {s.date}
                    </div>
                    <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.3, opacity: 0.9, minHeight: 36 }}>
                      {s.title.length > 36 ? s.title.slice(0, 34) + '…' : s.title}
                    </div>
                    <div style={{ height: 2, background: sel ? T.cream + '33' : T.ink + '22', position: 'relative', marginTop: 'auto' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: `${(taken[s.n] / s.cap) * 100}%`,
                        background: sel ? T.ember : T.wine,
                      }} />
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 24, marginBottom: 32 }}>
              <SalonField label="Name" value={name} onChange={setName} placeholder="Your full name" />
              <SalonField label="Email" value={email} onChange={setEmail} placeholder="you@arete.tech" type="email" />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', opacity: 0.65 }}>
                  Seats
                </span>
                <select value={seats} onChange={e => setSeats(Number(e.target.value))} style={{
                  background: 'transparent', border: 'none', borderBottom: `1px solid ${T.ink}`,
                  padding: '10px 0', fontFamily: T.serif, fontSize: 17, color: T.ink, outline: 'none',
                }}>
                  <option value={1}>1 (just me)</option>
                  <option value={2}>2 (with guest)</option>
                </select>
              </label>
            </div>
            <SalonField label="Anything we should know?" value={note} onChange={setNote} placeholder="Dietary, the guest's name, a topic you'd open with…" textarea />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingTop: 24, borderTop: `1px solid ${T.ink}33` }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', opacity: 0.6, textTransform: 'uppercase' }}>
                {picked.length === 0
                  ? 'Pick one or more salons'
                  : `${picked.length} salon${picked.length > 1 ? 's' : ''} · ${seats} seat${seats > 1 ? 's' : ''}`}
              </div>
              <button type="submit" disabled={picked.length === 0 || !name || !email} style={{
                background: T.wine, color: T.cream, padding: '18px 36px', border: 'none', cursor: 'pointer',
                fontFamily: T.mono, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase',
                opacity: (picked.length === 0 || !name || !email) ? 0.4 : 1,
              }}>
                Submit RSVP →
              </button>
            </div>
          </form>
        ) : (
          <div style={{
            border: `1px solid ${T.ink}`, padding: '48px 40px', textAlign: 'center',
            background: T.paper,
          }}>
            <window.SalonSeal size={120} color={T.wine} center="✓" sub="REÇU · MERCI" />
            <div style={{ fontFamily: T.serif, fontSize: 32, fontStyle: 'italic', marginTop: 24 }}>
              Reçu. Merci, {name.split(' ')[0] || 'ami'}.
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 16, opacity: 0.75, marginTop: 12, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Confirmation for salon{picked.length > 1 ? 's' : ''} {picked.join(', ')} arriving at {email} within 48 hours. Look for a small invitation card, posted.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SalonField({ label, value, onChange, placeholder, type = 'text', textarea }) {
  const T = window.SalonT;
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', opacity: 0.65 }}>{label}</span>
      <Tag
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        rows={textarea ? 3 : undefined}
        style={{
          background: 'transparent', border: 'none', borderBottom: `1px solid ${T.ink}`,
          padding: '10px 0', fontFamily: T.serif, fontSize: 17, color: T.ink, outline: 'none', resize: 'none',
        }}
      />
    </label>
  );
}

// ============================================================
// HOUSE — the venue / etiquette / catering
// ============================================================
function House() {
  const T = window.SalonT;
  return (
    <section id="house" style={{ background: T.paper, color: T.ink, padding: '120px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
          V · LA MAISON
        </div>
        <h2 style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, lineHeight: 1, margin: '0 0 64px', fontStyle: 'italic' }}>
          The house, the table.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
              {[
                ['Where', 'A private home in lower Manhattan. Exact address sent with confirmation.'],
                ['When', 'One Wednesday each month, 18:30 sharp. The salon ends when it ends.'],
                ['Table', 'Twenty-four seats. LPs and one guest each. Returning faces.'],
                ['Catering', 'A long, slow dinner. Seasonal. Wine paired. Allergies honored.'],
                ['Dress', 'No code. Come from the office or come from the gym.'],
                ['Recording', 'Off the record. No phones at the table.'],
              ].map(([h, b]) => (
                <div key={h}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.6, textTransform: 'uppercase' }}>{h}</div>
                  <div style={{ fontFamily: T.serif, fontSize: 16, marginTop: 6, lineHeight: 1.55 }}>{b}</div>
                </div>
              ))}
            </div>
          </div>

          {/* long table diagram */}
          <div>
            <div style={{ background: T.cream, padding: '40px 28px', border: `1px solid ${T.ink}22` }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.5, marginBottom: 24, textAlign: 'center' }}>
                XXIV SEATS · ONE TABLE
              </div>
              <window.LongTable width={400} color={T.ink} seats={22} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontFamily: T.serif, fontSize: 12, fontStyle: 'italic', opacity: 0.7 }}>
                <span>Host</span>
                <span>Speakers · panel · room</span>
                <span>Co-host</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================
function SalonFooter() {
  const T = window.SalonT;
  return (
    <footer style={{ background: T.night, color: T.cream, padding: '72px 48px 40px', position: 'relative', overflow: 'hidden' }}>
      <window.PatternColumns color={T.cream} opacity={0.03} size={120} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 48, alignItems: 'center', marginBottom: 64 }}>
          <window.SalonSeal size={120} color={T.ember} />
          <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 26, fontStyle: 'italic', lineHeight: 1.4, opacity: 0.85 }}>
            "What compounds, endures."
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <window.SalonLockup light />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.cream}22`, paddingTop: 32, fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.55, textTransform: 'uppercase' }}>
          <span>© MMXXVI · ARETE TECHNOLOGIES</span>
          <span>SALON@ARETE.TECH</span>
          <span>Eadem mutata resurgo</span>
        </div>
      </div>
    </footer>
  );
}

window.SalonHero = SalonHero;
window.SalonFormat = SalonFormat;
window.Schedule = Schedule;
window.Upcoming = Upcoming;
window.SalonRSVP = SalonRSVP;
window.House = House;
window.SalonFooter = SalonFooter;
window.SALONS = SALONS;
