"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Trophy } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchPublicAchievements } from "@/features/achievements/api"
import type { UserAchievementResponse } from "@/features/achievements/types"

interface UserProfile {
  userId: string
  username: string
  displayName: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  return res.json()
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PublicProfilePage() {
  const params = useParams()
  const userId = params.userId as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [achievements, setAchievements] = useState<UserAchievementResponse[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!userId) return

    let mounted = true
    setIsFetching(true)
    setError("")

    Promise.all([fetchUserProfile(userId), fetchPublicAchievements(userId)])
      .then(([profileData, achievementData]) => {
        if (!mounted) return
        setProfile(profileData)
        setAchievements(achievementData.filter((a) => a.isUnlocked))
      })
      .catch(() => {
        if (mounted) setError("Pengguna tidak ditemukan atau terjadi kesalahan.")
      })
      .finally(() => {
        if (mounted) setIsFetching(false)
      })

    return () => { mounted = false }
  }, [userId])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {isFetching ? (
          <ProfileSkeleton />
        ) : error ? (
          <p className="text-center text-red-500 mt-16">{error}</p>
        ) : profile ? (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{profile.displayName}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Achievement yang Ditampilkan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Pengguna ini belum menampilkan achievement apapun.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {achievements.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />
                          <span className="text-sm font-medium">{a.achievementName}</span>
                        </div>
                        {a.unlockedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.unlockedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  )
}
