import { adminDb } from '@/lib/firebase-admin'
import type { MorningBrief } from '@/lib/morning-brief'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface BriefDoc {
  type: string
  brief: MorningBrief
  formatted: string
  generatedAt: { toDate?: () => Date } | string
  publicToken?: string
}

const TREND_ARROW: Record<string, string> = { up: '↑', down: '↓', flat: '→' }
const MODE_COLOR: Record<string, string> = {
  GO: 'bg-green-bg text-green-ink border-green-ink/20',
  CONSERVE: 'bg-amber-bg text-amber-ink border-amber-ink/20',
  RECOVER: 'bg-burgundy-bg text-burgundy border-burgundy/20',
}
const MODE_LABEL: Record<string, Record<string, string>> = {
  weekday: {
    GO: 'Push hard today.',
    CONSERVE: 'Pace yourself — protect your energy.',
    RECOVER: 'Recovery day. Low intensity only.',
  },
  saturday: {
    GO: 'Energy is high — enjoy it. Train, explore, connect.',
    CONSERVE: 'Easy Saturday. Recharge and restore.',
    RECOVER: 'Full recovery mode. Rest is productive.',
  },
  sunday: {
    GO: 'Strong foundation — set up an elite week.',
    CONSERVE: 'Calm prep day. Admin and relationships.',
    RECOVER: 'Gentle Sunday. Light admin, early night.',
  },
}
const DAY_HEADER: Record<string, string> = {
  weekday: 'Morning Brief',
  saturday: 'Saturday Recharge',
  sunday: 'Sunday — Set the Week',
}

export async function generateMetadata({ params }: { params: { date: string } }): Promise<Metadata> {
  const dateLabel = formatDate(params.date)
  return {
    title: `Morning Brief — ${dateLabel}`,
    description: 'Daily compass from the Thesis Engine.',
  }
}

