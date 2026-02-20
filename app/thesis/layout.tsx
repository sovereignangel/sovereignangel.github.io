'use client'

import { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import ThesisNav from '@/components/thesis/ThesisNav'
import DailyLogProvider from '@/components/thesis/DailyLogProvider'

function DashboardSkeleton() {
  return (
    <div className="h-screen overflow-hidden">
      {/* Nav skeleton */}
      <header className="bg-paper border-b-2 border-ink">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-baseline gap-3">
              <div className="h-5 w-32 bg-rule-light rounded-sm animate-pulse" />
              <div className="hidden sm:block h-3 w-56 bg-rule-light/60 rounded-sm animate-pulse" />
            </div>
            <div className="h-4 w-28 bg-rule-light rounded-sm animate-pulse" />
          </div>
          <div className="flex gap-0.5 pb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-24 bg-rule-light/40 rounded-t-sm animate-pulse" />
            ))}
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          <div className="h-[500px] bg-paper border border-rule rounded-sm animate-pulse" />
          <div className="h-[500px] bg-paper border border-rule rounded-sm animate-pulse" />
        </div>
      </main>
    </div>
  )
}

function ThesisLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    document.body.classList.add('thesis-active')
    return () => document.body.classList.remove('thesis-active')
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return <AuthGate />
  }

  return (
    <DailyLogProvider>
      <div className="h-screen overflow-hidden flex flex-col">
        <ThesisNav />
        <main className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pt-0.5 pb-1">
          {children}
        </main>
      </div>
    </DailyLogProvider>
  )
}

export default function ThesisLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThesisLayoutInner>{children}</ThesisLayoutInner>
    </AuthProvider>
  )
}
