'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import {
  getProjects,
  getRecentDailyLogs,
  getNetworkContacts,
} from '@/lib/firestore'
import type { Project, DailyLog, NetworkContact, WeeklyPlan } from '@/lib/types'
import { currency } from '@/lib/formatters'
import type { WeeklyActuals } from '@/lib/weekly-plan-utils'

interface WeeklyPlanSidebarProps {
  plan: WeeklyPlan | null
  actuals: WeeklyActuals | null
  saving: boolean
  onActivate: () => void
  onGenerateRetro: () => void
  onGenerateNextWeek: () => void
}

export default function WeeklyPlanSidebar({
  plan,
  actuals,
  saving,
  onActivate,
  onGenerateRetro,
  onGenerateNextWeek,
}: WeeklyPlanSidebarProps) {
  const { user } = useAuth()
  const { log } = useDailyLogContext()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!user) return
    getProjects(user.uid).then(setProjects)
  }, [user])

  const reward = log.rewardScore
  const score = reward?.score ?? null
  const delta = reward?.delta ?? null
  const components = reward?.components

  const cadenceItems = [
    { key: 'focus', label: 'Focus', done: (log.focusHoursActual || 0) > 0 },
    { key: 'ship', label: 'Ship', done: !!(log.whatShipped && log.whatShipped.trim()) },
    { key: 'ask', label: 'Ask', done: (log.revenueAsksCount || 0) > 0 },
    { key: 'convo', label: 'Convo', done: (log.discoveryConversationsCount || 0) > 0 },
    { key: 'post', label: 'Post', done: (log.publicPostsCount || 0) > 0 },
    { key: 'intro', label: 'Intro', done: (log.warmIntrosMade || 0) > 0 },
  ]
  const cadenceDone = cadenceItems.filter(c => c.done).length

  return (
    <div className="space-y-3 p-1 bg-cream/90 backdrop-blur-sm rounded-sm">
      {/* Live Score */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <SectionHeader>Live Score</SectionHeader>
        <div className="flex items-baseline gap-2 mt-2">
          <span className={`font-mono text-[24px] font-bold ${scoreColor(score)}`}>
            {score !== null ? score.toFixed(1) : '—'}
          </span>
          {delta !== null && (
            <span className={`font-mono text-[11px] ${delta >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
            </span>
          )}
          <span className="font-mono text-[9px] text-ink-muted">/ 10</span>
        </div>
        {components && (
          <div className="grid grid-cols-4 gap-1 mt-2">
            {([
              ['GI', components.gi],
              ['GVC', components.gvc],
              ['GN', components.gn],
              ['J', components.j],
            ] as [string, number | undefined][]).map(([label, val]) => (
              <div key={label} className="text-center">
                <div className="font-mono text-[8px] text-ink-muted">{label}</div>
                <div className={`font-mono text-[10px] font-semibold ${componentColor(val ?? null)}`}>
                  {val != null ? val.toFixed(2) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Cadence */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <SectionHeader>Today&apos;s Cadence</SectionHeader>
        <div className="grid grid-cols-6 gap-1.5 mt-2">
          {cadenceItems.map(item => (
            <div key={item.key} className="text-center">
              <div className={`w-6 h-6 mx-auto rounded-sm border-2 flex items-center justify-center ${
                item.done
                  ? 'border-green-ink bg-green-bg text-green-ink'
                  : 'border-rule bg-transparent text-ink-faint'
              }`}>
                <span className="font-mono text-[8px] font-bold">
                  {item.done ? '\u2713' : '\u2013'}
                </span>
              </div>
              <div className="font-mono text-[7px] text-ink-muted mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 font-mono text-[9px] text-ink-muted">{cadenceDone}/6 complete</div>
      </div>

      {/* 7-Day Output */}
      {actuals && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>7-Day Output</SectionHeader>
          <div className="space-y-1.5 mt-2">
            <StatRow label="Focus Hours" value={`${Math.round(actuals.focus_hours * 10) / 10}h`} />
            <StatRow label="Ships" value={String(actuals.ships)} />
            <StatRow label="Revenue Asks" value={String(actuals.revenue_asks)} />
            <StatRow label="Revenue" value={`$${actuals.revenue.toLocaleString()}`} />
            <StatRow label="Posts" value={String(actuals.posts)} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <SectionHeader>Actions</SectionHeader>
        <div className="space-y-1.5 mt-2">
          {plan?.status === 'draft' && (
            <ActionButton onClick={onActivate} label="Activate Plan" accent />
          )}
          {plan?.status === 'active' && (
            <ActionButton onClick={onGenerateRetro} label="Run Saturday Retro" />
          )}
          <ActionButton onClick={onGenerateNextWeek} label="Generate Next Week" />
          {saving && (
            <div className="font-mono text-[9px] text-ink-muted text-center">Saving...</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule">
      {children}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-serif text-[10px] text-ink-muted">{label}</span>
      <span className="font-mono text-[11px] font-semibold text-ink">{value}</span>
    </div>
  )
}

function ActionButton({ onClick, label, accent }: { onClick: () => void; label: string; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full font-serif text-[10px] font-medium px-2 py-1.5 rounded-sm border transition-colors ${
        accent
          ? 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
          : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

function scoreColor(val: number | null): string {
  if (val === null) return 'text-ink-muted'
  if (val >= 7) return 'text-green-ink'
  if (val >= 4) return 'text-amber-ink'
  return 'text-red-ink'
}

function componentColor(val: number | null): string {
  if (val === null) return 'text-ink-muted'
  if (val >= 0.7) return 'text-green-ink'
  if (val >= 0.4) return 'text-amber-ink'
  return 'text-red-ink'
}
