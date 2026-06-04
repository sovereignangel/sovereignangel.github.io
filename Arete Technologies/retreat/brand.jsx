/* global React */
// ============================================================
// ARETE × MISTRAL — Kitesurf retreat brand system
// Vintage French travel poster heritage, Aristotelian restraint.
// ============================================================

const T = window.T = {
  // Palette — derived from the vintage poster direction
  ink: '#1a1815',
  cream: '#f4efe6',
  paper: '#ebe4d4',
  paperDeep: '#e0d6bb',
  sand: '#d6c89e',
  sun: '#d89248',
  sunDeep: '#b86d2c',
  coral: '#c0533a',
  sea: '#1d4a6b',
  seaDeep: '#0f2c44',
  bronze: '#7a5a2e',
  bronzeLight: '#a47e3e',
  // Type stacks
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

// ============================================================
// LOCKUP — Arete × Mistral (the retreat sub-brand name)
// ============================================================
function Lockup({ light = false, size = 'md' }) {
  const fg = light ? T.cream : T.ink;
  const accent = light ? T.sun : T.bronze;
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.4 : 1;
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', fontFamily: T.serif, color: fg }}>
      <div style={{
        fontSize: 11 * scale, letterSpacing: '0.42em', paddingLeft: '0.42em',
        fontFamily: T.sans, fontWeight: 500, opacity: 0.85,
      }}>ARETE</div>
      <div style={{ width: 38 * scale, height: 1, background: fg, opacity: 0.5, margin: `${6*scale}px 0` }} />
      <div style={{
        fontSize: 38 * scale, fontStyle: 'italic', fontWeight: 400, letterSpacing: '0.01em',
        lineHeight: 1, color: accent, marginTop: 2 * scale,
      }}>Mistral</div>
      <div style={{
        fontSize: 8 * scale, letterSpacing: '0.5em', paddingLeft: '0.5em',
        fontFamily: T.mono, opacity: 0.7, marginTop: 8 * scale,
      }}>KITESURF · MMXXVI</div>
    </div>
  );
}

// ============================================================
// ICONOGRAPHY — schematic, single-weight, hairline
// ============================================================
function Icon({ kind, size = 56, color, opacity = 1 }) {
  const c = color || T.ink;
  const props = { fill: 'none', stroke: c, strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round', opacity };
  const s = { width: size, height: size };
  switch (kind) {
    case 'kite':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 8 24 Q 32 0 56 24 Q 58 32 52 34 Q 32 18 12 34 Q 6 32 8 24 Z" {...props} />
          <line x1="32" y1="34" x2="32" y2="56" {...props} />
          <line x1="26" y1="56" x2="38" y2="56" {...props} />
        </svg>
      );
    case 'sun':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <circle cx="32" cy="32" r="12" {...props} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
            const r = a * Math.PI / 180;
            return <line key={a} x1={32 + Math.cos(r) * 18} y1={32 + Math.sin(r) * 18} x2={32 + Math.cos(r) * 24} y2={32 + Math.sin(r) * 24} {...props} />;
          })}
        </svg>
      );
    case 'wave':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 4 24 Q 16 14 28 24 T 60 24" {...props} />
          <path d="M 4 36 Q 16 26 28 36 T 60 36" {...props} />
          <path d="M 4 48 Q 16 38 28 48 T 60 48" {...props} />
        </svg>
      );
    case 'anchor':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <circle cx="32" cy="14" r="4" {...props} />
          <line x1="32" y1="18" x2="32" y2="52" {...props} />
          <line x1="24" y1="26" x2="40" y2="26" {...props} />
          <path d="M 14 42 Q 14 54 32 54 Q 50 54 50 42" {...props} />
          <line x1="10" y1="42" x2="18" y2="42" {...props} />
          <line x1="46" y1="42" x2="54" y2="42" {...props} />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <circle cx="32" cy="32" r="22" {...props} />
          <path d="M 32 14 L 36 32 L 32 50 L 28 32 Z" {...props} />
          <circle cx="32" cy="32" r="2" fill={c} />
          <text x="32" y="11" fontSize="6" fontFamily={T.mono} fill={c} textAnchor="middle" opacity={opacity}>N</text>
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 12 14 L 32 18 L 52 14 L 52 50 L 32 54 L 12 50 Z" {...props} />
          <line x1="32" y1="18" x2="32" y2="54" {...props} />
        </svg>
      );
    case 'bowl':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 8 28 Q 32 36 56 28" {...props} />
          <path d="M 8 28 Q 12 50 32 50 Q 52 50 56 28" {...props} />
          <path d="M 24 18 Q 26 22 24 26" {...props} />
          <path d="M 32 16 Q 34 22 32 26" {...props} />
          <path d="M 40 18 Q 42 22 40 26" {...props} />
        </svg>
      );
    case 'wind':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 6 22 L 42 22 Q 52 22 52 16 Q 52 10 46 10" {...props} />
          <path d="M 6 32 L 50 32 Q 58 32 58 26" {...props} />
          <path d="M 6 42 L 38 42 Q 46 42 46 48 Q 46 54 40 54" {...props} />
        </svg>
      );
    case 'mountain':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 6 50 L 22 24 L 32 36 L 44 18 L 58 50 Z" {...props} />
          <line x1="6" y1="50" x2="58" y2="50" {...props} />
        </svg>
      );
    case 'olive':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 32 8 Q 32 32 32 56" {...props} />
          {[14, 22, 30, 38, 46].map((y, i) => (
            <g key={i}>
              <path d={i % 2 ? `M 32 ${y} Q 18 ${y-4} 14 ${y+4}` : `M 32 ${y} Q 46 ${y-4} 50 ${y+4}`} {...props} />
              <ellipse cx={i % 2 ? 16 : 48} cy={y+2} rx="3" ry="4.5" {...props} />
            </g>
          ))}
        </svg>
      );
    default:
      return <svg viewBox="0 0 64 64" style={s} />;
  }
}

