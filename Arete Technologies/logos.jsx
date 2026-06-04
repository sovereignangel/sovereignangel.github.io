/* global React */
const { useState, useEffect, useRef } = React;

// ============================================================
// SHARED TOKENS
// ============================================================
const INK = '#1a1815';
const CREAM = '#f4efe6';
const PAPER = '#ebe4d4';
const BRONZE = '#7a5a2e';
const BRONZE_LIGHT = '#a47e3e';
const NAVY = '#0f1d2e';
const STONE = '#5a554c';

// ============================================================
// 01 — STONE-CUT TRAJAN
// Carved-in-marble feel. Roman capitals, wide tracking, a single
// engraved horizontal rule. The "T" carries a subtle gnomon notch.
// ============================================================
function StoneCut({ dark = false }) {
  const fg = dark ? CREAM : INK;
  return (
    <div style={{ textAlign: 'center', fontFamily: '"Cormorant Garamond", "Trajan Pro", Georgia, serif' }}>
      <div style={{
        fontSize: 64, fontWeight: 500, letterSpacing: '0.32em',
        color: fg, paddingLeft: '0.32em',
      }}>
        ARETE
      </div>
      <div style={{
        height: 1, background: fg, opacity: 0.4,
        width: 280, margin: '14px auto 12px',
      }} />
      <div style={{
        fontSize: 11, letterSpacing: '0.55em', color: fg,
        opacity: 0.7, paddingLeft: '0.55em',
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontStyle: 'italic', fontWeight: 400,
      }}>
        TECHNOLOGIES
      </div>
    </div>
  );
}

