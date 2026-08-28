/**
 * Lordas asset library — one 24-unit grid, 1.6 stroke, round caps and joins,
 * no fills except the Lori sigil.
 *
 * The mark is two nodes on a shared arc: the pair is the brand, not either
 * athlete. The sigils are those same two nodes pulled apart — Lori solid,
 * Aidas open — so an athlete's column is identifiable before the name is read.
 */

import { C } from './tokens'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

function Svg({ size = 16, color, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {children}
    </svg>
  )
}

/**
 * The Lordas mark — the union, not the pair.
 *
 * An earlier mark drew the two of them as two nodes on a shared arc, which
 * said "these are two people" and nothing else. This one says what they are
 * for: Lori's sun is a source, broad and undirected; Aidas' lens gives it
 * somewhere to go. Focused, the light stops being warmth and becomes a beam
 * that marks the ground and leaves smoke behind. Possibility is worth nothing
 * until something tests and aims it.
 *
 * Drawn as the shield carries it — orb, lens, ember — so the flat mark and the
 * artwork are the same device rather than two takes on one idea. Reads from
 * about 18px up; below that use a person sigil instead.
 */
export function LordasMark({
  size = 40, sunColor = C.sun, lensColor = C.lens, burnColor = C.crit, className,
}: IconProps & { sunColor?: string; lensColor?: string; burnColor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      {/* The device as the shield carries it: orb, lens, ember. */}
      <circle cx="12" cy="3.4" r="2.1" fill={sunColor} />
      <path d="M11 5.2 5.6 12M13 5.2 18.4 12" stroke={sunColor} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M4.4 12C7.6 8.4 16.4 8.4 19.6 12 16.4 15.6 7.6 15.6 4.4 12Z"
        fill="none" stroke={lensColor} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke={sunColor} strokeWidth={1.2} />
      <path d="M5.6 12 12 20.4M18.4 12 12 20.4" stroke={sunColor} strokeWidth={1.4} strokeLinecap="round" />
      <circle cx="12" cy="20.6" r="1.5" fill={burnColor} />
      <path d="M12 14.4v4.6" stroke={burnColor} strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  )
}

/**
 * Lori: the sun in splendour that crowns the arms.
 *
 * Rays alternate long straight and short wavy, which is how a heraldic sun is
 * drawn and what separates it from a generic asterisk. The face on the full
 * artwork is dropped — it does not survive below about 40px and the silhouette
 * carries the identity without it.
 */
export function LoriSigil({ size = 16, color = C.sun }: IconProps) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="4.1" fill={color} />
      {rays.map((deg, i) => {
        const a = (deg * Math.PI) / 180
        const long = i % 2 === 0
        const r1 = 5.6
        const r2 = long ? 11 : 8.4
        return (
          <line
            key={deg}
            x1={(12 + r1 * Math.cos(a)).toFixed(2)} y1={(12 + r1 * Math.sin(a)).toFixed(2)}
            x2={(12 + r2 * Math.cos(a)).toFixed(2)} y2={(12 + r2 * Math.sin(a)).toFixed(2)}
            stroke={color} strokeWidth={long ? 1.7 : 1.2} strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

/**
 * Aidas: the lens on the shield.
 *
 * The arms draw it as a pointed oval — a vesica — with a rimmed edge and a
 * reticle at its centre, which is why the colour is pewter rather than the
 * teal it used to be: that teal had no source in the artwork.
 */
export function AidasSigil({ size = 16, color = C.lens }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}>
      <path d="M2.4 12C6 7.2 18 7.2 21.6 12 18 16.8 6 16.8 2.4 12Z" />
      <circle cx="12" cy="12" r="3.1" />
      <circle cx="12" cy="12" r="0.9" fill={color} stroke="none" />
      <path d="M12 7.4v1.6M12 15v1.6M6.6 12h1.7M15.7 12h1.7" strokeWidth={1.3} />
    </svg>
  )
}

export function PersonSigil({ person, size, color }: { person: string; size?: number; color?: string }) {
  return person === 'aidas' ? <AidasSigil size={size} color={color} /> : <LoriSigil size={size} color={color} />
}

// ── Module glyphs ─────────────────────────────────────────────────────────

export function CompassIcon(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15.6 8.4 10.6 10.6 8.4 15.6l5-2.2z" /></Svg>
}
/**
 * Insights: a lightbulb. The module is where the relationship data turns into
 * something you did not already know, so the glyph is the moment of seeing it
 * — filament lit, not a diagram of nodes.
 */
export function LightbulbIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.6a6.2 6.2 0 0 1 3.7 11.2c-.75.55-1.2 1.3-1.3 2.2H9.6c-.1-.9-.55-1.65-1.3-2.2A6.2 6.2 0 0 1 12 2.6Z" />
      <path d="M9.9 18.6h4.2M10.7 21.2h2.6" />
      <path d="M10.3 12.4 12 8.9l1.7 3.5" />
    </Svg>
  )
}

