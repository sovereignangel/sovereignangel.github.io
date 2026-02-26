'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getVentures, getVenture, updateVenture, saveVenture } from '@/lib/firestore'
import type { Venture, VentureStage } from '@/lib/types'
import { authFetch } from '@/lib/auth-fetch'

export default function VenturesDial({ selectedVentureId }: { selectedVentureId: string | null }) {
  const { user } = useAuth()
  const [ventures, setVentures] = useState<Venture[]>([])
  const [selectedVenture, setSelectedVenture] = useState<Venture | null>(null)
  const [newIdea, setNewIdea] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [score, setScore] = useState<string>('')

  // Load all ventures for stats
  useEffect(() => {
    if (!user) return
    getVentures(user.uid).then(setVentures)
  }, [user])

  // Load selected venture
  useEffect(() => {
    if (!user || !selectedVentureId) {
      setSelectedVenture(null)
      return
    }
    getVenture(user.uid, selectedVentureId).then(v => {
      setSelectedVenture(v)
      setNotes(v?.notes || '')
      setScore(v?.score !== null ? String(v?.score) : '')
    })
  }, [user, selectedVentureId])

  const handleSubmitIdea = async () => {
    if (!user || !newIdea.trim()) return
    setSubmitting(true)
    try {
      const res = await authFetch('/api/ventures/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newIdea }),
      })
      if (!res.ok) throw new Error('Failed to parse venture idea')
      const parsed = await res.json()
      await saveVenture(user.uid, {
        rawInput: newIdea,
        inputSource: 'dashboard',
        spec: {
          name: parsed.name,
          oneLiner: parsed.oneLiner,
          problem: parsed.problem,
          targetCustomer: parsed.targetCustomer,
          solution: parsed.solution,
          category: parsed.category,
          thesisPillars: parsed.thesisPillars,
          revenueModel: parsed.revenueModel,
          pricingIdea: parsed.pricingIdea,
          marketSize: parsed.marketSize,
          techStack: parsed.techStack,
          mvpFeatures: parsed.mvpFeatures,
          apiIntegrations: parsed.apiIntegrations,
          existingAlternatives: parsed.existingAlternatives,
          unfairAdvantage: parsed.unfairAdvantage,
          killCriteria: parsed.killCriteria,
        },
        stage: 'specced' as VentureStage,
        score: parsed.suggestedScore,
      })
      setNewIdea('')
      // Refresh ventures
      const updated = await getVentures(user.uid)
      setVentures(updated)
    } catch (err) {
      console.error('Failed to submit venture:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!user || !selectedVentureId) return
    const scoreNum = score ? Math.max(0, Math.min(100, parseInt(score, 10))) : null
    await updateVenture(user.uid, selectedVentureId, {
      notes,
      score: isNaN(scoreNum as number) ? null : scoreNum,
    })
  }

  const stageCounts = ventures.reduce((acc, v) => {
    acc[v.stage] = (acc[v.stage] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-3">
      {/* New Venture Form */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
          New Venture
        </div>
        <textarea
          value={newIdea}
          onChange={e => setNewIdea(e.target.value)}
          placeholder="Describe a business idea..."
          rows={4}
          className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1.5 text-ink placeholder:text-ink-faint focus:border-burgundy focus:outline-none resize-none"
        />
        <button
          onClick={handleSubmitIdea}
          disabled={submitting || !newIdea.trim()}
          className={`mt-1.5 w-full font-serif text-[9px] font-medium px-2 py-1.5 rounded-sm border transition-colors ${
            submitting || !newIdea.trim()
              ? 'bg-cream text-ink-faint border-rule cursor-not-allowed'
              : 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
          }`}
        >
          {submitting ? 'Analyzing...' : 'Spec Venture'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
          Pipeline
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {['idea', 'specced', 'prd_draft', 'building', 'deployed'].map(stage => (
            <div key={stage} className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-ink-muted capitalize">{stage.replace(/_/g, ' ')}</span>
              <span className="font-mono text-[10px] font-semibold text-ink">{stageCounts[stage] || 0}</span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 pt-1.5 border-t border-rule flex items-center justify-between">
          <span className="font-mono text-[9px] text-ink-muted">Total</span>
          <span className="font-mono text-[10px] font-semibold text-ink">{ventures.length}</span>
        </div>
      </div>

      {/* Selected Venture Actions */}
      {selectedVenture && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            {selectedVenture.spec.name}
          </div>

          <div className="space-y-2">
            <div>
              <label className="font-mono text-[9px] text-ink-muted block mb-0.5">Conviction (0-100)</label>
              <input
                type="number"
                value={score}
                onChange={e => setScore(e.target.value)}
                min="0"
                max="100"
                className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink focus:border-burgundy focus:outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[9px] text-ink-muted block mb-0.5">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1.5 text-ink focus:border-burgundy focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSaveNotes}
              className="w-full font-serif text-[9px] font-medium px-2 py-1.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
