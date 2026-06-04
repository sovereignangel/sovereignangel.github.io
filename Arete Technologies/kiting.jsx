/* global React */
const { useState } = React;

// Shared tokens — match Arete identity
const INK = '#1a1815';
const CREAM = '#f4efe6';
const PAPER = '#ebe4d4';
const BRONZE = '#7a5a2e';
const BRONZE_LIGHT = '#a47e3e';
const SEA = '#1d4a6b';
const SEA_DEEP = '#0f2c44';
const SKY = '#d8d3bf';
const SUN = '#d89248';
const CORAL = '#c0533a';

// Reusable mini Arete mark (corner co-brand)
function AreteMini({ light = false }) {
  const fg = light ? CREAM : INK;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        fontSize: 11, letterSpacing: '0.42em', fontWeight: 500, color: fg,
        paddingLeft: '0.42em',
        fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
      }}>ARETE</div>
      <div style={{ width: 36, height: 1, background: fg, opacity: 0.45 }} />
      <div style={{
        fontSize: 6.5, letterSpacing: '0.42em', color: fg, opacity: 0.7,
        paddingLeft: '0.42em',
        fontFamily: 'ui-monospace, Menlo, monospace',
      }}>TECHNOLOGIES</div>
    </div>
  );
}

// ============================================================
// 01 — VINTAGE FRENCH TRAVEL POSTER
// Cassandre / PLM-era. Geometric kite, stylized horizon, warm cream
// paper. Block-set serif headline, all-caps.
// ============================================================
function PosterVintage() {
  return (
    <div style={{
      width: '100%', height: '100%', background: '#e8dfc8', color: INK,
      position: 'relative', overflow: 'hidden',
      fontFamily: '"Cormorant Garamond", Georgia, serif',
    }}>
      {/* sky band */}
      <div style={{ position: 'absolute', inset: '0 0 42% 0', background: 'linear-gradient(180deg, #e8dfc8 0%, #d6c89e 60%, #c89f5a 100%)' }} />
      {/* sun */}
      <div style={{
        position: 'absolute', top: '14%', right: '18%', width: 110, height: 110,
        borderRadius: '50%', background: SUN, opacity: 0.92,
      }} />
      {/* sea band */}
      <div style={{ position: 'absolute', inset: '58% 0 0 0', background: 'linear-gradient(180deg, #1d4a6b 0%, #0f2c44 100%)' }} />
      {/* horizon line */}
      <div style={{ position: 'absolute', top: '58%', left: 0, right: 0, height: 1, background: INK, opacity: 0.6 }} />
      {/* sea ripples */}
      {[0.66, 0.74, 0.82, 0.9].map((t, i) => (
        <div key={i} style={{
          position: 'absolute', top: `${t * 100}%`, left: 0, right: 0, height: 1,
          background: CREAM, opacity: 0.18 - i * 0.03,
        }} />
      ))}
      {/* the kite — geometric C-shape */}
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', top: '8%', left: '14%', width: 150, height: 150 }}>
        <path d="M 30 70 Q 100 0 170 70 Q 175 90 165 95 Q 100 50 35 95 Q 25 90 30 70 Z"
              fill={CORAL} stroke={INK} strokeWidth="1.5" />
        <path d="M 30 70 Q 100 0 170 70" fill="none" stroke={INK} strokeWidth="1" opacity="0.4" />
        <line x1="100" y1="58" x2="100" y2="42" stroke={INK} strokeWidth="0.75" opacity="0.5" />
      </svg>
      {/* lines */}
      <svg viewBox="0 0 600 800" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <line x1="155" y1="180" x2="380" y2="510" stroke={INK} strokeWidth="0.6" opacity="0.55" />
        <line x1="195" y1="195" x2="395" y2="510" stroke={INK} strokeWidth="0.6" opacity="0.55" />
      </svg>
      {/* rider silhouette */}
      <svg viewBox="0 0 100 140" style={{ position: 'absolute', top: '58%', left: '60%', width: 70, height: 100 }}>
        <path d="M 50 30 Q 56 30 56 22 Q 56 14 50 14 Q 44 14 44 22 Q 44 30 50 30 Z" fill={INK} />
        <path d="M 48 30 L 46 70 L 32 88 L 36 92 L 52 76 L 60 92 L 64 90 L 56 70 L 56 32 Z" fill={INK} />
        <path d="M 20 96 Q 50 88 80 96 L 78 102 Q 50 94 22 102 Z" fill={INK} />
      </svg>

      {/* TYPE */}
      <div style={{ position: 'absolute', top: 36, left: 40, right: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.6em', paddingLeft: '0.6em', fontFamily: 'ui-monospace, Menlo, monospace', opacity: 0.75 }}>
          ARETE · INVITATION
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 110, left: 40, right: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: '0.04em', lineHeight: 0.95, color: CREAM, textShadow: '0 1px 0 rgba(0,0,0,0.2)' }}>
          LEUCATE
        </div>
        <div style={{ fontSize: 14, letterSpacing: '0.42em', paddingLeft: '0.42em', marginTop: 10, fontFamily: 'Helvetica, sans-serif', fontWeight: 500, color: CREAM }}>
          JUILLET · MMXXVI
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 30, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', fontFamily: 'ui-monospace, Menlo, monospace', color: CREAM, opacity: 0.85, lineHeight: 1.7 }}>
          KITESURF<br />
          RETREAT<br />
          CÔTE LANGUEDOC
        </div>
        <div style={{ filter: 'invert(1) sepia(0.1)' }}>
          <AreteMini light />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 02 — EDITORIAL / SCHOLARLY
// Like Arete itself — cream, ink, hairline rules. A small, exact
// kite glyph. Long-form copy. Reads like a chapter opening.
// ============================================================
function PosterEditorial() {
  return (
    <div style={{
      width: '100%', height: '100%', background: CREAM, color: INK,
      padding: '54px 56px', position: 'relative', overflow: 'hidden',
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.42em', paddingLeft: '0.42em', fontFamily: 'ui-monospace, Menlo, monospace', opacity: 0.6 }}>
          II · MMXXVI · LP RETREAT
        </div>
        <AreteMini />
      </div>

      <div style={{ height: 1, background: INK, opacity: 0.35, margin: '36px 0 48px' }} />

      {/* Kite glyph — schematic */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
        <svg viewBox="0 0 240 180" width="220" height="160">
          {/* kite arc */}
          <path d="M 30 80 Q 120 0 210 80" fill="none" stroke={INK} strokeWidth="1.25" />
          <path d="M 30 80 Q 120 50 210 80" fill="none" stroke={INK} strokeWidth="1.25" />
          {/* spokes */}
          {[0.15, 0.3, 0.5, 0.7, 0.85].map((t, i) => {
            const x = 30 + (210 - 30) * t;
            const yTop = 80 - 80 * Math.sin(Math.PI * t);
            const yMid = 80 - 30 * Math.sin(Math.PI * t);
            return <line key={i} x1={x} y1={yTop} x2={x} y2={yMid} stroke={INK} strokeWidth="0.5" opacity="0.45" />;
          })}
          {/* lines down */}
          <line x1="30" y1="80" x2="120" y2="170" stroke={INK} strokeWidth="0.5" opacity="0.5" />
          <line x1="210" y1="80" x2="120" y2="170" stroke={INK} strokeWidth="0.5" opacity="0.5" />
          {/* bar */}
          <line x1="100" y1="170" x2="140" y2="170" stroke={INK} strokeWidth="1.25" />
          {/* annotation */}
          <text x="218" y="84" fontSize="6" fontFamily="ui-monospace, Menlo, monospace" fill={INK} opacity="0.55">τέχνη</text>
        </svg>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 46, fontWeight: 400, lineHeight: 1.05, fontStyle: 'italic', letterSpacing: '0.01em' }}>
          On the wind,<br />the long view.
        </div>
      </div>

      <div style={{
        maxWidth: 380, margin: '0 auto', textAlign: 'center',
        fontSize: 14, lineHeight: 1.7, opacity: 0.82,
      }}>
        Five days at Hyères for the partners of Arete — kitesurf at dawn, read in the afternoon, eat slowly. A practice in mastery, patience, and the long horizon.
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ height: 1, background: INK, opacity: 0.25, margin: '32px 0 20px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.3em', fontFamily: 'ui-monospace, Menlo, monospace', opacity: 0.65, textTransform: 'uppercase' }}>
        <span>Hyères · Var</span>
        <span>14–19 July 2026</span>
        <span>By invitation</span>
      </div>
    </div>
  );
}

// ============================================================
// 03 — MODERNIST / SWISS — bold sport graphic
// Big sea field, oversized typographic statement, single bright
// kite arc. Disciplined grid.
// ============================================================
function PosterModernist() {
  return (
    <div style={{
      width: '100%', height: '100%', background: SEA, color: CREAM,
      position: 'relative', overflow: 'hidden',
      fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* sky */}
      <div style={{ position: 'absolute', inset: '0 0 65% 0', background: SKY }} />
      {/* horizon */}
      <div style={{ position: 'absolute', top: '35%', left: 0, right: 0, height: 1, background: INK, opacity: 0.3 }} />

      {/* big kite arc — bronze */}
      <svg viewBox="0 0 600 200" preserveAspectRatio="none" style={{ position: 'absolute', top: '10%', left: 0, right: 0, width: '100%', height: '28%' }}>
        <path d="M 80 180 Q 300 -40 520 180" fill="none" stroke={SUN} strokeWidth="6" />
      </svg>
      {/* lines */}
      <svg viewBox="0 0 600 800" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <line x1="300" y1="180" x2="430" y2="600" stroke={CREAM} strokeWidth="0.6" opacity="0.4" />
        <line x1="320" y1="178" x2="438" y2="600" stroke={CREAM} strokeWidth="0.6" opacity="0.4" />
      </svg>
      {/* rider tiny */}
      <div style={{ position: 'absolute', top: '72%', left: '68%', width: 8, height: 14, background: INK, borderRadius: 1 }} />
      {/* board wake */}
      <svg viewBox="0 0 600 100" preserveAspectRatio="none" style={{ position: 'absolute', top: '78%', left: 0, width: '100%', height: '12%', opacity: 0.5 }}>
        <path d="M 380 50 Q 460 40 540 60" fill="none" stroke={CREAM} strokeWidth="1" />
      </svg>

      {/* TYPE */}
      <div style={{ position: 'absolute', top: 40, left: 40, right: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: 'ui-monospace, Menlo, monospace', opacity: 0.75 }}>
            LP RETREAT · 01
          </div>
          <div style={{ filter: 'brightness(0) invert(1)' }}>
            <AreteMini />
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 130, left: 40, right: 40 }}>
        <div style={{
          fontSize: 92, fontWeight: 500, lineHeight: 0.92, letterSpacing: '-0.02em',
          color: CREAM,
        }}>
          MASTERY<br />
          <span style={{ color: SUN }}>BY THE</span><br />
          HOUR.
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 10, letterSpacing: '0.3em', fontFamily: 'ui-monospace, Menlo, monospace', textTransform: 'uppercase' }}>
        <div style={{ lineHeight: 1.8 }}>
          Kitesurf retreat<br />
          Leucate · France
        </div>
        <div style={{ textAlign: 'right', lineHeight: 1.8 }}>
          14 — 19 JUL<br />
          MMXXVI
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 04 — STONE-CUT / CLASSICAL — invitation card feel
// Dark ink ground, cream type, embossed look. Greek and Latin
// epigraphic. A single kite-arc as ornament.
// ============================================================
function PosterClassical() {
  return (
    <div style={{
      width: '100%', height: '100%', background: INK, color: CREAM,
      padding: '60px 56px', position: 'relative', overflow: 'hidden',
      fontFamily: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    }}>
      {/* ornamental border */}
      <div style={{ position: 'absolute', inset: 24, border: `1px solid ${BRONZE_LIGHT}`, opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 30, border: `1px solid ${BRONZE_LIGHT}`, opacity: 0.2 }} />

      <div style={{ filter: 'brightness(0) invert(1)', marginTop: 8 }}>
        <AreteMini light />
      </div>

      <div style={{ width: 80, height: 1, background: BRONZE_LIGHT, opacity: 0.6, margin: '30px 0' }} />

      <div style={{ fontSize: 13, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: 'ui-monospace, Menlo, monospace', opacity: 0.7 }}>
        INVITATION
      </div>

      <div style={{ marginTop: 36, fontSize: 50, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.05 }}>
        ἀρετή<br />
        <span style={{ fontStyle: 'normal', fontSize: 32, letterSpacing: '0.18em', paddingLeft: '0.18em' }}>SUR LA MER</span>
      </div>

      {/* kite arc ornament */}
      <svg viewBox="0 0 240 80" width="200" height="60" style={{ marginTop: 36 }}>
        <path d="M 20 60 Q 120 -20 220 60" fill="none" stroke={BRONZE_LIGHT} strokeWidth="1" />
        <line x1="120" y1="22" x2="120" y2="60" stroke={BRONZE_LIGHT} strokeWidth="0.5" opacity="0.5" />
        <circle cx="120" cy="22" r="1.5" fill={BRONZE_LIGHT} />
      </svg>

      <div style={{ marginTop: 36, maxWidth: 360, fontSize: 14, lineHeight: 1.75, opacity: 0.82, fontStyle: 'italic' }}>
        A retreat for the partners of Arete — five days of kitesurf, slow reading, and long conversation on the Mediterranean.
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ width: 60, height: 1, background: BRONZE_LIGHT, opacity: 0.5, margin: '24px 0' }} />

      <div style={{ fontSize: 11, letterSpacing: '0.42em', paddingLeft: '0.42em', fontFamily: 'ui-monospace, Menlo, monospace', opacity: 0.7, lineHeight: 2 }}>
        HYÈRES · VAR<br />
        XIV — XIX · JULY · MMXXVI
      </div>
    </div>
  );
}

// ============================================================
// CONTACT SHEET — small label + frame
// ============================================================
function PosterFrame({ children, label, sub }) {
  return (
    <div style={{ width: 600, height: 800, position: 'relative', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  );
}

window.PosterVintage = PosterVintage;
window.PosterEditorial = PosterEditorial;
window.PosterModernist = PosterModernist;
window.PosterClassical = PosterClassical;
window.PosterFrame = PosterFrame;
