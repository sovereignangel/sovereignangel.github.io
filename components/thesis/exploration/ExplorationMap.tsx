'use client'

import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { GeneratedRoute } from '@/lib/types'

interface ExplorationMapProps {
  route: GeneratedRoute | null
}

export default function ExplorationMap({ route }: ExplorationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.9572, 40.7214], // Default: Williamsburg
      zoom: 13,
    })

    map.current.on('load', () => setMapLoaded(true))
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Draw route when it changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !route) return

    const m = map.current

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

    // Add shape ghost outline (ideal shape before road-snapping)
    m.addSource('shape-ghost', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route.shapeOutline,
        },
      },
    })
    m.addLayer({
      id: 'shape-ghost-line',
      type: 'line',
      source: 'shape-ghost',
      paint: {
        'line-color': '#7c2d2d',
        'line-width': 1.5,
        'line-dasharray': [4, 4],
        'line-opacity': 0.3,
      },
    })

    // Add snapped route
    m.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route.routeCoordinates,
        },
      },
    })
    m.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#7c2d2d',
        'line-width': 3,
        'line-opacity': 0.85,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
    })

    // Start/finish marker
    const startCoord = route.routeCoordinates[0]
    const marker = new mapboxgl.Marker({ color: '#2d5f3f' })
      .setLngLat(startCoord as [number, number])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Start / Finish'))
      .addTo(m)
    markersRef.current.push(marker)

    // Fit map to route bounds
    const bounds = new mapboxgl.LngLatBounds()
    route.routeCoordinates.forEach((coord: number[]) => {
      bounds.extend(coord as [number, number])
    })
    m.fitBounds(bounds, { padding: 60, duration: 1000 })
  }, [route, mapLoaded])

  return (
    <div className="h-full flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Route Canvas
        </h3>
        {route && (
          <span className="font-mono text-[10px] text-ink-muted">
            {route.actualDistanceKm.toFixed(1)} km &middot; ~{Math.round(route.estimatedMinutes)} min
          </span>
        )}
      </div>
      <div className="bg-paper border border-rule rounded-sm flex-1 overflow-hidden relative">
        <div ref={mapContainer} className="absolute inset-0" />
        {!route && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="font-serif text-[13px] italic text-ink-faint">
              Generate a route to see it here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
