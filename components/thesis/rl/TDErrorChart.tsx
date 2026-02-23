'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import type { RLTransition } from '@/lib/types'

interface TDErrorChartProps {
  transitions: RLTransition[]
  height?: number
}

export default function TDErrorChart({ transitions, height = 160 }: TDErrorChartProps) {
  const data = transitions
    .filter(t => t.tdError !== null)
    .slice(-14) // Last 14 days
    .map(t => ({
      date: t.date.slice(5), // MM-DD
      tdError: t.tdError,
      reward: t.reward,
    }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[100px] text-[10px] text-ink-muted font-sans">
        Not enough data for TD errors yet. Need at least 2 days of transitions + value estimates.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 8, fill: '#9a928a', fontFamily: 'monospace' }}
          axisLine={{ stroke: '#d8d0c8' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 8, fill: '#9a928a', fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#faf8f4',
            border: '1px solid #d8d0c8',
            borderRadius: '2px',
            fontSize: '10px',
            fontFamily: 'monospace',
          }}
          formatter={(value: number) => [value.toFixed(2), '\u03B4 (TD Error)']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <ReferenceLine y={0} stroke="#d8d0c8" />
        <Bar dataKey="tdError" radius={[1, 1, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell
              key={idx}
              fill={
                (entry.tdError ?? 0) > 0.5 ? '#2d5f3f'
                : (entry.tdError ?? 0) > 0 ? '#2d5f3f80'
                : (entry.tdError ?? 0) > -0.5 ? '#8c2d2d80'
                : '#8c2d2d'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
