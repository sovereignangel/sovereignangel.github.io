'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'

export default function NetworkDial() {
  const { log, updateField, saving, lastSaved } = useDailyLogContext()

  return (
    <div className="border-l border-rule h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-rule flex items-center justify-between">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Network Inputs
        </h3>
        <span className="font-mono text-[9px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* GN Component Summary */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-serif text-[10px] font-semibold text-burgundy uppercase">Network (GN)</span>
            <span className={`font-mono text-[12px] font-bold ${
              (log.rewardScore?.components?.gn ?? 0) >= 0.7 ? 'text-green-ink'
                : (log.rewardScore?.components?.gn ?? 0) >= 0.4 ? 'text-amber-ink'
                : 'text-red-ink'
            }`}>
              {log.rewardScore?.components?.gn !== undefined
                ? (log.rewardScore.components.gn * 100).toFixed(0)
                : '—'}
            </span>
          </div>
        </div>

        {/* Discovery Conversations */}
        <div>
          <label className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
            Discovery Conversations
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={log.discoveryConversationsCount || ''}
              onChange={e => updateField('discoveryConversationsCount', parseInt(e.target.value) || 0)}
              className="w-16 font-mono text-[12px] bg-cream border border-rule rounded-sm px-1.5 py-1 text-center focus:outline-none focus:border-burgundy"
              placeholder="0"
              min={0}
            />
            <span className="font-serif text-[9px] text-ink-muted">/ 2 target</span>
          </div>
        </div>

        {/* Warm Intros */}
        <div>
          <label className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
            Warm Intros
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-serif text-[8px] text-ink-muted uppercase block mb-0.5">Made</span>
              <input
                type="number"
                value={log.warmIntrosMade || ''}
                onChange={e => updateField('warmIntrosMade', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 text-center focus:outline-none focus:border-burgundy"
                placeholder="0"
                min={0}
              />
            </div>
            <div>
              <span className="font-serif text-[8px] text-ink-muted uppercase block mb-0.5">Received</span>
              <input
                type="number"
                value={log.warmIntrosReceived || ''}
                onChange={e => updateField('warmIntrosReceived', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 text-center focus:outline-none focus:border-burgundy"
                placeholder="0"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Meetings Booked */}
        <div>
          <label className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
            Meetings Booked
          </label>
          <input
            type="number"
            value={log.meetingsBooked || ''}
            onChange={e => updateField('meetingsBooked', parseInt(e.target.value) || 0)}
            className="w-16 font-mono text-[12px] bg-cream border border-rule rounded-sm px-1.5 py-1 text-center focus:outline-none focus:border-burgundy"
            placeholder="0"
            min={0}
          />
        </div>

        {/* Public Posts */}
        <div>
          <label className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
            Public Posts
          </label>
          <input
            type="number"
            value={log.publicPostsCount || ''}
            onChange={e => updateField('publicPostsCount', parseInt(e.target.value) || 0)}
            className="w-16 font-mono text-[12px] bg-cream border border-rule rounded-sm px-1.5 py-1 text-center focus:outline-none focus:border-burgundy"
            placeholder="0"
            min={0}
          />
        </div>

        {/* Inbound Inquiries */}
        <div>
          <label className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
            Inbound Inquiries
          </label>
          <input
            type="number"
            value={log.inboundInquiries || ''}
            onChange={e => updateField('inboundInquiries', parseInt(e.target.value) || 0)}
            className="w-16 font-mono text-[12px] bg-cream border border-rule rounded-sm px-1.5 py-1 text-center focus:outline-none focus:border-burgundy"
            placeholder="0"
            min={0}
          />
        </div>
      </div>
    </div>
  )
}
