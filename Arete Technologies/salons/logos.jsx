/* global React */
// ============================================================
// THE LONG VIEW — 6 logo directions
// ============================================================

function LV01_Classical({ dark = false }) {
  const T = window.SalonT;
  const fg = dark ? T.cream : T.ink;
  const accent = dark ? T.ember : T.wine;
  return (
    <div style={{ textAlign: 'center', fontFamily: T.serif }}>
      <div style={{ fontSize: 11, letterSpacing: '0.42em', paddingLeft: '0.42em', fontFamily: T.sans, color: fg, fontWeight: 500 }}>ARETE</div>
      <div style={{ width: 36, height: 1, background: fg, opacity: 0.45, margin: '10px auto' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <window.ThreeColumns size={42} color={accent} variant="classical" />
        <div style={{ fontSize: 46, fontStyle: 'italic', color: accent, fontWeight: 400, lineHeight: 1 }}>The Long View</div>
      </div>
      <div style={{ fontSize: 9, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, color: fg, opacity: 0.7, marginTop: 14 }}>A SALON · MMXXVI</div>
    </div>
  );
}

function LV02_Stacked({ dark = false }) {
  const T = window.SalonT;
  const fg = dark ? T.cream : T.ink;
  const accent = dark ? T.ember : T.wine;
  return (
    <div style={{ textAlign: 'center', fontFamily: T.serif }}>
      <window.ThreeColumns size={56} color={fg} variant="minimal" />
      <div style={{ fontSize: 11, letterSpacing: '0.42em', paddingLeft: '0.42em', fontFamily: T.sans, color: fg, fontWeight: 500, marginTop: 16 }}>ARETE</div>
      <div style={{ width: 36, height: 1, background: fg, opacity: 0.45, margin: '10px auto' }} />
      <div style={{ fontSize: 38, fontStyle: 'italic', color: accent, fontWeight: 400, lineHeight: 1 }}>The Long View</div>
      <div style={{ fontSize: 9, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, color: fg, opacity: 0.7, marginTop: 14 }}>A SALON</div>
    </div>
  );
}

function LV03_Roman({ dark = false }) {
  const T = window.SalonT;
  const fg = dark ? T.cream : T.ink;
  const accent = dark ? T.ember : T.wine;
  return (
    <div style={{ textAlign: 'center', fontFamily: T.serif }}>
      <div style={{
        fontSize: 32, fontWeight: 500, letterSpacing: '0.28em', color: fg,
        paddingLeft: '0.28em',
      }}>THE LONG VIEW</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', margin: '14px 0' }}>
        <div style={{ width: 80, height: 1, background: accent }} />
        <window.ThreeColumns size={20} color={accent} variant="minimal" />
        <div style={{ width: 80, height: 1, background: accent }} />
      </div>
      <div style={{ fontSize: 11, letterSpacing: '0.45em', paddingLeft: '0.45em', fontFamily: T.mono, color: fg, opacity: 0.75 }}>
        ARETE · SALON · I
      </div>
    </div>
  );
}

function LV04_Editorial({ dark = false }) {
  const T = window.SalonT;
  const fg = dark ? T.cream : T.ink;
  const accent = dark ? T.ember : T.wine;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontFamily: T.serif }}>
      <window.ThreeColumns size={72} color={fg} variant="capitals" />
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.42em', fontFamily: T.mono, color: fg, opacity: 0.65, paddingLeft: '0.42em' }}>ARETE</div>
        <div style={{ fontSize: 40, fontStyle: 'italic', color: accent, lineHeight: 0.95, marginTop: 4, fontWeight: 400 }}>The Long<br />View</div>
        <div style={{ fontSize: 9, letterSpacing: '0.4em', paddingLeft: '0.4em', fontFamily: T.mono, color: fg, opacity: 0.6, marginTop: 8 }}>A SALON · MMXXVI</div>
      </div>
    </div>
  );
}

