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
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', fontFamily: T.serif, color: fg, lineHeight: 1 }}>
      <div style={{ fontSize: 10 * scale, letterSpacing: '0.4em', paddingLeft: '0.4em', fontFamily: T.sans, fontWeight: 500, opacity: 0.85, whiteSpace: 'nowrap' }}>
        ARETE TECHNOLOGIES
      </div>
      <div style={{ fontSize: 8 * scale, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, fontStyle: 'italic', opacity: 0.55, marginTop: 5 * scale }}>
        presents
      </div>
      <div style={{ width: 38 * scale, height: 1, background: fg, opacity: 0.5, margin: `${7 * scale}px 0` }} />
      <div style={{ fontSize: 38 * scale, fontStyle: 'italic', fontWeight: 400, letterSpacing: '0.01em', lineHeight: 1, color: accent, marginTop: 2 * scale }}>
        Mistral
      </div>
      <div style={{ fontSize: 8 * scale, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.7, marginTop: 8 * scale }}>
        KITESURF · MMXXVI
      </div>
    </div>
  )
}

function LockupBar({ light = false }: { light?: boolean }) {
  const fg = light ? T.cream : T.ink
  const accent = light ? T.sun : T.bronze
  return (
    <a href="#top" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: fg }}>
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.05 }}>
        <span style={{ fontSize: 9, letterSpacing: '0.34em', paddingLeft: '0.34em', fontFamily: T.sans, fontWeight: 500, opacity: 0.75, whiteSpace: 'nowrap' }}>
          ARETE TECHNOLOGIES
        </span>
        <span style={{ fontSize: 7, letterSpacing: '0.42em', paddingLeft: '0.42em', fontFamily: T.mono, fontStyle: 'italic', opacity: 0.5, marginTop: 3 }}>
          presents
        </span>
      </span>
      <span style={{ width: 1, height: 26, background: fg, opacity: 0.25 }} />
      <span style={{ fontSize: 26, fontStyle: 'italic', fontWeight: 400, fontFamily: T.serif, color: accent, lineHeight: 1 }}>
        Mistral
      </span>
    </a>
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
// `cap` = spots open to guests (Airbnb total occupancy minus Dave & Lori).
// `airbnb` = USD total for the house; per-person = airbnb / (cap + 2).
// `airbnbUrl` = booking link if you want to look at the actual house.
type Week = {
  n: 'I' | 'II' | 'III' | 'IV'
  dates: string
  place: string
  region: string
  spot: string
  desc: string
  cap: number
  airbnb: number
  airbnbUrl?: string
}

const WEEKS: Week[] = [
  {
    n: 'I',
    dates: '29 JUN — 5 JUL',
    place: 'Hyères',
    region: 'Var',
    spot: "L'Almanarre",
    desc: 'Long flat-water sessions on the salt lagoons. Olive trees and a quiet town.',
    cap: 8,
    airbnb: 6100,
    airbnbUrl:
      'https://www.airbnb.com/rooms/1477723892946943440?productId=1477723892946943440&check_in=2026-06-29&check_out=2026-07-05&adults=10&source_impression_id=p3_1778546159_P37DgFMxs0y55B94',
  },
  {
    n: 'II',
    dates: '6 JUL — 12 JUL',
    place: 'Port-Saint-Louis',
    region: 'Bouches-du-Rhône',
    spot: 'Napoléon',
    desc: 'Mistral country. Open Camargue beaches, wild horses, the cleanest wind in Europe.',
    cap: 8,
    airbnb: 7200,
    airbnbUrl:
      'https://www.airbnb.com/rooms/1643522737742386213?adults=10&check_in=2026-07-05&check_out=2026-07-12&wishlist_item_id=11006301893825',
  },
  {
    n: 'III',
    dates: '13 JUL — 19 JUL',
    place: 'Narbonne · Hospitalet',
    region: 'Aude',
    spot: "L'Hospitalet · La Vieille Nouvelle",
    desc: 'Wild beach between sea and lagoon, Roman city above. Long shallow setups in steady wind.',
    cap: 9,
    airbnb: 9600,
    airbnbUrl:
      'https://www.airbnb.com/rooms/948265181526557439?productId=948265181526557439&check_in=2026-07-19&check_out=2026-07-26&adults=10',
  },
  {
    n: 'IV',
    dates: '20 JUL — 26 JUL',
    place: 'Leucate · Le Barcarès',
    region: 'Aude · Pyrénées-Orientales',
    spot: 'Les Coussoules · La Coudalère',
    desc: "The Tramontane howls down the Pyrenees. Two iconic spots, one masters' week.",
    cap: 8,
    airbnb: 4300,
    airbnbUrl:
      'https://www.airbnb.com/rooms/1063599375799313767?adults=10&check_in=2026-06-13&check_out=2026-06-19&wishlist_item_id=11006301815882',
  },
]

const perPerson = (w: Week) => Math.round(w.airbnb / (w.cap + 2))

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
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.05fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'center',
          marginTop: isMobile ? 8 : 24,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ order: isMobile ? 2 : 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6 }}>
            ARETE · FRIENDS &amp; FAMILY LAUNCH RETREAT · MMXXVI
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
            overflow: 'hidden',
          }}
        >
          <img
            src="/arete/mistral-poster.png"
            alt="Arete Technologies presents Mistral — July 2026"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
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
        {['Hyères · Var', 'Port-Saint-Louis', 'Narbonne · Hospitalet', 'Leucate · Le Barcarès'].map((s, i) => (
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
// PRACTICE ASSETS — branded illustrations for the three pillars
// ============================================================
function PracticeFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        aspectRatio: '4/5',
        background: '#e8dfc8',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: `1px solid ${T.ink}`,
      }}
    >
      {children}
    </div>
  )
}

