/**
 * Kite planner design assets — one icon per spot, plus the wave divider.
 * Shared by /wind and /exec so both surfaces draw the same marks.
 */

export function SpotIcon({ slug, className }: { slug: string; className?: string }) {
  if (slug === 'sventoji') {
    // Home spot — house above a wave
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 11 L12 4.5 L20 11" />
        <path d="M6.5 9.5 V16 H17.5 V9.5" />
        <path d="M3 20 Q6 18 9 20 T15 20 T21 20" />
      </svg>
    )
  }
  if (slug === 'svencele') {
    // Pro kite center — LEI kite canopy with lines to the rider
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5 Q12 2 20 9.5 Q12 6.5 4 9.5 Z" fill="currentColor" stroke="none" />
        <path d="M5.5 9.5 L11 20" />
        <path d="M18.5 9.5 L13 20" />
        <path d="M10 20.5 L14 20.5" />
      </svg>
    )
  }
  if (slug === 'liepaja') {
    // Liepaja — lighthouse for the city where the wind is born
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 20 L10.8 7 H13.2 L14 20" />
        <path d="M9.5 9.5 H14.5" />
        <path d="M10.5 7 V4.5 H13.5 V7" />
        <path d="M7 5.5 L8.8 6.2 M17 5.5 L15.2 6.2" />
        <path d="M7 20 H17" />
      </svg>
    )
  }
  // Nida — sailboat for the Hamptons of Lithuania
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 V16.5" />
      <path d="M12 5 L18 14.5 H12 Z" />
      <path d="M11 7.5 L6.5 14.5 H11 Z" />
      <path d="M4.5 17 H19.5 L17 20 H7 Z" />
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
