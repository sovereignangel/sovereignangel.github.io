// Shared brand primitives for the Mahāmudrā site.
// Palette and rules: see MAHAMUDRA_BRAND_STRATEGY.md at repo root.

export const C = {
  parchment: '#ede1c1',
  parchmentLight: '#f6efdd',
  parchmentDeep: '#e3d3a9',
  aubergine: '#3d2b56',
  aubergineDeep: '#2e2043',
  sepia: '#5b4c36',
  sepiaMuted: '#8a7757',
  bronze: '#9c7f4e',
  gold: '#d3b06a',
}

export const display = 'var(--font-cinzel), Georgia, serif'
export const text = 'var(--font-cormorant), Georgia, serif'

// —— ◆ —— section divider
export function Diamond({ color = C.aubergine, width = 180 }: { color?: string; width?: number }) {
  return (
    <div className="flex items-center justify-center gap-3 select-none" aria-hidden>
      <span style={{ width: width / 2, height: 1, backgroundColor: color, opacity: 0.5 }} />
      <svg width="9" height="9" viewBox="0 0 10 10">
        <rect x="1.8" y="1.8" width="6.4" height="6.4" transform="rotate(45 5 5)" fill={color} />
      </svg>
      <span style={{ width: width / 2, height: 1, backgroundColor: color, opacity: 0.5 }} />
    </div>
  )
}

// Etched ridgeline backdrop, low opacity — hero only.
export function Ridgeline({ opacity = 0.14 }: { opacity?: number }) {
  const s = { fill: 'none', stroke: C.sepia, strokeWidth: 1 }
  return (
    <svg
      viewBox="0 0 800 220"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-0 bottom-0 w-full h-full pointer-events-none"
      style={{ opacity }}
      aria-hidden
    >
      <path {...s} d="M-10 200 L80 120 L130 160 L210 70 L270 140 L330 100 L400 180 L460 90 L530 150 L610 60 L680 140 L740 110 L810 200" />
      <path {...s} strokeWidth={0.7} d="M-10 215 L60 165 L140 195 L230 130 L310 185 L390 150 L470 200 L560 140 L640 190 L720 160 L810 215" />
      <path {...s} strokeWidth={0.5} opacity={0.7} d="M-10 185 L100 145 L180 175 L260 115 L340 165 L430 125 L520 175 L600 115 L690 170 L810 150" />
    </svg>
  )
}

// Small-caps label line, the poster's "FACILITATED BY" voice.
export function Label({
  children,
  color = C.sepiaMuted,
  size = 11,
}: {
  children: React.ReactNode
  color?: string
  size?: number
}) {
  return (
    <div
      className="text-center uppercase"
      style={{ fontFamily: display, fontSize: size, letterSpacing: '0.28em', color }}
    >
      {children}
    </div>
  )
}
