import { AchievementProgress } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

type ApiError = Error & { status?: number }

export async function fetchUserAchievementProgress(
  userId: string
): Promise<AchievementProgress[]> {
  const token = localStorage.getItem("token")
  const response = await fetch(
    `${API_BASE_URL}/api/achievements/user/${userId}/progress`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const error: ApiError = new Error(`Failed to fetch achievements: ${response.status}`)
    error.status = response.status
    throw error
  }

  return response.json()
}
