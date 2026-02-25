import { Timestamp } from './shared'

export interface FocusSession {
  id?: string
  projectId: string
  startTime: Timestamp
  endTime: Timestamp | null
  durationMinutes: number
  notes: string
  createdAt: Timestamp
}

export interface GarminMetrics {
  id?: string
  date: string
  source: string
  restingHeartRate: number | null
  hrvRmssd: number | null
  hrvWeeklyAvg: number | null
  sleepScore: number | null
  deepSleepMinutes: number | null
  lightSleepMinutes: number | null
  remSleepMinutes: number | null
  awakeMinutes: number | null
  steps: number | null
  activeCalories: number | null
  stressLevel: number | null
  bodyBattery: number | null
  bodyBatteryCurrent: number | null
  bodyBatteryCharged: number | null
  bodyBatteryDrained: number | null
  respirationRate: number | null
  spo2: number | null
  syncedAt: Timestamp
}
