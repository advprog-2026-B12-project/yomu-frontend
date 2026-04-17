import { AchievementProgress } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

export async function fetchUserAchievementProgress(
  userId: string
): Promise<AchievementProgress[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/achievements/user/${userId}/progress`,
    {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch achievements: ${response.status}`)
  }

  return response.json()
}
