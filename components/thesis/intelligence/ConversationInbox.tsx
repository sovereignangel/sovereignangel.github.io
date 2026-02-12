'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getConversations } from '@/lib/firestore'
import { Conversation } from '@/lib/types'
import ConversationUploadModal from './ConversationUploadModal'

export default function ConversationInbox() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [expandedConvo, setExpandedConvo] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadConversations()
  }, [user])

  const loadConversations = async () => {
    if (!user) return
    setLoading(true)
    try {
      const convos = await getConversations(user.uid, 10)
      setConversations(convos)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
    setLoading(false)
  }

  const handleConversationUploaded = () => {
    setShowUploadModal(false)
    loadConversations()
  }

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading conversations...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Conversation Insights</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload Transcript
        </button>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
          <p className="text-neutral-600 mb-4">No conversations yet</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Upload your first conversation →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
            >
              {/* Conversation Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-neutral-900">{convo.title}</h3>
                  <p className="text-sm text-neutral-500">
                    {convo.date} • {convo.participants.join(', ')} • {convo.conversationType}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    convo.aiProcessed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {convo.aiProcessed ? 'Processed' : 'Processing...'}
                </span>
              </div>

              {/* Expand to show insights */}
              {convo.aiProcessed && (
                <button
                  onClick={() => setExpandedConvo(expandedConvo === convo.id ? null : convo.id!)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {expandedConvo === convo.id ? '↑ Hide Insights' : '↓ View Extracted Insights'}
                </button>
              )}

              {/* Expanded Insights */}
              {expandedConvo === convo.id && convo.aiProcessed && (
                <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
                  {/* Process Insights */}
                  {convo.processInsights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                        Process Insights
                      </h4>
                      <ul className="space-y-1">
                        {convo.processInsights.map((insight, i) => (
                          <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                            <span className="text-neutral-400">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Feature Ideas */}
                  {convo.featureIdeas.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                        Feature Ideas
                      </h4>
                      <ul className="space-y-1">
                        {convo.featureIdeas.map((idea, i) => (
                          <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                            <span className="text-neutral-400">•</span>
                            <span>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {convo.actionItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                        Action Items
                      </h4>
                      <ul className="space-y-1">
                        {convo.actionItems.map((action, i) => (
                          <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                            <span className="text-neutral-400">☐</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Value Signals */}
                  {convo.valueSignals.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                        Value Signals
                      </h4>
                      <ul className="space-y-1">
                        {convo.valueSignals.map((signal, i) => (
                          <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                            <span className="text-neutral-400">$</span>
                            <span>{signal}</span>
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
        />
      )}
    </div>
  )
}
