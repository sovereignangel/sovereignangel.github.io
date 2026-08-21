// Shared brand primitives for the Mahāmudrā New York site.
// Source of truth: "Mahamudra NYC Brand Design" folder (Claude design export)
// and MAHAMUDRA_BRAND_STRATEGY.md at repo root.

export const C = {
  // Deep Indigo — display type, frames, seals
  indigo: '#33245c',
  indigoDeep: '#291d4b',
  // Leaf Gold family — accents, text on indigo
  gold: '#b9973f',
  goldLight: '#e6cf90',
  goldSoft: '#d8b969',
  goldMuted: '#a99a76',
  // Parchment grounds
  parchment: '#f7ecd4',
  parchmentMid: '#efe0bc',
  agedEdge: '#e4d1a6',
  ground: '#e3d0a4',
  // Sepia Ink text
  ink: '#4a3d29',
  inkSoft: '#5a4a2c',
  inkMuted: '#6a5a3c',
  bronze: '#8a6a24',
  // Hairlines
  border: 'rgba(120,95,45,0.55)',
  borderSoft: 'rgba(150,122,58,0.40)',
  // On-indigo panel text
  panelTitle: '#f4e7c6',
  panelText: '#ecdfc0',
  panelMuted: '#cbb98f',
  cream: '#f2e5c4',
}

export const display = 'var(--font-mah-display), Georgia, serif'
export const text = 'var(--font-mah-text), Georgia, serif'

// Gradient hairlines flanking a turned square — the section ornament.
export function Diamond({
  color = C.indigo,
  size = 9,
  line = 150,
}: {
  color?: string
  size?: number
  line?: number
}) {
  return (
    <div className="flex items-center justify-center gap-3 select-none" aria-hidden>
      <span
        style={{
          display: 'block',
          width: `clamp(40px, 12vw, ${line}px)`,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${color})`,
        }}
      />
      <span
        style={{
          display: 'block',
          width: size,
          height: size,
          background: color,
          transform: 'rotate(45deg)',
        }}
      />
      <span
        style={{
          display: 'block',
          width: `clamp(40px, 12vw, ${line}px)`,
          height: 1,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />
    </div>
  )
}

// Small-caps letterspaced line.
export function Label({
  children,
  color = C.bronze,
  size = 13,
  tracking = '0.34em',
}: {
  children: React.ReactNode
  color?: string
  size?: number
  tracking?: string
}) {
  return (
    <div
      className="uppercase"
      style={{ fontFamily: display, fontSize: size, letterSpacing: tracking, color }}
    >
      {children}
    </div>
  )
}

// Seal / app mark — indigo square, gold M, gold ring.
export function MMark({ size = 34 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: C.indigo,
        display: 'grid',
        placeItems: 'center',
        boxShadow: `0 0 0 1px ${C.gold}, 0 0 0 4px rgba(255,255,255,0.25)`,
      }}
    >
      <span
        style={{
          fontFamily: display,
          fontWeight: 600,
          fontSize: size * 0.58,
          color: C.goldLight,
          lineHeight: 1,
        }}
      >
        M
      </span>
    </div>
  )
}

// The four stage glyphs from the Stage Assets sheet:
// Attention = open circle · Stability = square · One-pointedness = single point · Flow = turned square
export function StageGlyph({ stage, size = 44 }: { stage: 1 | 2 | 3 | 4; size?: number }) {
  const s = size
  const stroke = C.indigo
  return (
    <svg width={s} height={s} viewBox="0 0 44 44" aria-hidden>
      {stage === 1 && <circle cx="22" cy="22" r="14" fill="none" stroke={stroke} strokeWidth="1.3" />}
      {stage === 2 && <rect x="9" y="9" width="26" height="26" fill="none" stroke={stroke} strokeWidth="1.3" />}
      {stage === 3 && (
        <>
          <circle cx="22" cy="22" r="14" fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.45" />
          <circle cx="22" cy="22" r="3.2" fill={stroke} />
        </>
      )}
      {stage === 4 && (
        <rect x="12" y="12" width="20" height="20" fill="none" stroke={stroke} strokeWidth="1.3" transform="rotate(45 22 22)" />
      )}
    </svg>
  )
}
