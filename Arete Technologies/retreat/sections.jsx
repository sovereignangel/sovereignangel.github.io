/* global React */
const { useState, useEffect } = React;

// ============================================================
// HERO — vintage poster as the centerpiece, copy beside it
// ============================================================
function Hero() {
  const T = window.T;
  return (
    <section style={{ background: T.cream, color: T.ink, padding: '32px 48px 80px', position: 'relative', overflow: 'hidden' }}>
      <window.PatternArcs color={T.bronze} opacity={0.08} size={120} />
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <window.Lockup size="sm" />
        <nav style={{ display: 'flex', gap: 36, fontFamily: T.mono, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          <a href="#program" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>Program</a>
          <a href="#rhythm" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>Rhythm</a>
          <a href="#coaches" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>Coaches</a>
          <a href="#location" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>Lieu</a>
          <a href="#rsvp" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>RSVP</a>
        </nav>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 64, alignItems: 'center', marginTop: 60, position: 'relative', zIndex: 1 }}>
        {/* Left: copy */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6 }}>
            ARETE · LP RETREAT · MMXXVI
          </div>
          <h1 style={{
            fontFamily: T.serif, fontSize: 92, fontWeight: 400, lineHeight: 0.95,
            letterSpacing: '-0.01em', margin: '24px 0 24px',
          }}>
            <span style={{ fontStyle: 'italic' }}>Mistral.</span><br />
            Four weeks<br />
            on the wind.
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 }}>
            <div style={{ width: 32, height: 1, background: T.ink, opacity: 0.5 }} />
            <div style={{ fontSize: 11, letterSpacing: '0.42em', fontFamily: T.mono, opacity: 0.7 }}>
              JULY 2026 · CÔTE FRANÇAISE
            </div>
          </div>
          <p style={{ fontSize: 18, lineHeight: 1.65, maxWidth: 460, opacity: 0.85, margin: '0 0 32px' }}>
            The whole month of July, four spots on the French coast, kitesurf at dawn and reading at dusk. A retreat for the partners of Arete — a practice in mastery, patience, and the long horizon.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#rsvp" style={{
              background: T.ink, color: T.cream, padding: '16px 28px', textDecoration: 'none',
              fontFamily: T.mono, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase',
            }}>Reserve a week →</a>
            <a href="#program" style={{
              border: `1px solid ${T.ink}`, color: T.ink, padding: '16px 28px', textDecoration: 'none',
              fontFamily: T.mono, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase',
            }}>Read the program</a>
          </div>
        </div>

        {/* Right: poster */}
        <div style={{ position: 'relative', aspectRatio: '3/4', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.35), 0 8px 24px -8px rgba(0,0,0,0.2)' }}>
          <window.PosterVintage />
        </div>
      </div>

      {/* Bottom marquee */}
      <div style={{ marginTop: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${T.ink}33`, paddingTop: 24, position: 'relative', zIndex: 1 }}>
        {['Hyères · Var', 'Port-Saint-Louis', 'Le Barcarès', 'Leucate · La Franqui'].map((s, i) => (
          <div key={i} style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', opacity: 0.65 }}>
            <span style={{ color: T.bronze, marginRight: 10 }}>{`0${i+1}`}</span>{s}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// PROGRAM — 4 weeks, 4 places
// ============================================================
const WEEKS = [
  { n: 'I',   dates: '29 JUN — 5 JUL',  place: 'Hyères',          region: 'Var',         spot: 'L\'Almanarre',     desc: 'Long flat-water sessions on the salt lagoons. Olive trees and a quiet town.', cap: 8 },
  { n: 'II',  dates: '6 JUL — 12 JUL',  place: 'Port-Saint-Louis', region: 'Bouches-du-Rhône', spot: 'Napoléon', desc: 'Mistral country. Open Camargue beaches, wild horses, the cleanest wind in Europe.', cap: 8 },
  { n: 'III', dates: '13 JUL — 19 JUL', place: 'Le Barcarès',     region: 'Pyrénées-Orientales', spot: 'La Coudalère', desc: 'Long sand spit, shallow water, ideal for hours of progression.', cap: 8 },
  { n: 'IV',  dates: '20 JUL — 26 JUL', place: 'Leucate · La Franqui', region: 'Aude',  spot: 'Les Coussoules', desc: 'The Tramontane howls down the Pyrenees. The masters\' week.', cap: 8 },
];

function Program() {
  const T = window.T;
  return (
    <section id="program" style={{ background: T.paper, color: T.ink, padding: '120px 48px', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
              I · LE PROGRAMME
            </div>
            <h2 style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, lineHeight: 1, margin: 0, fontStyle: 'italic' }}>
              Four weeks. Four coasts.
            </h2>
          </div>
          <div style={{ maxWidth: 360, fontSize: 14, lineHeight: 1.7, opacity: 0.78, fontFamily: T.serif }}>
            Each week stands alone. Come for one, come for all four. The kite stays the same; the wind, the light, and the rock change beneath it.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: `1px solid ${T.ink}` }}>
          {WEEKS.map((w, i) => (
            <div key={w.n} style={{
              padding: '32px 24px', borderRight: i < 3 ? `1px solid ${T.ink}33` : 'none',
              borderBottom: `1px solid ${T.ink}`,
              display: 'flex', flexDirection: 'column', minHeight: 320,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontFamily: T.serif, fontSize: 48, fontStyle: 'italic', color: T.bronze, lineHeight: 1 }}>
                  {w.n}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', opacity: 0.7 }}>
                  WEEK {w.n}
                </div>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.32em', marginTop: 24, opacity: 0.7 }}>
                {w.dates}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, marginTop: 12, lineHeight: 1.1 }}>
                {w.place}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.55, marginTop: 6, textTransform: 'uppercase' }}>
                {w.region} · {w.spot}
              </div>
              <p style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, opacity: 0.78, marginTop: 16, flex: 1 }}>
                {w.desc}
              </p>
              <a href={`#rsvp-${w.n}`} style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', textDecoration: 'none',
                color: T.ink, textTransform: 'uppercase', borderTop: `1px solid ${T.ink}33`, paddingTop: 16,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Reserve</span><span>→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// RHYTHM — daily schedule
// ============================================================
function Rhythm() {
  const T = window.T;
  const items = [
    { time: '06:00', title: 'Café & le vent',     sub: 'Wind check. Coffee. Silence.', icon: 'sun' },
    { time: '07:00', title: 'Session — kite',     sub: 'Glass water. Two hours on the line.', icon: 'kite' },
    { time: '11:00', title: 'Leçon de français',   sub: 'A working French lesson over olives — conversation, not grammar drills.', icon: 'book' },
    { time: '14:00', title: 'Long lunch',         sub: 'Local catch, garden vegetables, cold rosé.', icon: 'bowl' },
    { time: '16:00', title: 'Session — kite',     sub: 'Afternoon thermals. Progression.', icon: 'wind' },
    { time: '20:00', title: 'Dinner & a talk',    sub: 'A guest, an attendee, or a coach gives a short talk. One bottle. Long table.', icon: 'olive' },
  ];
  return (
    <section id="rhythm" style={{ background: T.ink, color: T.cream, padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
      <window.PatternWaves color={T.cream} opacity={0.05} size={140} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.55, marginBottom: 16 }}>
          II · LE RYTHME
        </div>
        <h2 style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, lineHeight: 1, margin: '0 0 64px', fontStyle: 'italic' }}>
          A day, repeated <span style={{ color: T.sun }}>well</span>.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <window.Icon kind={it.icon} size={48} color={T.sun} opacity={0.9} />
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.3em', opacity: 0.6 }}>
                {it.time}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 28, fontStyle: 'italic', fontWeight: 400 }}>
                {it.title}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, opacity: 0.7 }}>
                {it.sub}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 80, paddingTop: 32, borderTop: `1px solid ${T.cream}22`, fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, opacity: 0.7, maxWidth: 580 }}>
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', marginTop: 12, opacity: 0.55, fontStyle: 'normal' }}>
            — ARISTOTLE · NICOMACHEAN ETHICS · II
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// COACHES
// ============================================================
function Coaches() {
  const T = window.T;
  const c = [
    { name: 'Théo Lacroix',     role: 'Resident kite instructor', bio: 'Pro kiteboarder, ten seasons on the French coast. Lives with us for the week — first on the water, last off it.', cred: 'IKO L3 · 12 yrs' },
    { name: 'Camille Beaumont',  role: 'Professeure de français',  bio: 'Sorbonne-trained, teaches the daily lesson over olives. Patient, funny, allergic to grammar drills.',                cred: 'DELF/DALF · 8 yrs' },
    { name: 'The table',         role: 'Reading & dialogue',       bio: 'No assigned guru. Each week the partners pick the text, share the chair, and trade questions over dinner.',          cred: 'BY THE GROUP' },
  ];
  return (
    <section id="coaches" style={{ background: T.cream, color: T.ink, padding: '120px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
          III · LES MAÎTRES
        </div>
        <h2 style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, lineHeight: 1, margin: '0 0 64px', fontStyle: 'italic' }}>
          The hands you'll learn from.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {c.map(p => (
            <div key={p.name} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* portrait placeholder — half-tone */}
              <div style={{
                aspectRatio: '4/5', background: T.paperDeep, position: 'relative', overflow: 'hidden',
                borderBottom: `1px solid ${T.ink}`,
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `radial-gradient(circle at 30% 35%, ${T.sand} 0%, transparent 45%), radial-gradient(circle at 70% 60%, ${T.bronze}66 0%, transparent 50%)`,
                }} />
                <window.PatternArcs color={T.ink} opacity={0.12} size={60} />
                <div style={{ position: 'absolute', top: 12, left: 14, fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.6 }}>
                  {p.cred}
                </div>
                <div style={{ position: 'absolute', bottom: 12, right: 14 }}>
                  <window.Icon kind={['kite', 'wave', 'book'][c.indexOf(p)]} size={32} color={T.ink} opacity={0.5} />
                </div>
              </div>
              <div style={{ paddingTop: 20 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', opacity: 0.6, textTransform: 'uppercase' }}>
                  {p.role}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 30, fontStyle: 'italic', marginTop: 6 }}>
                  {p.name}
                </div>
                <p style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.65, opacity: 0.75, marginTop: 12 }}>
                  {p.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// LOCATION & LODGING
// ============================================================
function Location() {
  const T = window.T;
  return (
    <section id="location" style={{ background: T.paper, color: T.ink, padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
          IV · LE LIEU
        </div>
        <h2 style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, lineHeight: 1, margin: '0 0 64px', fontStyle: 'italic' }}>
          Four houses by the sea.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* Map */}
          <div style={{ position: 'relative', aspectRatio: '4/3', background: T.cream, border: `1px solid ${T.ink}33`, padding: 24 }}>
            <svg viewBox="0 0 600 450" style={{ width: '100%', height: '100%' }}>
              {/* simplified southern France coast */}
              <path
                d="M 60 120 Q 110 140 180 150 L 240 170 Q 290 175 340 200 L 380 220 Q 420 240 460 260 Q 500 270 540 280 L 540 420 L 60 420 Z"
                fill={T.sand} opacity="0.5"
              />
              <path
                d="M 60 120 Q 110 140 180 150 L 240 170 Q 290 175 340 200 L 380 220 Q 420 240 460 260 Q 500 270 540 280"
                fill="none" stroke={T.ink} strokeWidth="1"
              />
              {/* Sea */}
              <text x="300" y="370" fill={T.sea} fontFamily={T.serif} fontStyle="italic" fontSize="22" textAnchor="middle" opacity="0.7">Mer Méditerranée</text>
              {/* Pyrenees */}
              <path d="M 60 130 L 80 100 L 95 115 L 110 95 L 130 120 L 145 100 L 165 125" fill="none" stroke={T.ink} strokeWidth="0.75" opacity="0.5" />

              {/* spots */}
              {[
                { x: 470, y: 258, n: 'I',   l: 'Hyères' },
                { x: 380, y: 225, n: 'II',  l: 'Port-Saint-Louis' },
                { x: 175, y: 152, n: 'III', l: 'Le Barcarès' },
                { x: 130, y: 144, n: 'IV',  l: 'Leucate' },
              ].map(p => (
                <g key={p.n}>
                  <circle cx={p.x} cy={p.y} r="5" fill={T.coral} stroke={T.ink} strokeWidth="0.75" />
                  <circle cx={p.x} cy={p.y} r="14" fill="none" stroke={T.coral} strokeWidth="0.5" opacity="0.5" />
                  <text x={p.x} y={p.y - 22} fill={T.ink} fontFamily={T.mono} fontSize="10" textAnchor="middle" letterSpacing="2">{p.n}</text>
                  <text x={p.x} y={p.y + 22} fill={T.ink} fontFamily={T.serif} fontStyle="italic" fontSize="13" textAnchor="middle">{p.l}</text>
                </g>
              ))}

              {/* compass */}
              <g transform="translate(540, 60)">
                <circle r="22" fill="none" stroke={T.ink} strokeWidth="0.6" />
                <path d="M 0 -22 L 4 0 L 0 22 L -4 0 Z" fill={T.ink} />
                <text y="-26" fill={T.ink} fontFamily={T.mono} fontSize="8" textAnchor="middle" letterSpacing="1">N</text>
              </g>
            </svg>
          </div>

          {/* Right copy */}
          <div>
            <p style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.7, opacity: 0.85 }}>
              Each week we take over a stone farmhouse or a villa within walking distance of the launch beach. Six bedrooms, a long table, a kitchen run by a local cook, a small library curated for the week.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginTop: 32 }}>
              {[
                ['Lodging', '6 ensuite rooms · long table · garden'],
                ['Equipment', 'Full kite quiver provided · all skill levels'],
                ['Coaching', '1:3 ratio · radio in-water · video review'],
                ['Transit', 'Met at TGV / airport · all transfers included'],
              ].map(([h, b]) => (
                <div key={h}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.6, textTransform: 'uppercase' }}>{h}</div>
                  <div style={{ fontFamily: T.serif, fontSize: 15, marginTop: 6, lineHeight: 1.5 }}>{b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// RSVP — per-week capacity tracker (stub)
// ============================================================
function RSVP() {
  const T = window.T;
  // Demo: sample taken counts; user would wire real backend.
  const initial = { I: 3, II: 5, III: 2, IV: 6 };
  const [taken, setTaken] = useState(initial);
  const [picked, setPicked] = useState(['II']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggle = (n) => setPicked(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);

  const submit = (e) => {
    e.preventDefault();
    // Stubbed: optimistic local update only. Backend wires later.
    setTaken(t => {
      const next = { ...t };
      picked.forEach(n => { next[n] = Math.min(WEEKS.find(w => w.n === n).cap, next[n] + 1); });
      return next;
    });
    setSubmitted(true);
  };

  return (
    <section id="rsvp" style={{ background: T.cream, color: T.ink, padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
      <window.PatternArcs color={T.bronze} opacity={0.06} size={120} />
      <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
          V · RÉSERVER
        </div>
        <h2 style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, lineHeight: 1, margin: '0 0 16px', fontStyle: 'italic' }}>
          Reserve a week.
        </h2>
        <p style={{ fontFamily: T.serif, fontSize: 16, opacity: 0.75, maxWidth: 540, margin: '0 0 56px' }}>
          Eight spots per week. Pick one or several — you may attend more than one. We'll confirm by post within forty-eight hours.
        </p>

        {!submitted ? (
          <form onSubmit={submit}>
            {/* Week picker */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
              {WEEKS.map(w => {
                const remaining = w.cap - taken[w.n];
                const sel = picked.includes(w.n);
                const full = remaining <= 0;
                return (
                  <label key={w.n} style={{
                    cursor: full ? 'not-allowed' : 'pointer',
                    border: `1px solid ${sel ? T.ink : T.ink + '44'}`,
                    background: sel ? T.ink : 'transparent',
                    color: sel ? T.cream : T.ink,
                    padding: '20px 18px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    opacity: full ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}>
                    <input type="checkbox" checked={sel} onChange={() => !full && toggle(w.n)} disabled={full} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontFamily: T.serif, fontSize: 32, fontStyle: 'italic', lineHeight: 1, color: sel ? T.sun : T.bronze }}>
                        {w.n}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.7 }}>
                        {full ? 'COMPLET' : `${remaining}/${w.cap}`}
                      </div>
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.25em', opacity: 0.7 }}>
                      {w.dates}
                    </div>
                    <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.2 }}>
                      {w.place}
                    </div>
                    {/* capacity bar */}
                    <div style={{ height: 2, background: sel ? T.cream + '33' : T.ink + '22', position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: `${(taken[w.n] / w.cap) * 100}%`,
                        background: sel ? T.sun : T.bronze,
                      }} />
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <Field label="Name" value={name} onChange={setName} placeholder="Your full name" />
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@arete.tech" type="email" />
            </div>
            <Field label="Anything we should know?" value="" onChange={() => {}} placeholder="Skill level, dietary, partner attending, etc." textarea />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingTop: 24, borderTop: `1px solid ${T.ink}33` }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', opacity: 0.6, textTransform: 'uppercase' }}>
                {picked.length === 0 ? 'Pick one or more weeks' : `${picked.length} week${picked.length > 1 ? 's' : ''} selected`}
              </div>
              <button type="submit" disabled={picked.length === 0 || !name || !email} style={{
                background: T.ink, color: T.cream, padding: '18px 36px', border: 'none', cursor: 'pointer',
                fontFamily: T.mono, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase',
                opacity: (picked.length === 0 || !name || !email) ? 0.4 : 1,
              }}>
                Submit RSVP →
              </button>
            </div>
          </form>
        ) : (
          <div style={{
            border: `1px solid ${T.ink}`, padding: '48px', textAlign: 'center',
            background: T.paper,
          }}>
            <window.Seal size={120} color={T.bronze} center="✓" sub="REÇU · MERCI" />
            <div style={{ fontFamily: T.serif, fontSize: 32, fontStyle: 'italic', marginTop: 24 }}>
              Reçu. Merci, {name.split(' ')[0] || 'ami'}.
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 16, opacity: 0.75, marginTop: 12 }}>
              Confirmation for week{picked.length > 1 ? 's' : ''} {picked.join(', ')} arriving at {email} within 48 hours.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', textarea }) {
  const T = window.T;
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', opacity: 0.65 }}>
        {label}
      </span>
      <Tag
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={textarea ? 3 : undefined}
        style={{
          background: 'transparent', border: 'none', borderBottom: `1px solid ${T.ink}`,
          padding: '10px 0', fontFamily: T.serif, fontSize: 17, color: T.ink, outline: 'none',
          resize: 'none',
        }}
      />
    </label>
  );
}

// ============================================================
// FAQ
// ============================================================
function FAQ() {
  const T = window.T;
  const items = [
    ['Do I need to know how to kitesurf?',  'No. We host complete beginners through advanced riders, with a 1:3 coach ratio across three skill streams.'],
    ['Can I bring a partner?',              'Yes. Each room is a double; partners are welcome whether they kite or not. Reading and meals are open to all.'],
    ['What\'s included?',                   'Lodging, meals, all kite equipment, coaching, ground transfers, and the reading. Travel to France is on you.'],
    ['Can I attend more than one week?',    'Absolutely — many partners do two. Pick all the weeks you want on the form above.'],
    ['What if the wind doesn\'t come?',     'It will (this is southern France in July). On the rare flat day: foiling, freediving, or a long lunch and a longer book.'],
    ['Is this an Arete fund event?',        'Yes — the Mistral retreat is hosted by Arete Technologies for our LPs and a few invited friends. It is not a fund expense to LPs.'],
  ];
  const [open, setOpen] = useState(0);
  return (
    <section style={{ background: T.paper, color: T.ink, padding: '120px 48px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
          VI · QUESTIONS
        </div>
        <h2 style={{ fontFamily: T.serif, fontSize: 56, fontWeight: 400, lineHeight: 1, margin: '0 0 48px', fontStyle: 'italic' }}>
          Foire aux questions.
        </h2>
        <div style={{ borderTop: `1px solid ${T.ink}` }}>
          {items.map(([q, a], i) => (
            <div key={i} style={{ borderBottom: `1px solid ${T.ink}33` }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                padding: '24px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', fontFamily: T.serif, fontSize: 21, color: T.ink,
              }}>
                <span>{q}</span>
                <span style={{ fontFamily: T.mono, fontSize: 14, opacity: 0.6 }}>{open === i ? '—' : '+'}</span>
              </button>
              {open === i && (
                <div style={{ paddingBottom: 24, fontFamily: T.serif, fontSize: 16, lineHeight: 1.7, opacity: 0.78, maxWidth: 720 }}>
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  const T = window.T;
  return (
    <footer style={{ background: T.ink, color: T.cream, padding: '80px 48px 48px', position: 'relative', overflow: 'hidden' }}>
      <window.PatternWaves color={T.cream} opacity={0.04} size={200} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 48, alignItems: 'center', marginBottom: 64 }}>
          <window.Seal size={120} color={T.sun} />
          <div style={{ textAlign: 'center', fontFamily: T.serif, fontSize: 28, fontStyle: 'italic', lineHeight: 1.4, opacity: 0.85 }}>
            "On the wind,<br />the long view."
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <window.Lockup light />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.cream}22`, paddingTop: 32, fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.55, textTransform: 'uppercase' }}>
          <span>© MMXXVI · ARETE TECHNOLOGIES</span>
          <span>MISTRAL@ARETE.TECH</span>
          <span>NEW YORK · ATHENS · FRANCE</span>
        </div>
      </div>
    </footer>
  );
}

window.Hero = Hero;
window.Program = Program;
window.Rhythm = Rhythm;
window.Coaches = Coaches;
window.Location = Location;
window.RSVP = RSVP;
window.FAQ = FAQ;
window.Footer = Footer;
window.WEEKS = WEEKS;
