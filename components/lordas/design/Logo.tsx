/**
 * The Lordas arms.
 *
 * v3 is a full heraldic achievement — sun in splendour, helm, mantling,
 * shield and banner — so it ships as artwork rather than being redrawn flat.
 * It is cut into two pieces because an achievement does not survive being
 * shrunk: at 34px the whole thing is an unreadable blob, while the shield
 * alone still reads as a shield carrying the device. Hero gets the lockup,
 * navigation gets the shield.
 *
 * The line-art sigils stay for the places a 12px glyph is what the layout
 * needs — a person's name in a table row is not a place for a coat of arms.
 */

const LOCKUP_H_RATIO = 600 / 927
const LOCKUP_RATIO = 600 / 927

/**
 * The whole achievement, at header size.
 *
 * Below about 64px tall the helm and mantling collapse and it reads as a blob;
 * 68 is the smallest height at which it is still legibly a coat of arms. The
 * shield-only cut remains available for anywhere that cannot afford that.
 */
export function LordasLogo({ height = 68, className }: { height?: number; className?: string }) {
  return (
    <img
      src="/lordas/lockup.webp"
      alt="Lordas — Possibility × Feasibility"
      width={Math.round(height * LOCKUP_H_RATIO)}
      height={height}
      className={className}
      style={{ display: 'block', flexShrink: 0, height, width: 'auto' }}
    />
  )
}

/** The shield alone, for anywhere the full achievement will not fit. */
export function LordasShield({ height = 38, className }: { height?: number; className?: string }) {
  return (
    <img
      src="/lordas/shield.webp"
      alt="Lordas"
      width={Math.round(height * (220 / 249))}
      height={height}
      className={className}
      style={{ display: 'block', flexShrink: 0, height, width: 'auto' }}
    />
  )
}

/** The whole achievement, banner and all. For the gate. */
export function LordasLockup({ width = 290, className }: { width?: number; className?: string }) {
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
