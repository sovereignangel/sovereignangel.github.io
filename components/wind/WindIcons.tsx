/**
 * Kite planner design assets — one mark per spot, one per season, plus the
 * wave divider. Shared by /wind, /wind/nyc, /wind/brazil and /exec so every
 * surface draws the same set.
 */

const SPOT_PATHS: Record<string, React.ReactNode> = {
  // ─── Lithuania ──────────────────────────────────────────────
  // Home spot — house above a wave
  sventoji: (
    <>
      <path d="M4 11 L12 4.5 L20 11" />
      <path d="M6.5 9.5 V16 H17.5 V9.5" />
      <path d="M3 20 Q6 18 9 20 T15 20 T21 20" />
    </>
  ),
  // Pro kite center — LEI kite canopy with lines to the rider
  svencele: (
    <>
      <path d="M4 9.5 Q12 2 20 9.5 Q12 6.5 4 9.5 Z" fill="currentColor" stroke="none" />
      <path d="M5.5 9.5 L11 20" />
      <path d="M18.5 9.5 L13 20" />
      <path d="M10 20.5 L14 20.5" />
    </>
  ),
  // Liepaja — lighthouse for the city where the wind is born
  liepaja: (
    <>
      <path d="M10 20 L10.8 7 H13.2 L14 20" />
      <path d="M9.5 9.5 H14.5" />
      <path d="M10.5 7 V4.5 H13.5 V7" />
      <path d="M7 5.5 L8.8 6.2 M17 5.5 L15.2 6.2" />
      <path d="M7 20 H17" />
    </>
  ),
  // Nida — sailboat for the Hamptons of Lithuania
  nida: (
    <>
      <path d="M12 3.5 V16.5" />
      <path d="M12 5 L18 14.5 H12 Z" />
      <path d="M11 7.5 L6.5 14.5 H11 Z" />
      <path d="M4.5 17 H19.5 L17 20 H7 Z" />
    </>
  ),

  // ─── New York ───────────────────────────────────────────────
  // Sandy Hook — the hook of the spit curling off the mainland
  'sandy-hook': (
    <>
      <path d="M8 21 V11 a5.5 5.5 0 0 1 11 0 a3.5 3.5 0 0 1 -7 0" />
      <path d="M3 21 h5" />
    </>
  ),
  // Plumb Beach — city skyline over the water it sits under
  'plumb-beach': (
    <>
      <path d="M3 15 V9 h4 v6 M7 15 V5 h5 v10 M12 15 V8 h4.5 v7 M16.5 15 V11 H21 v4" />
      <path d="M2 18.5 Q5.5 16.5 9 18.5 T16 18.5 T22 18.5" />
    </>
  ),

  // ─── Brazil ─────────────────────────────────────────────────
  // Fortaleza — the fortress the city is named for
  fortaleza: (
    <>
      <path d="M4 20 V9 h2.5 V6.5 h3 V9 h5 V6.5 h3 V9 H20 v11 Z" />
      <path d="M10.5 20 v-5 h3 v5" />
    </>
  ),
  // Cumbuco — palm over the beach
  cumbuco: (
    <>
      <path d="M12 20 c0-6 .5-9 2-11.5" />
      <path d="M14 8.5 c-2.5-3-6-2.5-7.5-.5 M14 8.5 c-.5-3.5 1.5-5.5 4-5 M14 8.5 c3-1 5.5.5 6 3" />
      <path d="M4 20.5 h16" />
    </>
  ),
  // Taiba — dune with the sun behind it
  taiba: (
    <>
      <circle cx="17" cy="8" r="2.5" />
      <path d="M2 19 q4-8 8-4 t5-1 t7 5" />
      <path d="M2 21 h20" />
    </>
  ),
  // Lago de Patos — still lagoon water
  patos: (
    <>
      <path d="M3 10 h13 M6 14 h14 M3 18 h11" />
      <circle cx="20" cy="6" r="2" />
    </>
  ),
  // Ilha do Guajiru — the island in the flat water
  guajiru: (
    <>
      <path d="M7 12 q5-5 10 0 Z" />
      <path d="M12 9.5 V7" />
      <path d="M2 16 h20 M5 19.5 h14" />
    </>
  ),
  // Prea — the windiest of them: streaming wind lines
  prea: (
    <>
      <path d="M2 8 h13 a2.5 2.5 0 1 0 -2.5 -2.5" />
      <path d="M2 13 h16 a2.5 2.5 0 1 1 -2.5 2.5" />
      <path d="M2 18 h9 a2 2 0 1 0 -2 -2" />
    </>
  ),
  // Jericoacoara — Pedra Furada, the pierced rock arch
  jeri: (
    <>
      <path d="M3 20 V13 q3-8 9-8 t9 8 v7" />
      <path d="M9 20 v-4 a3 3 0 0 1 6 0 v4" />
      <path d="M2 20.5 h20" />
    </>
  ),
  // Guriu — mangrove roots in the river
  guriu: (
    <>
      <path d="M12 15 V6" />
      <path d="M12 9 l-4-3 M12 9 l4-3 M12 12.5 l-3.5-2.5 M12 12.5 l3.5-2.5" />
      <path d="M12 15 l-4 5 M12 15 l4 5 M12 15 v5" />
      <path d="M3 20.5 h18" />
    </>
  ),
  // Tatajuba — the enormous dunes
  tatajuba: (
    <>
      <path d="M2 17 q5-11 10-4 t10-2" />
      <path d="M2 20.5 q6-4 11 0 t9-1" />
    </>
  ),
  // Camocim — the jangada, the local fishing sail
  camocim: (
    <>
      <path d="M11 16 V4 l7 9 Z" />
      <path d="M3 17.5 h18 l-2.5 3.5 H5.5 Z" />
    </>
  ),
  // Atins — the Lencois: dune ridges with rainwater lagoons between them
  atins: (
    <>
      <path d="M2 9 q4-4 8 0 t8 0 M2 15 q4-4 8 0 t8 0" />
      <path d="M5 12 h5 M14 18 h6" />
      <path d="M20 9 q1.5-1.5 2 0" />
    </>
  ),
}

