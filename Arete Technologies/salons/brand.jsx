/* global React */
// ============================================================
// ARETE × THE LONG VIEW — Salon brand system
// Library-warm. Candlelit. Three columns. A long table.
// ============================================================

const SalonT = window.SalonT = {
  // Carry Arete palette
  ink:       '#1a1815',
  cream:     '#f4efe6',
  paper:     '#ebe4d4',
  paperDeep: '#e0d6bb',
  bronze:    '#7a5a2e',
  bronzeLight:'#a47e3e',
  // Salon-specific
  night:     '#13110e',       // deeper than ink — the candlelit room
  wine:      '#5a1f1d',       // burgundy accent
  wineLight: '#8a3a36',
  amber:     '#c98a3a',       // candlelight
  ember:     '#d6a25a',
  // Type
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans:  'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono:  'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

// ============================================================
// LOCKUP — Arete · The Long View
// ============================================================
function SalonLockup({ light = false, size = 'md', stacked = true }) {
  const T = window.SalonT;
  const fg = light ? T.cream : T.ink;
  const accent = light ? T.ember : T.wine;
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.4 : 1;
  if (!stacked) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 * scale, color: fg }}>
        <span style={{ fontFamily: T.sans, fontSize: 11 * scale, letterSpacing: '0.42em', paddingLeft: '0.42em', fontWeight: 500 }}>ARETE</span>
        <span style={{ width: 1, height: 16 * scale, background: fg, opacity: 0.4 }} />
        <span style={{ fontFamily: T.serif, fontSize: 22 * scale, fontStyle: 'italic', color: accent, lineHeight: 1 }}>The Long View</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', fontFamily: T.serif, color: fg }}>
      <div style={{
        fontSize: 11 * scale, letterSpacing: '0.42em', paddingLeft: '0.42em',
        fontFamily: T.sans, fontWeight: 500, opacity: 0.85,
      }}>ARETE</div>
      <div style={{ width: 38 * scale, height: 1, background: fg, opacity: 0.5, margin: `${6*scale}px 0` }} />
      <div style={{
        fontSize: 38 * scale, fontStyle: 'italic', fontWeight: 400, letterSpacing: '0.005em',
        lineHeight: 1, color: accent, marginTop: 2 * scale,
      }}>The Long View</div>
      <div style={{
        fontSize: 8 * scale, letterSpacing: '0.5em', paddingLeft: '0.5em',
        fontFamily: T.mono, opacity: 0.7, marginTop: 8 * scale,
      }}>A SALON · MMXXVI</div>
    </div>
  );
}

