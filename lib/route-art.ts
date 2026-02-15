export interface ShapeWaypoint {
  x: number // 0-1 normalized
  y: number // 0-1 normalized
}

export interface RealWorldPoint {
  lat: number
  lng: number
}

/**
 * Estimate the perimeter-to-side ratio from actual waypoint geometry.
 * Used to size the bounding box so the route approximates the target distance.
 */
export function estimatePerimeterToSideRatio(waypoints: ShapeWaypoint[]): number {
  let perimeter = 0
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].x - waypoints[i - 1].x
    const dy = waypoints[i].y - waypoints[i - 1].y
    perimeter += Math.sqrt(dx * dx + dy * dy)
  }
  // Floor at 1.5 to prevent extreme scaling for simple shapes
  return Math.max(perimeter, 1.5)
}

/**
 * Convert normalized (0-1) shape waypoints to real-world lat/lng
 * centered on a given location, scaled to approximate a target distance.
 */
export function scaleToRealWorld(
  waypoints: ShapeWaypoint[],
  center: { lat: number; lng: number },
  distanceKm: number
): RealWorldPoint[] {
  const ratio = estimatePerimeterToSideRatio(waypoints)
  const sideLengthKm = distanceKm / ratio

  // 1 degree latitude ≈ 111 km
  // 1 degree longitude ≈ 111 × cos(lat) km
  const latPerKm = 1 / 111
  const lngPerKm = 1 / (111 * Math.cos(center.lat * Math.PI / 180))

  const latSpan = sideLengthKm * latPerKm
  const lngSpan = sideLengthKm * lngPerKm

  return waypoints.map(wp => ({
    lat: center.lat + (wp.y - 0.5) * latSpan,
    lng: center.lng + (wp.x - 0.5) * lngSpan,
  }))
}

/**
 * Ensure the waypoint path forms a closed loop.
 * If the first and last points aren't close, append the first point.
 */
export function ensureClosedLoop(waypoints: ShapeWaypoint[]): ShapeWaypoint[] {
  if (waypoints.length < 2) return waypoints
  const first = waypoints[0]
  const last = waypoints[waypoints.length - 1]
  const dist = Math.sqrt((first.x - last.x) ** 2 + (first.y - last.y) ** 2)
  if (dist > 0.02) {
    return [...waypoints, { ...first }]
  }
  return waypoints
}

/**
 * Subsample waypoints to fit within the Mapbox Directions API limit (25).
 * Preserves first/last points and samples evenly from the rest.
 */
export function subsampleWaypoints(waypoints: ShapeWaypoint[], maxPoints: number = 25): ShapeWaypoint[] {
  if (waypoints.length <= maxPoints) return waypoints

  const result: ShapeWaypoint[] = [waypoints[0]]
  const step = (waypoints.length - 1) / (maxPoints - 1)

  for (let i = 1; i < maxPoints - 1; i++) {
    const idx = Math.round(i * step)
    result.push(waypoints[idx])
  }

  result.push(waypoints[waypoints.length - 1])
  return result
}
