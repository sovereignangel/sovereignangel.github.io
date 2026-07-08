'use client'

import { useState } from 'react'
import type { LordasGoalsData, LordasNorthStar, LordasGoalOwner, LordasPerson } from '@/lib/types'
import { GOAL_OWNERS } from '@/lib/lordas-goals'
import { ownerLabel, OWNER_COLORS } from './goals-theme'

const PAPER = '#faf7f2'
const INK = '#2a2420'
const MUTED = '#8a7e72'
const RULE = '#d8cfc4'

interface NorthStarCardProps {
  northStars: LordasGoalsData['northStars']
  person: LordasPerson
  onSave: (payload: { owner: LordasGoalOwner; statement: string; doneLooksLike: string; targetDate: string }) => Promise<void>
}

export function NorthStarCard({ northStars, person, onSave }: NorthStarCardProps) {
  return (
    <section>
      <SectionHeading title="North Star" subtitle="Identity statements — who each of us is becoming" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {GOAL_OWNERS.map((o) => (
          <CharterCard
            key={o}
            star={northStars[o]}
            owner={o}
            editable={o === person || o === 'relationship'}
            onSave={onSave}
          />
        ))}
      </div>
    </section>
  )
}

function CharterCard({
  star,
  owner,
  editable,
  onSave,
}: {
  star?: LordasNorthStar
  owner: LordasGoalOwner
  editable: boolean
  onSave: NorthStarCardProps['onSave']
}) {
  const [editing, setEditing] = useState(false)
  const [statement, setStatement] = useState('')
  const [doneLooksLike, setDoneLooksLike] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)
  const accent = OWNER_COLORS[owner]

  const startEdit = () => {
    setStatement(star?.statement || '')
    setDoneLooksLike(star?.doneLooksLike || '')
    setTargetDate(star?.targetDate || '')
    setEditing(true)
  }

  const save = async () => {
    if (!statement.trim() || saving) return
    setSaving(true)
    try {
      await onSave({ owner, statement, doneLooksLike, targetDate })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-sm border p-4 relative" style={{ backgroundColor: PAPER, borderColor: RULE, borderTop: `3px solid ${accent}` }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] uppercase tracking-[0.5px] font-semibold" style={{ color: accent }}>
          {ownerLabel(owner)}
        </p>
        {editable && !editing && (
          <button
            onClick={startEdit}
            title="Edit"
            className="p-1 rounded-sm transition-colors"
            style={{ color: MUTED }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 1.5 L12.5 4 L5 11.5 L1.5 12.5 L2.5 9 Z" />
            </svg>
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>Statement</span>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={3}
              className="w-full mt-0.5 rounded-sm border p-2 text-[13px] font-serif bg-white"
              style={{ borderColor: RULE, color: INK }}
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>What done looks like</span>
            <textarea
              value={doneLooksLike}
              onChange={(e) => setDoneLooksLike(e.target.value)}
              rows={2}
              className="w-full mt-0.5 rounded-sm border p-2 text-[12px] bg-white"
              style={{ borderColor: RULE, color: INK }}
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>Target date</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="block mt-0.5 rounded-sm border p-1.5 text-[11px] font-mono bg-white"
              style={{ borderColor: RULE, color: INK }}
            />
          </label>
          <div className="flex gap-1.5 pt-1">
            <button
              onClick={save}
              disabled={saving || !statement.trim()}
              className="px-3 py-1.5 rounded-sm text-[9px] font-serif font-semibold uppercase"
              style={{ backgroundColor: accent, color: PAPER, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-sm border text-[9px] font-serif font-semibold uppercase"
              style={{ borderColor: RULE, color: MUTED }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="font-serif text-[15px] leading-snug mb-3" style={{ color: INK }}>
            {star?.statement || '—'}
          </p>
          {star?.doneLooksLike && (
            <div className="mb-2">
              <p className="text-[9px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>
                Done looks like
              </p>
              <p className="text-[12px]" style={{ color: INK }}>
                {star.doneLooksLike}
              </p>
            </div>
          )}
          {star?.targetDate && (
            <p className="font-mono text-[11px]" style={{ color: MUTED }}>
              Target · {star.targetDate}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export function SectionHeading({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3 pb-1.5 border-b" style={{ borderColor: RULE }}>
      <div>
        <h2 className="font-serif text-[15px] font-semibold uppercase tracking-[0.5px]" style={{ color: '#b85c38' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}
