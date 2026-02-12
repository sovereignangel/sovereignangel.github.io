'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { REVENUE_STREAM_TYPES } from '@/lib/constants'

export default function OutputDial() {
  const { log, updateField, saving, lastSaved, syncCalendar, calendarSyncing } = useDailyLogContext()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Execution
        </h3>
        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm transition-colors ${
          saving ? 'text-ink-muted' : lastSaved ? 'text-green-ink bg-green-ink/10' : 'text-ink-muted'
        }`}>
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-3">
        {/* Today's Focus */}
        <div className="border-b border-gold/20 pb-3">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-gold mb-2">
            Today&apos;s Focus
          </h4>
          <textarea
            value={(log as Record<string, unknown>).todayFocus as string || ''}
            onChange={(e) => updateField('todayFocus', e.target.value)}
            className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[32px] resize-y"
            placeholder="What gets done today?"
          />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">One Action</label>
              <input
                type="text"
                value={(log as Record<string, unknown>).todayOneAction as string || ''}
                onChange={(e) => updateField('todayOneAction', e.target.value)}
                className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
                placeholder="Ship by EOD"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Focus Target</label>
              <input
                type="number"
                value={log.focusHoursTarget || ''}
                onChange={(e) => updateField('focusHoursTarget', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
                step="0.5"
                placeholder="6"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Days Since</label>
              <input
                type="number"
                value={log.daysSinceLastOutput || ''}
                onChange={(e) => updateField('daysSinceLastOutput', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
              />
            </div>
          </div>
        </div>

        {/* Yesterday's Execution */}
        <div>
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-2">
            Yesterday&apos;s Execution
          </h4>
          <div className="mb-2">
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Yesterday&apos;s Outcome</label>
            <input
              type="text"
              value={(log as Record<string, unknown>).yesterdayOutcome as string || ''}
              onChange={(e) => updateField('yesterdayOutcome', e.target.value)}
              className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
              placeholder="What happened as a result of yesterday's action?"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Focus Hrs
                {log.calendarFocusHours != null && (
                  <span className="ml-0.5 font-mono text-[7px] text-navy bg-navy-bg px-0.5 rounded-sm">cal</span>
                )}
              </label>
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  value={log.focusHoursActual || ''}
                  onChange={(e) => updateField('focusHoursActual', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
                  step="0.5"
                />
                <button
                  onClick={syncCalendar}
                  disabled={calendarSyncing}
                  className="font-mono text-[9px] text-navy hover:text-navy-light shrink-0 px-0.5"
                  title="Sync from Calendar"
                >
                  {calendarSyncing ? '...' : '↻'}
                </button>
              </div>
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Rev Asks</label>
              <input
                type="number"
                value={log.revenueAsksCount || ''}
                onChange={(e) => updateField('revenueAsksCount', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Revenue ($)</label>
              <input
                type="number"
                value={log.revenueThisSession || ''}
                onChange={(e) => updateField('revenueThisSession', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Stream</label>
              <select
                value={log.revenueStreamType || 'one_time'}
                onChange={(e) => updateField('revenueStreamType', e.target.value)}
                className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1 py-1 focus:outline-none focus:border-navy"
              >
                {REVENUE_STREAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* What shipped */}
          <div className="mt-2">
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">What Shipped</label>
            <textarea
              value={log.whatShipped || ''}
              onChange={(e) => updateField('whatShipped', e.target.value)}
              className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[32px] resize-y"
              placeholder="What did you ship?"
            />
          </div>

          {/* Boolean toggles */}
          <div className="flex gap-2 flex-wrap mt-2">
            {[
              { field: 'publicIteration', label: 'Public?' },
              { field: 'feedbackLoopClosed', label: 'Feedback?' },
              { field: 'speedOverPerfection', label: 'Speed>Perf?' },
            ].map(({ field, label }) => (
              <div key={field} className="flex items-center gap-1">
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">{label}</label>
                <button
                  onClick={() => updateField(field, !(log as Record<string, unknown>)[field])}
                  className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                    (log as Record<string, unknown>)[field]
                      ? 'bg-navy text-paper border-navy'
                      : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                  }`}
                >
                  {(log as Record<string, unknown>)[field] ? 'Y' : 'N'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
