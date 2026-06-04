'use client'

import { useState, useEffect } from 'react'

const T = {
  ink: '#1a1815',
  cream: '#f4efe6',
  paper: '#ebe4d4',
  sand: '#d6c89e',
  bronze: '#7a5a2e',
  bronzeLight: '#a47e3e',
  ember: '#d6a25a',
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export default function ArmstrongPage() {
  const isMobile = useIsMobile()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setEmail('')
  }

  return (
    <div
      style={{
        background: T.cream,
        color: T.ink,
        fontFamily: T.sans,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isMobile ? '32px 20px' : '48px 48px',
          borderBottom: `1px solid ${T.ink}22`,
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: T.serif,
            fontSize: 24,
            fontWeight: 500,
            color: T.ink,
            textDecoration: 'none',
          }}
        >
          Armstrong
        </a>
      </div>

      {/* Main */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '48px 20px' : '80px 48px',
        }}
      >
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.5em', paddingLeft: '0.5em', fontFamily: T.mono, opacity: 0.6, marginBottom: 24 }}>
            INVESTMENT PERFORMANCE
          </div>

          <h1
            style={{
              fontFamily: T.serif,
              fontSize: isMobile ? 44 : 64,
              fontWeight: 400,
              lineHeight: 1.1,
              margin: '0 0 24px',
              fontStyle: 'italic',
            }}
          >
            Stay updated on our returns.
          </h1>

          <p
            style={{
              fontFamily: T.serif,
              fontSize: 18,
              lineHeight: 1.7,
              opacity: 0.78,
              marginBottom: isMobile ? 32 : 48,
            }}
          >
            Quarterly performance updates, market perspectives, and investment insights from Armstrong. Subscribe to receive letters directly in your inbox.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  background: T.paper,
                  border: `1px solid ${T.ink}33`,
                  padding: '16px 20px',
                  fontFamily: T.serif,
                  fontSize: 16,
                  color: T.ink,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: T.ink,
                  color: T.cream,
                  padding: '16px 28px',
                  border: 'none',
                  fontFamily: T.mono,
                  fontSize: 11,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Subscribe →
              </button>
            </form>
          ) : (
            <div style={{ background: T.paper, padding: 32, border: `1px solid ${T.ink}22` }}>
              <p style={{ fontFamily: T.serif, fontSize: 18, fontStyle: 'italic', margin: 0 }}>
                Merci. You'll receive our next update shortly.
              </p>
            </div>
          )}

          <p style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.3em', opacity: 0.5, marginTop: 32, textTransform: 'uppercase' }}>
            We respect your inbox. No spam.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: isMobile ? '32px 20px' : '48px 48px',
          borderTop: `1px solid ${T.ink}22`,
          textAlign: 'center',
          fontFamily: T.mono,
          fontSize: 9,
          letterSpacing: '0.3em',
          opacity: 0.5,
          textTransform: 'uppercase',
        }}
      >
        <a href="https://aretetec.com/salons" style={{ color: T.ink, textDecoration: 'none', marginRight: 16 }}>
          Salons
        </a>
        <span>© MMXXVI · ARMSTRONG</span>
      </div>
    </div>
  )
}
