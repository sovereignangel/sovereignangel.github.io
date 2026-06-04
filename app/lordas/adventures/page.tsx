'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { AdventuresView } from '@/components/lordas/AdventuresView'
import type { SummerPlan, AdventureComment, RelationalSpeaker } from '@/lib/types'

const LORDAS_PIN = '1234'

export default function AdventuresPage() {
  const [pin, setPin] = useState<string | null>(null)
  const [summerPlan, setSummerPlan] = useState<SummerPlan | null>(null)
  const [comments, setComments] = useState<AdventureComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setSummerPlan(json.summerPlan || null)
      setComments(json.adventureComments || [])
    } catch {
      setError('Failed to load adventures')
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

  if (!pin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="text-center">
          <h1 className="font-serif text-[20px] font-semibold tracking-[0.5px] mb-4" style={{ color: '#b85c38' }}>
            Adventures
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const input = e.currentTarget.querySelector('input') as HTMLInputElement
              handlePin(input.value)
            }}
            className="space-y-3"
          >
            <input
              type="password"
              placeholder="PIN"
              className="block mx-auto w-[120px] text-center text-[14px] font-mono py-2 px-3 rounded-sm border"
              style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4', color: '#2a2420' }}
              autoFocus
            />
            <button
              type="submit"
              className="font-serif text-[11px] font-medium px-4 py-1.5 rounded-sm border"
              style={{ backgroundColor: '#b85c38', color: '#faf7f2', borderColor: '#b85c38' }}
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    )
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
        <div className="text-[13px]" style={{ color: '#8c3d3d' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <AdventuresView summerPlan={summerPlan} comments={comments} onAddComment={handleAddComment} />
    </div>
  )
}
