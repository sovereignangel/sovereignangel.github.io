'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { useCadence } from '@/hooks/useCadence'
import { saveDecision } from '@/lib/firestore/decisions'
import { savePrinciple } from '@/lib/firestore/principles'
import { saveContact, getContactByName, updateContact } from '@/lib/firestore/contacts'
import { saveExternalSignal } from '@/lib/firestore/external-signals'
import type { ParsedJournalEntry } from '@/lib/ai-extraction'
import type { CadenceChecklistItem } from '@/lib/types'

const CADENCE_LABELS: Record<string, string> = {
  energy: 'Log energy inputs',
  problems: 'Identify 3 problems',
  focus: 'Execute focus session',
  ship: 'Ship something',
  signal: 'Review 5+ signals',
  revenue_ask: 'Make 2+ revenue asks',
  psycap: 'Log PsyCap',
}

const DEFAULT_DAILY_ITEMS: CadenceChecklistItem[] = [
  { key: 'energy', label: 'Log energy inputs (sleep, training, NS state, body)', completed: false },
  { key: 'problems', label: 'Identify 3 problems worth solving', completed: false },
  { key: 'focus', label: 'Execute focus session on spine project', completed: false },
  { key: 'ship', label: 'Ship something (code, content, ask)', completed: false },
  { key: 'signal', label: 'Review 5+ external signals', completed: false },
  { key: 'revenue_ask', label: 'Make 2+ revenue asks', completed: false },
  { key: 'psycap', label: 'Log PsyCap (hope, efficacy, resilience, optimism)', completed: false },
]

function getTodayKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type ToggleState = Record<string, boolean>

