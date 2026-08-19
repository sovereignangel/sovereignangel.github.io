'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import { WindTabs } from '@/components/wind/WindTabs'
import { WindMasteryDashboard } from '@/components/wind/mastery/WindMasteryDashboard'

function WaveDivider() {
  return (
    <svg viewBox="0 0 120 8" className="w-16 h-2 text-surf-teal shrink-0" aria-hidden="true">
      <path
        d="M0 4 Q 7.5 0, 15 4 T 30 4 T 45 4 T 60 4 T 75 4 T 90 4 T 105 4 T 120 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MasteryInner() {
  const { user, loading } = useAuth()

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #e7f0ea 0%, #f2ecdf 320px)' }}>
      <div className="max-w-5xl mx-auto px-3 md:px-4 py-3 md:py-5">
        <div className="flex items-center gap-2 md:gap-3 mb-3 flex-wrap">
          <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap">
            Wind <span className="text-surf-teal">&mdash;</span> Mastery
          </h1>
          <span className="hidden md:block">
            <WaveDivider />
          </span>
          <span className="hidden md:inline text-[10px] text-surf-muted">
            four paths &middot; five belts &middot; hours sync from logged sessions
          </span>
          <span className="ml-auto">
            <WindTabs active="mastery" />
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-surf-card border border-surf-rule rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !user ? (
          <AuthGate />
        ) : (
          <WindMasteryDashboard uid={user.uid} />
        )}
      </div>
    </main>
  )
}

export default function WindMasteryPage() {
  return (
    <AuthProvider>
      <MasteryInner />
    </AuthProvider>
  )
}
