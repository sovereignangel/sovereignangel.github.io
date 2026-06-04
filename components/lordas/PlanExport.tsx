'use client'

import { useState } from 'react'
import type { SummerPlan } from '@/lib/types'
import { computePlanStats } from '@/lib/adventure-scheming'

interface PlanExportProps {
  plan: SummerPlan
  votes: { right: number; maybe: number; total: number }
}

export function PlanExport({ plan, votes }: PlanExportProps) {
  const [copied, setCopied] = useState(false)
  const stats = computePlanStats(plan)

  const generateText = () => {
    return `
SUMMER PLAN 2026
================

Route: ${plan.phases.map((p) => p.name).join(' → ')}

Duration: ${plan.dateRange.start} to ${plan.dateRange.end}
Budget: $${stats.budget.toLocaleString()}

Timeline:
${plan.phases
  .map((p) => {
    const start = new Date(p.startDate)
    const end = new Date(p.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return `  ${p.name}: ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${days} days)`
  })
  .join('\n')}

Stats:
  Kiting: ${Math.round(stats.kitingHours)} hours
  Cycling: ${Math.round(stats.cyclingMiles)} miles
  Cities: ${Math.round(stats.citiesCount)}
  Friends: ${Math.round(stats.friendsCount)}

Voting Score:
  Loved: ${votes.right} swipes
  Maybe: ${votes.maybe} swipes
  Total votes: ${votes.total}

Generated via Adventure Scheming
    `.trim()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const text = generateText()
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', `summer-plan-${plan.year}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={handleCopy}
        style={{
          flex: 1,
          padding: '10px',
          background: '#b85c38',
          color: '#faf7f2',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        {copied ? '✓ Copied' : 'Copy Plan'}
      </button>
      <button
        onClick={handleDownload}
        style={{
          flex: 1,
          padding: '10px',
          background: 'transparent',
          color: '#8a7e72',
          border: '1px solid #d8cfc4',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        Download
      </button>
    </div>
  )
}