// ============================================================
// 02 — THE GOLDEN MEAN
// A circle bisected by a vertical rule placed at φ (0.618).
// The mark IS the doctrine: the mean is not the middle.
// ============================================================
function GoldenMean({ dark = false }) {
  const fg = dark ? CREAM : INK;
  const accent = BRONZE_LIGHT;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <circle cx="36" cy="36" r="34" stroke={fg} strokeWidth="1.25" />
        {/* φ line at 0.382 from left = 0.618 from right; classical mean */}
        <line x1={36 - 34 + (68 * 0.382)} y1="2" x2={36 - 34 + (68 * 0.382)} y2="70" stroke={accent} strokeWidth="1.25" />
        <circle cx={36 - 34 + (68 * 0.382)} cy="36" r="2" fill={accent} />
      </svg>
      <div style={{ fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif' }}>
        <div style={{
          fontSize: 32, fontWeight: 500, letterSpacing: '0.24em',
          color: fg, paddingLeft: '0.24em', lineHeight: 1,
        }}>
          ARETE
        </div>
        <div style={{
          fontSize: 9, letterSpacing: '0.42em', color: fg,
          opacity: 0.6, paddingLeft: '0.42em', marginTop: 8,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontWeight: 400,
        }}>
          TECHNOLOGIES
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 03 — BILINGUAL STACK
// ἀρετή stacked above ARETE. The Greek roots, then the modern voice.
// Hairline rule between. Quietly scholarly.
// ============================================================
function Bilingual({ dark = false }) {
  const fg = dark ? CREAM : INK;
  return (
    <div style={{ textAlign: 'center', fontFamily: '"Cormorant Garamond", "GFS Didot", Didot, Georgia, serif' }}>
      <div style={{
        fontSize: 56, fontWeight: 400, color: fg,
        fontStyle: 'italic', letterSpacing: '0.02em', lineHeight: 1,
      }}>
        ἀρετή
      </div>
      <div style={{
        width: 120, height: 1, background: fg, opacity: 0.35,
        margin: '14px auto',
      }} />
      <div style={{
        fontSize: 22, letterSpacing: '0.48em', color: fg,
        paddingLeft: '0.48em', fontWeight: 500,
        fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
      }}>
        ARETE
      </div>
      <div style={{
        fontSize: 9, letterSpacing: '0.42em', color: fg,
        opacity: 0.55, paddingLeft: '0.42em', marginTop: 8,
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      }}>
        TECHNOLOGIES
      </div>
    </div>
  );
}

// ============================================================
// 04 — THE AIM
// Aristotle: "every art and inquiry aims at some good."
// A single point converging from a wedge — telos as geometry.
// Quant/schematic register: monospace, tight grid.
// ============================================================
function TheAim({ dark = false }) {
  const fg = dark ? CREAM : INK;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <svg width="84" height="60" viewBox="0 0 84 60" fill="none">
        <line x1="2" y1="6" x2="78" y2="30" stroke={fg} strokeWidth="1" />
        <line x1="2" y1="54" x2="78" y2="30" stroke={fg} strokeWidth="1" />
        <line x1="2" y1="30" x2="78" y2="30" stroke={fg} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
        <circle cx="78" cy="30" r="2.5" fill={fg} />
        <text x="80" y="14" fill={fg} fontSize="6" fontFamily="ui-monospace, Menlo, monospace" opacity="0.55">τέλος</text>
      </svg>
      <div style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' }}>
        <div style={{
          fontSize: 26, fontWeight: 500, letterSpacing: '0.18em',
          color: fg, paddingLeft: '0.18em', lineHeight: 1,
        }}>
          ARETE
        </div>
        <div style={{
          fontSize: 9, letterSpacing: '0.32em', color: fg,
          opacity: 0.6, paddingLeft: '0.32em', marginTop: 8,
        }}>
          TECHNOLOGIES
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 05 — MONOGRAM A.T.
// A serif "A" whose crossbar is the golden mean line.
// Tight, confident, works as favicon and seal.
// ============================================================
function Monogram({ dark = false }) {
  const fg = dark ? CREAM : INK;
  const accent = BRONZE_LIGHT;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
        <circle cx="38" cy="38" r="37" stroke={fg} strokeWidth="0.75" opacity="0.5" />
        {/* A */}
        <path d="M 22 58 L 38 18 L 54 58" stroke={fg} strokeWidth="1.5" fill="none" strokeLinejoin="miter" />
        {/* crossbar at φ position from apex (0.382 down) */}
        <line x1="28" y1={18 + (40 * 0.618)} x2="48" y2={18 + (40 * 0.618)} stroke={accent} strokeWidth="1.5" />
        {/* tiny T mark */}
        <line x1="34" y1="64" x2="42" y2="64" stroke={fg} strokeWidth="0.75" />
        <line x1="38" y1="64" x2="38" y2="68" stroke={fg} strokeWidth="0.75" />
      </svg>
      <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        <div style={{
          fontSize: 36, fontWeight: 500, letterSpacing: '0.18em',
          color: fg, paddingLeft: '0.18em', lineHeight: 1,
        }}>
          Arete
        </div>
        <div style={{
          fontSize: 9, letterSpacing: '0.42em', color: fg,
          opacity: 0.6, paddingLeft: '0.42em', marginTop: 10,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontWeight: 400,
        }}>
          TECHNOLOGIES
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 06 — THE CONDUIT
// Two parallel rules with a narrow aperture — the channel
// through which one becomes. Wordmark sits inside.
// Most conceptual; least conventional.
// ============================================================
function Conduit({ dark = false }) {
  const fg = dark ? CREAM : INK;
  return (
    <div style={{ position: 'relative', padding: '36px 8px', fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif' }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 360, height: 1, background: fg }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 360, height: 1, background: fg }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 30, fontWeight: 400, letterSpacing: '0.42em',
          color: fg, paddingLeft: '0.42em', lineHeight: 1,
        }}>
          ARETE
        </div>
        <div style={{
          fontSize: 9, letterSpacing: '0.42em', color: fg,
          opacity: 0.6, paddingLeft: '0.42em', marginTop: 10,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        }}>
          TECHNOLOGIES
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CONTEXT FRAMES — show each logo on three substrates so we can
// judge how it lives in the wild.
// ============================================================
function Frame({ children, bg, label, w = 520, h = 240 }) {
  return (
    <div style={{
      width: w, height: h, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      boxShadow: bg === CREAM || bg === '#fff' ? 'inset 0 0 0 1px rgba(0,0,0,0.06)' : 'none',
    }}>
      {children}
      <div style={{
        position: 'absolute', bottom: 10, left: 14,
        fontSize: 9, letterSpacing: '0.2em',
        fontFamily: 'ui-monospace, Menlo, monospace',
        color: bg === INK || bg === NAVY ? 'rgba(244,239,230,0.4)' : 'rgba(26,24,21,0.4)',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  );
}

function LogoSet({ Logo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Frame bg={CREAM} label="cream"><Logo /></Frame>
      <Frame bg="#ffffff" label="white"><Logo /></Frame>
      <Frame bg={INK} label="ink"><Logo dark /></Frame>
    </div>
  );
}

// ============================================================
// LETTERHEAD — applied use, single example
// ============================================================
function Letterhead() {
  return (
    <div style={{
      width: 600, height: 800, background: CREAM, padding: '60px 64px',
      fontFamily: '"Cormorant Garamond", Georgia, serif', color: INK,
      display: 'flex', flexDirection: 'column',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontSize: 22, letterSpacing: '0.42em', fontWeight: 500,
            paddingLeft: '0.42em',
            fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
          }}>
            ARETE
          </div>
          <div style={{
            fontSize: 9, letterSpacing: '0.42em', opacity: 0.6, marginTop: 6,
            paddingLeft: '0.42em',
            fontFamily: 'ui-monospace, Menlo, monospace',
          }}>
            TECHNOLOGIES
          </div>
        </div>
        <div style={{
          fontSize: 9, letterSpacing: '0.2em', textAlign: 'right', opacity: 0.55,
          fontFamily: 'ui-monospace, Menlo, monospace', lineHeight: 1.8,
        }}>
          MMXXVI<br />NEW YORK · ATHENS<br />ARETE.TECH
        </div>
      </div>
      <div style={{ height: 1, background: INK, opacity: 0.35, margin: '40px 0' }} />
      <div style={{ fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', opacity: 0.85, maxWidth: 380 }}>
        "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
      </div>
      <div style={{ marginTop: 12, fontSize: 9, letterSpacing: '0.3em', opacity: 0.5, fontFamily: 'ui-monospace, Menlo, monospace' }}>
        — ARISTOTLE, NICOMACHEAN ETHICS II
      </div>
      <div style={{ flex: 1 }} />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, letterSpacing: '0.25em', opacity: 0.5,
        fontFamily: 'ui-monospace, Menlo, monospace',
      }}>
        <span>A CONDUIT</span>
        <span>—</span>
        <span>TO BECOMING</span>
      </div>
    </div>
  );
}

// ============================================================
// BUSINESS CARD
// ============================================================
function Card({ Logo, name, role }) {
  return (
    <div style={{
      width: 420, height: 240, background: CREAM, padding: 32,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      fontFamily: '"Cormorant Garamond", Georgia, serif', color: INK,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
    }}>
      <Logo />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '0.04em' }}>{name}</div>
          <div style={{
            fontSize: 9, letterSpacing: '0.3em', opacity: 0.6, marginTop: 4,
            fontFamily: 'ui-monospace, Menlo, monospace', textTransform: 'uppercase',
          }}>
            {role}
          </div>
        </div>
        <div style={{
          fontSize: 9, letterSpacing: '0.25em', opacity: 0.5, textAlign: 'right',
          fontFamily: 'ui-monospace, Menlo, monospace', lineHeight: 1.8,
        }}>
          ARETE.TECH
        </div>
      </div>
    </div>
  );
}

window.StoneCut = StoneCut;
window.GoldenMean = GoldenMean;
window.Bilingual = Bilingual;
window.TheAim = TheAim;
window.Monogram = Monogram;
window.Conduit = Conduit;
window.LogoSet = LogoSet;
window.Letterhead = Letterhead;
window.Card = Card;
