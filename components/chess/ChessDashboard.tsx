'use client'

/**
 * The live half of /chess: where the rating is, how much the week has been
 * played, the projection against Chess.com, and the ledger.
 *
 * Nothing here is entered by hand. Games, ratings and play time arrive from
 * Chess.com (lib/chess/chesscom.ts, fetched on the server); the ledger is
 * written by the noon and midnight cron.
 */

import { LANE_BY_ID, LANE_INK } from '@/lib/exec/lanes'
import { TARGET_RATING, TOURNAMENT_DATE, stageFor } from '@/lib/chess/model'
import { BASELINE_GAMES, type Baseline, type ChessComSnapshot } from '@/lib/chess/chesscom'
import { useExecDate } from '@/components/exec/useExecDate'
import { ProjectionChart } from './ProjectionChart'
import { ChessLedger } from './ChessLedger'

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86_400_000)
}

function lastNDates(today: string, n: number): Set<string> {
  const out = new Set<string>()
  const d = new Date(today + 'T12:00:00Z')
  for (let i = 0; i < n; i++) {
    out.add(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return out
}

/** One cell of the strip — label over value, an optional qualifier beside it. */
function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="px-3 first:pl-0 shrink-0 border-l first:border-l-0" style={{ borderColor: LANE_INK.ruleLight }}>
      <div className="font-mono text-[9px] uppercase tracking-[0.4px] whitespace-nowrap" style={{ color: LANE_INK.muted }}>
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: color || LANE_INK.ink }}>
          {value}
        </span>
        {sub && (
          <span className="text-[10px]" style={{ color: LANE_INK.muted }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}

/** What the server hands over from Chess.com — the game list itself stays server-side. */
export type ChessComSummary = Omit<ChessComSnapshot, 'rapidGames' | 'liveGames'>

export function ChessDashboard({
  date: serverDate,
  chesscom,
  synced,
  baseline,
}: {
  date: string
  chesscom: ChessComSummary | null
  synced: { date: string; rating: number; games: number }[]
  baseline: Baseline
}) {
  const date = useExecDate(serverDate)
  const lane = LANE_BY_ID.chess

  // The plan's number: the self-estimate until the baseline games exist, then the measured one.
  const stage = stageFor(baseline.rating)
  const week = lastNDates(date, 7)
  const weekDays = Object.entries(chesscom?.playDays || {}).filter(([d]) => week.has(d))
  const playH = weekDays.reduce((s, [, v]) => s + v.minutes / 60, 0)
  const playGames = weekDays.reduce((s, [, v]) => s + v.games, 0)
  const toTournament = daysBetween(date, TOURNAMENT_DATE)
  const live = chesscom?.rapid ?? null

  return (
    <div className="space-y-3">
      {/* One row. On a phone it scrolls sideways inside itself rather than stacking. */}
      <div
        className="flex items-stretch overflow-x-auto border rounded-xl px-3 py-2"
        style={{ borderColor: LANE_INK.rule, backgroundColor: LANE_INK.card }}
      >
        <Metric
          label="Chess.com rapid"
          value={live !== null ? String(live) : '—'}
          sub={chesscom?.rapidBest ? `best ${chesscom.rapidBest}${chesscom.rapidDate ? ` · last ${chesscom.rapidDate.slice(0, 7)}` : ''}` : undefined}
        />
        <Metric
          label={baseline.estimate ? 'Baseline games' : 'Baseline'}
          value={baseline.estimate ? `${baseline.gamesSinceStart}/${BASELINE_GAMES}` : String(baseline.rating)}
          sub={baseline.estimate ? 'rapid 15+10 · 900 est. until then' : `set ${baseline.date}`}
          color={baseline.estimate ? LANE_INK.warn : undefined}
        />
        <Metric
          label="Played · 7 days"
          value={`${playH.toFixed(1)}h`}
          sub={`${playGames} game${playGames === 1 ? '' : 's'} on Chess.com`}
        />
        <Metric label="Puzzles" value={chesscom?.puzzleHigh ? String(chesscom.puzzleHigh) : '—'} sub="peak" />
        <Metric
          label="Williamsburg"
          value={toTournament > 0 ? `${toTournament}d` : toTournament === 0 ? 'Today' : 'Played'}
          sub="Oct 24"
          color={toTournament >= 0 && toTournament <= 7 ? LANE_INK.warn : undefined}
        />
        <Metric
          label={`To ${TARGET_RATING}`}
          value={String(Math.max(0, TARGET_RATING - baseline.rating))}
          sub={`stage ${stage.numeral} · ${stage.name}`}
        />
      </div>

      <div className="border rounded-xl p-2.5 md:p-3" style={{ borderColor: LANE_INK.rule, backgroundColor: LANE_INK.card }}>
        <div className="flex items-baseline justify-between gap-2 mb-2 pb-1.5 border-b" style={{ borderColor: LANE_INK.ruleLight }}>
          <span className="font-serif text-[14px] md:text-[15px] font-semibold" style={{ color: lane.color }}>
            Projection against Chess.com
          </span>
          <span className="text-[10px]" style={{ color: LANE_INK.muted }}>
            from {baseline.rating}{baseline.estimate ? ' (estimate)' : ''} on {new Date(baseline.date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
          </span>
        </div>
        <ProjectionChart synced={synced} anchor={baseline} />
      </div>

      <ChessLedger />
    </div>
  )
}
