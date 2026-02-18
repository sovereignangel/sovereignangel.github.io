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
  const { log, recentLogs, dates, updateField } = useDailyLogContext()
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

      {/* Today's Focus */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Today&apos;s Focus
        </div>
        <div className="space-y-2">
          <div>
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
              What Gets Done Today?
            </label>
            <textarea
              value={(log as Record<string, unknown>).todayFocus as string || ''}
              onChange={(e) => updateField('todayFocus', e.target.value)}
              className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy min-h-[32px] resize-y"
              placeholder="What gets done today?"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                One Action
              </label>
              <input
                type="text"
                value={(log as Record<string, unknown>).todayOneAction as string || ''}
                onChange={(e) => updateField('todayOneAction', e.target.value)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
                placeholder="Ship by EOD"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Focus Target
              </label>
              <input
                type="number"
                value={log.focusHoursTarget || ''}
                onChange={(e) => updateField('focusHoursTarget', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
                step="0.5"
                placeholder="6"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Days Since Output
              </label>
              <input
                type="number"
                value={log.daysSinceLastOutput || ''}
                onChange={(e) => updateField('daysSinceLastOutput', parseInt(e.target.value) || 0)}
                className={`w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy ${
                  (log.daysSinceLastOutput || 0) >= 3 ? 'text-red-ink' : 'text-ink'
                }`}
              />
            </div>
          </div>
          <div>
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
              Yesterday&apos;s Outcome
            </label>
            <textarea
              value={(log as Record<string, unknown>).yesterdayOutcome as string || ''}
              onChange={(e) => updateField('yesterdayOutcome', e.target.value)}
              className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy min-h-[28px] resize-y"
              placeholder="What happened as a result of yesterday's action?"
            />
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
