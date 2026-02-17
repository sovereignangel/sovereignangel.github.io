'use client'

import { useState, useRef, useEffect } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { GeneratedRoute } from '@/lib/types'

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

export default function FunRouteBuilder() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapboxgl, setMapboxgl] = useState<typeof import('mapbox-gl') | null>(null)

  const [location, setLocation] = useState('')
  const [distance, setDistance] = useState(5)
  const [shapePrompt, setShapePrompt] = useState('')
  const [route, setRoute] = useState<GeneratedRoute | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dynamically import mapbox-gl (client-side only)
  useEffect(() => {
    import('mapbox-gl').then((mb) => {
      setMapboxgl(mb)
    })
  }, [])

  // Initialize map once mapbox-gl is loaded
  useEffect(() => {
    if (!mapboxgl || !mapContainer.current || mapRef.current) return

    const mb = mapboxgl.default || mapboxgl
    mb.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    mapRef.current = new mb.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.9572, 40.7214],
      zoom: 13,
    })

    mapRef.current.on('load', () => setMapLoaded(true))
    mapRef.current.addControl(new mb.NavigationControl(), 'top-left')

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [mapboxgl])

  // Draw route on map
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !route || !mapboxgl) return

    const m = mapRef.current
    const mb = mapboxgl.default || mapboxgl

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Remove existing layers/sources
    if (m.getSource('route')) {
      m.removeLayer('route-line')
      m.removeSource('route')
    }
    if (m.getSource('shape-ghost')) {
      m.removeLayer('shape-ghost-line')
      m.removeSource('shape-ghost')
    }

    // Shape ghost outline
    m.addSource('shape-ghost', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: route.shapeOutline },
      },
    })
    m.addLayer({
      id: 'shape-ghost-line',
      type: 'line',
      source: 'shape-ghost',
      paint: {
        'line-color': '#1a1a1a',
        'line-width': 1.5,
        'line-dasharray': [4, 4],
        'line-opacity': 0.2,
      },
    })

    // Snapped route
    m.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: route.routeCoordinates },
      },
    })
    m.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#1a1a1a',
        'line-width': 3,
        'line-opacity': 0.8,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    })

    // Start marker
    const startCoord = route.routeCoordinates[0]
    const marker = new mb.Marker({ color: '#1a1a1a' })
      .setLngLat(startCoord as [number, number])
      .setPopup(new mb.Popup({ offset: 25 }).setText('Start / Finish'))
      .addTo(m)
    markersRef.current.push(marker)

    // Fit bounds
    const bounds = new mb.LngLatBounds()
    route.routeCoordinates.forEach((coord: number[]) => {
      bounds.extend(coord as [number, number])
    })
    m.fitBounds(bounds, { padding: 60, duration: 1000 })
  }, [route, mapLoaded, mapboxgl])

  const handleGenerate = async () => {
    if (!location || !shapePrompt) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/exploration/generate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, distanceKm: distance, shapePrompt }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate route')
      }

      const generatedRoute: GeneratedRoute = await res.json()
      setRoute(generatedRoute)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p className="text-[#555] text-[15px] mb-5">
        Generate running routes shaped like artwork. Pick a location, distance, and shape — the AI traces it onto real streets.
      </p>

      {/* Controls */}
      <div className="flex flex-col gap-4 mb-5">
        {/* Location */}
        <div>
          <label className="text-[13px] text-[#888] block mb-1">Starting Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Williamsburg, Brooklyn"
            className="w-full border border-[#ddd] rounded px-3 py-2 text-[15px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-[#999] focus:outline-none"
          />
        </div>

        {/* Distance */}
        <div>
          <label className="text-[13px] text-[#888] block mb-1">Distance</label>
          <div className="flex flex-wrap gap-2">
            {DISTANCE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setDistance(preset.value)}
                className={`text-[13px] px-3 py-1.5 rounded border transition-colors ${
                  distance === preset.value
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-white text-[#666] border-[#ddd] hover:border-[#999]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shape */}
        <div>
          <label className="text-[13px] text-[#888] block mb-1">Shape</label>
          <input
            type="text"
            value={shapePrompt}
            onChange={(e) => setShapePrompt(e.target.value)}
            placeholder="A star, Yoda's head, lightning bolt..."
            className="w-full border border-[#ddd] rounded px-3 py-2 text-[15px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-[#999] focus:outline-none mb-2"
          />
          <div className="flex flex-wrap gap-1.5">
            {SHAPE_SUGGESTIONS.map((shape) => (
              <button
                key={shape}
                onClick={() => setShapePrompt(shape)}
                className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                  shapePrompt === shape
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-white text-[#888] border-[#eee] hover:border-[#ccc]'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={loading || !location || !shapePrompt}
          className="w-full text-[15px] font-medium py-2.5 rounded bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Route'}
        </button>

        {error && (
          <p className="text-[13px] text-red-600">{error}</p>
        )}
      </div>

      {/* Route Stats */}
      {route && (
        <div className="flex gap-6 mb-4 py-3 px-4 bg-gradient-to-br from-[#f8f9fa] to-white border-l-[3px] border-[#1a1a1a] rounded-r">
          <div>
            <span className="text-[11px] text-[#888] block">Distance</span>
            <span className="text-[17px] font-semibold text-[#1a1a1a]">
              {route.actualDistanceKm.toFixed(1)} km
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#888] block">Time</span>
            <span className="text-[17px] font-semibold text-[#1a1a1a]">
              ~{Math.round(route.estimatedMinutes)} min
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#888] block">Target</span>
            <span className="text-[17px] font-semibold text-[#1a1a1a]">
              {route.targetDistanceKm} km
            </span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="w-full h-[400px] border border-[#eee] rounded overflow-hidden relative">
        <div ref={mapContainer} className="absolute inset-0" />
        {!route && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[15px] italic text-[#ccc]">
              Generate a route to see it here
            </p>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/60">
            <p className="text-[15px] text-[#888]">
              Generating your route...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
