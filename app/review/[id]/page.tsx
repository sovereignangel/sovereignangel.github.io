'use client'

import { use } from 'react'
import JournalReviewView from '@/components/thesis/review/JournalReviewView'

export default function PublicReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
        <JournalReviewView reviewId={id} publicMode />
      </div>
    </div>
  )
}
