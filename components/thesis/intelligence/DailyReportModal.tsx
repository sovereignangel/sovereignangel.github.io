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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
      <div className="bg-white border border-rule rounded-sm shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 pb-2 border-b-2 border-rule">
            <h1 className="font-serif text-[18px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
              Daily Signal Report
            </h1>
            <p className="text-[11px] text-ink-muted">
              {new Date(report.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* AI Summary */}
          <div className="mb-6">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
              Summary
            </h2>
            <p className="text-[12px] text-ink whitespace-pre-line leading-relaxed">
              {report.aiSummary}
            </p>
          </div>

          {/* Top External Signals */}
          {externalSignals.length > 0 && (
            <div className="mb-6">
              <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
                Top Signals from RSS Feeds
              </h2>
              <div className="space-y-2">
                {externalSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="bg-paper border border-rule rounded-sm p-3"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[12px] font-semibold text-ink">{signal.title}</h3>
                          <span className="text-[9px] text-ink-muted font-medium">
                            {Math.round(signal.relevanceScore * 100)}%
                          </span>
                        </div>
                        <p className="text-[9px] text-ink-muted mb-1.5">
                          {signal.sourceName} •{' '}
                          {new Date(signal.publishedAt).toLocaleDateString()}
                        </p>
                        <p className="text-[11px] text-ink">{signal.aiSummary}</p>
                      </div>
                    </div>

                    {/* Pillars */}
                    <div className="flex gap-1 mb-2">
                      {signal.thesisPillars.map((pillar) => (
                        <span
                          key={pillar}
                          className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20"
                        >
                          {pillar}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(signal.sourceUrl, '_blank')}
                        className="text-[11px] text-burgundy hover:text-ink font-medium"
                      >
                        Read Full →
                      </button>
                      <button
                        onClick={() => onConvertSignal(signal.id!)}
                        className="text-[11px] text-green-ink hover:text-ink font-medium"
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
            <div className="mb-6">
              <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
                Yesterday&apos;s Conversations
              </h2>
              <div className="space-y-1.5">
                {conversations.map((convo) => (
                  <div
                    key={convo.id}
                    className="bg-paper border border-rule rounded-sm p-3"
                  >
                    <h3 className="text-[12px] font-semibold text-ink">{convo.title}</h3>
                    <p className="text-[10px] text-ink-muted">
                      {convo.participants.join(', ')} • {convo.conversationType}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reconnect Suggestions */}
          {reconnectContacts.length > 0 && (
            <div className="mb-6">
              <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2">
                Reconnect Suggestions
              </h2>
              <div className="space-y-1.5">
                {reconnectContacts.map((contact) => {
                  const daysSince = Math.floor(
                    (new Date().getTime() - new Date(contact.lastConversationDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                  return (
                    <div
                      key={contact.id}
                      className="bg-amber-bg border border-amber-ink/20 rounded-sm p-3 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="text-[12px] font-semibold text-ink">{contact.name}</h3>
                        <p className="text-[10px] text-ink-muted">
                          Last conversation: {daysSince} days ago
                        </p>
                      </div>
                      <button
                        onClick={() => onMarkReconnected(contact.id!)}
                        className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-amber-ink border-amber-ink/30 hover:border-amber-ink"
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
              <div className="bg-paper border border-rule rounded-sm p-6 text-center mb-6">
                <p className="text-[11px] text-ink-muted">
                  No new signals, conversations, or reconnect suggestions for today.
                </p>
              </div>
            )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-rule">
            <button
              onClick={onClose}
              className="flex-1 font-serif text-[11px] font-medium px-2 py-2 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleMarkReviewed}
              disabled={marking}
              className="flex-1 font-serif text-[11px] font-medium px-2 py-2 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-50"
            >
              {marking ? 'Marking...' : 'Mark as Reviewed'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
