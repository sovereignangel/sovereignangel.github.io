'use client'

/**
 * The Lordas root — Goals, Insights and Scheming.
 *
 * Exec and Ironman are their own routes; these three are tab state on one
 * page because they share a single fetch. One header, one nav, and each tab
 * states its own job before the cards start.
 */

import { useState, useEffect, useCallback } from 'react'
import { PinGate } from '@/components/lordas/PinGate'
import { PersonPicker, PersonSwitch } from '@/components/lordas/PersonPicker'
import { LordasHeader, type LordasModule } from '@/components/lordas/design/Nav'
import { C } from '@/components/lordas/design/tokens'
import { SafetyPillar } from '@/components/lordas/SafetyPillar'
import { GrowthPillar } from '@/components/lordas/GrowthPillar'
import { AlignmentPillar } from '@/components/lordas/AlignmentPillar'
import { SessionTimeline } from '@/components/lordas/SessionTimeline'
import { TheorySection } from '@/components/lordas/TheorySection'
import { AdventuresView } from '@/components/lordas/AdventuresView'
import { GoalsView } from '@/components/lordas/GoalsView'
import { EmptyOutline } from '@/components/lordas/EmptyOutline'
import type {
  RelationshipConversation, RelationshipTheme, RelationshipValue, RelationshipSnapshot,
  SummerPlan, AdventureComment, RelationalSpeaker, LordasGoalsData, LordasPerson,
} from '@/lib/types'

interface DashboardData {
  conversations: RelationshipConversation[]
  themes: RelationshipTheme[]
  values: RelationshipValue[]
  snapshots: RelationshipSnapshot[]
  summerPlan?: SummerPlan
  adventureComments?: AdventureComment[]
  goals?: LordasGoalsData
}

type RootTab = Extract<LordasModule, 'goals' | 'insights' | 'scheming'>

const SUBTITLE: Record<RootTab, string> = {
  goals: 'Who we are each becoming',
  insights: 'What the relationship is doing',
  scheming: 'Where we are going next',
}

export default function LordasPage() {
  const [pin, setPin] = useState<string | null>(null)
  const [person, setPerson] = useState<LordasPerson | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<RootTab>('goals')
  const [theory, setTheory] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = sessionStorage.getItem('lordas_pin')
    if (stored) setPin(stored)
    const p = localStorage.getItem('lordas_person')
    if (p === 'lori' || p === 'aidas') setPerson(p)
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
      setData(await res.json())
    } catch {
      setError('Could not load — refresh to try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (pin) fetchData(pin) }, [pin, fetchData])

  const handlePin = (value: string) => {
    sessionStorage.setItem('lordas_pin', value)
    setPin(value)
  }
  const handlePerson = (p: LordasPerson) => {
    localStorage.setItem('lordas_person', p)
    setPerson(p)
  }

  const handleGoalsAction = useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      if (!pin || !person) return
      try {
        const res = await fetch(`/api/lordas/goals?pin=${encodeURIComponent(pin)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, person, ...payload }),
        })
        if (!res.ok) console.error('[lordas/goals]', res.status)
        await fetchData(pin)
      } catch (err) {
        console.error('Error running goals action:', err)
      }
    },
    [pin, person, fetchData]
  )

  const handleAddComment = async (author: RelationalSpeaker, text: string) => {
    if (!pin) return
    try {
      const res = await fetch(`/api/lordas/adventures/comments?pin=${encodeURIComponent(pin)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text }),
      })
      if (!res.ok) throw new Error('Failed to post comment')
      await fetchData(pin)
    } catch (err) {
      console.error('Error posting comment:', err)
    }
  }

  if (!mounted || !pin) return <PinGate onSubmit={handlePin} error={error} />
  if (!person) return <PersonPicker onSelect={handlePerson} />

  if (loading && !data) {
    return <div className="lordas-wrap"><div className="lordas-empty">Loading…</div></div>
  }

  const conversations = data?.conversations || []
  const themes = data?.themes || []
  const values = data?.values || []
  const summerPlan = data?.summerPlan || null
  const adventureComments = data?.adventureComments || []
  const goals = data?.goals || null

  return (
    <div className="lordas-wrap">
      <LordasHeader
        title={tab === 'goals' ? 'Goals' : tab === 'insights' ? 'Insights' : 'Scheming'}
        subtitle={SUBTITLE[tab]}
        current={tab}
        onSelect={(m) => {
          if (m === 'goals' || m === 'insights' || m === 'scheming') setTab(m)
        }}
        right={<PersonSwitch person={person} onChange={handlePerson} />}
      />

      {error && <div className="lordas-empty" style={{ color: C.crit, marginBottom: 14 }}>{error}</div>}

      {tab === 'goals' && (
        goals ? (
          <GoalsView goals={goals} person={person} onPersonChange={handlePerson} mutate={handleGoalsAction} />
        ) : (
          <div className="lordas-empty">Goals data unavailable. Refresh to try again.</div>
        )
      )}

      {tab === 'insights' && (
        conversations.length === 0 ? (
          <EmptyOutline />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {([['read', 'The read'], ['theory', 'Theory & application']] as const).map(([k, label]) => {
                const active = (k === 'theory') === theory
                return (
                  <button
                    key={k}
                    type="button"
                    className="lordas-chip"
                    onClick={() => setTheory(k === 'theory')}
                    style={{
                      cursor: 'pointer',
                      color: active ? C.ground : C.muted,
                      background: active ? C.accent : 'transparent',
                      borderColor: active ? C.accent : C.rule,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {theory ? (
              <TheorySection conversations={conversations} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <SafetyPillar conversations={conversations} />
                <GrowthPillar conversations={conversations} />
                <AlignmentPillar conversations={conversations} themes={themes} values={values} />
                <SessionTimeline conversations={conversations} />
              </div>
            )}
          </>
        )
      )}

      {tab === 'scheming' && (
        <AdventuresView summerPlan={summerPlan} comments={adventureComments} onAddComment={handleAddComment} />
      )}
    </div>
  )
}
