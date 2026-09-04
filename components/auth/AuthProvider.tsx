'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { isAllowedEmail, onAuthChange, signInWithGoogle, signOutUser } from '@/lib/auth'
import { getOrCreateUser } from '@/lib/firestore'
import type { UserProfile } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  calendarAccessToken: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshCalendarToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  calendarAccessToken: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshCalendarToken: async () => {},
})

/**
 * `allowEmails` widens the global allowlist for this view only. It is checked
 * at sign-in and again on every persisted session, so a Google session
 * created on one page (this view, or any page with its own popup flow)
 * never opens a gated page it was not admitted to.
 */
export function AuthProvider({ children, allowEmails = [] }: { children: ReactNode; allowEmails?: string[] }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [calendarAccessToken, setCalendarAccessToken] = useState<string | null>(null)
  const allowRef = useRef(allowEmails)
  allowRef.current = allowEmails

  useEffect(() => {
    const unsubscribe = onAuthChange((sessionUser) => {
      const firebaseUser = sessionUser && isAllowedEmail(sessionUser.email, allowRef.current) ? sessionUser : null
      setUser(firebaseUser)
      // Stop blocking on loading immediately — let the page render
      setLoading(false)
      if (firebaseUser) {
        // Fetch profile in background — page renders with user but profile=null briefly
        getOrCreateUser(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName || '',
          firebaseUser.photoURL || ''
        ).then(setProfile).catch(() => setProfile(null))
      } else {
        setProfile(null)
      }
    })
    return unsubscribe
  }, [])

  const signIn = async () => {
    setError(null)
    try {
      const result = await signInWithGoogle(allowRef.current)
      if (result?.calendarAccessToken) {
        setCalendarAccessToken(result.calendarAccessToken)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }

  const refreshCalendarToken = async () => {
    try {
      const result = await signInWithGoogle(allowRef.current)
      if (result?.calendarAccessToken) {
        setCalendarAccessToken(result.calendarAccessToken)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calendar sync failed')
    }
  }

  const signOut = async () => {
    await signOutUser()
    setProfile(null)
    setCalendarAccessToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, calendarAccessToken, signIn, signOut, refreshCalendarToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
