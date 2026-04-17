"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchUserAchievementProgress } from "@/features/achievements/api"
import type { AchievementProgress } from "@/features/achievements/types"

export default function AchievementsPage() {
  const router = useRouter()
  const { userId, username, isLoading } = useAuth()
  const [achievements, setAchievements] = useState<AchievementProgress[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && !username) {
      router.push("/")
      return
    }
  }, [isLoading, username, router])

  useEffect(() => {
    if (isLoading) return

    if (!userId) {
      setIsFetching(false)
      setError("Sesi pengguna tidak valid. Silakan login ulang.")
      return
    }

    let mounted = true
    setIsFetching(true)
    setError("")

    fetchUserAchievementProgress(userId)
      .then((data) => {
        if (mounted) setAchievements(data)
      })
      .catch(() => {
        if (mounted) {
          setError("Gagal memuat achievements. Coba refresh halaman.")
        }
      })
      .finally(() => {
        if (mounted) setIsFetching(false)
      })

    return () => {
      mounted = false
    }
  }, [isLoading, userId])

  if (isLoading || !username) return null

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>My Achievements</CardTitle>
          <CardDescription>Lihat progres pencapaian kamu berdasarkan data dari server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isFetching && <p className="text-sm text-gray-500">Memuat achievements...</p>}

          {!isFetching && error && <p className="text-sm text-red-500">{error}</p>}

          {!isFetching && !error && achievements.length === 0 && (
            <p className="text-sm text-gray-500">Belum ada achievement yang tersedia.</p>
          )}

          {!isFetching && !error && achievements.length > 0 && (
            <div className="space-y-3">
              {achievements.map((achievement) => {
                const progress = `${achievement.currentProgress}/${achievement.milestone}`

                return (
                  <div
                    key={achievement.achievementId}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <h2 className="font-medium">{achievement.name}</h2>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          achievement.isUnlocked
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {achievement.isUnlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="mt-2 text-sm text-gray-700">
                      Progress: <span className="font-medium">{progress}</span>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
