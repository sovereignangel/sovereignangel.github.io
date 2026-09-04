'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import SiteFooter from '@/components/SiteFooter'
import { EXTENDED_DEADLINE, TAX_YEAR, daysBetween, fmtDate, todayLocal } from '@/lib/finance/plan'

const BACKDROP = 'linear-gradient(180deg, #f5f1ea 0%, #faf8f4 360px)'

const TABS: { id: string; label: string; href: string }[] = [
  { id: 'investments', label: 'Investments', href: '/finance/investments' },
  { id: 'taxes', label: 'Taxes', href: '/finance/taxes' },
  { id: 'expenses', label: 'Expenses', href: '/finance/expenses' },
]

function Gate() {
  const { signIn, error, loading } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BACKDROP }}>
      <div className="bg-white border border-rule rounded-sm p-8 max-w-sm w-full text-center mx-3">
        <h1 className="font-serif text-[24px] font-bold text-ink tracking-tight mb-1">Finance</h1>
        <p className="font-serif text-[13px] italic text-ink-muted mb-6">investments · taxes · expenses</p>
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
      <div className="max-w-[1180px] mx-auto px-3 md:px-4 py-5">
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

function FinanceLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()

  if (loading) return <Skeleton />
  if (!user) return <Gate />

  const active = TABS.find(t => pathname === t.href || pathname.startsWith(`${t.href}/`))?.id ?? 'taxes'
  const toFiling = daysBetween(todayLocal(), EXTENDED_DEADLINE)

  return (
    <div className="min-h-screen" style={{ background: BACKDROP }}>
      <header className="max-w-[1180px] mx-auto px-3 md:px-4 pt-4 md:pt-5 pb-2">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-b-2 border-rule pb-2">
          <div>
            <div className="font-mono text-[12px] uppercase tracking-[3px] text-ink-muted">Finance</div>
            <h1 className="font-serif text-[28px] font-semibold leading-tight text-ink md:text-[32px]">
              Tax year {TAX_YEAR}
            </h1>
          </div>
          <nav className="flex gap-4 pb-1">
            {TABS.map(t =>
              t.id === active ? (
                <span key={t.id} className="border-b-2 border-burgundy font-serif text-[19px] font-semibold text-burgundy">
                  {t.label}
                </span>
              ) : (
                <Link key={t.id} href={t.href} className="font-serif text-[19px] text-ink-muted transition-colors hover:text-ink">
                  {t.label}
                </Link>
              )
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 pb-1">
            {toFiling >= 0 && (
              <span
                className="font-mono text-[11px] uppercase tracking-[0.5px] text-burgundy bg-burgundy-bg border border-burgundy/25 rounded-sm px-1.5 py-0.5"
                title={`Extended filing deadline ${fmtDate(EXTENDED_DEADLINE)}`}
              >
                T&minus;{toFiling} to Oct 15 filing
              </span>
            )}
            <button
              type="button"
              onClick={signOut}
              className="font-serif text-[11px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-ink-faint"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-[1180px] mx-auto px-3 md:px-4 pb-6 pt-1">{children}</main>
      <SiteFooter />
    </div>
  )
}

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FinanceLayoutInner>{children}</FinanceLayoutInner>
    </AuthProvider>
  )
}
