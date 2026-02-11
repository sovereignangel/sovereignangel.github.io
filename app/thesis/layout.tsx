'use client'

import { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import ThesisNav from '@/components/thesis/ThesisNav'

function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Nav skeleton */}
      <header className="bg-paper border-b-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-baseline gap-3">
              <div className="h-6 w-36 bg-rule-light rounded-sm animate-pulse" />
              <div className="hidden sm:block h-4 w-72 bg-rule-light/60 rounded-sm animate-pulse" />
            </div>
            <div className="h-4 w-28 bg-rule-light rounded-sm animate-pulse" />
          </div>
          <div className="flex gap-1 pb-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 w-20 bg-rule-light/40 rounded-t-sm animate-pulse" />
            ))}
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-4">
          <div className="h-16 bg-paper border border-rule rounded-sm animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <div className="h-40 bg-paper border border-rule rounded-sm animate-pulse" />
              <div className="h-12 bg-navy/20 rounded-sm animate-pulse" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-52 bg-paper border border-rule rounded-sm animate-pulse" />
            </div>
          </div>
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
    <div className="min-h-screen">
      <ThesisNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}

export default function ThesisLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThesisLayoutInner>{children}</ThesisLayoutInner>
    </AuthProvider>
  )
}
