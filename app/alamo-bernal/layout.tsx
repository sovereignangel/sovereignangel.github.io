'use client'

import { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import ABAuthGate from '@/components/alamo-bernal/ABAuthGate'

const ALLOWED_EMAILS = [
  'sean@alamobernal.com',
  'loricorpuz@gmail.com',
]

function ABSkeleton() {
  return (
    <div className="h-screen overflow-hidden">
      <header className="bg-paper border-b-2 border-ink">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-baseline justify-between pt-2 pb-1">
            <div className="h-5 w-40 bg-rule-light rounded-sm animate-pulse" />
            <div className="h-3 w-20 bg-rule-light/60 rounded-sm animate-pulse" />
          </div>
          <div className="flex gap-1 pb-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-28 bg-rule-light/40 rounded-t-sm animate-pulse" />
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3">
        <div className="h-[500px] bg-paper border border-rule rounded-sm animate-pulse" />
      </main>
    </div>
  )
}

function AccessDenied() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-paper border border-rule rounded-sm p-12 max-w-md w-full text-center">
        <h1 className="font-serif text-[22px] font-bold text-ink mb-2">
          Access Restricted
        </h1>
        <p className="text-[13px] text-ink-muted mb-6">
          This site is only accessible to authorized partners of Alamo Bernal Investments.
        </p>
        <button
          onClick={signOut}
          className="font-serif text-[12px] text-burgundy hover:underline"
        >
          Sign out and try a different account
        </button>
      </div>
    </div>
  )
}

function ABLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    document.body.classList.add('alamo-active')
    return () => document.body.classList.remove('alamo-active')
  }, [])

  if (loading) return <ABSkeleton />
  if (!user) return <ABAuthGate />
  if (!ALLOWED_EMAILS.includes(user.email || '')) return <AccessDenied />

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {children}
    </div>
  )
}

export default function AlamoBernalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ABLayoutInner>{children}</ABLayoutInner>
    </AuthProvider>
  )
}
