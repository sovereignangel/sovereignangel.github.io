/**
 * Formats a MorningBrief into a Telegram-friendly Markdown message.
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
const JOB_STAGE_EMOJI: Record<string, string> = {
  researching: '🔍', applied: '📨', phone_screen: '📞', interview: '🎤',
  take_home: '💻', final_round: '🏁', offer: '💰',
}

export function formatMorningBrief(brief: MorningBrief): string {
  const dateLabel = new Date(brief.date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const lines: string[] = []

  const dayType = brief.dayOfWeek || 'weekday'
  const header = DAY_HEADER[dayType] || 'MORNING BRIEF'

  // Header
  lines.push(`*${header} — ${dateLabel}*`)
  lines.push('')

  // Energy State
  lines.push('*YOUR STATE*')
  lines.push(brief.energyState.summary)
  const modeLabels = MODE_LABEL[dayType] || MODE_LABEL.weekday
  lines.push(`_${modeLabels[brief.energyState.mode] || ''}_`)
  lines.push('')

  // Top Plays
  if (brief.topPlays.length > 0) {
    lines.push('*TOP 3 PLAYS*')
    brief.topPlays.forEach((play, i) => {
      lines.push(`${i + 1}. ${play.action} — ${play.reason}`)
    })
    lines.push('')
  }

  // Open Todos
  if (brief.openTodos && brief.openTodos.length > 0) {
    const doFirst = brief.openTodos.filter(t => t.quadrant === 'do_first')
    const schedule = brief.openTodos.filter(t => t.quadrant === 'schedule')
    lines.push('*OPEN TODOS*')
    doFirst.forEach(t => {
      const proj = t.projectName ? `[${t.projectName}] ` : ''
      lines.push(`! ${proj}${t.text}`)
    })
    schedule.forEach(t => {
      const proj = t.projectName ? `[${t.projectName}] ` : ''
      lines.push(`> ${proj}${t.text}`)
    })
    const other = brief.openTodos.length - doFirst.length - schedule.length
    if (other > 0) {
      lines.push(`_+${other} more (delegate/eliminate)_`)
    }
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

  // Job Pipeline
  if (brief.jobPipeline && brief.jobPipeline.length > 0) {
    lines.push('*JOB PIPELINE*')
    brief.jobPipeline.forEach(j => {
      const emoji = JOB_STAGE_EMOJI[j.stage] || '·'
      const stale = j.daysSinceUpdate > 5 ? ' ⚠' : ''
      const next = j.nextAction ? ` → ${j.nextAction}` : ''
      lines.push(`${emoji} ${j.company} — ${j.role} [${j.stage}]${next}${stale}`)
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

/**
 * Compact Telegram format: top 3-5 plays + link to full brief page.
 * Replaces the full brief dump — keeps Telegram messages short and actionable.
 */
export function formatMorningBriefCompact(brief: MorningBrief, briefUrl: string): string {
  const dateLabel = new Date(brief.date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const arrow = TREND_ARROW[brief.rewardTrend.trend] || '→'
  const yScore = brief.rewardTrend.yesterday != null ? brief.rewardTrend.yesterday.toFixed(1) : '—'

  const lines: string[] = []

  const dayType2 = brief.dayOfWeek || 'weekday'
  const header2 = DAY_HEADER[dayType2] || 'MORNING BRIEF'
  lines.push(`*${header2} — ${dateLabel}*`)
  lines.push(`${brief.energyState.mode} | Score ${yScore} ${arrow}`)
  lines.push('')

  // Top plays — the core of the compact message
  if (brief.topPlays.length > 0) {
    brief.topPlays.forEach((play, i) => {
      lines.push(`${i + 1}. *${play.action}*`)
      lines.push(`   ${play.reason}`)
    })
    lines.push('')
  }

  // Todos summary
  if (brief.openTodos && brief.openTodos.length > 0) {
    const df = brief.openTodos.filter(t => t.quadrant === 'do_first').length
    lines.push(`Todos: ${df} urgent, ${brief.openTodos.length} total`)
    lines.push('')
  }

  // One-line alerts
  if (brief.staleContacts.length > 0) {
    lines.push(`Reconnect: ${brief.staleContacts.map(c => c.name).join(', ')}`)
  }
  if (brief.pendingDecisions.length > 0) {
    lines.push(`Decisions due: ${brief.pendingDecisions.map(d => `${d.title} (${d.daysUntilReview}d)`).join(', ')}`)
  }
  // Pipeline alerts
  if (brief.jobPipeline && brief.jobPipeline.length > 0) {
    const stale = brief.jobPipeline.filter(j => j.daysSinceUpdate > 5)
    if (stale.length > 0) {
      lines.push(`Pipeline follow-up: ${stale.map(j => j.company).join(', ')}`)
    } else {
      lines.push(`Pipeline: ${brief.jobPipeline.length} active`)
    }
  }
  if (brief.staleContacts.length > 0 || brief.pendingDecisions.length > 0 || (brief.jobPipeline && brief.jobPipeline.length > 0)) {
    lines.push('')
  }

  // Link to full brief
  lines.push(`[Full brief →](${briefUrl})`)

  return lines.join('\n')
}
