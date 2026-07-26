'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'

function GarminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
          <div className="h-8 w-64 bg-rule-light rounded-sm animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-paper border border-rule rounded-sm animate-pulse" />
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
              Loribel Health
            </h1>
            <span className="font-serif text-[12px] italic text-ink-muted hidden sm:inline">
              Garmin intelligence — sleep first, then training and recovery
            </span>
          </div>
          <span className="font-serif text-[11px] uppercase tracking-[0.5px] text-burgundy font-semibold">
            Sleep · Fitness · Training
          </span>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-6">{children}</main>
    </div>
  )
}

export default function GarminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GarminLayoutInner>{children}</GarminLayoutInner>
    </AuthProvider>
  )
}
