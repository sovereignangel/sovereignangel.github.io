'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { getProject, updateProject } from '@/lib/firestore'
import type { Project, ProjectStatus } from '@/lib/types'
import StatusIndicator from '@/components/thesis/StatusIndicator'
import { currency, percent } from '@/lib/formatters'
import Link from 'next/link'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'spine', label: 'Spine' },
  { value: 'pre_launch', label: 'Pre-launch' },
  { value: 'optionality', label: 'Optionality' },
  { value: 'backup', label: 'Backup' },
  { value: 'archived', label: 'Archived' },
]

const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !projectId) return
    getProject(user.uid, projectId).then(setProject)
  }, [user, projectId])

  const save = useCallback(async (updates: Partial<Project>) => {
    if (!user || !projectId) return
    setSaving(true)
    setProject(prev => prev ? { ...prev, ...updates } : prev)
    await updateProject(user.uid, projectId, updates)
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
  }, [user, projectId])

  const updateField = (field: string, value: unknown) => {
    save({ [field]: value } as Partial<Project>)
  }

  const getField = (field: string): number => {
    return (project as unknown as Record<string, number>)[field] || 0
  }

  if (!project) {
    return (
      <div className="flex justify-center py-12">
        <span className="font-serif text-[14px] italic text-ink-muted">Loading...</span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/thesis/projects" className="font-serif text-[12px] text-navy no-underline hover:text-navy-light">
          &larr; All Projects
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-ink-muted">
            {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
          </span>
          <button
            onClick={() => setEditing(!editing)}
            className={`font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-colors ${
              editing
                ? 'bg-navy text-paper border-navy'
                : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
            }`}
          >
            {editing ? 'Done Editing' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-serif text-[22px] font-bold text-ink tracking-tight">
          {project.name}
        </h2>
        {editing ? (
          <select
            value={project.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        ) : (
          <StatusIndicator status={project.status} size="md" />
        )}
      </div>

      {/* Description */}
      {editing ? (
        <div className="mb-4">
          <input
            type="text"
            value={project.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
          />
        </div>
      ) : (
        <p className="font-sans text-[13px] text-ink-light mb-6">{project.description}</p>
      )}

      {/* Key Metrics */}
      <div className="bg-paper border border-rule rounded-sm p-5 mb-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Revenue (3mo)', field: 'revenueTarget3mo', format: currency },
            { label: 'Revenue (1yr)', field: 'revenueTarget1yr', format: currency },
            { label: 'Revenue (3yr)', field: 'revenueTarget3yr', format: currency, gold: true },
            { label: 'Time Allocation', field: 'timeAllocationPercent', format: percent, suffix: '%' },
          ].map(({ label, field, format, gold, suffix }) => (
            <div key={field}>
              <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">{label}</p>
              {editing ? (
                <input
                  type="number"
                  value={getField(field) || 0}
                  onChange={(e) => updateField(field, parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                  step={suffix ? '1' : '100'}
                />
              ) : (
                <p className={`font-mono text-[15px] font-semibold ${gold ? 'text-gold' : 'text-ink'}`}>
                  {format(getField(field))}
                </p>
              )}
            </div>
          ))}
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
              {editing ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={milestone.text}
                    onChange={(e) => {
                      const milestones = [...(project.milestones || [])]
                      milestones[i] = { ...milestones[i], text: e.target.value }
                      updateField('milestones', milestones)
                    }}
                    className="flex-1 font-sans text-[13px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                  />
                  <select
                    value={milestone.status}
                    onChange={(e) => {
                      const milestones = [...(project.milestones || [])]
                      milestones[i] = { ...milestones[i], status: e.target.value }
                      updateField('milestones', milestones)
                    }}
                    className="font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                  >
                    {MILESTONE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const milestones = project.milestones.filter((_, idx) => idx !== i)
                      updateField('milestones', milestones)
                    }}
                    className="font-sans text-[11px] text-ink-muted hover:text-red-ink transition-colors px-1"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <>
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    milestone.status === 'in_progress' ? 'bg-navy' :
                    milestone.status === 'completed' ? 'bg-green-ink' : 'bg-rule'
                  }`} />
                  <div>
                    <p className="font-sans text-[13px] text-ink">{milestone.text}</p>
                    <p className="font-serif text-[10px] italic text-ink-muted capitalize">{milestone.status?.replace('_', ' ')}</p>
                  </div>
                </>
              )}
            </div>
          ))}
          {editing && (
            <button
              onClick={() => {
                const milestones = [...(project.milestones || []), { text: '', status: 'pending' }]
                updateField('milestones', milestones)
              }}
              className="font-serif text-[11px] text-navy hover:text-navy-light transition-colors"
            >
              + Add Milestone
            </button>
          )}
        </div>
      </div>

      {/* Next Milestone */}
      <div className="bg-paper border border-gold/30 rounded-sm p-5 mb-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-gold mb-4 pb-2 border-b border-gold/20">
          Next Milestone
        </h3>
        {editing ? (
          <input
            type="text"
            value={project.nextMilestone}
            onChange={(e) => updateField('nextMilestone', e.target.value)}
            className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
            placeholder="What's the next milestone?"
          />
        ) : (
          <p className="font-sans text-[14px] text-ink font-medium">{project.nextMilestone}</p>
        )}
      </div>

      {/* Thesis Alignment */}
      <div className="bg-paper border border-rule rounded-sm p-5 mb-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Thesis Alignment
        </h3>
        <div className="space-y-3">
          {(['ai', 'markets', 'capital'] as const).map((key) => (
            <div key={key}>
              <p className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted mb-0.5">
                {key === 'ai' ? 'AI / Markets' : key === 'markets' ? 'Markets' : 'Capital'}
              </p>
              {editing ? (
                <textarea
                  value={project.thesisAlignment?.[key] || ''}
                  onChange={(e) => {
                    const thesisAlignment = { ...project.thesisAlignment, [key]: e.target.value }
                    updateField('thesisAlignment', thesisAlignment)
                  }}
                  className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[40px] resize-y"
                />
              ) : (
                <p className="font-sans text-[13px] text-ink">{project.thesisAlignment?.[key]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Compounding Chain */}
      <div className="bg-paper border border-rule rounded-sm p-5 mb-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Compounding Chain
        </h3>
        {editing ? (
          <textarea
            value={project.compoundingChain || ''}
            onChange={(e) => updateField('compoundingChain', e.target.value)}
            className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[60px] resize-y"
            placeholder="How does this project compound into others?"
          />
        ) : (
          <p className="font-sans text-[13px] text-ink leading-relaxed">{project.compoundingChain}</p>
        )}
      </div>

      {/* Financial Tracker */}
      <div className="bg-paper border border-rule rounded-sm p-5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Financial Tracker
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Revenue YTD', field: 'revenueActualYtd', format: currency },
            { label: 'Customers', field: 'customerCount', format: (v: number) => String(v) },
            { label: 'MRR', field: 'recurringRevenue', format: currency, gold: true, suffix: '/mo' },
            { label: 'Churn', field: 'churnRate', format: percent },
          ].map(({ label, field, format, gold, suffix }) => (
            <div key={field}>
              <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">{label}</p>
              {editing ? (
                <input
                  type="number"
                  value={getField(field) || 0}
                  onChange={(e) => updateField(field, parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                  step={field === 'churnRate' ? '0.1' : '1'}
                />
              ) : (
                <p className={`font-mono text-[15px] font-semibold ${gold ? 'text-gold' : 'text-ink'}`}>
                  {format(getField(field) || 0)}{suffix || ''}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
