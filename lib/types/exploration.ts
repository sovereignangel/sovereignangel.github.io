import { Timestamp } from 'firebase/firestore'

export interface GeneratedRoute {
  id?: string
  shapePrompt: string
  location: string
  targetDistanceKm: number
  actualDistanceKm: number
  estimatedMinutes: number
  center: { lat: number; lng: number }
  routeCoordinates: number[][] // [lng, lat] pairs from Mapbox
  shapeOutline: number[][] // [lng, lat] pairs of the scaled ideal shape
  createdAt: string | Timestamp
  uid?: string
}

export interface RouteGenerationRequest {
  location: string
  distanceKm: number
  shapePrompt: string
}
