"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchUserAchievementProgress,
  fetchActiveDailyMissions,
  fetchUserDailyMissions,
} from "@/features/achievements/api";
import type {
  AchievementProgress,
  DailyMission,
  UserDailyMission,
} from "@/features/achievements/types";
import { useAchievement } from "@/app/providers/AchievementProvider";

export default function AchievementsPage() {
  const router = useRouter();
  const { userId, username, isLoading, logout } = useAuth();
  const { triggerAndNotify } = useAchievement();
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [missions, setMissions] = useState<
    { mission: DailyMission; progress?: UserDailyMission }[]
  >([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const handleTestTrigger = async () => {
    if (!userId) return;
    await triggerAndNotify(userId, "READING_COMPLETED");
    // Refresh list after trigger
    setRetryCount((prev) => prev + 1);
  };

  const handleSetupDummy = async () => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Create Dummy Achievement
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/achievements`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "Kutu Buku Pemula",
          description: "Membaca 2 modul.",
          points: 100,
          milestone: 2,
          eventType: "READING_COMPLETED",
        }),
      },
    );

    // Create Dummy Daily Mission
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/daily-missions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "Misi Harian: Membaca",
          description: "Baca 1 modul hari ini.",
          milestone: 1,
          eventType: "READING_COMPLETED",
          isActive: true,
        }),
      },
    );

    alert("Dummy Data (Reading) berhasil dibuat!");
    setRetryCount((prev) => prev + 1);
  };

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/");
      return;
    }
  }, [isLoading, username, router]);

  useEffect(() => {
    if (isLoading) return;

    if (!userId) {
      setIsFetching(false);
      setError("Sesi pengguna tidak valid. Silakan login ulang.");
      return;
    }

    let mounted = true;
    setIsFetching(true);
    setError("");

    Promise.all([
      fetchUserAchievementProgress(userId),
      fetchActiveDailyMissions(),
      fetchUserDailyMissions(userId),
    ])
      .then(([achievementsData, activeMissionsData, userMissionsData]) => {
        if (mounted) {
          setAchievements(achievementsData);

          // Merge missions and progress
          const todayObj = new Date();
          const todayStr =
            todayObj.getFullYear() +
            "-" +
            String(todayObj.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(todayObj.getDate()).padStart(2, "0");

          const merged = activeMissionsData.map((mission) => {
            const progress = userMissionsData.find((um) => {
              if (um.dailyMission.id !== mission.id) return false;

              let assignedStr = "";
              if (Array.isArray(um.dateAssigned)) {
                assignedStr =
                  um.dateAssigned[0] +
                  "-" +
                  String(um.dateAssigned[1]).padStart(2, "0") +
                  "-" +
                  String(um.dateAssigned[2]).padStart(2, "0");
              } else {
                assignedStr = String(um.dateAssigned);
              }

              return assignedStr.startsWith(todayStr);
            });
            return { mission, progress };
          });
          setMissions(merged);
        }
      })
      .catch((err: Error & { status?: number }) => {
        if (mounted) {
          if (err.status === 401) {
            logout();
            return;
          }

          setError("Gagal memuat data. Coba refresh halaman.");
        }
      })
      .finally(() => {
        if (mounted) setIsFetching(false);
      });

    return () => {
      mounted = false;
    };
  }, [isLoading, userId, logout, retryCount]);

  if (isLoading || !username) return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>My Achievements</CardTitle>
              <CardDescription>
                Lihat progres pencapaian kamu berdasarkan data dari server.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSetupDummy}
                disabled={isFetching || !userId}
                variant="outline"
                size="sm"
              >
                Setup Dummy Data
              </Button>
              <Button
                onClick={handleTestTrigger}
                disabled={isFetching || !userId}
                variant="secondary"
                size="sm"
              >
                Test Trigger (Reading)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isFetching && (
            <p className="text-sm text-gray-500">Memuat achievements...</p>
          )}

          {!isFetching && error && (
            <div className="space-y-2">
              <p className="text-sm text-red-500">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRetryCount((prev) => prev + 1)}
              >
                Coba lagi
              </Button>
            </div>
          )}

          {!isFetching &&
            !error &&
            achievements.length === 0 &&
            missions.length === 0 && (
              <p className="text-sm text-gray-500">
                Belum ada data yang tersedia.
              </p>
            )}

          {!isFetching && !error && (
            <div className="space-y-8">
              {/* Daily Missions Section */}
              {missions.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 border-b pb-2">
                    Daily Missions
                  </h3>
                  <div className="space-y-3">
                    {missions.map(({ mission, progress }) => {
                      const currentProg = progress?.currentProgress || 0;
                      const isCompleted = progress?.isCompleted || false;
                      const safeMilestone =
                        mission.milestone > 0 ? mission.milestone : 1;
                      const progressText = `${currentProg}/${mission.milestone}`;
                      const progressPercent = Math.min(
                        100,
                        Math.max(0, (currentProg / safeMilestone) * 100),
                      );

                      return (
                        <div
                          key={mission.id}
                          className="rounded-lg border border-gray-200 p-3 bg-blue-50/30"
                        >
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <h2 className="font-medium text-blue-900">
                              {mission.name}
                            </h2>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                isCompleted
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {isCompleted ? "Completed" : "Active"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {mission.description}
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            Progress:{" "}
                            <span className="font-medium">{progressText}</span>
                          </p>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Achievements Section */}
              {achievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 border-b pb-2">
                    All Achievements
                  </h3>
                  <div className="space-y-3">
                    {achievements.map((achievement) => {
                      const progressText = `${achievement.currentProgress}/${achievement.milestone}`;
                      const safeMilestone =
                        achievement.milestone > 0 ? achievement.milestone : 1;
                      const progressPercent = Math.min(
                        100,
                        Math.max(
                          0,
                          (achievement.currentProgress / safeMilestone) * 100,
                        ),
                      );

                      return (
                        <div
                          key={achievement.achievementId}
                          className={`rounded-lg border border-gray-200 p-3 ${achievement.isUnlocked ? "bg-amber-50/30" : ""}`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <h2 className="font-medium">{achievement.name}</h2>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                achievement.isUnlocked
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {achievement.isUnlocked ? "Unlocked" : "Locked"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {achievement.description}
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            Progress:{" "}
                            <span className="font-medium">{progressText}</span>
                          </p>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full transition-all ${achievement.isUnlocked ? "bg-amber-500" : "bg-gray-400"}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