function AssetKite() {
  return (
    <PracticeFrame>
      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="sky-k" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8dfc8" />
            <stop offset="60%" stopColor="#d6c89e" />
            <stop offset="100%" stopColor="#c89f5a" />
          </linearGradient>
        </defs>
        <rect width="400" height="360" fill="url(#sky-k)" />
        <rect y="360" width="400" height="140" fill={T.sea} />
        <circle cx="320" cy="90" r="22" fill={T.sun} opacity="0.85" />
        <path
          d="M 70 130 Q 130 70 200 90 Q 230 100 215 140 Q 145 110 80 160 Q 60 152 70 130 Z"
          fill={T.coral}
          stroke={T.ink}
          strokeWidth="1.2"
        />
        <g stroke={T.ink} strokeWidth="0.55" opacity="0.65" fill="none">
          <line x1="95" y1="140" x2="218" y2="368" />
          <line x1="140" y1="125" x2="218" y2="368" />
          <line x1="190" y1="115" x2="218" y2="368" />
        </g>
        <g fill={T.ink}>
          <circle cx="218" cy="360" r="5" />
          <path d="M 215 365 L 221 365 L 222 380 L 218 390 L 214 380 Z" />
          <path d="M 196 390 L 240 390" stroke={T.ink} strokeWidth="2.6" />
          <ellipse cx="218" cy="396" rx="22" ry="2" opacity="0.35" />
        </g>
        <g stroke={T.cream} strokeWidth="0.55" fill="none" opacity="0.45">
          <path d="M 0 416 Q 100 410 200 416 T 400 416" />
          <path d="M 0 436 Q 100 430 200 436 T 400 436" opacity="0.7" />
          <path d="M 0 456 Q 100 450 200 456 T 400 456" opacity="0.5" />
          <path d="M 0 476 Q 100 470 200 476 T 400 476" opacity="0.4" />
        </g>
        <text x="20" y="490" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="3" opacity="0.85">
          LE VENT
        </text>
        <text x="380" y="490" textAnchor="end" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="2" opacity="0.6">
          OPTIONAL
        </text>
      </svg>
    </PracticeFrame>
  )
}

function AssetFrench() {
  return (
    <PracticeFrame>
      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="back-f" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0e6cc" />
            <stop offset="100%" stopColor="#d6b88a" />
          </linearGradient>
        </defs>
        <rect width="400" height="500" fill="url(#back-f)" />
        <text
          x="200"
          y="135"
          fontFamily={T.serif}
          fontSize="56"
          fontStyle="italic"
          fill={T.coral}
          opacity="0.32"
          textAnchor="middle"
        >
          français
        </text>
        <rect x="30" y="290" width="340" height="180" fill={T.bronze} opacity="0.42" />
        <line x1="30" y1="290" x2="370" y2="290" stroke={T.ink} strokeWidth="0.6" opacity="0.5" />
        <g>
          <path
            d="M 100 290 L 260 290 L 260 248 L 180 240 L 100 248 Z"
            fill={T.cream}
            stroke={T.ink}
            strokeWidth="0.8"
          />
          <line x1="180" y1="240" x2="180" y2="290" stroke={T.ink} strokeWidth="0.6" opacity="0.7" />
          <g stroke={T.ink} strokeWidth="0.4" opacity="0.5">
            <line x1="115" y1="258" x2="170" y2="258" />
            <line x1="115" y1="265" x2="170" y2="265" />
            <line x1="115" y1="272" x2="165" y2="272" />
            <line x1="115" y1="279" x2="170" y2="279" />
            <line x1="190" y1="258" x2="245" y2="258" />
            <line x1="190" y1="265" x2="245" y2="265" />
            <line x1="190" y1="272" x2="240" y2="272" />
            <line x1="190" y1="279" x2="245" y2="279" />
          </g>
        </g>
        <g>
          <ellipse cx="305" cy="282" rx="22" ry="4" fill={T.ink} />
          <path d="M 283 282 L 287 300 Q 295 308 305 308 Q 315 308 323 300 L 327 282 Z" fill={T.ink} opacity="0.85" />
          <path d="M 326 287 Q 338 287 338 295 Q 338 303 326 303" fill="none" stroke={T.ink} strokeWidth="1.1" />
          <ellipse cx="305" cy="282" rx="18" ry="3" fill="#2a1810" />
        </g>
        <g>
          <path d="M 50 252 Q 92 220 130 196" stroke={T.ink} strokeWidth="0.9" fill="none" />
          <g fill={T.bronze} opacity="0.85">
            <ellipse cx="68" cy="240" rx="7" ry="3" transform="rotate(-30 68 240)" />
            <ellipse cx="82" cy="228" rx="7" ry="3" transform="rotate(-30 82 228)" />
            <ellipse cx="96" cy="216" rx="7" ry="3" transform="rotate(-30 96 216)" />
            <ellipse cx="110" cy="206" rx="7" ry="3" transform="rotate(-30 110 206)" />
            <ellipse cx="124" cy="198" rx="7" ry="3" transform="rotate(-30 124 198)" />
          </g>
          <g fill={T.bronze} opacity="0.55">
            <ellipse cx="74" cy="252" rx="6" ry="2.5" transform="rotate(60 74 252)" />
            <ellipse cx="90" cy="240" rx="6" ry="2.5" transform="rotate(60 90 240)" />
            <ellipse cx="106" cy="226" rx="6" ry="2.5" transform="rotate(60 106 226)" />
          </g>
        </g>
        <text x="20" y="490" fontFamily={T.mono} fontSize="9" fill={T.ink} letterSpacing="3" opacity="0.65">
          LA LANGUE
        </text>
        <text x="380" y="490" textAnchor="end" fontFamily={T.mono} fontSize="9" fill={T.ink} letterSpacing="2" opacity="0.55">
          DAILY · INCLUDED
        </text>
      </svg>
    </PracticeFrame>
  )
}