export function FlagIcon(p: IconProps) {
  return <Svg {...p}><path d="M5.5 21V3" /><path d="M5.5 4.2h13l-2.8 4.2 2.8 4.2h-13" /></Svg>
}
export function SummitIcon(p: IconProps) {
  return <Svg {...p}><path d="M2.5 19.5 9 7l4 6.5L15.5 10l6 9.5z" /><path d="M9 7V2.5l4 1.4L9 5.3" /></Svg>
}

/**
 * Ironman: the three disciplines in one glyph, clustered rather than
 * sequenced — swim above, bike and run below. A single sport standing in for
 * the whole race was the wrong sign; the point of the module is that it is
 * three. Stroke is dialled back to 1.3 so the cluster does not blob at nav
 * size, and each mark keeps its own silhouette from the standalone icons.
 */
export function TrifectaIcon({ size = 16, color, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color ?? 'currentColor'} strokeWidth={1.3}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Swim — the wave, across the top */}
      <path d="M3.2 5.6c1.2-.9 2.4-.9 3.6 0s2.4.9 3.6 0 2.4-.9 3.6 0 2.4.9 3.5 0" />
      <path d="M14.9 2.1a1.35 1.35 0 1 1 .02 0" />

      {/* Bike — the wheels, lower left */}
      <circle cx="4.3" cy="18.4" r="3" />
      <circle cx="11.5" cy="18.4" r="3" />
      <path d="M4.3 18.4 6.6 13.9h2.6l2.3 4.5M6.6 13.9h1.8M6.6 13.9l.9 4.5" />

      {/* Run — the stride, lower right */}
      <circle cx="20.4" cy="10.3" r="1.35" />
      <path d="M16.4 21.4l1.7-2.6-1.4-1.7 1.7-2.5 2.1 1.3 1.6.3M18.1 18.8l1.9.8.7 1.8" />
    </svg>
  )
}

// ── Sport and condition glyphs ────────────────────────────────────────────

export function SwimIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2.5 17.5c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 3.2 1.2 4.6 0" />
      <path d="M6 13.2 11 10l4.5 2.2" /><circle cx="17.6" cy="7.6" r="1.9" />
    </Svg>
  )
}
export function BikeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="5.6" cy="16.4" r="3.6" /><circle cx="18.4" cy="16.4" r="3.6" />
      <path d="M5.6 16.4 9.6 8.6h4.6l4.2 7.8M9.6 8.6h3.2M9.6 8.6l1.4 7.8" />
    </Svg>
  )
}
export function RunIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="14.6" cy="5" r="2" />
      <path d="M8 20.5l3-4.6-2.4-3 3-4.4 3.6 2.2 2.8.6M11 15.9l3.4 1.4 1.2 3.2M8.6 9.1 5 10" />
    </Svg>
  )
}
export function CoreIcon(p: IconProps) {
  return <Svg {...p}><path d="M3.4 12h1.8M18.8 12h1.8M5.2 8.6v6.8M18.8 8.6v6.8M8.4 10.2v3.6M15.6 10.2v3.6M8.4 12h7.2" /></Svg>
}
export function KiteIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.2 20.4 9 12 12.6 3.6 9z" /><path d="M12 12.6v3.4" />
      <path d="M3.6 9l8.4 11.4M20.4 9 12 20.4" />
    </Svg>
  )
}
export function WindIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 8.4h10.2a2.7 2.7 0 1 0-2.7-2.7" />
      <path d="M3 13.6h13.6a2.9 2.9 0 1 1-2.9 2.9" /><path d="M3 18.6h6.4" />
    </Svg>
  )
}
export function FlatIcon(p: IconProps) {
  return <Svg {...p}><path d="M3.6 12h16.8" /><path d="M7.2 8.4h9.6M7.2 15.6h9.6" opacity={0.38} /></Svg>
}
export function ArrowIcon(p: IconProps) {
  return <Svg {...p}><path d="M4 12h14M13 7l5 5-5 5" /></Svg>
}
export function CalendarIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4M12 13v4M10 15h4" />
    </Svg>
  )
}

const SPORT_ICONS: Record<string, (p: IconProps) => JSX.Element> = {
  swim: SwimIcon, bike: BikeIcon, run: RunIcon, brick: BikeIcon,
  strength: CoreIcon, core: CoreIcon, rest: FlatIcon,
}

export function SportGlyph({ sport, size, color }: { sport: string; size?: number; color?: string }) {
  const Icon = SPORT_ICONS[sport] ?? FlatIcon
  return <Icon size={size} color={color} />
}
