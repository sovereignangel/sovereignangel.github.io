import { getAuth } from 'firebase/auth'

/**
 * Fetch wrapper that automatically adds Firebase Auth token.
 * Drop-in replacement for fetch() on authenticated API routes.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = getAuth().currentUser
  if (!user) throw new Error('Not authenticated')

  const token = await user.getIdToken()
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)

  return fetch(url, { ...options, headers })
}
