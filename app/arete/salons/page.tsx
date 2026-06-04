'use client'

// Arete Technologies — The Long View (salons).
// Mirrors the Mistral retreat aesthetic: cream/paper, bronze + wine accents,
// French section labels, useIsMobile responsive, PatternArcs.
// Reached via arete.loricorpuz.com/salons.

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
// TOKENS — Mistral palette + salon-specific wine accent
// ============================================================
const T = {
  ink: '#1a1815',
  cream: '#f4efe6',
  paper: '#ebe4d4',
  paperDeep: '#e0d6bb',
  sand: '#d6c89e',
  sun: '#d89248',
  bronze: '#7a5a2e',
  bronzeLight: '#a47e3e',
  wine: '#5a1f1d',
  wineLight: '#8a3a36',
  ember: '#d6a25a',
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

// ============================================================
// EVENT DATA
// ============================================================
const EVENT = {
  weekday: 'SATURDAY',
  dateLong: '13 June 2026',
  timeRange: '5 — 8 PM',
  city: 'NEW YORK',
  cap: 24,
  initialTaken: 4,
  speakers: [
    { roman: 'I', org: 'ASML', topic: 'The lithography frontier', confirmed: true },
    { roman: 'II', org: 'TBA', topic: 'Speaker to be announced', confirmed: false },
    { roman: 'III', org: 'TBA', topic: 'Speaker to be announced', confirmed: false },
  ] as const,
}

// ============================================================
// LOCKUP — ARETE TECHNOLOGIES presents · The Long View
// ============================================================
function LockupBar() {
  return (
    <a
      href="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        textDecoration: 'none',
        color: T.ink,
      }}
    >
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.05 }}>
        <span
          style={{
            fontSize: 9,
            letterSpacing: '0.34em',
            paddingLeft: '0.34em',
            fontFamily: T.sans,
            fontWeight: 500,
            opacity: 0.75,
            whiteSpace: 'nowrap',
          }}
        >
          ARETE TECHNOLOGIES
        </span>
        <span
          style={{
            fontSize: 7,
            letterSpacing: '0.42em',
            paddingLeft: '0.42em',
            fontFamily: T.mono,
            fontStyle: 'italic',
            opacity: 0.5,
            marginTop: 3,
          }}
        >
          presents
        </span>
      </span>
      <span style={{ width: 1, height: 26, background: T.ink, opacity: 0.25 }} />
      <span style={{ fontSize: 26, fontStyle: 'italic', fontWeight: 400, fontFamily: T.serif, color: T.wine, lineHeight: 1 }}>
        The Long View
      </span>
    </a>
  )
}

function LockupBarLight() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.05 }}>
        <span
          style={{
            fontSize: 9,
            letterSpacing: '0.34em',
            paddingLeft: '0.34em',
            fontFamily: T.sans,
            fontWeight: 500,
            opacity: 0.75,
            color: T.cream,
            whiteSpace: 'nowrap',
          }}
        >
          ARETE TECHNOLOGIES
        </span>
        <span
          style={{
            fontSize: 7,
            letterSpacing: '0.42em',
            paddingLeft: '0.42em',
            fontFamily: T.mono,
            fontStyle: 'italic',
            opacity: 0.5,
            color: T.cream,
            marginTop: 3,
          }}
        >
          presents
        </span>
      </span>
      <span style={{ width: 1, height: 26, background: T.cream, opacity: 0.25 }} />
      <span style={{ fontSize: 26, fontStyle: 'italic', fontWeight: 400, fontFamily: T.serif, color: T.ember, lineHeight: 1 }}>
        The Long View
      </span>
    </span>
  )
}

