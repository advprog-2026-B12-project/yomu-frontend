export interface AchievementProgress {
  achievementId: string
  name: string
  description: string
  iconUrl: string | null
  points: number
  milestone: number
  eventType: string
  currentProgress: number
  isUnlocked: boolean
  isDisplayed: boolean
  unlockedAt: string | null
}

export interface AchievementResponse {
  id: string
  name: string
  description: string
  iconUrl: string | null
  points: number
  milestone: number
  eventType: string
  createdAt: string
  updatedAt: string
}

export interface AchievementRequest {
  name: string
  description: string
  iconUrl?: string
  points: number
  milestone: number
  eventType: string
}

export interface UserAchievementResponse {
  id: string
  userId: string
  achievementId: string
  achievementName: string
  currentProgress: number
  isUnlocked: boolean
  isDisplayed: boolean
  unlockedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface EventTriggerResponse {
  unlockedAchievements: AchievementProgress[]
  completedDailyMissions: string[]
}

export interface DailyMission {
  id: string
  name: string
  description: string
  milestone: number
  eventType: string
  isActive: boolean
}

export interface DailyMissionResponse {
  id: string
  name: string
  description: string
  milestone: number
  eventType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DailyMissionRequest {
  name: string
  description: string
  milestone: number
  eventType: string
  isActive: boolean
}

export interface UserDailyMission {
  id: string
  userId: string
  dailyMission: DailyMission
  dateAssigned: string
  currentProgress: number
  isCompleted: boolean
  completedAt: string | null
}

export const ACHIEVEMENT_EVENT_TYPES = [
  "READING_COMPLETED",
  "QUIZ_FINISHED",
  "PERFECT_QUIZ_SCORE",
  "CLAN_PROMOTION",
  "LOGIN_STREAK",
] as const

export type AchievementEventType = (typeof ACHIEVEMENT_EVENT_TYPES)[number]
