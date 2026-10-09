import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { todayLocal } from '@/lib/ironman/plan'
import { LANE_BY_ID, LANE_INK } from '@/lib/exec/lanes'
import {
  MILESTONES,
  SCENARIO_COLOR,
  STAGES,
  START_RATING,
  milestoneDates,
  tournamentProjection,
} from '@/lib/chess/model'
import { ExecCampaign } from '@/components/exec/ExecCampaign'
import { ChessDashboard } from '@/components/chess/ChessDashboard'

export const metadata: Metadata = {
  title: 'Chess — Mastery',
  description: '900 to 2000 Chess.com rapid: the Williamsburg A Team bar, the October 24 sprint, and the ladder in between',
}

export const revalidate = 60

const lane = LANE_BY_ID.chess

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border rounded-xl p-2.5 md:p-3" style={{ borderColor: LANE_INK.rule, backgroundColor: LANE_INK.card }}>
      <div className="flex items-baseline justify-between gap-2 mb-2 pb-1.5 border-b" style={{ borderColor: LANE_INK.ruleLight }}>
        <h2 className="font-serif text-[14px] md:text-[15px] font-semibold" style={{ color: lane.color }}>
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  )
}

/** A rook, drawn — the page's one mark. */
function Rook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 3h3v2.5h2V3h2v2.5h2V3h3v5l-2 2v7l2 2v2H4v-2l2-2v-7L4 8z" />
      <path d="M6 10h8M6 17h8" />
    </svg>
  )
}

