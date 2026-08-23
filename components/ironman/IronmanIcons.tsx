/**
 * Ironman design assets — line-art icons drawn on the same grid and stroke
 * weight as the kite planner's SpotIcon set (24x24, 1.8 stroke, round caps),
 * so the two sections read as one family with different accents.
 */

import type { Sport } from '@/lib/ironman/plan'

const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/** Freestyle swimmer over open water */
function SwimIcon({ className }: { className?: string }) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="15" cy="7.2" r="1.9" />
      <path d="M3.5 13.8 L10 11.2 L14.6 12.8" />
      <path d="M16.8 9.6 L20.5 6.8" />
      <path d="M3 19 Q6 17 9 19 T15 19 T21 19" />
    </svg>
  )
}

/** Road bike, diamond frame */
function BikeIcon({ className }: { className?: string }) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="5.6" cy="16.4" r="3.6" />
      <circle cx="18.4" cy="16.4" r="3.6" />
      <path d="M5.6 16.4 L10.2 16.4 L13.6 8.8 L18.4 16.4" />
      <path d="M10.2 16.4 L14.2 8.8" />
      <path d="M12.4 8.8 L16 8.8" />
    </svg>
  )
}

/** Runner mid-stride */
function RunIcon({ className }: { className?: string }) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="14.6" cy="4.9" r="1.9" />
      <path d="M13.6 9 L10.2 12.6 L11.8 16 L9.6 20.4" />
      <path d="M13.6 9 L16.6 12.2 L16.2 16.6" />
      <path d="M13.8 9.6 L17.8 8.2" />
      <path d="M11.6 10.6 L7.8 9.2" />
    </svg>
  )
}

/** Brick session — bike straight into a run, drawn as stacked courses */
function BrickIcon({ className }: { className?: string }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M3 7.5 H13.5 V11.5 H3 Z" />
      <path d="M10.5 13 H21 V17 H10.5 Z" />
      <path d="M6.8 13 V17" />
      <path d="M17.2 7.5 V11.5" />
    </svg>
  )
}

/** Kettlebell — strength and core work */
function StrengthIcon({ className }: { className?: string }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M9.2 8.6 a2.9 2.9 0 0 1 5.6 0" />
      <path d="M9.2 8.6 C6.6 10.2 5.6 13 6.6 15.6 A6 6 0 0 0 17.4 15.6 C18.4 13 17.4 10.2 14.8 8.6 Z" />
    </svg>
  )
}

/** Crescent — a true rest day */
function RestIcon({ className }: { className?: string }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M19.2 14.6 A7.6 7.6 0 1 1 10.4 5.2 A6 6 0 0 0 19.2 14.6 Z" />
    </svg>
  )
}

const SPORT_ICON: Record<Sport, (p: { className?: string }) => JSX.Element> = {
  swim: SwimIcon,
  bike: BikeIcon,
  run: RunIcon,
  brick: BrickIcon,
  strength: StrengthIcon,
  rest: RestIcon,
}

export function SportIcon({ sport, className }: { sport: Sport; className?: string }) {
  const Icon = SPORT_ICON[sport]
  return <Icon className={className} />
}

/** Course elevation profile — the ironman answer to the kite page's wave divider */
export function CourseDivider({ className = 'w-16 h-2 text-iron-burgundy shrink-0' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 8" className={className} aria-hidden="true">
      <path
        d="M0 6.5 L14 6.5 L23 2.5 L32 6 L46 3.2 L58 6.5 L71 4 L85 6.8 L97 3.4 L109 6.5 L120 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Finish banner — used on race countdowns */
export function FinishFlag({ className }: { className?: string }) {
  return (
    <svg {...BASE} className={className}>
      <path d="M5.5 3.5 V20.5" />
      <path d="M5.5 5 H18.5 V13 H5.5" />
      <path d="M12 5 V13" />
      <path d="M5.5 9 H18.5" />
    </svg>
  )
}
