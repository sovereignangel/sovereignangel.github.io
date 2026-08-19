import Link from 'next/link'

const TABS = [
  { id: 'forecast', label: 'Forecast', href: '/wind' },
  { id: 'mastery', label: 'Mastery', href: '/wind/mastery' },
] as const

export type WindTabId = (typeof TABS)[number]['id']

export function WindTabs({ active }: { active: WindTabId }) {
  return (
    <nav className="flex gap-1" aria-label="Wind sections">
      {TABS.map(tab => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`font-serif text-[11px] md:text-[12px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
            tab.id === active
              ? 'bg-surf-teal text-white border-surf-teal'
              : 'bg-transparent text-surf-muted border-surf-rule hover:text-surf-deep hover:border-surf-teal/50'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
