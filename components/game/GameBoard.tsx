'use client'

/**
 * The Long Game — one screen, no scroll.
 *
 * A tearsheet is a single page taken in at a glance, not a document you travel
 * through. So the whole board is a fixed-height grid: four columns, panels
 * sized to their contents, nothing below the fold because there is no fold.
 * The page itself never scrolls; a panel may, but only as a safety valve on a
 * short viewport, and below the tablet breakpoint the grid unlocks into a
 * column because a phone cannot honour the constraint honestly.
 *
 * Everything that was prose in the first draft is now a tooltip or a chip.
 * Gate text lives in `title` on the row that owns it — the detail is one hover
 * away rather than one scroll away.
 *
 * The page is public: a visitor sees every tree, rung and unlock, and none of
 * the standing. Signing in is what makes the pips clickable.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getGameProgress,
  setTreeLevel,
  setLaunchGate,
  setWeeklyKpi,
  setMonthGoal,
} from '@/lib/firestore/game'
import type { GameProgressDoc } from '@/lib/types/game'
import {
  LAUNCH_GATES,
  LEVEL_NAMES,
  QUEST_LINES,
  THE_LINE,
  TRACK_RECORD,
  TREE_BY_ID,
  TREES,
  recordBanked,
  treesOf,
  type Level,
  type QuestLineId,
  type Tree,
} from '@/lib/game/trees'
import { allUnlockStatuses, isTreeLocked, type Levels } from '@/lib/game/unlocks'
import { STAGE_NAMES, daysToKill, ideasByStage } from '@/lib/game/ideas'
import { CANON } from '@/lib/game/reading'
import { isoWeekKey, monthPlanFor } from '@/lib/game/cadence'
import { ARETE, ARETE_LINES, SPIRAL_PATH } from '@/lib/arete/brand'

const CSS = `
.tg{height:100dvh;display:grid;grid-template-rows:auto 1fr;overflow:hidden;background:${ARETE.cream};color:${ARETE.ink};font-family:${ARETE.sans}}
.tg *{box-sizing:border-box}

/* ── masthead: one bar, everything on it ── */
.tg-top{display:flex;align-items:center;gap:14px;padding:8px 16px;border-bottom:1px solid ${ARETE.rule};background:${ARETE.paper};min-width:0}
.tg-mark{flex:none;color:${ARETE.burgundy}}
.tg-id{flex:none;line-height:1.1}
.tg-id .n{font-family:${ARETE.serif};font-size:17px;font-weight:600;color:${ARETE.ink};letter-spacing:-.01em;white-space:nowrap}
.tg-id .h{font-family:${ARETE.mono};font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:${ARETE.inkSoft};white-space:nowrap}
.tg-line{font-family:${ARETE.serif};font-style:italic;font-size:14px;line-height:1.25;color:${ARETE.burgundy};border-left:1px solid ${ARETE.rule};padding-left:14px;min-width:0}
.tg-stats{margin-left:auto;display:flex;gap:0;flex:none}
.tg-stat{padding:0 13px;border-left:1px solid ${ARETE.ruleSoft};text-align:right}
.tg-stat dt{font-family:${ARETE.mono};font-size:7.5px;letter-spacing:.16em;text-transform:uppercase;color:${ARETE.inkSoft};margin:0 0 1px;white-space:nowrap}
.tg-stat dd{margin:0;font-family:${ARETE.serif};font-size:19px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums;color:${ARETE.ink}}
.tg-stat dd i{font-style:normal;font-size:11px;color:${ARETE.inkSoft}}
.tg-auth{flex:none;font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:${ARETE.ink};background:transparent;border:1px solid ${ARETE.inkSoft};padding:5px 9px;cursor:pointer;margin-left:12px}
.tg-auth:hover{border-color:${ARETE.burgundy};color:${ARETE.burgundy}}

/* ── the grid ── */
.tg-grid{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:0;min-height:0;overflow:hidden}
.tg-col{display:flex;flex-direction:column;min-height:0;border-right:1px solid ${ARETE.rule};overflow:hidden}
.tg-col:last-child{border-right:none}

