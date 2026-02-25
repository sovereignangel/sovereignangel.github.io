'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRecentDailyLogs, getDecisions, getPrinciples, getBeliefs } from '@/lib/firestore'
import type { Decision, Principle, Belief, DailyLog } from '@/lib/types'

export interface JournalEntry {
  time: string
  text: string
}

export interface LedgerDay {
  date: string
  entries: JournalEntry[]
  rewardScore: number | null
  decisions: Decision[]
  principles: Principle[]
  beliefs: Belief[]
  discoveryConversations: number
  focusHours: number | null
  whatShipped: string | null
}

/**
 * Parse a daily_logs.journalEntry string into individual timestamped entries.
 * Format: entries separated by `--- HH:MM AM/PM ---` delimiters.
 */
function parseJournalEntries(journalText: string): JournalEntry[] {
  if (!journalText?.trim()) return []

  // Split on the --- time --- delimiters
  const parts = journalText.split(/---\s*(.+?)\s*---/)
  const entries: JournalEntry[] = []

  // Pattern: [before_first_delimiter, time1, text1, time2, text2, ...]
  // If text starts without a delimiter, parts[0] has content with no time
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()
    if (!part) continue

    // Check if this part looks like a time (e.g., "9:15 AM", "2:30 PM")
    if (/^\d{1,2}:\d{2}\s*[AP]M$/i.test(part)) {
      const text = parts[i + 1]?.trim()
      if (text) {
        entries.push({ time: part, text })
        i++ // skip the text part since we consumed it
      }
    } else if (i === 0) {
      // Content before any delimiter — no timestamp
      entries.push({ time: '', text: part })
    }
  }

  // If no delimiters found, return the whole text as a single entry
  if (entries.length === 0 && journalText.trim()) {
    entries.push({ time: '', text: journalText.trim() })
  }

  return entries
}

export function useJournalLedger(uid: string | undefined, initialDays: number = 30) {
  const [days, setDays] = useState<LedgerDay[]>([])
  const [loading, setLoading] = useState(true)
  const [rangeDays, setRangeDays] = useState(initialDays)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)

    try {
      const [logs, allDecisions, allPrinciples, allBeliefs] = await Promise.all([
        getRecentDailyLogs(uid, rangeDays),
        getDecisions(uid),
        getPrinciples(uid),
        getBeliefs(uid),
      ])

      // Group decisions by decidedAt date
      const decisionsByDate = new Map<string, Decision[]>()
      for (const d of allDecisions) {
        const date = d.decidedAt
        if (!date) continue
        if (!decisionsByDate.has(date)) decisionsByDate.set(date, [])
        decisionsByDate.get(date)!.push(d)
      }

      // Group principles by dateFirstApplied
      const principlesByDate = new Map<string, Principle[]>()
      for (const p of allPrinciples) {
        const date = p.dateFirstApplied
        if (!date) continue
        if (!principlesByDate.has(date)) principlesByDate.set(date, [])
        principlesByDate.get(date)!.push(p)
      }

      // Group beliefs by sourceJournalDate
      const beliefsByDate = new Map<string, Belief[]>()
      for (const b of allBeliefs) {
        const date = b.sourceJournalDate
        if (!date) continue
        if (!beliefsByDate.has(date)) beliefsByDate.set(date, [])
        beliefsByDate.get(date)!.push(b)
      }

      // Build ledger days — only include days with journal entries
      const ledgerDays: LedgerDay[] = logs
        .filter((log: DailyLog) => log.journalEntry?.trim())
        .map((log: DailyLog) => ({
          date: log.date,
          entries: parseJournalEntries(log.journalEntry || ''),
          rewardScore: log.rewardScore?.score ?? null,
          decisions: decisionsByDate.get(log.date) || [],
          principles: principlesByDate.get(log.date) || [],
          beliefs: beliefsByDate.get(log.date) || [],
          discoveryConversations: log.discoveryConversationsCount || 0,
          focusHours: log.focusHoursActual || null,
          whatShipped: log.whatShipped || null,
        }))

      setDays(ledgerDays)
    } catch (err) {
      console.error('Journal ledger fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [uid, rangeDays])

  useEffect(() => { refresh() }, [refresh])

  const loadMore = useCallback(() => {
    setRangeDays(prev => prev + 30)
  }, [])

  return { days, loading, loadMore, rangeDays }
}
