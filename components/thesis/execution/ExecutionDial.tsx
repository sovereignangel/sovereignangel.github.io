'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { REVENUE_STREAM_TYPES } from '@/lib/constants'

export default function ExecutionDial() {
  const { log, updateField, saving, lastSaved } = useDailyLogContext()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Execution Capture
        </h3>
        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm transition-colors ${
          saving ? 'text-ink-muted' : lastSaved ? 'text-green-ink bg-green-ink/10' : 'text-ink-muted'
        }`}>
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="overflow-y-auto space-y-3 p-2 bg-paper border border-rule rounded-sm flex-1">
        {/* Ships & Revenue */}
        <div className="border-b border-rule pb-3">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
            Ships &amp; Revenue
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Ships Today
              </label>
              <input
                type="number"
                min={0}
                value={(log as Record<string, unknown>).shipsCount as number || 0}
                onChange={(e) => updateField('shipsCount', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Revenue Asks
              </label>
              <input
                type="number"
                min={0}
                value={log.revenueAsksCount || 0}
                onChange={(e) => updateField('revenueAsksCount', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Posts Today
              </label>
              <input
                type="number"
                min={0}
                value={(log as Record<string, unknown>).publicPostsCount as number || 0}
                onChange={(e) => updateField('publicPostsCount', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Revenue $
              </label>
              <div className="relative">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-muted">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={log.revenueThisSession || 0}
                  onChange={(e) => updateField('revenueThisSession', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm pl-4 pr-2 py-1 text-ink focus:outline-none focus:border-burgundy"
                />
              </div>
            </div>
          </div>
          <div className="mt-2">
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
              Stream Type
            </label>
            <select
              value={log.revenueStreamType || 'one_time'}
              onChange={(e) => updateField('revenueStreamType', e.target.value)}
              className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
            >
              {REVENUE_STREAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Focus */}
        <div className="border-b border-rule pb-3">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
            Focus
          </h4>
          <div>
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
              Focus Hours
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={log.focusHoursActual || 0}
              onChange={(e) => updateField('focusHoursActual', parseFloat(e.target.value) || 0)}
              className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
            />
          </div>
          <div className="mt-2">
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
              What Shipped
            </label>
            <textarea
              value={log.whatShipped || ''}
              onChange={(e) => updateField('whatShipped', e.target.value)}
              className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy min-h-[48px] resize-y"
              placeholder="What did you ship today?"
            />
          </div>
        </div>

        {/* Toggles */}
        <div>
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
            Toggles
          </h4>
          <div className="flex gap-2 flex-wrap">
            {[
              { field: 'publicIteration', label: 'Public?' },
              { field: 'feedbackLoopClosed', label: 'Feedback?' },
              { field: 'speedOverPerfection', label: 'Speed>Perf?' },
            ].map(({ field, label }) => (
              <div key={field} className="flex items-center gap-1">
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">
                  {label}
                </label>
                <button
                  onClick={() => updateField(field, !(log as Record<string, unknown>)[field])}
                  className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                    (log as Record<string, unknown>)[field]
                      ? 'bg-burgundy text-paper border-burgundy'
                      : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {(log as Record<string, unknown>)[field] ? 'Y' : 'N'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save indicator footer */}
      <div className="mt-1 text-center">
        <span className={`font-mono text-[9px] ${saving ? 'text-ink-muted' : lastSaved ? 'text-green-ink' : 'text-ink-faint'}`}>
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : 'No changes yet'}
        </span>
      </div>
    </div>
  )
}
