'use client'

import { useAuth } from './AuthProvider'

export default function AuthGate() {
  const { signIn, error, loading } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-paper border border-rule rounded-sm p-12 max-w-md w-full text-center">
        <h1 className="font-serif text-[28px] font-bold text-ink tracking-tight mb-2">
          Thesis Engine
        </h1>
        <p className="font-serif text-[14px] italic text-ink-muted mb-8">
          Portfolio Management System
        </p>

        <div className="w-full h-px bg-rule mb-8" />

        <button
          onClick={signIn}
          disabled={loading}
          className="w-full bg-navy text-paper font-serif text-[14px] font-semibold rounded-sm px-5 py-3 hover:bg-navy-light transition-colors duration-150 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Sign in with Google'}
        </button>

        {error && (
          <p className="mt-4 text-red-ink text-[13px] font-sans">
            {error}
          </p>
        )}

        <p className="mt-6 text-[11px] font-serif italic text-ink-muted">
          Access restricted to authorized users.
        </p>
      </div>
    </div>
  )
}
