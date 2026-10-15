'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import SiteFooter from '@/components/SiteFooter'
import { CourseDivider, SportIcon } from '@/components/ironman/IronmanIcons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getPlanDay, daysToRace, todayLocal, type TargetRace } from '@/lib/ironman/plan'
import { useIronmanTarget } from '@/components/ironman/useIronmanTarget'

/**
 * Two questions, two tabs.
 *
 * Training answers "what do I do today, and is the body fit to do it" — it is
 * forward-looking and it changes every morning. Performance answers "what did
 * the last race actually say" — it is backward-looking and it changes only
 * when a race happens. They share a header because they are one campaign, and
 * they are separate pages because mixing a plan with a post-mortem makes both
 * harder to read.
 */
const TABS = [
  { href: '/ironman', label: 'Overview' },
  { href: '/ironman/performance', label: 'Performance' },
  { href: '/ironman/opportunities', label: 'Opportunities' },
] as const

function IronmanTabs() {
  const pathname = usePathname()
  return (
    <nav aria-label="Ironman" className="flex items-center justify-end gap-3.5">
      {TABS.map((t) => {
        const active = t.href === '/ironman' ? pathname === '/ironman' : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`font-serif text-[12.5px] pb-[3px] border-b-2 transition-colors ${
              active
                ? 'text-[#f6ecdc] font-semibold border-iron-gold'
                : 'text-[#c9a3a0] border-transparent hover:text-[#f6ecdc]'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Where the block calendar says he is right now. The kite masthead carries a
 * chip naming the leg of the rotation it is showing; this is the same chip
 * for the same reason — the phase is the one fact that changes what every
 * number below it means, and it belongs beside the title, not buried in a
 * card.
 */
function currentPhase(target: TargetRace | null): string | null {
  return getPlanDay(todayLocal(), target)?.phase ?? null
}

// Blush into the same warm sand the kite planner lands on, so the two
// sections feel like one publication with different accents.
const IRON_BACKDROP = 'linear-gradient(180deg, #5e1a1f 0%, #4a1418 280px, #3f1115 100%)'

function IronmanLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { target } = useIronmanTarget()

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: IRON_BACKDROP }}>
        <div className="max-w-[1440px] mx-auto px-2 md:px-3 py-5">
          <div className="h-7 w-64 bg-iron-rule-light rounded-lg animate-pulse mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-iron-card border border-iron-rule rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthGate />
  }

  const phase = currentPhase(target)
  const toRace = target ? daysToRace(todayLocal(), target.date) : -1

  return (
    <div className="min-h-screen" style={{ background: IRON_BACKDROP }}>
      {/* One row: the title on the left, the tabs under the sport marks on the
          right. A full row spent on two tab labels is a row the race does not
          get — the same trade the Lordas console makes. */}
      <header className="max-w-[1440px] mx-auto px-2 md:px-3 pt-2 md:pt-3 pb-2 flex items-start gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <h1 className="font-serif text-[17px] md:text-[20px] font-semibold uppercase tracking-[2px] text-[#f6ecdc] whitespace-nowrap">
            Ironman <span className="text-iron-gold">&mdash;</span> Build
          </h1>
          {phase && (
            <span
              className="hidden sm:flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-iron-gold border border-iron-gold/50 px-1.5 py-0.5 shrink-0"
              title={toRace >= 0 ? `Current block of the plan · ${target?.name || 'next race'} is T−${toRace} days away` : 'Current block of the plan · no race picked yet'}
            >
              {phase}
              {toRace >= 0 && <span className="text-[#c9a3a0]">&middot; T&minus;{toRace}</span>}
            </span>
          )}
          <span className="hidden md:block">
            <CourseDivider className="w-16 h-2 text-iron-gold/70 shrink-0" />
          </span>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1 shrink-0">
          <span className="flex items-center gap-2">
            {(['swim', 'bike', 'run'] as const).map(sport => (
              <SportIcon key={sport} sport={sport} className="w-4 h-4 text-iron-gold" />
            ))}
          </span>
          <IronmanTabs />
        </div>
      </header>
      <main className="max-w-[1440px] mx-auto px-2 md:px-3 pb-4">{children}</main>
      <SiteFooter className="!text-[#a8807f]" />
    </div>
  )
}

export default function IronmanLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <IronmanLayoutInner>{children}</IronmanLayoutInner>
    </AuthProvider>
  )
}
