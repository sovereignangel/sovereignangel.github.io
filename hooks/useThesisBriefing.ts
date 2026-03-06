'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import type { ThesisBriefing } from '@/lib/types/overnight'

export function useThesisBriefing() {
  const { user } = useAuth()
  const [briefing, setBriefing] = useState<ThesisBriefing | null>(null)
  const [recentBriefings, setRecentBriefings] = useState<ThesisBriefing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    async function load() {
      setLoading(true)

      // Fetch today's briefing
      const todayRef = doc(db, 'users', user!.uid, 'thesis_briefings', dateStr)
      const todaySnap = await getDoc(todayRef)
      if (todaySnap.exists()) {
        setBriefing({ id: todaySnap.id, ...todaySnap.data() } as ThesisBriefing)
      }

      // Fetch recent briefings
      const q = query(
        collection(db, 'users', user!.uid, 'thesis_briefings'),
        orderBy('date', 'desc'),
        limit(7)
      )
      const snap = await getDocs(q)
      setRecentBriefings(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ThesisBriefing))

      setLoading(false)
    }

    load()
  }, [user])

  return { briefing, recentBriefings, loading }
}
