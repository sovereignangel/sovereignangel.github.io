'use client'

import { useState } from 'react'
import { DailyReport, ExternalSignal, Conversation, Contact } from '@/lib/types'
import { markDailyReportAsReviewed } from '@/lib/firestore'
import { useAuth } from '@/components/auth/AuthProvider'

interface DailyReportModalProps {
  report: DailyReport
  externalSignals: ExternalSignal[]
  conversations: Conversation[]
  reconnectContacts: Contact[]
  onClose: () => void
  onConvertSignal: (signalId: string) => void
  onMarkReconnected: (contactId: string) => void
}

export default function DailyReportModal({
  report,
  externalSignals,
  conversations,
  reconnectContacts,
  onClose,
  onConvertSignal,
  onMarkReconnected,
}: DailyReportModalProps) {
  const { user } = useAuth()
  const [marking, setMarking] = useState(false)

  const handleMarkReviewed = async () => {
    if (!user) return
    setMarking(true)
    try {
      await markDailyReportAsReviewed(user.uid, report.date)
      onClose()
    } catch (error) {
      console.error('Error marking report as reviewed:', error)
    }
    setMarking(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Daily Signal Report
            </h1>
            <p className="text-sm text-neutral-600">
              {new Date(report.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* AI Summary */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">Summary</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                {report.aiSummary}
              </p>
            </div>
          </div>

          {/* Top External Signals */}
          {externalSignals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                Top Signals from RSS Feeds
              </h2>
              <div className="space-y-3">
                {externalSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-neutral-900">{signal.title}</h3>
                          <span className="text-xs text-neutral-500 font-medium">
                            {Math.round(signal.relevanceScore * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mb-2">
                          {signal.sourceName} •{' '}
                          {new Date(signal.publishedAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-neutral-700">{signal.aiSummary}</p>
                      </div>
                    </div>

                    {/* Pillars */}
                    <div className="flex gap-2 mb-3">
                      {signal.thesisPillars.map((pillar) => (
                        <span
                          key={pillar}
                          className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700"
                        >
                          {pillar}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(signal.sourceUrl, '_blank')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Read Full →
                      </button>
                      <button
                        onClick={() => onConvertSignal(signal.id!)}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Convert to Signal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yesterday's Conversations */}
          {conversations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                Yesterday's Conversations
              </h2>
              <div className="space-y-2">
                {conversations.map((convo) => (
                  <div
                    key={convo.id}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-3"
                  >
                    <h3 className="font-medium text-neutral-900 text-sm">{convo.title}</h3>
                    <p className="text-xs text-neutral-600">
                      {convo.participants.join(', ')} • {convo.conversationType}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reconnect Suggestions */}
          {reconnectContacts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                Reconnect Suggestions
              </h2>
              <div className="space-y-2">
                {reconnectContacts.map((contact) => {
                  const daysSince = Math.floor(
                    (new Date().getTime() - new Date(contact.lastConversationDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                  return (
                    <div
                      key={contact.id}
                      className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-medium text-neutral-900 text-sm">{contact.name}</h3>
                        <p className="text-xs text-neutral-600">
                          Last conversation: {daysSince} days ago
                        </p>
                      </div>
                      <button
                        onClick={() => onMarkReconnected(contact.id!)}
                        className="text-sm text-amber-700 hover:text-amber-800 font-medium px-3 py-1 bg-white border border-amber-300 rounded-lg"
                      >
                        Mark Reconnected
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {externalSignals.length === 0 &&
            conversations.length === 0 &&
            reconnectContacts.length === 0 && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center mb-8">
                <p className="text-neutral-600">
                  No new signals, conversations, or reconnect suggestions for today.
                </p>
              </div>
            )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-neutral-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleMarkReviewed}
              disabled={marking}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {marking ? 'Marking...' : 'Mark as Reviewed'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
