'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getProjects, getRecentDailyLogs, getNetworkContacts } from '@/lib/firestore'
import type { Project, DailyLog, NetworkContact, PipelineStage } from '@/lib/types'
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_ORDER } from '@/lib/types'
import { currency } from '@/lib/formatters'

// ─── Helpers ────────────────────────────────────────────────────────

function computeProjectMetrics(
  projects: Project[],
  logs: DailyLog[],
  contacts: NetworkContact[]
) {
  const totalFocusHours = logs.reduce((sum, l) => sum + (l.focusHoursActual || 0), 0)

  return projects.map(project => {
    // Actual focus hours: logs where spineProject matches
    const projectLogs = logs.filter(l => l.spineProject === project.name)
    const actualHours = projectLogs.reduce((sum, l) => sum + (l.focusHoursActual || 0), 0)
    const actualPercent = totalFocusHours > 0
      ? Math.round((actualHours / totalFocusHours) * 100)
      : 0

    // Pipeline: contacts linked to this project
    const linkedContacts = contacts.filter(c => c.linkedProjectName === project.name)
    const pipelineValue = linkedContacts.reduce((sum, c) => {
      if (!c.dealValue) return sum
      // Normalize to monthly: one_time deals / 12
      const monthly = c.dealCurrency === 'one_time' ? c.dealValue / 12 : c.dealValue
      return sum + monthly
    }, 0)

    // Pipeline stage breakdown
    const stageBreakdown: Partial<Record<PipelineStage, number>> = {}
    for (const c of linkedContacts) {
      if (c.pipelineStage) {
        stageBreakdown[c.pipelineStage] = (stageBreakdown[c.pipelineStage] || 0) + 1
      }
    }

    // Attention efficiency: revenue per focus hour
    const revenuePerHour = actualHours > 0 && project.revenueActualYtd > 0
      ? project.revenueActualYtd / actualHours
      : 0

    // Deviation: planned vs actual allocation
    const deviation = actualPercent - project.timeAllocationPercent

    return {
      project,
      actualHours: Math.round(actualHours * 10) / 10,
      actualPercent,
      pipelineValue: Math.round(pipelineValue),
      linkedContacts: linkedContacts.length,
      stageBreakdown,
      revenuePerHour: Math.round(revenuePerHour),
      deviation,
    }
  })
}

// ─── Component ──────────────────────────────────────────────────────

