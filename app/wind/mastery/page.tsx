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
 * The sign-in card, inline under the masthead.
 *
 * The shared AuthGate is a whole-page gate: it centres itself in its own
 * min-h-screen, which every other gated route gets away with because the gate
 * IS the page there. Dropped inside this page's frame it stacked a second
 * viewport under the header, so a phone opened the tab to a screen of empty
 * cream with the card below the fold — the tab read as broken. It also wore
 * the Thesis Engine masthead, which says nothing about kiting.
 */
function SignInCard() {
  const { signIn, error, loading } = useAuth()

  return (
    <div className="bg-surf-card border border-surf-rule rounded-xl p-4 md:p-5 max-w-sm shadow-[0_2px_12px_rgba(13,92,99,0.06)]">
      <div className="font-serif text-[15px] font-semibold text-surf-deep">Your logbook</div>
      <p className="text-[11px] text-surf-muted leading-snug mt-1">
        Belts, drills and hours on water, kept per rider. Sign in to see yours &mdash; logged
        sessions and Garmin kite activities aggregate automatically.
      </p>
      <button
        onClick={signIn}
        disabled={loading}
        className="mt-3 w-full font-serif text-[13px] font-medium px-4 py-2.5 rounded-full border bg-surf-teal text-white border-surf-teal hover:bg-surf-deep disabled:opacity-50 cursor-pointer transition-colors"
      >
        {loading ? 'Loading...' : 'Sign in with Google'}
      </button>
      {error && <p className="mt-2 text-[10px] text-surf-navy leading-snug">{error}</p>}
      <p className="mt-2 text-[9px] text-surf-muted">
        The forecast tabs are open to everyone; only the logbook is gated.
      </p>
    </div>
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
          <SignInCard />
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
