'use client'

import { use } from 'react'
import JournalReviewView from '@/components/thesis/review/JournalReviewView'

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <JournalReviewView reviewId={id} />
}
