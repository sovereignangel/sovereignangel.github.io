'use client'

import { useState } from 'react'
import { useContacts } from '@/hooks/useContacts'
import { CONTACT_TIERS } from '@/lib/constants'
import { TRUST_STAGE_LABELS, TIER_LABELS } from '@/lib/types'
import type { UnifiedContact, ContactTier, TrustStage } from '@/lib/types'

const WARMTH_COLORS: Record<string, string> = {
  hot:  'text-green-ink bg-green-bg border-green-ink/20',
  warm: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  cool: 'text-ink-muted bg-paper border-rule',
  cold: 'text-red-ink bg-red-ink/5 border-red-ink/20',
}

const WARMTH_DOT: Record<string, string> = {
  hot:  'bg-green-ink',
  warm: 'bg-amber-ink',
  cool: 'bg-ink-faint',
  cold: 'bg-red-ink',
}

const WARMTH_ORDER = ['hot', 'warm', 'cool', 'cold'] as const

const EMPTY_FORM = {
  canonicalName: '',
  tier: 'acquaintance' as ContactTier | 'acquaintance',
  tags: '' as string,    // comma-separated input
  company: '',
  role: '',
  phone: '',
  email: '',
  whatTheyControl: '',
  yourValueToThem: '',
  notes: '',
  trustStage: 1 as TrustStage,
}

