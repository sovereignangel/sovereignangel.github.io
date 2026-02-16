'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ConversationType } from '@/lib/types'

interface ConversationUploadModalProps {
  onClose: () => void
  onUploaded: () => void
}

export default function ConversationUploadModal({
  onClose,
  onUploaded,
}: ConversationUploadModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    participants: '',
    conversationType: 'customer_discovery' as ConversationType,
    transcriptText: '',
    linkedProjectId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Split participants by comma
      const participantNames = formData.participants
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)

      // Call server-side API route to process conversation
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
          linkedProjectId: formData.linkedProjectId || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to process conversation')
      }

      const result = await response.json()
      console.log('Conversation processed successfully:', result)

      onUploaded()
    } catch (error) {
      console.error('Error uploading conversation:', error)
      alert(`Error processing conversation: ${error instanceof Error ? error.message : 'Please try again.'}`)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Upload Conversation Transcript
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Discovery call with Uzo"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Participants (comma-separated)
              </label>
              <input
                type="text"
                value={formData.participants}
                onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                placeholder="e.g., Uzo, Sarah"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Conversation Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="customer_discovery">Customer Discovery</option>
                <option value="investor">Investor</option>
                <option value="partnership">Partnership</option>
                <option value="advisor">Advisor</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Transcript <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.transcriptText}
                onChange={(e) => setFormData({ ...formData, transcriptText: e.target.value })}
                placeholder="Paste conversation transcript from Google Doc or Otter export..."
                rows={10}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-neutral-500 mt-1">
                AI will extract insights automatically (~3-5 seconds)
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Extracting Insights...
                  </>
                ) : (
                  'Extract Insights with AI'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
