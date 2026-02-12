'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getProjects } from '@/lib/firestore'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import type { Project } from '@/lib/types'
import StatusIndicator from '@/components/thesis/StatusIndicator'
import { currency, percent, dayOfWeekShort } from '@/lib/formatters'
import Link from 'next/link'

export default function OutputGauge() {
  const { user } = useAuth()
  const { recentLogs, dates, log } = useDailyLogContext()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!user) return
    getProjects(user.uid).then(setProjects)
  }, [user])

  const totalAllocation = projects.reduce((sum, p) => sum + p.timeAllocationPercent, 0)
  const learningAllocation = 100 - totalAllocation
  const logMap = new Map(recentLogs.map(l => [l.date, l]))

  const gvcScore = log.rewardScore?.components?.gvc
  const kappaScore = log.rewardScore?.components?.kappa

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Portfolio &amp; Output
        </h3>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-ink-muted">ĠVC</span>
          <span className={`font-mono text-[14px] font-bold ${
            gvcScore != null ? (gvcScore >= 0.7 ? 'text-green-ink' : gvcScore >= 0.4 ? 'text-amber-ink' : 'text-red-ink') : 'text-ink-muted'
          }`}>
            {gvcScore != null ? (gvcScore * 100).toFixed(0) : '—'}
          </span>
          <span className="font-mono text-[9px] text-ink-muted">κ</span>
          <span className={`font-mono text-[14px] font-bold ${
            kappaScore != null ? (kappaScore >= 0.7 ? 'text-green-ink' : kappaScore >= 0.4 ? 'text-amber-ink' : 'text-red-ink') : 'text-ink-muted'
          }`}>
            {kappaScore != null ? (kappaScore * 100).toFixed(0) : '—'}
          </span>
        </div>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-3">
        {/* Compact project table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule-light">
              <th className="text-left font-serif text-[9px] italic text-ink-muted py-1.5 pr-2">Project</th>
              <th className="text-right font-serif text-[9px] italic text-ink-muted py-1.5 px-1">Time</th>
              <th className="text-center font-serif text-[9px] italic text-ink-muted py-1.5 px-1">Status</th>
              <th className="text-left font-serif text-[9px] italic text-ink-muted py-1.5 pl-2">Next</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-rule-light/50">
                <td className="py-1.5 pr-2">
                  <Link href={`/thesis/projects/${project.id}`} className="font-sans text-[11px] font-medium text-ink no-underline hover:text-navy">
                    {project.name}
                  </Link>
                </td>
                <td className="text-right py-1.5 px-1 font-mono text-[10px] text-ink">
                  {percent(project.timeAllocationPercent)}
                </td>
                <td className="text-center py-1.5 px-1">
                  <StatusIndicator status={project.status} size="sm" />
                </td>
                <td className="py-1.5 pl-2 font-sans text-[10px] text-ink-light truncate max-w-[140px]">
                  {project.nextMilestone}
                </td>
              </tr>
            ))}
            {learningAllocation > 0 && (
              <tr className="border-b border-rule-light/50">
                <td className="py-1.5 pr-2 font-sans text-[11px] text-ink-muted">Learning</td>
                <td className="text-right py-1.5 px-1 font-mono text-[10px] text-ink-muted">{percent(learningAllocation)}</td>
                <td />
                <td />
              </tr>
            )}
          </tbody>
        </table>

        {/* Time allocation bar */}
        <div>
          <div className="flex h-3 rounded-sm overflow-hidden">
            {projects.map((project) => {
              const colors: Record<string, string> = {
                spine: 'bg-navy', pre_launch: 'bg-navy-light', optionality: 'bg-gold', backup: 'bg-ink-faint',
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
              <div className="bg-rule" style={{ width: `${learningAllocation}%` }} title={`Learning: ${learningAllocation}%`} />
            )}
          </div>
        </div>

        {/* 7-day shipping + revenue asks */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1.5">Shipping</p>
            <div className="flex gap-1.5 items-center">
              {dates.map(date => {
                const shipped = logMap.get(date)?.publicIteration
                return (
                  <div key={date} className="flex flex-col items-center gap-0.5">
                    <div className={`w-3 h-3 rounded-full border ${
                      shipped ? 'bg-navy border-navy' : 'bg-transparent border-rule'
                    }`} />
                    <span className="font-mono text-[7px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1.5">Rev Asks</p>
            <div className="flex gap-1.5 items-end">
              {dates.map(date => {
                const asks = logMap.get(date)?.revenueAsksCount || 0
                const heightPx = asks > 0 ? Math.max(asks * 5, 4) : 2
                return (
                  <div key={date} className="flex flex-col items-center gap-0.5">
                    <div className="flex items-end" style={{ height: '24px' }}>
                      <div className="w-3 bg-gold rounded-t-sm transition-all" style={{ height: `${heightPx}px` }} />
                    </div>
                    <span className="font-mono text-[7px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
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
