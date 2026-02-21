import { Timestamp } from './shared'

export interface UserSettings {
  dailyReminder: string
  weeklyReminder: string
  focusHoursPerDay: number
  revenueAskQuotaPerDay: number
  sleepTarget: number
  maxProjects: number
  twentyFourHourRuleActive: boolean
  telegramChatId?: string
}

export interface UserProfile {
  name: string
  email: string
  profilePictureUrl: string
  timezone: string
  spineProject: string
  thesisStatement: string
  settings: UserSettings
  createdAt: Timestamp
  updatedAt: Timestamp
}
