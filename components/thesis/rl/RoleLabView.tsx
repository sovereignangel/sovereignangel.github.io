'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRoleLab } from '@/hooks/useRoleLab'
import { ROLE_LAB_ALGORITHMS } from '@/lib/types/rl'
import type {
  RoleLabAlgorithmStatus,
  RoleLabEnvironmentId,
  RoleLabDeliverableType,
} from '@/lib/types'

export default function RoleLabView() {
  const { user } = useAuth()
  const {
    data, loading, currentWeek, progressPercent, hasData,
    toggleMilestone, updateAlgorithmStatus,
    updateEnvironmentMilestone, addDeliverable, updateDeliverableStatus,
  } = useRoleLab(user?.uid)

  const [addingDeliverable, setAddingDeliverable] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<RoleLabDeliverableType>('code')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-[10px] text-ink-muted">
        Loading Role Lab...
      </div>
    )
  }

  const sprintEnd = new Date(data.sprintStartDate)
  sprintEnd.setDate(sprintEnd.getDate() + 56)
  const daysRemaining = Math.max(0, Math.ceil(
    (sprintEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  ))

  const weekDeliverables = data.deliverables.filter(d => d.week === currentWeek)

  return (
    <div className="space-y-2 p-2">
      {/* Sprint Overview */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          RL Engineer Sprint {'\u2014'} 8 Weeks
        </h4>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center">
            <div className="font-mono text-[16px] font-bold text-burgundy">
              Week {currentWeek}
            </div>
            <div className="text-[9px] text-ink-muted">of 8</div>
          </div>
          <div className="text-center">
            <div className={`font-mono text-[16px] font-bold ${
              progressPercent >= 75 ? 'text-green-ink'
              : progressPercent >= 40 ? 'text-amber-ink'
              : 'text-ink'
            }`}>
              {progressPercent}%
            </div>
            <div className="text-[9px] text-ink-muted">Complete</div>
          </div>
          <div className="text-center">
            <div className={`font-mono text-[16px] font-bold ${
              daysRemaining <= 14 ? 'text-red-ink' : 'text-ink'
            }`}>
              {daysRemaining}
            </div>
            <div className="text-[9px] text-ink-muted">Days Left</div>
          </div>
        </div>
        <div className="h-1.5 bg-cream rounded-sm overflow-hidden">
          <div
            className="h-full bg-burgundy rounded-sm transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 8-Week Timeline */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
          Milestones
        </h4>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {data.milestones.map(m => {
            const isCurrent = m.week === currentWeek
            const isPast = m.week < currentWeek
            return (
              <button
                key={m.week}
                onClick={() => toggleMilestone(m.week)}
                className={`p-1.5 rounded-sm border text-center transition-colors ${
                  m.isComplete
                    ? 'bg-green-ink/10 border-green-ink/30'
                    : isCurrent
                    ? 'bg-burgundy-bg border-burgundy/30'
                    : isPast
                    ? 'bg-cream border-rule'
                    : 'bg-white border-rule'
                }`}
              >
                <div className={`font-mono text-[10px] font-bold ${
                  m.isComplete ? 'text-green-ink'
                  : isCurrent ? 'text-burgundy'
                  : 'text-ink-muted'
                }`}>
                  W{m.week}
                </div>
                <div className="text-[8px] text-ink-muted leading-tight mt-0.5">
                  {m.title}
                </div>
                {m.isComplete && (
                  <div className="font-mono text-[8px] text-green-ink mt-0.5">{'\u2713'}</div>
                )}
              </button>
            )
          })}
        </div>
        {data.milestones[currentWeek - 1] && (
          <div className="mt-2 pt-1.5 border-t border-rule-light">
            <div className="text-[10px] text-ink">
              <span className="font-semibold text-burgundy">Week {currentWeek}:</span>{' '}
              {data.milestones[currentWeek - 1].description}
            </div>
          </div>
        )}
      </div>

      {/* Environments */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Environments
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {data.environments.map(env => (
            <div key={env.id} className="border border-rule rounded-sm p-2">
              <div className="font-serif text-[11px] font-semibold text-ink mb-1">{env.name}</div>
              <div className="space-y-0.5 mb-1.5">
                <div className="text-[9px]">
                  <span className="text-ink-muted">S:</span>{' '}
                  <span className="text-ink">{env.stateDescription}</span>
                </div>
                <div className="text-[9px]">
                  <span className="text-ink-muted">A:</span>{' '}
                  <span className="text-ink">{env.actionDescription}</span>
                </div>
                <div className="text-[9px]">
                  <span className="text-ink-muted">R:</span>{' '}
                  <span className="text-ink">{env.rewardDescription}</span>
                </div>
              </div>
              <div className="border-t border-rule-light pt-1">
                <div className="font-mono text-[8px] text-ink-muted uppercase mb-0.5">Progress</div>
                {env.milestones.map((ms, msIdx) => (
                  <button
                    key={msIdx}
                    onClick={() => {
                      const next = msIdx < env.currentMilestoneIndex
                        ? msIdx
                        : msIdx + 1
                      updateEnvironmentMilestone(env.id as RoleLabEnvironmentId, next)
                    }}
                    className="flex items-center gap-1 w-full text-left py-0.5"
                  >
                    <span className={`font-mono text-[8px] w-3 h-3 flex items-center justify-center rounded-sm border shrink-0 ${
                      msIdx < env.currentMilestoneIndex
                        ? 'bg-green-ink text-paper border-green-ink'
                        : msIdx === env.currentMilestoneIndex
                        ? 'bg-burgundy-bg text-burgundy border-burgundy/30'
                        : 'bg-cream text-ink-muted border-rule'
                    }`}>
                      {msIdx < env.currentMilestoneIndex ? '\u2713' : ''}
                    </span>
                    <span className={`text-[9px] ${
                      msIdx < env.currentMilestoneIndex ? 'text-ink-muted line-through' : 'text-ink'
                    }`}>
                      {ms}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithm Tracker */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Algorithm Implementations
        </h4>
        <div className="space-y-1">
          {data.algorithms.map(alg => {
            const meta = ROLE_LAB_ALGORITHMS.find(a => a.id === alg.id)
            return (
              <div key={alg.id} className="flex items-center gap-2 py-1 border-b border-rule-light last:border-0">
                <button
                  onClick={() => {
                    const next: RoleLabAlgorithmStatus =
                      alg.status === 'not_started' ? 'in_progress'
                      : alg.status === 'in_progress' ? 'completed'
                      : 'not_started'
                    updateAlgorithmStatus(alg.id, next)
                  }}
                  className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${
                    alg.status === 'completed'
                      ? 'bg-green-ink/10 text-green-ink border-green-ink/20'
                      : alg.status === 'in_progress'
                      ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
                      : 'bg-cream text-ink-muted border-rule'
                  }`}
                >
                  {alg.status === 'completed' ? '\u2713 Done'
                    : alg.status === 'in_progress' ? '\u2022 Active'
                    : '\u2014 Pending'}
                </button>
                <div className="flex-1 min-w-0">
                  <span className="font-serif text-[11px] font-semibold text-ink">
                    {meta?.name ?? alg.id}
                  </span>
                  <span className="text-[9px] text-ink-muted ml-1.5">
                    {meta?.description}
                  </span>
                </div>
                {alg.repoUrl && (
                  <a
                    href={alg.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[8px] text-burgundy hover:underline shrink-0"
                  >
                    repo
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly Deliverables */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Week {currentWeek} Deliverables
        </h4>

        {weekDeliverables.length === 0 && !addingDeliverable && (
          <p className="text-[10px] text-ink-muted mb-2">
            No deliverables tracked for this week yet.
          </p>
        )}

        <div className="space-y-1 mb-2">
          {weekDeliverables.map((d, idx) => {
            const globalIdx = data.deliverables.findIndex(
              dd => dd.week === d.week && dd.title === d.title && dd.type === d.type
            )
            return (
              <div key={idx} className="flex items-center gap-2 py-0.5">
                <button
                  onClick={() => {
                    const next = d.status === 'pending' ? 'in_progress'
                      : d.status === 'in_progress' ? 'completed'
                      : 'pending'
                    updateDeliverableStatus(globalIdx, next)
                  }}
                  className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${
                    d.status === 'completed'
                      ? 'bg-green-ink/10 text-green-ink border-green-ink/20'
                      : d.status === 'in_progress'
                      ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
                      : 'bg-cream text-ink-muted border-rule'
                  }`}
                >
                  {d.type}
                </button>
                <span className={`text-[10px] flex-1 ${
                  d.status === 'completed' ? 'text-ink-muted line-through' : 'text-ink'
                }`}>
                  {d.title}
                </span>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[8px] text-burgundy hover:underline shrink-0"
                  >
                    link
                  </a>
                )}
              </div>
            )
          })}
        </div>

        {addingDeliverable ? (
          <div className="flex items-center gap-1 pt-1 border-t border-rule-light">
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as RoleLabDeliverableType)}
              className="font-mono text-[9px] px-1 py-0.5 rounded-sm border border-rule bg-cream text-ink"
            >
              <option value="code">code</option>
              <option value="blog">blog</option>
              <option value="video">video</option>
            </select>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Deliverable title..."
              className="flex-1 text-[10px] px-1.5 py-0.5 rounded-sm border border-rule bg-white text-ink placeholder:text-ink-faint"
            />
            <button
              onClick={async () => {
                if (!newTitle.trim()) return
                await addDeliverable({
                  week: currentWeek,
                  type: newType,
                  title: newTitle.trim(),
                  status: 'pending',
                })
                setNewTitle('')
                setAddingDeliverable(false)
              }}
              className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy"
            >
              Add
            </button>
            <button
              onClick={() => { setAddingDeliverable(false); setNewTitle('') }}
              className="font-serif text-[9px] text-ink-muted px-1 py-0.5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingDeliverable(true)}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted hover:border-ink-faint transition-colors"
          >
            + Add Deliverable
          </button>
        )}
      </div>

      {/* First-visit motivational */}
      {!hasData && (
        <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
          <p className="text-[10px] text-ink leading-relaxed">
            <strong>The sprint starts now.</strong> You have 8 weeks to go from reward function designer
            to RL engineer. Three environments, five algorithms, published experiments. Each week has
            a milestone. Each milestone has deliverables. Track everything here.
          </p>
        </div>
      )}
    </div>
  )
}
