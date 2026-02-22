/**
 * Formats a MorningBrief into a Telegram-friendly Markdown message.
 */

import type { MorningBrief } from './morning-brief'

const TREND_ARROW: Record<string, string> = { up: '↑', down: '↓', flat: '→' }
const MODE_LABEL: Record<string, string> = {
  GO: 'Push hard today.',
  CONSERVE: 'Pace yourself — protect your energy.',
  RECOVER: 'Recovery day. Low intensity only.',
}

export function formatMorningBrief(brief: MorningBrief): string {
  const dateLabel = new Date(brief.date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const lines: string[] = []

  // Header
  lines.push(`*MORNING BRIEF — ${dateLabel}*`)
  lines.push('')

  // Energy State
  lines.push('*YOUR STATE*')
  lines.push(brief.energyState.summary)
  lines.push(`_${MODE_LABEL[brief.energyState.mode] || ''}_`)
  lines.push('')

  // Top Plays
  if (brief.topPlays.length > 0) {
    lines.push('*TOP 3 PLAYS*')
    brief.topPlays.forEach((play, i) => {
      lines.push(`${i + 1}. ${play.action} — ${play.reason}`)
    })
    lines.push('')
  }

  // Signal Digest
  if (brief.signalDigest.length > 0) {
    lines.push('*SIGNAL DIGEST*')
    brief.signalDigest.forEach(s => {
      lines.push(`· ${s.title} (${s.relevance.toFixed(2)})`)
    })
    lines.push('')
  }

  // Stale Contacts
  if (brief.staleContacts.length > 0) {
    lines.push('*STALE CONTACTS*')
    brief.staleContacts.forEach(c => {
      const actionStr = c.nextAction ? `, "${c.nextAction}"` : ''
      lines.push(`⚠ ${c.name} (${c.tier}) — ${c.daysSinceTouch} days${actionStr}`)
    })
    lines.push('')
  }

  // Pending Decisions
  if (brief.pendingDecisions.length > 0) {
    lines.push('*DECISIONS DUE*')
    brief.pendingDecisions.forEach(d => {
      lines.push(`→ ${d.title} — review in ${d.daysUntilReview} days`)
    })
    lines.push('')
  }

  // Stalled Projects
  if (brief.stalledProjects.length > 0) {
    lines.push('*STALLED PROJECTS*')
    brief.stalledProjects.forEach(p => {
      const msStr = p.nextMilestone ? `, next: "${p.nextMilestone}"` : ''
      lines.push(`⚠ ${p.name} — ${p.daysSinceActivity} days idle${msStr}`)
    })
    lines.push('')
  }

  // Reward Trend
  const yScore = brief.rewardTrend.yesterday != null ? brief.rewardTrend.yesterday.toFixed(1) : '—'
  const wAvg = brief.rewardTrend.weekAvg != null ? brief.rewardTrend.weekAvg.toFixed(1) : '—'
  const arrow = TREND_ARROW[brief.rewardTrend.trend] || '→'
  lines.push('*REWARD TREND*')
  lines.push(`Yesterday ${yScore} | Week avg ${wAvg} | ${arrow} Trending ${brief.rewardTrend.trend}`)
  lines.push('')

  // Discernment Exercise
  if (brief.discernmentPrompt) {
    lines.push('*DISCERNMENT EXERCISE*')
    lines.push(`_${brief.discernmentPrompt}_`)
    lines.push('')
  }

  // AI Synthesis
  if (brief.aiSynthesis) {
    lines.push('---')
    lines.push(`_${brief.aiSynthesis}_`)
  }

  return lines.join('\n')
}
