/* global React */
const { useState: useDashState } = React;

// ============================================================
// THE LONG VIEW · PRE-LAUNCH DASHBOARD
// Single page · invitation-ready · save as template
// ============================================================

const PRELAUNCH = {
  dayRoman: 'XIII',
  dayArabic: 13,
  monthLong: 'JUNE',
  monthShort: 'JUN',
  year: 'MMXXVI',
  yearArabic: 2026,
  weekday: 'SATURDAY',
  weekdayShort: 'SAT',
  dateLong: 'June 13, 2026',
  startTime: '5:00 PM',
  endTime: '8:00 PM',
  timeRange: '5 — 8 PM',
  city: 'NEW YORK',
  cap: 24,
  initialTaken: 4,
  speakers: [
    { roman: 'I',   org: 'ASML',  topic: 'The lithography frontier', confirmed: true },
    { roman: 'II',  org: 'TBA',   topic: 'Speaker to be announced',  confirmed: false },
    { roman: 'III', org: 'TBA',   topic: 'Speaker to be announced',  confirmed: false },
  ],
};

function SalonDashboard() {
  const T = window.SalonT;

  // RSVP state
  const [rsvpOpen, setRsvpOpen] = useDashState(false);
  const [taken, setTaken] = useDashState(PRELAUNCH.initialTaken);
  const [seats, setSeats] = useDashState(1);
  const [name, setName] = useDashState('');
  const [email, setEmail] = useDashState('');
  const [submitted, setSubmitted] = useDashState(false);

  // Announce signup state
  const [annOpen, setAnnOpen] = useDashState(false);
  const [annEmail, setAnnEmail] = useDashState('');
  const [annSubmitted, setAnnSubmitted] = useDashState(false);

  const submit = (e) => {
    e.preventDefault();
    setTaken(t => Math.min(PRELAUNCH.cap, t + seats));
    setSubmitted(true);
  };

  const submitAnnounce = (e) => {
    e.preventDefault();
    setAnnSubmitted(true);
  };

  const remaining = PRELAUNCH.cap - taken;

  return (
    <div style={{
      minHeight: '100vh',
      background: T.night, color: T.cream,
      padding: '20px 28px 24px',
      position: 'relative', overflow: 'hidden',
      fontFamily: T.sans,
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <window.Candlelight intensity={0.85} />
      <window.PatternColumns color={T.cream} opacity={0.03} size={90} />

      {/* TOP BAR ============================================ */}
      <header style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 24, flexWrap: 'wrap',
        paddingBottom: 14, borderBottom: `1px solid ${T.cream}1f`,
      }}>
        <window.SalonLockup light size="sm" stacked={false} />
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: '0.42em', textTransform: 'uppercase',
          color: T.ember,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.ember }} />
          Pre-launch · First of the series
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', opacity: 0.55, textTransform: 'uppercase' }}>
          aretetec.com · By invitation
        </div>
      </header>

      {/* MAIN ============================================== */}
      <main style={{
        position: 'relative', zIndex: 2, flex: 1,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* HERO ============================================ */}
        <section style={{
          background: 'linear-gradient(180deg, rgba(244,239,230,0.05) 0%, rgba(244,239,230,0) 100%)',
          border: `1px solid ${T.cream}1f`,
          padding: '36px 40px 28px',
          position: 'relative', overflow: 'hidden',
          fontFamily: T.serif,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 120% 70% at 50% 25%, ${T.amber}26 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* NEXT block */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.5em', paddingLeft: '0.5em',
                color: T.ember,
              }}>
                NEXT
              </span>
              <span style={{ width: 28, height: 1, background: T.ember, opacity: 0.7 }} />
              <span style={{
                fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, color: T.cream, opacity: 0.85,
              }}>
                Pre-launch event · first of the series
              </span>
            </div>

            <h1 style={{
              fontFamily: T.serif, fontWeight: 400, lineHeight: 0.98,
              fontSize: 'clamp(48px, 6.4vw, 80px)',
              fontStyle: 'italic', color: T.cream, margin: '14px 0 22px', letterSpacing: '-0.01em',
            }}>
              The Long View<span style={{ color: T.ember }}>.</span>
            </h1>

            {/* Keynes quote */}
            <figure style={{
              margin: '0 0 22px', maxWidth: 640,
              paddingLeft: 18, borderLeft: `1px solid ${T.ember}88`,
            }}>
              <blockquote style={{
                margin: 0,
                fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400,
                fontSize: 'clamp(18px, 1.9vw, 22px)', lineHeight: 1.45,
                color: T.cream, opacity: 0.92,
              }}>
                “The difficulty lies, not in the new ideas, but in escaping from the old ones.”
              </blockquote>
              <figcaption style={{
                marginTop: 10,
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.42em',
                opacity: 0.6, textTransform: 'uppercase',
              }}>
                — J. M. Keynes
              </figcaption>
            </figure>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <window.ThreeColumns size={42} color={T.ember} variant="classical" opacity={0.85} />
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, opacity: 0.75, lineHeight: 1.4, maxWidth: 360 }}>
                Three speakers. Ten minutes each. A panel. A long dinner.
              </div>
            </div>
          </div>
        </section>

        {/* EVENT DETAILS (full width) ===================== */}
        <section style={{
          border: `1px solid ${T.cream}1f`,
          padding: '26px 28px',
          background: `${T.cream}03`,
          display: 'grid', gridTemplateColumns: 'minmax(0, auto) minmax(0, 1fr)',
          gap: 32, alignItems: 'start',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Date block */}
          <div>
            <div style={{
              display: 'inline-flex', flexDirection: 'column',
              padding: '18px 26px',
              borderTop: `1px solid ${T.ember}`, borderBottom: `1px solid ${T.ember}`,
            }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.42em', opacity: 0.65 }}>
                {PRELAUNCH.weekday}
              </div>
              <div style={{
                fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400,
                fontSize: 'clamp(40px, 4.6vw, 56px)', color: T.ember,
                lineHeight: 1.05, letterSpacing: '-0.01em',
                marginTop: 10,
              }}>
                {PRELAUNCH.dateLong}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.4em', opacity: 0.7, marginTop: 12 }}>
                {PRELAUNCH.timeRange} · {PRELAUNCH.city}
              </div>
            </div>
          </div>

          {/* Speakers preview */}
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.42em', opacity: 0.55, marginBottom: 12 }}>
              SPEAKERS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PRELAUNCH.speakers.map(sp => (
                <div key={sp.roman} style={{
                  padding: '12px 12px',
                  borderTop: `1px solid ${sp.confirmed ? T.ember + 'aa' : T.cream + '22'}`,
                  opacity: sp.confirmed ? 1 : 0.65,
                }}>
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, color: T.ember, lineHeight: 1 }}>{sp.roman}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.8, marginTop: 10, textTransform: 'uppercase' }}>
                    {sp.org}
                  </div>
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, marginTop: 4, lineHeight: 1.3, opacity: sp.confirmed ? 0.95 : 0.6 }}>
                    {sp.topic}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA ROW — Request an Invitation + Stay in the Loop ============ */}
        <section id="rsvp" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          padding: '8px 0 4px',
        }}>
          {/* Two buttons side by side */}
          {!rsvpOpen && !submitted && !annOpen && !annSubmitted && (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => setRsvpOpen(true)} style={{
                  background: T.wine, color: T.cream, padding: '14px 28px',
                  border: `1px solid ${T.wineLight}`, cursor: 'pointer',
                  fontFamily: T.mono, fontSize: 11, letterSpacing: '0.42em', textTransform: 'uppercase',
                }}>Request an Invitation →</button>
                <button onClick={() => setAnnOpen(true)} style={{
                  background: 'transparent', color: T.cream, padding: '14px 28px',
                  border: `1px solid ${T.cream}55`, cursor: 'pointer',
                  fontFamily: T.mono, fontSize: 11, letterSpacing: '0.42em', textTransform: 'uppercase',
                }}>Stay in the loop →</button>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.32em', opacity: 0.5, textTransform: 'uppercase' }}>
                {remaining} of {PRELAUNCH.cap} seats remain
              </div>
            </>
          )}

          {/* RSVP expanded */}
          {rsvpOpen && !submitted && (
            <div style={{
              width: '100%', maxWidth: 520,
              border: `1px solid ${T.ember}66`,
              padding: '24px 28px',
              background: `${T.wine}1f`,
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <TileHeader roman="I" label="L'INVITATION" title="Request an invitation" />
                <button onClick={() => setRsvpOpen(false)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: T.mono, fontSize: 16, color: T.cream, opacity: 0.5, padding: 0, lineHeight: 1,
                }} aria-label="close">×</button>
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, opacity: 0.78, lineHeight: 1.5, marginTop: 12, paddingBottom: 14, borderBottom: `1px solid ${T.cream}18` }}>
                The salon is private. We confirm within forty-eight hours.
              </div>
              <form onSubmit={submit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <DashField label="Name" value={name} onChange={setName} placeholder="Full name" />
                <DashField label="Email" value={email} onChange={setEmail} placeholder="you@aretetec.com" type="email" />
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>Seats</span>
                  <select value={seats} onChange={e => setSeats(Number(e.target.value))} style={{
                    background: 'transparent', border: 'none', borderBottom: `1px solid ${T.cream}55`,
                    padding: '6px 0', fontFamily: T.serif, fontSize: 14, color: T.cream, outline: 'none',
                  }}>
                    <option value={1} style={{ color: T.ink }}>1 — just me</option>
                    <option value={2} style={{ color: T.ink }}>2 — with guest</option>
                  </select>
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.55, textTransform: 'uppercase' }}>
                    {remaining}/{PRELAUNCH.cap} seats remain
                  </div>
                  <button type="submit" disabled={!name || !email} style={{
                    background: T.wine, color: T.cream, padding: '12px 22px', border: `1px solid ${T.wineLight}`,
                    cursor: 'pointer',
                    fontFamily: T.mono, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase',
                    opacity: (!name || !email) ? 0.4 : 1,
                  }}>Submit →</button>
                </div>
              </form>
            </div>
          )}

          {/* RSVP submitted */}
          {submitted && (
            <div style={{
              width: '100%', maxWidth: 520,
              border: `1px solid ${T.ember}66`, background: `${T.wine}1f`,
              padding: '32px 28px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12,
            }}>
              <window.Candle size={42} color={T.ember} lit />
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 22 }}>
                Reçu. Merci, {name.split(' ')[0] || 'ami'}.
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 13, opacity: 0.75, lineHeight: 1.5, maxWidth: 320 }}>
                Your request is in. Confirmation arriving at {email} within 48 hours.
              </div>
            </div>
          )}

          {/* Announce expanded */}
          {annOpen && !annSubmitted && (
            <div style={{
              width: '100%', maxWidth: 520,
              border: `1px solid ${T.cream}33`,
              padding: '24px 28px',
              background: `${T.cream}04`,
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <TileHeader roman="II" label="L'ANNONCE" title="Stay in the loop" />
                <button onClick={() => setAnnOpen(false)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: T.mono, fontSize: 16, color: T.cream, opacity: 0.5, padding: 0, lineHeight: 1,
                }} aria-label="close">×</button>
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, opacity: 0.78, lineHeight: 1.5, marginTop: 12, paddingBottom: 14, borderBottom: `1px solid ${T.cream}18` }}>
                Receive announcements for future salons. One short note a month, never more.
              </div>
              <form onSubmit={submitAnnounce} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <DashField label="Email for announcements" value={annEmail} onChange={setAnnEmail} placeholder="you@aretetec.com" type="email" />
                <button type="submit" disabled={!annEmail} style={{
                  background: 'transparent', color: T.cream, padding: '12px 22px',
                  border: `1px solid ${T.cream}55`, cursor: 'pointer',
                  fontFamily: T.mono, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase',
                  opacity: !annEmail ? 0.4 : 1, alignSelf: 'flex-end',
                }}>Sign up →</button>
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

      {/* FOOTER ============================================ */}
      <footer style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 16, flexWrap: 'wrap',
        paddingTop: 14, borderTop: `1px solid ${T.cream}1f`,
        fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.55, textTransform: 'uppercase',
      }}>
        <span>© MMXXVI · Arete Technologies</span>
        <span style={{ fontFamily: T.serif, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, fontSize: 13, opacity: 0.9 }}>
          Eadem mutata resurgo
        </span>
        <span>salon@aretetec.com</span>
      </footer>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function TileHeader({ roman, label, title }) {
  const T = window.SalonT;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 18, color: T.ember, lineHeight: 1 }}>{roman}</span>
        <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.42em', opacity: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 24, marginTop: 4, lineHeight: 1 }}>{title}</div>
    </div>
  );
}

function DashField({ label, value, onChange, placeholder, type = 'text' }) {
  const T = window.SalonT;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: T.mono, fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>{label}</span>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          background: 'transparent', border: 'none', borderBottom: `1px solid ${T.cream}55`,
          padding: '6px 0', fontFamily: T.serif, fontSize: 14, color: T.cream, outline: 'none',
        }}
      />
    </label>
  );
}

window.SalonDashboard = SalonDashboard;