export default function CRMView() {
  const {
    contacts,
    loading,
    weeklyNewCount,
    weeklyGoal,
    dueContacts,
    allTags,
    addContact,
    updateContact,
    removeContact,
  } = useContacts()

  const [warmthFilter, setWarmthFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const goalPct = Math.min((weeklyNewCount / weeklyGoal) * 100, 100)

  const filtered = contacts.filter(c => {
    if (warmthFilter !== 'all' && c.warmth !== warmthFilter) return false
    if (tagFilter !== 'all' && !(c.tags ?? []).includes(tagFilter)) return false
    return true
  })

  const handleEdit = (c: UnifiedContact) => {
    setForm({
      canonicalName: c.canonicalName,
      tier: c.tier,
      tags: (c.tags ?? []).join(', '),
      company: c.company ?? '',
      role: c.role ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      whatTheyControl: c.whatTheyControl ?? '',
      yourValueToThem: c.yourValueToThem ?? '',
      notes: c.notes ?? '',
      trustStage: c.trustStage,
    })
    setEditingId(c.id ?? null)
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleSave = async () => {
    if (!form.canonicalName.trim()) return
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const normalized = form.canonicalName.trim().toLowerCase()
    const payload: Partial<UnifiedContact> = {
      canonicalName: form.canonicalName.trim(),
      normalizedName: normalized,
      tier: form.tier,
      tags,
      company: form.company || undefined,
      role: form.role || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      whatTheyControl: form.whatTheyControl,
      yourValueToThem: form.yourValueToThem,
      notes: form.notes || undefined,
      trustStage: form.trustStage,
    }
    if (editingId) {
      await updateContact(editingId, payload)
    } else {
      await addContact({
        ...payload,
        aliases: [],
        connectedTo: [],
        warmIntrosGenerated: 0,
        touchCount: 0,
        lastTouchDate: new Date().toISOString().split('T')[0],
        interactions: [],
        interactionCount: 0,
        topics: [],
        painPoints: [],
        thesisPillars: [],
        nextAction: '',
        relationshipStrength: form.trustStage * 2 > 10 ? 10 : form.trustStage * 2,
        isTop30: false,
        needsReview: false,
        warmth: 'hot',
      } as Omit<UnifiedContact, 'id' | 'createdAt' | 'updatedAt'>)
    }
    handleCancel()
    setSaving(false)
  }

  return (
    <div className="space-y-3">

      {/* Weekly Goal */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Weekly Goal
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-serif text-[11px] text-ink-muted">New contacts this week</span>
          <span className="font-mono text-[11px] font-semibold text-ink">
            {weeklyNewCount} / {weeklyGoal}
          </span>
        </div>
        <div className="w-full h-1.5 bg-rule-light rounded-sm overflow-hidden">
          <div
            className="h-full bg-burgundy rounded-sm transition-all duration-300"
            style={{ width: `${goalPct}%` }}
          />
        </div>
        {weeklyNewCount >= weeklyGoal && (
          <p className="font-serif text-[9px] italic text-green-ink mt-1">Goal reached this week</p>
        )}
      </div>

      {/* Reach Out Queue */}
      {dueContacts.length > 0 && (
        <div className="bg-paper border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Reach Out ({dueContacts.length})
          </div>
          <div className="space-y-1">
            {dueContacts.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-2 py-1 border-b border-rule-light last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${WARMTH_COLORS[c.warmth ?? 'cold']}`}>
                    {c.warmth}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-ink truncate">{c.canonicalName}</span>
                  {c.company && (
                    <span className="font-serif text-[9px] italic text-ink-muted truncate">{c.role ? `${c.role} · ${c.company}` : c.company}</span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {(c.tags ?? []).slice(0, 2).map(t => (
                    <span key={t} className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border border-rule text-ink-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Contacts */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            All Contacts ({contacts.length})
          </h4>
          <button
            onClick={() => { setShowAddForm(!showAddForm); if (showAddForm) handleCancel() }}
            className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              showAddForm
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {showAddForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-1.5 mb-2">
          <div className="flex flex-wrap gap-1">
            {(['all', ...WARMTH_ORDER] as const).map(w => (
              <button
                key={w}
                onClick={() => setWarmthFilter(w)}
                className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                  warmthFilter === w
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                }`}
              >
                {w === 'all' ? 'All' : w}
                {w !== 'all' && (
                  <span className={`inline-block w-1.5 h-1.5 rounded-sm ml-1 ${WARMTH_DOT[w]}`} />
                )}
              </button>
            ))}
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setTagFilter('all')}
                className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border transition-colors ${
                  tagFilter === 'all'
                    ? 'bg-ink text-paper border-ink'
                    : 'text-ink-muted border-rule hover:border-ink-faint'
                }`}
              >
                All tags
              </button>
              {allTags.map(t => (
                <button
                  key={t}
                  onClick={() => setTagFilter(t === tagFilter ? 'all' : t)}
                  className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border transition-colors ${
                    tagFilter === t
                      ? 'bg-burgundy text-paper border-burgundy'
                      : 'text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add / Edit Form */}
        {showAddForm && (
          <div className="mb-3 p-2 bg-cream border border-rule rounded-sm space-y-2">
            <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              {editingId ? 'Edit Contact' : 'New Contact'}
            </p>
            {[
              { key: 'canonicalName', label: 'Name', placeholder: 'Full name' },
              { key: 'company', label: 'Company', placeholder: 'Firm or org' },
              { key: 'role', label: 'Role', placeholder: 'Title or function' },
              { key: 'phone', label: 'Phone', placeholder: '+1 555...' },
              { key: 'email', label: 'Email', placeholder: 'email@...' },
              { key: 'tags', label: 'Tags', placeholder: 'professor, researcher, hf-operator' },
              { key: 'whatTheyControl', label: 'What they control', placeholder: 'Capital, decisions, network...' },
              { key: 'yourValueToThem', label: 'Your value to them', placeholder: 'Insights, intros, skills...' },
              { key: 'notes', label: 'Notes', placeholder: 'Context...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">{label}</label>
                <input
                  type="text"
                  value={form[key as keyof typeof EMPTY_FORM] as string}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full font-sans text-[11px] bg-paper border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Tier</label>
                <select
                  value={form.tier}
                  onChange={e => setForm(prev => ({ ...prev, tier: e.target.value as ContactTier }))}
                  className="w-full font-sans text-[10px] bg-paper border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                >
                  {[...CONTACT_TIERS, { value: 'acquaintance', label: 'Acquaintance' }].map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Trust stage</label>
                <select
                  value={form.trustStage}
                  onChange={e => setForm(prev => ({ ...prev, trustStage: parseInt(e.target.value) as TrustStage }))}
                  className="w-full font-sans text-[10px] bg-paper border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                >
                  {([1, 2, 3, 4, 5, 6] as TrustStage[]).map(s => (
                    <option key={s} value={s}>{s} — {TRUST_STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.canonicalName.trim()}
              className="w-full py-1.5 font-serif text-[9px] font-semibold uppercase tracking-[1px] text-paper bg-burgundy rounded-sm hover:bg-burgundy/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update' : 'Save Contact'}
            </button>
          </div>
        )}

        {/* Contact list */}
        {loading ? (
          <p className="font-serif text-[10px] italic text-ink-faint text-center py-4">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="font-serif text-[10px] italic text-ink-faint text-center py-4">
            {contacts.length === 0 ? 'No contacts yet — add your first one above' : 'No contacts match this filter'}
          </p>
        ) : (
          <div className="space-y-1">
            {filtered.map(c => (
              <ContactRow
                key={c.id}
                contact={c}
                onEdit={() => handleEdit(c)}
                onDelete={() => c.id && removeContact(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContactRow({
  contact: c,
  onEdit,
  onDelete,
}: {
  contact: UnifiedContact
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group flex items-start justify-between gap-2 py-1.5 border-b border-rule-light last:border-0">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        {/* Warmth dot */}
        <span className={`mt-1 shrink-0 w-2 h-2 rounded-sm ${WARMTH_DOT[c.warmth ?? 'cold']}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-semibold text-ink">{c.canonicalName}</span>
            {c.company && (
              <span className="font-serif text-[9px] italic text-ink-muted">
                {c.role ? `${c.role} · ${c.company}` : c.company}
              </span>
            )}
            <span className="font-serif text-[8px] italic text-ink-faint">
              {TIER_LABELS[c.tier as ContactTier] ?? c.tier}
            </span>
          </div>
          {(c.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(c.tags ?? []).map(t => (
                <span key={t} className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border border-rule text-ink-muted">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

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
  )
}
