'use client'

import { useState, useEffect, type CSSProperties } from 'react'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// ============================================================
// ARETE x MISTRAL - tokens
// ============================================================
const T = {
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
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

// ============================================================
// LOCKUP
// ============================================================
function Lockup({ light = false, size = 'md' }: { light?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const fg = light ? T.cream : T.ink
  const accent = light ? T.sun : T.bronze
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.4 : 1
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', fontFamily: T.serif, color: fg }}>
      <div style={{ fontSize: 11 * scale, letterSpacing: '0.42em', paddingLeft: '0.42em', fontFamily: T.sans, fontWeight: 500, opacity: 0.85 }}>
        ARETE
      </div>
      <div style={{ width: 38 * scale, height: 1, background: fg, opacity: 0.5, margin: `${6 * scale}px 0` }} />
      <div style={{ fontSize: 38 * scale, fontStyle: 'italic', fontWeight: 400, letterSpacing: '0.01em', lineHeight: 1, color: accent, marginTop: 2 * scale }}>
        Mistral
      </div>
      <div style={{ fontSize: 8 * scale, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.7, marginTop: 8 * scale }}>
        KITESURF · MMXXVI
      </div>
    </div>
  )
}

// ============================================================
// ICONS
// ============================================================
type IconKind = 'kite' | 'sun' | 'wave' | 'anchor' | 'compass' | 'book' | 'bowl' | 'wind' | 'mountain' | 'olive'

function Icon({ kind, size = 56, color, opacity = 1 }: { kind: IconKind; size?: number; color?: string; opacity?: number }) {
  const c = color || T.ink
  const props = { fill: 'none', stroke: c, strokeWidth: 1.25, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, opacity }
  const s = { width: size, height: size }
  switch (kind) {
    case 'kite':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 8 24 Q 32 0 56 24 Q 58 32 52 34 Q 32 18 12 34 Q 6 32 8 24 Z" {...props} />
          <line x1="32" y1="34" x2="32" y2="56" {...props} />
          <line x1="26" y1="56" x2="38" y2="56" {...props} />
        </svg>
      )
    case 'sun':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <circle cx="32" cy="32" r="12" {...props} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180
            return (
              <line
                key={a}
                x1={32 + Math.cos(r) * 18}
                y1={32 + Math.sin(r) * 18}
                x2={32 + Math.cos(r) * 24}
                y2={32 + Math.sin(r) * 24}
                {...props}
              />
            )
          })}
        </svg>
      )
    case 'wave':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 4 24 Q 16 14 28 24 T 60 24" {...props} />
          <path d="M 4 36 Q 16 26 28 36 T 60 36" {...props} />
          <path d="M 4 48 Q 16 38 28 48 T 60 48" {...props} />
        </svg>
      )
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
      )
    case 'compass':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <circle cx="32" cy="32" r="22" {...props} />
          <path d="M 32 14 L 36 32 L 32 50 L 28 32 Z" {...props} />
          <circle cx="32" cy="32" r="2" fill={c} />
          <text x="32" y="11" fontSize="6" fontFamily={T.mono} fill={c} textAnchor="middle" opacity={opacity}>
            N
          </text>
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 12 14 L 32 18 L 52 14 L 52 50 L 32 54 L 12 50 Z" {...props} />
          <line x1="32" y1="18" x2="32" y2="54" {...props} />
        </svg>
      )
    case 'bowl':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 8 28 Q 32 36 56 28" {...props} />
          <path d="M 8 28 Q 12 50 32 50 Q 52 50 56 28" {...props} />
          <path d="M 24 18 Q 26 22 24 26" {...props} />
          <path d="M 32 16 Q 34 22 32 26" {...props} />
          <path d="M 40 18 Q 42 22 40 26" {...props} />
        </svg>
      )
    case 'wind':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 6 22 L 42 22 Q 52 22 52 16 Q 52 10 46 10" {...props} />
          <path d="M 6 32 L 50 32 Q 58 32 58 26" {...props} />
          <path d="M 6 42 L 38 42 Q 46 42 46 48 Q 46 54 40 54" {...props} />
        </svg>
      )
    case 'mountain':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 6 50 L 22 24 L 32 36 L 44 18 L 58 50 Z" {...props} />
          <line x1="6" y1="50" x2="58" y2="50" {...props} />
        </svg>
      )
    case 'olive':
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M 32 8 Q 32 32 32 56" {...props} />
          {[14, 22, 30, 38, 46].map((y, i) => (
            <g key={i}>
              <path d={i % 2 ? `M 32 ${y} Q 18 ${y - 4} 14 ${y + 4}` : `M 32 ${y} Q 46 ${y - 4} 50 ${y + 4}`} {...props} />
              <ellipse cx={i % 2 ? 16 : 48} cy={y + 2} rx="3" ry="4.5" {...props} />
            </g>
          ))}
        </svg>
      )
    default:
      return <svg viewBox="0 0 64 64" style={s} />
  }
}

