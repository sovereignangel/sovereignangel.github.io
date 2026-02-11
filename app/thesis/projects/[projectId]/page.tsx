'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { getProject } from '@/lib/firestore'
import type { Project } from '@/lib/types'
import StatusIndicator from '@/components/thesis/StatusIndicator'
import { currency, percent } from '@/lib/formatters'
import Link from 'next/link'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    if (!user || !projectId) return
    getProject(user.uid, projectId).then(setProject)
  }, [user, projectId])

  if (!project) {
    return (
      <div className="flex justify-center py-12">
        <span className="font-serif text-[14px] italic text-ink-muted">Loading...</span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/thesis/projects" className="font-serif text-[12px] text-navy no-underline hover:text-navy-light mb-4 inline-block">
        &larr; All Projects
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-serif text-[22px] font-bold text-ink tracking-tight">
          {project.name}
        </h2>
        <StatusIndicator status={project.status} size="md" />
      </div>

      {/* Key Metrics */}
      <div className="bg-paper border border-rule rounded-sm p-5 mb-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Revenue (3mo)</p>
            <p className="font-mono text-[15px] font-semibold text-ink">{currency(project.revenueTarget3mo)}</p>
          </div>
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Revenue (1yr)</p>
            <p className="font-mono text-[15px] font-semibold text-ink">{currency(project.revenueTarget1yr)}</p>
          </div>
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Revenue (3yr)</p>
            <p className="font-mono text-[15px] font-semibold text-gold">{currency(project.revenueTarget3yr)}</p>
          </div>
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Time Allocation</p>
            <p className="font-mono text-[15px] font-semibold text-ink">{percent(project.timeAllocationPercent)}</p>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-paper border border-rule rounded-sm p-5 mb-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Milestones
        </h3>
        <div className="space-y-3">
          {project.milestones?.map((milestone, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                milestone.status === 'in_progress' ? 'bg-navy' :
                milestone.status === 'completed' ? 'bg-green-ink' : 'bg-rule'
              }`} />
              <div>
                <p className="font-sans text-[13px] text-ink">{milestone.text}</p>
                <p className="font-serif text-[10px] italic text-ink-muted capitalize">{milestone.status?.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thesis Alignment */}
      <div className="bg-paper border border-rule rounded-sm p-5 mb-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Thesis Alignment
        </h3>
        <div className="space-y-3">
          {project.thesisAlignment && Object.entries(project.thesisAlignment).map(([key, value]) => (
            <div key={key}>
              <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted mb-0.5">
                {key === 'ai' ? 'AI / Markets' : key === 'markets' ? 'Markets' : 'Capital'}
              </p>
              <p className="font-sans text-[13px] text-ink">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compounding Chain */}
      {project.compoundingChain && (
        <div className="bg-paper border border-rule rounded-sm p-5 mb-4">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Compounding Chain
          </h3>
          <p className="font-sans text-[13px] text-ink leading-relaxed">{project.compoundingChain}</p>
        </div>
      )}

      {/* Financial Tracker */}
      <div className="bg-paper border border-rule rounded-sm p-5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Financial Tracker
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Revenue YTD</p>
            <p className="font-mono text-[15px] font-semibold text-ink">{currency(project.revenueActualYtd || 0)}</p>
          </div>
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Customers</p>
            <p className="font-mono text-[15px] font-semibold text-ink">{project.customerCount || 0}</p>
          </div>
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">MRR</p>
            <p className="font-mono text-[15px] font-semibold text-gold">{currency(project.recurringRevenue || 0)}/mo</p>
          </div>
          <div>
            <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Churn</p>
            <p className="font-mono text-[15px] font-semibold text-ink">{percent(project.churnRate || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
