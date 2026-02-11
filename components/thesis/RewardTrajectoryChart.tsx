'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartDataPoint {
  date: string
  score: number | null
}

export default function RewardTrajectoryChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="rewardGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: '#9a928a' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fontSize: 9, fill: '#9a928a' }}
          axisLine={false}
          tickLine={false}
          width={20}
        />
        <Tooltip
          contentStyle={{
            background: '#faf8f4',
            border: '1px solid #d8d0c8',
            borderRadius: '2px',
            fontSize: '11px',
          }}
          formatter={(value: number) => [value?.toFixed(1) ?? '—', 'g*']}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#1e3a5f"
          strokeWidth={2}
          fill="url(#rewardGradient)"
          connectNulls
          dot={{ r: 3, fill: '#1e3a5f', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
