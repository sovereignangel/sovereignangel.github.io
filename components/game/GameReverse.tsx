'use client'

/**
 * The reverse of the sheet.
 *
 * A tearsheet has a front you read every morning and a back you consult. The
 * front carries what you act on this week; everything here is reference —
 * consulted occasionally, never scanned daily, and therefore allowed to
 * scroll.
 *
 * What lives here: the overlap wall in full, with the rationale the front had
 * to compress into a tooltip; every tree's complete ladder, all five gates
 * visible at once; the trees still sealed behind another; and the someday
 * shelf. All of it derived from the same stored levels the board uses, so the
 * two sides can never disagree.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getGameProgress } from '@/lib/firestore/game'
import type { GameProgressDoc } from '@/lib/types/game'
import {
  LEVEL_NAMES,
  QUEST_LINES,
  TREES,
  TREE_BY_ID,
  treesOf,
  type Level,
  type Tree,
} from '@/lib/game/trees'
import { SOMEDAY, allUnlockStatuses, isTreeLocked, type Levels, type UnlockState } from '@/lib/game/unlocks'
import { STAGE_RULES } from '@/lib/game/ideas'
import { ARETE } from '@/lib/arete/brand'

const CSS = `
.rv-ul{display:grid;grid-template-columns:12px 1fr;gap:0 10px;padding:10px 0;border-bottom:1px solid ${ARETE.ruleSoft}}
.rv-ul:last-child{border-bottom:none}
.rv-dot{width:8px;height:8px;border-radius:50%;border:1px solid;margin-top:7px}
.rv-ul .t{font-family:${ARETE.serif};font-size:18px;font-weight:600;line-height:1.2;color:${ARETE.ink};margin:0}
.rv-ul .r{font-family:${ARETE.mono};font-size:10px;line-height:1.4;margin:2px 0 0}
.rv-ul .d{font-family:${ARETE.sans};font-size:13px;line-height:1.5;color:${ARETE.inkMuted};margin:3px 0 0;max-width:70ch}
.rv-chip{font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;padding:2px 6px;border:1px solid;margin-left:8px;white-space:nowrap}

.rv-tree{padding:11px 0;border-bottom:1px solid ${ARETE.ruleSoft}}
.rv-tree:last-child{border-bottom:none}
.rv-th{display:flex;align-items:baseline;gap:9px;margin-bottom:6px;flex-wrap:wrap}
.rv-th .n{font-family:${ARETE.serif};font-size:17px;font-weight:600;color:${ARETE.ink}}
.rv-th .k{font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:${ARETE.inkSoft}}
.rv-th .lv{margin-left:auto;font-family:${ARETE.mono};font-size:10px;color:${ARETE.burgundy}}
.rv-rungs{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));border:1px solid ${ARETE.ruleSoft}}
.rv-rung{padding:8px 10px 10px;border-right:1px solid ${ARETE.ruleSoft};background:${ARETE.paper}}
.rv-rung:last-child{border-right:none}
.rv-rung.on{background:rgba(124,45,45,.07)}
.rv-rung .l{font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:${ARETE.burgundy};display:block;margin-bottom:2px}
.rv-rung .nm{font-family:${ARETE.serif};font-size:14px;font-weight:600;color:${ARETE.ink};display:block;line-height:1.15;margin-bottom:3px}
.rv-rung .g{font-family:${ARETE.sans};font-size:11.5px;line-height:1.4;color:${ARETE.inkMuted}}

.rv-sealed{border:1px solid ${ARETE.rule};border-left:2px solid ${ARETE.burgundy};background:${ARETE.paper};padding:12px 14px;margin-top:10px}
.rv-someday{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.rv-someday span{font-family:${ARETE.mono};font-size:10.5px;border:1px dashed ${ARETE.rule};color:${ARETE.inkSoft};padding:6px 10px}
.rv-gates{display:grid;grid-template-columns:repeat(auto-fit,minmax(178px,1fr));border:1px solid ${ARETE.ruleSoft};margin-top:10px}
.rv-gate{padding:9px 11px 11px;border-right:1px solid ${ARETE.ruleSoft};background:${ARETE.paper}}
.rv-gate:last-child{border-right:none}
.rv-gate .s{font-family:${ARETE.mono};font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:${ARETE.burgundy};display:block}
.rv-gate .n{font-family:${ARETE.serif};font-size:15px;font-weight:600;color:${ARETE.ink};display:block;margin:2px 0 3px}
.rv-gate .k{font-family:${ARETE.mono};font-size:9.5px;color:${ARETE.burgundy};line-height:1.35}
`

const STATE: Record<UnlockState, { c: string; label: string }> = {
  earned: { c: ARETE.greenInk, label: 'earned' },
  'in-reach': { c: ARETE.amberInk, label: 'in reach' },
  locked: { c: ARETE.inkSoft, label: 'locked' },
}

export function GameReverse() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<GameProgressDoc | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setProgress(await getGameProgress(user.uid).catch(() => ({} as GameProgressDoc)))
  }, [user])
  useEffect(() => { void load() }, [load])

  const levels = useMemo<Levels>(() => (progress?.levels || {}) as Levels, [progress])
  const unlocks = useMemo(() => allUnlockStatuses(levels), [levels])
  const sealed = TREES.filter((t) => isTreeLocked(t.id, levels))

  function Ladder({ tree }: { tree: Tree }) {
    const level = (levels[tree.id] ?? 0) as Level
    return (
      <div className="rv-tree">
        <div className="rv-th">
          <span className="n">{tree.name}</span>
          <span className="k">{tree.kind} · {tree.tier}</span>
          <span className="lv">
            {level === 0 ? 'not started' : `L${level} · ${tree.rungs[level - 1].name || LEVEL_NAMES[level - 1]}`}
          </span>
        </div>
        <div className="rv-rungs">
          {tree.rungs.map((r) => (
            <div className={`rv-rung${r.level <= level ? ' on' : ''}`} key={r.level}>
              <span className="l">L{r.level}</span>
              <span className="nm">{r.name || LEVEL_NAMES[r.level - 1]}</span>
              <span className="g">{r.gate}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="ats-section" id="overlap">
        <div className="ats-sechead">
          <span className="ats-numeral">i</span>
          <h2>Overlap</h2>
          <span className="ats-note">
            {unlocks.filter((u) => u.state === 'earned').length} earned ·{' '}
            {unlocks.filter((u) => u.state === 'in-reach').length} in reach
          </span>
        </div>
        <div className="ats-intro">
          <p>
            Every unlock but one needs levels in two trees at once. That is the mechanic the whole board exists
            for — eleven ladders climbed separately is a chore list; the branches meeting is what makes it a tree.
            <em> In reach</em> means a single rung anywhere finishes it.
          </p>
        </div>
        <div style={{ marginTop: 12 }}>
          {unlocks.map(({ unlock, state, label }) => (
            <div className="rv-ul" key={unlock.id}>
              <span className="rv-dot" style={{ borderColor: STATE[state].c, background: state === 'earned' ? STATE[state].c : 'transparent' }} />
              <div>
                <p className="t">
                  {unlock.title}
                  <span className="rv-chip" style={{ color: STATE[state].c, borderColor: STATE[state].c }}>{STATE[state].label}</span>
                </p>
                <p className="r" style={{ color: state === 'locked' ? ARETE.inkSoft : ARETE.burgundy }}>{label}</p>
                <p className="d">{unlock.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {sealed.length > 0 && (
        <section className="ats-section" id="sealed">
          <div className="ats-sechead">
            <span className="ats-numeral">ii</span>
            <h2>Sealed</h2>
            <span className="ats-note">off the board until they open</span>
          </div>
          <div className="ats-intro">
            <p>
              A tree gated behind another is kept off the working sheet on purpose: it costs height every morning
              and says the same thing every time. It reappears on the board the moment it opens.
            </p>
          </div>
          {sealed.map((t) => (
            <div className="rv-sealed" key={t.id}>
              <div className="rv-th">
                <span className="n">{t.name}</span>
                <span className="k">{t.kind}</span>
                <span className="lv">needs {TREE_BY_ID[t.lockedBy!.tree].name} {t.lockedBy!.level}</span>
              </div>
              <div className="rv-rungs">
                {t.rungs.map((r) => (
                  <div className="rv-rung" key={r.level}>
                    <span className="l">L{r.level}</span>
                    <span className="nm">{r.name || LEVEL_NAMES[r.level - 1]}</span>
                    <span className="g">{r.gate}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="rv-someday">{SOMEDAY.map((s) => <span key={s}>{s}</span>)}</div>
        </section>
      )}

      <section className="ats-section" id="ladders">
        <div className="ats-sechead">
          <span className="ats-numeral">iii</span>
          <h2>The ladders in full</h2>
          <span className="ats-note">every gate, all five rungs</span>
        </div>
        <div className="ats-intro">
          <p>
            The board shows only the rung in front of you. This is the whole climb — useful when deciding whether a
            level is honestly yours, which is the only question that keeps an attested ladder worth anything.
          </p>
        </div>
        {QUEST_LINES.filter((l) => l.id !== 'capital').map((line) => (
          <div key={line.id} style={{ marginTop: 14 }}>
            <div className="ats-sechead" style={{ borderBottom: `1px solid ${ARETE.rule}`, paddingBottom: 5 }}>
              <span className="ats-numeral">{line.numeral}</span>
              <h2 style={{ fontSize: 21 }}>{line.name}</h2>
              <span className="ats-note">{line.role}</span>
            </div>
            {treesOf(line.id).map((t) => <Ladder key={t.id} tree={t} />)}
          </div>
        ))}
      </section>

      <section className="ats-section" id="gates">
        <div className="ats-sechead">
          <span className="ats-numeral">iv</span>
          <h2>The idea gates</h2>
          <span className="ats-note">killing one scores</span>
        </div>
        <div className="ats-intro">
          <p>
            Every research idea carries a pre-written condition that ends it by a date. A kill advances Finding
            Signal; a stale unkilled idea costs it. Otherwise the board quietly rewards hoarding pretty hypotheses,
            which is the failure mode of every research log ever kept.
          </p>
        </div>
        <div className="rv-gates">
          {STAGE_RULES.map((r) => (
            <div className="rv-gate" key={r.stage}>
              <span className="s">Stage {r.stage}</span>
              <span className="n">{r.name}</span>
              <span className="k">{r.kill}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
