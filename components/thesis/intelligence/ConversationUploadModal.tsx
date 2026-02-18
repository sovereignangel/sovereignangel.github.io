'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { ConversationType, Project } from '@/lib/types'
import type { StructuredInsight, ExtractedMacroPattern } from '@/lib/ai-extraction'

const INSIGHT_TYPE_LABELS: Record<string, string> = {
  process_insight: 'Process',
  feature_idea: 'Feature',
  action_item: 'Action',
  value_signal: 'Value',
  market_pattern: 'Market',
  arbitrage_opportunity: 'Arbitrage',
}

const INSIGHT_TYPE_COLORS: Record<string, string> = {
  process_insight: 'bg-burgundy-bg text-burgundy border-burgundy/20',
  feature_idea: 'bg-green-bg text-green-ink border-green-ink/20',
  action_item: 'bg-amber-bg text-amber-ink border-amber-ink/20',
  value_signal: 'bg-green-bg text-green-ink border-green-ink/20',
  market_pattern: 'bg-burgundy-bg text-burgundy border-burgundy/20',
  arbitrage_opportunity: 'bg-amber-bg text-amber-ink border-amber-ink/20',
}

const CONVERSATION_TYPE_OPTIONS: { value: ConversationType; label: string }[] = [
  { value: 'customer_discovery', label: 'Customer Discovery' },
  { value: 'sme_discovery', label: 'SME Discovery' },
  { value: 'market_conversation', label: 'Market Conversation' },
  { value: 'investor', label: 'Investor' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'other', label: 'Other' },
]

interface ConversationUploadModalProps {
  onClose: () => void
  onUploaded: () => void
  projects: Project[]
}

type ModalStep = 'form' | 'processing' | 'results'

