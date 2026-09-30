'use client'

import { APP_NAME } from '@/lib/connectioninsights/partners'
import { CompassIcon } from '@/components/connectioninsights/pillar-icons'

interface SignInProps {
  onSignIn: () => void
  busy: boolean
  error: string | null
}

/** Open sign-in: any Google account can create its own private dashboard. */
export function SignIn({ onSignIn, busy, error }: SignInProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-[380px] w-full border rounded-sm p-6 text-center" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
        <div className="flex justify-center mb-3">
          <CompassIcon size={32} color="#b85c38" />
        </div>
        <h1 className="font-serif text-[22px] font-semibold tracking-[0.5px]" style={{ color: '#b85c38' }}>
          {APP_NAME}
        </h1>
        <p className="text-[11px] uppercase tracking-[0.5px] mb-4" style={{ color: '#8a7e72' }}>
          Connection Insights
        </p>
        <p className="text-[12px] leading-relaxed mb-5" style={{ color: '#5a5048' }}>
          Turn recorded conversations with one person into a private read on Safety, Growth,
          and Alignment. Sign in with Google to create your own dashboard — your data is
          visible only to your account.
        </p>
        <button
          onClick={onSignIn}
          disabled={busy}
          className="w-full font-serif text-[13px] font-semibold px-3 py-2 rounded-sm border"
          style={{ backgroundColor: '#b85c38', color: '#faf7f2', borderColor: '#b85c38', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {error && <p className="text-[11px] mt-3" style={{ color: '#8c3d3d' }}>{error}</p>}
        <p className="text-[10px] mt-5" style={{ color: '#8a7e72' }}>
          <a href="?demo=1" className="underline">See a demo with sample data</a>
          {' · '}
          <a href="https://github.com/sovereignangel/connection-insights" className="underline">Open source</a>
        </p>
      </div>
    </div>
  )
}
