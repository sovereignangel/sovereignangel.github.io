'use client'

import JournalReviewView from '@/components/thesis/review/JournalReviewView'

export default function ReviewPage({ params }: { params: { id: string } }) {
  return <JournalReviewView reviewId={params.id} />
}
