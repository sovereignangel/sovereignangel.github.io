'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { saveExplorationRoute, getExplorationRoutes, deleteExplorationRoute } from '@/lib/firestore'
import type { GeneratedRoute } from '@/lib/types'

interface ExplorationControlsProps {
  route: GeneratedRoute | null
  onRouteGenerated: (route: GeneratedRoute) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

const DISTANCE_PRESETS = [
  { value: 3, label: '3k' },
  { value: 5, label: '5k' },
  { value: 8, label: '8k' },
  { value: 10, label: '10k' },
  { value: 15, label: '15k' },
  { value: 21, label: 'Half' },
]

const SHAPE_SUGGESTIONS = [
  'Star', 'Heart', 'Dog', 'Spiral',
  'Lightning bolt', 'Treble clef', 'Infinity symbol', 'Cat',
]

export default function ExplorationControls({
  route,
  onRouteGenerated,
  loading,
  setLoading,
  error,
  setError,
}: ExplorationControlsProps) {
  const { user } = useAuth()
  const [location, setLocation] = useState('')
  const [distance, setDistance] = useState(5)
  const [shapePrompt, setShapePrompt] = useState('')
  const [savedRoutes, setSavedRoutes] = useState<GeneratedRoute[]>([])
  const [saving, setSaving] = useState(false)

  // Load saved routes
  useEffect(() => {
    if (!user?.uid) return
    getExplorationRoutes(user.uid, 10).then(setSavedRoutes).catch(console.error)
  }, [user?.uid])

  const handleGenerate = async () => {
    if (!location || !shapePrompt) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/exploration/generate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          distanceKm: distance,
          shapePrompt,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate route')
      }

      const generatedRoute: GeneratedRoute = await res.json()
      onRouteGenerated(generatedRoute)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.uid || !route) return
    setSaving(true)
    try {
      await saveExplorationRoute(user.uid, route)
      const updated = await getExplorationRoutes(user.uid, 10)
      setSavedRoutes(updated)
    } catch (err) {
      console.error('Failed to save route:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (routeId: string) => {
    if (!user?.uid) return
    try {
      await deleteExplorationRoute(user.uid, routeId)
      setSavedRoutes(prev => prev.filter(r => r.id !== routeId))
    } catch (err) {
      console.error('Failed to delete route:', err)
    }
  }

  const handleLoadRoute = (savedRoute: GeneratedRoute) => {
    onRouteGenerated(savedRoute)
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="mb-3 pb-1.5 border-b-2 border-rule">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-ink">
          Route Composer
        </h2>
      </div>

      {/* Location */}
      <div className="mb-3">
        <label className="font-serif text-[9px] font-medium uppercase tracking-[0.5px] text-ink-muted block mb-1">
          Starting Location
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Williamsburg, Brooklyn"
          className="w-full bg-white border border-rule rounded-sm px-2 py-1.5 font-mono text-[11px] text-ink placeholder:text-ink-faint focus:border-ink-muted focus:outline-none"
        />
      </div>

      {/* Distance */}
      <div className="mb-3">
        <label className="font-serif text-[9px] font-medium uppercase tracking-[0.5px] text-ink-muted block mb-1">
          Distance
        </label>
        <div className="flex flex-wrap gap-1">
          {DISTANCE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setDistance(preset.value)}
              className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                distance === preset.value
                  ? 'bg-navy text-paper border-navy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value) || 1)}
            min={1}
            max={50}
            className="w-16 bg-white border border-rule rounded-sm px-2 py-1 font-mono text-[10px] text-ink focus:border-ink-muted focus:outline-none"
          />
          <span className="font-mono text-[9px] text-ink-muted">km</span>
        </div>
      </div>

      {/* Shape Prompt */}
      <div className="mb-3">
        <label className="font-serif text-[9px] font-medium uppercase tracking-[0.5px] text-ink-muted block mb-1">
          Shape
        </label>
        <textarea
          value={shapePrompt}
          onChange={(e) => setShapePrompt(e.target.value)}
          placeholder="A star, Yoda's head, lightning bolt..."
          rows={2}
          className="w-full bg-white border border-rule rounded-sm px-2 py-1.5 font-mono text-[11px] text-ink placeholder:text-ink-faint focus:border-ink-muted focus:outline-none resize-none"
        />
        <div className="flex flex-wrap gap-1 mt-1">
          {SHAPE_SUGGESTIONS.map((shape) => (
            <button
              key={shape}
              onClick={() => setShapePrompt(shape)}
              className={`font-mono text-[8px] px-1.5 py-0.5 rounded-sm border transition-colors ${
                shapePrompt === shape
                  ? 'bg-navy text-paper border-navy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {shape}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !location || !shapePrompt}
        className="w-full font-serif text-[11px] font-medium py-2 px-2 rounded-sm border bg-navy text-paper border-navy hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-3"
      >
        {loading ? 'Generating...' : 'Generate Route'}
      </button>

      {/* Error */}
      {error && (
        <div className="mb-3 px-2 py-1.5 bg-red-bg border border-red-ink/20 rounded-sm">
          <p className="font-mono text-[10px] text-red-ink">{error}</p>
        </div>
      )}

      {/* Route Stats */}
      {route && (
        <div className="mb-3 bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted mb-2">
            Route Details
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="font-serif text-[8px] text-ink-muted block">Distance</span>
              <span className="font-mono text-[12px] font-semibold text-ink">
                {route.actualDistanceKm.toFixed(1)}k
              </span>
            </div>
            <div>
              <span className="font-serif text-[8px] text-ink-muted block">Time</span>
              <span className="font-mono text-[12px] font-semibold text-ink">
                ~{Math.round(route.estimatedMinutes)}m
              </span>
            </div>
            <div>
              <span className="font-serif text-[8px] text-ink-muted block">Target</span>
              <span className="font-mono text-[12px] font-semibold text-ink">
                {route.targetDistanceKm}k
              </span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-2 font-serif text-[9px] font-medium py-1.5 px-2 rounded-sm border border-rule text-ink-muted hover:border-ink-faint hover:text-ink transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Route'}
          </button>
        </div>
      )}

      {/* Saved Routes History */}
      {savedRoutes.length > 0 && (
        <div className="mt-auto">
          <div className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted mb-1.5">
            Saved Routes
          </div>
          <div className="space-y-0">
            {savedRoutes.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center justify-between py-1.5 border-b border-rule-light group"
              >
                <button
                  onClick={() => handleLoadRoute(saved)}
                  className="flex-1 text-left"
                >
                  <span className="font-mono text-[10px] font-medium text-ink hover:text-navy transition-colors">
                    {saved.shapePrompt}
                  </span>
                  <span className="font-mono text-[8px] text-ink-muted ml-1.5">
                    {saved.actualDistanceKm.toFixed(1)}k
                  </span>
                </button>
                <button
                  onClick={() => saved.id && handleDelete(saved.id)}
                  className="font-mono text-[8px] text-ink-faint hover:text-red-ink transition-colors opacity-0 group-hover:opacity-100 ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