// ============================================================
// PATTERNS / MOTIFS
// ============================================================
function PatternArcs({ color, opacity = 0.18, size = 80 }: { color?: string; opacity?: number; size?: number }) {
  const c = color || T.ink
  const id = `arc-${size}-${Math.round(opacity * 1000)}`
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id={id} x="0" y="0" width={size} height={size * 0.5} patternUnits="userSpaceOnUse">
          <path
            d={`M 0 ${size * 0.5} Q ${size * 0.5} 0 ${size} ${size * 0.5}`}
            fill="none"
            stroke={c}
            strokeWidth="0.75"
            opacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

function ThreeColumns({
  size = 100,
  color,
  opacity = 1,
  variant = 'classical',
}: {
  size?: number
  color?: string
  opacity?: number
  variant?: 'classical' | 'minimal'
}) {
  const c = color || T.ink
  const stroke = { fill: 'none' as const, stroke: c, strokeLinecap: 'butt' as const }
  const s = { width: size, height: size, opacity }
  if (variant === 'minimal') {
    return (
      <svg viewBox="0 0 60 60" style={s}>
        <line x1="15" y1="14" x2="15" y2="48" {...stroke} strokeWidth={1.5} />
        <line x1="30" y1="10" x2="30" y2="48" {...stroke} strokeWidth={1.5} />
        <line x1="45" y1="14" x2="45" y2="48" {...stroke} strokeWidth={1.5} />
        <line x1="6" y1="50" x2="54" y2="50" {...stroke} strokeWidth={1} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 60 60" style={s}>
      {[14, 30, 46].map((x) => (
        <g key={x}>
          <line x1={x - 5} y1={12} x2={x + 5} y2={12} {...stroke} strokeWidth={1} />
          <path d={`M ${x - 4} 12 Q ${x - 5} 15 ${x - 4} 16`} {...stroke} strokeWidth={1} />
          <path d={`M ${x + 4} 12 Q ${x + 5} 15 ${x + 4} 16`} {...stroke} strokeWidth={1} />
          <path d={`M ${x - 3} 16 Q ${x - 3.4} 30 ${x - 3} 44`} {...stroke} strokeWidth={1} />
          <path d={`M ${x + 3} 16 Q ${x + 3.4} 30 ${x + 3} 44`} {...stroke} strokeWidth={1} />
          <line x1={x - 5} y1={44} x2={x + 5} y2={44} {...stroke} strokeWidth={1} />
          <line x1={x - 6} y1={47} x2={x + 6} y2={47} {...stroke} strokeWidth={1} />
        </g>
      ))}
      <line x1="2" y1="50" x2="58" y2="50" {...stroke} strokeWidth={1} />
      <line x1="0" y1="53" x2="60" y2="53" {...stroke} strokeWidth={1} opacity={0.4} />
    </svg>
  )
}

function Candle({ size = 64, color }: { size?: number; color?: string }) {
  const c = color || T.ink
  return (
    <svg viewBox="0 0 64 80" style={{ width: size, height: size * 1.25 }}>
      <path d="M 32 8 Q 28 18 32 24 Q 36 18 32 8 Z" fill={T.sun} opacity="0.85" />
      <path d="M 32 14 Q 30 20 32 23 Q 34 20 32 14 Z" fill={T.cream} opacity="0.9" />
      <line x1="32" y1="24" x2="32" y2="28" stroke={c} strokeWidth="1" />
      <rect x="28" y="28" width="8" height="44" fill="none" stroke={c} strokeWidth="1" />
      <path d="M 30 36 Q 28 42 30 46" fill="none" stroke={c} strokeWidth="0.75" opacity="0.6" />
      <rect x="24" y="72" width="16" height="3" fill="none" stroke={c} strokeWidth="1" />
    </svg>
  )
}

function LongTable({ color }: { color?: string }) {
  const c = color || T.ink
  const seats = 22
  const width = 400
  const h = width * 0.32
  return (
    <svg viewBox={`0 0 ${width} ${h}`} style={{ width: '100%', height: 'auto' }}>
      <rect x={width * 0.08} y={h * 0.35} width={width * 0.84} height={h * 0.3} fill="none" stroke={c} strokeWidth="1" />
      {Array.from({ length: seats / 2 }).map((_, i) => {
        const x = width * 0.12 + width * 0.76 * ((i + 0.5) / (seats / 2))
        return (
          <g key={i}>
            <circle cx={x} cy={h * 0.15} r={h * 0.07} fill="none" stroke={c} strokeWidth="0.75" />
            <circle cx={x} cy={h * 0.85} r={h * 0.07} fill="none" stroke={c} strokeWidth="0.75" />
          </g>
        )
      })}
      <circle cx={width * 0.04} cy={h * 0.5} r={h * 0.07} fill="none" stroke={c} strokeWidth="0.75" />
      <circle cx={width * 0.96} cy={h * 0.5} r={h * 0.07} fill="none" stroke={c} strokeWidth="0.75" />
    </svg>
  )
}

// ============================================================
// SEAL
// ============================================================
function Seal({
  size = 140,
  color,
  label = 'ARETE · THE LONG VIEW',
  center = 'I',
  sub = 'A SALON · NEW YORK',
}: {
  size?: number
  color?: string
  label?: string
  center?: string
  sub?: string
}) {
  const c = color || T.wine
  const r = size / 2
  const inner = r - 8
  const textR = r - 14
  const id = `seal-${center}-${Math.round(size)}`
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
        {[6, 14, 22].map((x) => (
          <g key={x}>
            <line x1={x - 3} y1={2} x2={x + 3} y2={2} stroke={c} strokeWidth="0.8" />
            <line x1={x} y1={4} x2={x} y2={22} stroke={c} strokeWidth="0.8" />
            <line x1={x - 4} y1={24} x2={x + 4} y2={24} stroke={c} strokeWidth="0.8" />
          </g>
        ))}
      </g>
      <text
        x={r}
        y={r + 14}
        textAnchor="middle"
        fill={c}
        fontFamily={T.serif}
        fontStyle="italic"
        fontSize={size * 0.09}
      >
        {center}
      </text>
    </svg>
  )
}

// ============================================================
// POSTER — salon hero composition
// ============================================================
function SalonPoster() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#efe5d0',
        color: T.ink,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: T.serif,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0 0 38% 0',
          background: 'linear-gradient(180deg, #efe5d0 0%, #e0d2b0 65%, #c8a874 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          aspectRatio: '1',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${T.sun}60 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '62% 0 0 0',
          background: 'linear-gradient(180deg, #2a1f1a 0%, #1a1410 100%)',
        }}
      />
      <div style={{ position: 'absolute', top: '62%', left: 0, right: 0, height: 1, background: T.ink, opacity: 0.6 }} />
      {[0.7, 0.78, 0.86, 0.94].map((t, i) => (
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

      {/* Three classical columns */}
      <svg
        viewBox="0 0 200 200"
        style={{ position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)', width: '42%' }}
      >
        {[42, 100, 158].map((x) => (
          <g key={x}>
            <line x1={x - 16} y1={36} x2={x + 16} y2={36} stroke={T.wine} strokeWidth="2.4" />
            <path d={`M ${x - 12} 36 Q ${x - 16} 44 ${x - 12} 48`} fill="none" stroke={T.wine} strokeWidth="2" />
            <path d={`M ${x + 12} 36 Q ${x + 16} 44 ${x + 12} 48`} fill="none" stroke={T.wine} strokeWidth="2" />
            <path d={`M ${x - 9} 48 Q ${x - 10} 110 ${x - 9} 150`} fill="none" stroke={T.wine} strokeWidth="2" />
            <path d={`M ${x + 9} 48 Q ${x + 10} 110 ${x + 9} 150`} fill="none" stroke={T.wine} strokeWidth="2" />
            <line x1={x - 4} y1={52} x2={x - 4} y2={148} stroke={T.wine} strokeWidth="0.8" opacity="0.4" />
            <line x1={x} y1={50} x2={x} y2={150} stroke={T.wine} strokeWidth="0.8" opacity="0.4" />
            <line x1={x + 4} y1={52} x2={x + 4} y2={148} stroke={T.wine} strokeWidth="0.8" opacity="0.4" />
            <line x1={x - 16} y1={150} x2={x + 16} y2={150} stroke={T.wine} strokeWidth="2" />
            <line x1={x - 18} y1={158} x2={x + 18} y2={158} stroke={T.wine} strokeWidth="2.4" />
          </g>
        ))}
        <line x1="4" y1="170" x2="196" y2="170" stroke={T.wine} strokeWidth="3" />
        <line x1="0" y1="178" x2="200" y2="178" stroke={T.wine} strokeWidth="1.2" opacity="0.6" />
      </svg>

      {/* Long table silhouette */}
      <svg
        viewBox="0 0 600 200"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: '74%', left: 0, right: 0, width: '100%', height: '20%' }}
      >
        <ellipse cx="300" cy="100" rx="280" ry="14" fill={T.bronze} opacity="0.45" />
        <ellipse cx="300" cy="100" rx="280" ry="14" fill="none" stroke={T.cream} strokeWidth="0.8" opacity="0.5" />
        {[80, 140, 200, 260, 320, 380, 440, 500].map((x) => (
          <g key={x}>
            <circle cx={x} cy={70} r="9" fill="none" stroke={T.cream} strokeWidth="0.8" opacity="0.55" />
            <circle cx={x} cy={130} r="9" fill="none" stroke={T.cream} strokeWidth="0.8" opacity="0.55" />
          </g>
        ))}
        <circle cx="40" cy="100" r="9" fill="none" stroke={T.cream} strokeWidth="0.8" opacity="0.55" />
        <circle cx="560" cy="100" r="9" fill="none" stroke={T.cream} strokeWidth="0.8" opacity="0.55" />
      </svg>

      <div style={{ position: 'absolute', top: '5%', left: '8%', right: '8%', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 'clamp(8px, 1vw, 14px)',
            letterSpacing: '0.6em',
            paddingLeft: '0.6em',
            fontFamily: T.mono,
            opacity: 0.7,
            color: T.ink,
          }}
        >
          ARETE · INVITATION
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '14%', left: '8%', right: '8%', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 'clamp(28px, 5vw, 60px)',
            fontWeight: 500,
            letterSpacing: '0.06em',
            lineHeight: 0.95,
            color: T.cream,
            fontFamily: T.serif,
          }}
        >
          THE LONG VIEW
        </div>
        <div
          style={{
            fontSize: 'clamp(10px, 1.4vw, 16px)',
            letterSpacing: '0.42em',
            paddingLeft: '0.42em',
            marginTop: 14,
            fontFamily: T.sans,
            fontWeight: 500,
            color: T.cream,
          }}
        >
          JUIN · MMXXVI
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
          III SPEAKERS
          <br />
          X MINUTES
          <br />
          ONE TABLE
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
          NEW YORK
          <br />
          BY INVITATION
          <br />
          SALON I
        </div>
      </div>
    </div>
  )
}

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
          marginBottom: isMobile ? 24 : 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <LockupBar />
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: '0.32em',
            opacity: 0.6,
            textTransform: 'uppercase',
            display: isMobile ? 'none' : 'block',
          }}
        >
          aretetec.com · By invitation
        </div>
      </div>

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
            ARETE · FIRST OF THE SERIES · MMXXVI
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
            <span style={{ fontStyle: 'italic' }}>The Long View.</span>
            <br />
            Three speakers,
            <br />
            one long table.
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: isMobile ? 20 : 28 }}>
            <div style={{ width: 32, height: 1, background: T.ink, opacity: 0.5 }} />
            <div style={{ fontSize: 11, letterSpacing: '0.42em', fontFamily: T.mono, opacity: 0.7 }}>
              {EVENT.dateLong.toUpperCase()} · {EVENT.city}
            </div>
          </div>
          <figure
            style={{
              margin: isMobile ? '0 0 22px' : '0 0 28px',
              maxWidth: 460,
              paddingLeft: 18,
              borderLeft: `1px solid ${T.wine}66`,
            }}
          >
            <blockquote
              style={{
                margin: 0,
                fontFamily: T.serif,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: isMobile ? 17 : 19,
                lineHeight: 1.5,
                color: T.ink,
                opacity: 0.92,
              }}
            >
              “The difficulty lies, not in the new ideas, but in escaping from the old ones.”
            </blockquote>
            <figcaption
              style={{
                marginTop: 10,
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: '0.42em',
                opacity: 0.6,
                textTransform: 'uppercase',
              }}
            >
              — J. M. Keynes
            </figcaption>
          </figure>
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
              Request an invitation →
            </a>
            <a
              href="#format"
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
              Read the format
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
          <SalonPoster />
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
        {[
          { n: '01', label: 'Three speakers' },
          { n: '02', label: 'A panel' },
          { n: '03', label: 'Open question' },
          { n: '04', label: 'A long dinner' },
        ].map((s) => (
          <div
            key={s.n}
            style={{
              fontFamily: T.mono,
              fontSize: isMobile ? 9 : 10,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              opacity: 0.65,
              flexBasis: isMobile ? '46%' : 'auto',
            }}
          >
            <span style={{ color: T.wine, marginRight: 10 }}>{s.n}</span>
            {s.label}
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// FORMAT
// ============================================================
function Format() {
  const isMobile = useIsMobile()
  const items = [
    { n: 'I', t: 'Three speakers', d: 'Ten minutes each. No slides unless essential. One idea, well-formed.', icon: 'columns' as const },
    { n: 'II', t: 'A panel', d: 'The three return to the table. The host presses on the seams.', icon: 'table' as const },
    { n: 'III', t: 'Open question', d: 'The room takes over. Anyone may ask. Anyone may answer.', icon: 'candle' as const },
    { n: 'IV', t: 'A long dinner', d: 'The salon properly begins. Catered. No itinerary past this point.', icon: 'table' as const },
  ]
  return (
    <section
      id="format"
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
            <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
              I · LA FORME
            </div>
            <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? 34 : 56, fontWeight: 400, lineHeight: 1, margin: 0, fontStyle: 'italic' }}>
              How the evening unfolds.
            </h2>
          </div>
          <div style={{ maxWidth: 360, fontSize: isMobile ? 15 : 14, lineHeight: 1.7, opacity: 0.78, fontFamily: T.serif }}>
            Two hours of structure, then dinner. Doors at 17:00. Aperitif while the table fills. Brief introductions; the format does the rest.
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
          {items.map((it, i) => (
            <div
              key={it.n}
              style={{
                padding: isMobile ? '28px 4px' : '32px 24px',
                borderRight: !isMobile && i < 3 ? `1px solid ${T.ink}33` : 'none',
                borderBottom: `1px solid ${T.ink}${isMobile && i < items.length - 1 ? '33' : ''}`,
                display: 'flex',
                flexDirection: 'column',
                minHeight: isMobile ? 'auto' : 300,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: T.serif, fontSize: 48, fontStyle: 'italic', color: T.wine, lineHeight: 1 }}>
                  {it.n}
                </div>
                <div style={{ marginTop: 4 }}>
                  {it.icon === 'columns' && <ThreeColumns size={36} color={T.ink} opacity={0.45} variant="minimal" />}
                  {it.icon === 'table' && (
                    <svg viewBox="0 0 60 60" width="36" height="36" style={{ opacity: 0.45 }}>
                      <rect x="8" y="24" width="44" height="12" fill="none" stroke={T.ink} strokeWidth="1" />
                      {[14, 22, 30, 38, 46].map((x) => (
                        <circle key={x} cx={x} cy="18" r="2.5" fill="none" stroke={T.ink} strokeWidth="0.75" />
                      ))}
                      {[14, 22, 30, 38, 46].map((x) => (
                        <circle key={`b${x}`} cx={x} cy="42" r="2.5" fill="none" stroke={T.ink} strokeWidth="0.75" />
                      ))}
                    </svg>
                  )}
                  {it.icon === 'candle' && <Candle size={28} color={T.ink} />}
                </div>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 500, marginTop: 24, lineHeight: 1.1 }}>{it.t}</div>
              <p style={{ fontFamily: T.serif, fontSize: 14, lineHeight: 1.65, opacity: 0.78, marginTop: 16, flex: 1 }}>{it.d}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 32,
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: isMobile ? 16 : 18,
            opacity: 0.65,
            maxWidth: 600,
          }}
        >
          “The whole is more than the sum of its parts.”
          <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', marginLeft: 16, opacity: 0.7, fontStyle: 'normal' }}>
            — ARISTOTLE
          </span>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// SCHEDULE
// ============================================================
function Schedule() {
  const isMobile = useIsMobile()
  const rows = [
    { time: '17:00', title: 'Doors', sub: 'Aperitif as the table fills' },
    { time: '17:30', title: 'Speaker I', sub: '10 min · one idea' },
    { time: '17:45', title: 'Speaker II', sub: '10 min · one idea' },
    { time: '18:00', title: 'Speaker III', sub: '10 min · one idea' },
    { time: '18:15', title: 'Panel', sub: '30 min · the host presses' },
    { time: '18:45', title: 'Open question', sub: 'The room takes over' },
    { time: '19:15', title: 'Dinner', sub: 'Catered · long table · no itinerary' },
  ]
  return (
    <section
      id="schedule"
      style={{
        background: T.ink,
        color: T.cream,
        padding: isMobile ? '64px 20px' : '120px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <PatternArcs color={T.cream} opacity={0.05} size={140} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.55, marginBottom: 16 }}>
          II · LE PROGRAMME
        </div>
        <h2
          style={{
            fontFamily: T.serif,
            fontSize: isMobile ? 34 : 56,
            fontWeight: 400,
            lineHeight: 1,
            margin: isMobile ? '0 0 36px' : '0 0 48px',
            fontStyle: 'italic',
          }}
        >
          The evening, hour by hour.
        </h2>

        <div style={{ borderTop: `1px solid ${T.cream}33` }}>
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '64px 1fr' : '100px 1fr 1.5fr',
                columnGap: isMobile ? 14 : 32,
                padding: isMobile ? '18px 0' : '20px 0',
                borderBottom: i < rows.length - 1 ? `1px solid ${T.cream}1a` : `1px solid ${T.cream}33`,
                alignItems: 'baseline',
              }}
            >
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: isMobile ? 13 : 14,
                  letterSpacing: '0.18em',
                  color: T.ember,
                }}
              >
                {r.time}
              </div>
              <div style={{ fontFamily: T.serif, fontSize: isMobile ? 19 : 22, fontStyle: 'italic', lineHeight: 1.2 }}>
                {r.title}
                {isMobile && (
                  <div style={{ fontFamily: T.serif, fontSize: 13, opacity: 0.7, marginTop: 4, lineHeight: 1.5, fontStyle: 'normal' }}>
                    {r.sub}
                  </div>
                )}
              </div>
              {!isMobile && (
                <div style={{ fontFamily: T.serif, fontSize: 15, opacity: 0.75, lineHeight: 1.5 }}>
                  {r.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: isMobile ? 48 : 72,
            paddingTop: 32,
            borderTop: `1px solid ${T.cream}22`,
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: isMobile ? 16 : 18,
            opacity: 0.7,
            maxWidth: 580,
          }}
        >
          “We are what we repeatedly do. Excellence, then, is not an act, but a habit.”
          <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', marginTop: 12, opacity: 0.55, fontStyle: 'normal' }}>
            — ARISTOTLE · NICOMACHEAN ETHICS · II
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// HOUSE
// ============================================================
function House() {
  const isMobile = useIsMobile()
  return (
    <section
      id="house"
      style={{
        background: T.paper,
        color: T.ink,
        padding: isMobile ? '64px 20px' : '120px 48px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
          III · LA MAISON
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
          The house, the table.
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 32 : 56,
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
              {[
                ['Where', 'A private home in lower Manhattan. Exact address sent with confirmation.'],
                ['When', 'Saturday 13 June, 17:00 sharp. The salon ends when it ends.'],
                ['Table', 'Twenty-four seats. LPs and one guest each. Returning faces.'],
                ['Catering', 'A long, slow dinner. Seasonal. Wine paired. Allergies honored.'],
                ['Dress', 'No code. Come from the office or come from the gym.'],
                ['Recording', 'Off the record. No phones at the table.'],
              ].map(([h, b]) => (
                <div key={h}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.6, textTransform: 'uppercase' }}>
                    {h}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 15, marginTop: 6, lineHeight: 1.55 }}>{b}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ background: T.cream, padding: '40px 28px', border: `1px solid ${T.ink}22` }}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: '0.3em',
                  opacity: 0.5,
                  marginBottom: 24,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}
              >
                XXIV SEATS · ONE TABLE
              </div>
              <LongTable color={T.ink} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 24,
                  fontFamily: T.serif,
                  fontSize: 12,
                  fontStyle: 'italic',
                  opacity: 0.7,
                }}
              >
                <span>Host</span>
                <span>Speakers · panel · room</span>
                <span>Co-host</span>
              </div>
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
  const [taken, setTaken] = useState(EVENT.initialTaken)
  const [seats, setSeats] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dietary, setDietary] = useState('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const remaining = EVENT.cap - taken

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTaken((t) => Math.min(EVENT.cap, t + seats))
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
        <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
          IV · RÉSERVER
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
          Request an invitation.
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
          Twenty-four seats at the table. The salon is private — LPs and one guest each. We confirm by post within forty-eight hours.
        </p>

        <div
          style={{
            border: `1px solid ${T.ink}33`,
            background: T.paper,
            padding: isMobile ? '20px 18px' : '28px 28px',
            margin: isMobile ? '0 0 32px' : '0 0 48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.32em', opacity: 0.6, textTransform: 'uppercase' }}>
                {EVENT.weekday}
              </div>
              <div
                style={{
                  fontFamily: T.serif,
                  fontSize: isMobile ? 26 : 36,
                  fontStyle: 'italic',
                  color: T.wine,
                  lineHeight: 1.1,
                  marginTop: 6,
                }}
              >
                {EVENT.dateLong}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.32em', opacity: 0.7, marginTop: 8 }}>
                {EVENT.timeRange} · {EVENT.city}
              </div>
            </div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: '0.3em',
                color: T.wine,
                textTransform: 'uppercase',
              }}
            >
              {remaining}/{EVENT.cap} seats remain
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? 14 : 16,
              borderTop: `1px solid ${T.ink}22`,
              paddingTop: 18,
            }}
          >
            {EVENT.speakers.map((sp) => (
              <div key={sp.roman} style={{ padding: '4px 0', opacity: sp.confirmed ? 1 : 0.65 }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 22, color: T.wine, lineHeight: 1 }}>
                  {sp.roman}
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 9,
                    letterSpacing: '0.3em',
                    opacity: 0.8,
                    marginTop: 10,
                    textTransform: 'uppercase',
                  }}
                >
                  {sp.org}
                </div>
                <div
                  style={{
                    fontFamily: T.serif,
                    fontStyle: 'italic',
                    fontSize: 14,
                    marginTop: 4,
                    lineHeight: 1.35,
                    opacity: sp.confirmed ? 0.95 : 0.6,
                  }}
                >
                  {sp.topic}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!submitted ? (
          <form onSubmit={submit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '2fr 2fr 1fr',
                gap: isMobile ? 20 : 24,
                marginBottom: isMobile ? 24 : 32,
              }}
            >
              <Field label="Name" value={name} onChange={setName} placeholder="Your full name" />
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
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
                  Seats
                </span>
                <select
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value) as 1 | 2)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${T.ink}`,
                    padding: '10px 0',
                    fontFamily: T.serif,
                    fontSize: 17,
                    color: T.ink,
                    outline: 'none',
                  }}
                >
                  <option value={1}>1 — just me</option>
                  <option value={2}>2 — with guest</option>
                </select>
              </label>
            </div>

            <div style={{ marginBottom: isMobile ? 22 : 26 }}>
              <Field
                label="Dietary"
                value={dietary}
                onChange={setDietary}
                placeholder="Allergies, vegetarian, halal, etc. — or none."
              />
            </div>

            <Field
              label="Anything we should know?"
              value={note}
              onChange={setNote}
              placeholder="The guest's name, a topic you'd open with…"
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
                {seats} seat{seats > 1 ? 's' : ''} · confirmation within 48 hours
              </div>
              <button
                type="submit"
                disabled={!name || !email}
                style={{
                  background: T.ink,
                  color: T.cream,
                  padding: '18px 36px',
                  border: 'none',
                  cursor: !name || !email ? 'not-allowed' : 'pointer',
                  fontFamily: T.mono,
                  fontSize: 11,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  opacity: !name || !email ? 0.4 : 1,
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                Submit →
              </button>
            </div>
          </form>
        ) : (
          <div style={{ border: `1px solid ${T.ink}`, padding: 48, textAlign: 'center', background: T.paper }}>
            <Seal size={120} color={T.wine} center="✓" sub="REÇU · MERCI" />
            <div style={{ fontFamily: T.serif, fontSize: 32, fontStyle: 'italic', marginTop: 24 }}>
              Reçu. Merci, {name.split(' ')[0] || 'ami'}.
            </div>
            <div style={{ fontFamily: T.serif, fontSize: 16, opacity: 0.75, marginTop: 12 }}>
              Confirmation arriving at {email} within 48 hours.
            </div>
          </div>
        )}
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
        padding: isMobile ? '64px 20px 40px' : '72px 48px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <PatternArcs color={T.cream} opacity={0.03} size={120} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr 1fr',
            gap: isMobile ? 36 : 48,
            alignItems: 'center',
            marginBottom: isMobile ? 40 : 64,
            justifyItems: isMobile ? 'center' : 'stretch',
          }}
        >
          <Seal size={120} color={T.ember} />
          <div
            style={{
              textAlign: 'center',
              fontFamily: T.serif,
              fontSize: isMobile ? 22 : 26,
              fontStyle: 'italic',
              lineHeight: 1.4,
              opacity: 0.85,
            }}
          >
            “What compounds, endures.”
          </div>
          <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end' }}>
            <LockupBarLight />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: `1px solid ${T.cream}22`,
            paddingTop: 32,
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.3em',
            opacity: 0.55,
            textTransform: 'uppercase',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span>© MMXXVI · ARETE TECHNOLOGIES</span>
          <span>SALON@ARETETEC.COM</span>
          <span
            style={{
              fontFamily: T.serif,
              fontStyle: 'italic',
              textTransform: 'none',
              letterSpacing: 0,
              fontSize: 13,
              opacity: 1,
            }}
          >
            Eadem mutata resurgo
          </span>
        </div>
      </div>
    </footer>
  )
}

// ============================================================
// PAGE
// ============================================================
const PAGE_CSS = `
  .salon-root *, .salon-root *::before, .salon-root *::after { box-sizing: border-box; }
  .salon-root input::placeholder, .salon-root textarea::placeholder {
    color: rgba(26, 24, 21, 0.4); font-style: italic;
  }
  .salon-root ::selection { background: ${T.bronze}; color: ${T.cream}; }