function LV05_Monogram({ dark = false }) {
  const T = window.SalonT;
  const fg = dark ? T.cream : T.ink;
  const accent = dark ? T.ember : T.wine;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontFamily: T.serif }}>
      {/* Circular monogram */}
      <svg viewBox="0 0 90 90" width={80} height={80}>
        <circle cx="45" cy="45" r="44" fill="none" stroke={fg} strokeWidth="0.5" opacity="0.4" />
        <circle cx="45" cy="45" r="40" fill="none" stroke={fg} strokeWidth="0.5" opacity="0.6" />
        {/* L | V intersection */}
        <text x="45" y="60" textAnchor="middle" fontFamily={T.serif} fontStyle="italic" fontSize="48" fill={accent}>LV</text>
        {/* three column marks below */}
        <line x1="36" y1="70" x2="36" y2="78" stroke={fg} strokeWidth="0.75" />
        <line x1="45" y1="68" x2="45" y2="78" stroke={fg} strokeWidth="0.75" />
        <line x1="54" y1="70" x2="54" y2="78" stroke={fg} strokeWidth="0.75" />
      </svg>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.42em', fontFamily: T.sans, color: fg, fontWeight: 500, paddingLeft: '0.42em' }}>ARETE</div>
        <div style={{ fontSize: 28, fontStyle: 'italic', color: accent, marginTop: 6 }}>The Long View</div>
        <div style={{ fontSize: 9, letterSpacing: '0.42em', paddingLeft: '0.42em', fontFamily: T.mono, color: fg, opacity: 0.6, marginTop: 8 }}>SALON</div>
      </div>
    </div>
  );
}

function LV06_Schematic({ dark = false }) {
  const T = window.SalonT;
  const fg = dark ? T.cream : T.ink;
  const accent = dark ? T.ember : T.wine;
  return (
    <div style={{ fontFamily: T.mono, color: fg, textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 46, color: accent, lineHeight: 1 }}>The Long View</span>
        <span style={{ fontSize: 10, letterSpacing: '0.32em', opacity: 0.65 }}>°N</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.32em', opacity: 0.7 }}>ARETE</span>
        <span style={{ flex: 1, height: 1, background: fg, opacity: 0.35 }} />
        <span style={{ fontSize: 10, letterSpacing: '0.32em', opacity: 0.7 }}>SALON · MMXXVI</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 14, background: accent, opacity: 0.7 + i * 0.1 }} />
        ))}
      </div>
      <div style={{ fontSize: 9, letterSpacing: '0.3em', opacity: 0.55, marginTop: 8 }}>
        III SPEAKERS · X MINUTES · ONE TABLE
      </div>
    </div>
  );
}

// ============================================================
// FRAMES
// ============================================================
function LVFrame({ children, bg, label }) {
  const T = window.SalonT;
  return (
    <div style={{
      width: 520, height: 220, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      boxShadow: bg === T.cream || bg === '#fff' ? 'inset 0 0 0 1px rgba(0,0,0,0.06)' : 'none',
    }}>
      {children}
      <div style={{
        position: 'absolute', bottom: 10, left: 14,
        fontSize: 9, letterSpacing: '0.2em',
        fontFamily: T.mono,
        color: bg === T.night || bg === T.ink ? 'rgba(244,239,230,0.4)' : 'rgba(26,24,21,0.4)',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  );
}

function LVSet({ Logo }) {
  const T = window.SalonT;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <LVFrame bg={T.cream} label="cream"><Logo /></LVFrame>
      <LVFrame bg={T.night} label="night"><Logo dark /></LVFrame>
      <LVFrame bg={T.wine} label="wine"><Logo dark /></LVFrame>
    </div>
  );
}

window.LV01_Classical = LV01_Classical;
window.LV02_Stacked = LV02_Stacked;
window.LV03_Roman = LV03_Roman;
window.LV04_Editorial = LV04_Editorial;
window.LV05_Monogram = LV05_Monogram;
window.LV06_Schematic = LV06_Schematic;
window.LVSet = LVSet;
