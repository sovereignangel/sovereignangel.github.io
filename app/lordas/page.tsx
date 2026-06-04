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
import { AdventuresView } from '@/components/lordas/AdventuresView'
import type {
  RelationshipConversation,
  RelationshipTheme,
  RelationshipValue,
  RelationshipSnapshot,
  SummerPlan,
  AdventureComment,
  RelationalSpeaker,
} from '@/lib/types'

interface DashboardData {
  conversations: RelationshipConversation[]
  themes: RelationshipTheme[]
  values: RelationshipValue[]
  snapshots: RelationshipSnapshot[]
  summerPlan?: SummerPlan
  adventureComments?: AdventureComment[]
}

type Tab = 'dashboard' | 'theory' | 'adventures'

export default function LordasPage() {
  const [pin, setPin] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [mounted, setMounted] = useState(false)

  // Check for stored PIN on mount
  useEffect(() => {
    setMounted(true)
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

  if (!mounted || !pin) {
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
  const summerPlan = data?.summerPlan || null
  const adventureComments = data?.adventureComments || []

  const latest = conversations[0] || null
  const latestSnapshot = snapshots[0] || null

  const handleAddComment = async (author: RelationalSpeaker, text: string) => {
    try {
      const res = await fetch(`/api/lordas/adventures/comments?pin=${encodeURIComponent(pin!)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text }),
      })
      if (!res.ok) throw new Error('Failed to post comment')
      await fetchData(pin!)
    } catch (err) {
      console.error('Error posting comment:', err)
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <DashboardHeader
        latest={latest}
        snapshot={latestSnapshot}
        conversationCount={conversations.length}
      />

      {/* Section toggle: Connection Insights vs Adventures */}
      <div className="flex gap-3 mt-6 mb-6">
        <button
          onClick={() => setTab('dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border transition-colors"
          style={{
            backgroundColor: tab === 'dashboard' ? '#b85c38' : 'transparent',
            color: tab === 'dashboard' ? '#faf7f2' : '#8a7e72',
            borderColor: tab === 'dashboard' ? '#b85c38' : '#d8cfc4',
          }}
        >
          {/* Circle + T logo */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="8" cy="8" r="7" />
            <path d="M8 3 L8 10 M5 4 L11 4" />
          </svg>
          <span className="font-serif text-[12px] font-semibold">Connection Insights</span>
        </button>

        <button
          onClick={() => setTab('adventures')}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border transition-colors"
          style={{
            backgroundColor: tab === 'adventures' ? '#b85c38' : 'transparent',
            color: tab === 'adventures' ? '#faf7f2' : '#8a7e72',
            borderColor: tab === 'adventures' ? '#b85c38' : '#d8cfc4',
          }}
        >
          {/* Kite icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M8 1 L13 6 L8 13 L3 6 Z" />
            <path d="M8 1 L8 13 M3 6 L13 6" />
          </svg>
          <span className="font-serif text-[12px] font-semibold">Adventures</span>
        </button>
      </div>

      {/* Sub-tabs for Connection Insights */}
      {tab === 'dashboard' && (
        <div className="flex gap-4 mt-4 border-b" style={{ borderColor: '#d8cfc4' }}>
          {(['dashboard', 'theory'] as const).map((t) => (
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
      )}

      <div className="mt-6 space-y-6">
        {tab === 'adventures' ? (
          <AdventuresView
            summerPlan={summerPlan}
            comments={adventureComments}
            onAddComment={handleAddComment}
          />
        ) : tab === 'theory' ? (
          <TheorySection conversations={conversations} />
        ) : tab === 'dashboard' ? (
          conversations.length === 0 ? (
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
          )
        ) : null}
      </div>
    </div>
  )
}