// ============================================================
// PATTERNS
// ============================================================
function PatternArcs({ color, opacity = 0.18, size = 80 }: { color?: string; opacity?: number; size?: number }) {
  const c = color || T.ink
  const id = 'arc-' + Math.random().toString(36).slice(2, 8)
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id={id} x="0" y="0" width={size} height={size * 0.5} patternUnits="userSpaceOnUse">
          <path d={`M 0 ${size * 0.5} Q ${size * 0.5} 0 ${size} ${size * 0.5}`} fill="none" stroke={c} strokeWidth="0.75" opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

function PatternWaves({ color, opacity = 0.15, size = 80 }: { color?: string; opacity?: number; size?: number }) {
  const c = color || T.ink
  const id = 'wave-' + Math.random().toString(36).slice(2, 8)
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id={id} x="0" y="0" width={size} height={size * 0.25} patternUnits="userSpaceOnUse">
          <path
            d={`M 0 ${size * 0.125} Q ${size * 0.25} 0 ${size * 0.5} ${size * 0.125} T ${size} ${size * 0.125}`}
            fill="none"
            stroke={c}
            strokeWidth="0.6"
            opacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

// ============================================================
// SEAL
// ============================================================
function Seal({
  size = 140,
  color,
  label = 'ARETE · MISTRAL',
  center = 'MMXXVI',
  sub = 'KITESURF · FRANCE',
}: {
  size?: number
  color?: string
  label?: string
  center?: string
  sub?: string
}) {
  const c = color || T.bronze
  const r = size / 2
  const inner = r - 8
  const textR = r - 14
  const id = 'seal-' + Math.random().toString(36).slice(2, 8)
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <path
          id={id}
          d={`M ${r} ${r} m -${textR} 0 a ${textR} ${textR} 0 1 1 ${textR * 2} 0 a ${textR} ${textR} 0 1 1 -${textR * 2} 0`}
        />
      </defs>
      <circle cx={r} cy={r} r={r - 1} fill="none" stroke={c} strokeWidth="1" />
      <circle cx={r} cy={r} r={inner} fill="none" stroke={c} strokeWidth="0.5" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2
        const x1 = r + Math.cos(a) * (inner - 2)
        const y1 = r + Math.sin(a) * (inner - 2)
        const x2 = r + Math.cos(a) * (inner - 5)
        const y2 = r + Math.sin(a) * (inner - 5)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="0.5" opacity="0.6" />
      })}
      <text fill={c} fontFamily={T.mono} fontSize={size * 0.07} letterSpacing="3">
        <textPath href={`#${id}`} startOffset="25%" textAnchor="middle">
          {label}
        </textPath>
      </text>
      <text fill={c} fontFamily={T.mono} fontSize={size * 0.06} letterSpacing="2">
        <textPath href={`#${id}`} startOffset="75%" textAnchor="middle">
          {sub}
        </textPath>
      </text>
      <g transform={`translate(${r - 14}, ${r - 18})`}>
        <path d="M 4 12 Q 14 0 24 12 Q 25 16 22 17 Q 14 9 6 17 Q 3 16 4 12 Z" fill="none" stroke={c} strokeWidth="0.8" />
        <line x1="14" y1="17" x2="14" y2="26" stroke={c} strokeWidth="0.8" />
        <line x1="11" y1="26" x2="17" y2="26" stroke={c} strokeWidth="0.8" />
      </g>
      <text x={r} y={r + 14} textAnchor="middle" fill={c} fontFamily={T.serif} fontStyle="italic" fontSize={size * 0.09}>
        {center}
      </text>
    </svg>
  )
}