function AssetConversations() {
  return (
    <PracticeFrame>
      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="dusk-c" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2f28" />
            <stop offset="55%" stopColor="#2a2522" />
            <stop offset="100%" stopColor="#1a1410" />
          </linearGradient>
        </defs>
        <rect width="400" height="500" fill="url(#dusk-c)" />
        <rect x="110" y="60" width="180" height="400" fill={T.cream} opacity="0.92" stroke={T.ink} strokeWidth="0.6" />
        <g opacity="0.5" fill={T.cream}>
          <rect x="76" y="105" width="22" height="44" />
          <rect x="76" y="185" width="22" height="44" />
          <rect x="76" y="265" width="22" height="44" />
          <rect x="76" y="345" width="22" height="44" />
          <rect x="302" y="105" width="22" height="44" />
          <rect x="302" y="185" width="22" height="44" />
          <rect x="302" y="265" width="22" height="44" />
          <rect x="302" y="345" width="22" height="44" />
        </g>
        <g>
          {[110, 200, 290, 380].map((y) => (
            <g key={y}>
              <rect x="197" y={y - 36} width="6" height="36" fill={T.cream} />
              <ellipse cx="200" cy={y} rx="5" ry="2" fill={T.bronze} opacity="0.7" />
              <path
                d={`M 198 ${y - 48} Q 195 ${y - 42} 200 ${y - 36} Q 205 ${y - 42} 202 ${y - 48} Z`}
                fill={T.sun}
              />
              <circle cx="200" cy={y - 44} r="14" fill={T.sun} opacity="0.18" />
            </g>
          ))}
        </g>
        <g stroke={T.ink} strokeWidth="0.6" fill="none" opacity="0.5">
          <circle cx="148" cy="135" r="14" />
          <circle cx="252" cy="135" r="14" />
          <circle cx="148" cy="225" r="14" />
          <circle cx="252" cy="225" r="14" />
          <circle cx="148" cy="315" r="14" />
          <circle cx="252" cy="315" r="14" />
          <circle cx="148" cy="405" r="14" />
          <circle cx="252" cy="405" r="14" />
        </g>
        <g fill={T.coral} opacity="0.6">
          <path d="M 134 152 Q 134 162 142 164 L 142 168 L 140 168 L 140 172 L 156 172 L 156 168 L 154 168 L 154 164 Q 162 162 162 152 Z" />
          <path d="M 134 332 Q 134 342 142 344 L 142 348 L 140 348 L 140 352 L 156 352 L 156 348 L 154 348 L 154 344 Q 162 342 162 332 Z" />
          <path d="M 238 242 Q 238 252 246 254 L 246 258 L 244 258 L 244 262 L 260 262 L 260 258 L 258 258 L 258 254 Q 266 252 266 242 Z" />
          <path d="M 238 422 Q 238 432 246 434 L 246 438 L 244 438 L 244 442 L 260 442 L 260 438 L 258 438 L 258 434 Q 266 432 266 422 Z" />
        </g>
        <text x="20" y="490" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="3" opacity="0.85">
          LA TABLE
        </text>
        <text x="380" y="490" textAnchor="end" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="2" opacity="0.6">
          BY THE GROUP
        </text>
      </svg>
    </PracticeFrame>
  )
}

