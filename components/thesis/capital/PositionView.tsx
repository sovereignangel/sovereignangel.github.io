'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFinancialHistory } from '@/lib/firestore'
import { currency } from '@/lib/formatters'
import type { CapitalPosition, FinancialSnapshot } from '@/lib/types'
import { NET_WORTH_TARGET } from '@/lib/types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

interface Props {
  position: CapitalPosition | null
}

const ASSET_COLORS = [
  { key: 'cashSavings', label: 'Cash', color: '#2d5f3f' },
  { key: 'investments', label: 'Investments', color: '#1e3a5f' },
  { key: 'crypto', label: 'Crypto', color: '#8a6d2f' },
]

export default function PositionView({ position }: Props) {
  const { user } = useAuth()
  const [history, setHistory] = useState<FinancialSnapshot[]>([])

  useEffect(() => {
    if (!user) return
    getFinancialHistory(user.uid, 12).then(setHistory)
  }, [user])

  if (!position) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          Enter your financial position in the sidebar to begin.
        </p>
      </div>
    )
  }

  const netWorthColor = position.netWorth >= 0 ? 'text-green-ink' : 'text-red-ink'
  const savingsRate = position.monthlyIncome > 0
    ? ((position.monthlyIncome - position.monthlyExpenses) / position.monthlyIncome) * 100
    : 0
  const debtToAssetRatio = position.totalAssets > 0
    ? (position.totalDebt / position.totalAssets) * 100
    : position.totalDebt > 0 ? 999 : 0
  const freeCashFlow = position.monthlyIncome - position.monthlyExpenses - position.totalMinimumPayments
  const pctToTarget = (position.netWorth / NET_WORTH_TARGET) * 100

  // Asset allocation data
  const assetData = ASSET_COLORS
    .map(a => ({ name: a.label, value: (position as unknown as Record<string, number>)[a.key] || 0, color: a.color }))
    .filter(a => a.value > 0)
  const totalAssetsForBar = assetData.reduce((s, a) => s + a.value, 0)

  // Cash flow waterfall
  const waterfallData = [
    { name: 'Income', value: position.monthlyIncome, fill: '#2d5f3f' },
    { name: 'Expenses', value: -position.monthlyExpenses, fill: '#8c2d2d' },
    { name: 'Debt Mins', value: -position.totalMinimumPayments, fill: '#8a6d2f' },
    { name: 'Interest', value: -position.monthlyInterestCost, fill: '#7c2d2d' },
    { name: 'Free Cash', value: freeCashFlow, fill: freeCashFlow >= 0 ? '#2d5f3f' : '#8c2d2d' },
  ]

  // Net worth history chart data
  const historyData = history.map(h => ({
    month: h.month.slice(5),
    netWorth: h.netWorth,
  }))

  return (
    <div className="space-y-3 p-1">
      {/* Net Worth Hero */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Net Worth
          </h3>
          <span className="font-mono text-[9px] text-ink-muted">
            Target: {currency(NET_WORTH_TARGET)}
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className={`font-mono text-[28px] font-bold ${netWorthColor}`}>
            {position.netWorth < 0 ? '-' : ''}{currency(Math.abs(position.netWorth))}
          </span>
          <span className="font-mono text-[10px] text-ink-muted">
            {pctToTarget > 0 ? pctToTarget.toFixed(2) : '0'}% to $10M
          </span>
        </div>

        {/* Asset allocation bar */}
        {totalAssetsForBar > 0 && (
          <div className="mt-3">
            <p className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted mb-1">
              Asset Allocation
            </p>
            <div className="h-3 flex rounded-sm overflow-hidden border border-rule">
              {assetData.map((a) => (
                <div
                  key={a.name}
                  style={{ width: `${(a.value / totalAssetsForBar) * 100}%`, backgroundColor: a.color }}
                  className="h-full"
                  title={`${a.name}: ${currency(a.value)}`}
                />
              ))}
            </div>
            <div className="flex gap-3 mt-1">
              {assetData.map((a) => (
                <span key={a.name} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: a.color }} />
                  <span className="font-mono text-[8px] text-ink-muted">
                    {a.name} {currency(a.value)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          label="Runway"
          value={`${position.runwayMonths.toFixed(0)} mo`}
          color={position.runwayMonths >= 12 ? 'text-green-ink' : position.runwayMonths >= 6 ? 'text-amber-ink' : 'text-red-ink'}
        />
        <MetricCard
          label="Monthly Burn"
          value={currency(position.monthlyExpenses)}
          color="text-ink"
        />
        <MetricCard
          label="Debt:Asset"
          value={debtToAssetRatio > 100 ? `${debtToAssetRatio.toFixed(0)}%` : `${debtToAssetRatio.toFixed(0)}%`}
          color={debtToAssetRatio > 100 ? 'text-red-ink' : debtToAssetRatio > 50 ? 'text-amber-ink' : 'text-green-ink'}
        />
        <MetricCard
          label="Monthly Interest"
          value={currency(position.monthlyInterestCost)}
          color={position.monthlyInterestCost > 500 ? 'text-red-ink' : position.monthlyInterestCost > 100 ? 'text-amber-ink' : 'text-green-ink'}
        />
        <MetricCard
          label="Free Cash Flow"
          value={`${freeCashFlow < 0 ? '-' : ''}${currency(Math.abs(freeCashFlow))}`}
          color={freeCashFlow >= 0 ? 'text-green-ink' : 'text-red-ink'}
        />
        <MetricCard
          label="Savings Rate"
          value={`${savingsRate.toFixed(0)}%`}
          color={savingsRate >= 30 ? 'text-green-ink' : savingsRate >= 10 ? 'text-amber-ink' : 'text-red-ink'}
        />
      </div>

      {/* Cash Flow Waterfall */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Monthly Cash Flow
          </h3>
        </div>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9a928a' }} />
              <YAxis tick={{ fontSize: 9, fill: '#9a928a' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: '2px', fontSize: '11px' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Net Worth History */}
      {historyData.length > 1 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="mb-2 pb-1.5 border-b-2 border-rule">
            <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Net Worth Trajectory
            </h3>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9a928a' }} />
                <YAxis tick={{ fontSize: 9, fill: '#9a928a' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: '2px', fontSize: '11px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Worth']}
                />
                <Area type="monotone" dataKey="netWorth" stroke="#1e3a5f" fill="url(#nwGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-rule rounded-sm p-2">
      <p className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted mb-0.5">
        {label}
      </p>
      <p className={`font-mono text-[14px] font-bold ${color}`}>
        {value}
      </p>
    </div>
  )
}
