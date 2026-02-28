'use client'

import Link from 'next/link'
import { usePendingReviews } from '@/hooks/usePendingReviews'

export default function ReviewListPage() {
  const { reviews, loading } = usePendingReviews()

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[11px] text-ink-muted">Loading reviews...</div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white border border-rule rounded-sm p-3 text-center">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
            No Pending Reviews
          </div>
          <div className="text-[11px] text-ink-muted">
            Journal entries will appear here for review after parsing.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3">
        Pending Journal Reviews ({reviews.length})
      </div>

      <div className="space-y-2">
        {reviews.map((review) => {
          const totalItems = (review.contacts?.length || 0) +
            (review.decisions?.length || 0) +
            (review.principles?.length || 0) +
            (review.beliefs?.length || 0) +
            (review.notes?.length || 0)

          return (
            <Link
              key={review.id}
              href={`/thesis/review/${review.id}`}
              className="block bg-white border border-rule rounded-sm p-3 hover:border-burgundy/30 transition-colors no-underline"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-ink">{review.date}</span>
                <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-green-bg text-green-ink border-green-ink/20">
                  saved — review
                </span>
              </div>
              <div className="text-[9px] text-ink-muted line-clamp-2 mb-1.5">
                {review.journalText?.slice(0, 200)}
              </div>
              <div className="flex gap-2">
                {(review.contacts?.length || 0) > 0 && (
                  <span className="text-[8px] text-ink-muted">{review.contacts.length} contacts</span>
                )}
                {(review.decisions?.length || 0) > 0 && (
                  <span className="text-[8px] text-ink-muted">{review.decisions.length} decisions</span>
                )}
                {(review.principles?.length || 0) > 0 && (
                  <span className="text-[8px] text-ink-muted">{review.principles.length} principles</span>
                )}
                {(review.beliefs?.length || 0) > 0 && (
                  <span className="text-[8px] text-ink-muted">{review.beliefs.length} beliefs</span>
                )}
                {(review.notes?.length || 0) > 0 && (
                  <span className="text-[8px] text-ink-muted">{review.notes.length} notes</span>
                )}
                <span className="text-[8px] text-ink-faint ml-auto">{totalItems} total</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
