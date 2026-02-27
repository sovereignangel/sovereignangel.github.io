'use client'

import { useAuth } from '@/components/auth/AuthProvider'

export default function ABAuthGate() {
  const { signIn, error, loading } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-paper border border-rule rounded-sm p-12 max-w-md w-full text-center">
        <h1 className="font-serif text-[28px] font-bold text-ink tracking-tight mb-1">
          Alamo Bernal
        </h1>
        <p className="font-serif text-[14px] italic text-ink-muted mb-1">
          Investments
        </p>
        <p className="font-mono text-[10px] text-ink-muted uppercase tracking-[1px] mb-8">
          Technology Partnership Proposal
        </p>

        <div className="w-full h-px bg-rule mb-8" />

        <button
          onClick={signIn}
          disabled={loading}
          className="w-full bg-burgundy text-paper font-serif text-[14px] font-semibold rounded-sm px-5 py-3 hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Sign in with Google'}
        </button>

        {error && (
          <p className="mt-4 text-red-ink text-[13px] font-sans">
            {error}
          </p>
        )}

        <p className="mt-6 text-[11px] font-serif italic text-ink-muted">
          Access restricted to authorized partners.
        </p>
      </div>
    </div>
  )
}
