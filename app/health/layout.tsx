'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import SiteFooter from '@/components/SiteFooter'

// The Ironman sheet's exact ground. Training load on that page, inputs and
// bloodwork on this one — one body, so one stock.
const HEALTH_BACKDROP = 'linear-gradient(180deg, #f4e7e5 0%, #f2ecdf 320px)'

function HealthLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: HEALTH_BACKDROP }}>
        <div className="max-w-[1200px] mx-auto px-3 md:px-4 py-5">
          <div className="h-7 w-64 bg-iron-rule-light rounded-lg animate-pulse mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-iron-card border border-iron-rule rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <AuthGate />

  return (
    <div className="min-h-screen" style={{ background: HEALTH_BACKDROP }}>
      <header className="max-w-[1200px] mx-auto px-3 md:px-4 pt-3 md:pt-5 pb-2">
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-iron-deep whitespace-nowrap">
            Health <span className="text-iron-burgundy">&mdash;</span> Inputs
          </h1>
          <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wide text-iron-burgundy bg-iron-burgundy-bg border border-iron-burgundy/25 rounded-full px-1.5 py-0.5 shrink-0">
            Supplements
          </span>
          <span className="hidden lg:inline text-[10px] text-iron-muted">
            The stack, what it is for, and what would show if it worked &middot; bloods and Garmin correlation next
          </span>
          <a
            href="/ironman"
            className="ml-auto font-mono text-[9px] uppercase tracking-wide text-iron-muted hover:text-iron-burgundy no-underline shrink-0"
          >
            Ironman &rarr;
          </a>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-3 md:px-4 pb-6">{children}</main>
      <SiteFooter />
    </div>
  )
}

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HealthLayoutInner>{children}</HealthLayoutInner>
    </AuthProvider>
  )
}