function formatDate(date: string): string {
  try {
    return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

function formatDateShort(date: string): string {
  try {
    return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

async function findBrief(date: string, token?: string): Promise<BriefDoc | null> {
  const usersSnap = await adminDb.collection('users').get()

  for (const userDoc of usersSnap.docs) {
    const briefSnap = await adminDb
      .collection('users').doc(userDoc.id)
      .collection('daily_reports').doc(date)
      .get()

    if (briefSnap.exists) {
      const data = briefSnap.data() as BriefDoc
      if (token && data.publicToken && data.publicToken !== token) continue
      if (data.brief) return data
    }
  }

  return null
}

export default async function BriefPage({
  params,
  searchParams,
}: {
  params: { date: string }
  searchParams: { token?: string }
}) {
  const data = await findBrief(params.date, searchParams.token)

  if (!data || !data.brief) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-[16px] text-ink mb-2">Brief not found</h1>
          <p className="font-mono text-[11px] text-ink-muted">
            No morning brief exists for {params.date}, or the access token is invalid.
          </p>
        </div>
      </div>
    )
  }

  const brief = data.brief
  const dateLabel = formatDate(params.date)
  const dateShort = formatDateShort(params.date)

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white border border-rule rounded-sm mb-3">
          <div className="p-4 border-b-2 border-burgundy">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-[9px] uppercase text-ink-muted block mb-0.5">{DAY_HEADER[brief.dayOfWeek || 'weekday'] || 'Morning Brief'}</span>
                <h1 className="font-serif text-[20px] font-bold text-ink">{dateLabel}</h1>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-[9px] uppercase px-2 py-1 rounded-sm border font-semibold ${MODE_COLOR[brief.energyState.mode] || 'bg-cream text-ink-muted border-rule'}`}>
                  {brief.energyState.mode}
                </span>
              </div>
            </div>

            {/* Energy State */}
            <div className="bg-cream border border-rule-light rounded-sm px-3 py-2 mb-3">
              <div className="font-mono text-[10px] text-ink font-medium">{brief.energyState.summary}</div>
              <div className="font-serif text-[10px] italic text-ink-muted mt-0.5">{(MODE_LABEL[brief.dayOfWeek || 'weekday'] || MODE_LABEL.weekday)[brief.energyState.mode]}</div>
            </div>

            {/* Reward Trend */}
            <div className="flex items-center gap-3">
              <div className="bg-cream border border-rule-light rounded-sm px-2 py-1">
                <span className="font-mono text-[8px] uppercase text-ink-muted">Yesterday</span>
                <span className="font-mono text-[13px] font-bold text-ink ml-1">
                  {brief.rewardTrend.yesterday != null ? brief.rewardTrend.yesterday.toFixed(1) : '—'}
                </span>
              </div>
              <div className="bg-cream border border-rule-light rounded-sm px-2 py-1">
                <span className="font-mono text-[8px] uppercase text-ink-muted">Week Avg</span>
                <span className="font-mono text-[13px] font-bold text-ink ml-1">
                  {brief.rewardTrend.weekAvg != null ? brief.rewardTrend.weekAvg.toFixed(1) : '—'}
                </span>
              </div>
              <div className="bg-cream border border-rule-light rounded-sm px-2 py-1">
                <span className="font-mono text-[8px] uppercase text-ink-muted">Trend</span>
                <span className="font-mono text-[13px] font-bold text-ink ml-1">
                  {TREND_ARROW[brief.rewardTrend.trend] || '→'} {brief.rewardTrend.trend}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Daily Intention */}
            <div>
              <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
                Today&apos;s Intention
              </h2>
              <div className="space-y-3">
                {brief.dailyIntention.study?.headline && (
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[9px] font-semibold uppercase px-2 py-1 rounded-sm bg-amber-bg text-amber-ink border border-amber-ink/20 shrink-0 mt-0.5">
                      Study
                    </span>
                    <div className="flex-1">
                      <div className="font-mono text-[11px] font-semibold text-ink leading-tight">{brief.dailyIntention.study.headline}</div>
                      {brief.dailyIntention.study.nuance && (
                        <div className="font-mono text-[10px] text-ink-muted mt-1 leading-relaxed">{brief.dailyIntention.study.nuance}</div>
                      )}
                    </div>
                  </div>
                )}
                {brief.dailyIntention.work?.headline && (
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[9px] font-semibold uppercase px-2 py-1 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20 shrink-0 mt-0.5">
                      Work
                    </span>
                    <div className="flex-1">
                      <div className="font-mono text-[11px] font-semibold text-ink leading-tight">{brief.dailyIntention.work.headline}</div>
                      {brief.dailyIntention.work.nuance && (
                        <div className="font-mono text-[10px] text-ink-muted mt-1 leading-relaxed">{brief.dailyIntention.work.nuance}</div>
                      )}
                    </div>
                  </div>
                )}
                {brief.dailyIntention.evening?.headline && (
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[9px] font-semibold uppercase px-2 py-1 rounded-sm bg-green-bg text-green-ink border border-green-ink/20 shrink-0 mt-0.5">
                      Evening
                    </span>
                    <div className="flex-1">
                      <div className="font-mono text-[11px] font-semibold text-ink leading-tight">{brief.dailyIntention.evening.headline}</div>
                      {brief.dailyIntention.evening.nuance && (
                        <div className="font-mono text-[10px] text-ink-muted mt-1 leading-relaxed">{brief.dailyIntention.evening.nuance}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {brief.dailyIntention.themeContext && (
                <div className="font-serif text-[10px] italic text-ink-muted mt-2 pt-2 border-t border-rule-light">
                  {brief.dailyIntention.themeContext}
                </div>
              )}
            </div>

            {/* Signal Digest */}
            {brief.signalDigest.length > 0 && (
              <div>
                <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                  Signals
                </h3>
                <div className="space-y-1">
                  {brief.signalDigest.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="font-mono text-[8px] text-ink-faint shrink-0 mt-0.5">{Math.round(s.relevance * 100)}%</span>
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] font-medium text-ink leading-tight">{s.title}</div>
                        {s.summary && <div className="font-mono text-[10px] text-ink-muted mt-0.5">{s.summary}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Two-column: Reconnect + Pending Decisions */}
            {(brief.reconnect || brief.pendingDecisions.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {brief.reconnect && (
                  <div>
                    <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                      Reconnect
                    </h3>
                    <div className="flex items-start gap-1.5">
                      <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm bg-amber-bg text-amber-ink border border-amber-ink/10 shrink-0 mt-0.5">
                        {brief.reconnect.daysSinceTouch}d
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] font-medium text-ink">{brief.reconnect.name}</div>
                        {brief.reconnect.nextAction && <div className="font-mono text-[10px] text-ink-muted">{brief.reconnect.nextAction}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {brief.pendingDecisions.length > 0 && (
                  <div>
                    <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                      Decisions Due
                    </h3>
                    <div className="space-y-1">
                      {brief.pendingDecisions.map((d, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border shrink-0 mt-0.5 ${
                            d.daysUntilReview <= 3
                              ? 'bg-burgundy-bg text-burgundy border-burgundy/20'
                              : 'bg-cream text-ink-muted border-rule-light'
                          }`}>
                            {d.daysUntilReview}d
                          </span>
                          <div className="font-mono text-[10px] text-ink">{d.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Keynes Check */}
            {brief.keynesCheck && (
              <div className="bg-cream border border-rule-light rounded-sm p-3">
                <div className="font-mono text-[9px] font-semibold uppercase text-ink-muted mb-1">Keynes Check</div>
                <div className="font-serif text-[11px] italic text-ink leading-relaxed">{brief.keynesCheck}</div>
              </div>
            )}

            {/* AI Synthesis */}
            {brief.aiSynthesis && (
              <div className="border-t-2 border-rule pt-3">
                <div className="font-serif text-[12px] italic text-ink leading-relaxed whitespace-pre-line">
                  {brief.aiSynthesis}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-3">
          <span className="font-mono text-[9px] text-ink-faint">
            {dateShort} — Generated by Thesis Engine
          </span>
        </div>
      </div>
    </div>
  )
}
