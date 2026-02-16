import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  scaleToRealWorld,
  ensureClosedLoop,
  subsampleWaypoints,
  type ShapeWaypoint,
} from '@/lib/route-art'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export async function POST(req: NextRequest) {
  try {
    const { location, distanceKm, shapePrompt } = await req.json()

    if (!location || !distanceKm || !shapePrompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Step 1: Geocode location
    const center = await geocodeLocation(location)
    if (!center) {
      return NextResponse.json({ error: 'Could not find that location' }, { status: 400 })
    }

    // Step 2: Generate shape waypoints via Gemini
    const rawWaypoints = await generateShapeWaypoints(shapePrompt)
    if (!rawWaypoints || rawWaypoints.length < 3) {
      return NextResponse.json({ error: 'Could not generate shape — try a simpler prompt' }, { status: 500 })
    }

    // Ensure closed loop + subsample to Mapbox limit
    const closedWaypoints = ensureClosedLoop(rawWaypoints)
    const waypoints = subsampleWaypoints(closedWaypoints, 25)

    // Step 3: Scale to real-world coordinates
    let scaled = scaleToRealWorld(waypoints, center, distanceKm)

    // Step 4: Snap to roads
    let routeResult = await snapToRoads(scaled)

    // Step 5: Distance refinement (one iteration)
    const ratio = distanceKm / routeResult.distanceKm
    if (Math.abs(ratio - 1.0) > 0.05) {
      const adjustedDistance = distanceKm * ratio
      scaled = scaleToRealWorld(waypoints, center, adjustedDistance)
      routeResult = await snapToRoads(scaled)
    }

    return NextResponse.json({
      shapePrompt,
      location,
      targetDistanceKm: distanceKm,
      actualDistanceKm: routeResult.distanceKm,
      estimatedMinutes: routeResult.durationMinutes,
      center,
      routeCoordinates: routeResult.coordinates,
      shapeOutline: scaled.map(w => [w.lng, w.lat]),
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Route generation error:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to generate route' },
      { status: 500 }
    )
  }
}

async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
  const res = await fetch(url)
  const data = await res.json()

  if (!data.features || data.features.length === 0) return null

  const [lng, lat] = data.features[0].center
  return { lat, lng }
}

async function generateShapeWaypoints(shapePrompt: string): Promise<ShapeWaypoint[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a computational geometry engine. Given a shape description, generate ordered waypoints that trace the OUTLINE of that shape.

SHAPE: "${shapePrompt}"

Requirements:
1. Return 15-25 waypoints as normalized coordinates where x and y are between 0 and 1
2. The waypoints must trace the OUTLINE of the shape in order (clockwise)
3. The shape must be a CLOSED LOOP — the last waypoint should be very close to the first
4. Space waypoints more densely in areas with fine detail (curves, corners)
5. Space waypoints more sparsely in straight sections
6. The shape should be recognizable when the waypoints are connected with straight lines
7. Center the shape roughly around (0.5, 0.5)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "waypoints": [
    {"x": 0.5, "y": 0.1},
    {"x": 0.7, "y": 0.3}
  ]
}

Be creative but ensure the outline is runnable as a continuous path with no overlapping segments.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  const cleanedText = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const parsed = JSON.parse(cleanedText)
  return parsed.waypoints || []
}

interface RouteResult {
  coordinates: number[][]
  distanceKm: number
  durationMinutes: number
}

async function snapToRoads(waypoints: { lat: number; lng: number }[]): Promise<RouteResult> {
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';')

  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?` +
    `access_token=${MAPBOX_TOKEN}` +
    `&geometries=geojson` +
    `&overview=full` +
    `&steps=false`

  const res = await fetch(url)
  const data = await res.json()

  if (!data.routes || data.routes.length === 0) {
    throw new Error('Could not find a walking route for this shape in this area')
  }

  const route = data.routes[0]

  return {
    coordinates: route.geometry.coordinates,
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
  }
}
