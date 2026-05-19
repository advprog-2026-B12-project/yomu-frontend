import { useEffect, useState } from "react";
import { AchievementProgress } from "@/features/achievements/types";

interface AchievementPopupProps {
  achievement: AchievementProgress | null;
  dailyMission: string | null;
  onClose: () => void;
}

export function AchievementPopup({
  achievement,
  dailyMission,
  onClose,
}: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement || dailyMission) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for slide-out animation to finish
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, dailyMission, onClose]);

  if (!achievement && !dailyMission) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-l-4 ${
        achievement ? "border-yellow-500" : "border-green-500"
      } transition-all duration-300 ease-in-out transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
      }`}
      style={{ minWidth: "300px" }}
    >
      <div className="mr-4 flex-shrink-0">
        {achievement ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        )}
      </div>
      <div>
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          {achievement ? "Achievement Unlocked!" : "Mission Completed!"}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
          {achievement ? achievement.name : dailyMission}
        </p>
      </div>
    </div>
  );
}