export default function PortfolioView() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [loading, setLoading] = useState(true)
  const [window, setWindow] = useState<7 | 30>(7)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      getProjects(user.uid),
      getRecentDailyLogs(user.uid, window),
      getNetworkContacts(user.uid),
    ]).then(([p, l, c]) => {
      setProjects(p)
      setLogs(l)
      setContacts(c)
      setLoading(false)
    })
  }, [user, window])

  const metrics = useMemo(
    () => computeProjectMetrics(projects, logs, contacts),
    [projects, logs, contacts]
  )

  // Summary totals
  const totalHours = metrics.reduce((s, m) => s + m.actualHours, 0)
  const totalPipeline = metrics.reduce((s, m) => s + m.pipelineValue, 0)
  const totalRevenueYtd = projects.reduce((s, p) => s + p.revenueActualYtd, 0)
  const totalTarget3mo = projects.reduce((s, p) => s + p.revenueTarget3mo, 0)

  if (loading) {
    return (
      <div className="p-3">
        <div className="font-serif text-[11px] text-ink-muted">Loading portfolio data...</div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Portfolio Attention
        </h3>
        <div className="flex gap-1">
          {([7, 30] as const).map(w => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border ${
                window === w
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        <SummaryCard label="Focus Hours" value={`${Math.round(totalHours * 10) / 10}h`} />
        <SummaryCard label="Pipeline (mo)" value={currency(totalPipeline)} />
        <SummaryCard label="Revenue YTD" value={currency(totalRevenueYtd)} />
        <SummaryCard
          label="Target Gap"
          value={currency(totalTarget3mo - totalRevenueYtd)}
          color={totalRevenueYtd >= totalTarget3mo ? 'text-green-ink' : 'text-amber-ink'}
        />
      </div>

      {/* Attention Table */}
      <div className="bg-white border border-rule rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="text-left font-serif text-[10px] italic font-medium text-ink-muted py-2 px-3">Project</th>
              <th className="text-right font-serif text-[10px] italic font-medium text-ink-muted py-2 px-3">Plan</th>
              <th className="text-right font-serif text-[10px] italic font-medium text-ink-muted py-2 px-3">Actual</th>
              <th className="text-right font-serif text-[10px] italic font-medium text-ink-muted py-2 px-3">Hours</th>
              <th className="text-right font-serif text-[10px] italic font-medium text-ink-muted py-2 px-3">Rev YTD</th>
              <th className="text-right font-serif text-[10px] italic font-medium text-ink-muted py-2 px-3">Pipeline</th>
              <th className="text-right font-serif text-[10px] italic font-medium text-ink-muted py-2 px-3">$/hr</th>
              <th className="text-center font-serif text-[10px] italic font-medium text-ink-muted py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.project.id} className="border-b border-rule-light hover:bg-cream transition-colors">
                <td className="py-2 px-3">
                  <div className="font-sans text-[12px] font-medium text-ink">{m.project.name}</div>
                  {m.linkedContacts > 0 && (
                    <div className="font-mono text-[9px] text-ink-muted">
                      {m.linkedContacts} contact{m.linkedContacts !== 1 ? 's' : ''} in pipeline
                    </div>
                  )}
                </td>
                <td className="text-right py-2 px-3 font-mono text-[11px] text-ink-muted">
                  {m.project.timeAllocationPercent}%
                </td>
                <td className="text-right py-2 px-3">
                  <span className={`font-mono text-[11px] font-semibold ${
                    Math.abs(m.deviation) <= 5 ? 'text-ink'
                    : m.deviation > 0 ? 'text-amber-ink'
                    : 'text-red-ink'
                  }`}>
                    {m.actualPercent}%
                  </span>
                  {Math.abs(m.deviation) > 5 && (
                    <span className="font-mono text-[8px] text-ink-muted ml-0.5">
                      {m.deviation > 0 ? '+' : ''}{m.deviation}
                    </span>
                  )}
                </td>
                <td className="text-right py-2 px-3 font-mono text-[11px] text-ink">
                  {m.actualHours}h
                </td>
                <td className="text-right py-2 px-3 font-mono text-[11px] text-ink">
                  {currency(m.project.revenueActualYtd)}
                </td>
                <td className="text-right py-2 px-3 font-mono text-[11px] text-ink">
                  {m.pipelineValue > 0 ? currency(m.pipelineValue) + '/mo' : '—'}
                </td>
                <td className="text-right py-2 px-3 font-mono text-[11px] text-ink-muted">
                  {m.revenuePerHour > 0 ? `$${m.revenuePerHour}` : '—'}
                </td>
                <td className="text-center py-2 px-3">
                  <StatusBadge status={m.project.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pipeline Detail (only for projects with contacts) */}
      {metrics.some(m => m.linkedContacts > 0) && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b border-rule">
            Pipeline by Stage
          </div>
          <div className="space-y-2">
            {metrics.filter(m => m.linkedContacts > 0).map(m => (
              <div key={m.project.id}>
                <div className="font-sans text-[11px] font-medium text-ink mb-1">{m.project.name}</div>
                <div className="flex flex-wrap gap-1">
                  {PIPELINE_STAGE_ORDER
                    .filter(stage => m.stageBreakdown[stage])
                    .map(stage => (
                      <span
                        key={stage}
                        className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${
                          stage === 'closed' ? 'bg-green-bg text-green-ink border-green-ink/20'
                          : stage === 'churned' ? 'bg-red-bg text-red-ink border-red-ink/20'
                          : stage === 'negotiating' || stage === 'proposal_sent' ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
                          : 'bg-burgundy-bg text-burgundy border-burgundy/20'
                        }`}
                      >
                        {PIPELINE_STAGE_LABELS[stage]} ({m.stageBreakdown[stage]})
                      </span>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attention Bar */}
      {totalHours > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b border-rule">
            Attention Distribution
          </div>
          <div className="flex h-3 rounded-sm overflow-hidden border border-rule-light">
            {metrics
              .filter(m => m.actualHours > 0)
              .map((m, i) => {
                const COLORS = ['bg-burgundy', 'bg-ink', 'bg-ink-muted', 'bg-rule', 'bg-ink-faint']
                return (
                  <div
                    key={m.project.id}
                    className={`${COLORS[i % COLORS.length]} transition-all`}
                    style={{ width: `${m.actualPercent}%` }}
                    title={`${m.project.name}: ${m.actualPercent}% (${m.actualHours}h)`}
                  />
                )
              })
            }
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {metrics
              .filter(m => m.actualHours > 0)
              .map((m, i) => {
                const DOTS = ['bg-burgundy', 'bg-ink', 'bg-ink-muted', 'bg-rule', 'bg-ink-faint']
                return (
                  <div key={m.project.id} className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-sm ${DOTS[i % DOTS.length]}`} />
                    <span className="font-mono text-[9px] text-ink-muted">
                      {m.project.name} {m.actualPercent}%
                    </span>
                  </div>
                )
              })
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white border border-rule rounded-sm p-2">
      <div className="font-serif text-[9px] text-ink-muted uppercase tracking-[0.5px]">{label}</div>
      <div className={`font-mono text-[14px] font-bold ${color || 'text-ink'}`}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    spine: 'bg-burgundy-bg text-burgundy border-burgundy/20',
    active: 'bg-green-bg text-green-ink border-green-ink/20',
    pre_launch: 'bg-amber-bg text-amber-ink border-amber-ink/20',
    optionality: 'bg-burgundy-bg text-burgundy border-burgundy/20',
    backup: 'bg-transparent text-ink-muted border-rule',
    archived: 'bg-transparent text-ink-faint border-rule-light',
  }

  const labels: Record<string, string> = {
    spine: 'Spine',
    active: 'Active',
    pre_launch: 'Pre-launch',
    optionality: 'Option',
    backup: 'Backup',
    archived: 'Archived',
  }

  return (
    <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${styles[status] || styles.backup}`}>
      {labels[status] || status}
    </span>
  )
}
