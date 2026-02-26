'use client'

import type { CorporateMetrics as CorporateMetricsType } from '@/lib/types'

interface Props {
  metrics: CorporateMetricsType
}

function metricColor(value: number | null, good: [number, (v: number) => boolean], warn: [number, (v: number) => boolean]): string {
  if (value === null) return 'text-ink-muted'
  if (good[1](value)) return 'text-green-ink'
  if (warn[1](value)) return 'text-amber-ink'
  return 'text-red-ink'
}

function formatRatio(value: number | null, suffix = 'x'): string {
  if (value === null) return 'N/A'
  return `${value.toFixed(2)}${suffix}`
}

function formatPct(value: number | null): string {
  if (value === null) return 'N/A'
  return `${value.toFixed(1)}%`
}

export default function CorporateMetrics({ metrics }: Props) {
  const items = [
    {
      label: 'D/I Ratio',
      value: formatRatio(metrics.debtToIncomeRatio),
      color: metricColor(metrics.debtToIncomeRatio, [0.36, v => v < 0.36], [0.50, v => v < 0.50]),
      tooltip: 'Debt / Annual Income',
    },
    {
      label: 'DSCR',
      value: formatRatio(metrics.debtServiceCoverage),
      color: metricColor(metrics.debtServiceCoverage, [1.5, v => v > 1.5], [1.0, v => v > 1.0]),
      tooltip: 'Income / Debt Payments',
    },
    {
      label: 'Op. Margin',
      value: formatPct(metrics.operatingMargin),
      color: metricColor(metrics.operatingMargin, [20, v => v > 20], [0, v => v > 0]),
      tooltip: 'Free Cash / Income',
    },
    {
      label: 'Current Ratio',
      value: formatRatio(metrics.currentRatio),
      color: metricColor(metrics.currentRatio, [6, v => v > 6], [3, v => v > 3]),
      tooltip: 'Liquid Assets / Expenses',
    },
    {
      label: 'Leverage',
      value: formatRatio(metrics.leverageRatio),
      color: metricColor(metrics.leverageRatio, [0.5, v => v < 0.5], [1.0, v => v < 1.0]),
      tooltip: 'Debt / Assets',
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {items.map(item => (
        <div
          key={item.label}
          className="bg-cream/80 border border-rule rounded-sm px-2 py-1.5 text-center"
          title={item.tooltip}
        >
          <p className="font-mono text-[7px] text-ink-muted uppercase tracking-wide">{item.label}</p>
          <p className={`font-mono text-[13px] font-bold ${item.color} leading-tight`}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}
