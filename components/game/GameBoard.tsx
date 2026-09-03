'use client'

/**
 * The board — the stateful half of /game.
 *
 * The page is public, so a visitor sees the whole structure and none of the
 * standing: every tree, rung and gate is legible, the levels are simply empty.
 * Signing in is what makes the pips clickable.
 *
 * Levels are attested rather than sensed. Phase 2 wires the rungs that already
 * have instruments — kite KPIs, Garmin, the tearsheet archive, Brier scores,
 * sit counts — but a rung you can award yourself is only worth anything while
 * its gate is written plainly enough to make lying to yourself uncomfortable.
 * That is why the gate text sits next to the pips rather than behind a link.
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
  TREE_BY_ID,
  TREES,
  TRACK_RECORD,
  recordBanked,
  treesOf,
  type Level,
  type QuestLineId,
  type Tree,
  type TreeId,
} from '@/lib/game/trees'
import { SOMEDAY, allUnlockStatuses, isTreeLocked, type Levels, type UnlockState } from '@/lib/game/unlocks'
import { isoWeekKey, monthPlanFor } from '@/lib/game/cadence'
import { ARETE } from '@/lib/arete/brand'

const CSS = `
.gb-h{display:flex;align-items:baseline;gap:12px;margin-bottom:6px;flex-wrap:wrap}
.gb-pips{display:inline-flex;gap:3px;align-items:center}
.gb-pip{width:22px;height:9px;border:1px solid ${ARETE.rule};border-radius:1px;background:transparent;padding:0;cursor:pointer;transition:background .12s,border-color .12s}
.gb-pip:disabled{cursor:default}
.gb-pip.on{background:${ARETE.burgundy};border-color:${ARETE.burgundy}}
.gb-pip.next:not(:disabled):hover{border-color:${ARETE.burgundy};background:rgba(124,45,45,.14)}
.gb-pip:focus-visible{outline:2px solid ${ARETE.burgundy};outline-offset:2px}

.gb-tree{display:grid;grid-template-columns:158px 128px 1fr;gap:14px;align-items:start;padding:9px 0;border-bottom:1px solid ${ARETE.ruleSoft}}
.gb-tree:last-child{border-bottom:none}
.gb-tn{font-family:${ARETE.serif};font-weight:600;font-size:15.5px;color:${ARETE.ink};line-height:1.25}
.gb-tn small{display:block;font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;color:${ARETE.inkSoft};font-weight:400;margin-top:1px}
.gb-lv{font-family:${ARETE.mono};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${ARETE.inkSoft};margin-top:4px}
.gb-lv b{color:${ARETE.burgundy};font-weight:500}
.gb-gate{font-family:${ARETE.sans};font-size:13px;line-height:1.45;color:${ARETE.inkMuted}}
.gb-gate b{color:${ARETE.ink};font-weight:600}
@media (max-width:700px){.gb-tree{grid-template-columns:1fr;gap:5px}}

.gb-bar{height:5px;background:${ARETE.ruleSoft};overflow:hidden;margin-top:5px}
.gb-bar span{display:block;height:100%;background:${ARETE.burgundy}}
.gb-metric{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:12px}
.gb-metric .m{border:1px solid ${ARETE.rule};background:${ARETE.paper};padding:11px 13px 13px}
.gb-metric dt{font-family:${ARETE.mono};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:${ARETE.inkSoft};margin:0 0 3px}
.gb-metric .v{font-family:${ARETE.serif};font-size:26px;font-weight:600;color:${ARETE.ink};line-height:1;font-variant-numeric:tabular-nums}
.gb-metric .sub{font-family:${ARETE.sans};font-size:11.5px;color:${ARETE.inkMuted};margin-top:5px;line-height:1.35}

.gb-check{display:flex;gap:8px;align-items:flex-start;padding:5px 0;font-family:${ARETE.sans};font-size:13px;line-height:1.45;color:${ARETE.inkMuted}}
.gb-box{width:14px;height:14px;margin-top:2px;flex:none;border:1px solid ${ARETE.inkSoft};background:transparent;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center}
.gb-box:disabled{cursor:default;border-color:${ARETE.rule}}
.gb-box.on{background:${ARETE.burgundy};border-color:${ARETE.burgundy}}
.gb-box:focus-visible{outline:2px solid ${ARETE.burgundy};outline-offset:2px}
.gb-check.done{color:${ARETE.inkSoft};text-decoration:line-through}

.gb-ul{display:grid;grid-template-columns:210px 1fr;gap:14px;padding:9px 0;border-bottom:1px solid ${ARETE.ruleSoft};align-items:baseline}
.gb-ul:last-child{border-bottom:none}
.gb-req{font-family:${ARETE.mono};font-size:11px;line-height:1.5;letter-spacing:.01em}
.gb-ul .t{font-family:${ARETE.serif};font-size:17px;font-weight:600;line-height:1.2;margin:0 0 2px}
.gb-ul .d{font-family:${ARETE.sans};font-size:12.5px;color:${ARETE.inkMuted};line-height:1.45}
.gb-st{font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;padding:2px 6px;border:1px solid;margin-left:7px;white-space:nowrap}
@media (max-width:700px){.gb-ul{grid-template-columns:1fr;gap:4px}}

.gb-cad{width:100%;border-collapse:collapse;margin-top:12px}
.gb-cad th{font-family:${ARETE.mono};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:${ARETE.inkSoft};text-align:left;font-weight:400;padding:0 12px 6px 0;border-bottom:1px solid ${ARETE.rule};white-space:nowrap}
.gb-cad td{padding:9px 12px 9px 0;border-bottom:1px solid ${ARETE.ruleSoft};vertical-align:top}
.gb-cad tr:last-child td{border-bottom:none}
.gb-cad .q{font-family:${ARETE.serif};font-size:15px;font-weight:600;color:${ARETE.ink};white-space:nowrap;line-height:1.25}
.gb-cad .q small{display:block;font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;color:${ARETE.burgundy};font-weight:400;margin-top:1px}
.gb-goal{font-family:${ARETE.sans};font-size:13px;line-height:1.45;color:${ARETE.ink}}
.gb-goal .n{display:block;color:${ARETE.inkMuted};margin-top:3px}

.gb-wk{width:100%;border-collapse:collapse;margin-top:10px}
.gb-wk td{padding:6px 10px 6px 0;border-bottom:1px solid ${ARETE.ruleSoft};font-family:${ARETE.sans};font-size:12.5px;line-height:1.4;color:${ARETE.inkMuted};vertical-align:top}
.gb-wk tr:last-child td{border-bottom:none}
.gb-wk .w{font-family:${ARETE.mono};font-size:10px;letter-spacing:.1em;color:${ARETE.burgundy};width:32px;white-space:nowrap}
.gb-wk .d{font-family:${ARETE.mono};font-size:10.5px;color:${ARETE.inkSoft};width:84px;white-space:nowrap}
.gb-wk .hot td{background:rgba(124,45,45,.06)}

.gb-note{font-family:${ARETE.sans};font-size:12.5px;color:${ARETE.inkSoft};margin-top:10px}
.gb-signin{font-family:${ARETE.mono};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:${ARETE.ink};background:transparent;border:1px solid ${ARETE.inkSoft};padding:6px 11px;cursor:pointer}
.gb-signin:hover{border-color:${ARETE.burgundy};color:${ARETE.burgundy}}
.gb-someday{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.gb-someday span{font-family:${ARETE.mono};font-size:10px;border:1px dashed ${ARETE.rule};color:${ARETE.inkSoft};padding:5px 9px}
.gb-scroll{overflow-x:auto}
`

const STATE_COLOR: Record<UnlockState, string> = {
  earned: ARETE.greenInk,
  'in-reach': ARETE.amberInk,
  locked: ARETE.inkSoft,
}
const STATE_LABEL: Record<UnlockState, string> = {
  earned: 'Earned',
  'in-reach': 'In reach',
  locked: 'Locked',
}

function Tick() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke={ARETE.paper} strokeWidth="2.2" aria-hidden="true">
      <path d="M2.5 6.2L4.8 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Box({ on, onClick, label }: { on: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      className={`gb-box${on ? ' on' : ''}`}
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={on}
      aria-label={label}
      type="button"
    >
      {on && <Tick />}
    </button>
  )
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

export function GameBoard({ today }: { today: string }) {
  const { user, signIn, loading: authLoading } = useAuth()
  const [progress, setProgress] = useState<GameProgressDoc | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const p = await getGameProgress(user.uid).catch(() => ({} as GameProgressDoc))
    setProgress(p)
  }, [user])

  useEffect(() => { void load() }, [load])

  const levels = useMemo<Levels>(() => (progress?.levels || {}) as Levels, [progress])
  const gates = progress?.gates || {}
  const kpis = progress?.kpis || {}
  const goals = progress?.goals || {}

  const week = useMemo(() => isoWeekKey(today), [today])
  const month = useMemo(() => monthPlanFor(today), [today])
  const unlocks = useMemo(() => allUnlockStatuses(levels), [levels])

  const banked = recordBanked(today)
  const closeLabel = new Date(TRACK_RECORD.close + 'T12:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
  const gatesCleared = LAUNCH_GATES.filter((g) => gates[g.id]).length
  const gatePct = LAUNCH_GATES.length ? gatesCleared / LAUNCH_GATES.length : 0
  const earned = unlocks.filter((u) => u.state === 'earned').length

  // ── Mutations. Optimistic locally, then reload so the doc stays the truth.
  const mutate = useCallback(
    async (key: string, fn: (uid: string) => Promise<void>) => {
      if (!user) return
      setBusy(key)
      try {
        await fn(user.uid)
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, load]
  )

  const clickPip = (tree: Tree, level: number) => {
    const current = levels[tree.id] ?? 0
    // Clicking the rung you are on steps back off it.
    void mutate(tree.id, (uid) => setTreeLevel(uid, tree.id, current === level ? level - 1 : level))
  }

  const editable = Boolean(user)

  function TreeRow({ tree }: { tree: Tree }) {
    const level = (levels[tree.id] ?? 0) as Level
    const locked = isTreeLocked(tree.id, levels)
    const rung = level > 0 ? tree.rungs[level - 1] : null
    const next = tree.rungs[level] ?? null
    const lock = tree.lockedBy

    return (
      <div className="gb-tree">
        <div>
          <div className="gb-tn">
            {tree.name}
            <small>{tree.kind} · {tree.tier}</small>
          </div>
        </div>
        <div>
          <div className="gb-pips">
            {tree.rungs.map((r) => (
              <button
                key={r.level}
                type="button"
                className={`gb-pip${r.level <= level ? ' on' : ''}${r.level === level + 1 ? ' next' : ''}`}
                disabled={!editable || locked || busy === tree.id}
                onClick={() => clickPip(tree, r.level)}
                aria-label={`${tree.name} — ${r.name || LEVEL_NAMES[r.level - 1]} (level ${r.level})`}
                title={`${r.level} · ${r.name || LEVEL_NAMES[r.level - 1]}`}
              />
            ))}
          </div>
          <div className="gb-lv">
            {locked && lock
              ? `sealed · needs ${TREE_BY_ID[lock.tree].name} ${lock.level}`
              : level === 0
                ? 'not started'
                : <>L{level} · <b>{rung?.name || LEVEL_NAMES[level - 1]}</b></>}
          </div>
        </div>
        <div className="gb-gate">
          {locked ? (
            <span style={{ color: ARETE.inkSoft }}>
              Opens when {TREE_BY_ID[lock!.tree].name} reaches {lock!.level}. A new element only once the first is genuinely yours.
            </span>
          ) : next ? (
            <>
              <b>Next — {next.name || LEVEL_NAMES[next.level - 1]}:</b> {next.gate}
            </>
          ) : (
            <b>Ladder complete.</b>
          )}
        </div>
      </div>
    )
  }

  function LineSection({ id, line }: { id: QuestLineId; line: (typeof QUEST_LINES)[number] }) {
    const trees = treesOf(id)
    const reached = trees.reduce((s, t) => s + (levels[t.id] ?? 0), 0)
    const total = trees.length * 5
    return (
      <div style={{ marginTop: 16 }}>
        <div className="gb-h" style={{ borderBottom: `1px solid ${ARETE.rule}`, paddingBottom: 7 }}>
          <span style={{ fontFamily: ARETE.mono, fontSize: 10, letterSpacing: '.2em', color: ARETE.burgundy }}>
            {line.numeral}
          </span>
          <span style={{ fontFamily: ARETE.serif, fontSize: 21, fontWeight: 600, color: ARETE.ink }}>{line.name}</span>
          <span style={{ fontFamily: ARETE.sans, fontSize: 12, color: ARETE.inkSoft }}>{line.role}</span>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: ARETE.mono,
              fontSize: 11,
              color: ARETE.inkMuted,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {reached}/{total} rungs
          </span>
        </div>
        <p style={{ fontFamily: ARETE.sans, fontSize: 12.5, color: ARETE.inkMuted, margin: '7px 0 0', maxWidth: '66ch', lineHeight: 1.45 }}>
          {line.blurb}
        </p>
        {trees.map((t) => <TreeRow key={t.id} tree={t} />)}
      </div>
    )
  }

  const capitalLine = QUEST_LINES[0]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ══ Capital ══ */}
      <section className="ats-section" id="capital">
        <div className="ats-sechead">
          <span className="ats-numeral">Main</span>
          <h2>Capital</h2>
          <span className="ats-note">Percent only — this page is public</span>
        </div>
        <div className="ats-intro"><p>{capitalLine.blurb}</p></div>

        <dl className="gb-metric">
          <div className="m">
            <dt>Record banked</dt>
            <div className="v">{pct(banked)}</div>
            <div className="gb-bar"><span style={{ width: pct(banked) }} /></div>
            <div className="sub">Of the twelve months to {closeLabel}. Time does this one; you only have to not break the record.</div>
          </div>
          <div className="m">
            <dt>Launch gates cleared</dt>
            <div className="v">{pct(gatePct)}</div>
            <div className="gb-bar"><span style={{ width: pct(gatePct) }} /></div>
            <div className="sub">{gatesCleared} of {LAUNCH_GATES.length}. This is the one you actually control.</div>
          </div>
          <div className="m">
            <dt>Unlocks earned</dt>
            <div className="v">{earned}<span style={{ fontSize: 15, color: ARETE.inkSoft }}> / {unlocks.length}</span></div>
            <div className="gb-bar"><span style={{ width: pct(unlocks.length ? earned / unlocks.length : 0) }} /></div>
            <div className="sub">Each needs two trees at once. None of them can be bought with a single ladder.</div>
          </div>
        </dl>

        <details style={{ marginTop: 12 }}>
          <summary>The eight launch gates</summary>
          <div className="ats-dbody">
            {LAUNCH_GATES.map((g) => {
              const on = Boolean(gates[g.id])
              return (
                <div key={g.id} className={`gb-check${on ? ' done' : ''}`}>
                  <Box
                    on={on}
                    label={g.label}
                    onClick={editable ? () => void mutate(g.id, (uid) => setLaunchGate(uid, g.id, !on)) : undefined}
                  />
                  <span>{g.label}</span>
                </div>
              )
            })}
          </div>
        </details>

        {!user && (
          <p className="gb-note">
            Signed out, so the board shows its structure and none of its standing.{' '}
            <button className="gb-signin" onClick={signIn} disabled={authLoading} type="button">Sign in</button>
          </p>
        )}
      </section>

      {/* ══ Trees ══ */}
      <section className="ats-section" id="trees">
        <div className="ats-sechead">
          <span className="ats-numeral">I–III</span>
          <h2>The trees</h2>
          <span className="ats-note">
            {TREES.filter((t) => (levels[t.id] ?? 0) > 0).length} of {TREES.length} started
          </span>
        </div>
        <div className="ats-intro">
          <p>
            One ladder across every tree — imitation, structure, adaptation, integration, transcendence — so a level
            in one means roughly what it means in another. That is what makes the overlaps below mean anything.
            Click a rung to set where you stand; click the rung you are on to step back off it.
          </p>
        </div>
        {QUEST_LINES.filter((l) => l.id !== 'capital').map((l) => (
          <LineSection key={l.id} id={l.id} line={l} />
        ))}
      </section>

      {/* ══ Unlocks ══ */}
      <section className="ats-section" id="unlocks">
        <div className="ats-sechead">
          <span className="ats-numeral">IV</span>
          <h2>Overlap</h2>
          <span className="ats-note">{earned} earned · {unlocks.filter((u) => u.state === 'in-reach').length} in reach</span>
        </div>
        <div className="ats-intro">
          <p>
            Eleven progress bars side by side is a chore list. What makes a tree a tree is that the branches meet —
            so every unlock but one needs two trees at once. <em>In reach</em> means a single rung anywhere finishes it.
          </p>
        </div>
        <div style={{ marginTop: 12 }}>
          {unlocks.map(({ unlock, state, label }) => (
            <div className="gb-ul" key={unlock.id}>
              <div className="gb-req" style={{ color: state === 'locked' ? ARETE.inkSoft : ARETE.burgundy }}>{label}</div>
              <div>
                <p className="t" style={{ color: state === 'locked' ? ARETE.inkMuted : ARETE.ink }}>
                  {unlock.title}
                  <span className="gb-st" style={{ color: STATE_COLOR[state], borderColor: STATE_COLOR[state] }}>
                    {STATE_LABEL[state]}
                  </span>
                </p>
                <p className="d">{unlock.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <details>
          <summary>Noted, not emphasised</summary>
          <div className="ats-dbody">
            <p style={{ fontFamily: ARETE.sans, fontSize: 12.5, color: ARETE.inkMuted, margin: 0 }}>
              Real-world rewards, kept visible and never made targets.
            </p>
            <div className="gb-someday">{SOMEDAY.map((s) => <span key={s}>{s}</span>)}</div>
          </div>
        </details>
      </section>

      {/* ══ Cadence ══ */}
      <section className="ats-section" id="cadence">
        <div className="ats-sechead">
          <span className="ats-numeral">V</span>
          <h2>Cadence</h2>
          <span className="ats-note">{month.label} · week {week.slice(-3)}</span>
        </div>
        <div className="ats-intro"><p>{month.framing}</p></div>

        <table className="gb-wk">
          <tbody>
            {month.weeks.map((w) => (
              <tr key={w.week} className={w.hot ? 'hot' : undefined}>
                <td className="w">{w.week}</td>
                <td className="d">{w.dates}</td>
                <td>{w.shape}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="gb-scroll">
          <table className="gb-cad" style={{ minWidth: 660 }}>
            <thead>
              <tr>
                <th style={{ width: 128 }}>Quest</th>
                <th style={{ width: '42%' }}>This week</th>
                <th>{month.label.split(' ')[0]} goal</th>
              </tr>
            </thead>
            <tbody>
              {[...QUEST_LINES, { id: 'mind' as const, numeral: 'III', name: 'Mind', role: '', blurb: '' }].map((l) => {
                const rowKpis = month.kpis.filter((k) => k.line === l.id)
                const goal = month.goals.find((g) => g.line === l.id)
                if (rowKpis.length === 0 && !goal) return null
                const goalOn = goal ? Boolean(goals[goal.id]) : false
                return (
                  <tr key={l.id}>
                    <td className="q">{l.name}<small>{l.numeral}</small></td>
                    <td>
                      {rowKpis.map((k) => {
                        const key = `${week}:${k.id}`
                        const on = Boolean(kpis[key])
                        return (
                          <div key={k.id} className={`gb-check${on ? ' done' : ''}`}>
                            <Box
                              on={on}
                              label={k.label}
                              onClick={editable ? () => void mutate(key, (uid) => setWeeklyKpi(uid, week, k.id, !on)) : undefined}
                            />
                            <span>{k.label}</span>
                          </div>
                        )
                      })}
                    </td>
                    <td>
                      {goal && (
                        <div className={`gb-check${goalOn ? ' done' : ''}`}>
                          <Box
                            on={goalOn}
                            label={goal.goal}
                            onClick={editable ? () => void mutate(goal.id, (uid) => setMonthGoal(uid, goal.id, !goalOn)) : undefined}
                          />
                          <span className="gb-goal">
                            <b>{goal.goal}</b>
                            {goal.note && <span className="n">{goal.note}</span>}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="gb-note">
          Weekly boxes are keyed to the ISO week, so a new week starts clean on its own — nothing resets them, and
          last week&apos;s record stays where it was.
        </p>
      </section>
    </>
  )
}
