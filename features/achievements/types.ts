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
