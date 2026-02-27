'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import type { JournalReview } from '@/lib/types'

export function usePendingReviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<JournalReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setReviews([])
      setLoading(false)
      return
    }

    const ref = collection(db, 'users', user.uid, 'journal_reviews')
    const q = query(ref, where('status', '==', 'pending'))

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }) as JournalReview)
      setReviews(items)
      setLoading(false)
    })

    return unsub
  }, [user])

  return { reviews, count: reviews.length, loading }
}