`

export default function SalonsPage() {
  return (
    <div
      className="salon-root"
      style={{
        background: T.cream,
        color: T.ink,
        fontFamily: T.sans,
        minHeight: '100vh',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <Hero />
      <SimplifiedRSVP />
      <Footer />
    </div>
  )
}

// Simplified RSVP section with purpose statement
function SimplifiedRSVP() {
  const isMobile = useIsMobile()
  const [taken, setTaken] = useState(EVENT.initialTaken)
  const [seats, setSeats] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const remaining = EVENT.cap - taken

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTaken((t) => Math.min(EVENT.cap, t + seats))
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
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ marginBottom: isMobile ? 32 : 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 16 }}>
            SALON CONCEPT
          </div>
          <p style={{ fontFamily: T.serif, fontSize: isMobile ? 18 : 22, lineHeight: 1.6, maxWidth: 760, color: T.ink }}>
            The Long View brings together leaders in technology and thought. Three speakers, ten minutes each. One idea, well-formed. Then a panel, open questions, and a long dinner at a private table in lower Manhattan. For twenty-four by invitation only.
          </p>
          <div style={{ marginTop: 24 }}>
            <a
              href="https://armstrong.arete.com"
              style={{
                display: 'inline-block',
                background: T.wine,
                color: T.cream,
                padding: '14px 28px',
                textDecoration: 'none',
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                marginRight: 16,
              }}
            >
              Armstrong Invest →
            </a>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${T.ink}33`, paddingTop: 48 }}>
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
            Request an invitation.
          </h2>

          {!submitted ? (
            <form onSubmit={submit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '2fr 2fr 1fr',
                  gap: isMobile ? 20 : 24,
                  marginBottom: isMobile ? 24 : 32,
                }}
              >
                <Field label="Name" value={name} onChange={setName} placeholder="Your full name" />
                <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', opacity: 0.65 }}>
                    Seats
                  </span>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value) as 1 | 2)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${T.ink}`,
                      padding: '10px 0',
                      fontFamily: T.serif,
                      fontSize: 17,
                      color: T.ink,
                      outline: 'none',
                    }}
                  >
                    <option value={1}>1 — just me</option>
                    <option value={2}>2 — with guest</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', opacity: 0.6, textTransform: 'uppercase' }}>
                  {remaining}/{EVENT.cap} seats · {seats} requested
                </div>
                <button
                  type="submit"
                  disabled={!name || !email}
                  style={{
                    background: T.ink,
                    color: T.cream,
                    padding: '12px 28px',
                    border: 'none',
                    cursor: !name || !email ? 'not-allowed' : 'pointer',
                    fontFamily: T.mono,
                    fontSize: 11,
                    letterSpacing: '0.32em',
                    textTransform: 'uppercase',
                    opacity: !name || !email ? 0.4 : 1,
                  }}
                >
                  Submit →
                </button>
              </div>
            </form>
          ) : (
            <div style={{ border: `1px solid ${T.ink}33`, padding: 48, textAlign: 'center', background: T.paper }}>
              <div style={{ fontFamily: T.serif, fontSize: 32, fontStyle: 'italic', marginBottom: 12 }}>
                Merci, {name.split(' ')[0] || 'ami'}.
              </div>
              <div style={{ fontFamily: T.serif, fontSize: 16, opacity: 0.75 }}>
                Confirmation arriving at {email} within 48 hours.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
