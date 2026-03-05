'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useAlphaExperiments } from '@/hooks/useAlphaExperiments'

export default function AlphaDial({ signalCount, thesisCount }: { signalCount: number; thesisCount: number }) {
  const { user } = useAuth()
  const { designing, live, completed, won, overdue, totalPnl, hitRate } = useAlphaExperiments(user?.uid)

  // Recent log entries across all live experiments
  const recentLogs = live
    .flatMap(e => e.logEntries.map(l => ({ ...l, expTitle: e.title })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const signalColor = (s?: string) => {
    switch (s) {
      case 'bullish': return 'text-green-ink'
      case 'bearish': return 'text-red-ink'
      default: return 'text-ink-muted'
    }
  }

  return (
    <div className="border-l border-rule h-full">
      <div className="px-3 py-2 border-b border-rule">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Alpha Status
        </h3>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto">
        {/* Pipeline Summary */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <span className="font-sans text-[10px] text-ink-muted block mb-1">Pipeline</span>
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Signals</span>
              <span className="font-mono text-[10px] font-semibold text-ink">{signalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Theses</span>
              <span className="font-mono text-[10px] font-semibold text-ink">{thesisCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Designing</span>
              <span className="font-mono text-[10px] font-semibold text-ink">{designing.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Live</span>
              <span className="font-mono text-[10px] font-semibold text-ink">{live.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Completed</span>
              <span className="font-mono text-[10px] font-semibold text-ink">{completed.length}</span>
            </div>
          </div>
        </div>

        {/* Hit Rate */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <span className="font-sans text-[10px] text-ink-muted block mb-1">Performance</span>
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-sans text-[9px] text-ink-muted">Hit Rate</span>
            <span className={`font-mono text-[12px] font-bold ${
              hitRate >= 0.5 ? 'text-green-ink' : hitRate > 0 ? 'text-amber-ink' : 'text-ink-muted'
            }`}>
              {completed.length > 0 ? `${Math.round(hitRate * 100)}%` : '\u2014'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[9px] text-ink-muted">Total P&L</span>
            <span className={`font-mono text-[12px] font-bold ${
              totalPnl > 0 ? 'text-green-ink' : totalPnl < 0 ? 'text-red-ink' : 'text-ink-muted'
            }`}>
              {completed.length > 0
                ? `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`
                : '\u2014'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="font-sans text-[9px] text-ink-muted">Won / Lost</span>
            <span className="font-mono text-[10px] text-ink">
              {won.length}W / {completed.filter(e => e.status === 'lost').length}L / {completed.filter(e => e.status === 'killed').length}K
            </span>
          </div>
        </div>

        {/* Overdue Alert */}
        {overdue.length > 0 && (
          <div className="p-2 bg-amber-bg border border-amber-ink/20 rounded-sm">
            <span className="font-sans text-[10px] text-amber-ink font-semibold block mb-0.5">
              {overdue.length} Overdue
            </span>
            {overdue.map(exp => (
              <div key={exp.id} className="font-sans text-[9px] text-amber-ink">
                {exp.title}
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <div className="p-2 bg-white border border-rule rounded-sm">
            <span className="font-sans text-[10px] text-ink-muted block mb-1">Recent Activity</span>
            <div className="space-y-1">
              {recentLogs.map(entry => (
                <div key={entry.id}>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[8px] text-ink-muted">{entry.date}</span>
                    <span className={`font-mono text-[8px] ${signalColor(entry.signal)}`}>
                      {entry.signal === 'bullish' ? '▲' : entry.signal === 'bearish' ? '▼' : '—'}
                    </span>
                  </div>
                  <div className="font-sans text-[9px] text-ink truncate">{entry.note}</div>
                  <div className="font-sans text-[8px] text-ink-muted">{entry.expTitle}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
