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

        {/* Daily Planning */}
        <div className="border-b border-rule pb-3">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
            Daily Planning
          </h4>
          <div className="space-y-2">
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                What Gets Done Today?
              </label>
              <textarea
                value={(log as Record<string, unknown>).todayFocus as string || ''}
                onChange={(e) => updateField('todayFocus', e.target.value)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy min-h-[32px] resize-y"
                placeholder="Morning intention — what must happen today"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                One Action (ship by EOD)
              </label>
              <input
                type="text"
                value={(log as Record<string, unknown>).todayOneAction as string || ''}
                onChange={(e) => updateField('todayOneAction', e.target.value)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
                placeholder="The single most important deliverable"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                  Focus Target (hrs)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={log.focusHoursTarget || ''}
                  onChange={(e) => updateField('focusHoursTarget', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
                  placeholder="6"
                />
              </div>
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                  Focus Actual (hrs)
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
            </div>
          </div>
        </div>

        {/* EOD Record */}
        <div className="border-b border-rule pb-3">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
            End of Day
          </h4>
          <div className="space-y-2">
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                What Shipped
              </label>
              <textarea
                value={log.whatShipped || ''}
                onChange={(e) => updateField('whatShipped', e.target.value)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy min-h-[40px] resize-y"
                placeholder="Concrete output delivered today"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Yesterday&apos;s Outcome
              </label>
              <textarea
                value={(log as Record<string, unknown>).yesterdayOutcome as string || ''}
                onChange={(e) => updateField('yesterdayOutcome', e.target.value)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy min-h-[28px] resize-y"
                placeholder="What happened as a result of yesterday's action?"
              />
            </div>
          </div>
        </div>

        {/* Execution Quality */}
        <div>
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
            Execution Quality
          </h4>
          <div className="space-y-1.5">
            {[
              { field: 'publicIteration', label: 'Shipped publicly', desc: 'Shared work where others can see it' },
              { field: 'feedbackLoopClosed', label: 'Closed feedback loop', desc: 'Got real user/customer reaction' },
              { field: 'speedOverPerfection', label: 'Speed over polish', desc: 'Prioritised shipping over perfecting' },
            ].map(({ field, label, desc }) => (
              <button
                key={field}
                onClick={() => updateField(field, !(log as Record<string, unknown>)[field])}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm border transition-colors text-left ${
                  (log as Record<string, unknown>)[field]
                    ? 'bg-burgundy/10 border-burgundy/30'
                    : 'bg-transparent border-rule hover:border-ink-faint'
                }`}
              >
                <span className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center ${
                  (log as Record<string, unknown>)[field]
                    ? 'bg-burgundy border-burgundy'
                    : 'bg-transparent border-rule'
                }`}>
                  {!!(log as Record<string, unknown>)[field] && (
                    <svg className="w-2 h-2 text-paper" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                <div>
                  <span className="font-mono text-[10px] text-ink block">{label}</span>
                  <span className="font-mono text-[8px] text-ink-muted">{desc}</span>
                </div>
              </button>
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