// ============================================================
// POSTER (vintage hero)
// ============================================================
function PosterVintage() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#e8dfc8',
        color: T.ink,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: T.serif,
      }}
    >
      <div style={{ position: 'absolute', inset: '0 0 42% 0', background: 'linear-gradient(180deg, #e8dfc8 0%, #d6c89e 60%, #c89f5a 100%)' }} />
      <div
        style={{
          position: 'absolute',
          top: '14%',
          right: '18%',
          width: '18%',
          aspectRatio: '1',
          borderRadius: '50%',
          background: T.sun,
          opacity: 0.92,
        }}
      />
      <div style={{ position: 'absolute', inset: '58% 0 0 0', background: 'linear-gradient(180deg, #1d4a6b 0%, #0f2c44 100%)' }} />
      <div style={{ position: 'absolute', top: '58%', left: 0, right: 0, height: 1, background: T.ink, opacity: 0.6 }} />
      {[0.66, 0.74, 0.82, 0.9].map((t, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${t * 100}%`,
            left: 0,
            right: 0,
            height: 1,
            background: T.cream,
            opacity: 0.18 - i * 0.03,
          }}
        />
      ))}
      <svg viewBox="0 0 200 200" style={{ position: 'absolute', top: '8%', left: '14%', width: '25%' }}>
        <path
          d="M 30 70 Q 100 0 170 70 Q 175 90 165 95 Q 100 50 35 95 Q 25 90 30 70 Z"
          fill={T.coral}
          stroke={T.ink}
          strokeWidth="1.5"
        />
        <path d="M 30 70 Q 100 0 170 70" fill="none" stroke={T.ink} strokeWidth="1" opacity="0.4" />
        <line x1="100" y1="58" x2="100" y2="42" stroke={T.ink} strokeWidth="0.75" opacity="0.5" />
      </svg>
      <svg
        viewBox="0 0 600 800"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <line x1="155" y1="180" x2="380" y2="510" stroke={T.ink} strokeWidth="0.6" opacity="0.55" />
        <line x1="195" y1="195" x2="395" y2="510" stroke={T.ink} strokeWidth="0.6" opacity="0.55" />
      </svg>
      <svg viewBox="0 0 100 140" style={{ position: 'absolute', top: '58%', left: '60%', width: '12%' }}>
        <path d="M 50 30 Q 56 30 56 22 Q 56 14 50 14 Q 44 14 44 22 Q 44 30 50 30 Z" fill={T.ink} />
        <path d="M 48 30 L 46 70 L 32 88 L 36 92 L 52 76 L 60 92 L 64 90 L 56 70 L 56 32 Z" fill={T.ink} />
        <path d="M 20 96 Q 50 88 80 96 L 78 102 Q 50 94 22 102 Z" fill={T.ink} />
      </svg>

      <div style={{ position: 'absolute', top: '5%', left: '8%', right: '8%', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 'clamp(8px, 1vw, 14px)',
            letterSpacing: '0.6em',
            paddingLeft: '0.6em',
            fontFamily: T.mono,
            opacity: 0.75,
          }}
        >
          ARETE · INVITATION
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '16%', left: '8%', right: '8%', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 'clamp(36px, 7vw, 84px)',
            fontWeight: 500,
            letterSpacing: '0.04em',
            lineHeight: 0.95,
            color: T.cream,
          }}
        >
          MISTRAL
        </div>
        <div
          style={{
            fontSize: 'clamp(10px, 1.4vw, 18px)',
            letterSpacing: '0.42em',
            paddingLeft: '0.42em',
            marginTop: 14,
            fontFamily: T.sans,
            fontWeight: 500,
            color: T.cream,
          }}
        >
          JUILLET · MMXXVI
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '4%',
          left: '8%',
          right: '8%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(7px, 0.9vw, 11px)',
            letterSpacing: '0.3em',
            fontFamily: T.mono,
            color: T.cream,
            opacity: 0.85,
            lineHeight: 1.7,
          }}
        >
          KITESURF
          <br />
          RETREAT
          <br />
          CÔTE FRANÇAISE
        </div>
        <div
          style={{
            fontSize: 'clamp(7px, 0.9vw, 11px)',
            letterSpacing: '0.3em',
            fontFamily: T.mono,
            color: T.cream,
            opacity: 0.85,
            lineHeight: 1.7,
            textAlign: 'right',
          }}
        >
          IV SEMAINES
          <br />
          IV CÔTES
          <br />
          BY INVITATION
        </div>
      </div>
    </div>
  )
}

// ============================================================
// WEEKS
// ============================================================
type Week = { n: 'I' | 'II' | 'III' | 'IV'; dates: string; place: string; region: string; spot: string; desc: string; cap: number }

const WEEKS: Week[] = [
  { n: 'I', dates: '29 JUN — 5 JUL', place: 'Hyères', region: 'Var', spot: "L'Almanarre", desc: 'Long flat-water sessions on the salt lagoons. Olive trees and a quiet town.', cap: 8 },
  { n: 'II', dates: '6 JUL — 12 JUL', place: 'Port-Saint-Louis', region: 'Bouches-du-Rhône', spot: 'Napoléon', desc: 'Mistral country. Open Camargue beaches, wild horses, the cleanest wind in Europe.', cap: 8 },
  { n: 'III', dates: '13 JUL — 19 JUL', place: 'Le Barcarès', region: 'Pyrénées-Orientales', spot: 'La Coudalère', desc: 'Long sand spit, shallow water, ideal for hours of progression.', cap: 8 },
  { n: 'IV', dates: '20 JUL — 26 JUL', place: 'Leucate · La Franqui', region: 'Aude', spot: 'Les Coussoules', desc: "The Tramontane howls down the Pyrenees. The masters' week.", cap: 8 },
]

// ============================================================
// HERO
// ============================================================
function Hero() {
  const isMobile = useIsMobile()
  return (
    <section
      style={{
        background: T.cream,
        color: T.ink,
        padding: isMobile ? '24px 20px 48px' : '32px 48px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <PatternArcs color={T.bronze} opacity={0.08} size={120} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
          gap: 12,
        }}
      >
        <Lockup size="sm" />
        {!isMobile && (
          <nav
            style={{
              display: 'flex',
              gap: 36,
              fontFamily: T.mono,
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            <a href="#program" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>
              Program
            </a>
            <a href="#rhythm" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>
              Rhythm
            </a>
            <a href="#coaches" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>
              Coaches
            </a>
            <a href="#location" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>
              Lieu
            </a>
            <a href="#rsvp" style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>
              RSVP
            </a>
          </nav>
        )}
        {isMobile && (
          <a
            href="#rsvp"
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: T.ink,
              textDecoration: 'none',
              opacity: 0.85,
            }}
          >
            RSVP
          </a>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.05fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'center',
          marginTop: isMobile ? 36 : 60,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ order: isMobile ? 2 : 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6 }}>
            ARETE · LP RETREAT · MMXXVI
          </div>
          <h1
            style={{
              fontFamily: T.serif,
              fontSize: isMobile ? 44 : 92,
              fontWeight: 400,
              lineHeight: 0.95,
              letterSpacing: '-0.01em',
              margin: isMobile ? '16px 0 18px' : '24px 0 24px',
            }}
          >
            <span style={{ fontStyle: 'italic' }}>Mistral.</span>
            <br />
            Four weeks
            <br />
            on the wind.
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: isMobile ? 20 : 28 }}>
            <div style={{ width: 32, height: 1, background: T.ink, opacity: 0.5 }} />
            <div style={{ fontSize: 11, letterSpacing: '0.42em', fontFamily: T.mono, opacity: 0.7 }}>
              JULY 2026 · CÔTE FRANÇAISE
            </div>
          </div>
          <p
            style={{
              fontSize: isMobile ? 16 : 18,
              lineHeight: 1.65,
              maxWidth: isMobile ? '100%' : 460,
              opacity: 0.85,
              margin: '0 0 28px',
              fontFamily: T.serif,
            }}
          >
            The whole month of July, four spots on the French coast, kitesurf at dawn and reading at dusk. A retreat for the partners of Arete — a practice in mastery, patience, and the long horizon.
          </p>
          <div
            style={{
              display: 'flex',
              gap: isMobile ? 10 : 16,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            <a
              href="#rsvp"
              style={{
                background: T.ink,
                color: T.cream,
                padding: '16px 28px',
                textDecoration: 'none',
                fontFamily: T.mono,
                fontSize: 11,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              Reserve a week →
            </a>
            <a
              href="#program"
              style={{
                border: `1px solid ${T.ink}`,
                color: T.ink,
                padding: '16px 28px',
                textDecoration: 'none',
                fontFamily: T.mono,
                fontSize: 11,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              Read the program
            </a>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            aspectRatio: '3/4',
            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.35), 0 8px 24px -8px rgba(0,0,0,0.2)',
            order: isMobile ? 1 : 0,
            maxWidth: isMobile ? 360 : 'none',
            margin: isMobile ? '0 auto' : 0,
            width: '100%',
          }}
        >
          <PosterVintage />
        </div>
      </div>

      <div
        style={{
          marginTop: isMobile ? 48 : 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid ${T.ink}33`,
          paddingTop: 24,
          position: 'relative',
          zIndex: 1,
          flexWrap: 'wrap',
          gap: isMobile ? 12 : 0,
        }}
      >
        {['Hyères · Var', 'Port-Saint-Louis', 'Le Barcarès', 'Leucate · La Franqui'].map((s, i) => (
          <div
            key={i}
            style={{
              fontFamily: T.mono,
              fontSize: isMobile ? 9 : 10,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              opacity: 0.65,
              flexBasis: isMobile ? '46%' : 'auto',
            }}
          >
            <span style={{ color: T.bronze, marginRight: 10 }}>{`0${i + 1}`}</span>
            {s}
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// PROGRAM
// ============================================================
function Program() {
  const isMobile = useIsMobile()
  return (
    <section
      id="program"
      style={{
        background: T.paper,
        color: T.ink,
        padding: isMobile ? '64px 20px' : '120px 48px',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            marginBottom: isMobile ? 36 : 64,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 20 : 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.5em',
                paddingLeft: '0.5em',
                fontFamily: T.mono,
                opacity: 0.6,
                marginBottom: 16,
              }}
            >
              I · LE PROGRAMME
            </div>
            <h2
              style={{
                fontFamily: T.serif,
                fontSize: isMobile ? 34 : 56,
                fontWeight: 400,
                lineHeight: 1,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              Four weeks. Four coasts.
            </h2>
          </div>
          <div
            style={{
              maxWidth: 360,
              fontSize: isMobile ? 15 : 14,
              lineHeight: 1.7,
              opacity: 0.78,
              fontFamily: T.serif,
            }}
          >
            Each week stands alone. Come for one, come for all four. The kite stays the same; the wind, the light, and the rock change beneath it.
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: 0,
            borderTop: `1px solid ${T.ink}`,
          }}
        >
          {WEEKS.map((w, i) => (
            <div
              key={w.n}
              style={{
                padding: isMobile ? '28px 4px' : '32px 24px',
                borderRight: !isMobile && i < 3 ? `1px solid ${T.ink}33` : 'none',
                borderBottom: `1px solid ${T.ink}${isMobile && i < WEEKS.length - 1 ? '33' : ''}`,
                display: 'flex',
                flexDirection: 'column',
                minHeight: isMobile ? 'auto' : 320,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontFamily: T.serif, fontSize: 48, fontStyle: 'italic', color: T.bronze, lineHeight: 1 }}>{w.n}</div>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', opacity: 0.7 }}>WEEK {w.n}</div>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.32em', marginTop: 24, opacity: 0.7 }}>
                {w.dates}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, marginTop: 12, lineHeight: 1.1 }}>{w.place}</div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: '0.3em',
                  opacity: 0.55,
                  marginTop: 6,
                  textTransform: 'uppercase',
                }}
              >
                {w.region} · {w.spot}
              </div>
              <p style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, opacity: 0.78, marginTop: 16, flex: 1 }}>{w.desc}</p>
              <a
                href={`#rsvp`}
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  textDecoration: 'none',
                  color: T.ink,
                  textTransform: 'uppercase',
                  borderTop: `1px solid ${T.ink}33`,
                  paddingTop: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Reserve</span>
                <span>→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// RHYTHM
// ============================================================
function Rhythm() {
  const isMobile = useIsMobile()
  const items: { time: string; title: string; sub: string; icon: IconKind }[] = [
    { time: '06:00', title: 'Café & le vent', sub: 'Wind check. Coffee. Silence.', icon: 'sun' },
    { time: '07:00', title: 'Session — kite', sub: 'Glass water. Two hours on the line.', icon: 'kite' },
    { time: '11:00', title: 'Leçon de français', sub: 'A working French lesson over olives — conversation, not grammar drills.', icon: 'book' },
    { time: '14:00', title: 'Long lunch', sub: 'Local catch, garden vegetables, cold rosé.', icon: 'bowl' },
    { time: '16:00', title: 'Session — kite', sub: 'Afternoon thermals. Progression.', icon: 'wind' },
    { time: '20:00', title: 'Dinner & a talk', sub: 'A guest, an attendee, or a coach gives a short talk. One bottle. Long table.', icon: 'olive' },
  ]
  return (
    <section
      id="rhythm"
      style={{
        background: T.ink,
        color: T.cream,
        padding: isMobile ? '64px 20px' : '120px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <PatternWaves color={T.cream} opacity={0.05} size={140} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.5em',
            paddingLeft: '0.5em',
            fontFamily: T.mono,
            opacity: 0.55,
            marginBottom: 16,
          }}
        >
          II · LE RYTHME
        </div>
        <h2
          style={{
            fontFamily: T.serif,
            fontSize: isMobile ? 34 : 56,
            fontWeight: 400,
            lineHeight: 1,
            margin: isMobile ? '0 0 36px' : '0 0 64px',
            fontStyle: 'italic',
          }}
        >
          A day, repeated <span style={{ color: T.sun }}>well</span>.
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 32 : 48,
          }}
        >
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Icon kind={it.icon} size={isMobile ? 40 : 48} color={T.sun} opacity={0.9} />
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.3em', opacity: 0.6 }}>{it.time}</div>
              <div
                style={{
                  fontFamily: T.serif,
                  fontSize: isMobile ? 24 : 28,
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                {it.title}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.6, opacity: 0.7 }}>{it.sub}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: isMobile ? 48 : 80,
            paddingTop: 32,
            borderTop: `1px solid ${T.cream}22`,
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: isMobile ? 16 : 18,
            opacity: 0.7,
            maxWidth: 580,
          }}
        >
          &ldquo;We are what we repeatedly do. Excellence, then, is not an act, but a habit.&rdquo;
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: '0.3em',
              marginTop: 12,
              opacity: 0.55,
              fontStyle: 'normal',
            }}
          >
            — ARISTOTLE · NICOMACHEAN ETHICS · II
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// COACHES
// ============================================================
function Coaches() {
  const isMobile = useIsMobile()
  const c: { name: string; role: string; bio: string; cred: string; icon: IconKind }[] = [
    {
      name: 'Théo Lacroix',
      role: 'Resident kite instructor',
      bio: 'Pro kiteboarder, ten seasons on the French coast. Lives with us for the week — first on the water, last off it.',
      cred: 'IKO L3 · 12 yrs',
      icon: 'kite',
    },
    {
      name: 'Camille Beaumont',
      role: 'Professeure de français',
      bio: 'Sorbonne-trained, teaches the daily lesson over olives. Patient, funny, allergic to grammar drills.',
      cred: 'DELF/DALF · 8 yrs',
      icon: 'wave',
    },
    {
      name: 'The table',
      role: 'Reading & dialogue',
      bio: 'No assigned guru. Each week the partners pick the text, share the chair, and trade questions over dinner.',
      cred: 'BY THE GROUP',
      icon: 'book',
    },
  ]
  return (
    <section
      id="coaches"
      style={{
        background: T.cream,
        color: T.ink,
        padding: isMobile ? '64px 20px' : '120px 48px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.5em',
            paddingLeft: '0.5em',
            fontFamily: T.mono,
            opacity: 0.6,
            marginBottom: 16,
          }}
        >
          III · LES MAÎTRES
        </div>
        <h2
          style={{
            fontFamily: T.serif,
            fontSize: isMobile ? 34 : 56,
            fontWeight: 400,
            lineHeight: 1,
            margin: isMobile ? '0 0 36px' : '0 0 64px',
            fontStyle: 'italic',
          }}
        >
          The hands you&rsquo;ll learn from.
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 40 : 32,
          }}
        >
          {c.map((p) => (
            <div key={p.name} style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  aspectRatio: '4/5',
                  background: T.paperDeep,
                  position: 'relative',
                  overflow: 'hidden',
                  borderBottom: `1px solid ${T.ink}`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `radial-gradient(circle at 30% 35%, ${T.sand} 0%, transparent 45%), radial-gradient(circle at 70% 60%, ${T.bronze}66 0%, transparent 50%)`,
                  }}
                />
                <PatternArcs color={T.ink} opacity={0.12} size={60} />
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 14,
                    fontFamily: T.mono,
                    fontSize: 9,
                    letterSpacing: '0.3em',
                    opacity: 0.6,
                  }}
                >
                  {p.cred}
                </div>
                <div style={{ position: 'absolute', bottom: 12, right: 14 }}>
                  <Icon kind={p.icon} size={32} color={T.ink} opacity={0.5} />
                </div>
              </div>
              <div style={{ paddingTop: 20 }}>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 10,
                    letterSpacing: '0.3em',
                    opacity: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  {p.role}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 30, fontStyle: 'italic', marginTop: 6 }}>{p.name}</div>
                <p style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.65, opacity: 0.75, marginTop: 12 }}>{p.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// LOCATION
// ============================================================
function Location() {
  const isMobile = useIsMobile()
  return (
    <section
      id="location"
      style={{
        background: T.paper,
        color: T.ink,
        padding: isMobile ? '64px 20px' : '120px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.5em',
            paddingLeft: '0.5em',
            fontFamily: T.mono,
            opacity: 0.6,
            marginBottom: 16,
          }}
        >
          IV · LE LIEU
        </div>
        <h2
          style={{
            fontFamily: T.serif,
            fontSize: isMobile ? 34 : 56,
            fontWeight: 400,
            lineHeight: 1,
            margin: isMobile ? '0 0 36px' : '0 0 64px',
            fontStyle: 'italic',
          }}
        >
          Four houses by the sea.
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
            gap: isMobile ? 32 : 64,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              aspectRatio: '4/3',
              background: T.cream,
              border: `1px solid ${T.ink}33`,
              padding: 24,
            }}
          >
            <svg viewBox="0 0 600 450" style={{ width: '100%', height: '100%' }}>
              <path
                d="M 60 120 Q 110 140 180 150 L 240 170 Q 290 175 340 200 L 380 220 Q 420 240 460 260 Q 500 270 540 280 L 540 420 L 60 420 Z"
                fill={T.sand}
                opacity="0.5"
              />
              <path
                d="M 60 120 Q 110 140 180 150 L 240 170 Q 290 175 340 200 L 380 220 Q 420 240 460 260 Q 500 270 540 280"
                fill="none"
                stroke={T.ink}
                strokeWidth="1"
              />
              <text
                x="300"
                y="370"
                fill={T.sea}
                fontFamily={T.serif}
                fontStyle="italic"
                fontSize="22"
                textAnchor="middle"
                opacity="0.7"
              >
                Mer Méditerranée
              </text>
              <path
                d="M 60 130 L 80 100 L 95 115 L 110 95 L 130 120 L 145 100 L 165 125"
                fill="none"
                stroke={T.ink}
                strokeWidth="0.75"
                opacity="0.5"
              />
              {[
                { x: 470, y: 258, n: 'I', l: 'Hyères' },
                { x: 380, y: 225, n: 'II', l: 'Port-Saint-Louis' },
                { x: 175, y: 152, n: 'III', l: 'Le Barcarès' },
                { x: 130, y: 144, n: 'IV', l: 'Leucate' },
              ].map((p) => (
                <g key={p.n}>
                  <circle cx={p.x} cy={p.y} r="5" fill={T.coral} stroke={T.ink} strokeWidth="0.75" />
                  <circle cx={p.x} cy={p.y} r="14" fill="none" stroke={T.coral} strokeWidth="0.5" opacity="0.5" />
                  <text x={p.x} y={p.y - 22} fill={T.ink} fontFamily={T.mono} fontSize="10" textAnchor="middle" letterSpacing="2">
                    {p.n}
                  </text>
                  <text x={p.x} y={p.y + 22} fill={T.ink} fontFamily={T.serif} fontStyle="italic" fontSize="13" textAnchor="middle">
                    {p.l}
                  </text>
                </g>
              ))}
              <g transform="translate(540, 60)">
                <circle r="22" fill="none" stroke={T.ink} strokeWidth="0.6" />
                <path d="M 0 -22 L 4 0 L 0 22 L -4 0 Z" fill={T.ink} />
                <text y="-26" fill={T.ink} fontFamily={T.mono} fontSize="8" textAnchor="middle" letterSpacing="1">
                  N
                </text>
              </g>
            </svg>
          </div>

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
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 9,
                      letterSpacing: '0.3em',
                      opacity: 0.6,
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 15, marginTop: 6, lineHeight: 1.5 }}>{b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// FIELD
// ============================================================
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  textarea?: boolean
}) {
  const sharedStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${T.ink}`,
    padding: '10px 0',
    fontFamily: T.serif,
    fontSize: 17,
    color: T.ink,
    outline: 'none',
    resize: 'none',
  }
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 9,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          opacity: 0.65,
        }}
      >
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={sharedStyle}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={sharedStyle}
        />
      )}
    </label>
  )
}

// ============================================================
// RSVP
// ============================================================
function RSVP() {
  const isMobile = useIsMobile()
  const initial: Record<string, number> = { I: 3, II: 5, III: 2, IV: 6 }
  const [taken, setTaken] = useState<Record<string, number>>(initial)
  const [picked, setPicked] = useState<string[]>(['II'])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const toggle = (n: string) => setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTaken((t) => {
      const next = { ...t }
      picked.forEach((n) => {
        const week = WEEKS.find((w) => w.n === n)
        if (week) next[n] = Math.min(week.cap, next[n] + 1)
      })
      return next
    })
    setSubmitted(true)
  }

  return (
    <section
      id="rsvp"
      style={{
        background: T.cream,
        color: T.ink,
        padding: isMobile ? '64px 20px' : '120px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <PatternArcs color={T.bronze} opacity={0.06} size={120} />
      <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.5em',
            paddingLeft: '0.5em',
            fontFamily: T.mono,
            opacity: 0.6,
            marginBottom: 16,
          }}
        >
          V · RÉSERVER
        </div>
        <h2
          style={{
            fontFamily: T.serif,
            fontSize: isMobile ? 34 : 56,
            fontWeight: 400,
            lineHeight: 1,
            margin: '0 0 16px',
            fontStyle: 'italic',
          }}
        >
          Reserve a week.
        </h2>
        <p
          style={{
            fontFamily: T.serif,
            fontSize: 16,
            opacity: 0.75,
            maxWidth: 540,
            margin: isMobile ? '0 0 32px' : '0 0 56px',
          }}
        >
          Eight spots per week. Pick one or several — you may attend more than one. We&rsquo;ll confirm by post within forty-eight hours.
        </p>

        {!submitted ? (
          <form onSubmit={submit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? 12 : 16,
                marginBottom: isMobile ? 28 : 40,
              }}
            >
              {WEEKS.map((w) => {
                const remaining = w.cap - taken[w.n]
                const sel = picked.includes(w.n)
                const full = remaining <= 0
                return (
                  <label
                    key={w.n}
                    style={{
                      cursor: full ? 'not-allowed' : 'pointer',
                      border: `1px solid ${sel ? T.ink : T.ink + '44'}`,
                      background: sel ? T.ink : 'transparent',
                      color: sel ? T.cream : T.ink,
                      padding: '20px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      opacity: full ? 0.4 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => !full && toggle(w.n)}
                      disabled={full}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div
                        style={{
                          fontFamily: T.serif,
                          fontSize: 32,
                          fontStyle: 'italic',
                          lineHeight: 1,
                          color: sel ? T.sun : T.bronze,
                        }}
                      >
                        {w.n}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.7 }}>
                        {full ? 'COMPLET' : `${remaining}/${w.cap}`}
                      </div>
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.25em', opacity: 0.7 }}>{w.dates}</div>
                    <div style={{ fontFamily: T.serif, fontSize: 17, lineHeight: 1.2 }}>{w.place}</div>
                    <div
                      style={{
                        height: 2,
                        background: sel ? T.cream + '33' : T.ink + '22',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${(taken[w.n] / w.cap) * 100}%`,
                          background: sel ? T.sun : T.bronze,
                        }}
                      />
                    </div>
                  </label>
                )
              })}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? 20 : 24,
                marginBottom: isMobile ? 24 : 32,
              }}
            >
              <Field label="Name" value={name} onChange={setName} placeholder="Your full name" />
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@arete.tech" type="email" />
            </div>
            <Field
              label="Anything we should know?"
              value={note}
              onChange={setNote}
              placeholder="Skill level, dietary, partner attending, etc."
              textarea
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                marginTop: 40,
                paddingTop: 24,
                borderTop: `1px solid ${T.ink}33`,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 18 : 0,
              }}
            >
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  opacity: 0.6,
                  textTransform: 'uppercase',
                }}
              >
                {picked.length === 0 ? 'Pick one or more weeks' : `${picked.length} week${picked.length > 1 ? 's' : ''} selected`}
              </div>
              <button
                type="submit"
                disabled={picked.length === 0 || !name || !email}
                style={{
                  background: T.ink,
                  color: T.cream,
                  padding: '18px 36px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: T.mono,
                  fontSize: 11,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  opacity: picked.length === 0 || !name || !email ? 0.4 : 1,
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                Submit RSVP →
              </button>
            </div>
          </form>
        ) : (
          <div style={{ border: `1px solid ${T.ink}`, padding: 48, textAlign: 'center', background: T.paper }}>
            <Seal size={120} color={T.bronze} center="✓" sub="REÇU · MERCI" />
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
  )
}

