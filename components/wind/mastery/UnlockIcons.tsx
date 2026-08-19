/**
 * Badge icons for kite life unlocks — one line-art SVG per unlock,
 * keyed by the `icon` field on LIFE_UNLOCKS. Stroke follows currentColor
 * so the badge medallion controls the color (white when unlocked,
 * muted when locked).
 */

const PATHS: Record<string, React.ReactNode> = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
  plane: (
    <>
      <path d="M21 3L3 10.5l7 3L13.5 21 21 3z" />
      <path d="M10 13.5L21 3" />
    </>
  ),
  dunes: (
    <>
      <path d="M2 18q5-8 10 0t10 0" />
      <circle cx="17" cy="7" r="2.5" />
    </>
  ),
  route: (
    <>
      <path d="M4 19c4 0 4-7 8-7s4-7 8-7" strokeDasharray="2.5 2.5" />
      <circle cx="20" cy="5" r="2" />
      <circle cx="4" cy="19" r="1.5" />
    </>
  ),
  snowflake: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
      <path d="M9.5 5.5L12 8l2.5-2.5M9.5 18.5L12 16l2.5 2.5" />
    </>
  ),
  summit: (
    <>
      <path d="M3 20L10 7l4 6 3-4 4 11" />
      <path d="M10 7V3.5h3.5l-1.2 1.2 1.2 1.2H10" />
    </>
  ),
  tablemountain: (
    <>
      <path d="M3 20L7 9h10l4 11" />
      <path d="M8 5.5h8" />
    </>
  ),
  podium: (
    <>
      <path d="M3 20v-8h6v8M9 20V8h6v12M15 20v-5h6v5" />
      <path d="M2 20h20" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="8" width="12" height="9" rx="1.5" />
      <path d="M15 11l6-2.5v8L15 14" />
    </>
  ),
  lagoon: (
    <>
      <path d="M7 20c0-5 1-8 3-11" />
      <path d="M10 9C8 6 5 6 3.5 7.5M10 9c0-3.5 2.5-5 4.5-4.5M10 9c3-1.5 5.5-.5 6.5 1.5" />
      <path d="M13 16h8M15 19.5h6" />
    </>
  ),
  scorecard: (
    <>
      <rect x="5" y="5" width="14" height="16" rx="1.5" />
      <path d="M9 5V3.5h6V5" />
      <path d="M8.5 13.5l2.5 2.5 4.5-5.5" />
    </>
  ),
  clapper: (
    <>
      <rect x="3" y="10" width="18" height="8" rx="1" />
      <path d="M3.5 10L5 5.5h16L19.5 10" />
      <path d="M8.5 5.5L7 10M13 5.5L11.5 10M17.5 5.5L16 10" />
    </>
  ),
  wavesun: (
    <>
      <path d="M2 18c3 0 3-5 7-5 3.5 0 4.5 5 8 5h5" />
      <circle cx="18" cy="7" r="2.5" />
    </>
  ),
  barrel: (
    <>
      <path d="M4 19C4 8 14 4 19 8c3 2.5 2 7-2 7-2.5 0-3.5-2.5-2-4" />
      <path d="M4 19h16" />
    </>
  ),
  reefpeak: (
    <>
      <path d="M2 19C7 19 9 5 13 5c2.5 0 4 4 8 7" />
      <path d="M13 5c-1 4-1 9 1 14" />
    </>
  ),
  crew: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-4 3-6 6-6s6 2 6 6" />
      <path d="M15.5 5.5c2 .5 3 2 3 4s-1 3.5-3 4M16.5 14.5c2.8.4 4.5 2.5 4.5 5.5" />
    </>
  ),
  horizonsun: (
    <>
      <path d="M7 15a5 5 0 0 1 10 0" />
      <path d="M3 15h18M6 19h12" />
      <path d="M12 5v2.5M5.5 8l1.8 1.8M18.5 8l-1.8 1.8" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5.5-5.5 2 2-5.5 5.5-2z" />
    </>
  ),
}

export function UnlockIcon({ id, className = 'w-5 h-5' }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[id] ?? PATHS.globe}
    </svg>
  )
}
