/**
 * Formats a WeeklyCalibration into a Telegram-friendly Markdown message.
 * Uses Telegram's basic Markdown syntax (*bold*, _italic_).
 * Keeps total message under 4000 chars — the sendTelegramMessage function
 * handles splitting at line boundaries if needed.
 */

import type { WeeklyCalibration } from './weekly-calibration'

const TRAJECTORY_LABEL: Record<string, string> = {
  improving: '↑ improving',
  declining: '↓ declining',
  flat: '→ flat',
}

function formatDateRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart + 'T12:00:00')
  const end = new Date(weekEnd + 'T12:00:00')
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${startLabel}-${endLabel}`
}

function formatCurrency(amount: number): string {
  if (amount === 0) return '$0'
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`
  return `$${Math.round(amount).toLocaleString()}`
}

export function formatWeeklyCalibration(cal: WeeklyCalibration): string {
  const lines: string[] = []
  const dateRange = formatDateRange(cal.weekStart, cal.weekEnd)

  // Header
  lines.push(`*WEEKLY CALIBRATION — ${dateRange}*`)
  lines.push('')

  // Performance
  lines.push('*PERFORMANCE*')
  const scoreStr = cal.performance.avgRewardScore != null
    ? cal.performance.avgRewardScore.toFixed(1)
    : '—'
  const trajectory = TRAJECTORY_LABEL[cal.performance.scoreTrajectory] || '→ flat'
  lines.push(`Reward: ${scoreStr} avg (${trajectory})`)
  lines.push(
    `Focus: ${cal.performance.totalFocusHours}h | ` +
    `Ships: ${cal.performance.totalShips} | ` +
    `Asks: ${cal.performance.totalRevenueAsks} | ` +
    `Revenue: ${formatCurrency(cal.performance.totalRevenue)}`
  )
  lines.push(
    `Conversations: ${cal.performance.totalConversations} | ` +
    `Intros: ${cal.performance.totalIntros}`
  )
  lines.push(`Cadence: ${cal.performance.cadenceHitRate}% (${Math.round(cal.performance.cadenceHitRate * 7 / 100)}/7 days complete)`)
  lines.push('')

  // Attention vs Value
  if (cal.attentionAllocation.length > 0) {
    lines.push('*ATTENTION vs VALUE*')

    // Simple text table (monospace not reliable in Telegram Markdown, use aligned text)
    for (const alloc of cal.attentionAllocation) {
      const revenue = formatCurrency(alloc.revenueSignal)
      lines.push(
        `· ${alloc.project} — ${alloc.percentOfTotal}% time, ${revenue} rev, ${alloc.health}`
      )
      if (alloc.aiCommentary) {
        lines.push(`  _${alloc.aiCommentary}_`)
      }
    }
    lines.push('')
  }

  // Decisions Under Review
  if (cal.decisions.approachingReview.length > 0 || cal.decisions.antitheses.length > 0) {
    lines.push('*DECISIONS UNDER REVIEW*')

    for (const decision of cal.decisions.approachingReview) {
      lines.push(`→ ${decision.title} (confidence: ${decision.confidenceLevel}%, review in ${decision.daysUntilReview} days)`)

      // Find matching antithesis
      const antithesis = cal.decisions.antitheses.find(
        a => a.decisionTitle === decision.title
      )
      if (antithesis) {
        lines.push(`  ANTITHESIS: ${antithesis.antithesis}`)
        if (antithesis.killCriteriaStatus) {
          lines.push(`  _Kill criteria: ${antithesis.killCriteriaStatus}_`)
        }
      }
    }

    // Show antitheses for decisions not approaching review (if any)
    const reviewTitles = new Set(cal.decisions.approachingReview.map(d => d.title))
    const extraAntitheses = cal.decisions.antitheses.filter(a => !reviewTitles.has(a.decisionTitle))
    for (const a of extraAntitheses) {
      lines.push(`→ ${a.decisionTitle}`)
      lines.push(`  ANTITHESIS: ${a.antithesis}`)
      if (a.killCriteriaStatus) {
        lines.push(`  _Kill criteria: ${a.killCriteriaStatus}_`)
      }
    }

    lines.push('')
  }

  // Network Health
  lines.push('*NETWORK HEALTH*')
  lines.push(
    `Touched: ${cal.networkHealth.touchedThisWeek}/${cal.networkHealth.totalContacts} | ` +
    `Stale DMs: ${cal.networkHealth.staleDecisionMakers} | ` +
    `Intro rate: ${cal.networkHealth.warmIntroRate}%`
  )
  if (cal.networkHealth.topRelationshipMoves.length > 0) {
    lines.push('Next moves:')
    cal.networkHealth.topRelationshipMoves.forEach((move, i) => {
      lines.push(`  ${i + 1}. ${move}`)
    })
  }
  lines.push('')

  // Blind Spots
  if (cal.blindSpots.length > 0) {
    lines.push('*BLIND SPOTS*')
    for (const spot of cal.blindSpots) {
      lines.push(`⚠ ${spot}`)
    }
    lines.push('')
  }

  // Synthesis
  if (cal.synthesis) {
    lines.push('---')
    lines.push(`_${cal.synthesis}_`)
  }

  return lines.join('\n')
}
