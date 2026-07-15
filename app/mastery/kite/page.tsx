'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import { KiteMasteryDashboard } from '@/components/mastery/kite/KiteMasteryDashboard'

function KiteMasteryInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
        <div className="h-8 w-64 bg-rule-light rounded-sm animate-pulse mb-4" />
        <div className="h-[400px] bg-paper border border-rule rounded-sm animate-pulse" />
      </main>
    )
  }

  if (!user) {
    return <AuthGate />
  }

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
      <header className="mb-3 pb-2 border-b-2 border-ink">
        <h1 className="font-serif text-[22px] font-bold text-ink tracking-tight leading-none">
          Kite Mastery
        </h1>
        <p className="text-[11px] text-ink-muted mt-1">
          Palanga Sprint · Jul 14 — Sep 26 · Belt progression, Surfr KPIs, hours on water
        </p>
      </header>
      <KiteMasteryDashboard uid={user.uid} />
    </main>
  )
}

export default function KiteMasteryPage() {
  return (
    <AuthProvider>
      <KiteMasteryInner />
    </AuthProvider>
  )
}