export default function ConversationUploadModal({
  onClose,
  onUploaded,
  projects,
}: ConversationUploadModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<ModalStep>('form')
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    participants: '',
    conversationType: 'customer_discovery' as ConversationType,
    transcriptText: '',
    selectedProjectIds: [] as string[],
  })
  const [extractedInsights, setExtractedInsights] = useState<StructuredInsight[]>([])
  const [extractedPatterns, setExtractedPatterns] = useState<ExtractedMacroPattern[]>([])

  const toggleProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProjectIds: prev.selectedProjectIds.includes(projectId)
        ? prev.selectedProjectIds.filter(id => id !== projectId)
        : [...prev.selectedProjectIds, projectId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setStep('processing')
    try {
      const participantNames = formData.participants
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)

      // Build project name-to-ID mapping
      const projectNameToId: Record<string, string> = {}
      const projectNames: string[] = []
      for (const proj of projects) {
        if (proj.id) {
          projectNameToId[proj.name] = proj.id
          projectNames.push(proj.name)
        }
      }

      const response = await fetch('/api/conversations/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          title: formData.title,
          date: formData.date,
          participants: participantNames,
          conversationType: formData.conversationType,
          transcriptText: formData.transcriptText,
          linkedProjectId: formData.selectedProjectIds[0] || null,
          projectNames,
          projectNameToId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to process conversation')
      }

      const result = await response.json()
      setExtractedInsights(result.structuredInsights || [])
      setExtractedPatterns(result.macroPatterns || [])
      setStep('results')
    } catch (error) {
      console.error('Error uploading conversation:', error)
      alert(`Error processing conversation: ${error instanceof Error ? error.message : 'Please try again.'}`)
      setStep('form')
    }
  }

  const handleDone = () => {
    onUploaded()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-rule rounded-sm shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-rule">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              {step === 'results' ? 'Extracted Insights' : 'Upload Conversation'}
            </h2>
            <button
              onClick={step === 'results' ? handleDone : onClose}
              className="text-ink-muted hover:text-ink text-[11px]"
            >
              {step === 'results' ? 'Done' : 'Close'}
            </button>
          </div>

          {/* Step: Form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Title <span className="text-red-ink">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Discovery call with Uzo"
                  className="w-full px-2 py-1.5 border border-rule rounded-sm text-[11px] text-ink focus:border-burgundy focus:outline-none"
                />
              </div>

              {/* Date + Type row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-ink-muted mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-rule rounded-sm text-[11px] text-ink focus:border-burgundy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-ink-muted mb-1">
                    Conversation Type
                  </label>
                  <select
                    value={formData.conversationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conversationType: e.target.value as ConversationType,
                      })
                    }
                    className="w-full px-2 py-1.5 border border-rule rounded-sm text-[11px] text-ink focus:border-burgundy focus:outline-none"
                  >
                    {CONVERSATION_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Participants (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  placeholder="e.g., Uzo, Sarah"
                  className="w-full px-2 py-1.5 border border-rule rounded-sm text-[11px] text-ink focus:border-burgundy focus:outline-none"
                />
              </div>

              {/* Project Selector */}
              {projects.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-ink-muted mb-1">
                    Related Projects
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {projects.filter(p => p.status !== 'archived').map(proj => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => proj.id && toggleProject(proj.id)}
                        className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                          proj.id && formData.selectedProjectIds.includes(proj.id)
                            ? 'bg-burgundy text-paper border-burgundy'
                            : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                        }`}
                      >
                        {proj.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript */}
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Transcript <span className="text-red-ink">*</span>
                </label>
                <textarea
                  required
                  value={formData.transcriptText}
                  onChange={(e) => setFormData({ ...formData, transcriptText: e.target.value })}
                  placeholder="Paste conversation transcript from Wave, Otter, or Google Doc..."
                  rows={8}
                  className="w-full px-2 py-1.5 border border-rule rounded-sm text-[10px] font-mono text-ink focus:border-burgundy focus:outline-none"
                />
                <p className="text-[9px] text-ink-muted mt-1">
                  AI will extract insights and tag them to your projects (~5-10 seconds)
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-2 py-1.5 border border-rule text-ink-muted rounded-sm text-[11px] font-medium hover:bg-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-2 py-1.5 bg-burgundy text-paper rounded-sm text-[11px] font-medium hover:bg-burgundy/90 transition-colors flex items-center justify-center gap-2"
                >
                  Extract Insights with AI
                </button>
              </div>
            </form>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <svg
                className="animate-spin h-6 w-6 text-burgundy"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-[11px] text-ink-muted">Extracting insights and tagging to projects...</p>
            </div>
          )}

          {/* Step: Results */}
          {step === 'results' && (
            <div className="space-y-3">
              {/* Macro Patterns */}
              {extractedPatterns.length > 0 && (
                <div>
                  <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
                    Macro Patterns
                  </h3>
                  <div className="space-y-1.5">
                    {extractedPatterns.map((mp, i) => (
                      <div key={i} className="bg-cream border border-rule rounded-sm p-2">
                        <p className="text-[10px] text-ink">{mp.pattern}</p>
                        <div className="flex gap-1 mt-1">
                          <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${
                            mp.confidence === 'strong'
                              ? 'bg-green-bg text-green-ink border-green-ink/20'
                              : mp.confidence === 'confirmed'
                              ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
                              : 'bg-burgundy-bg text-burgundy border-burgundy/20'
                          }`}>
                            {mp.confidence}
                          </span>
                          {mp.relatedProjectNames.map(name => (
                            <span key={name} className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured Insights */}
              <div>
                <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
                  Extracted Insights ({extractedInsights.length})
                </h3>
                {extractedInsights.length === 0 ? (
                  <p className="text-[10px] text-ink-muted">No structured insights extracted.</p>
                ) : (
                  <div className="space-y-1.5">
                    {extractedInsights.map((si, i) => (
                      <div key={i} className="bg-white border border-rule rounded-sm p-2">
                        <div className="flex items-start gap-2">
                          <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${
                            INSIGHT_TYPE_COLORS[si.type] || 'text-ink-muted border-rule'
                          }`}>
                            {INSIGHT_TYPE_LABELS[si.type] || si.type}
                          </span>
                          <p className="text-[10px] text-ink leading-relaxed">{si.content}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {si.linkedProjectNames.map(name => (
                            <span key={name} className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                              {name}
                            </span>
                          ))}
                          {si.tags.map(tag => (
                            <span key={tag} className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Done button */}
              <div className="pt-2">
                <button
                  onClick={handleDone}
                  className="w-full px-2 py-1.5 bg-burgundy text-paper rounded-sm text-[11px] font-medium hover:bg-burgundy/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
