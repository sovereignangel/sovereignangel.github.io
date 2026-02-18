'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { getTop30Contacts, updateNetworkContact } from '@/lib/firestore'
import type { NetworkContact } from '@/lib/types'

export default function AlpeDial() {
  const { user } = useAuth()
  const { log, updateField, saving, lastSaved } = useDailyLogContext()
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [touchedToday, setTouchedToday] = useState<Set<string>>(new Set())

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) return
    getTop30Contacts(user.uid).then((data) => {
      setContacts(data)
      // Track which were already touched today
      const alreadyTouched = new Set<string>()
      data.forEach(c => {
        if (c.lastTouchDate === today && c.id) alreadyTouched.add(c.id)
      })
      setTouchedToday(alreadyTouched)
    })
  }, [user, today])

  const handleTouch = async (contact: NetworkContact) => {
    if (!user || !contact.id) return
    const newTouched = new Set(touchedToday)
    if (newTouched.has(contact.id)) {
      newTouched.delete(contact.id)
    } else {
      newTouched.add(contact.id)
      await updateNetworkContact(user.uid, contact.id, { lastTouchDate: today })
    }
    setTouchedToday(newTouched)
  }

  // Count touches this month
  const monthPrefix = today.slice(0, 7)
  const touchedThisMonth = contacts.filter(c =>
    c.lastTouchDate && c.lastTouchDate.startsWith(monthPrefix)
  ).length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Alpe d&apos;Huez
        </h3>
        <span className="font-mono text-[9px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-3">
        {/* Network Touch */}
        <div className="border-b border-rule-light pb-2.5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy">
              Network Touch
            </h4>
            <span className="font-mono text-[9px] text-ink-muted">
              {touchedThisMonth}/30 this month
            </span>
          </div>
          {contacts.length === 0 ? (
            <p className="font-serif text-[10px] italic text-ink-faint">
              Add contacts in Network view to track touches
            </p>
          ) : (
            <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
              {contacts.map((contact) => {
                const isTouched = contact.id ? touchedToday.has(contact.id) : false
                const daysSince = contact.lastTouchDate
                  ? Math.floor((Date.now() - new Date(contact.lastTouchDate).getTime()) / 86400000)
                  : null
                return (
                  <label
                    key={contact.id}
                    className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-cream rounded-sm px-1"
                  >
                    <input
                      type="checkbox"
                      checked={isTouched}
                      onChange={() => handleTouch(contact)}
                      className="w-3 h-3 rounded-sm accent-burgundy"
                    />
                    <span className="font-mono text-[10px] text-ink flex-1 truncate">
                      {contact.name}
                    </span>
                    <span className={`font-mono text-[8px] shrink-0 ${
                      daysSince === null ? 'text-ink-faint'
                        : daysSince < 30 ? 'text-green-ink'
                        : daysSince < 60 ? 'text-amber-ink'
                        : 'text-red-ink'
                    }`}>
                      {daysSince !== null ? `${daysSince}d` : '--'}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Metrics */}
        <div>
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-2">
            Quick Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Warm Intros Received
              </label>
              <input
                type="number"
                min={0}
                value={log.warmIntrosReceived || ''}
                onChange={(e) => updateField('warmIntrosReceived', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Warm Intros Made
              </label>
              <input
                type="number"
                min={0}
                value={log.warmIntrosMade || ''}
                onChange={(e) => updateField('warmIntrosMade', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Meetings Booked
              </label>
              <input
                type="number"
                min={0}
                value={log.meetingsBooked || ''}
                onChange={(e) => updateField('meetingsBooked', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Inbound Inquiries
              </label>
              <input
                type="number"
                min={0}
                value={log.inboundInquiries || ''}
                onChange={(e) => updateField('inboundInquiries', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
