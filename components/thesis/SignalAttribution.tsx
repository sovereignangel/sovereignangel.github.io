'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { localDateString } from '@/lib/date-utils'
import {
  getInboxExternalSignals,
  getDecisions,
} from '@/lib/firestore'
import type { ExternalSignal, Decision } from '@/lib/types'
import type { ThesisBriefing, ConvictionShift, CrossDomainLink } from '@/lib/types/overnight'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ─── Types ──────────────────────────────────────────────────────────

interface StreamStats {
  stream: string
  label: string
  count: number
  acted: number
  hitRate: number | null // % of acted signals that improved score next day
}

// ─── Component ──────────────────────────────────────────────────────

export default function SignalAttribution() {
  const { user } = useAuth()
  const { recentLogs } = useDailyLogContext()
  const [briefing, setBriefing] = useState<ThesisBriefing | null>(null)
  const [signals, setSignals] = useState<ExternalSignal[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  const today = localDateString(new Date())

  useEffect(() => {
    if (!user) return
    setLoading(true)

    const fetchAll = async () => {
      try {
        // Fetch today's briefing
        const briefRef = doc(db, 'users', user.uid, 'thesis_briefings', today)
        const briefSnap = await getDoc(briefRef)
        if (briefSnap.exists()) {
          setBriefing(briefSnap.data() as ThesisBriefing)
        }

        // Fetch signals and decisions
        const [sigs, decs] = await Promise.all([
          getInboxExternalSignals(user.uid).catch(() => [] as ExternalSignal[]),
          getDecisions(user.uid, 'active').catch(() => [] as Decision[]),
        ])
        setSignals(sigs)
        setDecisions(decs)
      } catch (e) {
        console.error('[SignalAttribution] fetch error:', e)
      }
      setLoading(false)
    }
    fetchAll()
  }, [user, today])

  // ─── Signal stream breakdown ──────────────────────────────────────

  const streamStats: StreamStats[] = useMemo(() => {
    const streams: Record<string, { count: number; acted: number }> = {
      research: { count: 0, acted: 0 },
      market: { count: 0, acted: 0 },
      observation: { count: 0, acted: 0 },
      venture: { count: 0, acted: 0 },
    }

    for (const s of signals) {
      if (s.source === 'arxiv') {
        streams.research.count++
        if (s.readStatus === 'read') streams.research.acted++
      } else if (['blog', 'twitter_list', 'edgar'].includes(s.source)) {
        streams.market.count++
        if (s.readStatus === 'read') streams.market.acted++
      }
    }

    // Observation = beliefs from briefing
    if (briefing?.streams?.observation) {
      streams.observation.count = briefing.streams.observation.itemCount
      streams.observation.acted = briefing.convictionShifts?.filter(c => c.stream === 'observation').length || 0
    }

    // Venture signals
    if (briefing?.streams?.venture) {
      streams.venture.count = briefing.streams.venture.itemCount
      streams.venture.acted = briefing.convictionShifts?.filter(c => c.stream === 'venture').length || 0
    }

    const labels: Record<string, string> = {
      research: 'Research',
      market: 'Market',
      observation: 'Observation',
      venture: 'Venture',
    }

    return Object.entries(streams).map(([key, val]) => ({
      stream: key,
      label: labels[key],
      count: val.count,
      acted: val.acted,
      hitRate: null, // computed below
    }))
  }, [signals, briefing])

  // ─── Score-based hit rate (30-day lookback) ────────────────────────

  const hitRate = useMemo(() => {
    if (!recentLogs || recentLogs.length < 3) return null
    const sorted = [...recentLogs].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    let improved = 0
    let total = 0
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].rewardScore?.score
      const curr = sorted[i].rewardScore?.score
      if (prev != null && curr != null) {
        total++
        if (curr > prev) improved++
      }
    }
    return total > 0 ? Math.round((improved / total) * 100) : null
  }, [recentLogs])

  // ─── Conviction shifts ────────────────────────────────────────────

  const convictionShifts = briefing?.convictionShifts || []
  const crossLinks = briefing?.crossLinks || []
  const signalsProcessed = briefing?.signalsProcessed || signals.length

  // ─── Signal decay (how old are unread signals?) ───────────────────

  const signalAge = useMemo(() => {
    const unread = signals.filter(s => s.readStatus === 'unread')
    if (unread.length === 0) return null
    const ages = unread.map(s => {
      const created = s.publishedAt || s.createdAt
      if (!created) return 0
      const d = typeof created === 'string' ? new Date(created) : (created as { toDate?: () => Date }).toDate?.() || new Date()
      return Math.max(0, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)))
    })
    return {
      median: ages.sort((a, b) => a - b)[Math.floor(ages.length / 2)],
      count: unread.length,
    }
  }, [signals])

  const totalSignals = streamStats.reduce((s, st) => s + st.count, 0)
  const totalActed = streamStats.reduce((s, st) => s + st.acted, 0)

  if (loading) {
    return (
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule">
          Signal → Value
        </div>
        <div className="font-mono text-[10px] text-ink-muted mt-2">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule">
        Signal → Value
      </div>

      {/* ─── Funnel Strip ─── */}
      <div className="flex items-center justify-between mt-2 mb-2 px-1">
        <FunnelStat label="Ingested" value={signalsProcessed} />
        <FunnelArrow />
        <FunnelStat label="Shifts" value={convictionShifts.length} />
        <FunnelArrow />
        <FunnelStat label="Acted" value={totalActed} />
        <FunnelArrow />
        <FunnelStat label="Links" value={crossLinks.length} />
        {hitRate !== null && (
          <>
            <FunnelArrow />
            <FunnelStat label="Hit Rate" value={`${hitRate}%`} highlight />
          </>
        )}
      </div>

      {/* ─── Stream Attribution Bar ─── */}
      {totalSignals > 0 && (
        <div className="mb-2">
          <div className="flex h-[6px] rounded-sm overflow-hidden">
            {streamStats.filter(s => s.count > 0).map(s => (
              <div
                key={s.stream}
                className={STREAM_COLORS[s.stream]}
                style={{ width: `${(s.count / totalSignals) * 100}%` }}
                title={`${s.label}: ${s.count} signals`}
              />
            ))}
          </div>
          <div className="flex gap-3 mt-1">
            {streamStats.filter(s => s.count > 0).map(s => (
              <div key={s.stream} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${STREAM_DOT_COLORS[s.stream]}`} />
                <span className="font-mono text-[9px] text-ink-muted">{s.label}</span>
                <span className="font-mono text-[9px] text-ink">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Conviction Shifts (top 3) ─── */}
      {convictionShifts.length > 0 && (
        <div className="mb-2">
          <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted mb-1">
            Conviction Shifts
          </div>
          {convictionShifts.slice(0, 3).map((shift, i) => (
            <ConvictionRow key={i} shift={shift} />
          ))}
        </div>
      )}

      {/* ─── Cross-Domain Links (top 2) ─── */}
      {crossLinks.length > 0 && (
        <div className="mb-2">
          <div className="font-mono text-[9px] uppercase tracking-[1px] text-ink-muted mb-1">
            Cross-Domain Links
          </div>
          {crossLinks.slice(0, 2).map((link, i) => (
            <CrossLinkRow key={i} link={link} />
          ))}
        </div>
      )}

      {/* ─── Signal Decay ─── */}
      {signalAge && (
        <div className="flex items-center gap-2 pt-1 border-t border-rule-light">
          <span className="font-mono text-[9px] text-ink-muted">Signal age</span>
          <span className={`font-mono text-[10px] font-semibold ${signalAge.median > 3 ? 'text-amber-ink' : 'text-ink'}`}>
            {signalAge.median}d median
          </span>
          <span className="font-mono text-[9px] text-ink-muted">({signalAge.count} unread)</span>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

const STREAM_COLORS: Record<string, string> = {
  research: 'bg-burgundy/60',
  market: 'bg-amber-ink/60',
  observation: 'bg-green-ink/60',
  venture: 'bg-ink-muted/60',
}

const STREAM_DOT_COLORS: Record<string, string> = {
  research: 'bg-burgundy',
  market: 'bg-amber-ink',
  observation: 'bg-green-ink',
  venture: 'bg-ink-muted',
}

function FunnelStat({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-mono text-[14px] font-bold leading-none ${highlight ? 'text-green-ink' : 'text-ink'}`}>
        {value}
      </div>
      <div className="font-mono text-[8px] uppercase tracking-[1px] text-ink-muted mt-0.5">{label}</div>
    </div>
  )
}

function FunnelArrow() {
  return <span className="font-mono text-[10px] text-ink-faint">→</span>
}

function ConvictionRow({ shift }: { shift: ConvictionShift }) {
  const dirIcon = shift.direction === 'stronger' ? '↑' : shift.direction === 'weaker' ? '↓' : '●'
  const dirColor = shift.direction === 'stronger' ? 'text-green-ink' : shift.direction === 'weaker' ? 'text-red-ink' : 'text-amber-ink'

  return (
    <div className="flex items-start gap-1.5 py-0.5">
      <span className={`font-mono text-[10px] font-bold ${dirColor} mt-px`}>{dirIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-sans text-[10px] text-ink leading-tight truncate">{shift.belief}</div>
        <div className="font-mono text-[8px] text-ink-muted">
          {shift.stream} · {shift.evidence?.slice(0, 60)}{(shift.evidence?.length || 0) > 60 ? '…' : ''}
        </div>
      </div>
    </div>
  )
}

function CrossLinkRow({ link }: { link: CrossDomainLink }) {
  return (
    <div className="py-0.5">
      <div className="flex items-center gap-1 font-mono text-[8px] text-ink-muted">
        <span className="uppercase">{link.from.stream}</span>
        <span>→</span>
        <span className="uppercase">{link.to.stream}</span>
        <span className="ml-auto font-semibold">{(link.strength * 100).toFixed(0)}%</span>
      </div>
      <div className="font-sans text-[10px] text-ink leading-tight">{link.insight?.slice(0, 80)}{(link.insight?.length || 0) > 80 ? '…' : ''}</div>
    </div>
  )
}
