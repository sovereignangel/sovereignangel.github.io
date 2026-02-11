'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getDailyLog, getRecentDailyLogs, getRecentGarminMetrics } from '@/lib/firestore'
import { todayString, getLast7Days } from '@/lib/formatters'
import type { DailyLog, GarminMetrics } from '@/lib/types'
import DailyThesisBanner from '@/components/thesis/DailyThesisBanner'
import NervousSystemTrends from '@/components/thesis/NervousSystemTrends'
import TwentyFourHourBanner from '@/components/thesis/TwentyFourHourBanner'
import Link from 'next/link'

export default function ThesisDashboard() {
  const { user, profile } = useAuth()
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([])
  const [garminMetrics, setGarminMetrics] = useState<GarminMetrics[]>([])
  const today = todayString()
  const last7 = getLast7Days()

  useEffect(() => {
    if (!user) return
    getDailyLog(user.uid, today).then(setTodayLog)
    getRecentDailyLogs(user.uid, 7).then(setRecentLogs)
    getRecentGarminMetrics(user.uid, 7).then(setGarminMetrics)
  }, [user, today])

  const isSpiked = todayLog?.nervousSystemState === 'spiked'
  const shipsThisWeek = recentLogs.filter(l => l.publicIteration).length

  return (
    <div>
      {isSpiked && <TwentyFourHourBanner />}

      {shipsThisWeek === 0 && recentLogs.length > 0 && (
        <div className="bg-amber-bg border border-amber-ink/20 rounded-sm px-4 py-2.5 mb-4">
          <p className="font-serif text-[12px] text-amber-ink">
            No public iterations this week yet. Ship something — embarrassment tolerance is the muscle.
          </p>
        </div>
      )}

      <DailyThesisBanner
        focusHoursActual={todayLog?.focusHoursActual || 0}
        focusHoursTarget={profile?.settings?.focusHoursPerDay || 6}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Quick Actions */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-paper border border-rule rounded-sm p-5">
            <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
              Today&apos;s Snapshot
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Focus Hours</p>
                <p className="font-mono text-[18px] font-semibold text-ink">{todayLog?.focusHoursActual || '—'}</p>
              </div>
              <div>
                <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Revenue Asks</p>
                <p className="font-mono text-[18px] font-semibold text-ink">{todayLog?.revenueAsksCount || '—'}</p>
              </div>
              <div>
                <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Shipped</p>
                <p className="font-mono text-[18px] font-semibold text-ink">{todayLog?.publicIteration ? 'Yes' : '—'}</p>
              </div>
              <div>
                <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">Revenue ($)</p>
                <p className="font-mono text-[18px] font-semibold text-gold">{todayLog?.revenueThisSession ? `$${todayLog.revenueThisSession}` : '—'}</p>
              </div>
            </div>

            {todayLog?.whatShipped && (
              <div className="mt-4 pt-3 border-t border-rule-light">
                <p className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted mb-1">What Shipped</p>
                <p className="font-sans text-[13px] text-ink">{todayLog.whatShipped}</p>
              </div>
            )}
          </div>

          <Link
            href="/thesis/daily-log"
            className="block bg-navy text-paper font-serif text-[14px] font-semibold rounded-sm px-5 py-3 hover:bg-navy-light transition-colors text-center no-underline"
          >
            {todayLog ? 'Update Today\'s Log' : 'Log Today'}
          </Link>
        </div>

        {/* Right: Trends */}
        <div className="lg:col-span-2">
          <div className="bg-paper border border-rule rounded-sm p-5">
            <NervousSystemTrends logs={recentLogs} dates={last7} garminMetrics={garminMetrics} />
          </div>
        </div>
      </div>
    </div>
  )
}
