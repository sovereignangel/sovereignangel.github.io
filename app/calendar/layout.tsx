'use client'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import SiteFooter from '@/components/SiteFooter'
import { DEPARTURE, dayIndex, fmtDate, todayLocal } from '@/lib/calendar/plan'

const BACKDROP = 'linear-gradient(180deg, #f5f1ea 0%, #faf8f4 360px)'

function Gate() {
  const { signIn, error, loading } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BACKDROP }}>
      <div className="bg-white border border-rule rounded-sm p-8 max-w-sm w-full text-center mx-3">
        <h1 className="font-serif text-[24px] font-bold text-ink tracking-tight mb-1">Calendar</h1>
        <p className="font-serif text-[13px] italic text-ink-muted mb-6">Oct 2026 → Dec 2027 · travel, decisions, costs</p>
        <div className="w-full h-px bg-rule mb-6" />
        <button
          onClick={signIn}
          disabled={loading}
          className="w-full bg-burgundy text-paper font-serif text-[13px] font-semibold rounded-sm px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Sign in with Google'}
        </button>
        {error && <p className="mt-3 text-red-ink text-[12px]">{error}</p>}
        <p className="mt-5 text-[10px] font-serif italic text-ink-muted">Access restricted to authorized users.</p>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="min-h-screen" style={{ background: BACKDROP }}>
      <div className="max-w-[1100px] mx-auto px-3 md:px-4 py-5">
        <div className="h-6 w-48 bg-rule-light rounded-sm animate-pulse mb-4" />
        <div className="h-32 bg-white border border-rule rounded-sm animate-pulse mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white border border-rule rounded-sm animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

function CalendarLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()

  if (loading) return <Skeleton />
  if (!user) return <Gate />

  const today = todayLocal()
  const toDeparture = dayIndex(DEPARTURE) - dayIndex(today)

  return (
    <div className="min-h-screen" style={{ background: BACKDROP }}>
      <header className="max-w-[1100px] mx-auto px-3 md:px-4 pt-4 md:pt-5 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-[18px] md:text-[20px] font-semibold text-ink whitespace-nowrap">
            Calendar<span className="hidden sm:inline"> <span className="text-burgundy">&mdash;</span> Oct 2026 → Dec 2027</span>
          </h1>
          {toDeparture > 0 && (
            <span
              className="hidden sm:inline font-mono text-[9px] uppercase tracking-[0.5px] text-burgundy bg-burgundy-bg border border-burgundy/25 rounded-sm px-1.5 py-0.5"
              title={`Departure ${fmtDate(DEPARTURE)}`}
            >
              T&minus;{toDeparture} to departure
            </span>
          )}
          <span className="hidden md:inline text-[11px] text-ink-muted">travel, decisions, costs</span>
          <button
            type="button"
            onClick={signOut}
            className="ml-auto font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-ink-faint"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto px-3 md:px-4 pb-6">{children}</main>
      <SiteFooter />
    </div>
  )
}

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CalendarLayoutInner>{children}</CalendarLayoutInner>
    </AuthProvider>
  )
}