// ============================================================
// THREE COLUMNS — primary motif
// Three vertical strokes, capitals on top, plinths below.
// Schematic, single-weight. Stands for the three speakers.
// ============================================================
function ThreeColumns({ size = 100, color, opacity = 1, variant = 'classical' }) {
  const T = window.SalonT;
  const c = color || T.ink;
  const props = { fill: 'none', stroke: c, strokeWidth: 1, strokeLinecap: 'butt' };
  const s = { width: size, height: size, opacity };
  if (variant === 'minimal') {
    // Just three vertical lines with a base — most reductive
    return (
      <svg viewBox="0 0 60 60" style={s}>
        <line x1="15" y1="14" x2="15" y2="48" {...props} strokeWidth="1.5" />
        <line x1="30" y1="10" x2="30" y2="48" {...props} strokeWidth="1.5" />
        <line x1="45" y1="14" x2="45" y2="48" {...props} strokeWidth="1.5" />
        <line x1="6" y1="50" x2="54" y2="50" {...props} strokeWidth="1" />
      </svg>
    );
  }
  if (variant === 'capitals') {
    // With small capitals & bases
    return (
      <svg viewBox="0 0 60 60" style={s}>
        {[15, 30, 45].map((x, i) => (
          <g key={i}>
            {/* capital */}
            <line x1={x - 4} y1="13" x2={x + 4} y2="13" {...props} strokeWidth="1" />
            <line x1={x - 3} y1="16" x2={x + 3} y2="16" {...props} strokeWidth="1" />
            {/* shaft */}
            <line x1={x} y1="16" x2={x} y2="46" {...props} strokeWidth="1.25" />
            {/* base */}
            <line x1={x - 4} y1="46" x2={x + 4} y2="46" {...props} strokeWidth="1" />
            <line x1={x - 5} y1="49" x2={x + 5} y2="49" {...props} strokeWidth="1" />
          </g>
        ))}
        <line x1="4" y1="52" x2="56" y2="52" {...props} strokeWidth="1" />
      </svg>
    );
  }
  // classical — fluted columns with subtle entasis
  return (
    <svg viewBox="0 0 60 60" style={s}>
      {[14, 30, 46].map((x, i) => (
        <g key={i}>
          {/* abacus */}
          <line x1={x - 5} y1="12" x2={x + 5} y2="12" {...props} />
          {/* capital echinus */}
          <path d={`M ${x - 4} 12 Q ${x - 5} 15 ${x - 4} 16`} {...props} />
          <path d={`M ${x + 4} 12 Q ${x + 5} 15 ${x + 4} 16`} {...props} />
          {/* shaft (slight entasis) */}
          <path d={`M ${x - 3} 16 Q ${x - 3.4} 30 ${x - 3} 44`} {...props} />
          <path d={`M ${x + 3} 16 Q ${x + 3.4} 30 ${x + 3} 44`} {...props} />
          {/* base */}
          <line x1={x - 5} y1="44" x2={x + 5} y2="44" {...props} />
          <line x1={x - 6} y1="47" x2={x + 6} y2="47" {...props} />
        </g>
      ))}
      <line x1="2" y1="50" x2="58" y2="50" {...props} />
      <line x1="0" y1="53" x2="60" y2="53" {...props} opacity="0.4" />
    </svg>
  );
}

// ============================================================
// CANDLE — secondary motif (used in invites/footer)
// ============================================================
function Candle({ size = 64, color, lit = true }) {
  const T = window.SalonT;
  const c = color || T.ink;
  return (
    <svg viewBox="0 0 64 80" style={{ width: size, height: size * 1.25 }}>
      {/* flame */}
      {lit && (
        <>
          <path d="M 32 8 Q 28 18 32 24 Q 36 18 32 8 Z" fill={T.amber} opacity="0.85" />
          <path d="M 32 14 Q 30 20 32 23 Q 34 20 32 14 Z" fill={T.cream} opacity="0.9" />
        </>
      )}
      {/* wick */}
      <line x1="32" y1="24" x2="32" y2="28" stroke={c} strokeWidth="1" />
      {/* candle body */}
      <rect x="28" y="28" width="8" height="44" fill="none" stroke={c} strokeWidth="1" />
      {/* drip */}
      <path d="M 30 36 Q 28 42 30 46" fill="none" stroke={c} strokeWidth="0.75" opacity="0.6" />
      {/* base */}
      <rect x="24" y="72" width="16" height="3" fill="none" stroke={c} strokeWidth="1" />
    </svg>
  );
}

// ============================================================
// LONG TABLE — top-down geometry
// ============================================================
function LongTable({ width = 400, color, seats = 12 }) {
  const T = window.SalonT;
  const c = color || T.ink;
  const h = width * 0.32;
  return (
    <svg viewBox={`0 0 ${width} ${h}`} style={{ width: '100%', height: 'auto' }}>
      {/* table */}
      <rect x={width * 0.08} y={h * 0.35} width={width * 0.84} height={h * 0.3} fill="none" stroke={c} strokeWidth="1" />
      {/* seats top and bottom */}
      {Array.from({ length: seats / 2 }).map((_, i) => {
        const x = width * 0.12 + (width * 0.76) * ((i + 0.5) / (seats / 2));
        return (
          <g key={i}>
            <circle cx={x} cy={h * 0.15} r={h * 0.07} fill="none" stroke={c} strokeWidth="0.75" />
            <circle cx={x} cy={h * 0.85} r={h * 0.07} fill="none" stroke={c} strokeWidth="0.75" />
          </g>
        );
      })}
      {/* head and foot */}
      <circle cx={width * 0.04} cy={h * 0.5} r={h * 0.07} fill="none" stroke={c} strokeWidth="0.75" />
      <circle cx={width * 0.96} cy={h * 0.5} r={h * 0.07} fill="none" stroke={c} strokeWidth="0.75" />
    </svg>
  );
}

