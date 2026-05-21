"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, CalendarCheck, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchUserAchievementProgress,
  fetchUserAchievements,
  toggleDisplayAchievement,
  fetchActiveDailyMissions,
  fetchUserDailyMissions,
} from "@/features/achievements/api";
import type {
  AchievementProgress,
  UserAchievementResponse,
  DailyMission,
  UserDailyMission,
} from "@/features/achievements/types";

type MergedMission = { mission: DailyMission; progress?: UserDailyMission };

function AchievementSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-4 flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function AchievementsPage() {
  const router = useRouter();
  const { userId, username, role, isLoading } = useAuth();

  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievementResponse[]>([]);
  const [missions, setMissions] = useState<MergedMission[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !username) router.push("/");
  }, [isLoading, username, router]);

  useEffect(() => {
    if (isLoading || !userId) return;

    let mounted = true;
    setIsFetching(true);
    setError("");

    Promise.all([
      fetchUserAchievementProgress(userId),
      fetchUserAchievements(userId),
      fetchActiveDailyMissions(),
      fetchUserDailyMissions(userId),
    ])
      .then(([progressData, userAchData, activeMissions, userMissions]) => {
        if (!mounted) return;
        setAchievements(progressData);
        setUserAchievements(userAchData);

        const todayStr = new Date().toISOString().slice(0, 10);
        const merged = activeMissions.map((mission) => {
          const progress = userMissions.find((um) => {
            if (um.dailyMission.id !== mission.id) return false;
            const assignedStr = Array.isArray(um.dateAssigned)
              ? `${um.dateAssigned[0]}-${String(um.dateAssigned[1]).padStart(2, "0")}-${String(um.dateAssigned[2]).padStart(2, "0")}`
              : String(um.dateAssigned);
            return assignedStr.startsWith(todayStr);
          });
          return { mission, progress };
        });
        setMissions(merged);
      })
      .catch(() => {
        if (mounted) setError("Gagal memuat data. Coba refresh halaman.");
      })
      .finally(() => {
        if (mounted) setIsFetching(false);
      });

    return () => { mounted = false; };
  }, [isLoading, userId]);

  const handleToggleDisplay = async (achievement: AchievementProgress) => {
    const userAch = userAchievements.find((ua) => ua.achievementId === achievement.achievementId);
    if (!userAch) return;
    setToggling(achievement.achievementId);
    try {
      const updated = await toggleDisplayAchievement(userAch.id);
      setUserAchievements((prev) =>
        prev.map((ua) => (ua.id === updated.id ? updated : ua))
      );
      setAchievements((prev) =>
        prev.map((a) =>
          a.achievementId === achievement.achievementId
            ? { ...a, isDisplayed: updated.isDisplayed }
            : a
        )
      );
    } catch {
      // silent
    } finally {
      setToggling(null);
    }
  };

  if (isLoading || !username) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pantau progres pencapaian dan misi harianmu.
            </p>
          </div>
        </div>

        <Separator />

        {isFetching && <AchievementSkeleton />}

        {!isFetching && error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {!isFetching && !error && (
          <div className="flex flex-col gap-8">
            {/* Daily Missions */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="size-5 text-blue-500" />
                <h2 className="text-base font-semibold">Misi Harian</h2>
              </div>

              {missions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Tidak ada misi harian aktif hari ini.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {missions.map(({ mission, progress }) => {
                    const current = progress?.currentProgress ?? 0;
                    const pct = Math.min(100, Math.round((current / Math.max(1, mission.milestone)) * 100));
                    const completed = progress?.isCompleted ?? false;

                    return (
                      <Card key={mission.id} className={completed ? "border-blue-200 bg-blue-50/30" : ""}>
                        <CardContent className="pt-4 pb-4 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{mission.name}</p>
                            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${completed ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                              {completed ? "Selesai" : "Aktif"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{mission.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{current}/{mission.milestone}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Achievements */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-amber-500" />
                <h2 className="text-base font-semibold">Semua Achievement</h2>
              </div>

              {achievements.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Belum ada achievement tersedia.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {achievements.map((ach) => {
                    const pct = Math.min(100, Math.round((ach.currentProgress / Math.max(1, ach.milestone)) * 100));

                    return (
                      <Card key={ach.achievementId} className={ach.isUnlocked ? "border-amber-200 bg-amber-50/30" : ""}>
                        <CardContent className="pt-4 pb-4 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {ach.isUnlocked
                                ? <Unlock className="size-4 text-amber-500 shrink-0" />
                                : <Lock className="size-4 text-muted-foreground shrink-0" />
                              }
                              <p className="text-sm font-semibold">{ach.name}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${ach.isUnlocked ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                                {ach.isUnlocked ? "Unlocked" : "Locked"}
                              </span>
                              {ach.isUnlocked && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title={ach.isDisplayed ? "Sembunyikan dari profil" : "Tampilkan di profil"}
                                  disabled={toggling === ach.achievementId}
                                  onClick={() => handleToggleDisplay(ach)}
                                >
                                  {ach.isDisplayed
                                    ? <Eye className="size-4 text-blue-500" />
                                    : <EyeOff className="size-4 text-muted-foreground" />
                                  }
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{ach.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${ach.isUnlocked ? "bg-amber-500" : "bg-gray-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{ach.currentProgress}/{ach.milestone}</span>
                          </div>
                          {ach.points > 0 && (
                            <p className="text-xs text-muted-foreground">{ach.points} poin</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Admin-only dev tools */}
            {role === "ADMIN" && (
              <section className="flex flex-col gap-3 rounded-lg border border-dashed border-orange-300 p-4 bg-orange-50/50">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Admin Tools</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!userId) return;
                      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
                      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
                      await fetch(`${API}/api/achievements`, { method: "POST", headers, body: JSON.stringify({ name: "Kutu Buku Pemula", description: "Membaca 2 modul.", points: 100, milestone: 2, eventType: "READING_COMPLETED" }) });
                      await fetch(`${API}/api/daily-missions`, { method: "POST", headers, body: JSON.stringify({ name: "Misi Harian: Membaca", description: "Baca 1 modul hari ini.", milestone: 1, eventType: "READING_COMPLETED", isActive: true }) });
                      alert("Dummy data berhasil dibuat!");
                    }}
                  >
                    Setup Dummy Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!userId) return;
                      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
                      await fetch(`${API}/api/achievements/trigger`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ userId, eventType: "READING_COMPLETED" }) });
                      alert("Trigger dikirim!");
                    }}
                  >
                    Test Trigger (Reading)
                  </Button>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
