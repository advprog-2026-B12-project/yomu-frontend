import { Clan, ClanMember, ClanJoinRequest, LeaderboardEntry } from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

type ApiError = Error & { status?: number }

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function req<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    cache: "no-store",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    const err = new Error(text || `Request failed: ${res.status}`) as ApiError
    err.status = res.status
    throw err
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const getClans = (): Promise<Clan[]> =>
  req("/api/clans")

export const getClan = (id: number): Promise<Clan> =>
  req(`/api/clans/${id}`)

export const getClanMembers = (clanId: number): Promise<ClanMember[]> =>
  req(`/api/clans/${clanId}/members`)

export const createClan = (body: { name: string; description?: string }): Promise<Clan> =>
  req("/api/clans", "POST", body)

export const requestToJoinClan = (clanId: number): Promise<ClanJoinRequest> =>
  req(`/api/clans/${clanId}/join`, "POST")

export const getPendingJoinRequests = (clanId: number): Promise<ClanJoinRequest[]> =>
  req(`/api/clans/${clanId}/join-requests`)

export const approveJoinRequest = (requestId: number): Promise<ClanMember> =>
  req(`/api/clans/join-requests/${requestId}/approve`, "POST")

export const rejectJoinRequest = (requestId: number): Promise<void> =>
  req(`/api/clans/join-requests/${requestId}/reject`, "POST")

export const leaveClan = (): Promise<void> =>
  req("/api/clans/leave", "DELETE")

export const deleteClan = (clanId: number): Promise<void> =>
  req(`/api/clans/${clanId}`, "DELETE")

export const getLeaderboardByDivision = (division: string): Promise<LeaderboardEntry[]> =>
  req(`/api/league/leaderboard?division=${encodeURIComponent(division)}`)

export const getMyLeaderboard = (): Promise<LeaderboardEntry[]> =>
  req("/api/league/leaderboard/me")
