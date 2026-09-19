'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
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

/**
 * The one line that explains the public view.
 *
 * The logbook used to be gated outright, which meant checking your own hours
 * on a phone cost a Google sign-in. Reading now goes through a server route,
 * so the page shows the belts and drills to anyone; signing in is only what
 * turns the write controls back on.
 */
function PublicNote({ error, onSignIn }: { error: string | null; onSignIn: () => void }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 flex-wrap text-[10px] text-surf-muted">
        <span>Read-only view &mdash; sign in to log sessions and tick off drills.</span>
        <button
          onClick={onSignIn}
          className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-full border border-surf-rule text-surf-muted hover:text-surf-deep hover:border-surf-teal/50 cursor-pointer transition-colors"
        >
          Sign in
        </button>
      </div>
      {error && <p className="text-[10px] text-surf-navy mt-1">{error}</p>}
    </div>
  )
}

function MasteryInner() {
  const { user, loading, signIn, error } = useAuth()

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
        ) : (
          <>
            {!user && <PublicNote error={error} onSignIn={signIn} />}
            <WindMasteryDashboard uid={user?.uid ?? null} onSignIn={signIn} />
          </>
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
