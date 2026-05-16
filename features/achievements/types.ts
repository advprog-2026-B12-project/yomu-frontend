export interface AchievementProgress {
  achievementId: string;
  name: string;
  description: string;
  iconUrl: string | null;
  points: number;
  milestone: number;
  eventType: string;
  currentProgress: number;
  isUnlocked: boolean;
  isDisplayed: boolean;
  unlockedAt: string | null;
}

export interface EventTriggerResponse {
  unlockedAchievements: AchievementProgress[];
  completedDailyMissions: string[];
}

export interface DailyMission {
  id: string;
  name: string;
  description: string;
  milestone: number;
  eventType: string;
  isActive: boolean;
}

export interface UserDailyMission {
  id: string;
  userId: string;
  dailyMission: DailyMission;
  dateAssigned: string;
  currentProgress: number;
  isCompleted: boolean;
  completedAt: string | null;
}
