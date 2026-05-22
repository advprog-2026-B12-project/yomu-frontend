export interface Clan {
  id: number
  name: string
  description?: string
  leaderUserId: string
  division: string
  memberCount: number
  createdAt: string
}

export interface ClanMember {
  userId: string
  role: "LEADER" | "MEMBER"
  joinedAt: string
}

export interface ClanJoinRequest {
  id: number
  clanId: number
  clanName: string
  userId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  requestedAt: string
  resolvedAt?: string
}

export interface LeaderboardEntry {
  rank: number
  clanId: number
  clanName: string
  division: string
  memberCount: number
  score: number
  scoreMultiplier: number
  activeModifiers: string[]
}
