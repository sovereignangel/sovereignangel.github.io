'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { KiteSession } from '@/lib/types'
import {
  getKiteSessions,
  addKiteSession,
  deleteKiteSession,
  getGarminKiteSessions,
  getKiteProgress,
  setKiteMilestone,
} from '@/lib/firestore'
import { computeKiteStats } from '@/lib/kite/belts'
import {
  FUNDAMENTALS,
  MASTERY_PATHS,
  MASTERY_BELTS,
  LIFE_UNLOCKS,
  LEVEL_SHORT,
  type PathMilestone,
  type MasteryPath,
  computeMasteryState,
  computePathStatus,
  lockedPathLabel,
  IKO_LEVELS,
  currentIkoLevel,
  nextMilestones,
  isMilestoneMet,
  isUnlockMet,
  autoProgressLabel,
  KITE_GLOSSARY,
} from '@/lib/kite/paths'
import { SessionModal } from '@/components/mastery/kite/SessionModal'
import { UnlockIcon } from './UnlockIcons'

interface Props {
  uid: string
}

// ─── Inline glossing (active until brown belt) ────────────────

const VARIANT_DEFS = new Map<string, string>()
for (const g of KITE_GLOSSARY) {
  for (const v of g.variants ?? []) VARIANT_DEFS.set(v.toLowerCase(), g.def)
}
const GLOSS_RE = new RegExp(
  `\\b(${Array.from(VARIANT_DEFS.keys())
    .sort((a, b) => b.length - a.length)
    .join('|')
    .replace(/ /g, '\\s')})\\b`,
  'gi'
)