export default function DailyJournal() {
  const { user } = useAuth()
  const { log, updateField } = useDailyLogContext()
  const { save: saveCadence, getByType } = useCadence(user?.uid)

  const [journalText, setJournalText] = useState(log.journalEntry || '')
  const [parsed, setParsed] = useState<ParsedJournalEntry | null>(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Toggle states for each extracted section
  const [toggles, setToggles] = useState<ToggleState>({})

  const toggle = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: !(prev[key] ?? true) }))
  }

  const isEnabled = (key: string) => toggles[key] ?? true

  async function handleParse() {
    if (!journalText.trim()) return
    setParsing(true)
    setError(null)
    setParsed(null)
    setSaved(false)
    setToggles({})

    try {
      const res = await fetch('/api/journal/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journalText: journalText.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Parse failed')
      }

      const data = await res.json()
      setParsed(data.parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse journal')
    } finally {
      setParsing(false)
    }
  }

  async function handleSaveAll() {
    if (!parsed || !user?.uid) return
    setSaving(true)
    setError(null)

    try {
      const today = getTodayKey()

      // Save journal text to daily log
      await updateField('journalEntry', journalText.trim())

      // Energy fields
      if (parsed.energy.nervousSystemState && isEnabled('energy.ns')) {
        await updateField('nervousSystemState', parsed.energy.nervousSystemState)
      }
      if (parsed.energy.bodyFelt && isEnabled('energy.body')) {
        await updateField('bodyFelt', parsed.energy.bodyFelt)
      }
      if (parsed.energy.trainingTypes.length > 0 && isEnabled('energy.training')) {
        await updateField('trainingTypes', parsed.energy.trainingTypes)
      }
      if (parsed.energy.sleepHours != null && isEnabled('energy.sleep')) {
        await updateField('sleepHours', parsed.energy.sleepHours)
      }

      // Output fields
      if (parsed.output.focusHoursActual != null && isEnabled('output.focus')) {
        await updateField('focusHoursActual', parsed.output.focusHoursActual)
      }
      if (parsed.output.whatShipped && isEnabled('output.shipped')) {
        await updateField('whatShipped', parsed.output.whatShipped)
      }

      // Intelligence fields
      if (parsed.intelligence.discoveryConversationsCount != null && isEnabled('intel.conversations')) {
        await updateField('discoveryConversationsCount', parsed.intelligence.discoveryConversationsCount)
      }
      if (parsed.intelligence.problems.length > 0 && isEnabled('intel.problems')) {
        await updateField('problems', parsed.intelligence.problems.map(p => ({
          problem: p.problem, painPoint: p.painPoint, solution: p.solution, brokenWhy: '',
        })))
      }
      if (parsed.intelligence.problemSelected && isEnabled('intel.problemSelected')) {
        await updateField('problemSelected', parsed.intelligence.problemSelected)
      }
      if (parsed.intelligence.insightsExtracted != null && isEnabled('intel.insights')) {
        await updateField('insightsExtracted', parsed.intelligence.insightsExtracted)
      }

      // Network fields
      if (parsed.network.warmIntrosMade != null && isEnabled('network.intros')) {
        await updateField('warmIntrosMade', parsed.network.warmIntrosMade)
      }
      if (parsed.network.warmIntrosReceived != null && isEnabled('network.introsReceived')) {
        await updateField('warmIntrosReceived', parsed.network.warmIntrosReceived)
      }
      if (parsed.network.meetingsBooked != null && isEnabled('network.meetings')) {
        await updateField('meetingsBooked', parsed.network.meetingsBooked)
      }

      // Revenue fields
      if (parsed.revenue.revenueAsksCount != null && isEnabled('revenue.asks')) {
        await updateField('revenueAsksCount', parsed.revenue.revenueAsksCount)
      }
      if (parsed.revenue.revenueThisSession != null && isEnabled('revenue.amount')) {
        await updateField('revenueThisSession', parsed.revenue.revenueThisSession)
      }
      if (parsed.revenue.revenueStreamType && isEnabled('revenue.streamType')) {
        await updateField('revenueStreamType', parsed.revenue.revenueStreamType)
      }
      if (parsed.revenue.feedbackLoopClosed != null && isEnabled('revenue.feedbackLoop')) {
        await updateField('feedbackLoopClosed', parsed.revenue.feedbackLoopClosed)
      }

      // Skill Building fields
      if (parsed.skill.deliberatePracticeMinutes != null && isEnabled('skill.practice')) {
        await updateField('deliberatePracticeMinutes', parsed.skill.deliberatePracticeMinutes)
      }
      if (parsed.skill.newTechniqueApplied != null && isEnabled('skill.technique')) {
        await updateField('newTechniqueApplied', parsed.skill.newTechniqueApplied)
      }
      if (parsed.skill.automationCreated != null && isEnabled('skill.automation')) {
        await updateField('automationCreated', parsed.skill.automationCreated)
      }

      // PsyCap fields
      if (parsed.psyCap.hope != null && isEnabled('psycap.hope')) {
        await updateField('psyCapHope', parsed.psyCap.hope)
      }
      if (parsed.psyCap.efficacy != null && isEnabled('psycap.efficacy')) {
        await updateField('psyCapEfficacy', parsed.psyCap.efficacy)
      }
      if (parsed.psyCap.resilience != null && isEnabled('psycap.resilience')) {
        await updateField('psyCapResilience', parsed.psyCap.resilience)
      }
      if (parsed.psyCap.optimism != null && isEnabled('psycap.optimism')) {
        await updateField('psyCapOptimism', parsed.psyCap.optimism)
      }

      // Cadence — merge with existing daily review
      if (parsed.cadenceCompleted.length > 0) {
        const enabledCadence = parsed.cadenceCompleted.filter(k => isEnabled(`cadence.${k}`))
        if (enabledCadence.length > 0) {
          const existingReview = getByType('daily').find(r => r.periodKey === today)
          const baseItems = existingReview?.items || DEFAULT_DAILY_ITEMS.map(i => ({ ...i }))
          const mergedItems = baseItems.map(item => {
            if (enabledCadence.includes(item.key)) {
              return { ...item, completed: true, autoCompleted: true }
            }
            return item
          })
          const completionRate = Math.round(
            (mergedItems.filter(i => i.completed).length / mergedItems.length) * 100
          )
          await saveCadence(
            { type: 'daily', periodKey: today, items: mergedItems, completionRate },
            existingReview?.id
          )
        }
      }

      // Decisions
      for (let i = 0; i < parsed.decisions.length; i++) {
        if (!isEnabled(`decision.${i}`)) continue
        const d = parsed.decisions[i]
        const reviewDate = new Date()
        reviewDate.setDate(reviewDate.getDate() + 90)
        const reviewDateStr = reviewDate.toISOString().split('T')[0]
        await saveDecision(user.uid, {
          title: d.title,
          hypothesis: d.hypothesis,
          options: [d.chosenOption],
          chosenOption: d.chosenOption,
          reasoning: d.reasoning,
          confidenceLevel: d.confidenceLevel,
          killCriteria: [],
          premortem: '',
          domain: d.domain,
          linkedProjectIds: [],
          linkedSignalIds: [],
          status: 'active',
          reviewDate: reviewDateStr,
          decidedAt: today,
        })
      }

      // Principles
      for (let i = 0; i < parsed.principles.length; i++) {
        if (!isEnabled(`principle.${i}`)) continue
        const p = parsed.principles[i]
        await savePrinciple(user.uid, {
          text: p.text,
          shortForm: p.shortForm,
          source: 'manual',
          sourceDescription: 'Extracted from daily journal',
          domain: p.domain,
          dateFirstApplied: today,
          linkedDecisionIds: [],
          lastReinforcedAt: today,
        })
      }

      // Contacts (upsert — create or update lastConversationDate)
      for (let i = 0; i < parsed.contacts.length; i++) {
        if (!isEnabled(`contact.${i}`)) continue
        const c = parsed.contacts[i]
        const existing = await getContactByName(user.uid, c.name)
        if (existing?.id) {
          const prevNotes = existing.notes || ''
          await updateContact(user.uid, existing.id, {
            lastConversationDate: today,
            notes: prevNotes ? `${prevNotes}\n${today}: ${c.context}` : `${today}: ${c.context}`,
          })
        } else {
          await saveContact(user.uid, {
            name: c.name,
            lastConversationDate: today,
            notes: `${today}: ${c.context}`,
          })
        }
      }

      // Notes (save as external signals in inbox)
      for (let i = 0; i < parsed.notes.length; i++) {
        if (!isEnabled(`note.${i}`)) continue
        const n = parsed.notes[i]
        await saveExternalSignal(user.uid, {
          title: n.text.slice(0, 120),
          aiSummary: n.text,
          keyTakeaway: n.text,
          valueBullets: [],
          sourceUrl: '',
          sourceName: 'Journal note',
          source: 'telegram',
          relevanceScore: n.actionRequired ? 0.8 : 0.4,
          thesisPillars: [],
          status: 'inbox',
          readStatus: 'unread',
          publishedAt: new Date().toISOString(),
        })
      }

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const hasAnyResults = parsed && (
    parsed.contacts.length > 0 || parsed.notes.length > 0 ||
    parsed.energy.nervousSystemState || parsed.energy.bodyFelt ||
    parsed.energy.trainingTypes.length > 0 || parsed.energy.sleepHours != null ||
    parsed.output.focusHoursActual != null || parsed.output.whatShipped ||
    parsed.intelligence.discoveryConversationsCount != null ||
    parsed.intelligence.problems.length > 0 || parsed.intelligence.insightsExtracted != null ||
    parsed.network.warmIntrosMade != null || parsed.network.warmIntrosReceived != null ||
    parsed.network.meetingsBooked != null ||
    parsed.revenue.revenueAsksCount != null || parsed.revenue.revenueThisSession != null ||
    parsed.revenue.feedbackLoopClosed != null ||
    parsed.skill.deliberatePracticeMinutes != null || parsed.skill.newTechniqueApplied != null ||
    parsed.skill.automationCreated != null ||
    parsed.psyCap.hope != null || parsed.psyCap.efficacy != null ||
    parsed.psyCap.resilience != null || parsed.psyCap.optimism != null ||
    parsed.cadenceCompleted.length > 0 ||
    parsed.decisions.length > 0 || parsed.principles.length > 0
  )

  return (
    <div className="p-3 space-y-3">
      {/* Journal Input */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Daily Journal
        </div>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="Write freely about your day — conversations you had, problems you spotted, revenue opportunities, who you connected with, energy levels, what you shipped, decisions made, lessons learned. The model will parse it into the right places."
          className="w-full h-40 bg-paper border border-rule rounded-sm p-2 text-[11px] text-ink font-medium resize-y focus:outline-none focus:border-burgundy"
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleParse}
            disabled={parsing || !journalText.trim()}
            className={`font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-colors ${
              parsing || !journalText.trim()
                ? 'bg-paper text-ink-muted border-rule cursor-not-allowed'
                : 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
            }`}
          >
            {parsing ? 'Parsing...' : 'Parse Entry'}
          </button>
          <span className="text-[9px] text-ink-muted">
            {journalText.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-white border border-red-ink/20 rounded-sm p-2 text-[11px] text-red-ink">
          {error}
        </div>
      )}

      {/* Parsed Results */}
      {parsed && hasAnyResults && (
        <div className="space-y-2">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
            Extracted — toggle off anything incorrect
          </div>

          {/* Energy */}
          {(parsed.energy.nervousSystemState || parsed.energy.bodyFelt ||
            parsed.energy.trainingTypes.length > 0 || parsed.energy.sleepHours != null) && (
            <ResultSection title="Energy">
              {parsed.energy.sleepHours != null && (
                <ToggleRow
                  label="Sleep"
                  value={`${parsed.energy.sleepHours}h`}
                  enabled={isEnabled('energy.sleep')}
                  onToggle={() => toggle('energy.sleep')}
                />
              )}
              {parsed.energy.nervousSystemState && (
                <ToggleRow
                  label="Nervous System"
                  value={parsed.energy.nervousSystemState.replace(/_/g, ' ')}
                  enabled={isEnabled('energy.ns')}
                  onToggle={() => toggle('energy.ns')}
                />
              )}
              {parsed.energy.bodyFelt && (
                <ToggleRow
                  label="Body"
                  value={parsed.energy.bodyFelt}
                  enabled={isEnabled('energy.body')}
                  onToggle={() => toggle('energy.body')}
                />
              )}
              {parsed.energy.trainingTypes.length > 0 && (
                <ToggleRow
                  label="Training"
                  value={parsed.energy.trainingTypes.join(', ')}
                  enabled={isEnabled('energy.training')}
                  onToggle={() => toggle('energy.training')}
                />
              )}
            </ResultSection>
          )}

          {/* Output */}
          {(parsed.output.focusHoursActual != null || parsed.output.whatShipped) && (
            <ResultSection title="Output">
              {parsed.output.focusHoursActual != null && (
                <ToggleRow
                  label="Focus Hours"
                  value={`${parsed.output.focusHoursActual}h`}
                  enabled={isEnabled('output.focus')}
                  onToggle={() => toggle('output.focus')}
                />
              )}
              {parsed.output.whatShipped && (
                <ToggleRow
                  label="Shipped"
                  value={parsed.output.whatShipped}
                  enabled={isEnabled('output.shipped')}
                  onToggle={() => toggle('output.shipped')}
                />
              )}
            </ResultSection>
          )}

          {/* Intelligence */}
          {(parsed.intelligence.discoveryConversationsCount != null ||
            parsed.intelligence.problems.length > 0 || parsed.intelligence.insightsExtracted != null) && (
            <ResultSection title="Intelligence">
              {parsed.intelligence.discoveryConversationsCount != null && (
                <ToggleRow
                  label="Discovery Conversations"
                  value={`${parsed.intelligence.discoveryConversationsCount}`}
                  enabled={isEnabled('intel.conversations')}
                  onToggle={() => toggle('intel.conversations')}
                />
              )}
              {parsed.intelligence.problems.length > 0 && (
                <ToggleRow
                  label="Problems Identified"
                  value={`${parsed.intelligence.problems.length} problems`}
                  detail={parsed.intelligence.problems.map(p => `${p.problem} → ${p.solution}`).join(' · ')}
                  enabled={isEnabled('intel.problems')}
                  onToggle={() => toggle('intel.problems')}
                />
              )}
              {parsed.intelligence.problemSelected && (
                <ToggleRow
                  label="Problem Selected"
                  value={parsed.intelligence.problemSelected}
                  enabled={isEnabled('intel.problemSelected')}
                  onToggle={() => toggle('intel.problemSelected')}
                />
              )}
              {parsed.intelligence.insightsExtracted != null && (
                <ToggleRow
                  label="Insights Extracted"
                  value={`${parsed.intelligence.insightsExtracted}`}
                  enabled={isEnabled('intel.insights')}
                  onToggle={() => toggle('intel.insights')}
                />
              )}
            </ResultSection>
          )}

          {/* Network */}
          {(parsed.network.warmIntrosMade != null || parsed.network.warmIntrosReceived != null ||
            parsed.network.meetingsBooked != null) && (
            <ResultSection title="Network">
              {parsed.network.warmIntrosMade != null && (
                <ToggleRow
                  label="Warm Intros Made"
                  value={`${parsed.network.warmIntrosMade}`}
                  enabled={isEnabled('network.intros')}
                  onToggle={() => toggle('network.intros')}
                />
              )}
              {parsed.network.warmIntrosReceived != null && (
                <ToggleRow
                  label="Warm Intros Received"
                  value={`${parsed.network.warmIntrosReceived}`}
                  enabled={isEnabled('network.introsReceived')}
                  onToggle={() => toggle('network.introsReceived')}
                />
              )}
              {parsed.network.meetingsBooked != null && (
                <ToggleRow
                  label="Meetings Booked"
                  value={`${parsed.network.meetingsBooked}`}
                  enabled={isEnabled('network.meetings')}
                  onToggle={() => toggle('network.meetings')}
                />
              )}
            </ResultSection>
          )}

          {/* Revenue */}
          {(parsed.revenue.revenueAsksCount != null || parsed.revenue.revenueThisSession != null ||
            parsed.revenue.feedbackLoopClosed != null) && (
            <ResultSection title="Revenue">
              {parsed.revenue.revenueAsksCount != null && (
                <ToggleRow
                  label="Revenue Asks"
                  value={`${parsed.revenue.revenueAsksCount}`}
                  enabled={isEnabled('revenue.asks')}
                  onToggle={() => toggle('revenue.asks')}
                />
              )}
              {parsed.revenue.revenueThisSession != null && (
                <ToggleRow
                  label="Revenue"
                  value={`$${parsed.revenue.revenueThisSession}`}
                  enabled={isEnabled('revenue.amount')}
                  onToggle={() => toggle('revenue.amount')}
                />
              )}
              {parsed.revenue.revenueStreamType && (
                <ToggleRow
                  label="Stream Type"
                  value={parsed.revenue.revenueStreamType.replace(/_/g, ' ')}
                  enabled={isEnabled('revenue.streamType')}
                  onToggle={() => toggle('revenue.streamType')}
                />
              )}
              {parsed.revenue.feedbackLoopClosed != null && (
                <ToggleRow
                  label="Feedback Loop Closed"
                  value={parsed.revenue.feedbackLoopClosed ? 'Yes' : 'No'}
                  enabled={isEnabled('revenue.feedbackLoop')}
                  onToggle={() => toggle('revenue.feedbackLoop')}
                />
              )}
            </ResultSection>
          )}

          {/* Skill Building */}
          {(parsed.skill.deliberatePracticeMinutes != null || parsed.skill.newTechniqueApplied != null ||
            parsed.skill.automationCreated != null) && (
            <ResultSection title="Skill Building">
              {parsed.skill.deliberatePracticeMinutes != null && (
                <ToggleRow label="Practice" value={`${parsed.skill.deliberatePracticeMinutes}m`} enabled={isEnabled('skill.practice')} onToggle={() => toggle('skill.practice')} />
              )}
              {parsed.skill.newTechniqueApplied != null && (
                <ToggleRow label="New Technique" value={parsed.skill.newTechniqueApplied ? 'Yes' : 'No'} enabled={isEnabled('skill.technique')} onToggle={() => toggle('skill.technique')} />
              )}
              {parsed.skill.automationCreated != null && (
                <ToggleRow label="Automation" value={parsed.skill.automationCreated ? 'Yes' : 'No'} enabled={isEnabled('skill.automation')} onToggle={() => toggle('skill.automation')} />
              )}
            </ResultSection>
          )}

          {/* PsyCap */}
          {(parsed.psyCap.hope != null || parsed.psyCap.efficacy != null ||
            parsed.psyCap.resilience != null || parsed.psyCap.optimism != null) && (
            <ResultSection title="PsyCap">
              {parsed.psyCap.hope != null && (
                <ToggleRow label="Hope" value={`${parsed.psyCap.hope}/5`} enabled={isEnabled('psycap.hope')} onToggle={() => toggle('psycap.hope')} />
              )}
              {parsed.psyCap.efficacy != null && (
                <ToggleRow label="Efficacy" value={`${parsed.psyCap.efficacy}/5`} enabled={isEnabled('psycap.efficacy')} onToggle={() => toggle('psycap.efficacy')} />
              )}
              {parsed.psyCap.resilience != null && (
                <ToggleRow label="Resilience" value={`${parsed.psyCap.resilience}/5`} enabled={isEnabled('psycap.resilience')} onToggle={() => toggle('psycap.resilience')} />
              )}
              {parsed.psyCap.optimism != null && (
                <ToggleRow label="Optimism" value={`${parsed.psyCap.optimism}/5`} enabled={isEnabled('psycap.optimism')} onToggle={() => toggle('psycap.optimism')} />
              )}
            </ResultSection>
          )}

          {/* Cadence */}
          {parsed.cadenceCompleted.length > 0 && (
            <ResultSection title="Cadence (Daily)">
              {parsed.cadenceCompleted.map(key => (
                <ToggleRow
                  key={key}
                  label={CADENCE_LABELS[key] || key}
                  value="completed"
                  enabled={isEnabled(`cadence.${key}`)}
                  onToggle={() => toggle(`cadence.${key}`)}
                />
              ))}
            </ResultSection>
          )}

          {/* Decisions */}
          {parsed.decisions.length > 0 && (
            <ResultSection title="Decisions">
              {parsed.decisions.map((d, i) => (
                <ToggleRow
                  key={i}
                  label={d.title}
                  value={`${d.domain} · ${d.confidenceLevel}% confidence`}
                  detail={d.reasoning}
                  enabled={isEnabled(`decision.${i}`)}
                  onToggle={() => toggle(`decision.${i}`)}
                />
              ))}
            </ResultSection>
          )}

          {/* Principles */}
          {parsed.principles.length > 0 && (
            <ResultSection title="Principles">
              {parsed.principles.map((p, i) => (
                <ToggleRow
                  key={i}
                  label={p.shortForm}
                  value={p.domain}
                  detail={p.text}
                  enabled={isEnabled(`principle.${i}`)}
                  onToggle={() => toggle(`principle.${i}`)}
                />
              ))}
            </ResultSection>
          )}

          {/* Contacts */}
          {parsed.contacts.length > 0 && (
            <ResultSection title="Contacts">
              {parsed.contacts.map((c, i) => (
                <ToggleRow
                  key={i}
                  label={c.name}
                  value={c.context}
                  enabled={isEnabled(`contact.${i}`)}
                  onToggle={() => toggle(`contact.${i}`)}
                />
              ))}
            </ResultSection>
          )}

          {/* Notes */}
          {parsed.notes.length > 0 && (
            <ResultSection title="Notes">
              {parsed.notes.map((n, i) => (
                <ToggleRow
                  key={i}
                  label={n.actionRequired ? 'Action' : 'Note'}
                  value={n.text}
                  enabled={isEnabled(`note.${i}`)}
                  onToggle={() => toggle(`note.${i}`)}
                />
              ))}
            </ResultSection>
          )}

          {/* Save All */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveAll}
              disabled={saving || saved}
              className={`font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-colors ${
                saved
                  ? 'bg-green-ink text-paper border-green-ink'
                  : saving
                    ? 'bg-paper text-ink-muted border-rule cursor-not-allowed'
                    : 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
              }`}
            >
              {saved ? 'Saved' : saving ? 'Saving...' : 'Save All'}
            </button>
            {saved && (
              <span className="text-[9px] text-green-ink">
                All approved items saved to their respective tabs.
              </span>
            )}
          </div>
        </div>
      )}

      {/* No results */}
      {parsed && !hasAnyResults && (
        <div className="bg-white border border-rule rounded-sm p-3 text-[11px] text-ink-muted text-center">
          No structured data could be extracted. Try writing about conversations you had, problems you spotted, revenue opportunities, energy levels, or what you shipped.
        </div>
      )}
    </div>
  )
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function ToggleRow({
  label,
  value,
  detail,
  enabled,
  onToggle,
}: {
  label: string
  value: string
  detail?: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`flex items-start gap-2 py-1 transition-opacity ${enabled ? 'opacity-100' : 'opacity-40'}`}
    >
      <button
        onClick={onToggle}
        className={`mt-0.5 w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
          enabled
            ? 'bg-burgundy border-burgundy text-paper'
            : 'bg-paper border-rule'
        }`}
      >
        {enabled && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] font-semibold text-ink">{label}</span>
          <span className="text-[10px] text-ink-muted">{value}</span>
        </div>
        {detail && (
          <div className="text-[9px] text-ink-muted mt-0.5 leading-tight">{detail}</div>
        )}
      </div>
    </div>
  )
}
