'use client'

import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

const ADMIN_EMAILS = ['loricorpuz@gmail.com', 'mossda@gmail.com']

const T = {
  ink: '#1a1815',
  cream: '#f4efe6',
  paper: '#ebe4d4',
  bronze: '#7a5a2e',
  coral: '#c0533a',
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

export function useAdminUser() {
  // Synchronously seed from auth.currentUser so returning users skip the loading flash
  const initial = auth.currentUser
  const [user, setUser] = useState<User | null>(
    initial && ADMIN_EMAILS.includes(initial.email || '') ? initial : null
  )
  const [ready, setReady] = useState<boolean>(initial !== null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && ADMIN_EMAILS.includes(u.email || '')) setUser(u)
      else setUser(null)
      setReady(true)
    })
    return unsub
  }, [])

  return { user, ready }
}

export async function adminSignIn() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  if (!ADMIN_EMAILS.includes(result.user.email || '')) {
    await firebaseSignOut(auth)
    throw new Error('Access restricted to authorized hosts.')
  }
}

export async function adminSignOut() {
  await firebaseSignOut(auth)
}

export function AuthScreen() {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handle = async () => {
    setError(null)
    setBusy(true)
    try {
      await adminSignIn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.cream,
        color: T.ink,
        fontFamily: T.sans,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: T.paper,
          border: `1px solid ${T.ink}33`,
          padding: '40px 28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: '0.5em',
            paddingLeft: '0.5em',
            opacity: 0.6,
          }}
        >
          ARETE · MISTRAL
        </div>
        <div
          style={{
            fontFamily: T.serif,
            fontStyle: 'italic',
            fontSize: 36,
            margin: '12px 0 6px',
            color: T.bronze,
          }}
        >
          Hosts portal
        </div>
        <div
          style={{
            fontFamily: T.serif,
            fontSize: 14,
            opacity: 0.7,
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Budget &amp; planning for the season.<br />By invitation only.
        </div>
        <button
          onClick={handle}
          disabled={busy}
          style={{
            width: '100%',
            background: T.ink,
            color: T.cream,
            border: 'none',
            padding: '16px 20px',
            fontFamily: T.mono,
            fontSize: 11,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            cursor: busy ? 'wait' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {error && (
          <div
            style={{
              marginTop: 16,
              fontFamily: T.serif,
              fontSize: 13,
              color: T.coral,
              fontStyle: 'italic',
            }}
          >
            {error}
          </div>
        )}
        <div
          style={{
            marginTop: 28,
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.3em',
            opacity: 0.45,
            textTransform: 'uppercase',
          }}
        >
          L. Corpuz · D. Moss
        </div>
      </div>
    </div>
  )
}
