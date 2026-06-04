/* global React */
// ============================================================
// SAVE THE DATE — The Long View · Salon I
// Multiple format variants, all using salon brand
// ============================================================

const EVENT = {
  dayRoman: 'XIII',
  dayArabic: '13',
  monthLong: 'JUNE',
  monthShort: 'JUN',
  year: 'MMXXVI',
  yearArabic: '2026',
  city: 'NEW YORK',
  url: 'aretetec.com',
  series: 'Salon I',
  headline: 'Save the date',
  sub: 'First of a series. Taking the long view.',
  detail: 'Speakers from ASML and more. Details to follow.',
};

// ============================================================
// SHARED — the centerpiece composition
// ============================================================
function Centerpiece({ scale = 1, light = false }) {
  const T = window.SalonT;
  const fg = light ? T.cream : T.ink;
  const accent = light ? T.ember : T.wine;
  return (
    <div style={{ textAlign: 'center', fontFamily: T.serif, color: fg }}>
      <window.ThreeColumns size={84 * scale} color={accent} opacity={0.9} variant="classical" />
    </div>
  );
}

// ============================================================
// 01 — SQUARE (1080×1080) Instagram feed
// ============================================================
function STD_Square() {
  const T = window.SalonT;
  return (
    <div style={{
      width: '100%', height: '100%', background: T.night, color: T.cream,
      position: 'relative', overflow: 'hidden', fontFamily: T.serif,
      padding: '64px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <window.Candlelight intensity={1.2} />
      <window.PatternColumns color={T.cream} opacity={0.05} size={90} />

      {/* Top: lockup */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: T.sans, fontSize: 16, letterSpacing: '0.42em', paddingLeft: '0.42em', fontWeight: 500 }}>
          ARETE
        </div>
        <div style={{ width: 60, height: 1, background: T.cream, opacity: 0.4, margin: '12px auto' }} />
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.65 }}>
          A SALON · {EVENT.series.toUpperCase()}
        </div>
      </div>

      {/* Center: headline + columns + date */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.6 }}>
          SAVE THE DATE
        </div>
        <h1 style={{
          fontFamily: T.serif, fontSize: 116, fontWeight: 400, fontStyle: 'italic',
          lineHeight: 1, margin: '20px 0 28px', color: T.cream, letterSpacing: '-0.01em',
        }}>
          The Long<br />View<span style={{ color: T.ember }}>.</span>
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 28px' }}>
          <window.ThreeColumns size={68} color={T.ember} variant="classical" opacity={0.9} />
        </div>
        {/* Date strip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 24,
          padding: '16px 28px',
          borderTop: `1px solid ${T.ember}`, borderBottom: `1px solid ${T.ember}`,
          fontFamily: T.mono, fontSize: 14, letterSpacing: '0.4em',
          color: T.ember,
        }}>
          <span>{EVENT.dayRoman}</span>
          <span style={{ width: 4, height: 4, background: T.ember, borderRadius: '50%' }} />
          <span>{EVENT.monthLong}</span>
          <span style={{ width: 4, height: 4, background: T.ember, borderRadius: '50%' }} />
          <span>{EVENT.year}</span>
        </div>
      </div>

      {/* Bottom: sub + URL */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 22, opacity: 0.9, lineHeight: 1.4 }}>
          {EVENT.sub}
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 15, opacity: 0.6, marginTop: 10, lineHeight: 1.5 }}>
          {EVENT.detail}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36, paddingTop: 20, borderTop: `1px solid ${T.cream}22` }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.42em', opacity: 0.6 }}>{EVENT.city}</span>
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.42em', opacity: 0.6 }}>BY INVITATION</span>
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.42em', opacity: 0.6, color: T.ember }}>{EVENT.url.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 02 — STORY (1080×1920) Instagram/LinkedIn story
// ============================================================
function STD_Story() {
  const T = window.SalonT;
  return (
    <div style={{
      width: '100%', height: '100%', background: T.night, color: T.cream,
      position: 'relative', overflow: 'hidden', fontFamily: T.serif,
      padding: '88px 56px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <window.Candlelight intensity={1.4} />
      <window.PatternColumns color={T.cream} opacity={0.04} size={100} />

      {/* Top */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: T.sans, fontSize: 18, letterSpacing: '0.42em', paddingLeft: '0.42em', fontWeight: 500 }}>
          ARETE
        </div>
        <div style={{ width: 60, height: 1, background: T.cream, opacity: 0.4, margin: '16px auto' }} />
        <div style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.7 }}>
          A SALON · {EVENT.series.toUpperCase()}
        </div>
      </div>

      {/* Center */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: T.mono, fontSize: 14, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.6 }}>
          SAVE THE DATE
        </div>
        <h1 style={{
          fontFamily: T.serif, fontSize: 140, fontWeight: 400, fontStyle: 'italic',
          lineHeight: 0.95, margin: '32px 0 40px', color: T.cream,
        }}>
          The Long<br />View<span style={{ color: T.ember }}>.</span>
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 40px' }}>
          <window.ThreeColumns size={100} color={T.ember} variant="classical" opacity={0.9} />
        </div>

        {/* Big date */}
        <div style={{
          fontFamily: T.serif, fontSize: 96, fontStyle: 'italic', color: T.ember,
          lineHeight: 1, marginTop: 16,
        }}>
          {EVENT.dayRoman}
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 16, letterSpacing: '0.5em', paddingLeft: '0.5em',
          marginTop: 14, color: T.cream, opacity: 0.85,
        }}>
          {EVENT.monthLong} · {EVENT.year}
        </div>

        <div style={{ width: 80, height: 1, background: T.ember, opacity: 0.6, margin: '36px auto' }} />

        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 24, lineHeight: 1.5, opacity: 0.9 }}>
          First of a series.<br />Taking the long view.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 16, opacity: 0.65, marginTop: 16, lineHeight: 1.55, maxWidth: 380, margin: '16px auto 0' }}>
          Speakers from ASML and more. Details to follow.
        </div>
      </div>

      {/* Bottom */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <window.SalonSeal size={80} color={T.ember} center="I" sub="SALON · NEW YORK" label="ARETE · THE LONG VIEW" />
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.65, marginTop: 16 }}>
          NEW YORK · BY INVITATION
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 13, letterSpacing: '0.42em', paddingLeft: '0.42em', color: T.ember, marginTop: 12 }}>
          {EVENT.url.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 03 — LANDSCAPE (1200×630) Twitter / OG / email banner
// ============================================================
function STD_Landscape() {
  const T = window.SalonT;
  return (
    <div style={{
      width: '100%', height: '100%', background: T.night, color: T.cream,
      position: 'relative', overflow: 'hidden', fontFamily: T.serif,
      padding: '48px 64px',
      display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 56, alignItems: 'center',
    }}>
      <window.Candlelight intensity={1} />
      <window.PatternColumns color={T.cream} opacity={0.04} size={70} />

      {/* Left: title + date */}
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.6 }}>
          ARETE · SAVE THE DATE
        </div>
        <h1 style={{
          fontFamily: T.serif, fontSize: 88, fontWeight: 400, fontStyle: 'italic',
          lineHeight: 0.95, margin: '20px 0 24px',
        }}>
          The Long View<span style={{ color: T.ember }}>.</span>
        </h1>
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 16,
          paddingTop: 16, borderTop: `1px solid ${T.ember}`,
        }}>
          <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 64, color: T.ember, lineHeight: 1 }}>{EVENT.dayRoman}</span>
          <span style={{ fontFamily: T.mono, fontSize: 14, letterSpacing: '0.4em', opacity: 0.85 }}>{EVENT.monthLong} · {EVENT.year}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: '70%', background: T.cream, opacity: 0.25, position: 'relative', zIndex: 1 }} />

      {/* Right: columns + sub */}
      <div style={{ position: 'relative' }}>
        <window.ThreeColumns size={72} color={T.ember} variant="classical" opacity={0.85} />
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 22, marginTop: 24, lineHeight: 1.35, opacity: 0.9 }}>
          First of a series.<br />Taking the long view.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 14, opacity: 0.65, marginTop: 12, lineHeight: 1.55, maxWidth: 320 }}>
          Speakers from ASML and more. Details to follow.
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 16, borderTop: `1px solid ${T.cream}22`, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.42em', opacity: 0.7 }}>
          <span>NEW YORK</span>
          <span style={{ color: T.ember }}>{EVENT.url.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 04 — PRINT CARD (5×7" portrait, 1500×2100)
// Letterpress-style, light cream ground with wine ink
// ============================================================
function STD_Print() {
  const T = window.SalonT;
  return (
    <div style={{
      width: '100%', height: '100%', background: T.cream, color: T.ink,
      position: 'relative', overflow: 'hidden', fontFamily: T.serif,
      padding: '88px 64px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <window.PatternColumns color={T.wine} opacity={0.04} size={80} />

      {/* Top */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.65 }}>
          ARETE · A SALON · {EVENT.series.toUpperCase()}
        </div>
        <div style={{ width: 60, height: 1, background: T.ink, opacity: 0.4, margin: '20px auto' }} />
      </div>

      {/* Center */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <window.ThreeColumns size={84} color={T.wine} variant="classical" />
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.6 }}>
          SAVE THE DATE
        </div>
        <h1 style={{
          fontFamily: T.serif, fontSize: 108, fontWeight: 400, fontStyle: 'italic',
          lineHeight: 0.95, margin: '24px 0 32px', color: T.wine, letterSpacing: '-0.01em',
        }}>
          The Long View<span>.</span>
        </h1>

        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          padding: '20px 40px',
          borderTop: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}`,
        }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.42em', opacity: 0.6 }}>SATURDAY</div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 64, color: T.wine, lineHeight: 1 }}>
            {EVENT.dayRoman} {EVENT.monthLong.slice(0, 1) + EVENT.monthLong.slice(1).toLowerCase()}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.42em', opacity: 0.6 }}>{EVENT.year}</div>
        </div>

        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, marginTop: 36, lineHeight: 1.55, opacity: 0.85, maxWidth: 460, margin: '36px auto 0' }}>
          The first of a series — three speakers, ten minutes each, a panel, a long dinner. Speakers from <span style={{ fontStyle: 'normal', fontWeight: 500 }}>ASML</span> and more.
        </div>
      </div>

      {/* Bottom: seal + URL */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <window.SalonSeal size={88} color={T.wine} center="I" sub="SALON · NEW YORK" label="ARETE · THE LONG VIEW" />
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.6, marginTop: 20 }}>
          NEW YORK · BY INVITATION
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.42em', paddingLeft: '0.42em', marginTop: 12, color: T.wine }}>
          {EVENT.url.toUpperCase()}
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11, opacity: 0.5, marginTop: 16 }}>
          Eadem mutata resurgo
        </div>
      </div>
    </div>
  );
}

window.STD_Square = STD_Square;
window.STD_Story = STD_Story;
window.STD_Landscape = STD_Landscape;
window.STD_Print = STD_Print;
window.SAVE_EVENT = EVENT;

// ============================================================
// TEXT-BLAST EDITION — reduced, elegant, readable at thumbnail
// All 1080×1080 (universal SMS preview ratio)
// ============================================================

// ----- 05 · ENGRAVED — cream letterpress, deeply minimal -----
function STD_Engraved() {
  const T = window.SalonT;
  return (
    <div style={{
      width: '100%', height: '100%', background: T.cream, color: T.ink,
      position: 'relative', overflow: 'hidden', fontFamily: T.serif,
      padding: '110px 90px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      alignItems: 'center', textAlign: 'center',
    }}>
      {/* Top sigil */}
      <div>
        <window.ThreeColumns size={70} color={T.wine} variant="classical" />
        <div style={{
          fontFamily: T.mono, fontSize: 14, letterSpacing: '0.6em', paddingLeft: '0.6em',
          opacity: 0.7, marginTop: 24,
        }}>
          SAVE THE DATE
        </div>
      </div>

      {/* Center: title + date */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{
          fontFamily: T.serif, fontSize: 130, fontWeight: 400, fontStyle: 'italic',
          lineHeight: 0.95, margin: 0, color: T.wine, letterSpacing: '-0.015em',
        }}>
          The Long<br />View<span>.</span>
        </h1>
        <div style={{ width: 56, height: 1, background: T.ink, opacity: 0.4, margin: '40px 0' }} />
        <div style={{
          fontFamily: T.serif, fontStyle: 'italic', fontSize: 60, color: T.ink, lineHeight: 1,
        }}>
          XIII Juin
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 14, letterSpacing: '0.5em', paddingLeft: '0.5em',
          marginTop: 16, opacity: 0.7,
        }}>
          MMXXVI · NEW YORK
        </div>
      </div>

      {/* Bottom */}
      <div>
        <div style={{
          fontFamily: T.mono, fontSize: 12, letterSpacing: '0.42em', paddingLeft: '0.42em',
          color: T.wine,
        }}>
          ARETETEC.COM
        </div>
      </div>
    </div>
  );
}

// ----- 06 · INSCRIPTION — night, monumental Roman date -----
function STD_Inscription() {
  const T = window.SalonT;
  return (
    <div style={{
      width: '100%', height: '100%', background: T.night, color: T.cream,
      position: 'relative', overflow: 'hidden', fontFamily: T.serif,
      padding: '100px 80px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      alignItems: 'center', textAlign: 'center',
    }}>
      <window.Candlelight intensity={1.4} />
      <window.PatternColumns color={T.cream} opacity={0.04} size={100} />

      {/* Top: Save the date */}
      <div style={{ position: 'relative' }}>
        <div style={{
          fontFamily: T.mono, fontSize: 14, letterSpacing: '0.6em', paddingLeft: '0.6em',
          opacity: 0.7,
        }}>
          SAVE THE DATE
        </div>
        <div style={{ width: 40, height: 1, background: T.ember, opacity: 0.7, margin: '20px auto 0' }} />
      </div>

      {/* Center: monumental date */}
      <div style={{ position: 'relative' }}>
        <div style={{
          fontFamily: T.serif, fontStyle: 'italic', fontSize: 280, color: T.ember,
          lineHeight: 0.9, letterSpacing: '-0.04em',
        }}>
          XIII
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 18, letterSpacing: '0.6em', paddingLeft: '0.6em',
          marginTop: 20, opacity: 0.9,
        }}>
          JUNE · MMXXVI
        </div>
      </div>

      {/* Bottom: lockup */}
      <div style={{ position: 'relative' }}>
        <div style={{
          fontFamily: T.sans, fontSize: 14, letterSpacing: '0.42em', paddingLeft: '0.42em',
          fontWeight: 500,
        }}>
          ARETE
        </div>
        <div style={{
          fontFamily: T.serif, fontStyle: 'italic', fontSize: 44, color: T.ember,
          marginTop: 10, lineHeight: 1,
        }}>
          The Long View
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 11, letterSpacing: '0.42em', paddingLeft: '0.42em',
          opacity: 0.55, marginTop: 20,
        }}>
          ARETETEC.COM
        </div>
      </div>
    </div>
  );
}

// ----- 07 · PLATE — brass-plate engraved feel, dark ground, cream rule frame -----
function STD_Plate() {
  const T = window.SalonT;
  return (
    <div style={{
      width: '100%', height: '100%', background: T.night, color: T.cream,
      position: 'relative', overflow: 'hidden', fontFamily: T.serif,
      padding: 64,
    }}>
      <window.Candlelight intensity={0.8} />
      {/* Frame */}
      <div style={{
        position: 'absolute', inset: 56,
        border: `1px solid ${T.ember}`, opacity: 0.7,
      }} />
      <div style={{
        position: 'absolute', inset: 64,
        border: `1px solid ${T.ember}`, opacity: 0.3,
      }} />

      <div style={{
        position: 'relative', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        alignItems: 'center', textAlign: 'center', padding: '48px 56px',
      }}>
        {/* Top: lockup */}
        <div>
          <div style={{
            fontFamily: T.sans, fontSize: 16, letterSpacing: '0.5em', paddingLeft: '0.5em',
            fontWeight: 500, color: T.cream,
          }}>
            ARETE
          </div>
          <div style={{ width: 50, height: 1, background: T.ember, margin: '14px auto', opacity: 0.7 }} />
          <div style={{
            fontFamily: T.mono, fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em',
            opacity: 0.7,
          }}>
            A SALON · NEW YORK
          </div>
        </div>

        {/* Center */}
        <div>
          <div style={{
            fontFamily: T.mono, fontSize: 13, letterSpacing: '0.6em', paddingLeft: '0.6em',
            opacity: 0.7,
          }}>
            SAVE THE DATE
          </div>
          <h1 style={{
            fontFamily: T.serif, fontSize: 96, fontWeight: 400, fontStyle: 'italic',
            lineHeight: 1, margin: '26px 0', color: T.cream, letterSpacing: '-0.01em',
          }}>
            The Long View<span style={{ color: T.ember }}>.</span>
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 14 }}>
            <div style={{ width: 80, height: 1, background: T.ember, opacity: 0.6 }} />
            <window.ThreeColumns size={36} color={T.ember} variant="minimal" opacity={0.9} />
            <div style={{ width: 80, height: 1, background: T.ember, opacity: 0.6 }} />
          </div>
          <div style={{
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 80, color: T.ember,
            marginTop: 28, lineHeight: 1,
          }}>
            XIII Juin
          </div>
          <div style={{
            fontFamily: T.mono, fontSize: 14, letterSpacing: '0.5em', paddingLeft: '0.5em',
            marginTop: 16, opacity: 0.85,
          }}>
            MMXXVI
          </div>
        </div>

        {/* Bottom */}
        <div>
          <div style={{
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, opacity: 0.65,
          }}>
            Eadem mutata resurgo
          </div>
          <div style={{
            fontFamily: T.mono, fontSize: 12, letterSpacing: '0.42em', paddingLeft: '0.42em',
            color: T.ember, marginTop: 14,
          }}>
            ARETETEC.COM
          </div>
        </div>
      </div>
    </div>
  );
}

window.STD_Engraved = STD_Engraved;
window.STD_Inscription = STD_Inscription;
window.STD_Plate = STD_Plate;