// ============================================================
// SEAL — adapted for salon (three-column glyph in center)
// ============================================================
function SalonSeal({ size = 140, color, label = 'ARETE · THE LONG VIEW', center = 'MMXXVI', sub = 'A SALON · NEW YORK' }) {
  const T = window.SalonT;
  const c = color || T.wine;
  const r = size / 2;
  const inner = r - 8;
  const textR = r - 14;
  const id = 'salonseal-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <path id={id} d={`M ${r} ${r} m -${textR} 0 a ${textR} ${textR} 0 1 1 ${textR*2} 0 a ${textR} ${textR} 0 1 1 -${textR*2} 0`} />
      </defs>
      <circle cx={r} cy={r} r={r - 1} fill="none" stroke={c} strokeWidth="1" />
      <circle cx={r} cy={r} r={inner} fill="none" stroke={c} strokeWidth="0.5" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const x1 = r + Math.cos(a) * (inner - 2);
        const y1 = r + Math.sin(a) * (inner - 2);
        const x2 = r + Math.cos(a) * (inner - 5);
        const y2 = r + Math.sin(a) * (inner - 5);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="0.5" opacity="0.6" />;
      })}
      <text fill={c} fontFamily={T.mono} fontSize={size * 0.07} letterSpacing="3">
        <textPath href={`#${id}`} startOffset="25%" textAnchor="middle">{label}</textPath>
      </text>
      <text fill={c} fontFamily={T.mono} fontSize={size * 0.06} letterSpacing="2">
        <textPath href={`#${id}`} startOffset="75%" textAnchor="middle">{sub}</textPath>
      </text>
      {/* center: three columns */}
      <g transform={`translate(${r - size * 0.15}, ${r - size * 0.18}) scale(${size / 200})`}>
        {[15, 30, 45].map((x, i) => (
          <g key={i}>
            <line x1={x - 4} y1="12" x2={x + 4} y2="12" stroke={c} strokeWidth="1" />
            <line x1={x} y1="14" x2={x} y2="42" stroke={c} strokeWidth="1" />
            <line x1={x - 5} y1="44" x2={x + 5} y2="44" stroke={c} strokeWidth="1" />
          </g>
        ))}
        <line x1="4" y1="48" x2="56" y2="48" stroke={c} strokeWidth="1" />
      </g>
      <text x={r} y={r + size * 0.32} textAnchor="middle" fill={c} fontFamily={T.serif} fontStyle="italic" fontSize={size * 0.09}>{center}</text>
    </svg>
  );
}

// ============================================================
// PATTERN — vertical hairlines (the columns repeated)
// ============================================================
function PatternColumns({ color, opacity = 0.12, size = 60 }) {
  const T = window.SalonT;
  const c = color || T.ink;
  const id = 'col-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id={id} x="0" y="0" width={size} height={size} patternUnits="userSpaceOnUse">
          <line x1={size * 0.2} y1="0" x2={size * 0.2} y2={size} stroke={c} strokeWidth="0.5" opacity={opacity} />
          <line x1={size * 0.5} y1="0" x2={size * 0.5} y2={size} stroke={c} strokeWidth="0.5" opacity={opacity * 1.3} />
          <line x1={size * 0.8} y1="0" x2={size * 0.8} y2={size} stroke={c} strokeWidth="0.5" opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// ============================================================
// CANDLELIGHT GLOW — radial warm vignette for dark hero
// ============================================================
function Candlelight({ intensity = 1 }) {
  const T = window.SalonT;
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${T.amber}${Math.round(intensity * 38).toString(16)} 0%, transparent 60%)`,
    }} />
  );
}

window.SalonT = SalonT;
window.SalonLockup = SalonLockup;
window.ThreeColumns = ThreeColumns;
window.Candle = Candle;
window.LongTable = LongTable;
window.SalonSeal = SalonSeal;
window.PatternColumns = PatternColumns;
window.Candlelight = Candlelight;
