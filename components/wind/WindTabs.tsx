import Link from 'next/link'
import { KITE_REGIONS } from '@/lib/kite/regions'
import { SeasonIcon } from './WindIcons'

export type WindTabId = 'lithuania' | 'nyc' | 'brazil' | 'mastery'

/** Which leg of the rotation the calendar says he is on right now. */
function currentRegionId(): string {
  const month = new Date().getMonth() + 1
  return KITE_REGIONS.find(r => r.activeMonths.includes(month))?.id ?? 'lithuania'
}

const PILL = 'font-serif text-[11px] md:text-[12px] font-medium px-2 md:px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1'
const ON = 'bg-surf-teal text-white border-surf-teal'
const OFF = 'bg-transparent text-surf-muted border-surf-rule hover:text-surf-deep hover:border-surf-teal/50'

export function WindTabs({ active }: { active: WindTabId }) {
  const now = currentRegionId()
  return (
    <nav className="flex items-center gap-1" aria-label="Wind sections">
      {KITE_REGIONS.map(region => {
        const on = region.id === active
        return (
          <Link
            key={region.id}
            href={region.href}
            className={`${PILL} ${on ? ON : OFF}`}
            title={`${region.name} — ${region.seasonLabel} (${region.months})${region.id === now ? ' · in season now' : ''}`}
          >
            <SeasonIcon season={region.season} className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
            <span className="hidden sm:inline">{region.short}</span>
            <span className="sm:hidden">{region.abbr}</span>
            {region.id === now && (
              <span
                className={`inline-block w-1 h-1 rounded-full shrink-0 ${on ? 'bg-white' : 'bg-surf-teal'}`}
                aria-label="in season now"
              />
            )}
          </Link>
        )
      })}
      <span className="w-px h-4 bg-surf-rule mx-0.5 shrink-0" aria-hidden="true" />
      <Link href="/wind/mastery" className={`${PILL} ${active === 'mastery' ? ON : OFF}`}>
        Mastery
      </Link>
    </nav>
  )
}
