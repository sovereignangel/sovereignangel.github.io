'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'

function TantraInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1ea]">
        <div className="font-serif text-[13px] uppercase tracking-[0.5px] text-burgundy">
          Loading...
        </div>
      </div>
    )
  }

  if (!user) return <AuthGate />

  return <div className="min-h-screen bg-[#f5f1ea]">{children}</div>
}

export default function TantraLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TantraInner>{children}</TantraInner>
    </AuthProvider>
  )
}
