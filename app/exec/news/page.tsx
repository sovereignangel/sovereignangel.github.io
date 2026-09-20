import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { todayLocal } from '@/lib/ironman/plan'
import { TIMEZONE } from '@/lib/exec/windows'
import { ExecIntake } from '@/components/exec/ExecIntake'

export const metadata: Metadata = {
  title: 'Intake — Exec Tearsheet',
  description: 'The download, the queue and the ledger — news, one long read, one paper a day',
}

// Same reasoning as /exec: the sheet's idea of today cannot sit in a long
// cache across midnight, and the client half (useExecDate) handles a tab
// that was already open when the day turned over.
export const revalidate = 60

export default function IntakePage() {
  const today = todayLocal()
  const generatedAt = new Date().toLocaleString('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <AuthProvider>
      <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #edefea 0%, #f2ecdf 320px)' }}>
        <div className="max-w-[1100px] mx-auto px-3 md:px-4 py-3 md:py-5">
          <header className="flex items-center gap-2 md:gap-3 mb-3">
            <Link
              href="/exec"
              className="inline-flex items-center gap-1 font-serif text-[11px] font-medium px-2 py-1 rounded-md border bg-transparent text-surf-muted border-surf-rule hover:text-surf-deep hover:border-surf-teal/50 transition-colors shrink-0"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M8 5H2M4.5 2.5L2 5l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Exec
            </Link>
            <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap">
              Intake <span className="text-iron-burgundy">&mdash;</span> The Download
            </h1>
            <span className="hidden lg:inline text-[10px] text-surf-muted">
              Scan the news &middot; one long read &middot; one paper, reviewed and implemented
            </span>
            <span className="ml-auto font-mono text-[9px] md:text-[10px] text-surf-muted whitespace-nowrap">
              {generatedAt} LT
            </span>
          </header>

          <ExecIntake date={today} />

          <p className="text-[10px] text-surf-muted mt-3">
            The download is pulled from a fixed list of sources rather than searched, and nothing between you and the
            reading scores it: the pile is already narrowed by the choice of source, and a relevance model is one more
            thing to tune instead of read. Anything pulled and not dealt with rolls forward, so the queue is always
            deeper than a day &mdash; that is the point, because &ldquo;nothing to read&rdquo; is the sentence that ends
            in a feed. Skipping is a status of its own, so a decision not to read something is a decision rather than a
            silence and the queue stays a queue. Marking an item done demands a takeaway, which is the one piece of
            friction kept deliberately: a ledger of titles is a reading list wearing a ledger&rsquo;s clothes. A paper is
            done when it is implemented, not when it is read.
          </p>
        </div>
      </main>
    </AuthProvider>
  )
}