function GlossedText({ text, enabled }: { text: string; enabled: boolean }) {
  if (!enabled) return <>{text}</>
  return (
    <>
      {text.split(GLOSS_RE).map((part, i) => {
        const def = part ? VARIANT_DEFS.get(part.toLowerCase()) : undefined
        return def ? (
          <span key={i} title={def} className="border-b border-dotted border-surf-muted/70 cursor-help">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </>
  )
}

function CheckMark({ met }: { met: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full border shrink-0 ${
        met ? 'bg-surf-teal border-surf-teal' : 'bg-transparent border-surf-faint'
      }`}
      aria-hidden="true"
    >
      {met && (
        <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1.5 5.5 L4 8 L8.5 2.5" />
        </svg>
      )}
    </span>
  )
}

function MilestoneRow({
  milestone,
  met,
  progress,
  gloss,
  onToggle,
}: {
  milestone: PathMilestone
  met: boolean
  progress: string | null
  gloss: boolean
  onToggle: (checked: boolean) => void
}) {
  const auto = milestone.kind === 'auto'
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-surf-rule-light last:border-b-0">
      {auto ? (
        <span className="mt-0.5">
          <CheckMark met={met} />
        </span>
      ) : (
        <button
          onClick={() => onToggle(!met)}
          className="mt-0.5 cursor-pointer"
          aria-label={met ? `Uncheck ${milestone.label}` : `Check off ${milestone.label}`}
        >
          <CheckMark met={met} />
        </button>
      )}
      <div className="min-w-0">
        <div className={`text-[11px] font-medium leading-snug ${met ? 'text-surf-muted line-through decoration-surf-faint' : 'text-surf-ink'}`}>
          {milestone.label}
          {auto && (
            <span className={`ml-1.5 font-mono text-[9px] px-1 py-px rounded-sm ${met ? 'bg-surf-teal-bg text-surf-teal' : 'bg-surf-sun-bg text-surf-sun-ink'}`}>
              auto {progress ? `· ${progress}` : ''}
            </span>
          )}
        </div>
        <div className="text-[10px] text-surf-muted leading-snug mt-0.5">
          <GlossedText text={milestone.drill} enabled={gloss} />
        </div>
      </div>
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 10 10"
      className={`w-2.5 h-2.5 text-surf-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 3.5 L5 6.5 L8 3.5" />
    </svg>
  )
}

function LevelMeter({ label, met, total, complete }: { label: string; met: number; total: number; complete: boolean }) {
  return (
    <div className="flex items-center gap-1" title={`${label} ${met}/${total}`}>
      <span className="font-mono text-[8px] uppercase text-surf-muted">{label}</span>
      <div className="w-6 md:w-8 h-1 rounded-full bg-surf-rule-light overflow-hidden">
        <div
          className={`h-full rounded-full ${complete ? 'bg-surf-teal' : 'bg-surf-sun'}`}
          style={{ width: `${(met / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

function PathRow({
  path,
  stats,
  milestones,
  gloss,
  onToggle,
}: {
  path: MasteryPath
  stats: ReturnType<typeof computeKiteStats>
  milestones: Record<string, boolean>
  gloss: boolean
  onToggle: (id: string, checked: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const status = computePathStatus(path, stats, milestones)
  const lockedLabel = lockedPathLabel(path.id, stats, milestones)

  if (lockedLabel) {
    return (
      <div className="border-b border-surf-rule-light last:border-b-0">
        <div className="w-full flex items-center gap-2 py-2 opacity-55">
          <span className="font-serif text-[13px] font-semibold text-surf-deep w-[72px] shrink-0">{path.name}</span>
          <span className="font-mono text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border shrink-0 bg-transparent text-surf-faint border-dashed border-surf-rule">
            locked
          </span>
          <span className="hidden lg:inline text-[9px] text-surf-muted truncate min-w-0 flex-1">{path.tagline}</span>
          <span className="ml-auto flex items-center gap-1.5 shrink-0 text-surf-muted">
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span className="text-[9px]">{lockedLabel.toLowerCase()}</span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-surf-rule-light last:border-b-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 py-2 text-left cursor-pointer">
        <span className="font-serif text-[13px] font-semibold text-surf-deep w-[72px] shrink-0">{path.name}</span>
        <span
          className={`font-mono text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${
            status.rank === 3
              ? 'bg-surf-navy text-white border-surf-navy'
              : status.rank > 0
                ? 'bg-surf-teal-bg text-surf-teal border-surf-teal/30'
                : 'bg-transparent text-surf-faint border-surf-rule'
          }`}
        >
          {status.rank === 0 ? 'open' : LEVEL_SHORT[status.levelName as keyof typeof LEVEL_SHORT]}
        </span>
        <span className="hidden lg:inline text-[9px] text-surf-muted truncate min-w-0 flex-1">{path.tagline}</span>
        <span className="ml-auto flex items-center gap-2 shrink-0">
          {status.levels.map(l => (
            <LevelMeter key={l.level} label={LEVEL_SHORT[l.level]} met={l.met} total={l.total} complete={l.complete} />
          ))}
          <Chevron open={open} />
        </span>
      </button>
      {open && (
        <div className="pb-2">
          <div className="lg:hidden text-[10px] text-surf-muted mb-1">{path.tagline}</div>
          {path.levels.map(level => (
            <div key={level.level} className="mt-1.5 first:mt-0">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-wide text-surf-teal">
                {level.level}
              </div>
              {level.milestones.map(m => (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  met={isMilestoneMet(m, stats, milestones)}
                  progress={autoProgressLabel(m, stats)}
                  gloss={gloss}
                  onToggle={checked => onToggle(m.id, checked)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function WindMasteryDashboard({ uid }: Props) {
  const [sessions, setSessions] = useState<KiteSession[]>([])
  const [garminSessions, setGarminSessions] = useState<KiteSession[]>([])
  const [milestones, setMilestones] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [foundationOpen, setFoundationOpen] = useState(false)
  const [beltOpen, setBeltOpen] = useState(false)

  const load = useCallback(async () => {
    const [s, g, p] = await Promise.all([
      getKiteSessions(uid),
      getGarminKiteSessions(uid).catch(() => [] as KiteSession[]),
      getKiteProgress(uid),
    ])
    setSessions(s)
    setGarminSessions(g)
    setMilestones(p.milestones || {})
    setLoading(false)
  }, [uid])

  useEffect(() => {
    load()
  }, [load])

  // Garmin kite activities merge in automatically; a manual log on the same
  // date wins (it carries the Surfr numbers), so hours never double-count.
  const combined = useMemo(() => {
    const manualDates = new Set(sessions.map(s => s.date))
    return [...sessions, ...garminSessions.filter(g => !manualDates.has(g.date))]
  }, [sessions, garminSessions])

  const stats = useMemo(() => computeKiteStats(combined), [combined])
  const state = useMemo(() => computeMasteryState(stats, milestones), [stats, milestones])
  const nextThree = useMemo(() => nextMilestones(stats, milestones, 3), [stats, milestones])

  const handleToggle = async (id: string, checked: boolean) => {
    setMilestones(prev => ({ ...prev, [id]: checked }))
    await setKiteMilestone(uid, id, checked)
  }

  const handleAdd = async (session: Omit<KiteSession, 'id' | 'createdAt'>) => {
    await addKiteSession(uid, session)
    await load()
  }

  const handleDelete = async (sessionId: string) => {
    await deleteKiteSession(uid, sessionId)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  const currentBelt = state.currentBeltIndex >= 0 ? MASTERY_BELTS[state.currentBeltIndex] : null
  const targetBelt = MASTERY_BELTS[state.targetBeltIndex]
  const ikoNow = currentIkoLevel(state)
  const hours = stats.totalHours % 1 === 0 ? `${stats.totalHours}` : stats.totalHours.toFixed(1)
  // Gloss beach vocabulary until brown belt (index 3)
  const glossEnabled = state.currentBeltIndex < 3

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-surf-card border border-surf-rule rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stats strip — hours aggregate automatically from logged sessions */}
      <div className="bg-surf-card border border-surf-rule rounded-xl p-3 shadow-[0_2px_12px_rgba(13,92,99,0.06)]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            onClick={() => setBeltOpen(o => !o)}
            className="flex items-center gap-2 text-left cursor-pointer"
            aria-expanded={beltOpen}
            aria-label="Show the belt ladder"
          >
            <span
              className="inline-block w-7 h-3.5 rounded-sm border border-surf-rule"
              style={{ backgroundColor: currentBelt?.color ?? '#f7f4ec' }}
              title={currentBelt ? `${currentBelt.name} belt` : 'Unranked'}
            />
            <div>
              <div className="font-serif text-[15px] font-semibold text-surf-deep leading-none flex items-center gap-1.5">
                {currentBelt ? `${currentBelt.name} Belt` : 'Unranked'}
                <Chevron open={beltOpen} />
              </div>
              <div className="text-[9px] text-surf-muted mt-0.5">
                next: {targetBelt.name} — {targetBelt.requirement.toLowerCase()}
              </div>
            </div>
          </button>
          {[
            { label: 'hours on water', value: hours },
            { label: 'sessions', value: `${stats.sessionCount}` },
            { label: 'best height', value: stats.bestHeightM > 0 ? `${stats.bestHeightM.toFixed(1)}m` : '—' },
            { label: 'best airtime', value: stats.bestAirtimeSec > 0 ? `${stats.bestAirtimeSec.toFixed(1)}s` : '—' },
          ].map(t => (
            <div key={t.label}>
              <div className="font-mono text-[15px] font-semibold text-surf-ink leading-none">{t.value}</div>
              <div className="text-[9px] text-surf-muted mt-0.5">{t.label}</div>
            </div>
          ))}
          <button
            onClick={() => setModalOpen(true)}
            className="ml-auto font-serif text-[11px] font-medium px-3 py-1.5 rounded-full border bg-surf-teal text-white border-surf-teal hover:bg-surf-deep cursor-pointer"
          >
            Log Session
          </button>
        </div>
        {beltOpen && (
          <div className="mt-2 pt-1 border-t border-surf-rule-light grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <div>
            {MASTERY_BELTS.map((belt, i) => {
              const earned = state.beltsEarned[belt.id]
              const isTarget = !earned && i === state.targetBeltIndex
              return (
                <div
                  key={belt.id}
                  className={`flex items-start gap-2.5 py-2 border-b border-surf-rule-light last:border-b-0 ${
                    earned ? '' : isTarget ? '' : 'opacity-60'
                  }`}
                >
                  <span
                    className="inline-block w-8 h-4 rounded-sm border border-surf-rule mt-0.5 shrink-0"
                    style={{ backgroundColor: belt.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-[13px] font-semibold text-surf-deep">{belt.name}</span>
                      <span className="font-mono text-[9px] text-surf-muted uppercase tracking-wide">{belt.requirement}</span>
                      <span className="font-mono text-[9px] text-surf-faint">&asymp; {belt.iko}</span>
                      {earned && (
                        <span className="font-mono text-[9px] font-semibold px-1.5 py-px rounded-sm bg-surf-teal text-white">earned</span>
                      )}
                      {isTarget && (
                        <span className="font-mono text-[9px] font-semibold px-1.5 py-px rounded-sm bg-surf-sun-bg text-surf-sun-ink border border-surf-sun/40">
                          current target
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-surf-muted leading-snug mt-0.5">
                      <GlossedText text={belt.skills} enabled={glossEnabled} />
                    </div>
                    {belt.id === 'blue' && !state.whiteEarned && (
                      <div className="font-mono text-[9px] text-surf-teal mt-0.5">
                        {state.fundamentalsMet}/{state.fundamentalsTotal} fundamentals — checklist in Foundation below
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            </div>
            <div className="md:border-l md:border-surf-rule-light md:pl-5">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-wide text-surf-teal pt-2 mb-0.5">
                IKO official levels
              </div>
              {IKO_LEVELS.map(l => {
                const here = l.level === ikoNow
                const passed = l.level < ikoNow
                return (
                  <div
                    key={l.level}
                    className={`flex items-start gap-2 py-1.5 border-b border-surf-rule-light last:border-b-0 ${
                      passed || here ? '' : 'opacity-60'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-full font-mono text-[10px] font-semibold shrink-0 mt-0.5 ${
                        here
                          ? 'bg-surf-teal text-white'
                          : passed
                            ? 'bg-surf-teal-bg text-surf-teal border border-surf-teal/30'
                            : 'bg-transparent text-surf-faint border border-surf-rule'
                      }`}
                    >
                      {l.level}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] font-semibold ${here ? 'text-surf-deep' : 'text-surf-ink'}`}>{l.name}</span>
                        {here && (
                          <span className="font-mono text-[8px] font-semibold uppercase px-1 py-px rounded-sm bg-surf-sun-bg text-surf-sun-ink border border-surf-sun/40">
                            you are here
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-surf-muted leading-snug mt-0.5">{l.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <div className="mt-2 pt-1.5 border-t border-surf-rule-light text-[9px] text-surf-muted">
          Garmin autosync: {garminSessions.length === 0
            ? 'no kite activities yet — record kiting on the watch and they land here after the daily sync'
            : `${garminSessions.length} kite ${garminSessions.length === 1 ? 'activity' : 'activities'} counted`}
          {' '}&middot; a manual log on the same date wins &middot; Surfr bests (height, airtime) go in via Log Session
        </div>
      </div>

      {/* Next up */}
      <section>
        <h2 className="font-serif text-[13px] font-semibold text-surf-deep mb-1.5">
          Next Up <span className="text-[10px] font-sans font-normal text-surf-muted">— pick one per session, drill it to boredom; the queued card is what follows</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {nextThree.map(n => {
            const met = isMilestoneMet(n.milestone, stats, milestones)
            const auto = n.milestone.kind === 'auto'
            const progress = autoProgressLabel(n.milestone, stats)
            return (
              <div
                key={n.milestone.id}
                className={`bg-surf-card border rounded-xl p-2.5 shadow-[0_2px_12px_rgba(13,92,99,0.06)] ${
                  n.queued ? 'border-surf-rule border-dashed' : 'border-surf-teal/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-mono text-[9px] font-semibold uppercase tracking-wide ${n.queued ? 'text-surf-muted' : 'text-surf-teal'}`}>
                    {n.source}
                    {n.queued ? ' · queued' : ''}
                  </span>
                  {auto ? (
                    <span className="font-mono text-[9px] px-1 py-px rounded-sm bg-surf-sun-bg text-surf-sun-ink">{progress}</span>
                  ) : (
                    <button onClick={() => handleToggle(n.milestone.id, !met)} className="cursor-pointer" aria-label={`Check off ${n.milestone.label}`}>
                      <CheckMark met={met} />
                    </button>
                  )}
                </div>
                <div className="text-[12px] font-semibold text-surf-ink leading-snug mt-1">{n.milestone.label}</div>
                <div className="text-[10px] text-surf-muted leading-snug mt-1">
                  <GlossedText text={n.milestone.drill} enabled={glossEnabled} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Paths */}
      <section>
        <h2 className="font-serif text-[13px] font-semibold text-surf-deep mb-1.5">
          Paths <span className="text-[10px] font-sans font-normal text-surf-muted">— freeride and big air first; freestyle and wave unlock with intermediate skill</span>
        </h2>
        <div className="bg-surf-card border border-surf-rule rounded-xl px-3 py-1 shadow-[0_2px_12px_rgba(13,92,99,0.06)]">
          {/* Foundation row (white belt checklist) */}
          <div className="border-b border-surf-rule-light">
            <button
              onClick={() => setFoundationOpen(o => !o)}
              className="w-full flex items-center gap-2 py-2 text-left cursor-pointer"
            >
              <span className="font-serif text-[13px] font-semibold text-surf-deep w-[72px] shrink-0">Foundation</span>
              <span
                className={`font-mono text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${
                  state.whiteEarned
                    ? 'bg-surf-teal-bg text-surf-teal border-surf-teal/30'
                    : 'bg-transparent text-surf-faint border-surf-rule'
                }`}
              >
                {state.whiteEarned ? 'done' : `${state.fundamentalsMet}/${state.fundamentalsTotal}`}
              </span>
              <span className="hidden lg:inline text-[9px] text-surf-muted truncate min-w-0 flex-1">
                The white belt — everything else stands on this
              </span>
              <span className="ml-auto flex items-center gap-2 shrink-0">
                <LevelMeter
                  label="fund"
                  met={state.fundamentalsMet}
                  total={state.fundamentalsTotal}
                  complete={state.whiteEarned}
                />
                <Chevron open={foundationOpen} />
              </span>
            </button>
            {foundationOpen && (
              <div className="pb-2">
                {FUNDAMENTALS.map(m => (
                  <MilestoneRow
                    key={m.id}
                    milestone={m}
                    met={isMilestoneMet(m, stats, milestones)}
                    progress={autoProgressLabel(m, stats)}
                    gloss={glossEnabled}
                    onToggle={checked => handleToggle(m.id, checked)}
                  />
                ))}
              </div>
            )}
          </div>
          {MASTERY_PATHS.map(path => (
            <PathRow
              key={path.id}
              path={path}
              stats={stats}
              milestones={milestones}
              gloss={glossEnabled}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </section>

      {/* Life unlocks */}
      <section>
        <h2 className="font-serif text-[13px] font-semibold text-surf-deep mb-1.5">
          Life Unlocks <span className="text-[10px] font-sans font-normal text-surf-muted">— the carrots: what each level of skill buys in the real world</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {LIFE_UNLOCKS.map(u => {
            const unlocked = isUnlockMet(u, state)
            return (
              <div
                key={u.id}
                className={`rounded-xl border p-2.5 flex items-start gap-2.5 ${
                  unlocked
                    ? 'bg-surf-teal-bg border-surf-teal/40'
                    : 'bg-surf-card border-surf-rule'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 mt-0.5 ${
                    unlocked
                      ? 'bg-surf-teal text-white border border-surf-teal'
                      : 'bg-transparent text-surf-faint border border-dashed border-surf-rule'
                  }`}
                >
                  <UnlockIcon id={u.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[12px] font-semibold leading-snug ${unlocked ? 'text-surf-deep' : 'text-surf-ink'}`}>
                      {u.title}
                    </span>
                    <span
                      className={`font-mono text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${
                        unlocked
                          ? 'bg-surf-teal text-white border-surf-teal'
                          : 'bg-transparent text-surf-muted border-surf-rule'
                      }`}
                    >
                      {unlocked ? 'unlocked' : u.requiresLabel}
                    </span>
                  </div>
                  <div className={`text-[10px] leading-snug mt-1 ${unlocked ? 'text-surf-ink' : 'text-surf-muted'}`}>
                    <GlossedText text={u.detail} enabled={glossEnabled} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Glossary — retires itself at brown belt */}
      {glossEnabled && (
        <section>
          <h2 className="font-serif text-[13px] font-semibold text-surf-deep mb-1.5">
            Glossary <span className="text-[10px] font-sans font-normal text-surf-muted">— the words on the beach; this card retires itself at brown belt</span>
          </h2>
          <div className="bg-surf-card border border-surf-rule rounded-xl px-3 py-1.5 shadow-[0_2px_12px_rgba(13,92,99,0.06)] grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {KITE_GLOSSARY.map(g => (
              <div key={g.term} className="flex gap-2 py-1.5 border-b border-surf-rule-light md:last:border-b-0 [&:last-child]:border-b-0">
                <span className="font-mono text-[10px] font-semibold text-surf-deep w-[88px] shrink-0">{g.term}</span>
                <span className="text-[10px] text-surf-muted leading-snug">{g.def}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <SessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sessions={sessions}
        onAdd={handleAdd}
        onDelete={handleDelete}
      />
    </div>
  )
}
