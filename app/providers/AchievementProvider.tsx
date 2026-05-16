"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AchievementProgress } from "@/features/achievements/types";
import { triggerAchievementEvent } from "@/features/achievements/api";
import { AchievementPopup } from "@/components/ui/AchievementPopup";

interface QueueItem {
  achievement: AchievementProgress | null;
  dailyMission: string | null;
}

interface AchievementContextType {
  triggerAndNotify: (userId: string, eventType: string) => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(
  undefined,
);

export function AchievementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isShowing, setIsShowing] = useState(false);

  const triggerAndNotify = useCallback(
    async (userId: string, eventType: string) => {
      try {
        const response = await triggerAchievementEvent(userId, eventType);

        const newItems: QueueItem[] = [];

        if (
          response.unlockedAchievements &&
          response.unlockedAchievements.length > 0
        ) {
          response.unlockedAchievements.forEach((ach) => {
            newItems.push({ achievement: ach, dailyMission: null });
          });
        }

        if (
          response.completedDailyMissions &&
          response.completedDailyMissions.length > 0
        ) {
          response.completedDailyMissions.forEach((mission) => {
            newItems.push({ achievement: null, dailyMission: mission });
          });
        }

        if (newItems.length > 0) {
          setQueue((prev) => [...prev, ...newItems]);
        }
      } catch (error) {
        console.error("Failed to trigger achievement event:", error);
      }
    },
    [],
  );

  const handleClosePopup = useCallback(() => {
    setQueue((prev) => prev.slice(1)); // Remove first item
    setIsShowing(false);
  }, []);

  // Manage queue display
  React.useEffect(() => {
    if (queue.length > 0 && !isShowing) {
      setIsShowing(true);
    }
  }, [queue, isShowing]);

  const currentItem = isShowing && queue.length > 0 ? queue[0] : null;

  return (
    <AchievementContext.Provider value={{ triggerAndNotify }}>
      {children}
      {currentItem && (
        <AchievementPopup
          achievement={currentItem.achievement}
          dailyMission={currentItem.dailyMission}
          onClose={handleClosePopup}
        />
      )}
    </AchievementContext.Provider>
  );
}

export function useAchievement() {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error(
      "useAchievement must be used within an AchievementProvider",
    );
  }
  return context;
}
