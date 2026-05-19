import {
  AchievementProgress,
  AchievementRequest,
  AchievementResponse,
  DailyMissionRequest,
  DailyMissionResponse,
  EventTriggerResponse,
  UserAchievementResponse,
  UserDailyMission,
} from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

type ApiError = Error & { status?: number }

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function req<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    cache: "no-store",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const error: ApiError = new Error(`Failed: ${res.status}`)
    error.status = res.status
    throw error
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── User: Achievement Progress ──────────────────────────────────────────────

export const fetchUserAchievementProgress = (userId: string): Promise<AchievementProgress[]> =>
  req(`/api/achievements/user/${userId}/progress`)

export const fetchUserAchievements = (userId: string): Promise<UserAchievementResponse[]> =>
  req(`/api/achievements/user/${userId}`)

export const toggleDisplayAchievement = (userAchievementId: string): Promise<UserAchievementResponse> =>
  req(`/api/achievements/display/${userAchievementId}`, "PUT")

// ── User: Daily Missions ────────────────────────────────────────────────────

export const fetchActiveDailyMissions = (): Promise<import("./types").DailyMission[]> =>
  req("/api/daily-missions/active")

export const fetchUserDailyMissions = (userId: string): Promise<UserDailyMission[]> =>
  req(`/api/daily-missions/user/${userId}`)

// ── Admin: Trigger Event ────────────────────────────────────────────────────

export const triggerAchievementEvent = (userId: string, eventType: string): Promise<EventTriggerResponse> =>
  req("/api/achievements/trigger", "POST", { userId, eventType })

// ── Admin: Achievements ─────────────────────────────────────────────────────

export const fetchAllAchievements = (): Promise<AchievementResponse[]> =>
  req("/api/achievements")

export const createAchievement = (body: AchievementRequest): Promise<AchievementResponse> =>
  req("/api/achievements", "POST", body)

// ── Admin: Daily Missions ───────────────────────────────────────────────────

export const createDailyMission = (body: DailyMissionRequest): Promise<DailyMissionResponse> =>
  req("/api/daily-missions", "POST", body)

export const updateDailyMission = (id: string, body: DailyMissionRequest): Promise<DailyMissionResponse> =>
  req(`/api/daily-missions/${id}`, "PUT", body)

export const deleteDailyMission = (id: string): Promise<void> =>
  req(`/api/daily-missions/${id}`, "DELETE")
