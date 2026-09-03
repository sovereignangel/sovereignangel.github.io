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
  sleepDurationMinutes?: number | null
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
  vo2max?: number | null
  weightKg?: number | null
  enduranceScore?: number | null
  intensityMinutes?: number | null
  syncedAt: Timestamp
}

export interface GarminActivity {
  id?: string
  activityId: number
  name: string | null
  type: string
  date: string | null
  startTimeLocal: string | null
  durationSeconds: number | null
  /**
   * Time actually spent moving, in seconds — Garmin's `movingDuration`.
   *
   * Apart from `durationSeconds` exactly where a pace model needs them apart.
   * A pool set of 20x100 off a minute is 64 minutes of timer and 44 minutes of
   * swimming; dividing distance by the first says you swam a third slower than
   * you did. Elapsed still measures the session — volume, compliance, load —
   * and this measures the speed. Null on anything synced before the field was
   * pulled, where elapsed is the only number there has ever been.
   */
  movingDurationSeconds: number | null
  distanceMeters: number | null
  calories: number | null
  averageHr: number | null
  maxHr: number | null
  averageSpeed: number | null
  elevationGain: number | null
  aerobicTrainingEffect: number | null
  anaerobicTrainingEffect: number | null
  trainingLoad: number | null
  vo2max: number | null
  locationName: string | null
  source: string
  syncedAt: Timestamp
}
