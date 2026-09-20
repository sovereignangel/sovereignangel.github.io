'use client'

/**
 * The provider /books has always needed.
 *
 * The page calls useAuth for its own gate, but nothing mounted the context
 * above it, so the hook fell through to the default — loading: true and a
 * no-op signIn. The page's first branch is `if (authLoading)`, so it sat on
 * "Loading..." forever: no shelf, and no sign-in button to get to one.
 *
 * Thin on purpose. The page already renders its own loading state, its own
 * sign-in card and its own header, so this adds the context and nothing else
 * — a second gate here would just be a second thing to keep in step with it.
 */

import { AuthProvider } from '@/components/auth/AuthProvider'

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
