'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLog } from '@/hooks/useDailyLog'
import { getAuth } from 'firebase/auth'
import { saveVenture } from '@/lib/firestore/ventures'

export default function QuickCapture() {
  const { user } = useAuth()
  const { updateField } = useDailyLog()

  // Journal thought state
  const [journalText, setJournalText] = useState('')
  const [journalSaving, setJournalSaving] = useState(false)
  const [journalResult, setJournalResult] = useState<string | null>(null)

  // Venture idea state
  const [ventureText, setVentureText] = useState('')
  const [ventureSaving, setVentureSaving] = useState(false)
  const [ventureResult, setVentureResult] = useState<string | null>(null)

  async function handleJournalSave() {
    if (!user?.uid || !journalText.trim()) return
    setJournalSaving(true)
    setJournalResult(null)
    try {
      const token = await getAuth().currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/journal/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ journalText: journalText.trim() }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const parsed = data.parsed

      // Save key fields to daily log
      if (parsed?.energy?.nervousSystemState) {
        updateField('nervousSystemState', parsed.energy.nervousSystemState)
      }
      if (parsed?.output?.focusHoursActual) {
        updateField('focusHoursActual', parsed.output.focusHoursActual)
      }
      if (parsed?.output?.whatShipped) {
        updateField('whatShipped', parsed.output.whatShipped)
      }

      setJournalResult('Parsed and saved')
      setJournalText('')
      setTimeout(() => setJournalResult(null), 3000)
    } catch (e) {
      setJournalResult(`Error: ${e instanceof Error ? e.message : 'Failed'}`)
    } finally {
      setJournalSaving(false)
    }
  }

  async function handleVentureSpec() {
    if (!user?.uid || !ventureText.trim()) return
    setVentureSaving(true)
    setVentureResult(null)
    try {
      const token = await getAuth().currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      // Create venture with raw input
      const ventureId = await saveVenture(user.uid, {
        rawInput: ventureText.trim(),
        inputSource: 'dashboard',
        stage: 'idea',
        spec: {
          name: ventureText.trim().slice(0, 50),
          oneLiner: '',
          problem: '',
          targetCustomer: '',
          solution: '',
          category: 'other' as const,
          thesisPillars: [],
          revenueModel: '',
          pricingIdea: '',
          marketSize: '',
          techStack: [],
          mvpFeatures: [],
          apiIntegrations: [],
          existingAlternatives: [],
          unfairAdvantage: '',
          killCriteria: [],
        },
        build: {
          status: 'pending' as const,
          repoUrl: null,
          previewUrl: null,
          customDomain: null,
          repoName: null,
          buildLog: [],
          startedAt: null,
          completedAt: null,
          errorMessage: null,
          filesGenerated: null,
        },
        notes: '',
        score: null,
        iterations: [],
        linkedProjectId: null,
      })

      // Trigger spec generation via venture spec API
      const specRes = await fetch('/api/ventures/spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ventureId, rawInput: ventureText.trim() }),
      })

      if (specRes.ok) {
        const specData = await specRes.json()
        setVentureResult(`Specced: ${specData.spec?.name || 'Venture created'}`)
      } else {
        setVentureResult('Venture saved (spec pending)')
      }

      setVentureText('')
      setTimeout(() => setVentureResult(null), 4000)
    } catch (e) {
      setVentureResult(`Error: ${e instanceof Error ? e.message : 'Failed'}`)
    } finally {
      setVentureSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Journal Thought */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
          Quick Journal
        </div>
        <textarea
          value={journalText}
          onChange={e => setJournalText(e.target.value)}
          placeholder="What's on your mind? Energy, conversations, problems, ships..."
          className="w-full text-[10px] text-ink bg-cream border border-rule-light rounded-sm px-2 py-1.5 resize-none focus:outline-none focus:border-burgundy/30 placeholder:text-ink-faint"
          rows={3}
        />
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={handleJournalSave}
            disabled={journalSaving || !journalText.trim()}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          >
            {journalSaving ? 'Parsing...' : 'Parse & Save'}
          </button>
          {journalResult && (
            <span className={`text-[9px] ${journalResult.startsWith('Error') ? 'text-red-ink' : 'text-green-ink'}`}>
              {journalResult}
            </span>
          )}
        </div>
      </div>

      {/* Venture Idea */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
          Venture Idea
        </div>
        <textarea
          value={ventureText}
          onChange={e => setVentureText(e.target.value)}
          placeholder="Describe a product idea, arbitrage opportunity, or tool..."
          className="w-full text-[10px] text-ink bg-cream border border-rule-light rounded-sm px-2 py-1.5 resize-none focus:outline-none focus:border-burgundy/30 placeholder:text-ink-faint"
          rows={3}
        />
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={handleVentureSpec}
            disabled={ventureSaving || !ventureText.trim()}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          >
            {ventureSaving ? 'Speccing...' : 'Spec It'}
          </button>
          {ventureResult && (
            <span className={`text-[9px] ${ventureResult.startsWith('Error') ? 'text-red-ink' : 'text-green-ink'}`}>
              {ventureResult}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
