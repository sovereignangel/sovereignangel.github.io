import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { todayLocal } from '@/lib/ironman/plan'
import { TIMEZONE } from '@/lib/exec/windows'
import { ExecSvencele } from '@/components/exec/ExecSvencele'
import { SVENCELE_END, SVENCELE_START, tripIsLive } from '@/lib/exec/svencele'
import { WaveDivider } from '@/components/wind/WindIcons'

export const metadata: Metadata = {
  title: 'Svencele — Exec Tearsheet',
  description: 'Four days on the Curonian Lagoon — four tradeable blocks a day, five kite hours, and a debrief that counts',
}

// Same reasoning as /exec: the sheet's idea of today cannot sit in a long cache
// across midnight, and the client half (useExecDate) handles an already-open tab.
export const revalidate = 60

export default function SvenceleePage() {
  const today = todayLocal()
  const live = tripIsLive(today)

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
          <header className="flex items-center gap-2 md:gap-3 mb-2.5">
            <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap">
              Svencele <span className="text-iron-burgundy">&mdash;</span> Tearsheet
            </h1>
            <WaveDivider className="hidden md:block w-10 h-2 text-surf-teal shrink-0" />
            <Link
              href="/exec"
              className="font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent transition-colors text-surf-muted border-surf-rule hover:text-surf-deep hover:border-surf-teal/50"
            >
              Daily orders
            </Link>
            <span className="ml-auto font-mono text-[9px] md:text-[10px] text-surf-muted whitespace-nowrap">
              {generatedAt} LT
            </span>
          </header>

          {/* The sheet keeps its own state either way; outside the block it simply
              reads as a record of what the four days were. */}
          <ExecSvencele date={today} />

          {!live && (
            <p className="text-[10px] text-surf-muted mb-3">
              The block ran {SVENCELE_START} to {SVENCELE_END}. Everything above is the record of it &mdash; the sheet
              stays readable after the fact, and drops off /exec on its own.
            </p>
          )}

          <p className="text-[10px] text-surf-muted">
            Four two-hour desk blocks against a five-hour floor and a six-hour stretch, with eight scheduled &mdash; the
            surplus is what gets traded for wind. Any block moves into any lane from the chips on its card, and the goal
            bars follow the trade rather than pretending it did not happen. A block carries a goal and a KPI written
            before it starts and a result written after; the debrief is computed from what was actually ticked, not from
            how the day felt. The water closes about thirty minutes past sunset &mdash; observed 20:12 against a 19:57
            sunset on the 17th &mdash; so a five-hour session has to be on the water by 15:00 and the evening run starts
            in the dusk. The day turns over at Palanga midnight, in an open tab as well as on a fresh load.
          </p>
        </div>
      </main>
    </AuthProvider>
  )
}
