'use client'

import { useState } from 'react'
import { signInWithGooglePartner } from '@/lib/auth'

export default function ABAuthGate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGooglePartner()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-forest-surface border border-rule rounded-sm p-12 max-w-md w-full text-center">
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
          className="w-full bg-forest text-paper font-serif text-[14px] font-semibold rounded-sm px-5 py-3 hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
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
