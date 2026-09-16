'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import SiteFooter from '@/components/SiteFooter'
import { CourseDivider, SportIcon } from '@/components/ironman/IronmanIcons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PLAN, RACE_NYC, daysToRace, todayLocal } from '@/lib/ironman/plan'

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
  { href: '/ironman', label: 'Training' },
  { href: '/ironman/performance', label: 'Performance' },
] as const

function IronmanTabs() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-4 border-b border-iron-rule mt-2">
      {TABS.map((t) => {
        const active = t.href === '/ironman' ? pathname === '/ironman' : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`font-serif text-[14px] md:text-[15px] pb-1.5 -mb-px border-b-2 transition-colors ${
              active
                ? 'text-iron-burgundy font-semibold border-iron-burgundy'
                : 'text-iron-muted border-transparent hover:text-iron-deep'
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
function currentPhase(): string | null {
  const today = todayLocal()
  const day = PLAN.find(d => d.date === today) ?? [...PLAN].reverse().find(d => d.date <= today)
  return day?.phase ?? null
}

// Blush into the same warm sand the kite planner lands on, so the two
// sections feel like one publication with different accents.
const IRON_BACKDROP = 'linear-gradient(180deg, #f4e7e5 0%, #f2ecdf 320px)'

function IronmanLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: IRON_BACKDROP }}>
        <div className="max-w-[1200px] mx-auto px-3 md:px-4 py-5">
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

  const phase = currentPhase()
  const toNyc = daysToRace(todayLocal(), RACE_NYC.date)

  return (
    <div className="min-h-screen" style={{ background: IRON_BACKDROP }}>
      <header className="max-w-[1200px] mx-auto px-3 md:px-4 pt-3 md:pt-5 pb-2">
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-iron-deep whitespace-nowrap">
            Ironman <span className="text-iron-burgundy">&mdash;</span> Build
          </h1>
          {phase && (
            <span
              className="hidden sm:flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-iron-burgundy bg-iron-burgundy-bg border border-iron-burgundy/25 rounded-full px-1.5 py-0.5 shrink-0"
              title={`Current block of the plan · New York is T−${toNyc} days away`}
            >
              {phase}
              {toNyc >= 0 && <span className="text-iron-muted">&middot; T&minus;{toNyc}</span>}
            </span>
          )}
          <span className="hidden md:block">
            <CourseDivider />
          </span>
          <span className="hidden lg:inline text-[10px] text-iron-muted">
            Belgrade Sep 13 &middot; peak in New York Sep 26 &middot; the plan adapts to Garmin daily
          </span>
          <span className="ml-auto flex items-center gap-2 shrink-0">
            {(['swim', 'bike', 'run'] as const).map(sport => (
              <SportIcon key={sport} sport={sport} className="w-4 h-4 md:w-[18px] md:h-[18px] text-iron-burgundy" />
            ))}
          </span>
        </div>
        <IronmanTabs />
      </header>
      <main className="max-w-[1200px] mx-auto px-3 md:px-4 pb-6">{children}</main>
      <SiteFooter />
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
