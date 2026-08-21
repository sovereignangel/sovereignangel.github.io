'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'

function IronmanLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
          <div className="h-8 w-64 bg-rule-light rounded-sm animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-paper border border-rule rounded-sm animate-pulse" />
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
    <div className="min-h-screen bg-cream">
      <header className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 pb-3">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-[20px] font-bold text-ink tracking-tight">
              Ironman Build
            </h1>
            <span className="font-serif text-[12px] italic text-ink-muted hidden sm:inline">
              Belgrade Sep 13, then peak in New York Sep 26 — the plan adapts to your Garmin every day
            </span>
          </div>
          <span className="font-serif text-[11px] uppercase tracking-[0.5px] text-burgundy font-semibold">
            Swim · Bike · Run
          </span>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-6">{children}</main>
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