export function SpotIcon({ slug, className }: { slug: string; className?: string }) {
  const marks = SPOT_PATHS[slug]
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {marks ?? SPOT_PATHS.nida}
    </svg>
  )
}

// ─── Season marks ─────────────────────────────────────────────
// One per leg of the rotation. The season is the rider's, not the
// hemisphere's — the snowflake marks the months he leaves winter behind,
// which is exactly why it points at Brazil.

const SEASON_PATHS: Record<string, React.ReactNode> = {
  // Summer — full sun
  summer: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5 v2.6 M12 18.9 v2.6 M2.5 12 h2.6 M18.9 12 h2.6 M5.2 5.2 l1.9 1.9 M16.9 16.9 l1.9 1.9 M18.8 5.2 l-1.9 1.9 M7.1 16.9 l-1.9 1.9" />
    </>
  ),
  // Fall and spring — one leaf, one bud on the same stem
  shoulder: (
    <>
      <path d="M12 21 V8" />
      <path d="M12 13 c-4.5 0-6.5-2.5-6.5-6.5 4 0 6.5 2 6.5 6.5 Z" />
      <path d="M12 10.5 c3.5 0 5.5-2 5.5-5.5-3.5 0-5.5 2-5.5 5.5 Z" />
    </>
  ),
  // Winter — six-point flake
  winter: (
    <>
      <path d="M12 2.5 v19 M3.8 7.2 l16.4 9.6 M20.2 7.2 l-16.4 9.6" />
      <path d="M9 5 l3 3 3-3 M9 19 l3-3 3 3" />
      <path d="M4.6 11 l.3 3.5 3-1.8 M19.4 11 l-.3 3.5 -3-1.8" />
      <path d="M4.6 13 l.3-3.5 3 1.8 M19.4 13 l-.3-3.5 -3 1.8" />
    </>
  ),
}

export function SeasonIcon({ season, className = 'w-3.5 h-3.5' }: { season: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {SEASON_PATHS[season] ?? SEASON_PATHS.summer}
    </svg>
  )
}

export function WaveDivider({ className = 'w-16 h-2 text-surf-teal shrink-0' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 8" className={className} aria-hidden="true">
      <path
        d="M0 4 Q 7.5 0, 15 4 T 30 4 T 45 4 T 60 4 T 75 4 T 90 4 T 105 4 T 120 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
