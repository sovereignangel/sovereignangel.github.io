import { TERRACOTTA, PAPER, INK, MUTED, RULE } from '../goals-theme'

export function ColumnHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-serif text-[15px] font-semibold uppercase tracking-[0.5px]" style={{ color: TERRACOTTA }}>
        {title}
      </h2>
      <p className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>
        {subtitle}
      </p>
    </div>
  )
}

export function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="rounded-sm border p-3 mb-3"
      style={{ backgroundColor: PAPER, borderColor: RULE, borderTop: accent ? `3px solid ${accent}` : undefined }}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-serif text-[13px] font-semibold mb-1" style={{ color: INK }}>
      {children}
    </p>
  )
}

export function Tag({ children, color = MUTED }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-sm border mr-1 mb-1 inline-block"
      style={{ color, borderColor: RULE, backgroundColor: `${color}0d` }}
    >
      {children}
    </span>
  )
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-[10px] uppercase tracking-[0.5px] hover:underline"
      style={{ color: TERRACOTTA }}
    >
      {children} →
    </a>
  )
}
