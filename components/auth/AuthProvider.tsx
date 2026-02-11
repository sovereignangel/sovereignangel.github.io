'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { onAuthChange, signInWithGoogle, signOutUser } from '@/lib/auth'
import { getOrCreateUser } from '@/lib/firestore'
import type { UserProfile } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
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
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }

  const signOut = async () => {
    await signOutUser()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
