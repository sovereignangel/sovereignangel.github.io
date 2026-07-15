'use client'

import { useState } from 'react'
import type { KiteSession } from '@/lib/types'

interface Props {
  onAdd: (session: Omit<KiteSession, 'id' | 'createdAt'>) => Promise<void>
}

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const num = (v: string): number | null => (v.trim() === '' ? null : Number(v))

export function SessionForm({ onAdd }: Props) {
  const [date, setDate] = useState(localToday())
  const [hours, setHours] = useState('')
  const [windKn, setWindKn] = useState('')
  const [kiteSize, setKiteSize] = useState('')
  const [focus, setFocus] = useState('')
  const [airtime, setAirtime] = useState('')
  const [height, setHeight] = useState('')
  const [distance, setDistance] = useState('')
  const [jumps, setJumps] = useState('')
  const [landed, setLanded] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave = date && Number(hours) > 0 && !saving

  const submit = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onAdd({
        date,
        hours: Number(hours),
        windKn: num(windKn),
        kiteSize: num(kiteSize),
        focus: focus.trim(),
        notes: notes.trim(),
        bestAirtimeSec: num(airtime),
        bestHeightM: num(height),
        bestDistanceM: num(distance),
        jumps: num(jumps),
        landed: num(landed),
      })
      setHours(''); setWindKn(''); setKiteSize(''); setFocus('')
      setAirtime(''); setHeight(''); setDistance(''); setJumps(''); setLanded(''); setNotes('')
    } finally {
      setSaving(false)
    }
  }

  const field = 'w-full bg-paper border border-rule rounded-sm px-2 py-1 text-[11px] text-ink focus:outline-none focus:border-burgundy'
  const label = 'block text-[10px] text-ink-muted mb-0.5'

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        Log Session
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <label className={label}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Hours *</label>
          <input type="number" step="0.5" min="0" placeholder="2.5" value={hours} onChange={e => setHours(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Wind (kn)</label>
          <input type="number" step="1" min="0" placeholder="16" value={windKn} onChange={e => setWindKn(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Kite (m)</label>
          <input type="number" step="1" min="0" placeholder="10" value={kiteSize} onChange={e => setKiteSize(e.target.value)} className={field} />
        </div>
        <div className="col-span-2">
          <label className={label}>Focus drill</label>
          <input type="text" placeholder="Upwind legs, both tacks" value={focus} onChange={e => setFocus(e.target.value)} className={field} />
        </div>
      </div>

      <div className="text-[10px] text-ink-muted uppercase tracking-[0.5px] mb-1 pt-1 border-t border-rule-light">
        Surfr KPIs (session bests)
      </div>
      <div className="grid grid-cols-5 gap-2 mb-2">
        <div>
          <label className={label}>Airtime (s)</label>
          <input type="number" step="0.1" min="0" value={airtime} onChange={e => setAirtime(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Height (m)</label>
          <input type="number" step="0.1" min="0" value={height} onChange={e => setHeight(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Distance (m)</label>
          <input type="number" step="0.5" min="0" value={distance} onChange={e => setDistance(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Jumps</label>
          <input type="number" step="1" min="0" value={jumps} onChange={e => setJumps(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Landed</label>
          <input type="number" step="1" min="0" value={landed} onChange={e => setLanded(e.target.value)} className={field} />
        </div>
      </div>

      <div className="mb-2">
        <label className={label}>Notes</label>
        <textarea
          rows={2}
          placeholder="What clicked, what did not"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className={field}
        />
      </div>

      <button
        onClick={submit}
        disabled={!canSave}
        className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border ${
          canSave
            ? 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
            : 'bg-transparent text-ink-faint border-rule cursor-not-allowed'
        }`}
      >
        {saving ? 'Saving…' : 'Add Session'}
      </button>
    </div>
  )
}
