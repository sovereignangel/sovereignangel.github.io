'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import SiteFooter from '@/components/SiteFooter'
import { CourseDivider, SportIcon } from '@/components/ironman/IronmanIcons'

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

  return (
    <div className="min-h-screen" style={{ background: IRON_BACKDROP }}>
      <header className="max-w-[1200px] mx-auto px-3 md:px-4 pt-3 md:pt-5 pb-2">
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-iron-deep whitespace-nowrap">
            Ironman <span className="text-iron-burgundy">&mdash;</span> Build
          </h1>
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
