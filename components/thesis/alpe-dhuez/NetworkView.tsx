'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getNetworkContacts,
  saveNetworkContact,
  updateNetworkContact,
  deleteNetworkContact,
} from '@/lib/firestore'
import { CONTACT_TIERS } from '@/lib/constants'
import type { NetworkContact, ContactTier, TrustStage } from '@/lib/types'
import { TRUST_STAGE_LABELS, TIER_LABELS, getSystemState, SYSTEM_STATE_COLORS } from '@/lib/types'

const EMPTY_FORM = {
  name: '',
  tier: 'decision_maker' as ContactTier,
  whatTheyControl: '',
  yourValueToThem: '',
  trustStage: 1 as TrustStage,
}

export default function NetworkView() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set(['decision_maker', 'connector', 'peer_operator']))
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) return
    loadContacts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadContacts = async () => {
    if (!user) return
    try {
      const data = await getNetworkContacts(user.uid)
      setContacts(data)
    } catch (err) {
      console.error('Failed to load contacts:', err)
      setContacts([])
    }
  }

  const toggleTier = (tier: string) => {
    const next = new Set(expandedTiers)
    if (next.has(tier)) next.delete(tier)
    else next.add(tier)
    setExpandedTiers(next)
  }

  const handleSave = async () => {
    if (!user || !form.name.trim()) return
    setSaving(true)
    if (editingId) {
      await updateNetworkContact(user.uid, editingId, {
        name: form.name,
        tier: form.tier,
        whatTheyControl: form.whatTheyControl,
        yourValueToThem: form.yourValueToThem,
        trustStage: form.trustStage,
      })
    } else {
      await saveNetworkContact(user.uid, {
        name: form.name,
        tier: form.tier,
        whatTheyControl: form.whatTheyControl,
        yourValueToThem: form.yourValueToThem,
        trustStage: form.trustStage,
        relationshipStrength: form.trustStage * 2 > 10 ? 10 : form.trustStage * 2,
        lastTouchDate: today,
        nextAction: '',
        warmIntrosGenerated: 0,
        isTop30: true,
        notes: '',
      })
    }
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowAddForm(false)
    setSaving(false)
    await loadContacts()
  }

  const handleEdit = (contact: NetworkContact) => {
    setForm({
      name: contact.name,
      tier: contact.tier,
      whatTheyControl: contact.whatTheyControl,
      yourValueToThem: contact.yourValueToThem,
      trustStage: contact.trustStage,
    })
    setEditingId(contact.id || null)
    setShowAddForm(true)
  }

  const handleDelete = async (contactId: string) => {
    if (!user) return
    await deleteNetworkContact(user.uid, contactId)
    await loadContacts()
  }

  // Summary calculations
  const totalContacts = contacts.length
  const avgStrength = totalContacts > 0
    ? contacts.reduce((sum, c) => sum + c.relationshipStrength, 0) / totalContacts
    : 0
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
  const touchedRecently = contacts.filter(c => c.lastTouchDate >= thirtyDaysAgoStr).length
  const touchedPct = totalContacts > 0 ? (touchedRecently / totalContacts) * 100 : 0

  // Group by tier
  const byTier: Record<string, NetworkContact[]> = {
    decision_maker: [],
    connector: [],
    peer_operator: [],
  }
  contacts.forEach(c => {
    if (byTier[c.tier]) byTier[c.tier].push(c)
  })

  return (
    <div className="space-y-3">
      {/* Summary Bar */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Top 30 Network
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="font-mono text-[11px] font-semibold text-ink">{totalContacts} / 30</p>
            <p className="font-serif text-[8px] italic uppercase text-ink-muted">Contacts</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[11px] font-semibold text-ink">{avgStrength.toFixed(1)} / 10</p>
            <p className="font-serif text-[8px] italic uppercase text-ink-muted">Avg Strength</p>
          </div>
          <div className="text-center">
            <p className={`font-mono text-[11px] font-semibold ${
              touchedPct >= 70 ? 'text-green-ink' : touchedPct >= 40 ? 'text-amber-ink' : 'text-red-ink'
            }`}>
              {touchedPct.toFixed(0)}%
            </p>
            <p className="font-serif text-[8px] italic uppercase text-ink-muted">Touched (30d)</p>
          </div>
        </div>
      </div>

      {/* Tier Sections */}
      {CONTACT_TIERS.map(({ value: tier, label: tierLabel, target }) => {
        const tierContacts = byTier[tier] || []
        const isExpanded = expandedTiers.has(tier)

        return (
          <div key={tier} className="bg-paper border border-rule rounded-sm">
            <button
              onClick={() => toggleTier(tier)}
              className="w-full flex items-center justify-between py-2 px-3 border-b border-rule"
            >
              <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                {tierLabel}
              </span>
              <span className="font-mono text-[9px] text-ink-muted">
                {tierContacts.length} / {target}
              </span>
            </button>

            {isExpanded && (
              <div className="p-2 space-y-1">
                {tierContacts.length === 0 ? (
                  <p className="font-serif text-[10px] italic text-ink-faint text-center py-2">
                    No contacts in this tier yet
                  </p>
                ) : (
                  tierContacts.map(contact => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      today={today}
                      onEdit={() => handleEdit(contact)}
                      onDelete={() => contact.id && handleDelete(contact.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add Contact */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            if (showAddForm) {
              setForm(EMPTY_FORM)
              setEditingId(null)
            }
          }}
          className={`w-full font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
            showAddForm
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
          }`}
        >
          {showAddForm ? (editingId ? 'Cancel Edit' : 'Cancel') : '+ Add Contact'}
        </button>

        {showAddForm && (
          <div className="mt-2 space-y-2">
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                placeholder="Contact name..."
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Tier</label>
              <select
                value={form.tier}
                onChange={(e) => setForm(prev => ({ ...prev, tier: e.target.value as ContactTier }))}
                className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
              >
                {CONTACT_TIERS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">What they control</label>
              <input
                type="text"
                value={form.whatTheyControl}
                onChange={(e) => setForm(prev => ({ ...prev, whatTheyControl: e.target.value }))}
                className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                placeholder="Budget, decisions, network..."
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Your value to them</label>
              <input
                type="text"
                value={form.yourValueToThem}
                onChange={(e) => setForm(prev => ({ ...prev, yourValueToThem: e.target.value }))}
                className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                placeholder="Insights, intros, skills..."
              />
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Initial trust stage</label>
              <select
                value={form.trustStage}
                onChange={(e) => setForm(prev => ({ ...prev, trustStage: parseInt(e.target.value) as TrustStage }))}
                className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
              >
                {([1, 2, 3, 4, 5, 6] as TrustStage[]).map(stage => (
                  <option key={stage} value={stage}>{stage} - {TRUST_STAGE_LABELS[stage]}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="w-full py-1.5 font-serif text-[9px] font-semibold uppercase tracking-[1px] text-paper bg-burgundy rounded-sm hover:bg-burgundy/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Contact' : 'Save Contact'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactCard({
  contact,
  today,
  onEdit,
  onDelete,
}: {
  contact: NetworkContact
  today: string
  onEdit: () => void
  onDelete: () => void
}) {
  const daysSince = contact.lastTouchDate
    ? Math.floor((new Date(today).getTime() - new Date(contact.lastTouchDate).getTime()) / 86400000)
    : null

  const daysSinceColor = daysSince === null ? 'text-ink-faint'
    : daysSince < 30 ? 'text-green-ink'
    : daysSince < 60 ? 'text-amber-ink'
    : 'text-red-ink'

  const strengthState = getSystemState(contact.relationshipStrength / 10)
  const strengthColors = SYSTEM_STATE_COLORS[strengthState]

  return (
    <div className="group border border-rule-light rounded-sm p-2 hover:border-rule transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-[11px] font-semibold text-ink truncate">
              {contact.name}
            </span>
            <span className={`font-mono text-[8px] shrink-0 ${daysSinceColor}`}>
              {daysSince !== null ? `${daysSince}d ago` : 'never'}
            </span>
          </div>

          {/* Relationship strength dots */}
          <div className="flex items-center gap-0.5 mb-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-sm ${
                  i < contact.relationshipStrength
                    ? strengthColors.text.replace('text-', 'bg-')
                    : 'bg-rule-light'
                }`}
              />
            ))}
            <span className={`font-mono text-[8px] ml-1 ${strengthColors.text}`}>
              {contact.relationshipStrength}
            </span>
          </div>

          {/* Trust stage */}
          <span className="font-serif text-[8px] italic text-ink-muted">
            {TRUST_STAGE_LABELS[contact.trustStage]}
          </span>

          {/* Next action */}
          {contact.nextAction && (
            <p className="font-mono text-[9px] text-ink-muted truncate mt-0.5">
              {contact.nextAction}
            </p>
          )}
        </div>

        {/* Edit/Delete */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="font-serif text-[8px] px-1 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-burgundy hover:text-burgundy transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="font-serif text-[8px] px-1 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-red-ink hover:text-red-ink transition-colors"
          >
            Del
          </button>
        </div>
      </div>
    </div>
  )
}