// ============================================================
// PATTERN — repeating kite-arc motif
// ============================================================
function PatternArcs({ color, opacity = 0.18, size = 80 }) {
  const c = color || T.ink;
  const id = 'arc-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id={id} x="0" y="0" width={size} height={size * 0.5} patternUnits="userSpaceOnUse">
          <path d={`M 0 ${size*0.5} Q ${size*0.5} 0 ${size} ${size*0.5}`} fill="none" stroke={c} strokeWidth="0.75" opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function PatternWaves({ color, opacity = 0.15, size = 80 }) {
  const c = color || T.ink;
  const id = 'wave-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id={id} x="0" y="0" width={size} height={size * 0.25} patternUnits="userSpaceOnUse">
          <path d={`M 0 ${size*0.125} Q ${size*0.25} 0 ${size*0.5} ${size*0.125} T ${size} ${size*0.125}`} fill="none" stroke={c} strokeWidth="0.6" opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// ============================================================
// SEAL / STAMP — circular wax-stamp feel
// ============================================================
function Seal({ size = 140, color, label = 'ARETE · MISTRAL', center = 'MMXXVI', sub = 'KITESURF · FRANCE' }) {
  const c = color || T.bronze;
  const r = size / 2;
  const inner = r - 8;
  const textR = r - 14;
  const id = 'seal-' + Math.random().toString(36).slice(2, 8);
  // Place text on circle path
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <path id={id} d={`M ${r} ${r} m -${textR} 0 a ${textR} ${textR} 0 1 1 ${textR*2} 0 a ${textR} ${textR} 0 1 1 -${textR*2} 0`} />
      </defs>
      <circle cx={r} cy={r} r={r - 1} fill="none" stroke={c} strokeWidth="1" />
      <circle cx={r} cy={r} r={inner} fill="none" stroke={c} strokeWidth="0.5" />
      {/* tick marks */}
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
      {/* Center kite glyph */}
      <g transform={`translate(${r - 14}, ${r - 18})`}>
        <path d="M 4 12 Q 14 0 24 12 Q 25 16 22 17 Q 14 9 6 17 Q 3 16 4 12 Z" fill="none" stroke={c} strokeWidth="0.8" />
        <line x1="14" y1="17" x2="14" y2="26" stroke={c} strokeWidth="0.8" />
        <line x1="11" y1="26" x2="17" y2="26" stroke={c} strokeWidth="0.8" />
      </g>
      <text x={r} y={r + 14} textAnchor="middle" fill={c} fontFamily={T.serif} fontStyle="italic" fontSize={size * 0.09}>{center}</text>
    </svg>
  );
}

// ============================================================
// HORIZON — reusable poster sky/sea backdrop
// ============================================================
function Horizon({ children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: '0 0 50% 0', background: `linear-gradient(180deg, ${T.paper} 0%, ${T.sand} 60%, #c89f5a 100%)` }} />
      <div style={{ position: 'absolute', inset: '50% 0 0 0', background: `linear-gradient(180deg, ${T.sea} 0%, ${T.seaDeep} 100%)` }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: T.ink, opacity: 0.5 }} />
      {children}
    </div>
  );
}

window.T = T;
window.Lockup = Lockup;
window.Icon = Icon;
window.PatternArcs = PatternArcs;
window.PatternWaves = PatternWaves;
window.Seal = Seal;
window.Horizon = Horizon;
