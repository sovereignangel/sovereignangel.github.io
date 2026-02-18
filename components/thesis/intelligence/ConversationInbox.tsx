'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getConversations, getProjects } from '@/lib/firestore'
import { Conversation, Project } from '@/lib/types'
import ConversationUploadModal from './ConversationUploadModal'

export default function ConversationInbox() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [expandedConvo, setExpandedConvo] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [convos, projs] = await Promise.all([
        getConversations(user.uid, 10),
        getProjects(user.uid),
      ])
      setConversations(convos)
      setProjects(projs)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
    setLoading(false)
  }

  const loadConversations = async () => {
    if (!user) return
    try {
      const convos = await getConversations(user.uid, 10)
      setConversations(convos)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const handleConversationUploaded = () => {
    setShowUploadModal(false)
    loadConversations()
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <span className="font-serif text-[11px] italic text-ink-muted">Loading conversations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header - Armstrong Style */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Conversation Insights
        </h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="font-serif text-[10px] font-medium px-2 py-1 bg-burgundy text-paper border border-burgundy rounded-sm hover:bg-burgundy-light transition-colors"
        >
          Upload Transcript
        </button>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="bg-paper border border-rule rounded-sm p-6 text-center">
          <p className="font-sans text-[11px] text-ink-muted mb-3">No conversations yet</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="font-mono text-[10px] text-burgundy hover:text-burgundy-light font-medium"
          >
            Upload first conversation →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className="bg-white border border-rule rounded-sm p-3 hover:border-burgundy/30 transition-colors"
            >
              {/* Conversation Header */}
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1">
                  <h3 className="font-sans text-[11px] font-semibold text-ink">{convo.title}</h3>
                  <p className="font-mono text-[9px] text-ink-muted">
                    {convo.date} · {convo.participants.join(', ')} · {convo.conversationType}
                  </p>
                </div>
                <span
                  className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${
                    convo.aiProcessed
                      ? 'bg-green-bg text-green-ink border-green-ink/20'
                      : 'bg-amber-bg text-amber-ink border-amber-ink/20'
                  }`}
                >
                  {convo.aiProcessed ? 'Done' : 'Processing'}
                </span>
              </div>

              {/* Expand to show insights */}
              {convo.aiProcessed && (
                <button
                  onClick={() => setExpandedConvo(expandedConvo === convo.id ? null : convo.id!)}
                  className="font-mono text-[9px] text-burgundy hover:text-burgundy-light font-medium transition-colors"
                >
                  {expandedConvo === convo.id ? '↑ Hide' : '↓ View Insights'}
                </button>
              )}

              {/* Expanded Insights */}
              {expandedConvo === convo.id && convo.aiProcessed && (
                <div className="mt-2 space-y-2 border-t border-rule-light pt-2">
                  {/* Process Insights */}
                  {convo.processInsights.length > 0 && (
                    <div>
                      <h4 className="font-serif text-[10px] font-semibold uppercase tracking-wide text-burgundy mb-1">
                        Process
                      </h4>
                      <ul className="space-y-0.5">
                        {convo.processInsights.map((insight, i) => (
                          <li key={i} className="font-sans text-[10px] text-ink flex items-start gap-1.5">
                            <span className="text-ink-muted mt-0.5">•</span>
                            <span className="flex-1">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Feature Ideas */}
                  {convo.featureIdeas.length > 0 && (
                    <div>
                      <h4 className="font-serif text-[10px] font-semibold uppercase tracking-wide text-burgundy mb-1">
                        Features
                      </h4>
                      <ul className="space-y-0.5">
                        {convo.featureIdeas.map((idea, i) => (
                          <li key={i} className="font-sans text-[10px] text-ink flex items-start gap-1.5">
                            <span className="text-ink-muted mt-0.5">•</span>
                            <span className="flex-1">{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {convo.actionItems.length > 0 && (
                    <div>
                      <h4 className="font-serif text-[10px] font-semibold uppercase tracking-wide text-burgundy mb-1">
                        Actions
                      </h4>
                      <ul className="space-y-0.5">
                        {convo.actionItems.map((action, i) => (
                          <li key={i} className="font-sans text-[10px] text-ink flex items-start gap-1.5">
                            <span className="text-ink-muted mt-0.5">☐</span>
                            <span className="flex-1">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Value Signals */}
                  {convo.valueSignals.length > 0 && (
                    <div>
                      <h4 className="font-serif text-[10px] font-semibold uppercase tracking-wide text-burgundy mb-1">
                        Value
                      </h4>
                      <ul className="space-y-0.5">
                        {convo.valueSignals.map((signal, i) => (
                          <li key={i} className="font-sans text-[10px] text-green-ink flex items-start gap-1.5">
                            <span className="mt-0.5">$</span>
                            <span className="flex-1">{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <ConversationUploadModal
          onClose={() => setShowUploadModal(false)}
          onUploaded={handleConversationUploaded}
          projects={projects}
        />
      )}
    </div>
  )
}
