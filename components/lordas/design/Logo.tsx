/**
 * The Lordas logo.
 *
 * The v3 artwork is a rendered illustration — gradients, glow, bevels, smoke —
 * which the flat SVG marks could only ever approximate. It ships as artwork
 * rather than being redrawn, and the line-art sigils stay for the places a
 * 12px glyph is what the layout needs.
 *
 * Transparent background with a warm ambient glow, so it composites onto the
 * espresso ground without a visible plate behind it.
 */

const MARK_RATIO = 240 / 443
const LOCKUP_RATIO = 560 / 853

/** Sun, lens and ignition only — no wordmark. For nav and headers. */
export function LordasLogo({ height = 38, className }: { height?: number; className?: string }) {
  return (
    <img
      src="/lordas/mark.webp"
      alt="Lordas"
      width={Math.round(height * MARK_RATIO)}
      height={height}
      className={className}
      style={{ display: 'block', flexShrink: 0, height, width: 'auto' }}
    />
  )
}

/** The full lockup, mark over Possibility × Feasibility. For the gate. */
export function LordasLockup({ width = 300, className }: { width?: number; className?: string }) {
  return (
    <img
      src="/lordas/lockup.webp"
      alt="Lordas — Possibility × Feasibility"
      width={width}
      height={Math.round(width / LOCKUP_RATIO)}
      className={className}
      style={{ display: 'block', width, height: 'auto', margin: '0 auto' }}
    />
  )
}
