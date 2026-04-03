/**
 * Formats a MorningBrief into Telegram-friendly messages.
 * New structure: compass, not clipboard.
 */

import type { MorningBrief } from './morning-brief'

const TREND_ARROW: Record<string, string> = { up: '↑', down: '↓', flat: '→' }
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
  weekday: 'MORNING BRIEF',
  saturday: 'SATURDAY RECHARGE',
  sunday: 'SUNDAY — SET THE WEEK',
}

export function formatMorningBrief(brief: MorningBrief): string {
  const dateLabel = new Date(brief.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const lines: string[] = []

  const dayType = brief.dayOfWeek || 'weekday'
  const header = DAY_HEADER[dayType] || 'MORNING BRIEF'
  const modeLabels = MODE_LABEL[dayType] || MODE_LABEL.weekday

  // Header
  lines.push(`*${header} — ${dateLabel}*`)
  lines.push('')

  // Energy State
  lines.push(`*YOUR STATE*`)
  lines.push(brief.energyState.summary)
  lines.push(`_${modeLabels[brief.energyState.mode] || ''}_`)
  lines.push('')

  // Daily Intention — the core
  const { dailyIntention } = brief

  if (dailyIntention.study) {
    lines.push(`*STUDY (10am–12pm)*`)
    lines.push(dailyIntention.study)
    lines.push('')
  }

  if (dailyIntention.work) {
    lines.push(`*WORK (12–5pm)*`)
    lines.push(dailyIntention.work)
    lines.push('')
  }

  if (dailyIntention.evening) {
    lines.push(`*EVENING*`)
    lines.push(dailyIntention.evening)
    lines.push('')
  }

  if (dailyIntention.themeContext) {
    lines.push(`_${dailyIntention.themeContext}_`)
    lines.push('')
  }

  // Signals
  if (brief.signalDigest.length > 0) {
    lines.push('*SIGNALS*')
    brief.signalDigest.forEach(s => {
      lines.push(`· ${s.title}`)
    })
    lines.push('')
  }

  // Reconnect (just one person)
  if (brief.reconnect) {
    const actionStr = brief.reconnect.nextAction ? ` — "${brief.reconnect.nextAction}"` : ''
    lines.push(`Reconnect: ${brief.reconnect.name} (${brief.reconnect.daysSinceTouch}d)${actionStr}`)
    lines.push('')
  }

  // Pending Decisions
  if (brief.pendingDecisions.length > 0) {
    lines.push(`Decisions due: ${brief.pendingDecisions.map(d => `${d.title} (${d.daysUntilReview}d)`).join(', ')}`)
    lines.push('')
  }

  // Reward Trend
  const yScore = brief.rewardTrend.yesterday != null ? brief.rewardTrend.yesterday.toFixed(1) : '—'
  const wAvg = brief.rewardTrend.weekAvg != null ? brief.rewardTrend.weekAvg.toFixed(1) : '—'
  const arrow = TREND_ARROW[brief.rewardTrend.trend] || '→'
  lines.push(`Score: ${yScore} yesterday | ${wAvg} week avg | ${arrow} ${brief.rewardTrend.trend}`)
  lines.push('')

  // Keynes Check
  if (brief.keynesCheck) {
    lines.push(`_${brief.keynesCheck}_`)
    lines.push('')
  }

  // AI Synthesis
  if (brief.aiSynthesis) {
    lines.push('---')
    lines.push(`_${brief.aiSynthesis}_`)
  }

  return lines.join('\n')
}

/**
 * Compact Telegram format: daily intention + link to full brief.
 * Keeps Telegram messages short and actionable.
 */
export function formatMorningBriefCompact(brief: MorningBrief, briefUrl: string): string {
  const dateLabel = new Date(brief.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const arrow = TREND_ARROW[brief.rewardTrend.trend] || '→'
  const yScore = brief.rewardTrend.yesterday != null ? brief.rewardTrend.yesterday.toFixed(1) : '—'

  const lines: string[] = []

  const dayType = brief.dayOfWeek || 'weekday'
  const header = DAY_HEADER[dayType] || 'MORNING BRIEF'
  lines.push(`*${header} — ${dateLabel}*`)
  lines.push(`${brief.energyState.mode} | Score ${yScore} ${arrow}`)
  lines.push('')

  // Daily Intention — compact
  const { dailyIntention } = brief

  if (dailyIntention.study) {
    lines.push(`*Study:* ${dailyIntention.study}`)
  }
  if (dailyIntention.work) {
    lines.push(`*Work:* ${dailyIntention.work}`)
  }
  if (dailyIntention.evening) {
    lines.push(`*Evening:* ${dailyIntention.evening}`)
  }
  lines.push('')

  // One-line alerts
  if (brief.reconnect) {
    lines.push(`Reconnect: ${brief.reconnect.name} (${brief.reconnect.daysSinceTouch}d)`)
  }
  if (brief.pendingDecisions.length > 0) {
    lines.push(`Decisions due: ${brief.pendingDecisions.map(d => `${d.title} (${d.daysUntilReview}d)`).join(', ')}`)
  }
  if (brief.reconnect || brief.pendingDecisions.length > 0) {
    lines.push('')
  }

  // Keynes check
  if (brief.keynesCheck) {
    lines.push(`_${brief.keynesCheck}_`)
    lines.push('')
  }

  // Link to full brief
  lines.push(`[Full brief →](${briefUrl})`)

  return lines.join('\n')
}
