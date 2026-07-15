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
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 lg:h-screen lg:overflow-hidden">
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