// ============================================================
// FAQ
// ============================================================
function FAQ() {
  const items: [string, string][] = [
    ['Do I need to know how to kitesurf?', 'No. We host complete beginners through advanced riders, with a 1:3 coach ratio across three skill streams.'],
    ['Can I bring a partner?', 'Yes. Each room is a double; partners are welcome whether they kite or not. Reading and meals are open to all.'],
    ["What's included?", 'Lodging, meals, all kite equipment, coaching, ground transfers, and the reading. Travel to France is on you.'],
    ['Can I attend more than one week?', 'Absolutely — many partners do two. Pick all the weeks you want on the form above.'],
    ["What if the wind doesn't come?", 'It will (this is southern France in July). On the rare flat day: foiling, freediving, or a long lunch and a longer book.'],
    ['Is this an Arete fund event?', 'Yes — the Mistral retreat is hosted by Arete Technologies for our LPs and a few invited friends. It is not a fund expense to LPs.'],
  ]
  const [open, setOpen] = useState<number>(0)
  const isMobile = useIsMobile()
  return (
    <section
      style={{
        background: T.paper,
        color: T.ink,
        padding: isMobile ? '64px 20px' : '120px 48px',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.5em',
            paddingLeft: '0.5em',
            fontFamily: T.mono,
            opacity: 0.6,
            marginBottom: 16,
          }}
        >
          VI · QUESTIONS
        </div>
        <h2
          style={{
            fontFamily: T.serif,
            fontSize: isMobile ? 34 : 56,
            fontWeight: 400,
            lineHeight: 1,
            margin: isMobile ? '0 0 28px' : '0 0 48px',
            fontStyle: 'italic',
          }}
        >
          Foire aux questions.
        </h2>
        <div style={{ borderTop: `1px solid ${T.ink}` }}>
          {items.map(([q, a], i) => (
            <div key={i} style={{ borderBottom: `1px solid ${T.ink}33` }}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  padding: '24px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: T.serif,
                  fontSize: isMobile ? 17 : 21,
                  color: T.ink,
                  gap: 16,
                }}
              >
                <span>{q}</span>
                <span style={{ fontFamily: T.mono, fontSize: 14, opacity: 0.6 }}>{open === i ? '—' : '+'}</span>
              </button>
              {open === i && (
                <div
                  style={{
                    paddingBottom: 24,
                    fontFamily: T.serif,
                    fontSize: 16,
                    lineHeight: 1.7,
                    opacity: 0.78,
                    maxWidth: 720,
                  }}
                >
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  const isMobile = useIsMobile()
  return (
    <footer
      style={{
        background: T.ink,
        color: T.cream,
        padding: isMobile ? '56px 20px 36px' : '80px 48px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <PatternWaves color={T.cream} opacity={0.04} size={200} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div
          style={{
            display: isMobile ? 'flex' : 'grid',
            gridTemplateColumns: '1fr 2fr 1fr',
            flexDirection: isMobile ? 'column' : undefined,
            gap: isMobile ? 32 : 48,
            alignItems: 'center',
            marginBottom: isMobile ? 36 : 64,
          }}
        >
          <Seal size={isMobile ? 100 : 120} color={T.sun} />
          <div
            style={{
              textAlign: 'center',
              fontFamily: T.serif,
              fontSize: isMobile ? 22 : 28,
              fontStyle: 'italic',
              lineHeight: 1.4,
              opacity: 0.85,
            }}
          >
            &ldquo;On the wind,
            <br />
            the long view.&rdquo;
          </div>
          <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end' }}>
            <Lockup light />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: `1px solid ${T.cream}22`,
            paddingTop: isMobile ? 24 : 32,
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.3em',
            opacity: 0.55,
            textTransform: 'uppercase',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 10 : 0,
            textAlign: isMobile ? 'center' : 'left',
          }}
        >
          <span>© MMXXVI · ARETE TECHNOLOGIES</span>
          <span>MISTRAL@ARETE.TECH</span>
          <span>NEW YORK · ATHENS · FRANCE</span>
        </div>
      </div>
    </footer>
  )
}

// ============================================================
// PAGE
// ============================================================
export default function AretePage() {
  return (
    <main
      style={{
        background: T.cream,
        color: T.ink,
        fontFamily: T.sans,
        minHeight: '100vh',
      }}
    >
      <Hero />
      <Program />
      <Rhythm />
      <Coaches />
      <Location />
      <RSVP />
      <FAQ />
      <Footer />
    </main>
  )
}
