/* global React */
// Standalone retreat poster — copied from kiting.jsx so this page is self-contained.
const { useState: usePosterState } = React;

function PosterVintageHero() {
  const T = window.T;
  return (
    <div style={{
      width: '100%', height: '100%', background: '#e8dfc8', color: T.ink,
      position: 'relative', overflow: 'hidden',
      fontFamily: T.serif,
    }}>
      <div style={{ position: 'absolute', inset: '0 0 42% 0', background: 'linear-gradient(180deg, #e8dfc8 0%, #d6c89e 60%, #c89f5a 100%)' }} />
      <div style={{
        position: 'absolute', top: '14%', right: '18%', width: '18%', aspectRatio: '1',
        borderRadius: '50%', background: T.sun, opacity: 0.92,
      }} />
      <div style={{ position: 'absolute', inset: '58% 0 0 0', background: 'linear-gradient(180deg, #1d4a6b 0%, #0f2c44 100%)' }} />
      <div style={{ position: 'absolute', top: '58%', left: 0, right: 0, height: 1, background: T.ink, opacity: 0.6 }} />
      {[0.66, 0.74, 0.82, 0.9].map((t, i) => (
        <div key={i} style={{
          position: 'absolute', top: `${t * 100}%`, left: 0, right: 0, height: 1,
          background: T.cream, opacity: 0.18 - i * 0.03,
        }} />
      ))}
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', top: '8%', left: '14%', width: '25%' }}>
        <path d="M 30 70 Q 100 0 170 70 Q 175 90 165 95 Q 100 50 35 95 Q 25 90 30 70 Z"
              fill={T.coral} stroke={T.ink} strokeWidth="1.5" />
        <path d="M 30 70 Q 100 0 170 70" fill="none" stroke={T.ink} strokeWidth="1" opacity="0.4" />
        <line x1="100" y1="58" x2="100" y2="42" stroke={T.ink} strokeWidth="0.75" opacity="0.5" />
      </svg>
      <svg viewBox="0 0 600 800" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <line x1="155" y1="180" x2="380" y2="510" stroke={T.ink} strokeWidth="0.6" opacity="0.55" />
        <line x1="195" y1="195" x2="395" y2="510" stroke={T.ink} strokeWidth="0.6" opacity="0.55" />
      </svg>
      <svg viewBox="0 0 100 140" style={{ position: 'absolute', top: '58%', left: '60%', width: '12%' }}>
        <path d="M 50 30 Q 56 30 56 22 Q 56 14 50 14 Q 44 14 44 22 Q 44 30 50 30 Z" fill={T.ink} />
        <path d="M 48 30 L 46 70 L 32 88 L 36 92 L 52 76 L 60 92 L 64 90 L 56 70 L 56 32 Z" fill={T.ink} />
        <path d="M 20 96 Q 50 88 80 96 L 78 102 Q 50 94 22 102 Z" fill={T.ink} />
      </svg>

      <div style={{ position: 'absolute', top: '5%', left: '8%', right: '8%', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(8px, 1vw, 14px)', letterSpacing: '0.6em', paddingLeft: '0.6em', fontFamily: T.mono, opacity: 0.75 }}>
          ARETE · INVITATION
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '16%', left: '8%', right: '8%', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(36px, 7vw, 84px)', fontWeight: 500, letterSpacing: '0.04em', lineHeight: 0.95, color: T.cream }}>
          MISTRAL
        </div>
        <div style={{ fontSize: 'clamp(10px, 1.4vw, 18px)', letterSpacing: '0.42em', paddingLeft: '0.42em', marginTop: 14, fontFamily: T.sans, fontWeight: 500, color: T.cream }}>
          JUILLET · MMXXVI
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '4%', left: '8%', right: '8%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: 'clamp(7px, 0.9vw, 11px)', letterSpacing: '0.3em', fontFamily: T.mono, color: T.cream, opacity: 0.85, lineHeight: 1.7 }}>
          KITESURF<br />
          RETREAT<br />
          CÔTE FRANÇAISE
        </div>
        <div style={{ fontSize: 'clamp(7px, 0.9vw, 11px)', letterSpacing: '0.3em', fontFamily: T.mono, color: T.cream, opacity: 0.85, lineHeight: 1.7, textAlign: 'right' }}>
          IV SEMAINES<br />
          IV CÔTES<br />
          BY INVITATION
        </div>
      </div>
    </div>
  );
}

window.PosterVintage = PosterVintageHero;
