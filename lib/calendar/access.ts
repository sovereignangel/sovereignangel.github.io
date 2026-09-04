import { parseEmailList } from '@/lib/auth'

/**
 * Google accounts admitted to /calendar on top of the global allowlist.
 * Set NEXT_PUBLIC_CALENDAR_ALLOWED_EMAILS (comma-separated) in Vercel and
 * .env.local; it is inlined at build time, so a change needs a redeploy.
 */
export const CALENDAR_VIEWERS: string[] = parseEmailList(process.env.NEXT_PUBLIC_CALENDAR_ALLOWED_EMAILS)
