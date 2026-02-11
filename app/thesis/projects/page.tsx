'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getProjects } from '@/lib/firestore'
import type { Project } from '@/lib/types'
import StatusIndicator from '@/components/thesis/StatusIndicator'
import { currency, percent } from '@/lib/formatters'
import Link from 'next/link'

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!user) return
    getProjects(user.uid).then(setProjects)
  }, [user])

  const totalAllocation = projects.reduce((sum, p) => sum + p.timeAllocationPercent, 0)
  const learningAllocation = 100 - totalAllocation

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-[20px] font-bold text-ink tracking-tight">
          Project Portfolio
        </h2>
        <p className="font-serif text-[12px] italic text-ink-muted mt-1">
          ROI &amp; Time Allocation
        </p>
      </div>

      <div className="bg-paper border border-rule rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left font-serif text-[10px] italic font-medium text-ink-muted py-2.5 px-4">Project</th>
                <th className="text-right font-serif text-[10px] italic font-medium text-ink-muted py-2.5 px-4">Time</th>
                <th className="text-right font-serif text-[10px] italic font-medium text-ink-muted py-2.5 px-4">Rev (3mo)</th>
                <th className="text-right font-serif text-[10px] italic font-medium text-ink-muted py-2.5 px-4">Rev (1yr)</th>
                <th className="text-center font-serif text-[10px] italic font-medium text-ink-muted py-2.5 px-4">Status</th>
                <th className="text-left font-serif text-[10px] italic font-medium text-ink-muted py-2.5 px-4">Next</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-rule-light hover:bg-[#f0ece4] transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <Link href={`/thesis/projects/${project.id}`} className="font-sans text-[13px] font-medium text-ink no-underline hover:text-navy">
                      {project.name}
                    </Link>
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-[12px] text-ink">
                    {percent(project.timeAllocationPercent)}
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-[12px] text-ink">
                    {currency(project.revenueTarget3mo)}
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-[12px] text-ink">
                    {currency(project.revenueTarget1yr)}
                  </td>
                  <td className="text-center py-3 px-4">
                    <StatusIndicator status={project.status} />
                  </td>
                  <td className="py-3 px-4 font-sans text-[12px] text-ink-light max-w-[200px] truncate">
                    {project.nextMilestone}
                  </td>
                </tr>
              ))}
              {learningAllocation > 0 && (
                <tr className="border-b border-rule-light">
                  <td className="py-3 px-4 font-sans text-[13px] text-ink-muted">Learning</td>
                  <td className="text-right py-3 px-4 font-mono text-[12px] text-ink-muted">
                    {percent(learningAllocation)}
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-[12px] text-ink-muted">—</td>
                  <td className="text-right py-3 px-4 font-mono text-[12px] text-ink-muted">—</td>
                  <td className="text-center py-3 px-4">
                    <StatusIndicator status="spine" label="On" />
                  </td>
                  <td className="py-3 px-4 font-sans text-[12px] text-ink-muted">Weekly synthesis</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Allocation Visual */}
      <div className="mt-6 bg-paper border border-rule rounded-sm p-5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Time Allocation
        </h3>
        <div className="flex h-4 rounded-sm overflow-hidden">
          {projects.map((project) => {
            const colors: Record<string, string> = {
              spine: 'bg-navy',
              pre_launch: 'bg-navy-light',
              optionality: 'bg-gold',
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
        <div className="flex flex-wrap gap-4 mt-3">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                project.status === 'spine' ? 'bg-navy' :
                project.status === 'pre_launch' ? 'bg-navy-light' :
                project.status === 'optionality' ? 'bg-gold' : 'bg-ink-faint'
              }`} />
              <span className="font-sans text-[11px] text-ink-muted">
                {project.name} ({project.timeAllocationPercent}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