export default function ChessPage() {
  const today = todayLocal()
  const milestones = milestoneDates()
  const sprint = tournamentProjection()

  return (
    <AuthProvider>
      <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #edefea 0%, #f2ecdf 320px)' }}>
        <div className="max-w-[1100px] mx-auto px-3 md:px-4 py-3 md:py-5">
          <header className="flex items-center gap-2 md:gap-3 mb-2.5 flex-wrap">
            <Rook className="w-4 h-5 shrink-0" />
            <h1 className="font-serif text-[17px] md:text-[20px] font-semibold whitespace-nowrap" style={{ color: LANE_INK.ink }}>
              Chess <span style={{ color: lane.color }}>&mdash;</span> Mastery
            </h1>
            <span className="hidden md:inline text-[10px]" style={{ color: LANE_INK.muted }}>
              900 &rarr; 2000 Chess.com rapid &middot; the Williamsburg A Team bar
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Link
                href="/exec"
                className="font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent"
                style={{ color: LANE_INK.muted, borderColor: LANE_INK.rule }}
              >
                Daily orders
              </Link>
              <Link
                href="/exec/ladder/chess"
                className="font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent"
                style={{ color: LANE_INK.muted, borderColor: LANE_INK.rule }}
              >
                Full ladder
              </Link>
            </span>
          </header>

          <div className="mb-3">
            <ChessDashboard date={today} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start mb-3">
            <Card title="The honest read">
              <div className="space-y-2 text-[11px] leading-relaxed" style={{ color: LANE_INK.ink }}>
                <p>
                  <span className="font-semibold">By October 24, the rating barely moves; the play can.</span> Fifteen days
                  is worth about{' '}
                  {sprint.map((s, i) => (
                    <span key={s.hours} className="font-mono">
                      {s.rating - START_RATING > 0 ? '+' : ''}{s.rating - START_RATING}{i < sprint.length - 1 ? ' / ' : ''}
                    </span>
                  ))}{' '}
                  points on the model at 5 / 7.5 / 10 hours. But at 900 most games are lost to one-move blunders, and a
                  blunder check is trainable in two weeks. Playing at a 1000–1100 level on the day is a real target;
                  2000 on the day is not. And the 900 is a self-estimate — ten rated rapid games turn it into a number
                  the plan can be measured against.
                </p>
                <p>
                  <span className="font-semibold">2000 rapid is a multi-year project.</span> It sits in roughly the top
                  one to two percent of Chess.com rapid players, and further than most adult improvers ever get. The
                  model puts it at <span className="font-mono">4&ndash;6</span> years from 900 at 5&ndash;10 hours a
                  week, because the points get expensive fast: 900&rarr;1200 is months, 1800&rarr;2000 alone is over a
                  year. Online is the faster pool to climb — far more rated games per week — which is why this is
                  shorter than an over-the-board line would be.
                </p>
                <p>
                  <span className="font-semibold">What moves the dates.</span> A coach who reviews your games (the single
                  biggest lever below 1800), rated games at 15+10 or longer every week — not blitz — and honest review
                  of every loss before the engine. Hours without those three buy far less than the lines show.
                </p>
                <p style={{ color: LANE_INK.muted }} className="text-[10px]">
                  Assumptions: the A Team is picked on a rating floor, and the floor is 2000 Chess.com rapid. If the club
                  turns out to select on a USCF rating or on results, the bar moves and so does this page.
                </p>
              </div>
            </Card>

            <Card title="When each rating lands" right={<span className="text-[10px]" style={{ color: LANE_INK.muted }}>model · from {START_RATING} today</span>}>
              <table className="w-full text-[11px]" style={{ color: LANE_INK.ink }}>
                <thead>
                  <tr style={{ color: LANE_INK.muted }}>
                    <th className="text-left font-normal text-[10px] py-1">Weekly hours</th>
                    {MILESTONES.map((m) => (
                      <th key={m} className="text-right font-mono font-normal text-[10px] py-1">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((row) => (
                    <tr key={row.hours} className="border-t" style={{ borderColor: LANE_INK.ruleLight }}>
                      <td className="py-1.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block w-3 h-[2px]" style={{ backgroundColor: SCENARIO_COLOR[row.hours] }} />
                          {row.hours}h / week
                        </span>
                      </td>
                      {row.dates.map((d) => (
                        <td key={d.rating} className={`text-right font-mono py-1.5 ${d.rating === 2000 ? 'font-semibold' : ''}`}>
                          {fmtDate(d.date)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] leading-relaxed mt-2" style={{ color: LANE_INK.muted }}>
                Chess.com rapid points per month at 7.5h: 50 below 1200, 28 to 1500, 16 to 1800, 10 to 2000 — scaled by hours to the 0.7
                power, because the tenth hour of a week absorbs less than the fifth. A planning model, not a promise:
                the logged dots on the chart above are what check it.
              </p>
            </Card>
          </div>

          <div className="mb-3">
            <ExecCampaign id="chess" laneId="chess" date={today} />
          </div>

          <Card title="The mastery flow" right={<span className="text-[10px]" style={{ color: LANE_INK.muted }}>four stages · each named for the error that costs the most points</span>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STAGES.map((s) => (
                <div key={s.id} className="border rounded-lg p-2.5" style={{ borderColor: LANE_INK.ruleLight }}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-[10px]" style={{ color: LANE_INK.muted }}>{s.numeral}</span>
                    <span className="font-serif text-[13px] font-semibold" style={{ color: LANE_INK.ink }}>{s.name}</span>
                    <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded-md border" style={{ color: lane.color, borderColor: lane.border, backgroundColor: lane.bg }}>
                      {s.band[0]}&ndash;{s.band[1]}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed mb-1.5" style={{ color: LANE_INK.muted }}>
                    <span className="font-semibold" style={{ color: LANE_INK.ink }}>The leak:</span> {s.leak}
                  </p>
                  <div className="font-mono text-[9px] uppercase tracking-[0.4px] mb-0.5" style={{ color: LANE_INK.muted }}>Train</div>
                  <ul className="text-[10px] leading-relaxed mb-1.5 space-y-0.5" style={{ color: LANE_INK.ink }}>
                    {s.focus.map((f) => <li key={f}>&middot; {f}</li>)}
                  </ul>
                  <div className="font-mono text-[9px] uppercase tracking-[0.4px] mb-0.5" style={{ color: LANE_INK.muted }}>Stack</div>
                  <ul className="text-[10px] leading-relaxed mb-1.5 space-y-0.5" style={{ color: LANE_INK.ink }}>
                    {s.stack.map((f) => <li key={f}>&middot; {f}</li>)}
                  </ul>
                  <div className="font-mono text-[9px] uppercase tracking-[0.4px] mb-0.5" style={{ color: LANE_INK.muted }}>Week at 7.5h</div>
                  <div className="flex h-[14px] w-full rounded-sm overflow-hidden mb-1" style={{ gap: 2 }}>
                    {s.split.map((p, i) => (
                      <div
                        key={p.label}
                        title={`${p.label} — ${p.hours}h`}
                        style={{ flex: p.hours, backgroundColor: lane.color, opacity: 1 - i * 0.16 }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] mb-1.5" style={{ color: LANE_INK.muted }}>
                    {s.split.map((p) => (
                      <span key={p.label}>{p.label} <span className="font-mono" style={{ color: LANE_INK.ink }}>{p.hours}h</span></span>
                    ))}
                  </div>
                  <p className="text-[10px] leading-relaxed pt-1.5 border-t" style={{ color: LANE_INK.muted, borderColor: LANE_INK.ruleLight }}>
                    <span className="font-semibold" style={{ color: LANE_INK.ink }}>Exit:</span> {s.exit}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </AuthProvider>
  )
}
