/**
 * Pillar artifact SVG icons for Lordas.
 * Safety = Anchor, Growth = Spiral, Alignment = Compass
 */

interface IconProps {
  size?: number
  color?: string
  className?: string
}

export function AnchorIcon({ size = 24, color = '#b85c38', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="5" r="2.5" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="7.5" x2="12" y2="20" stroke={color} strokeWidth="1.5" />
      <path d="M6 14 C6 17.3 8.7 20 12 20 C15.3 20 18 17.3 18 14" stroke={color} strokeWidth="1.5" fill="none" />
      <line x1="9" y1="11" x2="15" y2="11" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function SpiralIcon({ size = 24, color = '#b85c38', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 12 C12 10 14 8 16 8 C18 8 20 10 20 12 C20 16 16 20 12 20 C6 20 4 16 4 12 C4 6 8 2 14 2"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CompassIcon({ size = 24, color = '#b85c38', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.2" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <path d="M12 4 L13 10.5 L12 12 L11 10.5 Z" fill={color} opacity="0.9" />
      <path d="M12 20 L13 13.5 L12 12 L11 13.5 Z" fill={color} opacity="0.35" />
      <path d="M4 12 L10.5 11 L12 12 L10.5 13 Z" fill={color} opacity="0.35" />
      <path d="M20 12 L13.5 11 L12 12 L13.5 13 Z" fill={color} opacity="0.9" />
    </svg>
  )
}
