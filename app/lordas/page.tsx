'use client'

import { useState, useEffect, useCallback } from 'react'
import { PinGate } from '@/components/lordas/PinGate'
import { DashboardHeader } from '@/components/lordas/DashboardHeader'
import { EmptyOutline } from '@/components/lordas/EmptyOutline'
import { SafetyPillar } from '@/components/lordas/SafetyPillar'
import { GrowthPillar } from '@/components/lordas/GrowthPillar'
import { AlignmentPillar } from '@/components/lordas/AlignmentPillar'
import { SessionTimeline } from '@/components/lordas/SessionTimeline'
import { TheorySection } from '@/components/lordas/TheorySection'
import type {
  RelationshipConversation,
  RelationshipTheme,
  RelationshipValue,
  RelationshipSnapshot,
} from '@/lib/types'

interface DashboardData {
  conversations: RelationshipConversation[]
  themes: RelationshipTheme[]
  values: RelationshipValue[]
  snapshots: RelationshipSnapshot[]
}

type Tab = 'dashboard' | 'theory'

export default function LordasPage() {
  const [pin, setPin] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('dashboard')

  // Check for stored PIN on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('lordas_pin')
    if (stored) setPin(stored)
  }, [])

  const fetchData = useCallback(async (pinValue: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/lordas/data?pin=${encodeURIComponent(pinValue)}`)
      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('lordas_pin')
          setPin(null)
          setError('Invalid PIN')
          return
        }
        throw new Error('Failed to load')
      }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pin) fetchData(pin)
  }, [pin, fetchData])

  const handlePin = (value: string) => {
    sessionStorage.setItem('lordas_pin', value)
    setPin(value)
  }

  if (!pin) {
    return <PinGate onSubmit={handlePin} error={error} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="text-[13px] font-serif uppercase tracking-[0.5px]" style={{ color: '#b85c38' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="text-[13px]" style={{ color: '#8c3d3d' }}>{error}</div>
      </div>
    )
  }

  const conversations = data?.conversations || []
  const themes = data?.themes || []
  const values = data?.values || []
  const snapshots = data?.snapshots || []

  const latest = conversations[0] || null
  const latestSnapshot = snapshots[0] || null

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <DashboardHeader
        latest={latest}
        snapshot={latestSnapshot}
        conversationCount={conversations.length}
      />

      {/* Tab nav */}
      <div className="flex gap-4 mt-4 border-b" style={{ borderColor: '#d8cfc4' }}>
        {(['dashboard', 'theory'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-serif text-[14px] pb-2 transition-colors"
            style={{
              color: tab === t ? '#b85c38' : '#8a7e72',
              fontWeight: tab === t ? 600 : 400,
              borderBottom: tab === t ? '2px solid #b85c38' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t === 'dashboard' ? 'Dashboard' : 'Theory & Application'}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {tab === 'theory' ? (
          <TheorySection conversations={conversations} />
        ) : conversations.length === 0 ? (
          <EmptyOutline />
        ) : (
          <>
            <SafetyPillar conversations={conversations} />
            <GrowthPillar conversations={conversations} />
            <AlignmentPillar
              conversations={conversations}
              themes={themes}
              values={values}
            />
            <SessionTimeline conversations={conversations} />
          </>
        )}
      </div>
    </div>
  )
}
