export interface ScavengerHuntEntry {
  id: string
  description: string
  createdAt: string // ISO date-time
  date: string // YYYY-MM-DD
  pointsValue: number // default 1 point = 1 minute
  redeemed: boolean
}

export interface ScavengerHuntRedemption {
  id: string
  pointsRedeemed: number
  description: string
  createdAt: string // ISO date-time
  date: string // YYYY-MM-DD
}

export interface ScavengerHuntStats {
  totalPoints: number
  totalRedeemed: number
  availablePoints: number
  entriesByDay: Record<string, ScavengerHuntEntry[]>
  redemptions: ScavengerHuntRedemption[]
}
