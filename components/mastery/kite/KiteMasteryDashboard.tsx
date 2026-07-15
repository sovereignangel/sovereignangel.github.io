'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { KiteSession } from '@/lib/types'
import {
  getKiteSessions,
  addKiteSession,
  deleteKiteSession,
  getKiteProgress,
  setKiteMilestone,
} from '@/lib/firestore'
import { computeKiteStats, computeBeltStatuses, KITE_BELTS } from '@/lib/kite/belts'
import { BeltLadder } from './BeltLadder'
import { HoursChart } from './HoursChart'
import { SessionModal } from './SessionModal'

interface Props {
  uid: string
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-rule rounded-sm p-2">
      <div className="text-[10px] text-ink-muted uppercase tracking-[0.5px] mb-0.5">{label}</div>
      <div className="font-serif text-[20px] font-semibold text-ink leading-none">{value}</div>
      {sub && <div className="text-[10px] text-ink-muted mt-0.5 truncate">{sub}</div>}
    </div>
  )
}

export function KiteMasteryDashboard({ uid }: Props) {
  const [sessions, setSessions] = useState<KiteSession[]>([])
  const [milestones, setMilestones] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([getKiteSessions(uid), getKiteProgress(uid)])
    setSessions(s)
    setMilestones(p.milestones || {})
    setLoading(false)
  }, [uid])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => computeKiteStats(sessions), [sessions])
  const { currentIndex, targetIndex } = useMemo(
    () => computeBeltStatuses(stats, milestones),
    [stats, milestones]
  )

  const handleAdd = async (session: Omit<KiteSession, 'id' | 'createdAt'>) => {
    await addKiteSession(uid, session)
    await load()
  }

  const handleDelete = async (sessionId: string) => {
    await deleteKiteSession(uid, sessionId)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  const handleToggleMilestone = async (criterionId: string, checked: boolean) => {
    setMilestones(prev => ({ ...prev, [criterionId]: checked }))
    await setKiteMilestone(uid, criterionId, checked)
  }

  const currentBelt = currentIndex >= 0 ? KITE_BELTS[currentIndex].name : 'Unranked'
  const targetBelt = KITE_BELTS[targetIndex]
  const landedRate =
    stats.totalJumps > 0 ? `${Math.round((stats.totalLanded / stats.totalJumps) * 100)}% landed` : 'none yet'

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <header className="flex items-end justify-between pb-2 border-b-2 border-ink">
        <div>
          <h1 className="font-serif text-[22px] font-bold text-ink tracking-tight leading-none">
            Kite Mastery
          </h1>
          <p className="text-[11px] text-ink-muted mt-1">
            Palanga Sprint · Jul 14 — Sep 26 · Belt progression, Surfr KPIs, hours on water
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 shrink-0"
        >
          Log Session
        </button>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-16 bg-paper border border-rule rounded-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatTile label="Belt" value={currentBelt} sub={`next: ${targetBelt.name} — ${targetBelt.title}`} />
            <StatTile
              label="Hours on Water"
              value={stats.totalHours % 1 === 0 ? `${stats.totalHours}` : stats.totalHours.toFixed(1)}
              sub={`${stats.sessionCount} sessions`}
            />
            <StatTile label="Best Airtime" value={stats.bestAirtimeSec > 0 ? `${stats.bestAirtimeSec.toFixed(1)}s` : '—'} sub="Surfr" />
            <StatTile label="Best Height" value={stats.bestHeightM > 0 ? `${stats.bestHeightM.toFixed(1)}m` : '—'} sub="Surfr" />
            <StatTile label="Best Distance" value={stats.bestDistanceM > 0 ? `${stats.bestDistanceM.toFixed(1)}m` : '—'} sub="Surfr" />
            <StatTile label="Jumps" value={stats.totalJumps > 0 ? `${stats.totalJumps}` : '—'} sub={landedRate} />
          </div>

          {/* Hours chart */}
          <HoursChart sessions={sessions} />

          {/* Belt ladder */}
          <BeltLadder stats={stats} milestones={milestones} onToggleMilestone={handleToggleMilestone} />
        </>
      )}

      <SessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sessions={sessions}
        onAdd={handleAdd}
        onDelete={handleDelete}
      />
    </div>
  )
}
