'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getProjects } from '@/lib/firestore'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import type { Project } from '@/lib/types'
import StatusIndicator from '@/components/thesis/StatusIndicator'
import { percent, dayOfWeekShort } from '@/lib/formatters'
import Link from 'next/link'

export default function FocusView() {
  const { user } = useAuth()
  const { log, recentLogs, dates } = useDailyLogContext()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!user) return
    getProjects(user.uid).then(setProjects)
  }, [user])

  const totalAllocation = projects.reduce((sum, p) => sum + p.timeAllocationPercent, 0)
  const learningAllocation = Math.max(0, 100 - totalAllocation)
  const logMap = new Map(recentLogs.map(l => [l.date, l]))

  return (
    <div className="h-full flex flex-col space-y-3 overflow-y-auto">
      {/* Portfolio Table */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Portfolio
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule-light">
              <th className="text-left font-serif text-[8px] uppercase text-ink-muted py-1.5 pr-2">Project</th>
              <th className="text-right font-serif text-[8px] uppercase text-ink-muted py-1.5 px-1">Time</th>
              <th className="text-center font-serif text-[8px] uppercase text-ink-muted py-1.5 px-1">Status</th>
              <th className="text-left font-serif text-[8px] uppercase text-ink-muted py-1.5 pl-2">Next Milestone</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-rule-light/50">
                <td className="py-1.5 pr-2">
                  <Link
                    href={`/thesis/projects/${project.id}`}
                    className="font-mono text-[11px] font-medium text-ink no-underline hover:text-burgundy"
                  >
                    {project.name}
                  </Link>
                </td>
                <td className="text-right py-1.5 px-1 font-mono text-[11px] text-ink">
                  {percent(project.timeAllocationPercent)}
                </td>
                <td className="text-center py-1.5 px-1">
                  <StatusIndicator status={project.status} size="sm" />
                </td>
                <td className="py-1.5 pl-2 font-mono text-[10px] text-ink-muted truncate max-w-[140px]">
                  {project.nextMilestone}
                </td>
              </tr>
            ))}
            {learningAllocation > 0 && (
              <tr className="border-b border-rule-light/50">
                <td className="py-1.5 pr-2 font-mono text-[11px] text-ink-muted">Learning</td>
                <td className="text-right py-1.5 px-1 font-mono text-[11px] text-ink-muted">
                  {percent(learningAllocation)}
                </td>
                <td />
                <td />
              </tr>
            )}
          </tbody>
        </table>

        {/* Time Allocation Bar */}
        <div className="mt-2">
          <div className="flex h-3 rounded-sm overflow-hidden">
            {projects.map((project) => {
              const colors: Record<string, string> = {
                spine: 'bg-burgundy',
                pre_launch: 'bg-amber-ink',
                optionality: 'bg-ink-muted',
                backup: 'bg-ink-faint',
              }
              return (
                <div
                  key={project.id}
                  className={`${colors[project.status] || 'bg-ink-muted'} transition-all`}
                  style={{ width: `${project.timeAllocationPercent}%` }}
                  title={`${project.name}: ${project.timeAllocationPercent}%`}
                />
              )
            })}
            {learningAllocation > 0 && (
              <div
                className="bg-rule"
                style={{ width: `${learningAllocation}%` }}
                title={`Learning: ${learningAllocation}%`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Today's Status (read-only — input via sidebar) */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Today
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div className="col-span-2">
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">Intent</p>
            <p className={`font-mono text-[11px] ${(log as Record<string, unknown>).todayFocus ? 'text-ink' : 'text-ink-faint italic'}`}>
              {(log as Record<string, unknown>).todayFocus as string || 'Set in sidebar →'}
            </p>
          </div>
          <div>
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">One Action</p>
            <p className={`font-mono text-[11px] ${(log as Record<string, unknown>).todayOneAction ? 'text-ink' : 'text-ink-faint italic'}`}>
              {(log as Record<string, unknown>).todayOneAction as string || '—'}
            </p>
          </div>
          <div>
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">Focus</p>
            <p className="font-mono text-[11px] text-ink">
              {log.focusHoursActual || 0}h{log.focusHoursTarget ? ` / ${log.focusHoursTarget}h` : ''}
            </p>
          </div>
          <div className="col-span-2">
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">Shipped</p>
            <p className={`font-mono text-[11px] ${log.whatShipped ? 'text-ink' : 'text-ink-faint italic'}`}>
              {log.whatShipped || 'Nothing shipped yet'}
            </p>
          </div>
          {/* Quality badges */}
          <div className="col-span-2 flex gap-1.5">
            {log.publicIteration && (
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                Public
              </span>
            )}
            {log.feedbackLoopClosed && (
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-green-bg text-green-ink border-green-ink/20">
                Feedback
              </span>
            )}
            {log.speedOverPerfection && (
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-amber-bg text-amber-ink border-amber-ink/20">
                Speed&gt;Perf
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Execution */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          7-Day Execution
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Shipping Row */}
          <div>
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-1.5">Shipping</p>
            <div className="flex gap-1.5 items-center">
              {dates.map(date => {
                const dayLog = logMap.get(date)
                const shipped = dayLog?.whatShipped || ((dayLog?.shipsCount ?? 0) > 0)
                return (
                  <div key={date} className="flex flex-col items-center gap-0.5">
                    <div className={`w-3 h-3 rounded-sm border ${
                      shipped ? 'bg-burgundy border-burgundy' : 'bg-transparent border-rule'
                    }`} />
                    <span className="font-mono text-[7px] text-ink-muted">
                      {dayOfWeekShort(date).slice(0, 2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Revenue Asks Row */}
          <div>
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-1.5">Rev Asks</p>
            <div className="flex gap-1.5 items-end">
              {dates.map(date => {
                const asks = logMap.get(date)?.revenueAsksCount || 0
                const heightPx = asks > 0 ? Math.max(asks * 5, 4) : 2
                return (
                  <div key={date} className="flex flex-col items-center gap-0.5">
                    <div className="flex items-end" style={{ height: '24px' }}>
                      <div
                        className="w-3 bg-burgundy/60 rounded-t-sm transition-all"
                        style={{ height: `${heightPx}px` }}
                      />
                    </div>
                    <span className="font-mono text-[7px] text-ink-muted">
                      {dayOfWeekShort(date).slice(0, 2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