.tg-panel{display:flex;flex-direction:column;min-height:0;border-bottom:1px solid ${ARETE.rule};overflow:hidden}
.tg-panel:last-child{border-bottom:none}
.tg-panel.grow{flex:1 1 auto}
.tg-ph{display:flex;align-items:baseline;gap:8px;padding:6px 12px 5px;border-bottom:1px solid ${ARETE.ruleSoft};background:${ARETE.paper};flex:none}
.tg-ph .t{font-family:${ARETE.mono};font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:${ARETE.burgundy};white-space:nowrap}
.tg-ph .s{font-family:${ARETE.mono};font-size:8.5px;color:${ARETE.inkSoft};margin-left:auto;white-space:nowrap;font-variant-numeric:tabular-nums}
.tg-pb{padding:8px 13px 10px;overflow:auto;min-height:0;flex:1 1 auto}
.tg-pb::-webkit-scrollbar{width:5px}
.tg-pb::-webkit-scrollbar-thumb{background:${ARETE.rule}}

/* ── trees ── */
.tg-grp{font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:${ARETE.inkSoft};margin:7px 0 3px;display:flex;gap:6px;align-items:baseline}
.tg-grp:first-child{margin-top:0}
.tg-grp b{color:${ARETE.burgundy};font-weight:400}
.tg-grp i{margin-left:auto;font-style:normal;font-variant-numeric:tabular-nums}
.tg-tree{padding:5px 0 6px;border-bottom:1px solid ${ARETE.ruleSoft}}
.tg-tree:last-child{border-bottom:none}
.tg-tr{display:flex;align-items:center;gap:8px}
.tg-tname{font-family:${ARETE.serif};font-size:14.5px;font-weight:600;color:${ARETE.ink};line-height:1.15;flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tg-pips{display:inline-flex;gap:2px;flex:none}
.tg-pip{width:17px;height:9px;border:1px solid ${ARETE.rule};border-radius:1px;background:transparent;padding:0;cursor:pointer;transition:background .1s}
.tg-pip:disabled{cursor:default}
.tg-pip.on{background:${ARETE.burgundy};border-color:${ARETE.burgundy}}
.tg-pip.next:not(:disabled):hover{background:rgba(124,45,45,.2);border-color:${ARETE.burgundy}}
.tg-pip:focus-visible{outline:2px solid ${ARETE.burgundy};outline-offset:1px}
.tg-next{font-size:11.5px;line-height:1.35;color:${ARETE.inkSoft};margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tg-next b{color:${ARETE.inkMuted};font-weight:600}
.tg-sealed{color:${ARETE.inkSoft};font-style:italic}

/* ── capital ── */
.tg-metric{display:flex;align-items:baseline;gap:7px;margin-bottom:3px}
.tg-metric .l{font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;color:${ARETE.inkSoft};flex:1 1 auto}
.tg-metric .v{font-family:${ARETE.serif};font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;color:${ARETE.ink}}
.tg-bar{height:4px;background:${ARETE.ruleSoft};overflow:hidden;margin-bottom:8px}
.tg-bar span{display:block;height:100%;background:${ARETE.burgundy}}
.tg-gates{display:flex;flex-wrap:wrap;gap:3px;margin-top:2px}

/* ── check boxes ── */
.tg-box{width:12px;height:12px;flex:none;border:1px solid ${ARETE.inkSoft};background:transparent;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center}
.tg-box:disabled{cursor:default;border-color:${ARETE.rule}}
.tg-box.on{background:${ARETE.burgundy};border-color:${ARETE.burgundy}}
.tg-box:focus-visible{outline:2px solid ${ARETE.burgundy};outline-offset:1px}

/* ── unlocks ── */
.tg-ul{display:grid;grid-template-columns:8px 1fr;gap:0 8px;padding:5px 0;border-bottom:1px solid ${ARETE.ruleSoft}}
.tg-ul:last-child{border-bottom:none}
.tg-dot{width:6px;height:6px;border-radius:50%;flex:none;border:1px solid;margin-top:6px}
.tg-ul .t{font-family:${ARETE.serif};font-size:14px;font-weight:600;line-height:1.25}
.tg-ul .r{font-family:${ARETE.mono};font-size:9px;color:${ARETE.inkSoft};line-height:1.35;margin-top:1px}

/* ── ideas ── */
.tg-idea{padding:5px 0;border-bottom:1px solid ${ARETE.ruleSoft}}
.tg-idea:last-child{border-bottom:none}
.tg-ih{display:flex;align-items:baseline;gap:6px;margin-bottom:1px}
.tg-ih .st{font-family:${ARETE.mono};font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:${ARETE.burgundy};flex:none}
.tg-ih .kb{margin-left:auto;font-family:${ARETE.mono};font-size:8.5px;flex:none;font-variant-numeric:tabular-nums}
.tg-idea .c{font-size:11.5px;line-height:1.35;color:${ARETE.ink};display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

/* ── canon ── */
.tg-canon{margin-bottom:7px}
.tg-canon:last-child{margin-bottom:0}
.tg-book{display:flex;gap:6px;align-items:baseline;padding:2.5px 0;font-size:11.5px;line-height:1.3}
.tg-book .a{font-family:${ARETE.mono};font-size:9px;color:${ARETE.inkSoft};flex:none}
.tg-book .b{color:${ARETE.ink};flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tg-more{font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:${ARETE.burgundy};text-decoration:none;border-bottom:1px solid ${ARETE.rule}}
.tg-more:hover{border-bottom-color:${ARETE.burgundy}}

/* ── cadence ── */
.tg-wk{display:flex;gap:7px;align-items:baseline;font-size:11.5px;line-height:1.35;padding:4px 0;border-bottom:1px solid ${ARETE.ruleSoft};color:${ARETE.inkSoft}}
.tg-wk:last-child{border-bottom:none}
.tg-wk .w{font-family:${ARETE.mono};font-size:9px;color:${ARETE.burgundy};flex:none;width:20px}
.tg-wk .d{font-family:${ARETE.mono};font-size:9px;flex:none;width:64px}
.tg-wk .s{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${ARETE.inkMuted}}
.tg-wk.hot{background:rgba(124,45,45,.06)}
.tg-wk.hot .s{color:${ARETE.ink};font-weight:600}
.tg-q{padding:7px 0;border-bottom:1px solid ${ARETE.ruleSoft}}
.tg-q:last-child{border-bottom:none}
.tg-qh{display:flex;align-items:baseline;gap:6px;margin-bottom:3px}
.tg-qh .n{font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:${ARETE.burgundy};flex:none}
.tg-kpi{display:flex;gap:7px;align-items:flex-start;font-size:11.5px;line-height:1.35;color:${ARETE.inkMuted};padding:1.5px 0}
.tg-kpi.done{color:${ARETE.inkSoft};text-decoration:line-through}
.tg-kpi .k{flex:1 1 auto;min-width:0}
.tg-goal{display:flex;gap:7px;align-items:flex-start;font-size:12px;line-height:1.4;color:${ARETE.ink}}
.tg-goal.done{color:${ARETE.inkSoft};text-decoration:line-through}
.tg-goal .g{flex:1 1 auto;min-width:0}

.tg-foot{font-family:${ARETE.mono};font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:${ARETE.inkSoft};text-align:center;padding:4px 0 0;flex:none}

/* Below tablet the constraint cannot be met honestly, so it is released. */
@media (max-width:1000px){
  .tg{height:auto;overflow:visible;grid-template-rows:auto auto}
  .tg-grid{grid-template-columns:1fr 1fr;overflow:visible}
  .tg-col{border-right:none;border-bottom:1px solid ${ARETE.rule};overflow:visible}
  .tg-pb{overflow:visible}
  .tg-line{display:none}
}
@media (max-width:640px){
  .tg-grid{grid-template-columns:1fr}
  .tg-top{flex-wrap:wrap;gap:8px}
  .tg-stats{margin-left:0;width:100%}
  .tg-stat{padding-left:0;border-left:none;padding-right:16px;text-align:left}
}
@media (prefers-reduced-motion:reduce){.tg *{transition:none!important}}
`

function Tick() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke={ARETE.paper} strokeWidth="2.4" aria-hidden="true">
      <path d="M2.5 6.2L4.8 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Box({ on, onClick, label }: { on: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      type="button"
      className={`tg-box${on ? ' on' : ''}`}
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={on}
      aria-label={label}
      title={label}
    >
      {on && <Tick />}
    </button>
  )
}

function Panel({
  title,
  meta,
  grow,
  children,
}: {
  title: string
  meta?: string
  grow?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`tg-panel${grow ? ' grow' : ''}`}>
      <div className="tg-ph">
        <span className="t">{title}</span>
        {meta && <span className="s">{meta}</span>}
      </div>
      <div className="tg-pb">{children}</div>
    </section>
  )
}

const pct = (n: number) => `${Math.round(n * 100)}%`

export function GameBoard({ today }: { today: string }) {
  const { user, signIn, loading: authLoading } = useAuth()
  const [progress, setProgress] = useState<GameProgressDoc | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setProgress(await getGameProgress(user.uid).catch(() => ({} as GameProgressDoc)))
  }, [user])
  useEffect(() => { void load() }, [load])

  const levels = useMemo<Levels>(() => (progress?.levels || {}) as Levels, [progress])
  const gates = progress?.gates || {}
  const kpis = progress?.kpis || {}
  const goals = progress?.goals || {}

  const week = useMemo(() => isoWeekKey(today), [today])
  const month = useMemo(() => monthPlanFor(today), [today])
  const unlocks = useMemo(() => allUnlockStatuses(levels), [levels])
  const ideas = useMemo(() => ideasByStage(), [])

  const banked = recordBanked(today)
  const cleared = LAUNCH_GATES.filter((g) => gates[g.id]).length
  const gatePct = cleared / LAUNCH_GATES.length
  const earned = unlocks.filter((u) => u.state === 'earned').length
  const inReach = unlocks.filter((u) => u.state === 'in-reach').length
  const rungs = TREES.reduce((s, t) => s + (levels[t.id] ?? 0), 0)

  const editable = Boolean(user)
  const mutate = useCallback(
    async (key: string, fn: (uid: string) => Promise<void>) => {
      if (!user) return
      setBusy(key)
      try { await fn(user.uid); await load() } finally { setBusy(null) }
    },
    [user, load]
  )

  function TreeRow({ tree }: { tree: Tree }) {
    const level = (levels[tree.id] ?? 0) as Level
    const locked = isTreeLocked(tree.id, levels)
    const next = tree.rungs[level] ?? null
    const lock = tree.lockedBy
    const current = level > 0 ? tree.rungs[level - 1] : null

    return (
      <div className="tg-tree">
        <div className="tg-tr">
          <span className="tg-tname" title={`${tree.name} — ${tree.kind}, ${tree.tier}`}>{tree.name}</span>
          <span className="tg-pips">
            {tree.rungs.map((r) => (
              <button
                key={r.level}
                type="button"
                className={`tg-pip${r.level <= level ? ' on' : ''}${r.level === level + 1 ? ' next' : ''}`}
                disabled={!editable || locked || busy === tree.id}
                onClick={() => void mutate(tree.id, (uid) => setTreeLevel(uid, tree.id, level === r.level ? r.level - 1 : r.level))}
                aria-label={`${tree.name} level ${r.level} — ${r.name || LEVEL_NAMES[r.level - 1]}`}
                title={`${r.level} · ${r.name || LEVEL_NAMES[r.level - 1]} — ${r.gate}`}
              />
            ))}
          </span>
        </div>
        <div className="tg-next" title={locked ? undefined : next?.gate}>
          {locked && lock ? (
            <span className="tg-sealed">sealed · needs {TREE_BY_ID[lock.tree].name} {lock.level}</span>
          ) : next ? (
            <>
              <b>{current ? `L${level} · ` : ''}next — {next.name || LEVEL_NAMES[next.level - 1]}:</b> {next.gate}
            </>
          ) : (
            <b>ladder complete</b>
          )}
        </div>
      </div>
    )
  }

  function Group({ id }: { id: QuestLineId }) {
    const line = QUEST_LINES.find((l) => l.id === id)!
    const all = treesOf(id)
    // A tree still sealed by another belongs on the reverse, not here: it costs
    // height every morning and says the same thing every time.
    const trees = all.filter((t) => !isTreeLocked(t.id, levels))
    const got = all.reduce((s, t) => s + (levels[t.id] ?? 0), 0)
    return (
      <>
        <div className="tg-grp">
          <b>{line.numeral}</b> {line.name} <i>{got}/{all.length * 5}</i>
        </div>
        {trees.map((t) => <TreeRow key={t.id} tree={t} />)}
      </>
    )
  }

  return (
    <div className="tg">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="tg-top">
        <svg viewBox="0 0 240 240" width="30" height="30" className="tg-mark" aria-label={ARETE_LINES.house}>
          <path d={SPIRAL_PATH} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <circle cx="120" cy="120" r="2.6" fill="currentColor" />
        </svg>
        <div className="tg-id">
          <div className="h">Arete Technologies</div>
          <div className="n">The Long Game</div>
        </div>
        <div className="tg-line" title={THE_LINE}>{THE_LINE}</div>
        <dl className="tg-stats">
          <div className="tg-stat"><dt>Record</dt><dd>{pct(banked)}</dd></div>
          <div className="tg-stat"><dt>Gates</dt><dd>{pct(gatePct)}</dd></div>
          <div className="tg-stat"><dt>Rungs</dt><dd>{rungs}<i>/{TREES.length * 5}</i></dd></div>
          <div className="tg-stat"><dt>Unlocks</dt><dd>{earned}<i>/{unlocks.length}</i></dd></div>
        </dl>
        <a className="tg-auth" href="/game/reverse" style={{ textDecoration: 'none' }}>Reverse &rarr;</a>
        {!user && (
          <button className="tg-auth" onClick={signIn} disabled={authLoading} type="button">Sign in</button>
        )}
      </header>

      <main className="tg-grid">
        {/* ── col 1 · capital + the edge ── */}
        <div className="tg-col">
          <Panel title="Capital" meta={`to ${TRACK_RECORD.close.slice(0, 7)}`}>
            <div className="tg-metric"><span className="l">Record banked</span><span className="v">{pct(banked)}</span></div>
            <div className="tg-bar"><span style={{ width: pct(banked) }} /></div>
            <div className="tg-metric"><span className="l">Launch gates</span><span className="v">{cleared}/{LAUNCH_GATES.length}</span></div>
            <div className="tg-bar"><span style={{ width: pct(gatePct) }} /></div>
            <div className="tg-gates">
              {LAUNCH_GATES.map((g) => {
                const on = Boolean(gates[g.id])
                return (
                  <Box key={g.id} on={on} label={g.label}
                    onClick={editable ? () => void mutate(g.id, (uid) => setLaunchGate(uid, g.id, !on)) : undefined} />
                )
              })}
            </div>
          </Panel>
          <Panel title="The Edge" meta="manufacture &amp; capture">
            <Group id="edge" />
          </Panel>
          <Panel title="The Room" meta="conversion" grow>
            <Group id="room" />
          </Panel>
        </div>

        {/* ── col 2 · the instrument + overlap ── */}
        <div className="tg-col">
          <Panel title="The Instrument" meta="body &amp; mind">
            <Group id="instrument" />
          </Panel>
          <Panel title="Research ideas" meta={`${ideas.length} live · killed scores`}>
            {ideas.map((idea) => {
              const days = daysToKill(idea, today)
              const urgent = days <= 45
              return (
                <div className="tg-idea" key={idea.id} title={idea.kill}>
                  <div className="tg-ih">
                    <span className="st">{STAGE_NAMES[idea.stage]}</span>
                    <span style={{ fontFamily: ARETE.mono, fontSize: 8.5, color: ARETE.inkSoft }}>
                      &rarr; {TREE_BY_ID[idea.tree].name}
                    </span>
                    <span className="kb" style={{ color: urgent ? ARETE.burgundy : ARETE.inkSoft }}>
                      {days >= 0 ? `kills in ${days}d` : `overdue ${-days}d`}
                    </span>
                  </div>
                  <div className="c">{idea.claim}</div>
                </div>
              )
            })}
          </Panel>

          <Panel title="Canon" meta="next to open" grow>
            {CANON.map((c) => (
              <div className="tg-canon" key={c.tree}>
                <div className="tg-grp">
                  <b>&mdash;</b> {c.label}
                  <i><a className="tg-more" href={c.moreHref}>{c.moreLabel}</a></i>
                </div>
                {c.items.slice(0, 3).map((b) => (
                  <div className="tg-book" key={b.title} title={`${b.author}, ${b.year} — ${b.why}`}>
                    <span className="a">{b.year}</span>
                    <span className="b">{b.title} &middot; {b.author}</span>
                  </div>
                ))}
              </div>
            ))}
          </Panel>
        </div>

        {/* ── col 3 · cadence ── */}
        <div className="tg-col">
          <Panel title={month.label} meta={`week ${week.slice(-3)}`} grow>
            {month.weeks.map((w) => (
              <div className={`tg-wk${w.hot ? ' hot' : ''}`} key={w.week} title={w.shape}>
                <span className="w">{w.week}</span>
                <span className="d">{w.dates.replace('Sep ', '')}</span>
                <span className="s">{w.shape}</span>
              </div>
            ))}
            {[...QUEST_LINES, { id: 'mind' as const, numeral: 'III', name: 'Mind' }].map((l) => {
              const rowKpis = month.kpis.filter((k) => k.line === l.id)
              const goal = month.goals.find((g) => g.line === l.id)
              if (!rowKpis.length && !goal) return null
              const done = rowKpis.filter((k) => kpis[`${week}:${k.id}`]).length
              const goalOn = goal ? Boolean(goals[goal.id]) : false
              return (
                <div className="tg-q" key={l.id}>
                  <div className="tg-qh">
                    <span className="n">{l.name}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: ARETE.mono, fontSize: 8.5, color: ARETE.inkSoft }}>
                      {done}/{rowKpis.length} this week
                    </span>
                  </div>
                  {rowKpis.map((k) => {
                    const key = `${week}:${k.id}`
                    const on = Boolean(kpis[key])
                    return (
                      <div className={`tg-kpi${on ? ' done' : ''}`} key={k.id}>
                        <Box on={on} label={k.label}
                          onClick={editable ? () => void mutate(key, (uid) => setWeeklyKpi(uid, week, k.id, !on)) : undefined} />
                        <span className="k">{k.label}</span>
                      </div>
                    )
                  })}
                  {goal && (
                    <div className={`tg-goal${goalOn ? ' done' : ''}`} title={goal.note} style={{ marginTop: 3 }}>
                      <Box on={goalOn} label={goal.goal}
                        onClick={editable ? () => void mutate(goal.id, (uid) => setMonthGoal(uid, goal.id, !goalOn)) : undefined} />
                      <span className="g"><b style={{ color: ARETE.burgundy, fontWeight: 400, fontFamily: ARETE.mono, fontSize: 8.5, letterSpacing: '.14em' }}>GOAL </b>{goal.goal}</span>
                    </div>
                  )}
                </div>
              )
            })}
            <div className="tg-foot">{ARETE_LINES.motto}</div>
          </Panel>
        </div>
      </main>
    </div>
  )
}