// ============================================================
// PRACTICES
// ============================================================
function Coaches() {
  const isMobile = useIsMobile()
  const practices: { title: string; role: string; body: string; Art: () => JSX.Element }[] = [
    {
      title: 'Kiting',
      role: 'Optional · own expense',
      body: 'Schools and rentals at every spot we visit. Beginners book a local school direct; advanced riders bring their own kit. We keep the choice yours — the retreat itself is the meals, the reading, and the company.',
      Art: AssetKite,
    },
    {
      title: 'French',
      role: 'Daily lesson over olives',
      body: 'A live-in tutor for the month. Patient, funny, allergic to grammar drills. The lesson happens at the table — wine, olive oil, and a small printed text per week.',
      Art: AssetFrench,
    },
    {
      title: 'Dinner conversations',
      role: 'Led by the group',
      body: 'No assigned guru. Each week the partners pick the text, share the chair, and trade questions over a long candlelit table. The reading is whatever the group decides; the practice is showing up to it.',
      Art: AssetConversations,
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
          III · LES PRATIQUES
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
          Three practices, one month.
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 40 : 32,
          }}
        >
          {practices.map((p) => {
            const Art = p.Art
            return (
              <div key={p.title} style={{ display: 'flex', flexDirection: 'column' }}>
                <Art />
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
                  <div style={{ fontFamily: T.serif, fontSize: 30, fontStyle: 'italic', marginTop: 6 }}>{p.title}</div>
                  <p style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.65, opacity: 0.75, marginTop: 12 }}>{p.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// LOCATION ARTIFACTS — branded illustrations per town
// ============================================================
function ArtifactFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '4/3',
        background: '#e8dfc8',
        border: `1px solid ${T.ink}33`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

function ArtifactHyeres() {
  return (
    <ArtifactFrame>
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky-h" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8dfc8" />
            <stop offset="55%" stopColor="#d6c89e" />
            <stop offset="100%" stopColor="#c89f5a" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill="url(#sky-h)" />
        <rect y="220" width="400" height="80" fill={T.sea} />
        <circle cx="305" cy="92" r="28" fill={T.sun} opacity="0.92" />
        <path d="M 0 196 Q 70 150 140 170 Q 210 188 280 158 Q 340 136 400 152 L 400 224 L 0 224 Z" fill={T.bronze} opacity="0.55" />
        <g stroke={T.ink} strokeWidth="0.6" fill="none" opacity="0.7">
          <path d="M 150 156 L 152 178" />
          <rect x="148" y="156" width="6" height="8" fill={T.ink} opacity="0.85" />
          <path d="M 156 152 L 158 178" />
          <rect x="155" y="148" width="6" height="10" fill={T.ink} opacity="0.85" />
          <path d="M 162 158 L 164 178" />
          <rect x="160" y="156" width="6" height="6" fill={T.ink} opacity="0.85" />
          <path d="M 170 154 L 172 178" />
          <rect x="167" y="150" width="8" height="8" fill={T.ink} opacity="0.85" />
          <path d="M 178 158 L 180 178" />
          <rect x="176" y="156" width="6" height="8" fill={T.ink} opacity="0.85" />
        </g>
        <g stroke={T.ink} strokeWidth="1" fill="none">
          <line x1="60" y1="220" x2="60" y2="170" />
          <path d="M 60 170 Q 50 162 42 168" />
          <path d="M 60 170 Q 70 162 78 168" />
          <path d="M 60 170 Q 48 158 38 156" />
          <path d="M 60 170 Q 72 158 82 156" />
          <path d="M 60 170 Q 56 154 50 148" />
          <path d="M 60 170 Q 64 154 70 148" />
        </g>
        <g stroke={T.ink} strokeWidth="0.8" fill="none">
          <line x1="350" y1="220" x2="350" y2="180" />
          <path d="M 350 180 Q 340 174 333 178" />
          <path d="M 350 180 Q 360 174 367 178" />
          <path d="M 350 180 Q 344 168 338 164" />
          <path d="M 350 180 Q 356 168 362 164" />
        </g>
        <g fill={T.cream} opacity="0.4">
          <path d="M 0 240 Q 80 232 160 240 T 320 240 T 480 240" stroke={T.cream} strokeWidth="0.8" fill="none" />
          <path d="M 0 256 Q 80 248 160 256 T 320 256 T 480 256" stroke={T.cream} strokeWidth="0.7" fill="none" opacity="0.7" />
          <path d="M 0 272 Q 80 264 160 272 T 320 272 T 480 272" stroke={T.cream} strokeWidth="0.6" fill="none" opacity="0.5" />
        </g>
        <text x="20" y="280" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="3" opacity="0.75">
          I · HYÈRES · VAR
        </text>
        <text x="380" y="280" textAnchor="end" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="2" opacity="0.6">
          43°07′ N
        </text>
      </svg>
    </ArtifactFrame>
  )
}

function ArtifactPortStLouis() {
  return (
    <ArtifactFrame>
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky-p" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0e2c9" />
            <stop offset="60%" stopColor="#e3b993" />
            <stop offset="100%" stopColor="#c0533a" />
          </linearGradient>
          <linearGradient id="lagoon-p" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c0533a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7a3a3a" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect width="400" height="180" fill="url(#sky-p)" />
        <circle cx="290" cy="110" r="22" fill={T.sun} opacity="0.85" />
        <rect y="180" width="400" height="120" fill="url(#lagoon-p)" />
        <line x1="0" y1="180" x2="400" y2="180" stroke={T.ink} strokeWidth="0.6" opacity="0.4" />
        <g fill={T.ink}>
          <path d="M 80 200 L 76 188 L 78 184 L 84 184 L 88 192 L 96 192 L 102 184 L 110 184 L 114 192 L 120 200 L 122 220 L 116 226 L 110 220 L 108 210 L 100 210 L 96 220 L 92 226 L 84 226 L 80 220 Z" />
          <ellipse cx="100" cy="232" rx="22" ry="3" opacity="0.4" />
          <path d="M 220 210 L 216 198 L 218 194 L 224 194 L 228 202 L 236 202 L 242 194 L 250 194 L 254 202 L 260 210 L 262 230 L 256 236 L 250 230 L 248 220 L 240 220 L 236 230 L 232 236 L 224 236 L 220 230 Z" opacity="0.85" />
          <ellipse cx="240" cy="242" rx="22" ry="3" opacity="0.35" />
        </g>
        <g stroke={T.coral} strokeWidth="1.2" fill="none">
          <path d="M 40 158 Q 44 152 50 156 L 52 168 M 50 156 L 56 156" />
          <path d="M 60 162 Q 64 156 70 160 L 72 172 M 70 160 L 76 160" />
          <path d="M 28 168 Q 32 162 38 166 L 40 178 M 38 166 L 44 166" />
        </g>
        <g stroke={T.cream} strokeWidth="0.5" fill="none" opacity="0.45">
          <path d="M 0 252 Q 100 246 200 252 T 400 252" />
          <path d="M 0 268 Q 100 262 200 268 T 400 268" opacity="0.7" />
          <path d="M 0 284 Q 100 278 200 284 T 400 284" opacity="0.5" />
        </g>
        <text x="20" y="280" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="3" opacity="0.85">
          II · PORT-SAINT-LOUIS
        </text>
        <text x="380" y="280" textAnchor="end" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="2" opacity="0.7">
          43°23′ N
        </text>
      </svg>
    </ArtifactFrame>
  )
}

function ArtifactNarbonne() {
  return (
    <ArtifactFrame>
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky-n" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0e6cc" />
            <stop offset="100%" stopColor="#d6b88a" />
          </linearGradient>
          <linearGradient id="lagoon-n" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b88a5a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7a5a2e" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect width="400" height="170" fill="url(#sky-n)" />
        <circle cx="76" cy="78" r="20" fill={T.sun} opacity="0.9" />
        <g transform="translate(244, 92)" stroke={T.ink} fill={T.ink} opacity="0.7">
          <rect x="0" y="36" width="92" height="42" fill={T.ink} opacity="0.7" />
          <path d="M 8 36 L 8 14 L 22 14 L 22 36 Z" fill={T.ink} />
          <path d="M 70 36 L 70 14 L 84 14 L 84 36 Z" fill={T.ink} />
          <path d="M 8 14 L 15 0 L 22 14 Z" fill={T.ink} />
          <path d="M 70 14 L 77 0 L 84 14 Z" fill={T.ink} />
          <rect x="36" y="20" width="20" height="58" fill={T.ink} />
          <path d="M 36 20 L 46 6 L 56 20 Z" fill={T.ink} />
          <line x1="46" y1="-2" x2="46" y2="6" strokeWidth="0.8" />
        </g>
        <path d="M 0 160 Q 80 150 160 160 Q 240 168 320 160 Q 360 156 400 160 L 400 200 L 0 200 Z" fill={T.bronze} opacity="0.45" />
        <g stroke={T.ink} strokeWidth="0.8" fill="none" opacity="0.65">
          <path d="M 30 150 L 40 158 M 50 148 L 60 156 M 70 150 L 80 158 M 90 146 L 100 154 M 110 150 L 120 158 M 130 148 L 140 156" />
          <path d="M 30 142 L 40 150 M 50 140 L 60 148 M 70 142 L 80 150 M 90 138 L 100 146 M 110 142 L 120 150 M 130 140 L 140 148" opacity="0.7" />
        </g>
        <rect y="200" width="400" height="100" fill="url(#lagoon-n)" />
        <line x1="0" y1="200" x2="400" y2="200" stroke={T.ink} strokeWidth="0.6" opacity="0.4" />
        <g fill="none" stroke={T.ink} strokeWidth="1">
          <path d="M 230 180 Q 254 168 278 180 Q 280 186 274 188 Q 254 174 232 188 Q 226 186 230 180 Z" fill={T.coral} />
          <line x1="254" y1="184" x2="248" y2="252" opacity="0.6" />
          <circle cx="250" cy="256" r="3.5" fill={T.ink} />
          <path d="M 234 256 L 266 256" strokeWidth="1.4" />
        </g>
        <g stroke={T.coral} strokeWidth="1.1" fill="none">
          <path d="M 30 218 Q 36 208 44 214 L 46 230 M 44 214 L 52 214" />
          <path d="M 60 224 Q 66 214 74 220 L 76 236 M 74 220 L 82 220" />
        </g>
        <g stroke={T.cream} strokeWidth="0.5" fill="none" opacity="0.45">
          <path d="M 0 246 Q 100 240 200 246 T 400 246" />
          <path d="M 0 264 Q 100 258 200 264 T 400 264" opacity="0.7" />
          <path d="M 0 282 Q 100 276 200 282 T 400 282" opacity="0.5" />
        </g>
        <text x="20" y="290" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="3" opacity="0.85">
          III · NARBONNE · HOSPITALET
        </text>
        <text x="380" y="290" textAnchor="end" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="2" opacity="0.7">
          43°10′ N
        </text>
      </svg>
    </ArtifactFrame>
  )
}

function ArtifactLeucate() {
  return (
    <ArtifactFrame>
      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e9e0c8" />
            <stop offset="100%" stopColor="#c8b890" />
          </linearGradient>
          <linearGradient id="sea-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4a6b" />
            <stop offset="100%" stopColor="#0f2c44" />
          </linearGradient>
        </defs>
        <rect width="400" height="170" fill="url(#sky-l)" />
        <rect y="170" width="400" height="130" fill="url(#sea-l)" />
        <circle cx="200" cy="60" r="18" fill={T.sun} opacity="0.85" />
        <path d="M 0 170 L 0 100 Q 50 84 100 108 L 130 132 Q 160 146 184 150 L 184 170 Z" fill="#f4efe6" stroke={T.ink} strokeWidth="0.6" />
        <path d="M 0 100 Q 50 84 100 108 L 130 132 Q 160 146 184 150" fill="none" stroke={T.ink} strokeWidth="0.6" opacity="0.5" />
        <g transform="translate(48, 78)">
          <rect x="0" y="0" width="9" height="22" fill={T.cream} stroke={T.ink} strokeWidth="0.7" />
          <rect x="-2" y="-4" width="13" height="6" fill={T.coral} />
          <line x1="4.5" y1="-4" x2="4.5" y2="-12" stroke={T.ink} strokeWidth="0.6" />
        </g>
        <g transform="translate(244, 198)">
          <ellipse cx="60" cy="20" rx="76" ry="6" fill={T.bronze} opacity="0.55" />
          <path d="M 0 18 L 18 8 L 110 8 L 124 18 Z" fill={T.cream} stroke={T.ink} strokeWidth="0.7" />
          <rect x="22" y="-2" width="80" height="10" fill={T.cream} stroke={T.ink} strokeWidth="0.6" />
          <rect x="32" y="-10" width="44" height="8" fill={T.cream} stroke={T.ink} strokeWidth="0.6" />
          <line x1="42" y1="-10" x2="42" y2="-26" stroke={T.ink} strokeWidth="0.6" />
          <line x1="66" y1="-10" x2="66" y2="-26" stroke={T.ink} strokeWidth="0.6" />
          <g fill={T.ink}>
            <circle cx="30" cy="3" r="0.9" />
            <circle cx="40" cy="3" r="0.9" />
            <circle cx="50" cy="3" r="0.9" />
            <circle cx="60" cy="3" r="0.9" />
            <circle cx="70" cy="3" r="0.9" />
            <circle cx="80" cy="3" r="0.9" />
            <circle cx="90" cy="3" r="0.9" />
          </g>
          <rect x="86" y="-6" width="10" height="4" fill={T.coral} stroke={T.ink} strokeWidth="0.4" />
        </g>
        <g fill="none" stroke={T.ink} strokeWidth="1">
          <path d="M 240 70 Q 270 56 300 72 Q 302 80 296 82 Q 270 64 244 82 Q 238 80 240 70 Z" fill={T.coral} />
          <line x1="270" y1="74" x2="262" y2="186" opacity="0.6" />
          <circle cx="264" cy="190" r="3.5" fill={T.ink} />
          <path d="M 248 192 L 280 192" strokeWidth="1.4" />
        </g>
        <g stroke={T.cream} strokeWidth="0.5" fill="none" opacity="0.38">
          <path d="M 0 224 Q 80 216 160 224 T 320 224 T 480 224" />
          <path d="M 0 244 Q 80 236 160 244 T 320 244 T 480 244" opacity="0.7" />
          <path d="M 0 264 Q 80 256 160 264 T 320 264 T 480 264" opacity="0.55" />
          <path d="M 0 284 Q 80 276 160 284 T 320 284 T 480 284" opacity="0.4" />
        </g>
        <text x="20" y="290" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="3" opacity="0.85">
          IV · LEUCATE · LE BARCARÈS
        </text>
        <text x="380" y="290" textAnchor="end" fontFamily={T.mono} fontSize="9" fill={T.cream} letterSpacing="2" opacity="0.7">
          42°54′ N
        </text>
      </svg>
    </ArtifactFrame>
  )
}

const TOWN_DETAIL: Record<'I' | 'II' | 'III' | 'IV', { artifact: () => React.JSX.Element; sights: { name: string; note: string }[] }> = {
  I: {
    artifact: ArtifactHyeres,
    sights: [
      { name: 'Îles d’Or — Porquerolles', note: 'Ferry to a car-free island of vineyards, eucalyptus and turquoise coves.' },
      { name: 'Villa Noailles', note: 'Mallet-Stevens modernist masterpiece in concrete and light, 1923.' },
      { name: 'Vieille Ville & Parc Saint-Bernard', note: 'Medieval lanes climbing to jasmine gardens above the bay.' },
      { name: 'Salins des Pesquiers', note: 'Pink salt flats and flamingos on the Giens isthmus at dusk.' },
    ],
  },
  II: {
    artifact: ArtifactPortStLouis,
    sights: [
      { name: 'Parc naturel de Camargue', note: 'White horses, black bulls and flamingos across the salt delta.' },
      { name: 'Saintes-Maries-de-la-Mer', note: 'Fortified Romanesque church and the gypsy pilgrimage village.' },
      { name: 'Tour Saint-Louis', note: '18th-century watchtower at the mouth of the Rhône — climb at sunset.' },
      { name: 'Arles (1 hr)', note: "Van Gogh's town, Roman amphitheatre, the Luma tower by Frank Gehry." },
    ],
  },
  III: {
    artifact: ArtifactNarbonne,
    sights: [
      { name: 'Cathédrale Saint-Just', note: 'An unfinished Gothic giant — vaults higher than Notre-Dame, abruptly cut short.' },
      { name: 'Les Halles de Narbonne', note: 'The 1901 covered market — oysters from Gruissan, charcuterie, lunch at Chez Bebelle.' },
      { name: 'Via Domitia & Horreum', note: 'The Roman road exposed in the central square; underground granary tunnels below.' },
      { name: 'Abbaye de Fontfroide (20 min)', note: 'A Cistercian abbey of ochre stone and cypress — concerts in the cloister.' },
    ],
  },
  IV: {
    artifact: ArtifactLeucate,
    sights: [
      { name: 'Falaise de Leucate', note: 'White limestone cliffs over open sea — coastal path, WWII bunkers, Phare.' },
      { name: 'Le Lydia (Le Barcarès)', note: 'A 1930s ocean liner permanently beached in the dunes — now a monument.' },
      { name: 'Forteresse de Salses (15 min)', note: 'Catalan-Castilian frontier fortress, low and pink against the maquis.' },
      { name: 'Châteaux cathares', note: 'Quéribus and Peyrepertuse — fortresses balanced on Pyrenean ridges.' },
      { name: 'Collioure (45 min)', note: 'The painted port of Matisse and Derain — anchovies, light, fauvism.' },
    ],
  },
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
                { x: 175, y: 152, n: 'III', l: 'Narbonne · Hospitalet' },
                { x: 130, y: 144, n: 'IV', l: 'Leucate · Barcarès' },
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
              Each week we take over an Airbnb within walking distance of the launch beach. Eight to ten beds, a long table, lunch and dinner from a private chef, a small library curated for the week.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginTop: 32 }}>
              {[
                ['Lodging', 'Airbnb · sleeps 10-11 · garden · long table'],
                ['Meals', 'Lunch &amp; dinner catered · private chef'],
                ['Kiting', 'Optional · arranged at the spot · own expense'],
                ['Transit', 'Group lifts between weeks · van or TGV'],
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
                  <div
                    style={{ fontFamily: T.serif, fontSize: 15, marginTop: 6, lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: b }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: isMobile ? 56 : 88 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.6 }}>
              AIRBNB · LE LOGEMENT
            </div>
            <div style={{ height: 1, flex: 1, background: T.ink, opacity: 0.18, minWidth: 80 }} />
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: isMobile ? 16 : 18, opacity: 0.7 }}>
              The houses, by week.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {WEEKS.map((w, i) => (
              <a
                key={w.n}
                href={w.airbnbUrl || undefined}
                target={w.airbnbUrl ? '_blank' : undefined}
                rel={w.airbnbUrl ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '28px 1fr auto auto' : '60px 1.4fr auto auto',
                  gap: isMobile ? 10 : 20,
                  alignItems: 'center',
                  padding: isMobile ? '14px 0' : '20px 0',
                  borderTop: i === 0 ? `1px solid ${T.ink}33` : 'none',
                  borderBottom: `1px solid ${T.ink}33`,
                  color: T.ink,
                  textDecoration: 'none',
                  cursor: w.airbnbUrl ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    fontFamily: T.serif,
                    fontStyle: 'italic',
                    fontSize: isMobile ? 20 : 28,
                    color: T.bronze,
                    lineHeight: 1,
                  }}
                >
                  {w.n}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: T.serif,
                      fontSize: isMobile ? 15 : 19,
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {w.place}
                  </div>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: isMobile ? 8 : 9,
                      letterSpacing: isMobile ? '0.18em' : '0.22em',
                      opacity: 0.6,
                      marginTop: 4,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {w.dates} · sleeps {w.cap + 2}
                  </div>
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: isMobile ? 12 : 13,
                      color: T.coral,
                      fontWeight: 500,
                    }}
                  >
                    ${perPerson(w).toLocaleString('en-US')}
                    <span style={{ opacity: 0.6, fontSize: isMobile ? 8 : 9, letterSpacing: '0.18em', marginLeft: 4 }}>/PP</span>
                  </div>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: isMobile ? 8 : 9,
                      letterSpacing: '0.18em',
                      opacity: 0.5,
                      marginTop: 2,
                    }}
                  >
                    ${(w.airbnb / 1000).toFixed(1)}K TOTAL
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: isMobile ? 9 : 10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: w.airbnbUrl ? T.coral : T.ink + '66',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {w.airbnbUrl ? (isMobile ? '→' : 'View →') : 'TBC'}
                </div>
              </a>
            ))}
          </div>

          <div
            style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: '0.22em',
              opacity: 0.5,
              marginTop: 16,
              textTransform: 'uppercase',
            }}
          >
            Per-person price covers the house only · food &amp; transport estimates to follow
          </div>
        </div>

        <div style={{ marginTop: isMobile ? 56 : 96 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.5em', paddingLeft: '0.5em', opacity: 0.6 }}>
              IV · THE VILLAGES
            </div>
            <div style={{ height: 1, flex: 1, background: T.ink, opacity: 0.18, minWidth: 80 }} />
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: isMobile ? 18 : 22, opacity: 0.8 }}>
              Worth the detour.
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? 14 : 20,
            }}
          >
            {WEEKS.map((w) => {
              const detail = TOWN_DETAIL[w.n]
              const Artifact = detail.artifact
              return (
                <article
                  key={w.n}
                  style={{
                    background: T.cream,
                    border: `1px solid ${T.ink}22`,
                    padding: isMobile ? 12 : 16,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Artifact />
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        fontFamily: T.mono,
                        fontSize: 9,
                        letterSpacing: '0.4em',
                        paddingLeft: '0.4em',
                        opacity: 0.6,
                      }}
                    >
                      {w.n} · {w.dates}
                    </div>
                    <h3
                      style={{
                        fontFamily: T.serif,
                        fontSize: isMobile ? 20 : 22,
                        fontStyle: 'italic',
                        fontWeight: 400,
                        margin: '6px 0 4px',
                        lineHeight: 1.1,
                      }}
                    >
                      {w.place}
                    </h3>
                    <div
                      style={{
                        fontFamily: T.mono,
                        fontSize: 8,
                        letterSpacing: '0.28em',
                        textTransform: 'uppercase',
                        opacity: 0.55,
                      }}
                    >
                      {w.region} · <span style={{ color: T.coral, opacity: 0.95 }}>{w.spot}</span>
                    </div>
                  </div>

                  <p style={{ fontFamily: T.serif, fontSize: 13, lineHeight: 1.55, opacity: 0.82, marginTop: 12 }}>
                    {w.desc}
                  </p>

                  <details className="loc-details">
                    <summary>
                      <span>NEARBY · DON&rsquo;T MISS</span>
                      <span className="loc-details-icon" aria-hidden="true">＋</span>
                    </summary>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {detail.sights.map((s, i) => (
                        <li key={s.name} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8, alignItems: 'baseline' }}>
                          <span
                            style={{
                              fontFamily: T.mono,
                              fontSize: 8,
                              letterSpacing: '0.2em',
                              color: T.bronze,
                              opacity: 0.85,
                            }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>
                            <span style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', display: 'block' }}>{s.name}</span>
                            <span style={{ fontFamily: T.serif, fontSize: 12, opacity: 0.72, lineHeight: 1.45 }}>{s.note}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </article>
              )
            })}
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

function Segment({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const sel = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                padding: '10px 14px',
                background: sel ? T.ink : 'transparent',
                color: sel ? T.cream : T.ink,
                border: `1px solid ${sel ? T.ink : T.ink + '44'}`,
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// RSVP
// ============================================================
type KiteLevel = 'none' | 'beginner' | 'intermediate' | 'advanced'
type KiteGear = 'na' | 'own' | 'rental'

function RSVP() {
  const isMobile = useIsMobile()
  const initial: Record<string, number> = { I: 0, II: 0, III: 0, IV: 0 }
  const [taken, setTaken] = useState<Record<string, number>>(initial)
  const [picked, setPicked] = useState<string[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [kiteLevel, setKiteLevel] = useState<KiteLevel>('none')
  const [kiteGear, setKiteGear] = useState<KiteGear>('na')
  const [bringPartner, setBringPartner] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const [dietary, setDietary] = useState('')
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
            maxWidth: 620,
            margin: isMobile ? '0 0 20px' : '0 0 28px',
          }}
        >
          Up to nine spots in Narbonne, eight in the others — Dave &amp; Lori already counted in. Pick one or several; you may attend more than one. We&rsquo;ll confirm by post within forty-eight hours.
        </p>

        <div
          style={{
            border: `1px solid ${T.ink}33`,
            background: T.paper,
            padding: isMobile ? '18px 18px' : '20px 24px',
            margin: isMobile ? '0 0 32px' : '0 0 48px',
            maxWidth: 640,
          }}
        >
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: '0.32em',
              opacity: 0.6,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Save your seat
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 15, lineHeight: 1.6, color: T.ink }}>
            A refundable Airbnb deposit by <span style={{ fontStyle: 'italic' }}>1 June</span> holds your week. Send via Venmo to{' '}
            <a
              href="https://venmo.com/sovereignangel"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: T.coral, textDecoration: 'none', fontFamily: T.mono, fontSize: 13, letterSpacing: '0.04em' }}
            >
              @sovereignangel
            </a>
            . Per-person price below covers the house only — estimates for catered lunch &amp; dinner, group lifts between locations, and other shared costs come later. Kiting is optional and arranged at your own expense.
          </div>
        </div>

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
                    <div style={{ marginTop: 2 }}>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 11,
                          letterSpacing: '0.04em',
                          color: sel ? T.sun : T.coral,
                          fontWeight: 500,
                        }}
                      >
                        ${perPerson(w).toLocaleString('en-US')}
                        <span style={{ opacity: 0.7, fontSize: 9, letterSpacing: '0.18em', marginLeft: 4 }}>/PP · HOUSE</span>
                      </div>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 8,
                          letterSpacing: '0.18em',
                          opacity: 0.55,
                          marginTop: 2,
                          textTransform: 'uppercase',
                        }}
                      >
                        + food · transport · TBD
                      </div>
                    </div>
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

            {/* Kite level */}
            <Segment
              label="Kite level"
              value={kiteLevel}
              onChange={(v) => {
                const next = v as KiteLevel
                setKiteLevel(next)
                if (next === 'none') setKiteGear('na')
                else if (kiteGear === 'na') setKiteGear('rental')
              }}
              options={[
                { value: 'none', label: 'Not kiting' },
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
              ]}
            />

            {/* Equipment — only relevant if kiting */}
            {kiteLevel !== 'none' && (
              <div style={{ marginTop: isMobile ? 22 : 26 }}>
                <Segment
                  label="Kite equipment"
                  value={kiteGear}
                  onChange={(v) => setKiteGear(v as KiteGear)}
                  options={[
                    { value: 'own', label: 'Bringing my own' },
                    { value: 'rental', label: 'Need rental' },
                  ]}
                />
              </div>
            )}

            {/* Partner +1 */}
            <div style={{ marginTop: isMobile ? 22 : 26 }}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  opacity: 0.65,
                  marginBottom: 10,
                }}
              >
                Partner +1
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <span
                  onClick={() => setBringPartner(!bringPartner)}
                  style={{
                    width: 18,
                    height: 18,
                    border: `1px solid ${T.ink}`,
                    background: bringPartner ? T.ink : 'transparent',
                    color: T.cream,
                    fontSize: 12,
                    fontFamily: T.mono,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {bringPartner ? '✓' : ''}
                </span>
                <input
                  type="checkbox"
                  checked={bringPartner}
                  onChange={(e) => setBringPartner(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span style={{ fontFamily: T.serif, fontSize: 16, opacity: 0.85 }}>
                  Yes, my partner is coming too.
                </span>
              </label>
              {bringPartner && (
                <div style={{ marginTop: 16 }}>
                  <Field
                    label="Partner's name"
                    value={partnerName}
                    onChange={setPartnerName}
                    placeholder="Their full name"
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: isMobile ? 22 : 26 }}>
              <Field
                label="Dietary restrictions"
                value={dietary}
                onChange={setDietary}
                placeholder="Allergies, vegetarian, halal, etc. — or none."
              />
            </div>

            <div style={{ marginTop: isMobile ? 22 : 26 }}>
              <Field
                label="Anything else?"
                value={note}
                onChange={setNote}
                placeholder="Anything we should know — arrival timing, requests, etc."
                textarea
              />
            </div>

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
    ['How do I save my spot?', 'A refundable Airbnb deposit by 1 June via Venmo to @sovereignangel locks in your week. Refundable if your plans change before we close the house bookings; we will say so clearly when the deadline approaches.'],
    ["What's included in the per-person price?", 'The house only — your share of the Airbnb. Estimates for catered lunch & dinner (private chef, mid-range, not too lux) and group lifts between locations come in a second pass once we firm up headcount. Travel to France is on you.'],
    ['Is kiting included?', 'No — kiting is optional and arranged à la carte at the spot, at your own expense. Beginners can book a local school directly; advanced riders bring their own kit. The retreat itself is the meals, the reading, the company, and the wind.'],
    ['How do meals work?', 'Lunch and dinner are catered for the house — a private chef, mid-range, four weeks of long tables. Breakfast and any restaurant nights are casual and on you. Dietary asks welcome on the form below.'],
    ['How do we move between weeks?', 'Group lifts between locations — vans or trains, arranged together so we travel as one party. You only need to handle your flights into and out of France.'],
    ['Can I bring a partner?', 'Yes — each room is a double and partners are welcome whether they kite or not. The Airbnb price is per-person, so a partner means 2× the deposit and 2× the per-person share of the house. Meals and dinner conversations are open to all.'],
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
          <span>
            <a href="/admin" style={{ color: T.cream, textDecoration: 'none', opacity: 0.85 }}>
              HOSTS
            </a>
            <span style={{ margin: '0 10px', opacity: 0.4 }}>·</span>
            NEW YORK · ATHENS · FRANCE
          </span>
        </div>
      </div>
    </footer>
  )
}

// ============================================================
// PAGE
// ============================================================
function TopBar() {
  const isMobile = useIsMobile()
  const navItems: [string, string][] = [
    ['#program', 'Program'],
    ['#rhythm', 'Rhythm'],
    ['#coaches', 'Coaches'],
    ['#location', 'Lieu'],
    ['#rsvp', 'RSVP'],
  ]
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(244, 239, 230, 0.88)',
        backdropFilter: 'saturate(140%) blur(10px)',
        WebkitBackdropFilter: 'saturate(140%) blur(10px)',
        borderBottom: `1px solid ${T.ink}1f`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '10px 20px' : '12px 48px',
          gap: 16,
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <LockupBar />
        {!isMobile ? (
          <nav
            style={{
              display: 'flex',
              gap: 32,
              fontFamily: T.mono,
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            {navItems.map(([href, label]) => (
              <a key={href} href={href} style={{ color: T.ink, textDecoration: 'none', opacity: 0.75 }}>
                {label}
              </a>
            ))}
          </nav>
        ) : (
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
    </div>
  )
}

export default function AretePage() {
  return (
    <main
      id="top"
      style={{
        background: T.cream,
        color: T.ink,
        fontFamily: T.sans,
        minHeight: '100vh',
        scrollBehavior: 'smooth',
      }}
    >
      <style>{`
        html { scroll-behavior: smooth; }
        section[id] { scroll-margin-top: 76px; }
        .loc-details { margin-top: auto; padding-top: 14px; border-top: 1px solid ${T.ink}1f; }
        .loc-details > summary {
          cursor: pointer;
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-family: ${T.mono};
          font-size: 9px;
          letter-spacing: 0.4em;
          padding-left: 0.4em;
          color: ${T.ink};
          opacity: 0.7;
          padding: 6px 0;
          transition: opacity 0.15s;
        }
        .loc-details > summary:hover { opacity: 1; color: ${T.bronze}; }
        .loc-details > summary::-webkit-details-marker { display: none; }
        .loc-details-icon {
          font-family: ${T.mono};
          font-size: 14px;
          line-height: 1;
          transition: transform 0.2s ease;
          opacity: 0.6;
        }
        .loc-details[open] > summary .loc-details-icon { transform: rotate(45deg); opacity: 1; color: ${T.bronze}; }
      `}</style>
      <TopBar />
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
