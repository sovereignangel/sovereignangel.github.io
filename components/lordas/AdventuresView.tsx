'use client'

import { useState, useCallback } from 'react'
import type { SummerPlan, AdventureComment, RelationalSpeaker } from '@/lib/types'
import { GrandTourCalendar } from './GrandTourCalendar'
import { SummerPlanCard } from './SummerPlanCard'
import { CommentsSidebar } from './CommentsSidebar'

interface AdventuresViewProps {
  summerPlan: SummerPlan | null
  comments: AdventureComment[]
  onAddComment: (author: RelationalSpeaker, text: string) => Promise<void>
}

export function AdventuresView({
  summerPlan,
  comments,
  onAddComment,
}: AdventuresViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddComment = useCallback(
    async (author: RelationalSpeaker, text: string) => {
      setIsSubmitting(true)
      try {
        await onAddComment(author, text)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onAddComment]
  )

  return (
    <div className="space-y-8">
      {/* Calendar Section */}
      <div>
        <GrandTourCalendar />
      </div>

      {/* Plan + Comments Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Summer Plan */}
        <div className="lg:col-span-2">
          <SummerPlanCard plan={summerPlan} />
        </div>

        {/* Comments Button */}
        <div className="flex items-start">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-full py-3 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-burgundy transition-colors text-[11px] font-mono uppercase tracking-[0.08em]"
          >
            {comments.length > 0 ? `View Comments (${comments.length})` : 'Add Comments'}
          </button>
        </div>
      </div>

      {/* Comments Sidebar */}
      <CommentsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        comments={comments}
        onAddComment={handleAddComment}
      />
    </div>
  )
}
