/**
 * Path helpers for the Lordas sub-pages.
 *
 * These routes live at /lordas/* but are normally reached through
 * lordas.loricorpuz.com, where middleware rewrites the prefix away. A link
 * hard-coded either way breaks on the other host, so the prefix is read back
 * off the current path at render time.
 *
 * The wind forecast is not a lordas route at all — it is the main site's
 * planner — so it is linked absolutely and works from either host.
 */

export const WIND_DETAIL_URL = 'https://www.loricorpuz.com/wind'

export function lordasBase(): string {
  if (typeof window === 'undefined') return ''
  return window.location.pathname.startsWith('/lordas') ? '/lordas' : ''
}

export function lordasHref(path: string): string {
  const p = path === '/' ? '' : path
  return `${lordasBase()}${p}` || '/'
}
