'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getAllUnifiedContacts,
  saveUnifiedContact,
  updateUnifiedContact,
  deleteUnifiedContact,
  decayAllContactWarmth,
} from '@/lib/firestore'
import type { UnifiedContact } from '@/lib/types'

/** Monday of the current week as YYYY-MM-DD */
function currentWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export function useContacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<UnifiedContact[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getAllUnifiedContacts(user.uid)
      setContacts(data)
    } catch (err) {
      console.error('useContacts: load failed', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    load().then(async () => {
      // Run weekly warmth decay passively after load
      try {
        await decayAllContactWarmth(user.uid)
        // Reload if decay may have changed data
        await load()
      } catch (err) {
        console.error('useContacts: decay failed', err)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const addContact = useCallback(async (
    data: Omit<UnifiedContact, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return
    await saveUnifiedContact(user.uid, {
      ...data,
      warmth: data.warmth ?? 'hot',
      tags: data.tags ?? [],
    })
    await load()
  }, [user, load])

  const updateContact = useCallback(async (
    contactId: string,
    data: Partial<UnifiedContact>
  ) => {
    if (!user) return
    await updateUnifiedContact(user.uid, contactId, data)
    await load()
  }, [user, load])

  const removeContact = useCallback(async (contactId: string) => {
    if (!user) return
    await deleteUnifiedContact(user.uid, contactId)
    await load()
  }, [user, load])

  // Weekly new contacts: created since Monday of this week
  const weekStart = currentWeekStart()
  const weeklyNewCount = contacts.filter(c => {
    if (!c.createdAt) return false
    try {
      const created = c.createdAt.toDate().toISOString().split('T')[0]
      return created >= weekStart
    } catch {
      return false
    }
  }).length

  // Reach-out queue: cool or cold contacts, cool before cold
  const dueContacts = contacts
    .filter(c => c.warmth === 'cool' || c.warmth === 'cold')
    .sort((a, b) => {
      const order = { cool: 0, cold: 1 }
      return (order[a.warmth as 'cool' | 'cold'] ?? 0) - (order[b.warmth as 'cool' | 'cold'] ?? 0)
        || a.canonicalName.localeCompare(b.canonicalName)
    })

  // All unique tags across contacts
  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags ?? []))).sort()

  return {
    contacts,
    loading,
    weeklyNewCount,
    weeklyGoal: 15,
    dueContacts,
    allTags,
    addContact,
    updateContact,
    removeContact,
    reload: load,
  }
}
