'use client'

import { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import ThesisNav from '@/components/thesis/ThesisNav'

function ThesisLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    document.body.classList.add('thesis-active')
    return () => document.body.classList.remove('thesis-active')
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-serif text-[14px] italic text-ink-muted">Loading...</div>
      </div>
    )
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
